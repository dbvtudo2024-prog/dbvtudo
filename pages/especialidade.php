<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/conexao.php';
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
?>
<a href="index.php?p=especialidades" class="btn-back-standard">Voltar</a>
<h2>Especialidade</h2>
<?php if ($id <= 0): ?>
    <p>Especialidade não encontrada.</p>
<?php else: ?>
    <?php
        if ($driver === 'pgsql') {
            $sql = 'SELECT id, "ID" AS ID, "Nome", "Imagem", "Categoria", "Nivel", "Ano", "Questoes", "Sigla", "Origem" FROM public."EspecialidadesDBV" WHERE id = :id OR "ID" = :id LIMIT 1';
        } else {
            $sql = "SELECT id, especialidade_id AS Codigo, nome AS Nome, imagem AS Imagem, area AS Categoria, COALESCE(nivel, status) AS Nivel, ano AS Ano, requisitos AS Questoes, sigla AS Sigla, origem AS Origem FROM especialidades WHERE id = :id LIMIT 1";
        }
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
    ?>
    <?php if (!$row): ?>
        <p>Especialidade não encontrada.</p>
    <?php else: ?>
        <div class="card" style="max-width:900px;margin:0 auto;">
            <?php if (!empty($row['Imagem'])): ?>
                <?php
                    $img = $row['Imagem'];
                    $imgSrc = (strpos($img, 'http://') === 0 || strpos($img, 'https://') === 0) ? $img : 'uploads/' . $img;
                ?>
                <img src="<?php echo htmlspecialchars($imgSrc); ?>" alt="<?php echo htmlspecialchars($row['Nome'] ?? ''); ?>" class="card-img" style="height: 220px; object-fit: contain; padding: 10px;">
            <?php endif; ?>
            <div class="card-body">
                <span class="badge"><?php echo htmlspecialchars($row['Categoria'] ?? ''); ?></span>
                <h3 class="card-title"><?php echo htmlspecialchars($row['Nome'] ?? ''); ?></h3>
                <p class="card-text" style="font-size: 13px;">
                    <strong>Código:</strong> <?php echo htmlspecialchars(trim(($row['Sigla'] ?? '') . ' ' . ($row['Codigo'] ?? ''))); ?> |
                    <strong>Ano:</strong> <?php echo htmlspecialchars($row['Ano'] ?? ''); ?> | <strong>Nível:</strong> <?php echo htmlspecialchars($row['Nivel'] ?? ''); ?>
                    <?php if (!empty($row['Origem'])): ?> | <strong>Origem:</strong> <?php echo htmlspecialchars($row['Origem'] ?? ''); ?><?php endif; ?>
                </p>
                <?php if (!empty($row['Questoes'])): ?>
                    <h4 style="margin-top:12px;color:#004d40;">Questões</h4>
                    <div style="margin-top: 6px; font-size: 14px; white-space: pre-wrap;"><?php echo htmlspecialchars($row['Questoes'] ?? ''); ?></div>
                <?php endif; ?>
            </div>
        </div>
    <?php endif; ?>
<?php endif; ?>
