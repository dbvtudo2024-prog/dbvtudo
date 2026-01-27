<?php
$livro = isset($_GET['livro']) ? $_GET['livro'] : '';
$cap = isset($_GET['capitulo']) ? (int)$_GET['capitulo'] : 0;
?>
<a href="index.php?p=biblia_livro&livro=<?php echo urlencode($livro); ?>" class="btn-back-standard">Voltar</a>
<h2><?php echo htmlspecialchars($livro ?: 'Livro'); ?> - Capítulo <?php echo (int)$cap; ?></h2>
<?php if (!$livro || $cap <= 0): ?>
    <p>Parâmetros inválidos.</p>
<?php else: ?>
    <?php
    try {
        $drv = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        if ($drv !== 'pgsql') {
            $pdo->exec("CREATE INDEX IF NOT EXISTS idx_bv_livro_cap ON biblia_versos (livro, capitulo)");
            $pdo->exec("CREATE INDEX IF NOT EXISTS idx_bc_book_chapter_2 ON biblia_completa (book_name, chapter)");
        } else {
            $pdo->exec('CREATE INDEX IF NOT EXISTS idx_bv_livro_cap ON public."biblia_versos"(livro, capitulo)');
            $pdo->exec('CREATE INDEX IF NOT EXISTS idx_bc_book_chapter_2 ON public."biblia_completa"(book_name, chapter)');
        }
    } catch (Exception $e) {}
    $_SESSION['last_bible'] = ['livro' => $livro, 'cap' => $cap];
    $stmt = $pdo->prepare("SELECT verso, texto FROM biblia_versos WHERE livro = ? AND capitulo = ? ORDER BY verso ASC");
    $stmt->execute([$livro, $cap]);
    $versos = $stmt->fetchAll();
    if (!$versos) {
        $s2 = $pdo->prepare("SELECT verse_number AS verso, text AS texto FROM biblia_completa WHERE book_name = ? AND CAST(chapter AS UNSIGNED) = ? ORDER BY CAST(verse_number AS UNSIGNED) ASC");
        $s2->execute([$livro, $cap]);
        $versos = $s2->fetchAll();
    }
    ?>
    <?php if (!$versos): ?>
        <p>Conteúdo não disponível para este capítulo.</p>
    <?php else: ?>
        <div class="card" style="max-width:900px;margin:0 auto;">
            <div class="card-body">
                <?php foreach ($versos as $v): ?>
                    <div style="display:flex; align-items:flex-start; gap:10px; padding:8px 0; border-bottom:1px solid #eee;">
                        <span class="badge" style="min-width:28px; text-align:center;"><?php echo (int)$v['verso']; ?></span>
                        <div style="flex:1; color:#333;"><?php echo htmlspecialchars($v['texto']); ?></div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    <?php endif; ?>
<?php endif; ?>
