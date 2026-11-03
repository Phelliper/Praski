import { z } from "zod"; //Zod é uma biblioteca de validação de dados

export const esquemaProduto = z.object({
  nome: z.string().min(2, "O nome precisa ter pelo menos 2 letras."),
  descricao: z.string().default(""),
  preco: z.coerce.number().positive("O preço precisa ser maior que zero."),
  embalagem: z.string().min(1, "Informe a embalagem (ex.: 250g)."),
  estoque: z.coerce.number().int().min(0, "O estoque não pode ser negativo."),
  imagem: z.string().min(1, "Informe o nome do arquivo da imagem."),
  categoria_id: z.coerce.number().int().positive("Escolha uma categoria."),
});