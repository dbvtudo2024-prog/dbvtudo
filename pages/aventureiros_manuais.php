<div class="aventureiros-theme">
    <a href="index.php?p=aventureiros" class="btn-back-standard">Voltar</a>
    <h2 class="feature-title">Manuais dos Aventureiros</h2>
    <?php
    $stmt = $pdo->query("SELECT * FROM manuais WHERE publico_alvo = 'Aventureiro' ORDER BY id DESC");
    ?>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; padding: 20px 0;">
    <?php 
    $hasItems = false;
    while ($row = $stmt->fetch()): 
    $hasItems = true;
    $color = '#800000';
    ?>
        <a href="index.php?p=manual&id=<?php echo (int)$row['id']; ?>" style="display:flex; align-items:center; gap:15px; padding:15px; border-radius:12px; background:#fff; box-shadow:0 4px 12px rgba(0,0,0,0.08); text-decoration:none; color:#333; border-left:8px solid <?php echo $color; ?>; transition: transform 0.2s ease, box-shadow 0.2s ease;" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.12)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)';">
            <div style="width:50px; height:50px; border-radius:50%; background-color: <?php echo $color; ?>20; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden;">
                <?php if (!empty($row['imagem'])): ?>
                    <img src="uploads/<?php echo $row['imagem']; ?>" alt="<?php echo htmlspecialchars($row['titulo']); ?>" style="width:40px; height:40px; object-fit:contain;">
                <?php else: ?>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="<?php echo $color; ?>"><path d="M6 4h12v16H6z"/></svg>
                <?php endif; ?>
            </div>
            <div style="display:flex; flex-direction:column;">
                <span style="font-weight:700; font-size:1.05rem; color:#2c3e50;"><?php echo htmlspecialchars($row['titulo']); ?></span>
                <?php if (!empty($row['descricao'])): ?>
                <span style="font-size:0.85rem; color:#7f8c8d; margin-top:2px;"><?php echo htmlspecialchars(substr($row['descricao'],0,90)) . '...'; ?></span>
                <?php endif; ?>
            </div>
            <div style="margin-left:auto; color:#ccc;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
        </a>
    <?php endwhile; ?>
    <?php if (!$hasItems): ?>
        <p>Nenhum manual cadastrado para Aventureiros.</p>
    <?php endif; ?>
    </div>
</div>
