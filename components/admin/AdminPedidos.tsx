"use client";

import { useEffect, useState } from "react"; //Por que esse import teacher? porque os dois hooks controlam a lista de pedidos e quando ela é buscada de novo

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
  cliente: string;
  email: string;
  itens: Item[];
};

const listaStatus = ["pendente", "pago", "enviado", "cancelado"];

function dinheiro(valor: number | string) {
  return `R$ ${Number(valor).toFixed(2).replace(".", ",")}`;
}

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [status, setStatus] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [recarregar, setRecarregar] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (de) params.set("de", de);
    if (ate) params.set("ate", ate);

    setCarregando(true);

    fetch(`/api/admin/pedidos?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error("falha");
        return r.json();
      })
      .then((dados) => {
        setPedidos(dados);
        setErro("");
      })
      .catch(() => setErro("Não foi possível carregar os pedidos."))
      .finally(() => setCarregando(false));
  }, [status, de, ate, recarregar]);

  async function mudarStatus(id: number, novo: string) {
    setErro("");
    const resp = await fetch(`/api/admin/pedidos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novo }),
    });
    const dados = await resp.json();

    if (!resp.ok) {
      setErro(dados.erro || "Erro ao mudar o status.");
    }
    setRecarregar((n) => n + 1);
  }

  const campo = "rounded border p-2 text-gray-800";

  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-lg bg-white p-4 shadow md:grid-cols-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={campo}>
          <option value="">Todos os status</option>
          {listaStatus.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
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

      <p className="text-gray-700">
        {carregando ? "Carregando..." : `${pedidos.length} pedido(s) encontrado(s)`}
      </p>

      {erro && <p className="rounded bg-red-100 p-3 text-sm text-red-800">{erro}</p>}

      <div className="space-y-4">
        {pedidos.map((p) => (
          <div key={p.id} className="rounded-lg bg-white p-4 shadow">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">Pedido nº {p.id}</p>
                <p className="text-sm text-gray-600">
                  {p.cliente} ({p.email}) · {new Date(p.criado_em).toLocaleString("pt-BR")}
                </p>
              </div>

              <select
                value={p.status}
                onChange={(e) => mudarStatus(p.id, e.target.value)}
                className={campo}
              >
                {listaStatus.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <ul className="mt-3 divide-y text-sm text-gray-800">
              {p.itens.map((i) => (
                <li key={i.produto_id} className="flex justify-between py-1">
                  <span>{i.quantidade} × {i.nome}</span>
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
    </div>
  );
}