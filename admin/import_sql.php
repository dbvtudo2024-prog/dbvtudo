<?php
require_once '../includes/config.php';
require_once '../includes/conexao.php';
$current_page = 'import_sql';
require_once '../includes/admin_header.php';

$executed = 0;
$errors = [];
$done = false;
$info = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['sql_file']) && $_FILES['sql_file']['error'] === UPLOAD_ERR_OK) {
        $raw = file_get_contents($_FILES['sql_file']['tmp_name']);
        $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        $dialect = 'unknown';
        if (preg_match('/public\\."|COPY\\s|SET\\s+search_path|CREATE\\s+EXTENSION/i', $raw)) {
            $dialect = 'pgsql';
        } elseif (preg_match('/AUTO_INCREMENT|ENGINE=|`[A-Za-z0-9_]+`/', $raw)) {
            $dialect = 'mysql';
        }

        if ($dialect === 'pgsql' && $driver === 'mysql') {
            // Converter sintaxe básica de PostgreSQL para MySQL
            $convertPgToMysql = function($stmt) {
                $s = $stmt;
                // Remover schema public. e aspas em identificadores
                $s = preg_replace('/"?public"?\\."?([A-Za-z0-9_]+)"?/i', '$1', $s);
                // Remover qualquer outro schema.qualifier
                $s = preg_replace('/"?[A-Za-z0-9_]+"?\\."?([A-Za-z0-9_]+)"?/i', '$1', $s);
                // Remover aspas de identificadores restantes
                $s = preg_replace('/"([A-Za-z0-9_]+)"/', '$1', $s);
                // Tipos
                $s = preg_replace('/bigint\\s+generated\\s+by\\s+default\\s+as\\s+identity/i', 'BIGINT AUTO_INCREMENT', $s);
                $s = preg_replace('/timestamp\\s+with\\s+time\\s+zone/i', 'TIMESTAMP', $s);
                $s = preg_replace('/boolean/i', 'TINYINT(1)', $s);
                $s = preg_replace('/text/i', 'TEXT', $s);
                // Defaults e booleanos
                $s = preg_replace('/DEFAULT\\s+now\\(\\)/i', 'DEFAULT CURRENT_TIMESTAMP', $s);
                $s = preg_replace('/\\btrue\\b/i', '1', $s);
                $s = preg_replace('/\\bfalse\\b/i', '0', $s);
                // Remover casts ::type
                $s = preg_replace('/::[A-Za-z0-9_]+/', '', $s);
                // Adicionar PRIMARY KEY (id) se não existir
                if (preg_match('/^\\s*CREATE\\s+TABLE\\s+([A-Za-z0-9_`]+)\\s*\\(/i', $s)) {
                    if (!preg_match('/PRIMARY\\s+KEY/i', $s) && preg_match('/\\bid\\b/i', $s)) {
                        $s = preg_replace('/\\)\\s*$/', ', PRIMARY KEY (id))', $s);
                    }
                }
                return $s;
            };
            // Normalização ampla antes de dividir
            $norm = $raw;
            $norm = preg_replace('/"public"\\."([^"]+)"/i', '$1', $norm);
            $norm = preg_replace('/public\\."([^"]+)"/i', '$1', $norm);
            $norm = preg_replace('/"([A-Za-z0-9_]+)"\\."([A-Za-z0-9_]+)"/', '$2', $norm);
            $norm = preg_replace('/"([A-Za-z0-9_]+)"/', '$1', $norm);
            $content = preg_replace('/\/\*[\s\S]*?\*\//', '', $norm);
            $lines = preg_split('/\r\n|\r|\n/', $content);
            $clean = [];
            foreach ($lines as $line) {
                $l = trim($line);
                if ($l === '') continue;
                if (strpos($l, '--') === 0) continue;
                $clean[] = $l;
            }
            $sql = implode("\n", $clean);
            $statements = array_filter(array_map('trim', explode(';', $sql)));
            // Habilitar ANSI_QUOTES para aceitar aspas como identificadores no MySQL
            try { $pdo->exec("SET SESSION sql_mode = CONCAT(@@sql_mode, ',ANSI_QUOTES')"); } catch (PDOException $e) {}
            foreach ($statements as $stmt) {
                if ($stmt === '') continue;
                if (!preg_match('/^(CREATE|ALTER|INSERT|UPDATE|DELETE|TRUNCATE|DROP)\b/i', $stmt)) {
                    continue;
                }
                $stmtConv = $convertPgToMysql($stmt);
                // Mapeamento específico: trazer dados de EspecialidadesDBV (PostgreSQL) para tabela local 'especialidades'
                $stmtConv = preg_replace('/\bpublic\s*\.\s*EspecialidadesDBV\b/i', 'EspecialidadesDBV', $stmtConv);
                $stmtConv = preg_replace('/\bEspecialidadesDBV\b/i', 'especialidades', $stmtConv);
                // Mapear nomes de colunas do dump para nosso schema
                $colMap = [
                    ' ID ' => ' especialidade_id ',
                    '(ID' => '(especialidade_id',
                    ',ID' => ',especialidade_id',
                    ' Nome ' => ' nome ',
                    '(Nome' => '(nome',
                    ',Nome' => ',nome',
                    ' Imagem ' => ' imagem ',
                    '(Imagem' => '(imagem',
                    ',Imagem' => ',imagem',
                    ' Categoria ' => ' area ',
                    '(Categoria' => '(area',
                    ',Categoria' => ',area',
                    ' Nivel ' => ' nivel ',
                    '(Nivel' => '(nivel',
                    ',Nivel' => ',nivel',
                    ' Ano ' => ' ano ',
                    '(Ano' => '(ano',
                    ',Ano' => ',ano',
                    ' Questoes ' => ' requisitos ',
                    '(Questoes' => '(requisitos',
                    ',Questoes' => ',requisitos',
                    ' Sigla ' => ' sigla ',
                    '(Sigla' => '(sigla',
                    ',Sigla' => ',sigla',
                    ' Origem ' => ' origem ',
                    '(Origem' => '(origem',
                    ',Origem' => ',origem',
                    ' Likes ' => ' likes ',
                    '(Likes' => '(likes',
                    ',Likes' => ',likes',
                    ' Cor ' => ' cor ',
                    '(Cor' => '(cor',
                    ',Cor' => ',cor',
                    ' Status ' => ' status ',
                    '(Status' => '(status',
                    ',Status' => ',status',
                ];
                foreach ($colMap as $from => $to) {
                    $stmtConv = str_replace($from, $to, $stmtConv);
                }
                // Evitar erro de CREATE TABLE conflitante: adicionar IF NOT EXISTS
                $stmtConv = preg_replace('/^\s*CREATE\s+TABLE\s+([`"]?especialidades[`"]?)/i', 'CREATE TABLE IF NOT EXISTS $1', $stmtConv);
                try {
                    $pdo->exec($stmtConv);
                    $executed++;
                } catch (PDOException $e) {
                    $errors[] = $e->getMessage();
                }
            }
            $done = true;
        } else {
            $content = preg_replace('/\/\*[\s\S]*?\*\//', '', $raw);
            $lines = preg_split('/\r\n|\r|\n/', $content);
            $clean = [];
            foreach ($lines as $line) {
                $l = trim($line);
                if ($l === '') continue;
                if (strpos($l, '--') === 0) continue;
                $clean[] = $l;
            }
            $sql = implode("\n", $clean);
            $statements = array_filter(array_map('trim', explode(';', $sql)));
            foreach ($statements as $stmt) {
                if ($stmt === '') continue;
                if (!preg_match('/^(CREATE|ALTER|INSERT|UPDATE|DELETE|TRUNCATE|DROP)\\b/i', $stmt)) {
                    continue;
                }
                try {
                    $pdo->exec($stmt);
                    $executed++;
                } catch (PDOException $e) {
                    $errors[] = $e->getMessage();
                }
            }
            $done = true;
        }
    } else {
        $errors[] = 'Arquivo inválido';
        $done = true;
    }
}
?>

<h2>Importar SQL</h2>
<p>Envie um arquivo .sql para executar no banco de dados atual.</p>
<p style="font-size:12px;color:#6c757d;">A importação executa apenas comandos válidos (CREATE/ALTER/INSERT/UPDATE/DELETE/TRUNCATE/DROP). Se o arquivo for de PostgreSQL e você estiver conectado em MySQL, aplicamos uma conversão básica (identificadores, tipos e defaults) para permitir a importação.</p>

<?php if ($done): ?>
    <div style="background:#d4edda;color:#155724;padding:10px;border-radius:4px;margin-bottom:15px;">
        <strong>Execuções concluídas:</strong> <?php echo $executed; ?>
    </div>
    <?php if (!empty($errors)): ?>
        <div style="background:#fff3cd;color:#856404;padding:10px;border-radius:4px;margin-bottom:15px;">
            <strong>Ocorreram erros:</strong>
            <ul>
                <?php foreach ($errors as $err): ?>
                    <li><?php echo htmlspecialchars($err); ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
    <?php endif; ?>
<?php endif; ?>

<form method="POST" enctype="multipart/form-data">
    <div class="form-group">
        <label>Arquivo SQL</label>
        <input type="file" name="sql_file" accept=".sql" class="form-control" required>
    </div>
    <button type="submit" class="btn-new">Importar</button>
</form>

<?php require_once '../includes/admin_footer.php'; ?>
