"use client";

import { useEffect, useState } from "react"; // Esse import teacher usamos quando o estado guarda pedidos, filtros, loading e erro. O efeito busca /api/pedidos ao abrir e de novo quando status ou datas mudam
import Link from "next/link"; // Esse import é mais tranquilo, usamos ele em Link interno para /produtos, sem recarregar o site
import { useRouter } from "next/navigation"; // Se a API responder 401, router.push("/login") redireciona quem não está logado.

type Item = {
  produto_id: number;
  nome: string;
  quantidade: number;
  preco_unitario: string;
};

type Pedido = {
  id: number;
  status: string;
  total: string;
  criado_em: string;
  itens: Item[];
};

const coresStatus: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  pago: "bg-blue-100 text-blue-800",
  enviado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};

function dinheiro(valor: number | string) {
  return `R$ ${Number(valor).toFixed(2).replace(".", ",")}`;
}

export default function PaginaPedidos() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [status, setStatus] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (de) params.set("de", de);
    if (ate) params.set("ate", ate);

    setCarregando(true);
    setErro("");

    fetch(`/api/pedidos?${params.toString()}`)
      .then((r) => {
        if (r.status === 401) {
          router.push("/login");
          throw new Error("sem login");
        }
        if (!r.ok) throw new Error("falha");
        return r.json();
      })
      .then(setPedidos)
      .catch((e) => {
        if (e.message !== "sem login") setErro("Não foi possível carregar os pedidos.");
      })
      .finally(() => setCarregando(false));
  }, [status, de, ate, router]);

  function limpar() {
    setStatus("");
    setDe("");
    setAte("");
  }

  const campo = "rounded border p-2 text-gray-800";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-green-900">Meus pedidos</h1>

      <section className="grid gap-4 rounded-lg bg-white p-4 shadow md:grid-cols-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={campo}>
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
          <option value="enviado">Enviado</option>
          <option value="cancelado">Cancelado</option>
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          De
          <input type="date" value={de} onChange={(e) => setDe(e.target.value)} className={`${campo} flex-1`} />
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          Até
          <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className={`${campo} flex-1`} />
        </label>
      </section>

      <div className="flex items-center justify-between">
        <p className="text-gray-700">
          {carregando ? "Carregando..." : `${pedidos.length} pedido(s) encontrado(s)`}
        </p>
        <button onClick={limpar} className="text-green-700 underline">
          Limpar filtros
        </button>
      </div>

      {erro ? (
        <p className="rounded-lg bg-red-100 p-6 text-center text-red-800 shadow">{erro}</p>
      ) : !carregando && pedidos.length === 0 ? (
        <div className="space-y-2 rounded-lg bg-white p-6 text-center shadow">
          <p className="text-gray-800">Nenhum pedido encontrado.</p>
          <Link href="/produtos" className="text-green-700 underline">
            Ver produtos
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((p) => (
            <div key={p.id} className="rounded-lg bg-white p-4 shadow">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">Pedido nº {p.id}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(p.criado_em).toLocaleString("pt-BR")}
                  </p>
                </div>
                <span
                  className={`rounded px-3 py-1 text-sm font-medium ${
                    coresStatus[p.status] ?? "bg-gray-100 text-gray-800"
                  }`}
                >
                  {p.status}
                </span>
              </div>

              <ul className="mt-3 divide-y text-sm text-gray-800">
                {p.itens.map((i) => (
                  <li key={i.produto_id} className="flex justify-between py-1">
                    <span>
                      {i.quantidade} × {i.nome}
                    </span>
                    <span>{dinheiro(Number(i.preco_unitario) * i.quantidade)}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-3 text-right text-lg font-bold text-green-700">
                Total: {dinheiro(p.total)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}