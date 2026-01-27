<a href="index.php?p=desbravadores" class="btn-back-standard">Voltar</a>
<h2>Emblemas</h2>

<?php
$cats = [
    'Emblemas',
    'Insignias e Tiras',
    'Distintivos',
    'Bandeira Oficial dos Desbravadores',
    'Bandeirim'
];
$stmt = $pdo->query("SELECT * FROM emblemas WHERE publico_alvo = 'Desbravador' ORDER BY categoria ASC, ordem ASC, nome ASC");
$groups = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $c = $row['categoria'] ?: 'Outros';
    if (!isset($groups[$c])) $groups[$c] = [];
    $groups[$c][] = $row;
}
?>
<div style="display:flex; flex-direction:column; gap:14px; max-width:1000px; margin:30px auto 0;">
    <?php foreach ($cats as $cat): ?>
        <?php $items = isset($groups[$cat]) ? $groups[$cat] : []; ?>
        <details style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08); border-left:6px solid #e5484d;">
            <summary style="list-style:none;display:flex;align-items:center;gap:10px;padding:14px;cursor:pointer;">
                <span style="width:38px;height:38px;border-radius:50%;background:#e5484d;display:flex;align-items:center;justify-content:center;color:#fff;">📛</span>
                <span style="font-weight:600;"><?php echo htmlspecialchars($cat); ?></span>
                <span style="margin-left:auto;color:#777;">▾</span>
            </summary>
            <div style="padding:0 14px 14px 14px;">
                <?php if (!$items): ?>
                    <div style="color:#777;">Nenhum item nesta categoria.</div>
                <?php else: ?>
                    <div class="grid" style="margin-top: 10px;">
                        <?php foreach ($items as $row): ?>
                            <a class="card" href="index.php?p=emblema&id=<?php echo (int)$row['id']; ?>" style="text-decoration:none; color:inherit;">
                                <?php if (!empty($row['imagem'])): ?>
                                    <img src="uploads/<?php echo $row['imagem']; ?>" alt="<?php echo htmlspecialchars($row['nome']); ?>" class="card-img" style="height: 150px; object-fit: contain; padding: 10px;">
                                <?php else: ?>
                                    <div style="height: 150px; background: #eee; display: flex; align-items: center; justify-content: center; color: #aaa;">Sem Imagem</div>
                                <?php endif; ?>
                                <div class="card-body">
                                    <span class="badge"><?php echo htmlspecialchars($row['categoria']); ?></span>
                                    <h3 class="card-title"><?php echo htmlspecialchars($row['nome']); ?></h3>
                                    <?php if (!empty($row['descricao'])): ?>
                                        <p class="card-text card-text--clamp"><?php echo htmlspecialchars($row['descricao']); ?></p>
                                    <?php endif; ?>
                                </div>
                            </a>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        </details>
    <?php endforeach; ?>
</div>
<script>
document.addEventListener('DOMContentLoaded',function(){
    var items=document.querySelectorAll('details');
    items.forEach(function(d){
        d.addEventListener('toggle',function(){
            if(d.open){
                items.forEach(function(o){ if(o!==d) o.open=false; });
            }
        });
    });
});
</script>
