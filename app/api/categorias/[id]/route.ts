import { NextResponse } from "next/server";
import { z } from "zod";
import type { ResultSetHeader } from "mysql2";
import { pool } from "@/lib/db";
import { exigirAdmin } from "@/lib/sessao";

type Contexto = { params: Promise<{ id: string }> };

const esquema = z.object({
  nome: z.string().trim().min(2, "O nome precisa ter pelo menos 2 letras."),
});

async function lerId(contexto: Contexto) {
  const { id } = await contexto.params;
  const numero = Number(id);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

export async function PUT(request: Request, contexto: Contexto) {
  const negado = await exigirAdmin();
  if (negado) return negado;

  const id = await lerId(contexto);
  if (!id) return NextResponse.json({ erro: "Código de categoria inválido." }, { status: 400 });

  try {
    const resultado = esquema.safeParse(await request.json());
    if (!resultado.success) {
      return NextResponse.json({ erro: resultado.error.issues[0].message }, { status: 400 });
    }

    const [res] = await pool.query<ResultSetHeader>(
      "UPDATE categorias SET nome = ? WHERE id = ?",
      [resultado.data.nome, id]
    );
    if (res.affectedRows === 0) {
      return NextResponse.json({ erro: "Categoria não encontrada." }, { status: 404 });
    }
    return NextResponse.json({ id, nome: resultado.data.nome }, { status: 200 });
  } catch (erro) {
    if ((erro as { code?: string }).code === "ER_DUP_ENTRY") {
      return NextResponse.json({ erro: "Já existe uma categoria com esse nome." }, { status: 409 });
    }
    console.error(erro);
    return NextResponse.json({ erro: "Não foi possível atualizar a categoria." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, contexto: Contexto) {
  const negado = await exigirAdmin();
  if (negado) return negado;

  const id = await lerId(contexto);
  if (!id) return NextResponse.json({ erro: "Código de categoria inválido." }, { status: 400 });

  try {
    const [res] = await pool.query<ResultSetHeader>("DELETE FROM categorias WHERE id = ?", [id]);
    if (res.affectedRows === 0) {
      return NextResponse.json({ erro: "Categoria não encontrada." }, { status: 404 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (erro) {
    if ((erro as { code?: string }).code === "ER_ROW_IS_REFERENCED_2") {
      return NextResponse.json(
        { erro: "Essa categoria ainda tem produtos e não pode ser excluída." },
        { status: 409 }
      );
    }
    console.error(erro);
    return NextResponse.json({ erro: "Não foi possível excluir a categoria." }, { status: 500 });
  }
}