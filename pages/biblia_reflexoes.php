<a href="index.php?p=biblia_mais" class="btn-back-standard">Voltar</a>
<h2>Reflexões</h2>
<?php
$pdo->exec("CREATE TABLE IF NOT EXISTS biblia_reflexoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    tema VARCHAR(255) NULL,
    texto TEXT NULL,
    created_at DATE NOT NULL
)");
if ($_SERVER['REQUEST_METHOD']==='POST' && isset($_POST['new_reflex'])) {
    $uid = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
    $tema = trim($_POST['tema'] ?? '');
    $texto = trim($_POST['texto'] ?? '');
    $pdo->prepare("INSERT INTO biblia_reflexoes (user_id, tema, texto, created_at) VALUES (?,?,?,?)")
        ->execute([$uid, $tema, $texto, date('Y-m-d')]);
    header("Location: index.php?p=biblia_reflexoes"); exit;
}
if (isset($_GET['action']) && $_GET['action']==='delete' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $pdo->prepare("DELETE FROM biblia_reflexoes WHERE id=?")->execute([$id]);
    header("Location: index.php?p=biblia_reflexoes"); exit;
}
$uid = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
$stmt = $pdo->prepare("SELECT * FROM biblia_reflexoes WHERE (user_id <=> ? OR user_id IS NULL) ORDER BY created_at DESC, id DESC");
$stmt->execute([$uid]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<div class="form-container" style="max-width:780px; margin-bottom:12px;">
    <form method="POST" style="display:grid; grid-template-columns:1fr; gap:10px;">
        <input type="hidden" name="new_reflex" value="1">
        <input class="form-control" name="tema" placeholder="Tema">
        <textarea class="form-control" name="texto" placeholder="Escreva sua reflexão..."></textarea>
        <button class="btn-new" type="submit">Salvar</button>
    </form>
<?php foreach ($rows as $r): ?>
    <div class="card" style="margin-top:12px;">
        <div class="card-body">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight:700;"><?php echo htmlspecialchars($r['tema']); ?></div>
                <a href="index.php?p=biblia_reflexoes&action=delete&id=<?php echo (int)$r['id']; ?>" style="color:#d32f2f;" onclick="return confirm('Excluir reflexão?')">Excluir</a>
            </div>
            <div style="font-size:12px; color:#777; margin-top:4px;"><?php echo date('d/m/Y', strtotime($r['created_at'])); ?></div>
            <div style="margin-top:8px;"><?php echo nl2br(htmlspecialchars($r['texto'])); ?></div>
        </div>
    </div>
<?php endforeach; ?>
<?php if (!$rows): ?>
    <div class="card" style="margin-top:12px;">
        <div class="card-body">Nenhuma reflexão.</div>
    </div>
<?php endif; ?>
</div>
