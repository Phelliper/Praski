import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { exigirAdmin } from "@/lib/sessao";
import { esquemaProduto } from "@/lib/produto-schema";

type Contexto = { params: Promise<{ id: string }> };

async function lerId(contexto: Contexto) {
  const { id } = await contexto.params;
  const numero = Number(id);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

export async function GET(_req: Request, contexto: Contexto) {
  const id = await lerId(contexto);
  if (!id) return NextResponse.json({ erro: "Código de produto inválido." }, { status: 400 });

  try {
    const [linhas] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, c.nome AS categoria
       FROM produtos p JOIN categorias c ON c.id = p.categoria_id
       WHERE p.id = ?`,
      [id]
    );
    if (linhas.length === 0) {
      return NextResponse.json({ erro: "Produto não encontrado." }, { status: 404 });
    }
    return NextResponse.json(linhas[0], { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: "Não foi possível buscar o produto." }, { status: 500 });
  }
}

export async function PUT(request: Request, contexto: Contexto) {
  const negado = await exigirAdmin();
  if (negado) return negado;

  const id = await lerId(contexto);
  if (!id) return NextResponse.json({ erro: "Código de produto inválido." }, { status: 400 });

  try {
    const resultado = esquemaProduto.safeParse(await request.json());
    if (!resultado.success) {
      return NextResponse.json({ erro: resultado.error.issues[0].message }, { status: 400 });
    }

    const p = resultado.data;
    const [res] = await pool.query<ResultSetHeader>(
      `UPDATE produtos
       SET nome = ?, descricao = ?, preco = ?, embalagem = ?, estoque = ?, imagem = ?, categoria_id = ?
       WHERE id = ?`,
      [p.nome, p.descricao, p.preco, p.embalagem, p.estoque, p.imagem, p.categoria_id, id]
    );
    if (res.affectedRows === 0) {
      return NextResponse.json({ erro: "Produto não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ id, ...p }, { status: 200 });
  } catch (erro) {
    if ((erro as { code?: string }).code === "ER_NO_REFERENCED_ROW_2") {
      return NextResponse.json({ erro: "Essa categoria não existe." }, { status: 400 });
    }
    console.error(erro);
    return NextResponse.json({ erro: "Não foi possível atualizar o produto." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, contexto: Contexto) {
  const negado = await exigirAdmin();
  if (negado) return negado;

  const id = await lerId(contexto);
  if (!id) return NextResponse.json({ erro: "Código de produto inválido." }, { status: 400 });

  try {
    const [res] = await pool.query<ResultSetHeader>("DELETE FROM produtos WHERE id = ?", [id]);
    if (res.affectedRows === 0) {
      return NextResponse.json({ erro: "Produto não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (erro) {
    if ((erro as { code?: string }).code === "ER_ROW_IS_REFERENCED_2") {
      return NextResponse.json(
        { erro: "Este produto já foi vendido e não pode ser excluído." },
        { status: 409 }
      );
    }
    console.error(erro);
    return NextResponse.json({ erro: "Não foi possível excluir o produto." }, { status: 500 });
  }
}