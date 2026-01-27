<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/conexao.php';
?>
<a href="index.php?p=ideais" class="btn-back-standard">Voltar</a>
<h2>Ideais dos Desbravadores</h2>
<?php
$pdo->exec("CREATE TABLE IF NOT EXISTS ideais (id INT AUTO_INCREMENT PRIMARY KEY, tipo VARCHAR(50), titulo VARCHAR(255), conteudo TEXT, imagem VARCHAR(255))");
$stmt = $pdo->prepare("SELECT * FROM ideais WHERE tipo = :tipo AND publico_alvo = 'Desbravador' ORDER BY id ASC");
$stmt->execute([':tipo' => 'Ideal']);
$items = $stmt->fetchAll();

$order = ['Voto','Lei','Alvo','Lema','Objetivo','Voto de Fidelidade à Bíblia'];
$byTitle = [];
foreach ($items as $it) {
    $byTitle[$it['titulo']] = $it;
}
?>
<div style="max-width:800px;margin:30px auto 0;">
    <?php foreach ($order as $title): ?>
        <?php $row = isset($byTitle[$title]) ? $byTitle[$title] : null; ?>
        <details class="ideal-item" style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:12px; border-left:6px solid #e5484d;">
            <summary style="list-style:none;display:flex;align-items:center;gap:10px;padding:14px;cursor:pointer;">
                <span style="width:28px;height:28px;border-radius:6px;background:#e5484d;display:flex;align-items:center;justify-content:center;color:#fff;">🧾</span>
                <span style="font-weight:600;"><?php echo htmlspecialchars($title); ?></span>
                <span style="margin-left:auto;color:#777;">▾</span>
            </summary>
            <div style="padding:0 14px 14px 14px;">
                <?php if ($row && !empty($row['conteudo'])): ?>
                    <div style="white-space: pre-wrap; color:#333;"><?php echo htmlspecialchars($row['conteudo']); ?></div>
                <?php else: ?>
                    <div style="color:#777;">Conteúdo não cadastrado.</div>
                <?php endif; ?>
            </div>
        </details>
    <?php endforeach; ?>
</div>
<script>
(function(){
    var items = Array.prototype.slice.call(document.querySelectorAll('.ideal-item'));
    items.forEach(function(it){
        it.addEventListener('toggle', function(){
            if (it.open) {
                items.forEach(function(other){
                    if (other !== it && other.open) other.open = false;
                });
            }
        });
    });
})();
</script>

