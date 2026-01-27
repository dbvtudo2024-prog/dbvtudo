<?php
$drv = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
if ($drv !== 'pgsql') {
    $pdo->exec("CREATE TABLE IF NOT EXISTS biblia_favoritos (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NULL, livro VARCHAR(80), capitulo INT, verso INT, texto TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uniq_uv (user_id, livro, capitulo, verso))");
} else {
    $pdo->exec("CREATE TABLE IF NOT EXISTS biblia_favoritos (id SERIAL PRIMARY KEY, user_id INT NULL, livro VARCHAR(80), capitulo INT, verso INT, texto TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE (user_id, livro, capitulo, verso))");
}
$maxId = (int)$pdo->query("SELECT MAX(id) FROM biblia_versos")->fetchColumn();
$randId = $maxId > 0 ? random_int(1, $maxId) : 0;
$stmtRnd = $pdo->prepare("SELECT livro, capitulo, verso, texto FROM biblia_versos WHERE id >= ? ORDER BY id ASC LIMIT 1");
$stmtRnd->execute([$randId]);
$vd = $stmtRnd->fetch();
if (!$vd) { $vd = $pdo->query("SELECT livro, capitulo, verso, texto FROM biblia_versos ORDER BY id DESC LIMIT 1")->fetch(); }
$userId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
$msg = '';
$isFav = false;
if ($vd) {
    $op = ($drv === 'pgsql') ? 'IS NOT DISTINCT FROM' : '<=>';
    $chk = $pdo->prepare("SELECT 1 FROM biblia_favoritos WHERE user_id {$op} ? AND livro=? AND capitulo=? AND verso=?");
    $chk->execute([$userId, $vd['livro'], (int)$vd['capitulo'], (int)$vd['verso']]);
    $isFav = (bool)$chk->fetchColumn();
}
if ($_SERVER['REQUEST_METHOD']==='POST' && isset($_POST['action']) && $vd) {
    if ($_POST['action']==='fav') {
        if (!$isFav) {
            $ins = $pdo->prepare("INSERT INTO biblia_favoritos (user_id, livro, capitulo, verso, texto) VALUES (?,?,?,?,?)");
            $ins->execute([$userId, $vd['livro'], (int)$vd['capitulo'], (int)$vd['verso'], $vd['texto']]);
            $isFav = true;
            $msg = 'Adicionado aos Favoritos';
        }
    } elseif ($_POST['action']==='note') {
        if ($drv !== 'pgsql') {
            $pdo->exec("CREATE TABLE IF NOT EXISTS biblia_notas (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NULL, titulo VARCHAR(255), conteudo TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
        } else {
            $pdo->exec("CREATE TABLE IF NOT EXISTS biblia_notas (id SERIAL PRIMARY KEY, user_id INT NULL, titulo VARCHAR(255), conteudo TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
        }
        $title = $vd['livro'].' '.(int)$vd['capitulo'].':'.(int)$vd['verso'];
        $op2 = ($drv === 'pgsql') ? 'IS NOT DISTINCT FROM' : '<=>';
        $exists = $pdo->prepare("SELECT 1 FROM biblia_notas WHERE user_id {$op2} ? AND titulo = ?");
        $exists->execute([$userId, $title]);
        if (!$exists->fetchColumn()) {
            $ins2 = $pdo->prepare("INSERT INTO biblia_notas (user_id, titulo, conteudo) VALUES (?,?,?)");
            $ins2->execute([$userId, $title, $vd['texto']]);
            $msg = 'Adicionado em Anotações';
        }
    }
}
$dias = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
$meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
$dt = new DateTime('now');
$labelData = $dias[(int)$dt->format('w')] . ', ' . $dt->format('d') . ' de ' . $meses[(int)$dt->format('n')-1] . ' de ' . $dt->format('Y');
?>
<a href="index.php?p=biblia" class="btn-back-standard">Voltar</a>
<h2>Palavra do Dia</h2>
<div style="margin:12px 0; color:#555;"><?php echo $labelData; ?></div>
<?php if ($vd): ?>
<div style="background:#0b1d42; color:#fff; border-radius:16px; padding:20px; box-shadow:0 6px 18px rgba(0,0,0,0.25); max-width:640px;">
    <div style="display:flex; align-items:center; justify-content:center; margin-bottom:10px;">
        <div style="width:48px; height:48px; border-radius:50%; overflow:hidden; background:#fff3; display:flex; align-items:center; justify-content:center;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffd54f"><path d="M4 3h13a3 3 0 013 3v13H6a2 2 0 00-2 2V3z"/></svg>
        </div>
    </div>
    <div style="text-align:center; font-size:16px; font-style:italic;">"<?php echo htmlspecialchars($vd['texto']); ?>"</div>
    <div style="text-align:center; font-weight:700; color:#ffd54f; margin-top:8px;"><?php echo htmlspecialchars($vd['livro']); ?> <?php echo (int)$vd['capitulo']; ?>:<?php echo (int)$vd['verso']; ?></div>
</div>
<div style="display:flex; gap:12px; margin-top:12px; flex-wrap:wrap; align-items:center;">
    <form method="POST">
        <input type="hidden" name="action" value="fav">
        <button type="submit" style="border:2px solid #1e88e5; background:#fff; color:#1e88e5; border-radius:12px; padding:10px 16px; cursor:pointer;"><?php echo $isFav?'Favoritado':'Curtir (Favoritos)'; ?></button>
    </form>
    <form method="POST">
        <input type="hidden" name="action" value="note">
        <button type="submit" style="border:2px solid #26a69a; background:#fff; color:#26a69a; border-radius:12px; padding:10px 16px; cursor:pointer;">Adicionar a Anotações</button>
    </form>
    <button type="button" id="shareBtn" style="border:2px solid #1e88e5; background:#fff; color:#1e88e5; border-radius:12px; padding:10px 16px; cursor:pointer;">Compartilhar</button>
</div>
<?php if ($msg): ?>
<div style="margin-top:10px; color:#2e7d32;"><?php echo htmlspecialchars($msg); ?></div>
<?php endif; ?>
<script>
document.getElementById('shareBtn').addEventListener('click', async function(){
  const t = '<?php echo addslashes($vd['texto']); ?> — <?php echo addslashes($vd['livro'].' '.(int)$vd['capitulo'].':'.(int)$vd['verso']); ?>';
  if (navigator.share) { try { await navigator.share({ text: t }); } catch(e){} }
  else { try { await navigator.clipboard.writeText(t); alert('Copiado'); } catch(e){ alert('Não foi possível copiar'); } }
});
<?php else: ?>
<p>Carregue o CSV da Bíblia no painel admin para visualizar.</p>
<?php endif; ?>
