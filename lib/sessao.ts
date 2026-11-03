import { NextResponse } from "next/server"; //import para trazer o objeto de resposta HTTP do Next.js 
import { cookies } from "next/headers"; //import para trazer a função que lê cookies da requisição no servidor.
import { lerToken, type Sessao } from "@/lib/auth"; //import de lerToken pois verifica o JWT e devolve os dados do usuário e o type no import deixa claro que isso não existe em tempo de execução; serve só para tipar o retorno de pegarSessao()

export async function pegarSessao(): Promise<Sessao | null> {
  const token = (await cookies()).get("token")?.value;
  return token ? await lerToken(token) : null;
}

// Devolve uma resposta de erro se o usuário não puder continuar, ou null se pode
export async function exigirAdmin(): Promise<NextResponse | null> {
  const sessao = await pegarSessao();
  if (!sessao) {
    return NextResponse.json({ erro: "Faça login para continuar." }, { status: 401 });
  }
  if (sessao.tipo !== "admin") {
    return NextResponse.json({ erro: "Você não tem permissão para esta ação." }, { status: 403 });
  }
  return null;
}