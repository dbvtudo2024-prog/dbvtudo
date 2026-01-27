<?php
require_once '../includes/config.php';
require_once '../includes/conexao.php';
$current_page = 'biblia_dicionario';
$pdo->exec("CREATE TABLE IF NOT EXISTS biblia_dicionario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    nome TEXT NULL,
    texto TEXT NULL,
    categoria TEXT NULL,
    referencia TEXT NULL
)");
$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['truncate'])) {
        try { $pdo->exec("TRUNCATE TABLE biblia_dicionario"); $msg = 'Limpo'; } catch (Exception $e) { $msg = 'Erro'; }
        header("Location: biblia_dicionario.php?msg=".$msg); exit;
    }
    if (isset($_POST['import_csv']) && isset($_FILES['csv_file']) && $_FILES['csv_file']['error']===UPLOAD_ERR_OK) {
        $tmp = $_FILES['csv_file']['tmp_name'];
        $fh = fopen($tmp, 'r');
        if ($fh) {
            $header = fgetcsv($fh, 0, ',');
            if (!$header || count($header) < 2) { rewind($fh); $header = fgetcsv($fh, 0, ';'); }
            if (!$header || count($header) < 2) { rewind($fh); $header = fgetcsv($fh, 0, "\t"); }
            if ($header) {
                $map = [];
                foreach ($header as $i => $col) { $map[strtolower(trim($col))] = $i; }
                $ins = $pdo->prepare("INSERT INTO biblia_dicionario (nome, texto, categoria, referencia) VALUES (?,?,?,?)");
                $count = 0;
                while (($r = fgetcsv($fh, 0, ',')) !== false || ($r = fgetcsv($fh, 0, ';')) !== false || ($r = fgetcsv($fh, 0, "\t")) !== false) {
                    $get = function($k) use ($map, $r) {
                        $idx = $map[strtolower($k)] ?? null;
                        if ($idx === null) return null;
                        return isset($r[$idx]) ? trim($r[$idx]) : null;
                    };
                    $nome = $get('nome');
                    $texto = $get('texto');
                    $categoria = $get('categoria');
                    $referencia = $get('referencia');
                    if ($nome || $texto) {
                        $ins->execute([$nome, $texto, $categoria, $referencia]);
                        $count++;
                    }
                }
                fclose($fh);
                header("Location: biblia_dicionario.php?msg=importado&n={$count}"); exit;
            }
        }
        header("Location: biblia_dicionario.php?msg=erro_csv"); exit;
    }
}
require_once '../includes/admin_header.php';
?>
<h2>Dicionário Bíblico</h2>
<?php if (isset($_GET['msg'])): ?>
    <div style="background:#d4edda;color:#155724;padding:10px;margin-bottom:20px;border-radius:4px;">
        <?php 
        if($_GET['msg']==='importado') echo "CSV importado. Registros: ".(int)($_GET['n'] ?? 0);
        if($_GET['msg']==='Limpo') echo "Tabela limpa.";
        if($_GET['msg']==='erro_csv') echo "Falha ao processar CSV.";
        ?>
    </div>
<?php endif; ?>
<div class="form-container" style="max-width:700px;">
    <form method="POST" enctype="multipart/form-data">
        <input type="hidden" name="import_csv" value="1">
        <div class="form-group">
            <label>CSV do Supabase (Biblia_Dicionario)</label>
            <input type="file" name="csv_file" class="form-control" accept=".csv" required>
        </div>
        <button class="btn-new" type="submit">Importar CSV</button>
    </form>
    <form method="POST" style="margin-top:10px;" onsubmit="return confirm('Tem certeza que deseja limpar a tabela?');">
        <input type="hidden" name="truncate" value="1">
        <button class="btn-delete" type="submit">Limpar Tabela</button>
    </form>
</div>
<?php require_once '../includes/admin_footer.php'; ?>
