import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { lerToken } from "@/lib/auth";

export async function GET() {
  const token = (await cookies()).get("token")?.value;
  const sessao = token ? await lerToken(token) : null;

  if (!sessao) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  return NextResponse.json(
    { id: sessao.id, nome: sessao.nome, tipo: sessao.tipo },
    { status: 200 }
  );
}