"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCarrinho } from "@/components/CarrinhoProvider";

type Usuario = { id: number; nome: string; tipo: string };

export default function Menu() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { totalItens } = useCarrinho();

  // Pergunta à API quem está logado, a cada troca de página
  useEffect(() => {
    fetch("/api/sessao")
      .then((r) => (r.ok ? r.json() : null))
      .then(setUsuario)
      .catch(() => setUsuario(null));
  }, [pathname]);

  async function sair() {
    await fetch("/api/logout", { method: "POST" });
    setUsuario(null);
    router.push("/");
    router.refresh();
  }

  const link = "hover:text-green-600";

  return (
    <header className="bg-white shadow">
      <nav className="mx-auto flex max-w-6xl items-center justify-between p-3">
        <Link href="/" className="flex items-center">
          <Image
            src="/img/logo_menu_praski.png"
            alt="Praski"
            width={160}
            height={64}
            className="h-16 w-auto"
          />
        </Link>

        <div className="flex items-center gap-6 font-medium text-green-900">
          <Link href="/produtos" className={link}>Produtos</Link>
          <Link href="/carrinho" className={link}>
            Carrinho{totalItens > 0 ? ` (${totalItens})` : ""}
          </Link>
          <Link href="/contato" className={link}>Contato</Link>

          {usuario ? (
            <>
              <Link href="/pedidos" className={link}>Meus pedidos</Link>
              <Link href="/perfil" className="text-gray-700 hover:text-green-600">
                Olá, {usuario.nome.split(" ")[0]}
              </Link>
              <button onClick={sair} className={link}>Sair</button>
                {usuario.tipo === "admin" && (
                <Link href="/admin" className={link}>Admin</Link>
              )}
            </>
          ) : (
            <Link href="/login" className={link}>Entrar</Link>
          )}
        </div>
      </nav>
    </header>
  );
}