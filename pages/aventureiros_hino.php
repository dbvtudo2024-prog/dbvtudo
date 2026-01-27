<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/conexao.php';
?>
<div class="aventureiros-theme">
    <a href="index.php?p=aventureiros_ideais" class="btn-back-standard">Voltar</a>
    <h2 class="feature-title">Hino dos Aventureiros</h2>
    <?php
    function columnExists(PDO $pdo,$t,$c){ $driver=$pdo->getAttribute(PDO::ATTR_DRIVER_NAME); $sql=$driver==='pgsql'?"SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=:t AND column_name=:c":"SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=:t AND column_name=:c"; $st=$pdo->prepare($sql); $st->execute([':t'=>$t,':c'=>$c]); return (bool)$st->fetchColumn(); }
    
    $stmt = $pdo->prepare("SELECT * FROM ideais WHERE tipo = :tipo AND publico_alvo = 'Aventureiro' ORDER BY id ASC LIMIT 1");
    $stmt->execute([':tipo' => 'Hino']);
    $row = $stmt->fetch();

    function isAudioFile($filename) {
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        return in_array($ext, ['mp3','ogg','wav','m4a']);
    }
    ?>
    <div style="max-width:900px;margin:30px auto 0;">
        <div class="card">
            <div class="card-body">
                <h3 class="card-title">Hino dos Aventureiros</h3>
                <?php if ($row && !empty($row['conteudo'])): ?>
                    <div style="white-space: pre-wrap; color:#333;"><?php echo htmlspecialchars($row['conteudo']); ?></div>
                <?php else: ?>
                    <div style="color:#777;">Texto do hino não cadastrado.</div>
                <?php endif; ?>
            </div>
        </div>
        <div class="card" style="margin-top:12px;">
            <div class="card-body">
                <?php
                $audioSrc = '';
                $youtubeId = '';
                if ($row) {
                    if (columnExists($pdo,'ideais','youtube_url') && !empty($row['youtube_url'])) {
                        $url = $row['youtube_url'];
                        if (preg_match('/v=([^&]+)/', $url, $m)) $youtubeId = $m[1];
                        elseif (preg_match('#youtu\.be/([^?&]+)#', $url, $m)) $youtubeId = $m[1];
                    }
                    if (!$youtubeId && !empty($row['imagem']) && isAudioFile($row['imagem'])) {
                        $audioSrc = 'uploads/' . $row['imagem'];
                    }
                }
                ?>
                <?php if ($youtubeId): ?>
                    <iframe width="100%" height="360" src="https://www.youtube.com/embed/<?php echo htmlspecialchars($youtubeId); ?>" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                <?php elseif ($audioSrc): ?>
                    <audio controls style="width:100%;">
                        <source src="<?php echo htmlspecialchars($audioSrc); ?>">
                        Seu navegador não suporta o elemento de áudio.
                    </audio>
                <?php else: ?>
                    <div style="color:#777;">Áudio do hino não disponível.</div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>
