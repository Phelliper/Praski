"use client";

import { useState } from "react"; // Esse import usamos teacher pq guarda erro, se está enviando o pedido, e pedidoId depois que o pedido fecha 
import Image from "next/image"; // Bom, import bemm de apoio, para usar cada foto de cada produto na lista do carrinho
import Link from "next/link"; // Esse seria para navegação interna: “Ver produtos” e “Ver meus pedidos” 
import { useRouter } from "next/navigation"; // import para se finalizar sem estar logado (401)
import { useCarrinho } from "@/components/CarrinhoProvider"; // Esse import Teacher ele lê e altera o carrinho compartilhado: itens, total, alterarQuantidade, remover, limpar

function dinheiro(valor: number) {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

export default function PaginaCarrinho() {
  const { itens, total, alterarQuantidade, remover, limpar } = useCarrinho();
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pedidoId, setPedidoId] = useState<number | null>(null);

  async function finalizar() {
    setErro("");
    setEnviando(true);
    try {
      const resp = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: itens.map((i) => ({ produto_id: i.id, quantidade: i.quantidade })),
        }),
      });
      const dados = await resp.json();

      if (resp.status === 401) {
        router.push("/login");
        return;
      }
      if (!resp.ok) {
        setErro(dados.erro || "Não foi possível finalizar o pedido.");
        return;
      }

      limpar();
      setPedidoId(dados.id);
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setEnviando(false);
    }
  }

  if (pedidoId) {
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-lg bg-white p-6 text-center shadow">
        <h1 className="text-2xl font-bold text-green-900">Pedido realizado!</h1>
        <p className="text-gray-700">Seu pedido número {pedidoId} foi registrado.</p>
        <Link
          href="/pedidos"
          className="inline-block rounded bg-green-700 px-6 py-2 text-white hover:bg-green-800"
        >
          Ver meus pedidos
        </Link>
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="space-y-3 rounded-lg bg-white p-6 text-center shadow">
        <h1 className="text-2xl font-bold text-green-900">Carrinho</h1>
        <p className="text-gray-700">Seu carrinho está vazio.</p>
        <Link href="/produtos" className="text-green-700 underline">
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-green-900">Carrinho</h1>

      <div className="space-y-3">
        {itens.map((i) => (
          <div
            key={i.id}
            className="flex items-center gap-4 rounded-lg bg-white p-4 shadow"
          >
            <Image
              src={`/img/${i.imagem}`}
              alt={i.nome}
              width={80}
              height={80}
              className="h-20 w-20 rounded object-cover"
            />

            <div className="flex-1">
              <p className="font-semibold text-gray-900">{i.nome}</p>
              <p className="text-sm text-gray-600">{dinheiro(i.preco)} cada</p>
            </div>

            <div className="flex items-center gap-2 text-gray-800">
              <button
                onClick={() => alterarQuantidade(i.id, i.quantidade - 1)}
                className="h-8 w-8 rounded border hover:bg-green-100"
              >
                -
              </button>
              <span className="w-8 text-center">{i.quantidade}</span>
              <button
                onClick={() => alterarQuantidade(i.id, i.quantidade + 1)}
                disabled={i.quantidade >= i.estoque}
                className="h-8 w-8 rounded border hover:bg-green-100 disabled:opacity-40"
              >
                +
              </button>
            </div>

            <p className="w-24 text-right font-semibold text-green-700">
              {dinheiro(i.preco * i.quantidade)}
            </p>

            <button
              onClick={() => remover(i.id)}
              className="text-sm text-red-700 underline"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-lg bg-white p-4 shadow">
        <p className="text-xl font-bold text-gray-900">Total: {dinheiro(total)}</p>

        {erro && (
          <p className="rounded bg-red-100 p-2 text-sm text-red-800">{erro}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={finalizar}
            disabled={enviando}
            className="rounded bg-green-700 px-6 py-2 text-white hover:bg-green-800 disabled:opacity-50"
          >
            {enviando ? "Enviando..." : "Finalizar pedido"}
          </button>
          <button onClick={limpar} className="text-gray-700 underline">
            Esvaziar carrinho
          </button>
        </div>
      </div>
    </div>
  );
}