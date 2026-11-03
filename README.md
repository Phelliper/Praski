# Praski — API REST

Loja virtual de **sementes e fertilizantes** desenvolvida como Projeto Integrador do curso de TADS (IFPR — Campus Telêmaco Borba).

A aplicação é composta por:

- uma **API REST** (rotas em `app/api/`);
- um **banco de dados MySQL** (script em `banco/praski.sql`);
- uma **interface web** que consome a API (páginas em `app/`).

**Integrantes:** Demerson A. Sembraski, João V. da Silva, Phellipe R. Conceição e Victor L. da Silva.

---

## Sumário

1. [Tecnologias](#tecnologias)
2. [Como executar o projeto](#como-executar-o-projeto)
3. [Banco de dados](#banco-de-dados)
4. [Informações gerais da API](#informações-gerais-da-api)
5. [Autenticação](#autenticação)
6. [Endpoints](#endpoints)
   - [Usuários e autenticação](#usuários-e-autenticação)
   - [Perfil](#perfil)
   - [Produtos](#produtos)
   - [Categorias](#categorias)
   - [Pedidos (cliente)](#pedidos-cliente)
   - [Pedidos (administração)](#pedidos-administração)
7. [Códigos HTTP utilizados](#códigos-http-utilizados)
8. [Testando com o Postman](#testando-com-o-postman)

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| Next.js 16 (App Router) | Front-end e API (Route Handlers) |
| React 19 | Interface |
| MySQL + `mysql2` | Banco de dados e conexão |
| `bcryptjs` | Criptografia das senhas |
| `jose` | Criação e verificação do token JWT |
| `zod` | Validação dos dados recebidos |
| Tailwind CSS 4 | Estilização |

---

## Como executar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/pt) (versão LTS)
- MySQL (por exemplo, pelo XAMPP)

### Passo a passo

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o banco de dados (com o MySQL ligado). No Windows, com XAMPP:

   ```bash
   C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 < banco\praski.sql
   ```

   > Use `--default-character-set=utf8mb4` para que os acentos sejam importados corretamente.

3. Crie o arquivo `.env.local` na raiz do projeto com as variáveis abaixo:

   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=praski

   JWT_SECRET=troque-por-uma-chave-secreta
   ```

4. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

5. Acesse [http://localhost:3000](http://localhost:3000).

### Criando um administrador

Todo usuário cadastrado pelo site é criado como `cliente`. Para tornar um usuário administrador, execute no banco:

```sql
UPDATE usuarios SET tipo = 'admin' WHERE email = 'email@exemplo.com';
```

Depois disso, é necessário **sair e entrar novamente** no sistema, pois o tipo do usuário fica gravado no token de login.

---

## Banco de dados

Modelo relacional com 5 tabelas:

```
usuarios (1) ──── (N) pedidos (1) ──── (N) itens_pedido (N) ──── (1) produtos (N) ──── (1) categorias
```

| Tabela | Campos | Descrição |
|---|---|---|
| `usuarios` | `id`, `nome`, `email` (único), `senha_hash`, `tipo` (`cliente` \| `admin`), `criado_em` | Usuários do sistema. A senha é armazenada criptografada com bcrypt. |
| `categorias` | `id`, `nome` (único) | Categorias dos produtos. |
| `produtos` | `id`, `nome`, `descricao`, `preco`, `embalagem`, `estoque`, `imagem`, `categoria_id` | **Recurso principal.** Cada produto pertence a uma categoria. |
| `pedidos` | `id`, `usuario_id`, `status` (`pendente` \| `pago` \| `enviado` \| `cancelado`), `total`, `criado_em` | Pedidos feitos pelos usuários. |
| `itens_pedido` | `id`, `pedido_id`, `produto_id`, `quantidade`, `preco_unitario` | Produtos de cada pedido, com o preço do momento da compra. |

Regras de integridade:

- Uma **categoria com produtos** não pode ser excluída.
- Um **produto que já foi vendido** (presente em algum pedido) não pode ser excluído.
- Ao excluir um pedido, seus itens são excluídos junto (`ON DELETE CASCADE`).

---

## Informações gerais da API

- **URL base (local):** `http://localhost:3000/api`
- **URL base (produção):** _a definir após o deploy na Azure_
- **Formato:** todas as requisições e respostas usam **JSON**. Nas requisições com corpo, envie o cabeçalho `Content-Type: application/json`.
- **Formato dos erros:** sempre que ocorre um erro, a API responde com um objeto contendo a mensagem:

  ```json
  { "erro": "Mensagem explicando o problema." }
  ```

- **Valores decimais:** os campos `preco`, `total` e `preco_unitario` vindos do banco são retornados como **texto** (ex.: `"15.00"`).

### Resumo dos endpoints

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/usuarios` | Público | Cadastra um usuário |
| POST | `/api/login` | Público | Faz login |
| POST | `/api/logout` | Público | Faz logout |
| GET | `/api/sessao` | Logado | Retorna o usuário logado |
| GET | `/api/perfil` | Logado | Consulta os dados do usuário logado |
| PUT | `/api/perfil` | Logado | Edita os dados do usuário logado |
| GET | `/api/produtos` | Público | Lista produtos (com filtros) |
| GET | `/api/produtos/{id}` | Público | Consulta um produto |
| POST | `/api/produtos` | Admin | Cadastra um produto |
| PUT | `/api/produtos/{id}` | Admin | Edita um produto |
| DELETE | `/api/produtos/{id}` | Admin | Exclui um produto |
| GET | `/api/categorias` | Público | Lista categorias |
| POST | `/api/categorias` | Admin | Cadastra uma categoria |
| PUT | `/api/categorias/{id}` | Admin | Edita uma categoria |
| DELETE | `/api/categorias/{id}` | Admin | Exclui uma categoria |
| GET | `/api/pedidos` | Logado | Lista os pedidos do usuário logado (com filtros) |
| POST | `/api/pedidos` | Logado | Cria um pedido |
| GET | `/api/admin/pedidos` | Admin | Lista todos os pedidos (com filtros) |
| PUT | `/api/admin/pedidos/{id}` | Admin | Altera o status de um pedido |

---

## Autenticação

A autenticação utiliza **JWT (JSON Web Token)**, guardado em um **cookie `httpOnly`** chamado `token`.

1. O usuário faz login em `POST /api/login`.
2. A API devolve o cookie `token` (válido por **7 dias**), que contém `id`, `nome` e `tipo` do usuário.
3. Nas próximas requisições, o navegador (ou o Postman) envia o cookie automaticamente.
4. As rotas protegidas leem esse cookie para identificar o usuário.

Níveis de acesso:

| Nível | Quem pode acessar |
|---|---|
| **Público** | Qualquer pessoa, sem login |
| **Logado** | Qualquer usuário autenticado |
| **Admin** | Apenas usuários com `tipo = 'admin'` |

Respostas para quem não tem acesso:

```json
// 401 Unauthorized — não está logado
{ "erro": "Faça login para continuar." }
```

```json
// 403 Forbidden — está logado, mas não é admin
{ "erro": "Você não tem permissão para esta ação." }
```

---

## Endpoints

### Usuários e autenticação

#### `POST /api/usuarios` — Cadastrar usuário

**Acesso:** Público

**Corpo da requisição:**

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `nome` | texto | Sim | Mínimo de 2 caracteres |
| `email` | texto | Sim | E-mail válido e ainda não cadastrado |
| `senha` | texto | Sim | Mínimo de 6 caracteres |

**Exemplo de requisição:**

```http
POST /api/usuarios
Content-Type: application/json

{
  "nome": "Maria Souza",
  "email": "maria@email.com",
  "senha": "123456"
}
```

**Exemplo de resposta — `201 Created`:**

```json
{
  "id": 5,
  "nome": "Maria Souza",
  "email": "maria@email.com"
}
```

**Possíveis respostas:**

| Código | Situação | Exemplo |
|---|---|---|
| 201 | Usuário criado | — |
| 400 | Dados inválidos | `{ "erro": "A senha precisa ter pelo menos 6 caracteres." }` |
| 409 | E-mail já cadastrado | `{ "erro": "Já existe um usuário com esse e-mail." }` |
| 500 | Erro interno | `{ "erro": "Não foi possível criar o usuário." }` |

---

#### `POST /api/login` — Fazer login

**Acesso:** Público

**Corpo da requisição:**

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `email` | texto | Sim | E-mail válido |
| `senha` | texto | Sim | Não pode ser vazia |

**Exemplo de requisição:**

```http
POST /api/login
Content-Type: application/json

{
  "email": "maria@email.com",
  "senha": "123456"
}
```

**Exemplo de resposta — `200 OK`:**

```json
{
  "id": 5,
  "nome": "Maria Souza",
  "tipo": "cliente"
}
```

A resposta também envia o cabeçalho `Set-Cookie` com o cookie `token`.

**Possíveis respostas:**

| Código | Situação | Exemplo |
|---|---|---|
| 200 | Login feito com sucesso | — |
| 400 | Dados inválidos | `{ "erro": "Informe um e-mail válido." }` |
| 401 | E-mail ou senha errados | `{ "erro": "E-mail ou senha incorretos." }` |
| 500 | Erro interno | `{ "erro": "Não foi possível fazer login." }` |

---

#### `POST /api/logout` — Fazer logout

**Acesso:** Público

Apaga o cookie `token`. Não precisa de corpo.

**Exemplo de resposta — `200 OK`:**

```json
{ "ok": true }
```

---

#### `GET /api/sessao` — Usuário logado

**Acesso:** Logado

Retorna os dados do usuário que está no token. É usada pela interface para saber quem está logado.

**Exemplo de resposta — `200 OK`:**

```json
{
  "id": 5,
  "nome": "Maria Souza",
  "tipo": "cliente"
}
```

**Possíveis respostas:**

| Código | Situação | Exemplo |
|---|---|---|
| 200 | Usuário logado | — |
| 401 | Ninguém logado ou token inválido | `{ "erro": "Não autenticado." }` |

---

### Perfil

#### `GET /api/perfil` — Consultar meus dados

**Acesso:** Logado

**Exemplo de resposta — `200 OK`:**

```json
{
  "id": 5,
  "nome": "Maria Souza",
  "email": "maria@email.com",
  "tipo": "cliente",
  "criado_em": "2026-11-03T04:50:00.000Z"
}
```

**Possíveis respostas:**

| Código | Situação | Exemplo |
|---|---|---|
| 200 | Dados encontrados | — |
| 401 | Não está logado | `{ "erro": "Faça login para continuar." }` |
| 404 | Usuário não existe mais | `{ "erro": "Usuário não encontrado." }` |
| 500 | Erro interno | `{ "erro": "Não foi possível buscar o perfil." }` |

---

#### `PUT /api/perfil` — Editar meus dados

**Acesso:** Logado

**Corpo da requisição:**

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `nome` | texto | Sim | Mínimo de 2 caracteres (espaços nas pontas são ignorados) |
| `email` | texto | Sim | E-mail válido e não usado por outro usuário |
| `senha_atual` | texto | Só para trocar a senha | Senha atual do usuário |
| `nova_senha` | texto | Não | Mínimo de 6 caracteres. Se for enviada, `senha_atual` também é obrigatória |

**Exemplo de requisição (alterando nome e senha):**

```http
PUT /api/perfil
Content-Type: application/json

{
  "nome": "Maria S. Souza",
  "email": "maria@email.com",
  "senha_atual": "123456",
  "nova_senha": "novaSenha1"
}
```

**Exemplo de resposta — `200 OK`:**

```json
{
  "id": 5,
  "nome": "Maria S. Souza",
  "email": "maria@email.com"
}
```

A resposta também envia um novo cookie `token`, pois o nome pode ter mudado.

**Possíveis respostas:**

| Código | Situação | Exemplo |
|---|---|---|
| 200 | Dados atualizados | — |
| 400 | Dados inválidos | `{ "erro": "Informe a senha atual para trocar a senha." }` |
| 401 | Não está logado | `{ "erro": "Faça login para continuar." }` |
| 401 | Senha atual errada | `{ "erro": "A senha atual está incorreta." }` |
| 409 | E-mail já usado por outro usuário | `{ "erro": "Esse e-mail já está em uso." }` |
| 500 | Erro interno | `{ "erro": "Não foi possível atualizar o perfil." }` |

---

### Produtos

Produto é o **recurso principal** do sistema.

| Atributo | Tipo | Descrição |
|---|---|---|
| `id` | número | Identificador |
| `nome` | texto | Nome do produto |
| `descricao` | texto | Descrição |
| `preco` | decimal | Preço em reais |
| `embalagem` | texto | Tamanho da embalagem (ex.: `250g`, `1kg`) |
| `estoque` | número inteiro | Quantidade disponível |
| `imagem` | texto | Nome do arquivo da imagem, que deve estar em `public/img` |
| `categoria_id` | número | Categoria do produto (relacionamento com `categorias`) |

#### `GET /api/produtos` — Listar produtos

**Acesso:** Público

**Parâmetros de consulta (query string) — todos opcionais:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `busca` | texto | Filtra pelo nome do produto (busca parcial) |
| `categoria` | número | Filtra pelo `id` da categoria |
| `preco_max` | número | Retorna produtos com preço menor ou igual ao valor |
| `estoque_baixo` | `true` | Retorna apenas produtos com estoque menor ou igual a 10 |

Os filtros podem ser combinados. O resultado vem ordenado pelo nome.

**Exemplo de requisição:**

```http
GET /api/produtos?categoria=3&preco_max=15&busca=sulfato
```

**Exemplo de resposta — `200 OK`:**

```json
[
  {
    "id": 11,
    "nome": "Sulfato de Amônio",
    "descricao": "Fornece nitrogênio e enxofre para cultivos que pedem muito nutriente.",
    "preco": "15.00",
    "embalagem": "1kg",
    "estoque": 9,
    "imagem": "sulfato-de-amonio.png",
    "categoria_id": 3,
    "categoria": "Fertilizantes"
  }
]
```

Se nenhum produto for encontrado, a resposta é uma lista vazia (`[]`).

**Possíveis respostas:**

| Código | Situação | Exemplo |
|---|---|---|
| 200 | Lista retornada (pode ser vazia) | — |
| 500 | Erro interno | `{ "erro": "Não foi possível buscar os produtos." }` |

---

#### `GET /api/produtos/{id}` — Consultar um produto

**Acesso:** Público

**Parâmetro de rota:** `id` — número inteiro maior que zero.

**Exemplo de requisição:**

```http
GET /api/produtos/1
```

**Exemplo de resposta — `200 OK`:**

```json
{
  "id": 1,
  "nome": "Girassol Sol Noturno",
  "descricao": "Girassol exótico com pétalas vermelhas e amarelas, de 2 a 3 metros de altura.",
  "preco": "12.00",
  "embalagem": "250g",
  "estoque": 40,
  "imagem": "girassol-sol-noturno.png",
  "categoria_id": 1,
  "categoria": "Sementes de flores"
}
```

**Possíveis respostas:**

| Código | Situação | Exemplo |
|---|---|---|
| 200 | Produto encontrado | — |
| 400 | `id` inválido | `{ "erro": "Código de produto inválido." }` |
| 404 | Produto não existe | `{ "erro": "Produto não encontrado." }` |
| 500 | Erro interno | `{ "erro": "Não foi possível buscar o produto." }` |

---

#### `POST /api/produtos` — Cadastrar produto

**Acesso:** Admin

**Corpo da requisição:**

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `nome` | texto | Sim | Mínimo de 2 caracteres |
| `descricao` | texto | Não | Se não for enviada, fica vazia |
| `preco` | número | Sim | Maior que zero |
| `embalagem` | texto | Sim | Não pode ser vazia |
| `estoque` | número inteiro | Sim | Zero ou mais |
| `imagem` | texto | Sim | Nome do arquivo em `public/img` |
| `categoria_id` | número inteiro | Sim | `id` de uma categoria existente |

Os campos numéricos também são aceitos como texto (ex.: `"12.50"`).

**Exemplo de requisição:**

```http
POST /api/produtos
Content-Type: application/json

{
  "nome": "Tomate Cereja",
  "descricao": "Tomate pequeno e doce, ótimo para vasos.",
  "preco": 8.5,
  "embalagem": "100g",
  "estoque": 30,
  "imagem": "tomate-cereja.png",
  "categoria_id": 2
}
```

**Exemplo de resposta — `201 Created`:**

```json
{
  "id": 17,
  "nome": "Tomate Cereja",
  "descricao": "Tomate pequeno e doce, ótimo para vasos.",
  "preco": 8.5,
  "embalagem": "100g",
  "estoque": 30,
  "imagem": "tomate-cereja.png",
  "categoria_id": 2
}
```

**Possíveis respostas:**

| Código | Situação | Exemplo |
|---|---|---|
| 201 | Produto criado | — |
| 400 | Dados inválidos | `{ "erro": "O preço precisa ser maior que zero." }` |
| 400 | Categoria não existe | `{ "erro": "Essa categoria não existe." }` |
| 401 | Não está logado | `{ "erro": "Faça login para continuar." }` |
| 403 | Não é admin | `{ "erro": "Você não tem permissão para esta ação." }` |
| 500 | Erro interno | `{ "erro": "Não foi possível cadastrar o produto." }` |

---

#### `PUT /api/produtos/{id}` — Editar produto

**Acesso:** Admin

**Parâmetro de rota:** `id` — número inteiro maior que zero.

**Corpo da requisição:** os **mesmos campos** do cadastro, todos enviados (a edição substitui o produto inteiro).

**Exemplo de requisição:**

```http
PUT /api/produtos/17
Content-Type: application/json

{
  "nome": "Tomate Cereja",
  "descricao": "Tomate pequeno e doce, ótimo para vasos.",
  "preco": 9.9,
  "embalagem": "100g",
  "estoque": 25,
  "imagem": "tomate-cereja.png",
  "categoria_id": 2
}
```

**Exemplo de resposta — `200 OK`:**

```json
{
  "id": 17,
  "nome": "Tomate Cereja",
  "descricao": "Tomate pequeno e doce, ótimo para vasos.",
  "preco": 9.9,
  "embalagem": "100g",
  "estoque": 25,
  "imagem": "tomate-cereja.png",
  "categoria_id": 2
}
```

**Possíveis respostas:**

| Código | Situação | Exemplo |
|---|---|---|
| 200 | Produto atualizado | — |
| 400 | `id` inválido | `{ "erro": "Código de produto inválido." }` |
| 400 | Dados inválidos | `{ "erro": "O estoque não pode ser negativo." }` |
| 400 | Categoria não existe | `{ "erro": "Essa categoria não existe." }` |
| 401 | Não está logado | `{ "erro": "Faça login para continuar." }` |
| 403 | Não é admin | `{ "erro": "Você não tem permissão para esta ação." }` |
| 404 | Produto não existe | `{ "erro": "Produto não encontrado." }` |
| 500 | Erro interno | `{ "erro": "Não foi possível atualizar o produto." }` |

---

#### `DELETE /api/produtos/{id}` — Excluir produto

**Acesso:** Admin

**Parâmetro de rota:** `id` — número inteiro maior que zero.

Um produto que já aparece em algum pedido **não pode ser excluído**, para não deixar pedidos sem os seus itens.

**Exemplo de requisição:**

```http
DELETE /api/produtos/17
```

**Exemplo de resposta — `200 OK`:**

```json
{ "ok": true }
```

**Possíveis respostas:**

| Código | Situação | Exemplo |
|---|---|---|
| 200 | Produto excluído | — |
| 400 | `id` inválido | `{ "erro": "Código de produto inválido." }` |
| 401 | Não está logado | `{ "erro": "Faça login para continuar." }` |
| 403 | Não é admin | `{ "erro": "Você não tem permissão para esta ação." }` |
| 404 | Produto não existe | `{ "erro": "Produto não encontrado." }` |
| 409 | Produto já foi vendido | `{ "erro": "Este produto já foi vendido e não pode ser excluído." }` |
| 500 | Erro interno | `{ "erro": "Não foi possível excluir o produto." }` |

---

### Categorias

#### `GET /api/categorias` — Listar categorias

**Acesso:** Público

O resultado vem ordenado pelo nome.

**Exemplo de resposta — `200 OK`:**

```json
[
  { "id": 3, "nome": "Fertilizantes" },
  { "id": 2, "nome": "Sementes de alimentos" },
  { "id": 1, "nome": "Sementes de flores" }
]
```

**Possíveis respostas:**

| Código | Situação | Exemplo |
|---|---|---|
| 200 | Lista retornada | — |
| 500 | Erro interno | `{ "erro": "Não foi possível buscar as categorias." }` |

---

#### `POST /api/categorias` — Cadastrar categoria

**Acesso:** Admin

**Corpo da requisição:**

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `nome` | texto | Sim | Mínimo de 2 caracteres e não pode repetir o nome de outra categoria |

**Exemplo de requisição:**

```http
POST /api/categorias
Content-Type: application/json

{ "nome": "Mudas" }
```

**Exemplo de resposta — `201 Created`:**

```json
{ "id": 4, "nome": "Mudas" }
```

**Possíveis respostas:**

| Código | Situação | Exemplo |
|---|---|---|
| 201 | Categoria criada | — |
| 400 | Dados inválidos | `{ "erro": "O nome precisa ter pelo menos 2 letras." }` |
| 401 | Não está logado | `{ "erro": "Faça login para continuar." }` |
| 403 | Não é admin | `{ "erro": "Você não tem permissão para esta ação." }` |
| 409 | Nome repetido | `{ "erro": "Já existe uma categoria com esse nome." }` |
| 500 | Erro interno | `{ "erro": "Não foi possível criar a categoria." }` |

---

#### `PUT /api/categorias/{id}` — Editar categoria

**Acesso:** Admin

**Parâmetro de rota:** `id` — número inteiro maior que zero.

**Corpo da requisição:** igual ao cadastro (`nome`).

**Exemplo de requisição:**

```http
PUT /api/categorias/4
Content-Type: application/json

{ "nome": "Mudas e plantas" }
```

**Exemplo de resposta — `200 OK`:**

```json
{ "id": 4, "nome": "Mudas e plantas" }
```

**Possíveis respostas:**

| Código | Situação | Exemplo |
|---|---|---|
| 200 | Categoria atualizada | — |
| 400 | `id` inválido | `{ "erro": "Código de categoria inválido." }` |
| 400 | Dados inválidos | `{ "erro": "O nome precisa ter pelo menos 2 letras." }` |
| 401 | Não está logado | `{ "erro": "Faça login para continuar." }` |
| 403 | Não é admin | `{ "erro": "Você não tem permissão para esta ação." }` |
| 404 | Categoria não existe | `{ "erro": "Categoria não encontrada." }` |
| 409 | Nome repetido | `{ "erro": "Já existe uma categoria com esse nome." }` |
| 500 | Erro interno | `{ "erro": "Não foi possível atualizar a categoria." }` |

---

#### `DELETE /api/categorias/{id}` — Excluir categoria

**Acesso:** Admin

**Parâmetro de rota:** `id` — número inteiro maior que zero.

Uma categoria que ainda tem produtos **não pode ser excluída**.

**Exemplo de requisição:**

```http
DELETE /api/categorias/4
```

**Exemplo de resposta — `200 OK`:**

```json
{ "ok": true }
```

**Possíveis respostas:**

| Código | Situação | Exemplo |
|---|---|---|
| 200 | Categoria excluída | — |
| 400 | `id` inválido | `{ "erro": "Código de categoria inválido." }` |
| 401 | Não está logado | `{ "erro": "Faça login para continuar." }` |
| 403 | Não é admin | `{ "erro": "Você não tem permissão para esta ação." }` |
| 404 | Categoria não existe | `{ "erro": "Categoria não encontrada." }` |
| 409 | Categoria tem produtos | `{ "erro": "Essa categoria ainda tem produtos e não pode ser excluída." }` |
| 500 | Erro interno | `{ "erro": "Não foi possível excluir a categoria." }` |

---

### Pedidos (cliente)

#### `GET /api/pedidos` — Listar meus pedidos

**Acesso:** Logado

Retorna **apenas os pedidos do usuário logado**, do mais recente para o mais antigo, cada um com a lista de itens.

**Parâmetros de consulta (query string) — todos opcionais:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `status` | texto | `pendente`, `pago`, `enviado` ou `cancelado` |
| `de` | data `AAAA-MM-DD` | Pedidos feitos a partir desta data |
| `ate` | data `AAAA-MM-DD` | Pedidos feitos até esta data (inclusive) |

**Exemplo de requisição:**

```http
GET /api/pedidos?status=pendente&de=2026-11-01&ate=2026-11-30
```

**Exemplo de resposta — `200 OK`:**

```json
[
  {
    "id": 3,
    "status": "pendente",
    "total": "37.00",
    "criado_em": "2026-11-03T04:55:00.000Z",
    "itens": [
      {
        "pedido_id": 3,
        "produto_id": 1,
        "nome": "Girassol Sol Noturno",
        "quantidade": 1,
        "preco_unitario": "12.00"
      },
      {
        "pedido_id": 3,
        "produto_id": 2,
        "nome": "Hibisco Rosa",
        "quantidade": 1,
        "preco_unitario": "10.00"
      },
      {
        "pedido_id": 3,
        "produto_id": 9,
        "nome": "Sulfato de Magnésio",
        "quantidade": 1,
        "preco_unitario": "15.00"
      }
    ]
  }
]
```

**Possíveis respostas:**

| Código | Situação | Exemplo |
|---|---|---|
| 200 | Lista retornada (pode ser vazia) | — |
| 400 | Status inválido | `{ "erro": "Status inválido." }` |
| 400 | Data fora do formato `AAAA-MM-DD` | `{ "erro": "Data inválida." }` |
| 401 | Não está logado | `{ "erro": "Faça login para continuar." }` |
| 500 | Erro interno | `{ "erro": "Não foi possível buscar os pedidos." }` |

---

#### `POST /api/pedidos` — Criar pedido

**Acesso:** Logado

O pedido é criado para o usuário logado, com status `pendente`. Funcionamento:

- O **preço de cada item é buscado no banco**, e não enviado pelo cliente.
- O estoque de cada produto é verificado e, se houver quantidade suficiente, é **descontado**.
- Itens repetidos do mesmo produto são somados.
- Tudo acontece em uma **transação**: se algum item falhar, nada é gravado.

**Corpo da requisição:**

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `itens` | lista | Sim | Pelo menos 1 item |
| `itens[].produto_id` | número inteiro | Sim | `id` de um produto existente |
| `itens[].quantidade` | número inteiro | Sim | Mínimo 1 |

**Exemplo de requisição:**

```http
POST /api/pedidos
Content-Type: application/json

{
  "itens": [
    { "produto_id": 1, "quantidade": 2 },
    { "produto_id": 9, "quantidade": 1 }
  ]
}
```

**Exemplo de resposta — `201 Created`:**

```json
{
  "id": 4,
  "status": "pendente",
  "total": 39
}
```

**Possíveis respostas:**

| Código | Situação | Exemplo |
|---|---|---|
| 201 | Pedido criado | — |
| 400 | Corpo não é um JSON válido | `{ "erro": "Corpo da requisição inválido." }` |
| 400 | Dados inválidos | `{ "erro": "O pedido precisa ter pelo menos um item." }` |
| 401 | Não está logado | `{ "erro": "Faça login para continuar." }` |
| 404 | Produto não existe | `{ "erro": "Produto 99 não encontrado." }` |
| 409 | Estoque insuficiente | `{ "erro": "Estoque insuficiente para Cosmos." }` |
| 500 | Erro interno | `{ "erro": "Não foi possível criar o pedido." }` |

---

### Pedidos (administração)

#### `GET /api/admin/pedidos` — Listar todos os pedidos

**Acesso:** Admin

Funciona como `GET /api/pedidos`, mas retorna os pedidos de **todos os usuários**, incluindo o nome e o e-mail do cliente.

**Parâmetros de consulta:** os mesmos de `GET /api/pedidos` (`status`, `de`, `ate`).

**Exemplo de requisição:**

```http
GET /api/admin/pedidos?status=pago
```

**Exemplo de resposta — `200 OK`:**

```json
[
  {
    "id": 2,
    "status": "pago",
    "total": "20.00",
    "criado_em": "2026-11-02T18:30:00.000Z",
    "cliente": "Maria Souza",
    "email": "maria@email.com",
    "itens": [
      {
        "pedido_id": 2,
        "produto_id": 5,
        "nome": "Milho Vermelho",
        "quantidade": 2,
        "preco_unitario": "10.00"
      }
    ]
  }
]
```

**Possíveis respostas:**

| Código | Situação | Exemplo |
|---|---|---|
| 200 | Lista retornada (pode ser vazia) | — |
| 400 | Status inválido | `{ "erro": "Status inválido." }` |
| 400 | Data fora do formato `AAAA-MM-DD` | `{ "erro": "Data inválida." }` |
| 401 | Não está logado | `{ "erro": "Faça login para continuar." }` |
| 403 | Não é admin | `{ "erro": "Você não tem permissão para esta ação." }` |
| 500 | Erro interno | `{ "erro": "Não foi possível buscar os pedidos." }` |

---

#### `PUT /api/admin/pedidos/{id}` — Alterar status do pedido

**Acesso:** Admin

**Parâmetro de rota:** `id` — número inteiro maior que zero.

Regras:

- Ao mudar o status para **`cancelado`**, as quantidades dos itens **voltam para o estoque**.
- Um pedido **cancelado não pode ser reaberto** (não pode mudar para outro status).

**Corpo da requisição:**

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `status` | texto | Sim | `pendente`, `pago`, `enviado` ou `cancelado` |

**Exemplo de requisição:**

```http
PUT /api/admin/pedidos/2
Content-Type: application/json

{ "status": "enviado" }
```

**Exemplo de resposta — `200 OK`:**

```json
{ "id": 2, "status": "enviado" }
```

**Possíveis respostas:**

| Código | Situação | Exemplo |
|---|---|---|
| 200 | Status alterado | — |
| 400 | `id` inválido | `{ "erro": "Código de pedido inválido." }` |
| 400 | Corpo não é um JSON válido | `{ "erro": "Corpo da requisição inválido." }` |
| 400 | Status inválido | `{ "erro": "Status inválido." }` |
| 401 | Não está logado | `{ "erro": "Faça login para continuar." }` |
| 403 | Não é admin | `{ "erro": "Você não tem permissão para esta ação." }` |
| 404 | Pedido não existe | `{ "erro": "Pedido não encontrado." }` |
| 409 | Pedido cancelado | `{ "erro": "Um pedido cancelado não pode ser reaberto." }` |
| 500 | Erro interno | `{ "erro": "Não foi possível atualizar o pedido." }` |

---

## Códigos HTTP utilizados

| Código | Nome | Quando é usado |
|---|---|---|
| **200** | OK | Consulta, edição, exclusão, login ou logout feitos com sucesso |
| **201** | Created | Usuário, produto, categoria ou pedido criado |
| **400** | Bad Request | Dados inválidos, `id` inválido, filtro inválido ou JSON mal formatado |
| **401** | Unauthorized | Usuário não está logado, ou e-mail/senha incorretos |
| **403** | Forbidden | Usuário logado tentando acessar uma rota exclusiva de admin |
| **404** | Not Found | Registro (usuário, produto, categoria ou pedido) não encontrado |
| **409** | Conflict | Conflito com dados existentes: e-mail ou nome repetido, estoque insuficiente, exclusão bloqueada por relacionamento, pedido cancelado |
| **500** | Internal Server Error | Erro inesperado no servidor ou no banco de dados |

---

## Testando com o Postman

1. Faça o cadastro em `POST /api/usuarios`.
2. Faça login em `POST /api/login`. O Postman guarda o cookie `token` automaticamente e o envia nas próximas requisições para o mesmo endereço.
3. Teste as rotas que exigem login, como `GET /api/perfil` ou `POST /api/pedidos`.
4. Para testar as rotas de **admin**, torne o usuário administrador (veja [Criando um administrador](#criando-um-administrador)) e faça login novamente.
5. Para sair, use `POST /api/logout`.

> Nas requisições com corpo, selecione **Body → raw → JSON** no Postman.
