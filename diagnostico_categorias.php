<?php
require_once 'includes/config.php';
require_once 'includes/conexao.php';

echo "<h2>Diagnóstico de Categorias</h2>";

// 1. Categorias esperadas pelo site
$categoriasEsperadas = [
    'Adra',
    'Artes e Habilidades Manuais',
    'Atividades Agrícolas',
    'Atividades Missionárias e Comunitárias',
    'Atividades Profissionais',
    'Atividades Recreativas',
    'Ciência e Saúde',
    'Ensinos Bíblicos',
    'Estudo da Natureza',
    'Habilidades Domésticas',
    'Mestrados'
];

echo "<h3>1. Categorias esperadas pelo site:</h3><ul>";
foreach ($categoriasEsperadas as $cat) {
    echo "<li>" . htmlspecialchars($cat) . "</li>";
}
echo "</ul>";

// 2. Categorias presentes no banco
echo "<h3>2. Categorias encontradas no banco (agrupadas):</h3>";
echo "<table border='1' cellpadding='5'><tr><th>Categoria no Banco</th><th>Quantidade</th><th>Status</th></tr>";

$stmt = $pdo->query("SELECT COALESCE(area, 'NULL') as area_nome, COUNT(*) as qtd FROM especialidades GROUP BY area ORDER BY area ASC");
$bancoCategorias = [];

while ($row = $stmt->fetch()) {
    $areaBanco = $row['area_nome'];
    $qtd = $row['qtd'];
    if ($areaBanco === 'NULL' || $areaBanco === '') $areaBanco = '[VAZIO/NULL]';
    
    $bancoCategorias[] = $areaBanco;
    
    $status = in_array($areaBanco, $categoriasEsperadas) ? "<span style='color:green'>OK (Visível)</span>" : "<span style='color:red'>ERRO (Invisível - nome diferente)</span>";
    
    echo "<tr>";
    echo "<td>" . htmlspecialchars($areaBanco) . "</td>";
    echo "<td>" . $qtd . "</td>";
    echo "<td>" . $status . "</td>";
    echo "</tr>";
}
echo "</table>";

// 3. Verificação de diferenças invisíveis (espaços extras, caracteres ocultos)
echo "<h3>3. Análise detalhada (Hex dump) para detectar caracteres ocultos:</h3>";
echo "<pre>";
foreach ($bancoCategorias as $cat) {
    echo "Categoria: [" . $cat . "]\n";
    echo "Hex: ";
    for ($i = 0; $i < strlen($cat); $i++) {
        echo dechex(ord($cat[$i])) . " ";
    }
    echo "\n--------------------------------\n";
}
echo "</pre>";
?>