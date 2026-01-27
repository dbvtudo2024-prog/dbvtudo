<a href="index.php?p=biblia_mais" class="btn-back-standard">Voltar</a>
<h2>Anotações</h2>
<?php
$pdo->exec("CREATE TABLE IF NOT EXISTS biblia_notas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    titulo VARCHAR(255) NULL,
    texto TEXT NULL,
    referencia VARCHAR(120) NULL,
    created_at DATE NOT NULL
)");
if ($_SERVER['REQUEST_METHOD']==='POST' && isset($_POST['new_note'])) {
    $uid = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
    $t = trim($_POST['titulo'] ?? '');
    $r = trim($_POST['referencia'] ?? '');
    $x = trim($_POST['texto'] ?? '');
    $pdo->prepare("INSERT INTO biblia_notas (user_id, titulo, texto, referencia, created_at) VALUES (?,?,?,?,?)")
        ->execute([$uid, $t, $x, $r, date('Y-m-d')]);
    header("Location: index.php?p=biblia_anotacoes"); exit;
}
if (isset($_GET['action']) && $_GET['action']==='delete' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $pdo->prepare("DELETE FROM biblia_notas WHERE id=?")->execute([$id]);
    header("Location: index.php?p=biblia_anotacoes"); exit;
}
$q = isset($_GET['q']) ? trim($_GET['q']) : '';
$uid = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
$sql = "SELECT * FROM biblia_notas WHERE 1";
$params = [];
if ($uid) { $sql .= " AND (user_id <=> ? OR user_id IS NULL)"; $params[] = $uid; }
if ($q!=='') { $sql .= " AND (titulo LIKE ? OR texto LIKE ? OR referencia LIKE ?)"; $params[]="%{$q}%"; $params[]="%{$q}%"; $params[]="%{$q}%"; }
$sql .= " ORDER BY created_at DESC, id DESC";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<div class="form-container" style="max-width:780px; margin-bottom:12px;">
    <form method="POST" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <input type="hidden" name="new_note" value="1">
        <input class="form-control" name="titulo" placeholder="Título">
        <input class="form-control" name="referencia" placeholder="Referência (ex: Hebreus 11:1)">
        <textarea class="form-control" name="texto" placeholder="Escreva sua anotação..." style="grid-column: 1 / -1;"></textarea>
        <button class="btn-new" type="submit" style="grid-column: 1 / -1;">Salvar</button>
    </form>
</div>
<div class="search-wrap" style="max-width:780px; margin-bottom:12px;">
    <form method="GET" class="search-form">
        <input type="hidden" name="p" value="biblia_anotacoes">
        <input class="search-input" name="q" value="<?php echo htmlspecialchars($q); ?>" placeholder="Buscar anotações...">
        <button class="search-button" type="submit">Buscar</button>
    </form>
</div>
<?php foreach ($rows as $r): ?>
    <div class="card" style="max-width:780px; margin-bottom:12px;">
        <div class="card-body">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight:700;"><?php echo htmlspecialchars($r['titulo']); ?></div>
                <a href="index.php?p=biblia_anotacoes&action=delete&id=<?php echo (int)$r['id']; ?>" style="color:#d32f2f;" onclick="return confirm('Excluir anotação?')">Excluir</a>
            </div>
            <div style="font-size:12px; color:#777; margin-top:4px;"><?php echo date('d/m/Y', strtotime($r['created_at'])); ?></div>
            <?php if (!empty($r['referencia'])): ?>
            <div style="display:inline-block; background:#e9f2ff; color:#1e88e5; border-radius:10px; padding:6px 10px; font-size:12px; margin-top:8px;"><?php echo htmlspecialchars($r['referencia']); ?></div>
            <?php endif; ?>
            <div style="margin-top:8px;"><?php echo nl2br(htmlspecialchars(isset($r['texto']) ? $r['texto'] : '')); ?></div>
        </div>
    </div>
<?php endforeach; ?>
<?php if (!$rows): ?>
    <div class="card" style="max-width:780px;">
        <div class="card-body">Nenhuma anotação.</div>
    </div>
<?php endif; ?>
