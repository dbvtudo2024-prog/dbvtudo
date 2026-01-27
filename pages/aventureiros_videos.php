<?php
// Garantir que a tabela existe (código legado mantido por segurança, mas idealmente já está no banco)
$pdo->exec("CREATE TABLE IF NOT EXISTS videos (id INT AUTO_INCREMENT PRIMARY KEY, youtube_url VARCHAR(255), video_id VARCHAR(32), titulo VARCHAR(255), canal VARCHAR(255), inscritos INT NULL, visualizacoes INT NULL, criado_em DATETIME, categoria_id INT NULL)");

// Lógica de exibição do vídeo selecionado (Player)
$currentId = isset($_GET['vid']) ? (int)$_GET['vid'] : 0;
$current = null;
if ($currentId > 0) {
    $st = $pdo->prepare("SELECT * FROM videos WHERE id = :id AND publico_alvo = 'Aventureiro' LIMIT 1");
    $st->execute([':id' => $currentId]);
    $current = $st->fetch();
}
?>

<style>
    .aventureiros-theme .category-section {
        background-color: #eee;
        border-radius: 12px;
        padding: 15px;
        margin-bottom: 20px;
        border-left: 5px solid #800000;
    }
    .aventureiros-theme .category-title {
        font-size: 1.1em;
        font-weight: bold;
        margin-top: 0;
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        gap: 10px;
        color: #800000;
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
        color: #800000;
    }
    .video-meta {
        font-size: 0.8em;
        color: #666;
    }
</style>

<div class="aventureiros-theme">
    <?php if ($current && !empty($current['video_id'])): ?>
    <div class="card" style="max-width:900px;margin:0 auto 30px;">
        <div class="card-body">
            <a href="index.php?p=aventureiros_videos" class="btn-back-standard">Voltar</a>
            <h3 class="card-title" style="color:#800000;"><?php echo htmlspecialchars($current['titulo']); ?></h3>
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
        <a href="index.php?p=aventureiros" class="btn-back-standard">Voltar</a>
        <h2 class="feature-title">Vídeos dos Aventureiros</h2>

        <?php
        // Buscar vídeos do banco filtrando por Aventureiro
        $stmt = $pdo->query("SELECT * FROM videos WHERE publico_alvo = 'Aventureiro' ORDER BY criado_em DESC");
        $videos = $stmt->fetchAll();
        
        if (count($videos) > 0):
        ?>
            <div class="category-section">
                <div class="category-title">
                    <span style="font-size:1.4em;">▶</span> Todos os Vídeos
                </div>
                <?php foreach ($videos as $vid): ?>
                    <a href="index.php?p=aventureiros_videos&vid=<?php echo $vid['id']; ?>" class="video-card">
                        <div class="video-thumb">
                            <img src="https://img.youtube.com/vi/<?php echo htmlspecialchars($vid['video_id']); ?>/mqdefault.jpg" alt="Thumb">
                        </div>
                        <div class="video-info">
                            <div class="video-title"><?php echo htmlspecialchars($vid['titulo']); ?></div>
                            <div class="video-meta">
                                <?php echo htmlspecialchars($vid['canal'] ?? 'Canal Desconhecido'); ?>
                            </div>
                        </div>
                    </a>
                <?php endforeach; ?>
            </div>
        <?php else: ?>
            <p>Nenhum vídeo cadastrado para Aventureiros.</p>
        <?php endif; ?>
    </div>
    <?php endif; ?>
</div>
