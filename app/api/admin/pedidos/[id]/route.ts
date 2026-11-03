import { NextResponse } from "next/server";
import { z } from "zod";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { exigirAdmin } from "@/lib/sessao";

type Contexto = { params: Promise<{ id: string }> };

const esquema = z.object({
  status: z.enum(["pendente", "pago", "enviado", "cancelado"], {
    message: "Status inválido.",
  }),
});

export async function PUT(request: Request, contexto: Contexto) {
  const negado = await exigirAdmin();
  if (negado) return negado;

  const { id: idTexto } = await contexto.params;
  const id = Number(idTexto);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ erro: "Código de pedido inválido." }, { status: 400 });
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  }

  const resultado = esquema.safeParse(corpo);
  if (!resultado.success) {
    return NextResponse.json({ erro: resultado.error.issues[0].message }, { status: 400 });
  }
  const novo = resultado.data.status;

  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();

    const [rows] = await conexao.query<RowDataPacket[]>(
      "SELECT status FROM pedidos WHERE id = ? FOR UPDATE",
      [id]
    );
    const pedido = rows[0];

    if (!pedido) {
      await conexao.rollback();
      return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
    }
    if (pedido.status === "cancelado" && novo !== "cancelado") {
      await conexao.rollback();
      return NextResponse.json(
        { erro: "Um pedido cancelado não pode ser reaberto." },
        { status: 409 }
      );
    }

    // Ao cancelar, os produtos voltam para o estoque
    if (novo === "cancelado" && pedido.status !== "cancelado") {
      await conexao.query(
        `UPDATE produtos p
         JOIN itens_pedido i ON i.produto_id = p.id
         SET p.estoque = p.estoque + i.quantidade
         WHERE i.pedido_id = ?`,
        [id]
      );
    }

    await conexao.query("UPDATE pedidos SET status = ? WHERE id = ?", [novo, id]);
    await conexao.commit();

    return NextResponse.json({ id, status: novo }, { status: 200 });
  } catch (erro) {
    await conexao.rollback();
    console.error(erro);
    return NextResponse.json({ erro: "Não foi possível atualizar o pedido." }, { status: 500 });
  } finally {
    conexao.release();
  }
}