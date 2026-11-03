import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { pegarSessao } from "@/lib/sessao";
import { criarToken } from "@/lib/auth";

const esquema = z.object({
  nome: z.string().trim().min(2, "O nome precisa ter pelo menos 2 letras."),
  email: z.string().email("Informe um e-mail válido."),
  senha_atual: z.string().optional(),
  nova_senha: z.string().min(6, "A nova senha precisa ter pelo menos 6 caracteres.").optional(),
});

export async function GET() {
  const sessao = await pegarSessao();
  if (!sessao) {
    return NextResponse.json({ erro: "Faça login para continuar." }, { status: 401 });
  }

  try {
    const [linhas] = await pool.query<RowDataPacket[]>(
      "SELECT id, nome, email, tipo, criado_em FROM usuarios WHERE id = ?",
      [sessao.id]
    );
    if (linhas.length === 0) {
      return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });
    }
    return NextResponse.json(linhas[0], { status: 200 });
  } catch (erro) {
    console.error(erro);
    return NextResponse.json({ erro: "Não foi possível buscar o perfil." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const sessao = await pegarSessao();
  if (!sessao) {
    return NextResponse.json({ erro: "Faça login para continuar." }, { status: 401 });
  }

  try {
    const resultado = esquema.safeParse(await request.json());
    if (!resultado.success) {
      return NextResponse.json({ erro: resultado.error.issues[0].message }, { status: 400 });
    }
    const { nome, email, senha_atual, nova_senha } = resultado.data;

    if (nova_senha) {
      if (!senha_atual) {
        return NextResponse.json({ erro: "Informe a senha atual para trocar a senha." }, { status: 400 });
      }
      const [linhas] = await pool.query<RowDataPacket[]>(
        "SELECT senha_hash FROM usuarios WHERE id = ?",
        [sessao.id]
      );
      const confere = linhas[0] && (await bcrypt.compare(senha_atual, linhas[0].senha_hash));
      if (!confere) {
        return NextResponse.json({ erro: "A senha atual está incorreta." }, { status: 401 });
      }
      const novoHash = await bcrypt.hash(nova_senha, 10);
      await pool.query(
        "UPDATE usuarios SET nome = ?, email = ?, senha_hash = ? WHERE id = ?",
        [nome, email, novoHash, sessao.id]
      );
    } else {
      await pool.query(
        "UPDATE usuarios SET nome = ?, email = ? WHERE id = ?",
        [nome, email, sessao.id]
      );
    }

    // Gera um crachá novo, porque o nome pode ter mudado
    const token = await criarToken({ id: sessao.id, nome, tipo: sessao.tipo });
    const resposta = NextResponse.json({ id: sessao.id, nome, email }, { status: 200 });
    resposta.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
    });
    return resposta;
  } catch (erro) {
    if ((erro as { code?: string }).code === "ER_DUP_ENTRY") {
      return NextResponse.json({ erro: "Esse e-mail já está em uso." }, { status: 409 });
    }
    console.error(erro);
    return NextResponse.json({ erro: "Não foi possível atualizar o perfil." }, { status: 500 });
  }
}