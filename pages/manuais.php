<a href="index.php?p=desbravadores" class="btn-back-standard">Voltar</a>
<h2>Manuais</h2>
<?php
$pdo->exec("CREATE TABLE IF NOT EXISTS manuais (id INT AUTO_INCREMENT PRIMARY KEY, titulo VARCHAR(255), descricao TEXT, arquivo VARCHAR(255), imagem VARCHAR(255))");
$stmt = $pdo->query("SELECT * FROM manuais WHERE publico_alvo = 'Desbravador' ORDER BY id DESC");
?>
<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; padding: 20px 0;">
<?php while ($row = $stmt->fetch()): 
$color = '#fbc02d';
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
</div>

