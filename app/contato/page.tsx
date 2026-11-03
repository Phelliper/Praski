const integrantes = [
  {
    nome: "Demerson A. Sembraski",
    email: "dsembraski@gmail.com",
    telefone: "5542988446781",
    telefoneExibido: "(42) 98844-6781",
  },
  {
    nome: "João V. da Silva",
    email: "joaovdso26@gmail.com",
    telefone: "5542988518388",
    telefoneExibido: "(42) 98851-8388",
  },
  {
    nome: "Phellipe R. Conceição",
    email: "phellipe.rodrigues.con@gmail.com",
    telefone: "5542991151897",
    telefoneExibido: "(42) 99115-1897",
  },
  {
    nome: "Victor L. da Silva",
    email: "vs0500229@gmail.com",
    telefone: "5542998060650",
    telefoneExibido: "(42) 99806-0650",
  },
];

export default function PaginaContato() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">Contato</h1>
        <p className="mt-1 text-gray-700">
          Fale com a equipe do Praski. Tire dúvidas, faça sugestões ou peça informações sobre os produtos.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {integrantes.map((i) => (
          <div key={i.email} className="rounded-lg bg-white p-5 shadow">
            <p className="text-lg font-semibold text-gray-900">{i.nome}</p>
            <p className="mt-2 text-sm text-gray-700">
              E-mail:{" "}
              <a href={`mailto:${i.email}`} className="text-green-700 underline">
                {i.email}
              </a>
            </p>
            <p className="text-sm text-gray-700">
              WhatsApp:{" "}
              <a
                href={`https://wa.me/${i.telefone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="text-green-700 underline"
              >
                {i.telefoneExibido}
              </a>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}