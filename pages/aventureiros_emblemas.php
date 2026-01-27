<div class="aventureiros-theme">
    <a href="index.php?p=aventureiros" class="btn-back-standard">Voltar</a>
    <h2 class="feature-title">Emblemas dos Aventureiros</h2>
    <?php
    $stmt = $pdo->query("SELECT * FROM emblemas WHERE publico_alvo = 'Aventureiro' ORDER BY nome ASC");
    $items = $stmt->fetchAll();
    ?>
    <div class="grid" style="margin-top: 30px;">
        <?php if (count($items) > 0): ?>
            <?php foreach ($items as $row): ?>
                <a class="card" href="index.php?p=emblema&id=<?php echo (int)$row['id']; ?>" style="text-decoration:none; color:inherit; border-color: #e57373;">
                    <?php if (!empty($row['imagem'])): ?>
                        <img src="uploads/<?php echo $row['imagem']; ?>" alt="<?php echo htmlspecialchars($row['nome']); ?>" class="card-img" style="height: 200px; object-fit: contain; padding: 20px;">
                    <?php else: ?>
                        <div style="height: 200px; background: #eee; display: flex; align-items: center; justify-content: center; color: #aaa;">Sem Imagem</div>
                    <?php endif; ?>
                    <div class="card-body">
                        <h3 class="card-title" style="color: #800000; text-align:center;"><?php echo htmlspecialchars($row['nome']); ?></h3>
                        <?php if (!empty($row['categoria'])): ?>
                            <div style="text-align:center;"><span class="badge"><?php echo htmlspecialchars($row['categoria']); ?></span></div>
                        <?php endif; ?>
                    </div>
                </a>
            <?php endforeach; ?>
        <?php else: ?>
            <p>Nenhum emblema cadastrado para Aventureiros.</p>
        <?php endif; ?>
    </div>
</div>
