<a href="index.php?p=biblia_mais" class="btn-back-standard">Voltar</a>
<h2>Dicionário Bíblico</h2>
<?php
$pdo->exec("CREATE TABLE IF NOT EXISTS biblia_dicionario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    nome TEXT NULL,
    texto TEXT NULL,
    categoria TEXT NULL,
    referencia TEXT NULL
)");
$q = isset($_GET['q']) ? trim($_GET['q']) : '';
$stmt = $q !== '' 
    ? $pdo->prepare("SELECT * FROM biblia_dicionario WHERE nome LIKE :q OR texto LIKE :q ORDER BY nome ASC")
    : $pdo->query("SELECT * FROM biblia_dicionario ORDER BY nome ASC");
if ($q !== '') { $stmt->bindValue(':q', "%{$q}%"); $stmt->execute(); }
$items = $q !== '' ? $stmt->fetchAll(PDO::FETCH_ASSOC) : $stmt->fetchAll(PDO::FETCH_ASSOC);
$count = count($items);
?>
<div class="search-wrap" style="max-width:700px; margin-bottom:12px;">
    <form method="GET" class="search-form">
        <input type="hidden" name="p" value="biblia_dicionario">
        <input class="search-input" name="q" value="<?php echo htmlspecialchars($q); ?>" placeholder="Buscar termo...">
        <button class="search-button" type="submit">Buscar</button>
    </form>
    <div style="font-size:12px; color:#777; margin-top:6px;"><?php echo (int)$count; ?> termos</div>
<?php
$currentHeader = '';
foreach ($items as $it) {
    $first = mb_strtoupper(mb_substr(trim($it['nome'] ?? ''), 0, 1, 'UTF-8'), 'UTF-8');
    if ($first && $first !== $currentHeader) {
        if ($currentHeader !== '') { echo "</div>"; }
        echo "<h3 style=\"margin-top:16px;\">{$first}</h3>";
        echo "<div style=\"display:flex; flex-direction:column; gap:10px;\">";
        $currentHeader = $first;
    }
    $nome = $it['nome'] ?? '';
    $cat = $it['categoria'] ?? '';
    $texto = $it['texto'] ?? '';
    $ref = $it['referencia'] ?? '';
    echo "<div class=\"card\" style=\"border-radius:12px;\">";
    echo "<div class=\"card-body\">";
    echo "<div style=\"font-weight:700;\">".htmlspecialchars($nome)."</div>";
    if ($cat) { echo "<div class=\"badge\" style=\"margin-top:6px;\">".htmlspecialchars($cat)."</div>"; }
    echo "<div style=\"color:#555; margin-top:6px;\">".htmlspecialchars(mb_substr($texto,0,220)).(mb_strlen($texto)>220?'...':'')."</div>";
    if ($ref) { echo "<div style=\"font-size:12px; color:#777; margin-top:6px;\">".htmlspecialchars($ref)."</div>"; }
    echo "</div></div>";
}
if ($currentHeader !== '') { echo "</div>"; }
if ($count === 0) {
    echo "<div class=\"card\"><div class=\"card-body\">Nenhum termo encontrado.</div></div>";
}
?>
