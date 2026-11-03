"use client";

import { useCallback, useEffect, useState } from "react"; // Ola novamente Teacher, aqui esse import serve porque aqui os três hooks trabalham juntos: estado da tela, carregar dados ao abrir, e uma função carregar estável

type Categoria = { id: number; nome: string };

type Produto = {
  id: number;
  nome: string;
  descricao: string;
  preco: string;
  embalagem: string;
  estoque: number;
  imagem: string;
  categoria_id: number;
  categoria: string;
};

const vazio = {
  nome: "",
  descricao: "",
  preco: "",
  embalagem: "",
  estoque: "",
  imagem: "",
  categoria_id: "",
};

export default function AdminProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState(vazio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(() => {
    fetch("/api/produtos")
      .then((r) => r.json())
      .then(setProdutos)
      .catch(() => setErro("Não foi possível carregar os produtos."));
    fetch("/api/categorias")
      .then((r) => r.json())
      .then(setCategorias)
      .catch(() => {});
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function mudar(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function editar(p: Produto) {
    setEditandoId(p.id);
    setForm({
      nome: p.nome,
      descricao: p.descricao ?? "",
      preco: String(p.preco),
      embalagem: p.embalagem ?? "",
      estoque: String(p.estoque),
      imagem: p.imagem ?? "",
      categoria_id: String(p.categoria_id),
    });
    setErro("");
    setAviso("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelar() {
    setEditandoId(null);
    setForm(vazio);
    setErro("");
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setAviso("");
    setEnviando(true);

    try {
      const url = editandoId ? `/api/produtos/${editandoId}` : "/api/produtos";
      const resp = await fetch(url, {
        method: editandoId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const dados = await resp.json();

      if (!resp.ok) {
        setErro(dados.erro || "Erro ao salvar o produto.");
        return;
      }

      setAviso(editandoId ? "Produto atualizado." : "Produto cadastrado.");
      setEditandoId(null);
      setForm(vazio);
      carregar();
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setEnviando(false);
    }
  }

  async function excluir(p: Produto) {
    if (!confirm(`Excluir o produto "${p.nome}"?`)) return;
    setErro("");
    setAviso("");

    const resp = await fetch(`/api/produtos/${p.id}`, { method: "DELETE" });
    const dados = await resp.json();

    if (!resp.ok) {
      setErro(dados.erro || "Erro ao excluir o produto.");
      return;
    }
    setAviso("Produto excluído.");
    carregar();
  }

  const campo = "w-full rounded border p-2 text-gray-800";

  return (
    <div className="space-y-6">
      <form onSubmit={salvar} className="space-y-3 rounded-lg bg-white p-4 shadow">
        <h2 className="text-xl font-semibold text-green-900">
          {editandoId ? `Editando produto nº ${editandoId}` : "Novo produto"}
        </h2>

        <div className="grid gap-3 md:grid-cols-2">
          <input className={campo} placeholder="Nome" value={form.nome}
            onChange={(e) => mudar("nome", e.target.value)} required />
          <select className={campo} value={form.categoria_id}
            onChange={(e) => mudar("categoria_id", e.target.value)} required>
            <option value="">Escolha a categoria</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          <input className={campo} type="number" step="0.01" placeholder="Preço (ex.: 12.50)" value={form.preco}
            onChange={(e) => mudar("preco", e.target.value)} required />
          <input className={campo} placeholder="Embalagem (ex.: 250g)" value={form.embalagem}
            onChange={(e) => mudar("embalagem", e.target.value)} required />
          <input className={campo} type="number" placeholder="Estoque" value={form.estoque}
            onChange={(e) => mudar("estoque", e.target.value)} required />
          <input className={campo} placeholder="Arquivo da imagem (ex.: cosmos.png)" value={form.imagem}
            onChange={(e) => mudar("imagem", e.target.value)} required />
        </div>

        <textarea className={campo} rows={3} placeholder="Descrição" value={form.descricao}
          onChange={(e) => mudar("descricao", e.target.value)} />

        <p className="text-xs text-gray-600">
          A imagem precisa estar na pasta public/img do projeto, com o mesmo nome digitado aqui.
        </p>

        {erro && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{erro}</p>}
        {aviso && <p className="rounded bg-green-100 p-2 text-sm text-green-800">{aviso}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={enviando}
            className="rounded bg-green-700 px-6 py-2 text-white hover:bg-green-800 disabled:opacity-50">
            {enviando ? "Salvando..." : editandoId ? "Salvar alterações" : "Cadastrar"}
          </button>
          {editandoId && (
            <button type="button" onClick={cancelar} className="text-gray-700 underline">
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm text-gray-800">
          <thead className="bg-green-100 text-green-900">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">Categoria</th>
              <th className="p-3">Preço</th>
              <th className="p-3">Estoque</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.nome}</td>
                <td className="p-3">{p.categoria}</td>
                <td className="p-3">R$ {Number(p.preco).toFixed(2).replace(".", ",")}</td>
                <td className="p-3">{p.estoque}</td>
                <td className="space-x-3 p-3">
                  <button onClick={() => editar(p)} className="text-green-700 underline">Editar</button>
                  <button onClick={() => excluir(p)} className="text-red-700 underline">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}