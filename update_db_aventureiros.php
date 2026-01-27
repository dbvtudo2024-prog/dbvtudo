<?php
require_once 'includes/config.php';
require_once 'includes/conexao.php';

echo "Iniciando atualização do banco de dados...\n";

$tables = [
    'especialidades',
    'classes',
    'historia',
    'emblemas',
    'uniformes',
    'ideais',
    'livros',
    'manuais',
    'videos',
    'estudos',
    'materiais'
];

foreach ($tables as $table) {
    try {
        // Verificar se a coluna já existe
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :table AND COLUMN_NAME = 'publico_alvo'");
        $stmt->execute([':db' => DB_NAME, ':table' => $table]);
        
        if ((int)$stmt->fetchColumn() === 0) {
            echo "Adicionando coluna 'publico_alvo' na tabela '$table'...\n";
            $sql = "ALTER TABLE $table ADD COLUMN publico_alvo VARCHAR(20) DEFAULT 'Desbravador'";
            $pdo->exec($sql);
            echo "Sucesso: Tabela '$table' atualizada.\n";
        } else {
            echo "Info: Tabela '$table' já possui a coluna 'publico_alvo'.\n";
        }
    } catch (PDOException $e) {
        echo "Erro ao atualizar tabela '$table': " . $e->getMessage() . "\n";
    }
}

echo "Atualização concluída.";
