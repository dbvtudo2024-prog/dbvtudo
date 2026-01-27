<a href="index.php?p=biblia_mais" class="btn-back-standard">Voltar</a>
<h2>Versículos Marcados</h2>
<?php
$pdo->exec("CREATE TABLE IF NOT EXISTS biblia_favoritos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    livro VARCHAR(80) NULL,
    capitulo INT NULL,
    verso INT NULL,
    texto TEXT NULL,
    created_at DATE NOT NULL
)");
if (isset($_GET['action']) && $_GET['action']==='delete' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $pdo->prepare("DELETE FROM biblia_favoritos WHERE id=?")->execute([$id]);
    header("Location: index.php?p=biblia_favoritos"); exit;
}
$uid = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
$sql = "SELECT * FROM biblia_favoritos WHERE 1";
$params = [];
if ($uid) { $sql .= " AND (user_id <=> ? OR user_id IS NULL)"; $params[] = $uid; }
$sql .= " ORDER BY created_at DESC, id DESC";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<div style="font-size:12px; color:#777; margin-top:-4px; margin-bottom:12px;"><?php echo count($rows); ?> versículos salvos</div>
<?php foreach ($rows as $r): 
    $ref = trim(($r['livro'] ?? '').' '.(int)($r['capitulo'] ?? 0).':'.(int)($r['verso'] ?? 0));
?>
    <div class="card" style="max-width:780px; margin-bottom:12px;">
        <div class="card-body">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <a href="index.php?p=biblia_capitulo&livro=<?php echo urlencode($r['livro']); ?>&capitulo=<?php echo (int)$r['capitulo']; ?>" style="font-weight:700; color:#1e88e5;"><?php echo htmlspecialchars($ref); ?></a>
                <div style="display:flex; gap:10px; align-items:center;">
                    <a href="index.php?p=biblia_favoritos&action=delete&id=<?php echo (int)$r['id']; ?>" style="color:#d32f2f;" onclick="return confirm('Remover favorito?')">Excluir</a>
                </div>
            </div>
            <div style="font-size:12px; color:#777; margin-top:4px;"><?php echo date('d/m/Y', strtotime($r['created_at'])); ?></div>
            <div style="margin-top:8px;">"<?php echo nl2br(htmlspecialchars($r['texto'])); ?>"</div>
        </div>
    </div>
<?php endforeach; ?>
<?php if (!$rows): ?>
    <div class="card" style="max-width:780px;">
        <div class="card-body">Nenhum versículo marcado.</div>
    </div>
<?php endif; ?>
