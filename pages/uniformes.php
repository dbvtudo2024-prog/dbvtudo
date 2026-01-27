<a href="index.php?p=desbravadores" class="btn-back-standard">Voltar</a>
<h2>Uniformes</h2>
<?php
$categorias = [
    'Uniforme de Gala',
    'Lenços e Prendedores',
    'Cobertura',
    'Cinto',
    'Calçados e Meias',
    'Torçal',
    'Platina ou Galão',
    'Uniforme de diretores, distritais, regionais, pastores, coordenadores gerais e secretários(as) de campo, departamentais e associados',
    'Uniforme do Clube de Líderes'
];
$stmt = $pdo->query("SELECT * FROM uniformes WHERE publico_alvo = 'Desbravador' ORDER BY tipo ASC, ordem ASC, id ASC");
$groups = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $c = $row['tipo'] ?: 'Outros';
    if (!isset($groups[$c])) $groups[$c] = [];
    $groups[$c][] = $row;
}
?>
<div style="display:flex; flex-direction:column; gap:14px; max-width:1000px; margin:30px auto 0;">
    <?php foreach ($categorias as $cat): ?>
        <?php $items = isset($groups[$cat]) ? $groups[$cat] : []; ?>
        <details style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08); border-left:6px solid #f6c646;">
            <summary style="list-style:none;display:flex;align-items:center;gap:10px;padding:14px;cursor:pointer;">
                <span style="width:38px;height:38px;border-radius:50%;background:#f6c646;display:flex;align-items:center;justify-content:center;color:#222;">👕</span>
                <span style="font-weight:600;"><?php echo htmlspecialchars($cat); ?></span>
                <span style="margin-left:auto;color:#777;">▾</span>
            </summary>
            <div style="padding:0 14px 14px 14px;">
                <?php if (!$items): ?>
                    <div style="color:#777;">Nenhum item nesta categoria.</div>
                <?php else: ?>
                    <div class="grid" style="margin-top: 10px;">
                        <?php foreach ($items as $row): ?>
                            <a class="card" href="index.php?p=uniforme&id=<?php echo (int)$row['id']; ?>" style="text-decoration:none; color:inherit;">
                                <?php if (!empty($row['imagem'])): ?>
                                    <img src="uploads/<?php echo $row['imagem']; ?>" alt="<?php echo htmlspecialchars($row['tipo']); ?>" class="card-img" style="height: 250px; object-fit: contain; padding: 10px;">
                                <?php else: ?>
                                    <div style="height: 250px; background: #eee; display: flex; align-items: center; justify-content: center; color: #aaa;">Sem Imagem</div>
                                <?php endif; ?>
                                <div class="card-body">
                                    <h3 class="card-title"><?php echo htmlspecialchars($row['tipo']); ?></h3>
                                    <?php if (!empty($row['descricao'])): ?>
                                        <p class="card-text card-text--clamp"><strong>Descrição:</strong> <?php echo htmlspecialchars($row['descricao']); ?></p>
                                    <?php endif; ?>
                                    <div class="btn-admin" style="display:inline-block; margin-top:8px;">Ver detalhes</div>
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
