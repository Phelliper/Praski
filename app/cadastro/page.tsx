"use client";

import { useState } from "react"; // Porque esse import?? Campos do formulário, erro e se está enviando. Não há useEffect: nada é carregado ao abrir
import { useRouter } from "next/navigation"; // Esse import Teacher usamos por que se o cadastro der certo, router.push("/login") manda a pessoa para entrar
import Link from "next/link"; // esse import teacher é mais tranquilo, seria para links para a página de login, sem recarregar o site

export default function PaginaCadastro() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (senha !== confirmar) {
      setErro("As senhas não são iguais.");
      return;
    }

    setEnviando(true);
    try {
      const resp = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });
      const dados = await resp.json();

      if (!resp.ok) {
        setErro(dados.erro || "Erro ao cadastrar.");
        return;
      }
      router.push("/login");
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setEnviando(false);
    }
  }

  const campo = "w-full rounded border p-2 text-gray-800";

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-lg bg-white p-6 shadow">
      <h1 className="text-2xl font-bold text-green-900">Criar conta</h1>

      <form onSubmit={enviar} className="space-y-3">
        <input className={campo} placeholder="Nome" value={nome}
          onChange={(e) => setNome(e.target.value)} required />
        <input className={campo} type="email" placeholder="E-mail" value={email}
          onChange={(e) => setEmail(e.target.value)} required />
        <input className={campo} type="password" placeholder="Senha (mínimo 6 caracteres)" value={senha}
          onChange={(e) => setSenha(e.target.value)} required />
        <input className={campo} type="password" placeholder="Confirmar senha" value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)} required />

        {erro && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{erro}</p>}

        <button type="submit" disabled={enviando}
          className="w-full rounded bg-green-700 py-2 text-white hover:bg-green-800 disabled:opacity-50">
          {enviando ? "Enviando..." : "Cadastrar"}
        </button>
      </form>

      <p className="text-sm text-gray-700">
        Já tem conta?{" "}
        <Link href="/login" className="text-green-700 underline">Entrar</Link>
      </p>
    </div>
  );
}