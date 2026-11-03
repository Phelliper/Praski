"use client";

import { useEffect, useState } from "react"; // Teacher a página cliente ("use client"). useState guarda categorias, produtos em destaque e erro. useEffect ele busca /api/categorias e /api/produtos ao abrir e escolhe os 4 com mais estoque
import Link from "next/link"; // Teacher esse import seria para links internos sem recarregar o site (categorias, “ver produtos”, cards dos destaques).
import Image from "next/image"; // E para fechar, esse import seria para imagens otimizadas dos produtos em destaque

type Categoria = { id: number; nome: string };

type Produto = {
  id: number;
  nome: string;
  preco: string;
  imagem: string;
  estoque: number;
};

export default function Home() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [destaques, setDestaques] = useState<Produto[]>([]);
  const [erro, setErro] = useState("");

    useEffect(() => {
    fetch("/api/categorias")
      .then((r) => {
        if (!r.ok) throw new Error("falha");
        return r.json();
      })
      .then((dados) => setCategorias(Array.isArray(dados) ? dados : []))
      .catch(() => setErro("Não foi possível carregar a loja."));

    fetch("/api/produtos")
      .then((r) => {
        if (!r.ok) throw new Error("falha");
        return r.json();
      })
      .then((lista: Produto[]) => {
        // Destaques: os 4 produtos com mais estoque
        const maisEstoque = [...lista]
          .filter((p) => p.estoque > 0)
          .sort((a, b) => b.estoque - a.estoque)
          .slice(0, 4);
        setDestaques(maisEstoque);
      })
      .catch(() => setErro("Não foi possível carregar a loja."));
  }, []);

  return (
    <div className="space-y-10">
      <section className="rounded-lg bg-green-200 p-10 text-center">
        <h1 className="text-4xl font-bold text-green-900">Bem-vindo ao Praski</h1>
        <p className="mt-2 text-green-800">
          Sementes e fertilizantes para o seu jardim e a sua horta.
        </p>
        <Link
          href="/produtos"
          className="mt-4 inline-block rounded bg-green-700 px-6 py-2 text-white hover:bg-green-800"
        >
          Ver produtos
        </Link>
      </section>

      {erro && (
        <p className="rounded-lg bg-red-100 p-4 text-center text-red-800">{erro}</p>
      )}

      <section>
        <h2 className="mb-4 text-2xl font-semibold text-green-900">Categorias</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {categorias.map((c) => (
            <Link
              key={c.id}
              href="/produtos"
              className="rounded-lg bg-white p-6 text-center text-gray-800 shadow hover:bg-green-100"
            >
              {c.nome}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold text-green-900">Destaques</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {destaques.map((p) => (
            <Link
              key={p.id}
              href="/produtos"
              className="rounded-lg bg-white p-4 shadow hover:bg-green-50"
            >
              <div className="mb-3 overflow-hidden rounded bg-green-100">
                <Image
                  src={`/img/${p.imagem}`}
                  alt={p.nome}
                  width={300}
                  height={200}
                  className="h-32 w-full object-cover"
                />
              </div>
              <p className="font-medium text-gray-900">{p.nome}</p>
              <p className="text-green-700">
                R$ {Number(p.preco).toFixed(2).replace(".", ",")}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}