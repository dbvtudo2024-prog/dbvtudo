<?php
$livro = isset($_GET['livro']) ? $_GET['livro'] : '';
$chapterStyle = isset($_SESSION['chapter_style']) ? $_SESSION['chapter_style'] : 'texto';
?>
<a href="index.php?p=biblia" class="btn-back-standard">Voltar</a>
<h2>Bíblia - <?php echo htmlspecialchars($livro ?: 'Livro'); ?></h2>
<?php if (!$livro): ?>
    <p>Livro não informado.</p>
<?php else: ?>
    <?php
    try {
        $drv = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        if ($drv !== 'pgsql') {
            $pdo->exec("CREATE INDEX IF NOT EXISTS idx_bc_book_chapter ON biblia_completa (book_name, chapter)");
        } else {
            $pdo->exec('CREATE INDEX IF NOT EXISTS idx_bc_book_chapter ON public."biblia_completa"(book_name, chapter)');
        }
    } catch (Exception $e) {}
    $stmt = $pdo->prepare("SELECT DISTINCT chapter FROM biblia_completa WHERE book_name = ? ORDER BY CAST(chapter AS UNSIGNED) ASC");
    $stmt->execute([$livro]);
    ?>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; padding: 16px 0;">
    <?php while ($row = $stmt->fetch()): 
        $cap = is_numeric($row['chapter']) ? (int)$row['chapter'] : $row['chapter'];
        $color = '#1e88e5';
        $showCircle = ($chapterStyle === 'numero');
        $label = $showCircle ? '' : ("Capítulo " . $cap);
    ?>
        <a href="index.php?p=biblia_capitulo&livro=<?php echo urlencode($livro); ?>&capitulo=<?php echo $cap; ?>" style="display:flex; align-items:center; gap:12px; padding:12px; border-radius:10px; background:#fff; box-shadow:0 3px 10px rgba(0,0,0,0.08); text-decoration:none; color:#333; border-left:6px solid <?php echo $color; ?>;">
            <?php if ($showCircle): ?>
                <div style="width:36px; height:36px; border-radius:50%; background-color: <?php echo $color; ?>20; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <span style="color:<?php echo $color; ?>; font-weight:700;"><?php echo $cap; ?></span>
                </div>
            <?php else: ?>
                <span style="font-weight:600;"><?php echo $label; ?></span>
            <?php endif; ?>
            <div style="margin-left:auto; color:#ccc;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
        </a>
    <?php endwhile; ?>
    </div>
<?php endif; ?>
