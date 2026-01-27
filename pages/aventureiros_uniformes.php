<div class="aventureiros-theme">
    <a href="index.php?p=aventureiros" class="btn-back-standard">Voltar</a>
    <h2 class="feature-title">Uniformes dos Aventureiros</h2>
    <?php
    $categorias = [
        'Uniforme de Gala (A)',
        'Uniforme de Gala (B)',
        'Uniforme de Atividades',
        'Distintivos',
        'Insígnias e Tiras',
        'Outros'
    ];
    // Adicionar filtro publico_alvo
    $stmt = $pdo->query("SELECT * FROM uniformes WHERE publico_alvo = 'Aventureiro' ORDER BY tipo ASC, id ASC");
    $groups = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $c = $row['tipo'] ?: 'Outros';
        // Categorizar simplificado se não bater exatamente, ou usar o tipo como categoria
        // Se o tipo cadastrado não estiver na lista de categorias, colocar em Outros ou criar nova categoria dinâmica
        // Para simplificar, vou agrupar pelo tipo exato do banco, e se o tipo for um dos $categorias, ótimo.
        // Se não, adiciona dinamicamente ou joga em Outros.
        // Vamos usar o tipo do banco como chave.
        if (!isset($groups[$c])) $groups[$c] = [];
        $groups[$c][] = $row;
    }
    
    // Mesclar categorias pré-definidas com as encontradas no banco para garantir ordem
    $allCats = array_unique(array_merge($categorias, array_keys($groups)));
    ?>
    <div style="display:flex; flex-direction:column; gap:14px; max-width:1000px; margin:30px auto 0;">
        <?php foreach ($allCats as $cat): ?>
            <?php $items = isset($groups[$cat]) ? $groups[$cat] : []; ?>
            <?php if (empty($items) && !in_array($cat, array_keys($groups))) continue; // Pular categorias vazias se não existirem no banco ?>
            
            <details style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08); border-left:6px solid #800000;">
                <summary style="list-style:none;display:flex;align-items:center;gap:10px;padding:14px;cursor:pointer;">
                    <span style="width:38px;height:38px;border-radius:50%;background:#800000;display:flex;align-items:center;justify-content:center;color:#fff;">👕</span>
                    <span style="font-weight:600;"><?php echo htmlspecialchars($cat); ?></span>
                    <span style="margin-left:auto;color:#777;">▾</span>
                </summary>
                <div style="padding:0 14px 14px 14px;">
                    <?php if (!$items): ?>
                        <div style="color:#777;">Nenhum item nesta categoria.</div>
                    <?php else: ?>
                        <div class="grid" style="margin-top: 10px;">
                            <?php foreach ($items as $row): ?>
                                <a class="card" href="index.php?p=uniforme&id=<?php echo (int)$row['id']; ?>" style="text-decoration:none; color:inherit; border-color: #e57373;">
                                    <?php if (!empty($row['imagem'])): ?>
                                        <img src="uploads/<?php echo $row['imagem']; ?>" alt="<?php echo htmlspecialchars($row['tipo']); ?>" class="card-img" style="height: 250px; object-fit: contain; padding: 10px;">
                                    <?php else: ?>
                                        <div style="height: 250px; background: #eee; display: flex; align-items: center; justify-content: center; color: #aaa;">Sem Imagem</div>
                                    <?php endif; ?>
                                    <div class="card-body">
                                        <h3 class="card-title" style="color: #800000;"><?php echo htmlspecialchars($row['tipo']); ?></h3>
                                        <?php if (!empty($row['descricao'])): ?>
                                            <p class="card-text card-text--clamp"><strong>Descrição:</strong> <?php echo htmlspecialchars($row['descricao']); ?></p>
                                        <?php endif; ?>
                                        <div class="btn-admin" style="display:inline-block; margin-top:8px; background-color: #800000;">Ver detalhes</div>
                                    </div>
                                </a>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </details>
        <?php endforeach; ?>
        <?php if (empty($groups)): ?>
            <p>Nenhum uniforme cadastrado para Aventureiros.</p>
        <?php endif; ?>
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
</div>
