<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/conexao.php';
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
?>
<a href="index.php?p=uniformes" class="btn-back-standard">Voltar</a>
<h2>Uniforme</h2>
<?php if ($id <= 0): ?>
    <p>Uniforme não encontrado.</p>
<?php else: ?>
    <?php
        $stmt = $pdo->prepare("SELECT * FROM uniformes WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
    ?>
    <?php if (!$row): ?>
        <p>Uniforme não encontrado.</p>
    <?php else: ?>
        <div class="card" style="max-width:900px;margin:0 auto;">
            <?php if (!empty($row['imagem'])): ?>
                <img src="uploads/<?php echo $row['imagem']; ?>" alt="<?php echo htmlspecialchars($row['tipo']); ?>" class="card-img" style="height: 260px; object-fit: contain; padding: 10px;">
            <?php endif; ?>
            <div class="card-body">
                <h3 class="card-title"><?php echo htmlspecialchars($row['tipo']); ?></h3>
                <?php if (!empty($row['descricao'])): ?>
                    <p class="card-text"><?php echo htmlspecialchars($row['descricao']); ?></p>
                <?php endif; ?>
                <?php if (!empty($row['regras_uso'])): ?>
                    <h4 style="margin-top:12px;color:#004d40;">Regras de Uso</h4>
                    <div style="margin-top: 6px; font-size: 14px; white-space: pre-wrap;"><?php echo htmlspecialchars($row['regras_uso']); ?></div>
                <?php endif; ?>
            </div>
        </div>
    <?php endif; ?>
<?php endif; ?>


