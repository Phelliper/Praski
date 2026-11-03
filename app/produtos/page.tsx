"use client";

import { useEffect, useState } from "react"; //Teacher a página é cliente ou sejaa o  estado guarda lista, filtros, loading e erro. Os efeitos buscam categorias e produtos
import Image from "next/image"; // Esse import é mais simples mostra a foto de cada produto de forma otimizada
import { useCarrinho } from "@/components/CarrinhoProvider"; // Esse import pega a função adicionar para o botão “colocar no carrinho” usar o mesmo carrinho do resto do site

type Categoria = { id: number; nome: string };

type Produto = {
  id: number;
  nome: string;
  descricao: string;
  preco: string;
  embalagem: string;
  estoque: number;
  imagem: string;
  categoria: string;
};

export default function PaginaProdutos() {
  const { adicionar } = useCarrinho();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [precoMax, setPrecoMax] = useState("");
  const [estoqueBaixo, setEstoqueBaixo] = useState(false);

  // Busca as categorias uma vez, ao abrir a página
  useEffect(() => {
    fetch("/api/categorias")
      .then((r) => (r.ok ? r.json() : []))
      .then((dados) => setCategorias(Array.isArray(dados) ? dados : []))
      .catch(() => {});
  }, []);

  // Busca os produtos de novo sempre que um filtro mudar
  useEffect(() => {
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    if (categoria) params.set("categoria", categoria);
    if (precoMax) params.set("preco_max", precoMax);
    if (estoqueBaixo) params.set("estoque_baixo", "true");

    setCarregando(true);
    setErro("");

    fetch(`/api/produtos?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error("falha");
        return r.json();
      })
      .then((dados) => setProdutos(Array.isArray(dados) ? dados : []))
      .catch(() => setErro("Não foi possível carregar os produtos."))
      .finally(() => setCarregando(false));
  }, [busca, categoria, precoMax, estoqueBaixo]);

  function limpar() {
    setBusca("");
    setCategoria("");
    setPrecoMax("");
    setEstoqueBaixo(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-green-900">Produtos</h1>

      <section className="grid gap-4 rounded-lg bg-white p-4 shadow md:grid-cols-4">
        <input
          type="text"
          placeholder="Buscar pelo nome"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="rounded border p-2 text-gray-800"
        />

        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="rounded border p-2 text-gray-800"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Preço máximo (R$)"
          value={precoMax}
          onChange={(e) => setPrecoMax(e.target.value)}
          className="rounded border p-2 text-gray-800"
        />

        <label className="flex items-center gap-2 text-gray-800">
          <input
            type="checkbox"
            checked={estoqueBaixo}
            onChange={(e) => setEstoqueBaixo(e.target.checked)}
          />
          Só estoque baixo
        </label>
      </section>

      <div className="flex items-center justify-between">
        <p className="text-gray-700">
          {carregando ? "Carregando..." : `${produtos.length} produto(s) encontrado(s)`}
        </p>
        <button onClick={limpar} className="text-green-700 underline">
          Limpar filtros
        </button>
      </div>

      {erro ? (
        <p className="rounded-lg bg-red-100 p-6 text-center text-red-800 shadow">
          {erro}
        </p>
      ) : !carregando && produtos.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center text-gray-800 shadow">
          Nenhum produto encontrado com esses filtros.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {produtos.map((p) => (
            <div key={p.id} className="flex flex-col rounded-lg bg-white p-4 shadow">
              <div className="mb-3 overflow-hidden rounded bg-green-100">
                <Image
                  src={`/img/${p.imagem}`}
                  alt={p.nome}
                  width={300}
                  height={200}
                  className="h-40 w-full object-cover"
                />
              </div>
              <p className="text-xs text-green-700">{p.categoria}</p>
              <p className="font-semibold text-gray-900">{p.nome}</p>
              <p className="mt-1 flex-1 text-sm text-gray-600">{p.descricao}</p>
              <p className="mt-2 text-sm text-gray-500">
                {p.embalagem} · {p.estoque} em estoque
              </p>
              <p className="text-lg font-bold text-green-700">
                R$ {Number(p.preco).toFixed(2).replace(".", ",")}
              </p>
              <button
                onClick={() =>
                  adicionar({
                    id: p.id,
                    nome: p.nome,
                    preco: Number(p.preco),
                    imagem: p.imagem,
                    estoque: p.estoque,
                  })
                }
                disabled={p.estoque < 1}
                className="mt-2 rounded bg-green-700 py-2 text-white hover:bg-green-800 disabled:bg-gray-400"
              >
                {p.estoque < 1 ? "Sem estoque" : "Adicionar ao carrinho"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}