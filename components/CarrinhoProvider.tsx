"use client";

import { createContext, useContext, useEffect, useState } from "react"; //Teacher usamos esse import pq ele puxa quatro funções do React que, juntas, fazem o carrinho ser compartilhado entre as páginas e lembrado no navegador

export type ItemCarrinho = {
  id: number;
  nome: string;
  preco: number;
  imagem: string;
  estoque: number;
  quantidade: number;
};

type NovoItem = Omit<ItemCarrinho, "quantidade">;

type ContextoCarrinho = {
  itens: ItemCarrinho[];
  totalItens: number;
  total: number;
  adicionar: (produto: NovoItem) => void;
  alterarQuantidade: (id: number, quantidade: number) => void;
  remover: (id: number) => void;
  limpar: () => void;
};

const Contexto = createContext<ContextoCarrinho | null>(null);

export function CarrinhoProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [carregado, setCarregado] = useState(false);

  // Ao abrir o site, recupera o carrinho guardado no navegador
  useEffect(() => {
    try {
      const salvo = localStorage.getItem("carrinho");
      if (salvo) setItens(JSON.parse(salvo));
    } catch {
      // se der problema, começa com o carrinho vazio
    }
    setCarregado(true);
  }, []);

  // A cada mudança, guarda o carrinho de novo
  useEffect(() => {
    if (carregado) {
      localStorage.setItem("carrinho", JSON.stringify(itens));
    }
  }, [itens, carregado]);

  function adicionar(produto: NovoItem) {
    if (produto.estoque < 1) return;
    setItens((atual) => {
      const existente = atual.find((i) => i.id === produto.id);
      if (existente) {
        return atual.map((i) =>
          i.id === produto.id
            ? { ...i, quantidade: Math.min(i.quantidade + 1, i.estoque) }
            : i
        );
      }
      return [...atual, { ...produto, quantidade: 1 }];
    });
  }

  function alterarQuantidade(id: number, quantidade: number) {
    if (quantidade < 1) {
      remover(id);
      return;
    }
    setItens((atual) =>
      atual.map((i) =>
        i.id === id ? { ...i, quantidade: Math.min(quantidade, i.estoque) } : i
      )
    );
  }

  function remover(id: number) {
    setItens((atual) => atual.filter((i) => i.id !== id));
  }

  function limpar() {
    setItens([]);
  }

  const totalItens = itens.reduce((soma, i) => soma + i.quantidade, 0);
  const total = itens.reduce((soma, i) => soma + i.preco * i.quantidade, 0);

  return (
    <Contexto.Provider
      value={{ itens, totalItens, total, adicionar, alterarQuantidade, remover, limpar }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useCarrinho() {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error("useCarrinho precisa estar dentro do CarrinhoProvider");
  }
  return contexto;
}