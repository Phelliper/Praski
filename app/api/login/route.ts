import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { criarToken } from "@/lib/auth";

const esquema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe a senha."),
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

    const { email, senha } = resultado.data;

    const [linhas] = await pool.query<RowDataPacket[]>(
      "SELECT id, nome, senha_hash, tipo FROM usuarios WHERE email = ?",
      [email]
    );
    const usuario = linhas[0];

    const senhaCerta = usuario
      ? await bcrypt.compare(senha, usuario.senha_hash)
      : false;

    if (!usuario || !senhaCerta) {
      return NextResponse.json(
        { erro: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    const token = await criarToken({
      id: usuario.id,
      nome: usuario.nome,
      tipo: usuario.tipo,
    });

    const resposta = NextResponse.json(
      { id: usuario.id, nome: usuario.nome, tipo: usuario.tipo },
      { status: 200 }
    );
    resposta.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
    });
    return resposta;
  } catch (erro) {
    console.error(erro);
    return NextResponse.json(
      { erro: "Não foi possível fazer login." },
      { status: 500 }
    );
  }
}