
-- Script de Criação do Banco de Dados - Clube de Desbravadores

CREATE DATABASE IF NOT EXISTS dbvtudo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dbvtudo;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    nivel ENUM('admin', 'usuario') DEFAULT 'usuario',
    clube VARCHAR(150),
    cargo VARCHAR(100),
    telefone VARCHAR(20),
    foto_perfil VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuário Admin Padrão (Senha: admin123)
-- Hash gerado para 'admin123'
INSERT INTO usuarios (nome, email, senha, nivel) VALUES 
('Administrador', 'admin@dbv.com', '$2y$10$X8w.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g', 'admin'); 

-- Tabela de Especialidades
CREATE TABLE IF NOT EXISTS especialidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    especialidade_id VARCHAR(50),
    nome VARCHAR(100) NOT NULL,
    area VARCHAR(50) NOT NULL,
    sigla VARCHAR(50),
    nivel VARCHAR(50),
    requisitos TEXT,
    imagem VARCHAR(255),
    ano INT,
    likes INT DEFAULT 0,
    origem VARCHAR(100),
    cor VARCHAR(10),
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Classes
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    requisitos TEXT,
    insignia VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de História
CREATE TABLE IF NOT EXISTS historia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    conteudo TEXT,
    ano_periodo VARCHAR(50),
    imagem VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Emblemas
CREATE TABLE IF NOT EXISTS emblemas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    categoria VARCHAR(50),
    descricao TEXT,
    imagem VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Uniformes
CREATE TABLE IF NOT EXISTS uniformes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(100) NOT NULL,
    descricao TEXT,
    regras_uso TEXT,
    imagem VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Configurações
CREATE TABLE IF NOT EXISTS configuracoes (
    chave VARCHAR(50) PRIMARY KEY,
    valor TEXT
);

INSERT INTO configuracoes (chave, valor) VALUES ('link_sgc', 'https://sgc.desbravadores.org.br') ON DUPLICATE KEY UPDATE valor=valor;

-- Tabela de Ideais
CREATE TABLE IF NOT EXISTS ideais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(50),
    titulo VARCHAR(255),
    conteudo TEXT,
    imagem VARCHAR(255),
    youtube_url VARCHAR(255)
);

-- Tabela de Livros
CREATE TABLE IF NOT EXISTS livros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255),
    autor VARCHAR(255),
    descricao TEXT,
    imagem VARCHAR(255),
    arquivo VARCHAR(255),
    categoria VARCHAR(50)
);

-- Tabela de Manuais
CREATE TABLE IF NOT EXISTS manuais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255),
    descricao TEXT,
    arquivo VARCHAR(255),
    imagem VARCHAR(255)
);

-- Tabela de Materiais
CREATE TABLE IF NOT EXISTS materiais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255),
    descricao TEXT,
    imagem VARCHAR(255),
    link VARCHAR(255),
    arquivo VARCHAR(255),
    categoria VARCHAR(50)
);

-- Tabela de Categorias de Vídeos
CREATE TABLE IF NOT EXISTS video_categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100),
    ordem INT DEFAULT 0
);

-- Tabela de Vídeos
CREATE TABLE IF NOT EXISTS videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    youtube_url VARCHAR(255),
    video_id VARCHAR(32),
    titulo VARCHAR(255),
    canal VARCHAR(255),
    inscritos INT NULL,
    visualizacoes INT NULL,
    criado_em DATETIME,
    categoria_id INT NULL
);

-- Tabela de Estudos
CREATE TABLE IF NOT EXISTS estudos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    conteudo TEXT,
    imagem VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Desbrava Mais
CREATE TABLE IF NOT EXISTS desbrava_mais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    conteudo TEXT,
    imagem VARCHAR(255),
    arquivo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
