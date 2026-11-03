import { NextResponse } from "next/server";

export async function POST() {
  const resposta = NextResponse.json({ ok: true }, { status: 200 });
  resposta.cookies.set("token", "", { path: "/", maxAge: 0 });
  return resposta;
}
