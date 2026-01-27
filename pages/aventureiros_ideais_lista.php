<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/conexao.php';
?>
<div class="aventureiros-theme">
    <a href="index.php?p=aventureiros_ideais" class="btn-back-standard">Voltar</a>
    <h2 class="feature-title">Ideais dos Aventureiros</h2>
    <?php
    $stmt = $pdo->prepare("SELECT * FROM ideais WHERE tipo = :tipo AND publico_alvo = 'Aventureiro' ORDER BY id ASC");
    $stmt->execute([':tipo' => 'Ideal']);
    $items = $stmt->fetchAll();

    $order = ['Voto','Lei','Alvo','Lema','Objetivo','Voto de Fidelidade à Bíblia']; // Ajustar se os ideais de Aventureiros forem diferentes (são Voto e Lei principalmente)
    // Para Aventureiros geralmente é Voto e Lei. Vou listar o que tiver no banco.
    // Se não tiver ordem pré-definida no banco, vou exibir todos.
    
    // Vou usar a lógica de exibir todos se não bater com a lista fixa, ou apenas iterar sobre $items se a ordem não for crítica, mas a lista fixa ajuda na organização.
    // Como Aventureiros tem Voto e Lei específicos, vou iterar sobre o que vier do banco para ser flexível.
    ?>
    <div style="max-width:800px;margin:30px auto 0;">
        <?php if (count($items) > 0): ?>
            <?php foreach ($items as $row): ?>
                <details class="ideal-item" style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:12px; border-left:6px solid #e5484d;">
                    <summary style="list-style:none;display:flex;align-items:center;gap:10px;padding:14px;cursor:pointer;">
                        <span style="width:28px;height:28px;border-radius:6px;background:#e5484d;display:flex;align-items:center;justify-content:center;color:#fff;">🧾</span>
                        <span style="font-weight:600;"><?php echo htmlspecialchars($row['titulo']); ?></span>
                        <span style="margin-left:auto;color:#777;">▾</span>
                    </summary>
                    <div style="padding:0 14px 14px 14px;">
                        <?php if (!empty($row['conteudo'])): ?>
                            <div style="white-space: pre-wrap; color:#333;"><?php echo htmlspecialchars($row['conteudo']); ?></div>
                        <?php else: ?>
                            <div style="color:#777;">Conteúdo não cadastrado.</div>
                        <?php endif; ?>
                    </div>
                </details>
            <?php endforeach; ?>
        <?php else: ?>
            <p>Nenhum ideal cadastrado para Aventureiros.</p>
        <?php endif; ?>
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
</div>
