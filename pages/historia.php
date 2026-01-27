<a href="index.php?p=desbravadores" class="btn-back-standard">Voltar</a>
<h2>História do Clube</h2>
<?php
$stmt = $pdo->query("SELECT * FROM historia WHERE publico_alvo = 'Desbravador' ORDER BY ano_periodo ASC");
$items = $stmt->fetchAll();
?>
<style>
.hist-item summary .hist-thumb { width:80px; height:60px; border-radius:8px; object-fit:cover; margin-right:8px; display:inline-block; }
.hist-item[open] summary .hist-thumb { width:30px; height:30px; border-radius:6px; }
</style>
<div style="max-width:900px;margin:0 auto;">
    <?php foreach ($items as $row): ?>
        <details class="hist-item" style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:12px; border-left:6px solid #004d40;">
            <summary style="list-style:none;display:flex;align-items:center;gap:10px;padding:14px;cursor:pointer;">
                <?php if (!empty($row['imagem'])): ?>
                    <img class="hist-thumb" src="uploads/<?php echo $row['imagem']; ?>" alt="<?php echo htmlspecialchars($row['titulo']); ?>">
                <?php else: ?>
                    <span style="width:28px;height:28px;border-radius:6px;background:#004d40;display:flex;align-items:center;justify-content:center;color:#fff;">📜</span>
                <?php endif; ?>
                <span style="font-weight:600;"><?php echo htmlspecialchars($row['titulo']); ?></span>
                <span class="badge" style="background:#004d40;color:#fff;padding:2px 8px;border-radius:12px;"><?php echo htmlspecialchars($row['ano_periodo']); ?></span>
                <span style="margin-left:auto;color:#777;">▾</span>
            </summary>
            <div style="padding:0 14px 14px 14px;">
                <div style="white-space: pre-wrap; color:#333;"><?php echo htmlspecialchars($row['conteudo']); ?></div>
            </div>
        </details>
    <?php endforeach; ?>
</div>
<script>
(function(){
    var items = Array.prototype.slice.call(document.querySelectorAll('.hist-item'));
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

