import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";

const esquema = z.object({
  nome: z.string().min(2, "O nome precisa ter pelo menos 2 letras."),
  email: z.string().email("Informe um e-mail válido."),
  senha: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
});

export async function POST(request: Request) {
  try {
    const corpo = await request.json();
    const resultado = esquema.safeParse(corpo);

    if (!resultado.success) {
      return NextResponse.json(
        { erro: resultado.error.issues[0].message },
        { status: 400 }
      );
    }

    const { nome, email, senha } = resultado.data;

    const [existentes] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM usuarios WHERE email = ?",
      [email]
    );
    if (existentes.length > 0) {
      return NextResponse.json(
        { erro: "Já existe um usuário com esse e-mail." },
        { status: 409 }
      );
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const [res] = await pool.query<ResultSetHeader>(
      "INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)",
      [nome, email, senhaHash]
    );

    return NextResponse.json(
      { id: res.insertId, nome, email },
      { status: 201 }
    );
  } catch (erro) {
    console.error(erro);
    return NextResponse.json(
      { erro: "Não foi possível criar o usuário." },
      { status: 500 }
    );
  }
}