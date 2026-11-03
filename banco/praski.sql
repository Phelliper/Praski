CREATE DATABASE IF NOT EXISTS praski
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE praski;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  tipo ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  embalagem VARCHAR(20),
  estoque INT NOT NULL DEFAULT 0,
  imagem VARCHAR(150),
  categoria_id INT NOT NULL,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  status ENUM('pendente', 'pago', 'enviado', 'cancelado') NOT NULL DEFAULT 'pendente',
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE itens_pedido (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  produto_id INT NOT NULL,
  quantidade INT NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

INSERT INTO categorias (nome) VALUES
  ('Sementes de flores'), ('Sementes de alimentos'), ('Fertilizantes');

INSERT INTO produtos (nome, descricao, preco, embalagem, estoque, imagem, categoria_id) VALUES
  ('Girassol Sol Noturno', 'Girassol exótico com pétalas vermelhas e amarelas, de 2 a 3 metros de altura.', 12.00, '250g', 40, 'girassol-sol-noturno.png', 1),
  ('Hibisco Rosa', 'Planta ornamental de flores grandes e coloridas, ótima para cercas vivas.', 10.00, '250g', 25, 'hibisco-rosa.png', 1),
  ('Cosmos', 'Flor de cultivo fácil, floresce em cerca de 10 semanas e atrai polinizadores.', 9.00, '250g', 8, 'cosmos.png', 1),
  ('Erva de Gato (Catnip)', 'Erva natural que atrai e estimula os gatos. Cresce bem em vasos.', 10.00, '250g', 30, 'erva-de-gato.png', 1),
  ('Milho Vermelho', 'Milho crioulo de grãos avermelhados, usado em farinhas e pães.', 10.00, '250g', 35, 'milho-vermelho.png', 2),
  ('Milho Branco', 'Milho de grãos claros e sabor suave, bom para canjica e pipoca.', 10.00, '250g', 6, 'milho-branco.png', 2),
  ('Feijão Espada', 'Trepadeira de até 10 metros, com vagens comestíveis e fonte de ferro.', 15.00, '350g', 20, 'feijao-espada.png', 2),
  ('Cruá Vermelho', 'Trepadeira vigorosa para cercas e pergolados, com frutos ornamentais.', 10.00, '250g', 15, 'crua-vermelho.png', 2),
  ('Sulfato de Magnésio', 'Sal de Epsom, rico em magnésio e enxofre. Corrige deficiências na planta.', 15.00, '1kg', 50, 'sulfato-de-magnesio.png', 3),
  ('Sulfato de Manganês', 'Fertilizante com 30% de manganês, essencial para a fotossíntese.', 15.00, '1kg', 45, 'sulfato-de-manganes.png', 3),
  ('Sulfato de Amônio', 'Fornece nitrogênio e enxofre para cultivos que pedem muito nutriente.', 15.00, '1kg', 9, 'sulfato-de-amonio.png', 3),
  ('Sulfato de Potássio', 'Fertilizante com 48% de potássio e sem cloro, bom para culturas sensíveis.', 15.00, '1kg', 38, 'sulfato-de-potassio.png', 3),
  ('Nitrato de Potássio', 'Fornece nitrogênio e potássio. Ideal para hortaliças, folhas e frutos.', 15.00, '1kg', 42, 'nitrato-de-potassio.png', 3),
  ('Fosfato Monoamônico', 'Rico em fósforo e nitrogênio, perfeito para solos tropicais.', 15.00, '1kg', 28, 'fosfato-monoamonico.png', 3),
  ('Ácido Bórico', 'Micronutriente que ajuda raízes, flores e frutos e corrige falta de boro.', 15.00, '1kg', 5, 'acido-borico.png', 3),
  ('Zeólita', 'Mineral poroso que libera nutrientes devagar e ajuda o solo a reter água.', 20.00, '1kg', 22, 'zeolita.png', 3);

-- Usuário administrador inicial (senha: praski@2026, criptografada com bcrypt)
-- Troque a senha pela página "Meu perfil" depois do primeiro login.
INSERT INTO usuarios (nome, email, senha_hash, tipo) VALUES
  ('Phellipe Rodrigues da Conceição', 'phellipe.rodrigues.con@gmail.com', '$2b$10$lkr0YzTHOCoB.gqqWKc7uOzK/ir7lYOK9eNs0RAbIvyp1en0YX95G', 'admin');
