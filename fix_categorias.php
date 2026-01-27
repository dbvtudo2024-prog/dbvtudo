<?php
require_once 'includes/config.php';
require_once 'includes/conexao.php';

echo "<h2>Corrigindo categorias...</h2><pre>";

$updates = [
    'Adra' => ['adra'],
    'Artes e Habilidades Manuais' => ['artes e habilidades manuais'],
    'Atividades Agrícolas' => ['atividades agricolas', 'atividades agrícolas'],
    'Atividades Missionárias e Comunitárias' => ['atividades missionarias', 'atividades missionárias', 'atividades missionarias e comunitarias', 'atividades missionárias e comunitárias'],
    'Atividades Profissionais' => ['atividades profissionais'],
    'Atividades Recreativas' => ['atividades recreativas'],
    'Ciência e Saúde' => ['ciencia e saude', 'ciência e saúde'],
    'Ensinos Bíblicos' => ['ensinos biblicos', 'ensinos bíblicos'],
    'Estudo da Natureza' => ['estudo da natureza'],
    'Habilidades Domésticas' => ['habilidades domesticas', 'habilidades domésticas'],
    'Mestrados' => ['mestrados']
];

$count = 0;
foreach ($updates as $correct => $wrongs) {
    foreach ($wrongs as $wrong) {
        $stmt = $pdo->prepare("UPDATE especialidades SET area = :correct WHERE LOWER(area) = :wrong");
        $stmt->execute([':correct' => $correct, ':wrong' => $wrong]);
        $rows = $stmt->rowCount();
        if ($rows > 0) {
            echo "Corrigido '{$wrong}' -> '{$correct}' ({$rows} registros)\n";
            $count += $rows;
        }
    }
}

echo "\nTotal corrigido: $count\n";
echo "Concluído.</pre>";
?>