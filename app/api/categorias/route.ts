import { NextResponse } from "next/server";
import { z } from "zod";
import type { ResultSetHeader } from "mysql2";
import { pool } from "@/lib/db";
import { exigirAdmin } from "@/lib/sessao";

const esquema = z.object({
  nome: z.string().trim().min(2, "O nome precisa ter pelo menos 2 letras."),
});

export async function GET() {
  try {
    const [linhas] = await pool.query("SELECT id, nome FROM categorias ORDER BY nome");
    return NextResponse.json(linhas, { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: "Não foi possível buscar as categorias." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const negado = await exigirAdmin();
  if (negado) return negado;

  try {
    const resultado = esquema.safeParse(await request.json());
    if (!resultado.success) {
      return NextResponse.json({ erro: resultado.error.issues[0].message }, { status: 400 });
    }

    const [res] = await pool.query<ResultSetHeader>(
      "INSERT INTO categorias (nome) VALUES (?)",
      [resultado.data.nome]
    );
    return NextResponse.json({ id: res.insertId, nome: resultado.data.nome }, { status: 201 });
  } catch (erro) {
    if ((erro as { code?: string }).code === "ER_DUP_ENTRY") {
      return NextResponse.json({ erro: "Já existe uma categoria com esse nome." }, { status: 409 });
    }
    console.error(erro);
    return NextResponse.json({ erro: "Não foi possível criar a categoria." }, { status: 500 });
  }
}