<?php
require_once 'includes/config.php';
require_once 'includes/conexao.php';

echo "<h2>Diagnóstico de Quantidade</h2>";

// Contar total de registros
$stmt = $pdo->query("SELECT COUNT(*) FROM especialidades");
$total = $stmt->fetchColumn();

echo "<p>Total de registros na tabela 'especialidades': <strong>{$total}</strong></p>";

// Listar IDs
echo "<h3>IDs encontrados (primeiros 50):</h3>";
$stmt = $pdo->query("SELECT id, especialidade_id, nome FROM especialidades LIMIT 50");
echo "<ul>";
while ($row = $stmt->fetch()) {
    echo "<li>ID: {$row['id']} | Espec. ID: {$row['especialidade_id']} | Nome: {$row['nome']}</li>";
}
echo "</ul>";
?>