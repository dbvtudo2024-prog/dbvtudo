<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/conexao.php';
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) { echo '<a href="index.php?p=biblia_plano" class="btn-back-standard">Voltar</a><div class="card"><div class="card-body">Plano não encontrado.</div></div>'; return; }
$pdo->exec("CREATE TABLE IF NOT EXISTS biblia_planos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NULL,
    dias INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");
$pdo->exec("CREATE TABLE IF NOT EXISTS biblia_plano_dias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plano_id INT NOT NULL,
    dia INT NOT NULL,
    leitura_json TEXT NOT NULL,
    UNIQUE KEY uniq_plano_dia (plano_id, dia)
)");
$pdo->exec("CREATE TABLE IF NOT EXISTS biblia_plano_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    plano_id INT NOT NULL,
    dia INT NOT NULL,
    done TINYINT(1) NOT NULL DEFAULT 0,
    done_at TIMESTAMP NULL,
    UNIQUE KEY uniq_user_plano_dia (user_id, plano_id, dia)
)");
$plan = $pdo->prepare("SELECT * FROM biblia_planos WHERE id=?");
$plan->execute([$id]);
$p = $plan->fetch(PDO::FETCH_ASSOC);
if (!$p) { echo '<a href="index.php?p=biblia_plano" class="btn-back-standard">Voltar</a><div class="card"><div class="card-body">Plano não encontrado.</div></div>'; return; }

function buildOrder(PDO $pdo, array $planRow) {
    $orderOld = ['Gênesis','Êxodo','Levítico','Números','Deuteronômio','Josué','Juízes','Rute','1 Samuel','2 Samuel','1 Reis','2 Reis','1 Crônicas','2 Crônicas','Esdras','Neemias','Ester','Jó','Salmos','Provérbios','Eclesiastes','Cânticos','Isaías','Jeremias','Lamentações','Ezequiel','Daniel','Oséias','Joel','Amós','Obadias','Jonas','Miqueias','Naum','Habacuque','Sofonias','Ageu','Zacarias','Malaquias'];
    $orderNew = ['Mateus','Marcos','Lucas','João','Atos','Romanos','1 Coríntios','2 Coríntios','Gálatas','Efésios','Filipenses','Colossenses','1 Tessalonicenses','2 Tessalonicenses','1 Timóteo','2 Timóteo','Tito','Filemom','Hebreus','Tiago','1 Pedro','2 Pedro','1 João','2 João','3 João','Judas','Apocalipse'];
    $titulo = isset($planRow['titulo']) ? mb_strtolower($planRow['titulo'],'UTF-8') : '';
    if (strpos($titulo, 'novo testamento') !== false) {
        $books = $orderNew;
    } elseif (strpos($titulo, 'salmos') !== false || strpos($titulo, 'provérbios') !== false || strpos($titulo, 'proverbios') !== false) {
        $books = ['Salmos','Provérbios'];
    } else {
        $books = array_merge($orderOld, $orderNew);
    }
    $chapters = [];
    foreach ($books as $bk) {
        $stmt = $pdo->prepare("SELECT DISTINCT chapter FROM biblia_completa WHERE book_name = ? ORDER BY CAST(chapter AS UNSIGNED) ASC");
        try { $stmt->execute([$bk]); } catch (Exception $e) { continue; }
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $cap = is_numeric($row['chapter']) ? (int)$row['chapter'] : $row['chapter'];
            $chapters[] = ['book' => $bk, 'chapter' => $cap];
        }
    }
    return $chapters;
}

$dias = (int)$p['dias'];
$countDays = (int)$pdo->prepare("SELECT COUNT(*) FROM biblia_plano_dias WHERE plano_id=?")->execute([$id]) ? (int)$pdo->query("SELECT COUNT(*) FROM biblia_plano_dias WHERE plano_id={$id}")->fetchColumn() : 0;
if ($countDays === 0) {
    $chapters = buildOrder($pdo, $p);
    $total = count($chapters);
    if ($total > 0) {
        $perDay = max(1, (int)ceil($total / $dias));
        $ins = $pdo->prepare("INSERT INTO biblia_plano_dias (plano_id, dia, leitura_json) VALUES (?,?,?)");
        $day = 1;
        $buf = [];
        foreach ($chapters as $c) {
            $buf[] = $c;
            if (count($buf) >= $perDay) {
                $ins->execute([$id, $day, json_encode($buf, JSON_UNESCAPED_UNICODE)]);
                $buf = [];
                $day++;
            }
            if ($day > $dias) { $day = $dias; }
        }
        if ($buf) { $ins->execute([$id, $day, json_encode($buf, JSON_UNESCAPED_UNICODE)]); }
    }
} else {
    $sample = $pdo->prepare("SELECT leitura_json FROM biblia_plano_dias WHERE plano_id=? LIMIT 1");
    $sample->execute([$id]);
    $sj = $sample->fetchColumn();
    $list = $sj ? json_decode($sj, true) : [];
    $chaptersAllowed = buildOrder($pdo, $p);
    $allowedBooks = array_values(array_unique(array_map(function($c){ return $c['book']; }, $chaptersAllowed)));
    $needsRecalc = false;
    foreach ($list as $c) {
        if (!in_array($c['book'], $allowedBooks, true)) { $needsRecalc = true; break; }
    }
    if ($needsRecalc) {
        $pdo->prepare("DELETE FROM biblia_plano_dias WHERE plano_id=?")->execute([$id]);
        $chapters = $chaptersAllowed;
        $total = count($chapters);
        if ($total > 0) {
            $perDay = max(1, (int)ceil($total / $dias));
            $ins = $pdo->prepare("INSERT INTO biblia_plano_dias (plano_id, dia, leitura_json) VALUES (?,?,?)");
            $day = 1;
            $buf = [];
            foreach ($chapters as $c) {
                $buf[] = $c;
                if (count($buf) >= $perDay) {
                    $ins->execute([$id, $day, json_encode($buf, JSON_UNESCAPED_UNICODE)]);
                    $buf = [];
                    $day++;
                }
                if ($day > $dias) { $day = $dias; }
            }
            if ($buf) { $ins->execute([$id, $day, json_encode($buf, JSON_UNESCAPED_UNICODE)]); }
        }
    }
}
$uid = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
$rows = $pdo->prepare("SELECT dia, leitura_json FROM biblia_plano_dias WHERE plano_id=? ORDER BY dia ASC");
$rows->execute([$id]);
$days = $rows->fetchAll(PDO::FETCH_ASSOC);
$statusMap = [];
if ($uid) {
    $st = $pdo->prepare("SELECT dia, done FROM biblia_plano_status WHERE user_id <=> ? AND plano_id=?");
    $st->execute([$uid, $id]);
    foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $s) { $statusMap[(int)$s['dia']] = (int)$s['done']; }
}
if ($_SERVER['REQUEST_METHOD']==='POST' && isset($_POST['toggle_day'])) {
    $d = (int)$_POST['toggle_day'];
    $new = isset($statusMap[$d]) && $statusMap[$d] ? 0 : 1;
    $stmt = $pdo->prepare("INSERT INTO biblia_plano_status (user_id, plano_id, dia, done, done_at) VALUES (?,?,?,?,NOW()) ON DUPLICATE KEY UPDATE done=VALUES(done), done_at=VALUES(done_at)");
    $stmt->execute([$uid, $id, $d, $new]);
    header("Location: index.php?p=biblia_plano_detalhe&id=".$id); exit;
}
?>
<a href="index.php?p=biblia_plano" class="btn-back-standard">Voltar</a>
<div style="max-width:900px;">
    <div style="background:#fff; border-radius:16px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <div style="font-weight:800; font-size:20px; margin-bottom:6px;"><?php echo htmlspecialchars($p['titulo']); ?></div>
        <div style="color:#555;"><?php echo htmlspecialchars($p['descricao']); ?></div>
        <div style="margin-top:10px; height:8px; background:#eee; border-radius:8px; overflow:hidden;">
            <?php
            $doneCount = array_sum($statusMap);
            $progress = ($dias>0) ? min(100, round(($doneCount/$dias)*100)) : 0;
            ?>
            <div style="height:8px; width:<?php echo $progress; ?>%; background:#26a69a;"></div>
        </div>
        <div style="font-size:12px; color:#777; margin-top:6px;"><?php echo (int)$doneCount; ?> / <?php echo (int)$dias; ?> dias concluídos</div>
    </div>
    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap:12px; margin-top:12px;">
    <?php foreach ($days as $idx => $d): 
        $diaNum = (int)$d['dia'];
        $list = json_decode($d['leitura_json'], true) ?: [];
        $done = isset($statusMap[$diaNum]) && $statusMap[$diaNum];
        ?>
        <div class="card">
            <div class="card-body">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-weight:700;">Dia <?php echo $diaNum; ?></div>
                    <form method="POST">
                        <input type="hidden" name="toggle_day" value="<?php echo $diaNum; ?>">
                        <button class="btn-admin" type="submit" style="background:<?php echo $done?'#2e7d32':'#d32f2f'; ?>;"><?php echo $done?'Concluído':'Marcar'; ?></button>
                    </form>
                </div>
                <ul style="margin-top:8px; padding-left:18px;">
                    <?php foreach ($list as $c): ?>
                        <li><?php echo htmlspecialchars($c['book']); ?> <?php echo htmlspecialchars((string)$c['chapter']); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        </div>
    <?php endforeach; ?>
    </div>
</div>
