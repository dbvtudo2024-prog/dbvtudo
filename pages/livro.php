<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/conexao.php';
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
?>
<a href="index.php?p=livros" class="btn-back-standard">Voltar</a>
<h2>Livro</h2>
<?php if ($id <= 0): ?>
    <p>Livro não encontrado.</p>
<?php else: ?>
    <?php
        $pdo->exec("CREATE TABLE IF NOT EXISTS livros (id INT AUTO_INCREMENT PRIMARY KEY, titulo VARCHAR(255), autor VARCHAR(255), descricao TEXT, imagem VARCHAR(255))");
        $stmt = $pdo->prepare("SELECT * FROM livros WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
    ?>
    <?php if (!$row): ?>
        <p>Livro não encontrado.</p>
    <?php else: ?>
        <div class="card" style="max-width:900px;margin:0 auto;">
            <div class="card-body">
                <?php if (isset($row['categoria']) && $row['categoria']): ?><span class="badge"><?php echo htmlspecialchars($row['categoria']); ?></span><?php endif; ?>
                <h3 class="card-title"><?php echo htmlspecialchars($row['titulo']); ?></h3>
                <?php if (!empty($row['autor'])): ?><p class="card-text"><?php echo htmlspecialchars($row['autor']); ?></p><?php endif; ?>
                <?php if (!empty($row['descricao'])): ?>
                    <div style="margin-top: 6px; font-size: 14px; white-space: pre-wrap;"><?php echo htmlspecialchars($row['descricao']); ?></div>
                <?php endif; ?>
                <?php
                    $viewer = '';
                    if (!empty($row['arquivo'])) {
                        $file = $row['arquivo'];
                        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
                        $url = BASE_URL . '/uploads/' . $file;
                        if ($ext === 'pdf') {
                            $viewer = '<iframe src="'.$url.'" style="width:100%;height:700px;border:1px solid #eee;border-radius:6px;"></iframe>';
                        } elseif ($ext === 'doc' || $ext === 'docx') {
                            $viewer = '<iframe src="https://view.officeapps.live.com/op/embed.aspx?src='.urlencode($url).'" style="width:100%;height:700px;border:1px solid #eee;border-radius:6px;"></iframe>';
                        }
                    }
                ?>
                <?php if ($viewer): ?>
                    <div style="margin-top:12px;"><?php echo $viewer; ?></div>
                <?php elseif (!empty($row['arquivo'])): ?>
                    <a href="uploads/<?php echo $row['arquivo']; ?>" class="btn-admin" style="margin-top:10px;" target="_blank">Abrir</a>
                <?php endif; ?>
            </div>
        </div>
    <?php endif; ?>
<?php endif; ?>

