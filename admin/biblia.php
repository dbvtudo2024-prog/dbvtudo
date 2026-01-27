<?php
require_once '../includes/config.php';
require_once '../includes/conexao.php';
$current_page = 'biblia';
require_once '../includes/admin_header.php';

// Tabela
$pdo->exec("CREATE TABLE IF NOT EXISTS biblia_versos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    livro VARCHAR(80) NOT NULL,
    livro_ordem INT NULL,
    capitulo INT NOT NULL,
    verso INT NOT NULL,
    texto TEXT NOT NULL,
    UNIQUE KEY uniq_lcv (livro, capitulo, verso)
)");
$pdo->exec("CREATE TABLE IF NOT EXISTS biblia_completa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    book_abbrev VARCHAR(32) NULL,
    book_name VARCHAR(120) NULL,
    chapter VARCHAR(32) NULL,
    verse_number VARCHAR(32) NULL,
    text TEXT NULL,
    testament VARCHAR(16) NULL,
    total_chapters VARCHAR(32) NULL
)");

$executed = 0;
$errors = [];
$done = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['csv_file'])) {
    if ($_FILES['csv_file']['error'] === UPLOAD_ERR_OK) {
        $path = $_FILES['csv_file']['tmp_name'];
        $fh = fopen($path, 'r');
        if ($fh) {
            $pdo->beginTransaction();
            try {
                $header = fgetcsv($fh, 0, ',');
                $map = [];
                foreach ($header as $i => $col) {
                    $k = strtolower(trim($col));
                    $map[$k] = $i;
                }
                $idxLivro = null; foreach (['book','book_name','livro'] as $c) { if (isset($map[$c])) { $idxLivro = $map[$c]; break; } }
                $idxOrd   = null; foreach (['book_id','book_order','livro_ordem','ordem'] as $c) { if (isset($map[$c])) { $idxOrd = $map[$c]; break; } }
                $idxCap   = null; foreach (['chapter','capitulo'] as $c) { if (isset($map[$c])) { $idxCap = $map[$c]; break; } }
                $idxVerso = null; foreach (['verse_number','verse','verso'] as $c) { if (isset($map[$c])) { $idxVerso = $map[$c]; break; } }
                $idxTexto = null; foreach (['text','texto','content'] as $c) { if (isset($map[$c])) { $idxTexto = $map[$c]; break; } }
                $idxAbrev = null; foreach (['book_abbrev','abbrev'] as $c) { if (isset($map[$c])) { $idxAbrev = $map[$c]; break; } }
                $idxTest  = null; foreach (['testament'] as $c) { if (isset($map[$c])) { $idxTest = $map[$c]; break; } }
                $idxTot   = null; foreach (['total_chapters'] as $c) { if (isset($map[$c])) { $idxTot = $map[$c]; break; } }

                if ($idxLivro === null || $idxCap === null || $idxVerso === null || $idxTexto === null) {
                    throw new Exception('CSV inválido: colunas obrigatórias não encontradas (book_name|livro, chapter|capitulo, verse_number|verso, text|texto).');
                }

                $insComp = $pdo->prepare("INSERT INTO biblia_completa (book_abbrev, book_name, chapter, verse_number, text, testament, total_chapters) VALUES (?,?,?,?,?,?,?)");
                $ins = $pdo->prepare("INSERT INTO biblia_versos (livro, livro_ordem, capitulo, verso, texto) VALUES (?,?,?,?,?) 
                                      ON DUPLICATE KEY UPDATE texto = VALUES(texto), livro_ordem = VALUES(livro_ordem)");

                while (($row = fgetcsv($fh, 0, ',')) !== false) {
                    if (count($row) < count($header)) continue;
                    $livro = trim($row[$idxLivro]);
                    $ord   = $idxOrd !== null ? (int)$row[$idxOrd] : null;
                    $capRaw   = trim($row[$idxCap]);
                    $versRaw  = trim($row[$idxVerso]);
                    $texto = trim($row[$idxTexto]);
                    $abrev = $idxAbrev!==null ? trim($row[$idxAbrev]) : null;
                    $test  = $idxTest!==null ? trim($row[$idxTest]) : null;
                    $tot   = $idxTot!==null ? trim($row[$idxTot]) : null;
                    if ($livro === '' || $capRaw === '' || $versRaw === '' || $texto === '') continue;
                    $insComp->execute([$abrev, $livro, $capRaw, $versRaw, $texto, $test, $tot]);
                    $cap   = is_numeric($capRaw) ? (int)$capRaw : 0;
                    $verso = is_numeric($versRaw) ? (int)$versRaw : 0;
                    if ($cap > 0 && $verso > 0) { $ins->execute([$livro, $ord, $cap, $verso, $texto]); }
                    $executed++;
                }
                fclose($fh);
                $pdo->commit();
                $done = true;
            } catch (Exception $e) {
                if ($pdo->inTransaction()) $pdo->rollBack();
                $errors[] = $e->getMessage();
            }
        } else {
            $errors[] = 'Não foi possível abrir o arquivo CSV.';
        }
    } else {
        $errors[] = 'Erro no upload do arquivo CSV.';
    }
}
?>

<h2>Importar Bíblia (CSV - Modelo Supabase)</h2>

<?php if ($done): ?>
    <div style="background:#d4edda;color:#155724;padding:10px;margin-bottom:20px;border-radius:4px;">
        Importação concluída. Registros processados: <?php echo (int)$executed; ?>.
    </div>
<?php endif; ?>
<?php if ($errors): ?>
    <div style="background:#ffebee;color:#c62828;padding:10px;margin-bottom:20px;border-radius:4px;">
        <?php foreach ($errors as $err): ?>
            <div><?php echo htmlspecialchars($err); ?></div>
        <?php endforeach; ?>
    </div>
<?php endif; ?>

<div class="form-container">
    <form method="POST" enctype="multipart/form-data">
        <div class="form-group">
            <label>Arquivo CSV</label>
            <input type="file" name="csv_file" class="form-control" accept=".csv" required>
            <small style="color:#666;">Modelo Supabase: book_abbrev, book_name, chapter, verse_number, text, testament, total_chapters. Também aceita variações (livro, capitulo, verso, texto).</small>
        </div>
        <button type="submit" class="btn-new">Importar</button>
        <a href="dashboard.php" class="btn-back-standard" style="margin-left:10px;">Voltar</a>
    </form>
</div>

<?php require_once '../includes/admin_footer.php'; ?>
<?php
// Abaixo: Seção para Devocionais (cadastro e agendamento)
?>
<h2 style="margin-top:30px;">Devocionais</h2>
<?php
// Garantir tabelas de devocionais
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS biblia_devocionais (id INT AUTO_INCREMENT PRIMARY KEY, titulo VARCHAR(255), referencia VARCHAR(120), texto LONGTEXT, refletir TEXT, created_at DATE, UNIQUE KEY uniq_date (created_at))");
    $pdo->exec("CREATE TABLE IF NOT EXISTS biblia_devocionais_agendados (id INT AUTO_INCREMENT PRIMARY KEY, titulo VARCHAR(255), referencia VARCHAR(120), texto LONGTEXT, refletir TEXT, scheduled_for DATE NOT NULL, published TINYINT(1) DEFAULT 0, published_at TIMESTAMP NULL, UNIQUE KEY uniq_sched (scheduled_for))");
} catch (Exception $e) {}

$dev_msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['dev_add'])) {
        $titulo = trim($_POST['titulo'] ?? '');
        $referencia = trim($_POST['referencia'] ?? '');
        $texto = trim($_POST['texto'] ?? '');
        $refletir = trim($_POST['refletir'] ?? '');
        $data = trim($_POST['data'] ?? date('Y-m-d'));
        if ($titulo && $texto) {
            $stmt = $pdo->prepare("INSERT INTO biblia_devocionais (titulo, referencia, texto, refletir, created_at) VALUES (?,?,?,?,?)");
            try {
                $stmt->execute([$titulo, $referencia, $texto, $refletir, $data]);
                $dev_msg = 'Devocional publicado em ' . htmlspecialchars($data) . '.';
            } catch (Exception $e) {
                $dev_msg = 'Erro ao publicar: ' . $e->getMessage();
            }
        } else {
            $dev_msg = 'Título e Texto são obrigatórios.';
        }
    } elseif (isset($_POST['dev_sched'])) {
        $titulo = trim($_POST['titulo'] ?? '');
        $referencia = trim($_POST['referencia'] ?? '');
        $texto = trim($_POST['texto'] ?? '');
        $refletir = trim($_POST['refletir'] ?? '');
        $scheduled_for = trim($_POST['scheduled_for'] ?? '');
        if ($titulo && $texto && $scheduled_for) {
            $stmt = $pdo->prepare("INSERT INTO biblia_devocionais_agendados (titulo, referencia, texto, refletir, scheduled_for) VALUES (?,?,?,?,?)");
            try {
                $stmt->execute([$titulo, $referencia, $texto, $refletir, $scheduled_for]);
                $dev_msg = 'Devocional agendado para ' . htmlspecialchars($scheduled_for) . '.';
            } catch (Exception $e) {
                $dev_msg = 'Erro ao agendar: ' . $e->getMessage();
            }
        } else {
            $dev_msg = 'Título, Texto e Data são obrigatórios.';
        }
    }
}
?>
<?php if (!empty($dev_msg)): ?>
    <div style="background:#fff3cd;color:#856404;padding:10px;margin-bottom:20px;border-radius:4px;"><?php echo htmlspecialchars($dev_msg); ?></div>
<?php endif; ?>
<div class="form-container" style="margin-top:12px;">
    <h3>Publicar Devocional de Hoje</h3>
    <form method="POST">
        <input type="hidden" name="dev_add" value="1">
        <div class="form-group">
            <label>Título</label>
            <input type="text" name="titulo" class="form-control" required>
        </div>
        <div class="form-group">
            <label>Referência</label>
            <input type="text" name="referencia" class="form-control" placeholder="Livro Capítulo:Verso">
        </div>
        <div class="form-group">
            <label>Texto</label>
            <textarea name="texto" class="form-control" rows="6" required></textarea>
        </div>
        <div class="form-group">
            <label>Refletir</label>
            <textarea name="refletir" class="form-control" rows="4"></textarea>
        </div>
        <div class="form-group">
            <label>Data</label>
            <input type="date" name="data" class="form-control" value="<?php echo date('Y-m-d'); ?>">
        </div>
        <button type="submit" class="btn-new">Publicar</button>
    </form>
</div>

<div class="form-container" style="margin-top:12px;">
    <h3>Agendar Devocional</h3>
    <form method="POST">
        <input type="hidden" name="dev_sched" value="1">
        <div class="form-group">
            <label>Título</label>
            <input type="text" name="titulo" class="form-control" required>
        </div>
        <div class="form-group">
            <label>Referência</label>
            <input type="text" name="referencia" class="form-control" placeholder="Livro Capítulo:Verso">
        </div>
        <div class="form-group">
            <label>Texto</label>
            <textarea name="texto" class="form-control" rows="6" required></textarea>
        </div>
        <div class="form-group">
            <label>Refletir</label>
            <textarea name="refletir" class="form-control" rows="4"></textarea>
        </div>
        <div class="form-group">
            <label>Data de Publicação</label>
            <input type="date" name="scheduled_for" class="form-control" required>
        </div>
        <button type="submit" class="btn-new">Agendar</button>
    </form>
</div>
