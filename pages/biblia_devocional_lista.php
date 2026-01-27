<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/conexao.php';
$stmt = $pdo->query("SELECT titulo, referencia, created_at FROM biblia_devocionais ORDER BY created_at DESC, id DESC");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<a href="index.php?p=biblia" class="btn-back-standard">Voltar</a>
<h2>Devocionais Anteriores</h2>
<div style="color:#777; margin-top:-8px; margin-bottom:12px;">Histórico completo dos devocionais</div>
<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap:12px; padding:12px 0;">
<?php foreach ($rows as $a): ?>
    <div class="card">
        <div class="card-body">
            <div style="font-weight:700;"><?php echo htmlspecialchars($a['titulo']); ?></div>
            <div style="font-size:12px; color:#777; margin-top:4px;"><?php echo htmlspecialchars($a['referencia']); ?> • <?php echo date('d/m/Y', strtotime($a['created_at'])); ?></div>
        </div>
    </div>
<?php endforeach; ?>
</div>
