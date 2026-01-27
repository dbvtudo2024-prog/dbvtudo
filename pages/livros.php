<a href="index.php?p=desbravadores" class="btn-back-standard">Voltar</a>
<h2>Livros</h2>
<?php
$pdo->exec("CREATE TABLE IF NOT EXISTS livros (id INT AUTO_INCREMENT PRIMARY KEY, titulo VARCHAR(255), autor VARCHAR(255), descricao TEXT, imagem VARCHAR(255))");
function colExists(PDO $pdo,$t,$c){ $drv=$pdo->getAttribute(PDO::ATTR_DRIVER_NAME); $sql=$drv==='pgsql'?"SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=:t AND column_name=:c":"SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=:t AND column_name=:c"; $st=$pdo->prepare($sql); $st->execute([':t'=>$t,':c'=>$c]); return (bool)$st->fetchColumn(); }
$cat = isset($_GET['cat']) ? $_GET['cat'] : '';
$where = "WHERE publico_alvo = 'Desbravador'";
if ($cat && colExists($pdo,'livros','categoria')) {
    $where .= " AND categoria = " . $pdo->quote($cat);
}
$stmt = $pdo->query("SELECT * FROM livros {$where} ORDER BY id DESC");
?>
<?php if (colExists($pdo,'livros','categoria')): ?>
<div style="margin-bottom:12px; display:flex; gap:8px;">
    <a href="index.php?p=livros" class="btn-admin">Todos</a>
    <a href="index.php?p=livros&cat=Livros do Ano" class="btn-admin">Livros do Ano</a>
    <a href="index.php?p=livros&cat=Livros das Classes" class="btn-admin">Livros das Classes</a>
    <a href="index.php?p=livros&cat=Outros Livros" class="btn-admin">Outros Livros</a>
</div>
<?php endif; ?>
<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; padding: 20px 0;">
<?php while ($row = $stmt->fetch()): 
$color = '#1e88e5';
?>
    <a href="index.php?p=livro&id=<?php echo (int)$row['id']; ?>" style="display:flex; align-items:center; gap:15px; padding:15px; border-radius:12px; background:#fff; box-shadow:0 4px 12px rgba(0,0,0,0.08); text-decoration:none; color:#333; border-left:8px solid <?php echo $color; ?>; transition: transform 0.2s ease, box-shadow 0.2s ease;" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.12)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)';">
        <div style="width:50px; height:50px; border-radius:50%; background-color: <?php echo $color; ?>20; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden;">
            <?php if (!empty($row['imagem'])): ?>
                <img src="uploads/<?php echo $row['imagem']; ?>" alt="<?php echo htmlspecialchars($row['titulo']); ?>" style="width:40px; height:40px; object-fit:contain;">
            <?php else: ?>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="<?php echo $color; ?>"><path d="M3 4h18v16H3z"/></svg>
            <?php endif; ?>
        </div>
        <div style="display:flex; flex-direction:column;">
            <span style="font-weight:700; font-size:1.05rem; color:#2c3e50;"><?php echo htmlspecialchars($row['titulo']); ?></span>
            <?php if (!empty($row['autor'])): ?>
            <span style="font-size:0.85rem; color:#7f8c8d; margin-top:2px;"><?php echo htmlspecialchars($row['autor']); ?></span>
            <?php endif; ?>
            <?php if (isset($row['categoria']) && $row['categoria']): ?>
            <span class="badge" style="margin-top:4px;"><?php echo htmlspecialchars($row['categoria']); ?></span>
            <?php endif; ?>
        </div>
        <div style="margin-left:auto; color:#ccc;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
    </a>
<?php endwhile; ?>
</div>

