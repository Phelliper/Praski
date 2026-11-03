"use client";

import { useState } from "react"; //Por que esse import? Controla o formulário e-mail, senha, mensagem de erro e se está enviando. Não há useEffect porque nada é buscado ao abrir a página; só reage ao submit
import { useRouter } from "next/navigation"; //Por que esse import? Se e o login der certo, router.push("/") vai para a home e router.refresh() atualiza o servidor (o Menu passa a mostrar o usuário logado)
import Link from "next/link"; // Import mais tranquilo, Link para a página de cadastro, sem recarregar o site

export default function PaginaLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);

    try {
      const resp = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const dados = await resp.json();

      if (!resp.ok) {
        setErro(dados.erro || "Erro ao entrar.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setEnviando(false);
    }
  }

  const campo = "w-full rounded border p-2 text-gray-800";

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-lg bg-white p-6 shadow">
      <h1 className="text-2xl font-bold text-green-900">Entrar</h1>

      <form onSubmit={enviar} className="space-y-3">
        <input className={campo} type="email" placeholder="E-mail" value={email}
          onChange={(e) => setEmail(e.target.value)} required />
        <input className={campo} type="password" placeholder="Senha" value={senha}
          onChange={(e) => setSenha(e.target.value)} required />

        {erro && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{erro}</p>}

        <button type="submit" disabled={enviando}
          className="w-full rounded bg-green-700 py-2 text-white hover:bg-green-800 disabled:opacity-50">
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-sm text-gray-700">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-green-700 underline">Cadastre-se</Link>
      </p>
    </div>
  );
}