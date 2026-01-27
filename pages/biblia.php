<?php
$vd = null;
try {
    $maxId = (int)$pdo->query("SELECT MAX(id) FROM biblia_versos")->fetchColumn();
    if ($maxId > 0) {
        $randId = random_int(1, $maxId);
        $stmtRnd = $pdo->prepare("SELECT livro, capitulo, verso, texto FROM biblia_versos WHERE id >= ? ORDER BY id ASC LIMIT 1");
        $stmtRnd->execute([$randId]);
        $vd = $stmtRnd->fetch();
        if (!$vd) {
            $vd = $pdo->query("SELECT livro, capitulo, verso, texto FROM biblia_versos ORDER BY id DESC LIMIT 1")->fetch();
        }
    }
} catch (Exception $e) { $vd = null; }
$last = isset($_SESSION['last_bible']) ? $_SESSION['last_bible'] : null;
?>
<div style="background: radial-gradient(ellipse at top, #0b1d42, #09162d 60%, #071020 100%); color:#fff; border-radius:16px; padding:24px; box-shadow:0 6px 18px rgba(0,0,0,0.25); margin-bottom:20px;">
    <div style="display:flex; align-items:center; justify-content:space-between;">
        <a href="index.php?p=desbravadores" class="btn-back-standard">Voltar</a>
        <div></div>
    </div>
    <div style="text-align:center; margin-top:10px;">
        <div style="font-size:26px; font-weight:800;">Bíblia Sagrada</div>
        <div style="opacity:0.9; margin-top:6px;">Versão Almeida Revista e Corrigida</div>
    </div>
    <div style="background:#fff; color:#333; border-radius:14px; padding:16px; margin-top:18px; box-shadow:0 4px 14px rgba(0,0,0,0.15);">
        <div style="display:flex; align-items:center; gap:10px; color:#b8860b; font-weight:700;">Versículo do Dia</div>
        <div style="margin-top:8px; font-size:15px;"><?php echo $vd ? htmlspecialchars($vd['texto']) : 'Carregue o CSV da Bíblia no painel admin para visualizar os versículos.'; ?></div>
        <?php if ($vd): ?>
        <div style="margin-top:6px; color:#666; font-size:13px;"><?php echo htmlspecialchars($vd['livro']); ?> <?php echo (int)$vd['capitulo']; ?>:<?php echo (int)$vd['verso']; ?></div>
        <?php endif; ?>
    </div>
</div>
<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:16px; margin-bottom:22px;">
    <a href="index.php?p=biblia_livros" class="feature-card" style="background:#fff; border:2px solid #1e88e5; border-radius:12px; padding:16px; text-align:center; box-shadow:0 2px 6px rgba(0,0,0,0.08);">
        <div style="width:55px; height:55px; margin:0 auto 8px; border-radius:12px; background:#1e88e522; display:flex; align-items:center; justify-content:center;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#1e88e5"><path d="M4 3h13a3 3 0 013 3v13H6a2 2 0 00-2 2V3z"/><path d="M6 18h14"/></svg>
        </div>
        <h4 style="color:#1e88e5;">Bíblia</h4>
    </a>
    <a href="index.php?p=biblia_palavra" class="feature-card" style="background:#fff; border:2px solid #fbc02d; border-radius:12px; padding:16px; text-align:center; box-shadow:0 2px 6px rgba(0,0,0,0.08);">
        <div style="width:55px; height:55px; margin:0 auto 8px; border-radius:12px; background:#fbc02d22; display:flex; align-items:center; justify-content:center;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#fbc02d"><circle cx="12" cy="12" r="5"/></svg>
        </div>
        <h4 style="color:#fbc02d;">Palavra do Dia</h4>
    </a>
    <a href="index.php?p=biblia_devocional" class="feature-card" style="background:#fff; border:2px solid #26a69a; border-radius:12px; padding:16px; text-align:center; box-shadow:0 2px 6px rgba(0,0,0,0.08);">
        <div style="width:55px; height:55px; margin:0 auto 8px; border-radius:12px; background:#26a69a22; display:flex; align-items:center; justify-content:center;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#26a69a"><path d="M12 21s-6-4.35-6-9a6 6 0 1112 0c0 4.65-6 9-6 9z"/></svg>
        </div>
        <h4 style="color:#26a69a;">Devocional</h4>
    </a>
    <a href="index.php?p=biblia_mais" class="feature-card" style="background:#fff; border:2px solid #9e9e9e; border-radius:12px; padding:16px; text-align:center; box-shadow:0 2px 6px rgba(0,0,0,0.08);">
        <div style="width:55px; height:55px; margin:0 auto 8px; border-radius:12px; background:#9e9e9e22; display:flex; align-items:center; justify-content:center;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#9e9e9e"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
        </div>
        <h4 style="color:#9e9e9e;">Mais</h4>
    </a>
</div>
<?php if ($last): ?>
<div style="margin-bottom:16px; font-weight:700; color:#444;">Continue Lendo</div>
<a href="index.php?p=biblia_capitulo&livro=<?php echo urlencode($last['livro']); ?>&capitulo=<?php echo (int)$last['cap']; ?>" style="display:flex; align-items:center; gap:12px; padding:14px; border-radius:12px; background:#fff; box-shadow:0 4px 12px rgba(0,0,0,0.08); text-decoration:none; color:#333; border-left:8px solid #1e88e5;">
    <div style="width:44px; height:44px; border-radius:12px; background:#1e88e522; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#1e88e5"><path d="M4 3h13a3 3 0 013 3v13H6a2 2 0 00-2 2V3z"/></svg>
    </div>
    <div style="display:flex; flex-direction:column;">
        <span style="font-weight:700;"><?php echo htmlspecialchars($last['livro']); ?></span>
        <span style="font-size:12px; color:#777;">Capítulo <?php echo (int)$last['cap']; ?></span>
    </div>
    <span style="margin-left:auto; color:#1e88e5; font-weight:700;">Ler agora</span>
</a>
<?php endif; ?>
<?php if (!$last): ?>
<div style="margin-top:22px;">
    <div style="font-weight:700; color:#444; margin-bottom:8px;">Nenhuma leitura recente</div>
    <a href="index.php?p=biblia_livros" class="btn-admin" style="display:inline-block; background:#1e88e5; color:#fff; border:none; padding:10px 16px; border-radius:10px; text-decoration:none;">Escolher um livro</a>
</div>
<?php endif; ?>
