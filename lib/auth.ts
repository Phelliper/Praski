import { SignJWT, jwtVerify } from "jose"; // Usamos esse import teacher pq o jose é a biblioteca que cria e verifica JSON Web Token, um texto assinado que guarda dados do usuário (id, nome, tipo) sem precisar consultar o banco a cada clique

export type Sessao = { id: number; nome: string; tipo: string };

const chave = new TextEncoder().encode(process.env.JWT_SECRET);

export async function criarToken(dados: Sessao) {
  return new SignJWT({ ...dados })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(chave);
}

export async function lerToken(token: string): Promise<Sessao | null> {
  try {
    const { payload } = await jwtVerify(token, chave);
    return payload as unknown as Sessao;
  } catch {
    return null;
  }
}