import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { ResultSetHeader } from "mysql2";
import { exigirAdmin } from "@/lib/sessao";
import { esquemaProduto } from "@/lib/produto-schema";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const busca = searchParams.get("busca");
    const categoria = searchParams.get("categoria");
    const precoMax = searchParams.get("preco_max");
    const estoqueBaixo = searchParams.get("estoque_baixo");

    let sql = `
      SELECT p.id, p.nome, p.descricao, p.preco, p.embalagem, p.estoque,
             p.imagem, p.categoria_id, c.nome AS categoria
      FROM produtos p
      JOIN categorias c ON c.id = p.categoria_id
      WHERE 1 = 1`;
    const valores: (string | number)[] = [];

    if (busca) {
      sql += " AND p.nome LIKE ?";
      valores.push(`%${busca}%`);
    }
    if (categoria) {
      sql += " AND p.categoria_id = ?";
      valores.push(Number(categoria));
    }
    if (precoMax) {
      sql += " AND p.preco <= ?";
      valores.push(Number(precoMax));
    }
    if (estoqueBaixo === "true") {
      sql += " AND p.estoque <= 10";
    }

    sql += " ORDER BY p.nome";

    const [linhas] = await pool.query(sql, valores);
    return NextResponse.json(linhas, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json(
      { erro: "Não foi possível buscar os produtos." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const negado = await exigirAdmin();
  if (negado) return negado;

  try {
    const corpo = await request.json();
    const resultado = esquemaProduto.safeParse(corpo);
    if (!resultado.success) {
      return NextResponse.json(
        { erro: resultado.error.issues[0].message },
        { status: 400 }
      );
    }

    const p = resultado.data;
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO produtos (nome, descricao, preco, embalagem, estoque, imagem, categoria_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [p.nome, p.descricao, p.preco, p.embalagem, p.estoque, p.imagem, p.categoria_id]
    );

    return NextResponse.json({ id: res.insertId, ...p }, { status: 201 });
  } catch (erro) {
    if ((erro as { code?: string }).code === "ER_NO_REFERENCED_ROW_2") {
      return NextResponse.json({ erro: "Essa categoria não existe." }, { status: 400 });
    }
    console.error(erro);
    return NextResponse.json(
      { erro: "Não foi possível cadastrar o produto." },
      { status: 500 }
    );
  }
}