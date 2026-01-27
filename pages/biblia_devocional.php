<?php
$pdo->exec("CREATE TABLE IF NOT EXISTS biblia_devocionais (id INT AUTO_INCREMENT PRIMARY KEY, titulo VARCHAR(255), referencia VARCHAR(120), texto LONGTEXT, refletir TEXT, created_at DATE, UNIQUE KEY uniq_date (created_at))");
$pdo->exec("CREATE TABLE IF NOT EXISTS biblia_devocionais_agendados (id INT AUTO_INCREMENT PRIMARY KEY, titulo VARCHAR(255), referencia VARCHAR(120), texto LONGTEXT, refletir TEXT, scheduled_for DATE NOT NULL, published TINYINT(1) DEFAULT 0, published_at TIMESTAMP NULL, UNIQUE KEY uniq_sched (scheduled_for))");
$maxId = (int)$pdo->query("SELECT MAX(id) FROM biblia_versos")->fetchColumn();
$randId = $maxId > 0 ? random_int(1, $maxId) : 0;
$stmtRnd = $pdo->prepare("SELECT livro, capitulo, verso, texto FROM biblia_versos WHERE id >= ? ORDER BY id ASC LIMIT 1");
$stmtRnd->execute([$randId]);
$vd = $stmtRnd->fetch();
if (!$vd) { $vd = $pdo->query("SELECT livro, capitulo, verso, texto FROM biblia_versos ORDER BY id DESC LIMIT 1")->fetch(); }
$paramDate = isset($_GET['dt']) ? $_GET['dt'] : null;
$hoje = $paramDate ?: date('Y-m-d');
$rowPub = $pdo->prepare("SELECT * FROM biblia_devocionais WHERE created_at=? LIMIT 1");
$rowPub->execute([$hoje]);
$dev = $rowPub->fetch();
if (!$dev) {
    $rowHoje = $pdo->prepare("SELECT * FROM biblia_devocionais_agendados WHERE scheduled_for=? LIMIT 1");
    $rowHoje->execute([$hoje]);
    $dev = $rowHoje->fetch();
}
$anteriores = $pdo->query("SELECT id, titulo, referencia, created_at FROM biblia_devocionais WHERE created_at <> '{$hoje}' ORDER BY created_at DESC LIMIT 7")->fetchAll(PDO::FETCH_ASSOC);
function humanLabel(string $date): string {
    $d1 = new DateTime($date);
    $d2 = new DateTime(date('Y-m-d'));
    $diff = (int)$d2->diff($d1)->days;
    if ($diff === 0) return 'Hoje';
    if ($diff === 1) return 'Ontem';
    return $diff . ' dias atrás';
}
?>
<a href="index.php?p=biblia" class="btn-back-standard">Voltar</a>
<h2>Devocional</h2>
<div style="color:#777; margin-top:-8px; margin-bottom:12px;">Alimente sua alma diariamente</div>
<?php if ($dev): ?>
<div style="max-width:900px; margin:0 auto;">
    <div style="display:flex; align-items:center; gap:8px; color:#fbc02d; margin-bottom:8px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fbc02d"><path d="M7 10h10v2H7z"/><path d="M5 6h14v14H5z"/></svg>
        <span>Hoje</span>
    </div>
    <div style="font-weight:800; font-size:22px; margin-bottom:8px;"><?php echo htmlspecialchars($dev['titulo']); ?></div>
    <div style="line-height:1.7; color:#333; margin-bottom:12px;"><?php echo nl2br(htmlspecialchars($dev['texto'])); ?></div>
    <div style="background:#fffde7; border-radius:8px; padding:12px; border:1px solid #fff59d; color:#444;">
        <div style="font-weight:700; color:#b8860b; margin-bottom:6px;">Para Refletir</div>
        <div><?php echo nl2br(htmlspecialchars($dev['refletir'])); ?></div>
    </div>
</div>
<?php else: ?>
<div class="card" style="max-width:900px; margin:0 auto;">
    <div class="card-body">
        <div style="font-weight:700; font-size:18px; margin-bottom:8px;">Sem devocional agendado para hoje</div>
        <div style="color:#777;">Agende pelo painel Admin para publicar automaticamente à meia-noite.</div>
    </div>
</div>
<?php endif; ?>
<div style="font-weight:700; color:#444; margin-top:18px;">Devocionais Anteriores</div>
<div style="display:flex; flex-direction:column; gap:10px; padding:12px 0; max-width:900px;">
<?php foreach ($anteriores as $a): 
    $label = humanLabel($a['created_at']);
    $url = 'index.php?p=biblia_devocional&dt=' . urlencode($a['created_at']);
?>
    <a href="<?php echo $url; ?>" style="display:flex; flex-direction:column; gap:6px; background:#0f172a; color:#e5e7eb; border-radius:12px; padding:14px; border:1px solid #1e3a8a; position:relative;">
        <div style="font-size:12px; color:#9db4ff;"><?php echo htmlspecialchars($label); ?></div>
        <div style="display:flex; align-items:center;">
            <div style="flex:1; font-weight:800;"><?php echo htmlspecialchars($a['titulo']); ?></div>
            <div style="margin-left:8px; color:#9db4ff;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
        </div>
        <div style="font-size:12px; color:#60a5fa;"><?php echo htmlspecialchars($a['referencia']); ?></div>
    </a>
<?php endforeach; ?>
</div>
