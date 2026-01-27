<?php
require_once 'includes/config.php';
require_once 'includes/conexao.php';

echo "<h2>Estrutura da Tabela especialidades</h2>";
$stmt = $pdo->query("SHOW CREATE TABLE especialidades");
$row = $stmt->fetch(PDO::FETCH_ASSOC);
echo "<pre>" . htmlspecialchars($row['Create Table']) . "</pre>";

echo "<h2>Verificar Duplicidade de especialidade_id</h2>";
$stmt = $pdo->query("SELECT especialidade_id, COUNT(*) as qtd FROM especialidades GROUP BY especialidade_id HAVING qtd > 1");
$duplicados = $stmt->fetchAll();
if ($duplicados) {
    echo "Existem IDs duplicados (o que é bom neste caso!):<br>";
    foreach($duplicados as $d) {
        echo "ID: {$d['especialidade_id']} - Qtd: {$d['qtd']}<br>";
    }
} else {
    echo "Não existem IDs duplicados (todos são únicos).<br>";
}
?>