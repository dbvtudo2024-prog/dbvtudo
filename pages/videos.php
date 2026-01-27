<h2>Vídeos</h2>
<?php
// Garantir que a tabela existe (código legado mantido por segurança, mas idealmente já está no banco)
$pdo->exec("CREATE TABLE IF NOT EXISTS videos (id INT AUTO_INCREMENT PRIMARY KEY, youtube_url VARCHAR(255), video_id VARCHAR(32), titulo VARCHAR(255), canal VARCHAR(255), inscritos INT NULL, visualizacoes INT NULL, criado_em DATETIME, categoria_id INT NULL)");

// Lógica de exibição do vídeo selecionado (Player)
$currentId = isset($_GET['vid']) ? (int)$_GET['vid'] : 0;
$current = null;
if ($currentId > 0) {
    $st = $pdo->prepare("SELECT * FROM videos WHERE id = :id AND publico_alvo = 'Desbravador' LIMIT 1");
    $st->execute([':id' => $currentId]);
    $current = $st->fetch();
}
?>

<style>
    .category-section {
        background-color: #eee; /* Fundo cinza claro igual da imagem */
        border-radius: 12px;
        padding: 15px;
        margin-bottom: 20px;
        border-left: 5px solid #d32f2f; /* Borda vermelha lateral */
    }
    .category-title {
        font-size: 1.1em;
        font-weight: bold;
        margin-top: 0;
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        gap: 10px;
        color: #222;
    }
    .video-card {
        background: #fff;
        border-radius: 10px;
        padding: 10px;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        text-decoration: none;
        color: #333;
        transition: transform 0.1s;
    }
    .video-card:active {
        transform: scale(0.99);
    }
    .video-thumb {
        width: 100px;
        height: 56px;
        border-radius: 6px;
        overflow: hidden;
        background: #000;
        flex-shrink: 0;
        position: relative;
    }
    .video-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .video-info {
        flex: 1;
        overflow: hidden;
    }
    .video-title {
        font-weight: 600;
        font-size: 0.95em;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .video-meta {
        font-size: 0.8em;
        color: #666;
    }
</style>

<?php if ($current && !empty($current['video_id'])): ?>
<div class="card" style="max-width:900px;margin:0 auto 30px;">
    <div class="card-body">
        <a href="index.php?p=videos" class="btn-back-standard">Voltar</a>
        <h3 class="card-title"><?php echo htmlspecialchars($current['titulo']); ?></h3>
        <?php if (!empty($current['canal'])): ?><p class="card-text" style="color:#555;"><?php echo htmlspecialchars($current['canal']); ?></p><?php endif; ?>
        <div style="margin-top:10px;">
            <iframe width="100%" height="360" src="https://www.youtube.com/embed/<?php echo htmlspecialchars($current['video_id']); ?>" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
        <div style="margin-top:8px; font-size:13px; color:#666;">
            <?php if (isset($current['inscritos'])): ?>Inscritos: <?php echo number_format((int)$current['inscritos'],0,',','.'); ?><?php endif; ?>
            <?php if (isset($current['visualizacoes'])): ?> • Visualizações: <?php echo number_format((int)$current['visualizacoes'],0,',','.'); ?><?php endif; ?>
        </div>
    </div>
</div>
<?php else: ?>

<div style="max-width:900px; margin:0 auto;">
    <a href="index.php?p=desbravadores" class="btn-back-standard">Voltar</a>
    <?php
    // Função para renderizar lista de vídeos
    function renderVideos($pdo, $videos) {
        foreach ($videos as $row) {
            $thumb = !empty($row['video_id']) ? ('https://img.youtube.com/vi/' . $row['video_id'] . '/mqdefault.jpg') : '';
            ?>
            <a href="index.php?p=videos&vid=<?php echo (int)$row['id']; ?>" class="video-card">
                <div class="video-thumb">
                    <?php if ($thumb): ?>
                        <img src="<?php echo htmlspecialchars($thumb); ?>" alt="<?php echo htmlspecialchars($row['titulo']); ?>">
                        <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:24px; height:24px; background:rgba(255,0,0,0.8); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                            <div style="width:0; height:0; border-left:8px solid #fff; border-top:5px solid transparent; border-bottom:5px solid transparent; margin-left:2px;"></div>
                        </div>
                    <?php else: ?>
                        <span style="color:#fff; display:flex; justify-content:center; align-items:center; height:100%;">▶</span>
                    <?php endif; ?>
                </div>
                <div class="video-info">
                    <div class="video-title"><?php echo htmlspecialchars($row['titulo']); ?></div>
                    <div class="video-meta">
                        <?php if (!empty($row['canal'])): ?>
                            <?php echo htmlspecialchars($row['canal']); ?><br>
                        <?php endif; ?>
                        <?php if (isset($row['visualizacoes'])): ?>
                            <?php echo number_format((int)$row['visualizacoes'],0,',','.'); ?> visualizações
                        <?php endif; ?>
                    </div>
                </div>
            </a>
            <?php
        }
    }

    // 1. Buscar Categorias
    $stmtCat = $pdo->query("SELECT * FROM video_categorias ORDER BY ordem ASC, nome ASC");
    $categorias = $stmtCat->fetchAll(PDO::FETCH_ASSOC);

    // 2. Iterar Categorias e mostrar vídeos
    foreach ($categorias as $cat) {
        $stmtVid = $pdo->prepare("SELECT * FROM videos WHERE categoria_id = ? ORDER BY id DESC");
        $stmtVid->execute([$cat['id']]);
        $videos = $stmtVid->fetchAll(PDO::FETCH_ASSOC);

        if (count($videos) > 0) {
            // Ícone dinâmico simples baseado no nome (apenas para exemplo, pode ser fixo ou do banco se tivesse)
            $icon = '📁';
            if (stripos($cat['nome'], 'tutorial') !== false || stripos($cat['nome'], 'especialidade') !== false) $icon = '🎓';
            elseif (stripos($cat['nome'], 'cerimonia') !== false) $icon = '📅';
            elseif (stripos($cat['nome'], 'jogo') !== false || stripos($cat['nome'], 'atividade') !== false) $icon = '🎮';
            elseif (stripos($cat['nome'], 'musica') !== false || stripos($cat['nome'], 'hino') !== false) $icon = '🎵';

            echo '<div class="category-section">';
            echo '<h3 class="category-title">' . $icon . ' ' . htmlspecialchars($cat['nome']) . '</h3>';
            renderVideos($pdo, $videos);
            echo '</div>';
        }
    }

    // 3. Vídeos sem categoria (Outros)
    $stmtNoCat = $pdo->query("SELECT * FROM videos WHERE categoria_id IS NULL OR categoria_id = 0 ORDER BY id DESC");
    $videosNoCat = $stmtNoCat->fetchAll(PDO::FETCH_ASSOC);

    if (count($videosNoCat) > 0) {
        echo '<div class="category-section">';
        echo '<h3 class="category-title">▶ Outros Vídeos</h3>';
        renderVideos($pdo, $videosNoCat);
        echo '</div>';
    }
    ?>
</div>
<?php endif; ?>

