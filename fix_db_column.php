<?php
require_once 'includes/config.php';
require_once 'includes/conexao.php';

try {
    // Aumentar o tamanho da coluna 'clube' para 255 caracteres
    $pdo->exec("ALTER TABLE usuarios MODIFY COLUMN clube VARCHAR(255)");
    echo "Coluna 'clube' atualizada com sucesso para VARCHAR(255).";
} catch (PDOException $e) {
    echo "Erro ao atualizar coluna: " . $e->getMessage();
}
?>