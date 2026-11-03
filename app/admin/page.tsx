"use client";

import { useEffect, useState } from "react"; // Porque esse import teacher? por que estado da aba (produtos / categorias / pedidos) e se o acesso está carregando, liberado ou negado. O efeito consulta /api/sessao ao abrir
import { useRouter } from "next/navigation"; // esse import é para caso não houver login
// Esses 3 imports teacher seria para os painéis da área admin. A página só escolhe a aba e, se for admin, renderiza o componente correspondente
import AdminProdutos from "@/components/admin/AdminProdutos";
import AdminCategorias from "@/components/admin/AdminCategorias";
import AdminPedidos from "@/components/admin/AdminPedidos";

type Aba = "produtos" | "categorias" | "pedidos";

export default function PaginaAdmin() {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("produtos");
  const [estado, setEstado] = useState<"carregando" | "liberado" | "negado">("carregando");

  useEffect(() => {
    fetch("/api/sessao")
      .then((r) => {
        if (!r.ok) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((u) => {
        if (!u) return;
        setEstado(u.tipo === "admin" ? "liberado" : "negado");
      })
      .catch(() => router.push("/login"));
  }, [router]);

  if (estado === "carregando") {
    return <p className="text-gray-700">Carregando...</p>;
  }

  if (estado === "negado") {
    return (
      <div className="mx-auto max-w-md rounded-lg bg-white p-6 text-center shadow">
        <h1 className="text-2xl font-bold text-green-900">Acesso restrito</h1>
        <p className="mt-2 text-gray-700">
          Esta área é só para quem administra a loja.
        </p>
      </div>
    );
  }

  const botao = (nome: Aba, texto: string) => (
    <button
      onClick={() => setAba(nome)}
      className={`rounded px-4 py-2 font-medium ${
        aba === nome ? "bg-green-700 text-white" : "bg-white text-green-900 hover:bg-green-100"
      }`}
    >
      {texto}
    </button>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-green-900">Administração</h1>

      <div className="flex gap-2">
        {botao("produtos", "Produtos")}
        {botao("categorias", "Categorias")}
        {botao("pedidos", "Pedidos")}
      </div>

      {aba === "produtos" && <AdminProdutos />}
      {aba === "categorias" && <AdminCategorias />}
      {aba === "pedidos" && <AdminPedidos />}
    </div>
  );
}