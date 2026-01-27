<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/conexao.php';
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
?>
<a href="index.php?p=ideais" class="btn-back-standard">Voltar</a>
<h2>Ideal / Hino</h2>
<?php if ($id <= 0): ?>
    <p>Item não encontrado.</p>
<?php else: ?>
    <?php
        $pdo->exec("CREATE TABLE IF NOT EXISTS ideais (id INT AUTO_INCREMENT PRIMARY KEY, tipo VARCHAR(50), titulo VARCHAR(255), conteudo TEXT, imagem VARCHAR(255))");
        $stmt = $pdo->prepare("SELECT * FROM ideais WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
    ?>
    <?php if (!$row): ?>
        <p>Item não encontrado.</p>
    <?php else: ?>
        <div class="card" style="max-width:900px;margin:0 auto;">
            <?php if (!empty($row['imagem'])): ?>
                <img src="uploads/<?php echo $row['imagem']; ?>" alt="<?php echo htmlspecialchars($row['titulo']); ?>" class="card-img" style="height: 220px; object-fit: contain; padding: 10px;">
            <?php endif; ?>
            <div class="card-body">
                <span class="badge"><?php echo htmlspecialchars($row['tipo']); ?></span>
                <h3 class="card-title"><?php echo htmlspecialchars($row['titulo']); ?></h3>
                <?php if (!empty($row['conteudo'])): ?>
                    <div style="margin-top: 6px; font-size: 14px; white-space: pre-wrap;"><?php echo htmlspecialchars($row['conteudo']); ?></div>
                <?php endif; ?>
            </div>
        </div>
    <?php endif; ?>
<?php endif; ?>
