<?php
// Configurações gerais do sistema
define('SITE_NAME', 'DBV Tudo');
define('BASE_URL', 'http://localhost/dbvtudo'); // Ajuste conforme seu ambiente

// Configurações de Banco de Dados
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', ''); // Senha padrão do Laragon/XAMPP geralmente é vazia
define('DB_NAME', 'dbvtudo');
// define('DB_PORT', 3306); // Porta padrão MySQL (3306). Geralmente não é necessário especificar se usar 'localhost'

// Integrações externas
define('YT_API_KEY', ''); // Opcional: chave da API YouTube Data v3 para metadados avançados
define('CPB_DEVOCIONAL_URL', 'https://mais.cpb.com.br/meditacao/alegria-na-juventude/');

// Configuração de timezone
date_default_timezone_set('America/Sao_Paulo');

// Iniciar sessão em todas as páginas
session_start();
 
    $dbh = isset($pdo) ? $pdo : null;
    if ($dbh instanceof PDO) {
        $dbh->exec("CREATE TABLE IF NOT EXISTS biblia_devocionais (id INT AUTO_INCREMENT PRIMARY KEY, titulo VARCHAR(255), referencia VARCHAR(120), texto LONGTEXT, refletir TEXT, created_at DATE, UNIQUE KEY uniq_date (created_at))");
        $dbh->exec("CREATE TABLE IF NOT EXISTS biblia_devocionais_agendados (id INT AUTO_INCREMENT PRIMARY KEY, titulo VARCHAR(255), referencia VARCHAR(120), texto LONGTEXT, refletir TEXT, scheduled_for DATE NOT NULL, published TINYINT(1) DEFAULT 0, published_at TIMESTAMP NULL, UNIQUE KEY uniq_sched (scheduled_for))");
        $today = date('Y-m-d');
        $has = $dbh->prepare("SELECT 1 FROM biblia_devocionais WHERE created_at=?");
        $has->execute([$today]);
        if (!$has->fetchColumn()) {
            $get = $dbh->prepare("SELECT id, titulo, referencia, texto, refletir FROM biblia_devocionais_agendados WHERE scheduled_for <= ? AND published=0 ORDER BY scheduled_for ASC LIMIT 1");
            $get->execute([$today]);
            $row = $get->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $ins = $dbh->prepare("INSERT INTO biblia_devocionais (titulo, referencia, texto, refletir, created_at) VALUES (?,?,?,?,?)");
                $ins->execute([$row['titulo'], $row['referencia'], $row['texto'], $row['refletir'], $today]);
                $upd = $dbh->prepare("UPDATE biblia_devocionais_agendados SET published=1, published_at=NOW() WHERE id=?");
                $upd->execute([(int)$row['id']]);
            } else {
                $url = CPB_DEVOCIONAL_URL;
                $html = null;
                if (function_exists('curl_init')) {
                    $ch = curl_init($url);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
                    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
                    $html = curl_exec($ch);
                    curl_close($ch);
                } else {
                    $html = @file_get_contents($url);
                }
                if ($html) {
                    $dom = new DOMDocument();
                    @$dom->loadHTML($html);
                    $xp = new DOMXPath($dom);
                    $titleNode = $xp->query('//h1')->item(0);
                    $title = $titleNode ? trim($titleNode->textContent) : '';
                    if ($title === '') {
                        $tNodes = $xp->query('//title');
                        $title = $tNodes->length ? trim($tNodes->item(0)->textContent) : '';
                    }
                    $articleNodes = $xp->query('//article//p|//main//p');
                    $parts = [];
                    foreach ($articleNodes as $p) { $parts[] = trim($p->textContent); }
                    $textAll = trim(implode("\n\n", array_filter($parts)));
                    $ref = '';
                    if ($textAll !== '') {
                        if (preg_match('/([A-Za-zÀ-ú\\s]+\\s\\d{1,3}:\\d{1,3})/u', $textAll, $m)) { $ref = $m[1]; }
                    }
                    if ($title !== '' && $textAll !== '') {
                        $ins = $dbh->prepare("INSERT INTO biblia_devocionais (titulo, referencia, texto, refletir, created_at) VALUES (?,?,?,?,?)");
                        $ins->execute([$title, $ref, $textAll, '', $today]);
                    }
                }
            }
        }
    }
?>
