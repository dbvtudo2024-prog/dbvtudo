<?php
// Garantir que a tabela existe
$pdo->exec("CREATE TABLE IF NOT EXISTS estudos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    conteudo TEXT,
    imagem VARCHAR(255),
    arquivo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

if ($id):
    // Visualização de detalhes
    $stmt = $pdo->prepare("SELECT * FROM estudos WHERE id = ?");
    $stmt->execute([$id]);
    $estudo = $stmt->fetch();

    if (!$estudo):
        echo "<p>Estudo não encontrado.</p>";
    else:
?>
    <div class="content-detail">
        <a href="index.php?p=estudos" class="btn-back-standard">Voltar</a>
        
        <h2><?php echo htmlspecialchars($estudo['titulo']); ?></h2>
        
        <div class="meta-info" style="color: #666; margin-bottom: 20px; font-size: 0.9em;">
            Publicado em: <?php echo date('d/m/Y', strtotime($estudo['created_at'])); ?>
        </div>

        <?php
            $viewer = '';
            if (!empty($estudo['arquivo'])) {
                $file = $estudo['arquivo'];
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
        <?php endif; ?>

        <div class="description" style="background: #f9f9f9; padding: 15px; border-left: 4px solid #007bff; margin-bottom: 20px;">
            <strong>Resumo:</strong> <?php echo nl2br(htmlspecialchars($estudo['descricao'])); ?>
        </div>
        
        <div class="full-content" style="line-height: 1.6;">
            <?php echo nl2br(htmlspecialchars($estudo['conteudo'])); ?>
        </div>
    </div>
<?php 
    endif;
else:
    // Listagem
?>
    <a href="index.php?p=desbravadores" class="btn-back-standard">Voltar</a>
    <h2>Estudos</h2>
    <p>Confira nossos estudos e materiais de aprofundamento.</p>

    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; padding: 20px 0;">
        <?php 
        $stmt = $pdo->query("SELECT * FROM estudos WHERE publico_alvo = 'Desbravador' ORDER BY created_at DESC");
        while ($row = $stmt->fetch()):
        $color = '#004d40';
        ?>
            <a href="index.php?p=estudos&id=<?php echo (int)$row['id']; ?>" style="display:flex; align-items:center; gap:15px; padding:15px; border-radius:12px; background:#fff; box-shadow:0 4px 12px rgba(0,0,0,0.08); text-decoration:none; color:#333; border-left:8px solid <?php echo $color; ?>; transition: transform 0.2s ease, box-shadow 0.2s ease;" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.12)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)';">
                <div style="width:50px; height:50px; border-radius:50%; background-color: <?php echo $color; ?>20; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden;">
                    <?php if (!empty($row['imagem'])): ?>
                        <img src="uploads/<?php echo htmlspecialchars($row['imagem']); ?>" alt="<?php echo htmlspecialchars($row['titulo']); ?>" style="width:40px; height:40px; object-fit:cover;">
                    <?php else: ?>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="<?php echo $color; ?>"><path d="M12 2L2 22h20L12 2z"/></svg>
                    <?php endif; ?>
                </div>
                <div style="display:flex; flex-direction:column;">
                    <span style="font-weight:700; font-size:1.05rem; color:#2c3e50;"><?php echo htmlspecialchars($row['titulo']); ?></span>
                    <?php if (!empty($row['descricao'])): ?>
                    <span style="font-size:0.85rem; color:#7f8c8d; margin-top:2px;"><?php echo htmlspecialchars(substr($row['descricao'], 0, 90)) . '...'; ?></span>
                    <?php endif; ?>
                </div>
                <div style="margin-left:auto; color:#ccc;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
            </a>
        <?php endwhile; ?>
    </div>
<?php endif; ?>

