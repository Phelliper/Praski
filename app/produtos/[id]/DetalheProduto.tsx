"use client";

import { useEffect, useState } from "react"; // Guarda o produto, o carregamento, o erro e o aviso de "adicionado". O efeito busca o produto na API ao abrir a página
import { useParams } from "next/navigation"; // Lê o {id} da URL (ex.: /produtos/3 -> id = "3")
import Image from "next/image"; // Mostra a foto do produto de forma otimizada
import Link from "next/link"; // Links internos: voltar para a loja e ir para o carrinho
import { useCarrinho } from "@/components/CarrinhoProvider"; // Usa o mesmo carrinho do resto do site

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

function dinheiro(valor: number | string) {
  return `R$ ${Number(valor).toFixed(2).replace(".", ",")}`;
}

export default function DetalheProduto() {
  const { id } = useParams<{ id: string }>();
  const { itens, adicionar } = useCarrinho();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [adicionado, setAdicionado] = useState(false);

  // Busca o produto na API: GET /api/produtos/{id}
  useEffect(() => {
    setCarregando(true);
    setErro("");

    fetch(`/api/produtos/${id}`)
      .then(async (r) => {
        if (r.status === 400 || r.status === 404) {
          throw new Error("Produto não encontrado.");
        }
        if (!r.ok) throw new Error("Não foi possível carregar o produto.");
        return r.json();
      })
      .then(setProduto)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [id]);

  if (carregando) {
    return <p className="text-gray-700">Carregando...</p>;
  }

  if (erro || !produto) {
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-lg bg-white p-6 text-center shadow">
        <h1 className="text-2xl font-bold text-green-900">Ops!</h1>
        <p className="text-gray-700">{erro || "Produto não encontrado."}</p>
        <Link href="/produtos" className="text-green-700 underline">
          Voltar para os produtos
        </Link>
      </div>
    );
  }

  // Quantos deste produto já estão no carrinho (para não passar do estoque)
  const noCarrinho = itens.find((i) => i.id === produto.id)?.quantidade ?? 0;
  const semEstoque = produto.estoque < 1;
  const limiteAtingido = !semEstoque && noCarrinho >= produto.estoque;

  function colocarNoCarrinho() {
    if (!produto) return;
    adicionar({
      id: produto.id,
      nome: produto.nome,
      preco: Number(produto.preco),
      imagem: produto.imagem,
      estoque: produto.estoque,
    });
    setAdicionado(true);
  }

  return (
    <div className="space-y-6">
      <Link href="/produtos" className="text-green-700 underline">
        ← Voltar para os produtos
      </Link>

      <div className="grid gap-6 rounded-lg bg-white p-6 shadow md:grid-cols-2">
        <div className="overflow-hidden rounded bg-green-100">
          <Image
            src={`/img/${produto.imagem}`}
            alt={produto.nome}
            width={600}
            height={450}
            className="h-80 w-full object-cover"
          />
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm text-green-700">{produto.categoria}</p>
          <h1 className="text-3xl font-bold text-gray-900">{produto.nome}</h1>
          <p className="text-gray-700">{produto.descricao}</p>

          <dl className="grid grid-cols-2 gap-2 rounded bg-green-50 p-3 text-sm text-gray-800">
            <dt className="font-semibold">Embalagem</dt>
            <dd>{produto.embalagem}</dd>
            <dt className="font-semibold">Estoque</dt>
            <dd>{semEstoque ? "Sem estoque" : `${produto.estoque} unidade(s)`}</dd>
          </dl>

          <p className="text-3xl font-bold text-green-700">{dinheiro(produto.preco)}</p>

          <button
            onClick={colocarNoCarrinho}
            disabled={semEstoque || limiteAtingido}
            className="rounded bg-green-700 py-3 text-white hover:bg-green-800 disabled:bg-gray-400"
          >
            {semEstoque
              ? "Sem estoque"
              : limiteAtingido
                ? "Você já tem todo o estoque no carrinho"
                : "Adicionar ao carrinho"}
          </button>

          {adicionado && (
            <p className="rounded bg-green-100 p-2 text-sm text-green-800">
              Produto no carrinho ({noCarrinho} unidade(s)).{" "}
              <Link href="/carrinho" className="underline">
                Ir para o carrinho
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
