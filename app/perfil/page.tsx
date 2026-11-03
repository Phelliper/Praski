"use client";

import { useEffect, useState } from "react"; // Usamos esse import pq ele guarda nome, e-mail, senhas, mensagens, loading e envio. useEffect chama /api/perfil ao abrir e preenche o formulário
import { useRouter } from "next/navigation"; // Esse import é usado se a API responder 401, router.push("/login") manda a pessoa para o login

export default function PaginaPerfil() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // Carrega os dados de quem está logado
  useEffect(() => {
    fetch("/api/perfil")
      .then((r) => {
        if (r.status === 401) {
          router.push("/login");
          throw new Error("sem login");
        }
        if (!r.ok) throw new Error("falha");
        return r.json();
      })
      .then((dados) => {
        setNome(dados.nome);
        setEmail(dados.email);
      })
      .catch((e) => {
        if (e.message !== "sem login") setErro("Não foi possível carregar o perfil.");
      })
      .finally(() => setCarregando(false));
  }, [router]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (novaSenha && novaSenha !== confirmar) {
      setErro("A nova senha e a confirmação não são iguais.");
      return;
    }

    const corpo: Record<string, string> = { nome, email };
    if (novaSenha) {
      corpo.senha_atual = senhaAtual;
      corpo.nova_senha = novaSenha;
    }

    setEnviando(true);
    try {
      const resp = await fetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const dados = await resp.json();

      if (resp.status === 401 && !novaSenha) {
        router.push("/login");
        return;
      }
      if (!resp.ok) {
        setErro(dados.erro || "Erro ao salvar.");
        return;
      }

      setSucesso("Dados atualizados com sucesso.");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmar("");
      router.refresh();
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setEnviando(false);
    }
  }

  const campo = "w-full rounded border p-2 text-gray-800";

  if (carregando) {
    return <p className="text-gray-700">Carregando...</p>;
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-lg bg-white p-6 shadow">
      <h1 className="text-2xl font-bold text-green-900">Meu perfil</h1>

      <form onSubmit={salvar} className="space-y-3">
        <label className="block text-sm text-gray-700">
          Nome
          <input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} required />
        </label>

        <label className="block text-sm text-gray-700">
          E-mail
          <input className={campo} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>

        <p className="pt-2 text-sm font-semibold text-gray-800">
          Trocar senha (deixe em branco para manter a atual)
        </p>

        <input className={campo} type="password" placeholder="Senha atual" value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)} />
        <input className={campo} type="password" placeholder="Nova senha (mínimo 6 caracteres)" value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)} />
        <input className={campo} type="password" placeholder="Confirmar nova senha" value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)} />

        {erro && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{erro}</p>}
        {sucesso && <p className="rounded bg-green-100 p-2 text-sm text-green-800">{sucesso}</p>}

        <button type="submit" disabled={enviando}
          className="w-full rounded bg-green-700 py-2 text-white hover:bg-green-800 disabled:opacity-50">
          {enviando ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}