import { NextResponse } from "next/server";
import { z } from "zod";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { pegarSessao } from "@/lib/sessao";

const STATUS_VALIDOS = ["pendente", "pago", "enviado", "cancelado"];

const esquema = z.object({
  itens: z
    .array(
      z.object({
        produto_id: z.coerce.number().int().positive(),
        quantidade: z.coerce.number().int().min(1, "A quantidade mínima é 1."),
      })
    )
    .min(1, "O pedido precisa ter pelo menos um item."),
});

export async function GET(request: Request) {
  const sessao = await pegarSessao();
  if (!sessao) {
    return NextResponse.json({ erro: "Faça login para continuar." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const de = searchParams.get("de");
  const ate = searchParams.get("ate");

  if (status && !STATUS_VALIDOS.includes(status)) {
    return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
  }
  const formatoData = /^\d{4}-\d{2}-\d{2}$/;
  if ((de && !formatoData.test(de)) || (ate && !formatoData.test(ate))) {
    return NextResponse.json({ erro: "Data inválida." }, { status: 400 });
  }

  try {
    let sql = `SELECT id, status, total, criado_em FROM pedidos WHERE usuario_id = ?`;
    const valores: (string | number)[] = [sessao.id];

    if (status) {
      sql += " AND status = ?";
      valores.push(status);
    }
    if (de) {
      sql += " AND criado_em >= ?";
      valores.push(`${de} 00:00:00`);
    }
    if (ate) {
      sql += " AND criado_em <= ?";
      valores.push(`${ate} 23:59:59`);
    }
    sql += " ORDER BY criado_em DESC";

    const [pedidos] = await pool.query<RowDataPacket[]>(sql, valores);

    if (pedidos.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const ids = pedidos.map((p) => p.id);
    const [itens] = await pool.query<RowDataPacket[]>(
      `SELECT i.pedido_id, i.produto_id, p.nome, i.quantidade, i.preco_unitario
       FROM itens_pedido i JOIN produtos p ON p.id = i.produto_id
       WHERE i.pedido_id IN (?)`,
      [ids]
    );

    const resposta = pedidos.map((p) => ({
      ...p,
      itens: itens.filter((i) => i.pedido_id === p.id),
    }));
    return NextResponse.json(resposta, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: "Não foi possível buscar os pedidos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const sessao = await pegarSessao();
  if (!sessao) {
    return NextResponse.json({ erro: "Faça login para continuar." }, { status: 401 });
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  }

  const resultado = esquema.safeParse(corpo);
  if (!resultado.success) {
    return NextResponse.json({ erro: resultado.error.issues[0].message }, { status: 400 });
  }

  // Junta itens repetidos do mesmo produto
  const quantidades = new Map<number, number>();
  for (const item of resultado.data.itens) {
    quantidades.set(item.produto_id, (quantidades.get(item.produto_id) ?? 0) + item.quantidade);
  }

  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();

    let total = 0;
    const linhas: { produtoId: number; qtd: number; preco: number }[] = [];

    for (const [produtoId, qtd] of quantidades) {
      const [rows] = await conexao.query<RowDataPacket[]>(
        "SELECT id, nome, preco, estoque FROM produtos WHERE id = ? FOR UPDATE",
        [produtoId]
      );
      const produto = rows[0];

      if (!produto) {
        await conexao.rollback();
        return NextResponse.json({ erro: `Produto ${produtoId} não encontrado.` }, { status: 404 });
      }
      if (produto.estoque < qtd) {
        await conexao.rollback();
        return NextResponse.json(
          { erro: `Estoque insuficiente para ${produto.nome}.` },
          { status: 409 }
        );
      }

      const preco = Number(produto.preco);
      total += preco * qtd;
      linhas.push({ produtoId, qtd, preco });
    }

    const [pedido] = await conexao.query<ResultSetHeader>(
      "INSERT INTO pedidos (usuario_id, total) VALUES (?, ?)",
      [sessao.id, total.toFixed(2)]
    );

    for (const l of linhas) {
      await conexao.query(
        `INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario)
         VALUES (?, ?, ?, ?)`,
        [pedido.insertId, l.produtoId, l.qtd, l.preco]
      );
      await conexao.query("UPDATE produtos SET estoque = estoque - ? WHERE id = ?", [
        l.qtd,
        l.produtoId,
      ]);
    }

    await conexao.commit();
    return NextResponse.json(
      { id: pedido.insertId, status: "pendente", total: Number(total.toFixed(2)) },
      { status: 201 }
    );
  } catch (erro) {
    await conexao.rollback();
    console.error(erro);
    return NextResponse.json({ erro: "Não foi possível criar o pedido." }, { status: 500 });
  } finally {
    conexao.release();
  }
}