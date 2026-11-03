"use client";

import { useCallback, useEffect, useState } from "react"; // Teacher aqui esse import ajuda pois é o mesmo padrão de AdminProdutos: estado da tela, uma função carregar estável e um efeito que a dispara

type Categoria = { id: number; nome: string };

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nome, setNome] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const carregar = useCallback(() => {
    fetch("/api/categorias")
      .then((r) => r.json())
      .then(setCategorias)
      .catch(() => setErro("Não foi possível carregar as categorias."));
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setAviso("");

    const url = editandoId ? `/api/categorias/${editandoId}` : "/api/categorias";
    const resp = await fetch(url, {
      method: editandoId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    const dados = await resp.json();

    if (!resp.ok) {
      setErro(dados.erro || "Erro ao salvar a categoria.");
      return;
    }

    setAviso(editandoId ? "Categoria atualizada." : "Categoria criada.");
    setNome("");
    setEditandoId(null);
    carregar();
  }

  async function excluir(c: Categoria) {
    if (!confirm(`Excluir a categoria "${c.nome}"?`)) return;
    setErro("");
    setAviso("");

    const resp = await fetch(`/api/categorias/${c.id}`, { method: "DELETE" });
    const dados = await resp.json();

    if (!resp.ok) {
      setErro(dados.erro || "Erro ao excluir a categoria.");
      return;
    }
    setAviso("Categoria excluída.");
    carregar();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={salvar} className="space-y-3 rounded-lg bg-white p-4 shadow">
        <h2 className="text-xl font-semibold text-green-900">
          {editandoId ? "Editando categoria" : "Nova categoria"}
        </h2>

        <div className="flex gap-3">
          <input
            className="flex-1 rounded border p-2 text-gray-800"
            placeholder="Nome da categoria"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
          <button type="submit" className="rounded bg-green-700 px-6 py-2 text-white hover:bg-green-800">
            {editandoId ? "Salvar" : "Criar"}
          </button>
          {editandoId && (
            <button
              type="button"
              onClick={() => { setEditandoId(null); setNome(""); }}
              className="text-gray-700 underline"
            >
              Cancelar
            </button>
          )}
        </div>

        {erro && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{erro}</p>}
        {aviso && <p className="rounded bg-green-100 p-2 text-sm text-green-800">{aviso}</p>}
      </form>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm text-gray-800">
          <thead className="bg-green-100 text-green-900">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.nome}</td>
                <td className="space-x-3 p-3">
                  <button
                    onClick={() => { setEditandoId(c.id); setNome(c.nome); setErro(""); setAviso(""); }}
                    className="text-green-700 underline"
                  >
                    Editar
                  </button>
                  <button onClick={() => excluir(c)} className="text-red-700 underline">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}