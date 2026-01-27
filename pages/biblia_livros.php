<a href="index.php?p=biblia" class="btn-back-standard">Voltar</a>
<div style="background: linear-gradient(180deg, #1e3c72 0%, #2a5298 100%); color:#fff; border-radius:16px; padding:20px; box-shadow:0 6px 18px rgba(0,0,0,0.25); margin-bottom:14px;">
    <div style="display:flex; align-items:center; justify-content:space-between;">
        <div>
            <div style="font-size:22px; font-weight:800;">Bíblia Sagrada</div>
            <div style="opacity:0.9; margin-top:4px;"><?php echo isset($_SESSION['bible_version']) ? $_SESSION['bible_version'] : 'ARC'; ?> - Almeida Revista e Corrigida</div>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
            <a href="index.php?p=biblia" style="color:#fff;">🏠</a>
            <a href="index.php?p=biblia_mais" style="color:#fff;">📚</a>
        </div>
    </div>
</div>
<?php
$pdo->exec("CREATE TABLE IF NOT EXISTS biblia_completa (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    book_abbrev VARCHAR(32) NULL,
    book_name VARCHAR(120) NULL,
    chapter VARCHAR(32) NULL,
    verse_number VARCHAR(32) NULL,
    text TEXT NULL,
    testament VARCHAR(16) NULL,
    total_chapters VARCHAR(32) NULL,
    UNIQUE KEY uniq_bcv (book_name, chapter, verse_number)
)");
$drv = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
try {
    if ($drv !== 'pgsql') {
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_bc_book ON biblia_completa (book_name)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_bc_book_chapter ON biblia_completa (book_name, chapter)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_bc_testament ON biblia_completa (testament)");
    } else {
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_bc_book ON public."biblia_completa"(book_name)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_bc_book_chapter ON public."biblia_completa"(book_name, chapter)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_bc_testament ON public."biblia_completa"(testament)');
    }
} catch (Exception $e) {}
$mapOld = ['Velho','Antigo','OT','Old'];
$mapNew = ['Novo','NT','New'];
$inOld = implode("','", $mapOld);
$inNew = implode("','", $mapNew);
$t = isset($_GET['t']) ? $_GET['t'] : 'old';
$q = isset($_GET['q']) ? trim($_GET['q']) : '';
$whereT = $t==='new' ? "testament IN ('{$inNew}')" : "testament IN ('{$inOld}')";
$whereQ = $q!=='' ? " AND (book_name LIKE :q OR book_abbrev LIKE :q)" : "";
$orderOld = [
    'Gênesis','Êxodo','Levítico','Números','Deuteronômio','Josué','Juízes','Rute',
    '1 Samuel','2 Samuel','1 Reis','2 Reis','1 Crônicas','2 Crônicas','Esdras','Neemias','Ester',
    'Jó','Salmos','Provérbios','Eclesiastes','Cânticos','Isaías','Jeremias','Lamentações',
    'Ezequiel','Daniel','Oséias','Joel','Amós','Obadias','Jonas','Miqueias','Naum','Habacuque',
    'Sofonias','Ageu','Zacarias','Malaquias'
];
$orderNew = [
    'Mateus','Marcos','Lucas','João','Atos','Romanos','1 Coríntios','2 Coríntios',
    'Gálatas','Efésios','Filipenses','Colossenses','1 Tessalonicenses','2 Tessalonicenses',
    '1 Timóteo','2 Timóteo','Tito','Filemom','Hebreus','Tiago','1 Pedro','2 Pedro',
    '1 João','2 João','3 João','Judas','Apocalipse'
];
$seqList = $t==='new' ? $orderNew : $orderOld;
$case = "CASE book_name ";
foreach ($seqList as $i => $nm) { $case .= "WHEN ".$pdo->quote($nm)." THEN ".($i+1)." "; }
$case .= "ELSE 999 END";
$sql = "SELECT bc.book_name, MIN(bc.book_abbrev) AS abrev, MIN(bc.testament) AS tst, MAX(COALESCE(bc.total_chapters,0)) AS tot, {$case} AS seq
        FROM biblia_completa bc
        WHERE {$whereT}{$whereQ}
        GROUP BY bc.book_name
        ORDER BY seq ASC, bc.book_name ASC";
$stmt = $pdo->prepare($sql);
if ($q!=='') { $stmt->bindValue(':q', "%{$q}%"); }
$stmt->execute();
$books = $stmt->fetchAll();
?>
<div class="search-wrap">
    <form method="GET" class="search-form">
        <input type="hidden" name="p" value="biblia_livros">
        <input type="hidden" name="t" value="<?php echo htmlspecialchars($t); ?>">
        <input name="q" value="<?php echo htmlspecialchars($q); ?>" placeholder="Buscar livro..." class="search-input">
        <button type="submit" class="search-button">Buscar</button>
    </form>
</div>
<div style="display:flex; gap:8px; margin-bottom:12px; justify-content:center; flex-wrap:wrap;">
    <a href="index.php?p=biblia_livros&t=old&q=<?php echo urlencode($q); ?>" style="display:inline-flex; align-items:center; gap:6px; padding:8px 12px; border-radius:10px; background:<?php echo $t==='old'?'#e3f2fd':'#fff'; ?>; color:#1565c0 !important; border:1px solid #cfe2ff; box-shadow:0 1px 3px rgba(0,0,0,0.06);">⟲ Antigo Testamento</a>
    <a href="index.php?p=biblia_livros&t=new&q=<?php echo urlencode($q); ?>" style="display:inline-flex; align-items:center; gap:6px; padding:8px 12px; border-radius:10px; background:<?php echo $t==='new'?'#e3f2fd':'#fff'; ?>; color:#1e88e5 !important; border:1px solid #cfe2ff; box-shadow:0 1px 3px rgba(0,0,0,0.06);">⟹ Novo Testamento</a>
</div>
<div style="font-weight:700; color:#444; margin-bottom:8px;"><?php echo count($books); ?> livros</div>
<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap:12px; padding:12px 0;">
<?php foreach ($books as $row): $color = $t==='new' ? '#1e88e5' : '#1565c0'; ?>
    <a href="index.php?p=biblia_livro&livro=<?php echo urlencode($row['book_name']); ?>" style="display:flex; align-items:center; gap:12px; padding:14px; border-radius:12px; background:#fff; box-shadow:0 4px 12px rgba(0,0,0,0.08); text-decoration:none; color:#333; border-left:8px solid <?php echo $color; ?>;">
        <div style="width:44px; height:44px; border-radius:12px; background:#e3f2fd; display:flex; align-items:center; justify-content:center; color:<?php echo $color; ?>; font-weight:700;">
            <?php echo htmlspecialchars($row['abrev'] ?: substr($row['book_name'],0,2)); ?>
        </div>
        <div style="display:flex; flex-direction:column;">
            <span style="font-weight:700; font-size:1.05rem; color:#2c3e50;"><?php echo htmlspecialchars($row['book_name']); ?></span>
            <span style="font-size:0.85rem; color:#7f8c8d;"><?php echo htmlspecialchars((string)(int)$row['tot']); ?> capítulos</span>
        </div>
        <div style="margin-left:auto; color:#ccc;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
    </a>
<?php endforeach; ?>
</div>
