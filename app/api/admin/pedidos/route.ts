import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { exigirAdmin } from "@/lib/sessao";

const STATUS_VALIDOS = ["pendente", "pago", "enviado", "cancelado"];

export async function GET(request: Request) {
  const negado = await exigirAdmin();
  if (negado) return negado;

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
    let sql = `
      SELECT p.id, p.status, p.total, p.criado_em, u.nome AS cliente, u.email
      FROM pedidos p
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE 1 = 1`;
    const valores: string[] = [];

    if (status) {
      sql += " AND p.status = ?";
      valores.push(status);
    }
    if (de) {
      sql += " AND p.criado_em >= ?";
      valores.push(`${de} 00:00:00`);
    }
    if (ate) {
      sql += " AND p.criado_em <= ?";
      valores.push(`${ate} 23:59:59`);
    }
    sql += " ORDER BY p.criado_em DESC";

    const [pedidos] = await pool.query<RowDataPacket[]>(sql, valores);

    if (pedidos.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const ids = pedidos.map((p) => p.id);
    const [itens] = await pool.query<RowDataPacket[]>(
      `SELECT i.pedido_id, i.produto_id, pr.nome, i.quantidade, i.preco_unitario
       FROM itens_pedido i JOIN produtos pr ON pr.id = i.produto_id
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