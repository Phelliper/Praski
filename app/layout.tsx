import "./globals.css"; // Esse import Teacher usamos ele para carrega o CSS global
import Menu from "@/components/Menu"; // Esse outro seria para o cabeçalho com logo e links. Fica no topo de todas as páginas
import Rodape from "@/components/Rodape"; // Esse é mais simples teacher, é nosso rodapé em todas as páginas
import { CarrinhoProvider } from "@/components/CarrinhoProvider";

export const metadata = {
  title: "Praski",
  description: "Sementes e fertilizantes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col bg-green-50 text-gray-800">
        <CarrinhoProvider>
          <Menu />
          <main className="mx-auto w-full max-w-6xl flex-1 p-4">{children}</main>
          <Rodape />
        </CarrinhoProvider>
      </body>
    </html>
  );
}