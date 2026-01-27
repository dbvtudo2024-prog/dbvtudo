<?php
require_once '../includes/config.php';
require_once '../includes/conexao.php';
$current_page = 'devocionais';
require_once '../includes/admin_header.php';

try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS biblia_devocionais (id INT AUTO_INCREMENT PRIMARY KEY, titulo VARCHAR(255), referencia VARCHAR(120), texto LONGTEXT, refletir TEXT, created_at DATE, UNIQUE KEY uniq_date (created_at))");
    $pdo->exec("CREATE TABLE IF NOT EXISTS biblia_devocionais_agendados (id INT AUTO_INCREMENT PRIMARY KEY, titulo VARCHAR(255), referencia VARCHAR(120), texto LONGTEXT, refletir TEXT, scheduled_for DATE NOT NULL, published TINYINT(1) DEFAULT 0, published_at TIMESTAMP NULL, UNIQUE KEY uniq_sched (scheduled_for))");
} catch (Exception $e) {}

$msg = '';
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
                $msg = 'Devocional publicado em ' . htmlspecialchars($data) . '.';
            } catch (Exception $e) {
                $msg = 'Erro ao publicar: ' . $e->getMessage();
            }
        } else {
            $msg = 'Título e Texto são obrigatórios.';
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
                $msg = 'Devocional agendado para ' . htmlspecialchars($scheduled_for) . '.';
            } catch (Exception $e) {
                $msg = 'Erro ao agendar: ' . $e->getMessage();
            }
        } else {
            $msg = 'Título, Texto e Data são obrigatórios.';
        }
    }
}
?>
<h2>Devocionais</h2>
<?php if (!empty($msg)): ?>
    <div style="background:#fff3cd;color:#856404;padding:10px;margin-bottom:20px;border-radius:4px;"><?php echo htmlspecialchars($msg); ?></div>
<?php endif; ?>
<div class="form-container">
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
<?php
// Importar Devocionais CPB (Teen)
// Tabela para armazenar itens externos
try {
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    if ($driver === 'pgsql') {
        $pdo->exec('CREATE TABLE IF NOT EXISTS devocionais_cpb (id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, titulo TEXT, url TEXT UNIQUE, imagem TEXT, descricao TEXT, fonte TEXT)');
    } else {
        $pdo->exec('CREATE TABLE IF NOT EXISTS devocionais_cpb (id INT AUTO_INCREMENT PRIMARY KEY, titulo VARCHAR(255), url VARCHAR(500) UNIQUE, imagem VARCHAR(500), descricao TEXT, fonte VARCHAR(255))');
    }
} catch (Exception $e) {}

$import_msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['import_cpb'])) {
    $CPB_URL = trim($_POST['cpb_url'] ?? 'https://cpb.com.br/categoria/4/1430/devocionais/teen');
    $html = '';
    // Buscar HTML com cURL para evitar bloqueios
    $ch = curl_init($CPB_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DBVTudoBot/1.0',
    ]);
    $html = curl_exec($ch);
    curl_close($ch);
    if (!$html) {
        $import_msg = 'Falha ao obter conteúdo da CPB.';
    } else {
        libxml_use_internal_errors(true);
        $dom = new DOMDocument();
        $dom->loadHTML($html);
        $xpath = new DOMXPath($dom);
        // Heurística: procurar links de produtos (contendo "/produto/")
        $nodes = $xpath->query('//a[contains(@href,"/produto/")]');
        $inserted = 0;
        $skipped = 0;
        foreach ($nodes as $a) {
            $href = $a->getAttribute('href');
            if (!$href) continue;
            // Título: texto do link ou do elemento de título próximo
            $title = trim($a->textContent);
            if ($title === '') {
                // tentar pegar título em ancestor
                $h = $xpath->query('.//h3|.//h2', $a);
                if ($h && $h->length) $title = trim($h->item(0)->textContent);
            }
            // Imagem: procurar img próximo
            $imgNode = null;
            $imgCandidates = $xpath->query('.//img', $a);
            if ($imgCandidates && $imgCandidates->length) {
                $imgNode = $imgCandidates->item(0);
            } else {
                // tentar encontrar img no pai
                $parent = $a->parentNode;
                if ($parent) {
                    $imgCandidates = $xpath->query('.//img', $parent);
                    if ($imgCandidates && $imgCandidates->length) {
                        $imgNode = $imgCandidates->item(0);
                    }
                }
            }
            $img = $imgNode ? $imgNode->getAttribute('src') : '';
            // Absolutizar URLs relativas
            $base = 'https://cpb.com.br';
            if (strpos($href, 'http') !== 0) $href = rtrim($base, '/') . '/' . ltrim($href, '/');
            if ($img && strpos($img, 'http') !== 0) $img = rtrim($base, '/') . '/' . ltrim($img, '/');
            // Filtrar duplicados por URL
            $existsStmt = $pdo->prepare('SELECT 1 FROM devocionais_cpb WHERE url = ?');
            $existsStmt->execute([$href]);
            if ($existsStmt->fetchColumn()) { $skipped++; continue; }
            $ins = $pdo->prepare('INSERT INTO devocionais_cpb (titulo, url, imagem, descricao, fonte) VALUES (?,?,?,?,?)');
            $ok = false;
            try {
                $ok = $ins->execute([$title ?: $href, $href, $img, null, 'CPB Teen']);
            } catch (Exception $e) { $ok = false; }
            if ($ok) $inserted++; else $skipped++;
        }
        $import_msg = "Importação CPB concluída. Inseridos: {$inserted}, Ignorados: {$skipped}.";
    }
}
?>
<?php if (!empty($import_msg)): ?>
    <div style="background:#d4edda;color:#155724;padding:10px;margin-bottom:20px;border-radius:4px;"><?php echo htmlspecialchars($import_msg); ?></div>
<?php endif; ?>
<div class="form-container" style="margin-top:12px;">
    <h3>Importar Devocionais (CPB Teen)</h3>
    <form method="POST">
        <input type="hidden" name="import_cpb" value="1">
        <div class="form-group">
            <label>URL da Categoria</label>
            <input type="text" name="cpb_url" class="form-control" value="https://cpb.com.br/categoria/4/1430/devocionais/teen">
            <small style="color:#777;">Ex.: https://cpb.com.br/categoria/4/1430/devocionais/teen</small>
        </div>
        <button type="submit" class="btn-new">Importar da CPB</button>
    </form>
</div>
<?php require_once '../includes/admin_footer.php'; ?>
