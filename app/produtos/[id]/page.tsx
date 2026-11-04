import { Suspense } from "react"; // Suspense mostra um "Carregando..." enquanto a parte que depende da URL ainda não está pronta
import DetalheProduto from "./DetalheProduto"; // A página de detalhe em si (componente cliente que lê o {id} da URL)

// O useParams só funciona quando a página é aberta no navegador.
// Envolver em <Suspense> permite que o build gere o resto da página antes.
export default function PaginaProduto() {
  return (
    <Suspense fallback={<p className="text-gray-700">Carregando...</p>}>
      <DetalheProduto />
    </Suspense>
  );
}