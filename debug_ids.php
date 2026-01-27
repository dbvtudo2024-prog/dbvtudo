<?php
require_once 'includes/config.php';
require_once 'includes/conexao.php';

echo "<h2>Verificação de IDs</h2>";

// Checar IDs vazios
$stmt = $pdo->query("SELECT id, especialidade_id, nome FROM especialidades WHERE especialidade_id = '' OR especialidade_id IS NULL");
$vazios = $stmt->fetchAll();
echo "<h3>IDs Vazios/Nulos: " . count($vazios) . "</h3>";
foreach ($vazios as $r) {
    echo "ID: {$r['id']} | EspecID: [{$r['especialidade_id']}] | Nome: {$r['nome']}<br>";
}

// Checar IDs duplicados
$stmt = $pdo->query("SELECT especialidade_id, COUNT(*) as qtd FROM especialidades GROUP BY especialidade_id HAVING qtd > 1");
$duplicados = $stmt->fetchAll();
echo "<h3>IDs Duplicados: " . count($duplicados) . "</h3>";
foreach ($duplicados as $r) {
    echo "EspecID: [{$r['especialidade_id']}] | Qtd: {$r['qtd']}<br>";
}

// Listar todos os IDs para ver se parecem corretos
$stmt = $pdo->query("SELECT especialidade_id FROM especialidades ORDER BY especialidade_id LIMIT 20");
echo "<h3>Amostra de IDs:</h3>";
while ($r = $stmt->fetch()) {
    echo "[{$r['especialidade_id']}] ";
}
?>