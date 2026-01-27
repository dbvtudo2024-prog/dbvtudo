<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/conexao.php';
$pdo->exec("CREATE TABLE IF NOT EXISTS quiz_resultados (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NULL, nome VARCHAR(255) NULL, pontos INT NOT NULL, total INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
?>
<a href="index.php?p=biblia_quiz_inicio" class="btn-back-standard">Voltar</a>
<h2>Ranking do Quiz</h2>
<?php
$stmt = $pdo->query("SELECT nome, pontos, total, created_at FROM quiz_resultados ORDER BY pontos DESC, created_at DESC LIMIT 100");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<div style="max-width:780px;">
<?php if (!$rows): ?>
    <div class="card"><div class="card-body">Nenhum resultado registrado.</div></div>
<?php else: ?>
    <?php
        $top1 = isset($rows[0]) ? $rows[0] : null;
        $top2 = isset($rows[1]) ? $rows[1] : null;
        $top3 = isset($rows[2]) ? $rows[2] : null;
        if ($top1 || $top2 || $top3):
    ?>
    <div style="display:flex; gap:12px; margin-bottom:16px;">
        <?php if ($top1): ?>
        <div style="flex:1; background:#fff; border-radius:14px; box-shadow:0 4px 12px rgba(0,0,0,0.08); border-left:8px solid #fbc02d;">
            <div style="display:flex; align-items:center; gap:12px; padding:14px;">
                <div style="width:52px; height:52px; border-radius:50%; background:#fff3cd; display:flex; align-items:center; justify-content:center; color:#d4a657; font-size:22px;">🥇</div>
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:800; color:#2e7d32; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><?php echo htmlspecialchars($top1['nome'] ?: 'Convidado'); ?></div>
                    <div style="font-size:12px; color:#777;">Pontos: <?php echo (int)$top1['pontos']; ?> / <?php echo (int)$top1['total']; ?></div>
                </div>
                <div style="font-size:12px; color:#999;"><?php echo date('d/m/Y H:i', strtotime($top1['created_at'])); ?></div>
            </div>
        </div>
        <?php endif; ?>
        <?php if ($top2): ?>
        <div style="flex:1; background:#fff; border-radius:14px; box-shadow:0 4px 12px rgba(0,0,0,0.08); border-left:8px solid #b0bec5;">
            <div style="display:flex; align-items:center; gap:12px; padding:14px;">
                <div style="width:52px; height:52px; border-radius:50%; background:#eceff1; display:flex; align-items:center; justify-content:center; color:#607d8b; font-size:22px;">🥈</div>
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:800; color:#1e88e5; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><?php echo htmlspecialchars($top2['nome'] ?: 'Convidado'); ?></div>
                    <div style="font-size:12px; color:#777;">Pontos: <?php echo (int)$top2['pontos']; ?> / <?php echo (int)$top2['total']; ?></div>
                </div>
                <div style="font-size:12px; color:#999;"><?php echo date('d/m/Y H:i', strtotime($top2['created_at'])); ?></div>
            </div>
        </div>
        <?php endif; ?>
        <?php if ($top3): ?>
        <div style="flex:1; background:#fff; border-radius:14px; box-shadow:0 4px 12px rgba(0,0,0,0.08); border-left:8px solid #cd7f32;">
            <div style="display:flex; align-items:center; gap:12px; padding:14px;">
                <div style="width:52px; height:52px; border-radius:50%; background:#fbe9e7; display:flex; align-items:center; justify-content:center; color:#d84315; font-size:22px;">🥉</div>
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:800; color:#8d6e63; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><?php echo htmlspecialchars($top3['nome'] ?: 'Convidado'); ?></div>
                    <div style="font-size:12px; color:#777;">Pontos: <?php echo (int)$top3['pontos']; ?> / <?php echo (int)$top3['total']; ?></div>
                </div>
                <div style="font-size:12px; color:#999;"><?php echo date('d/m/Y H:i', strtotime($top3['created_at'])); ?></div>
            </div>
        </div>
        <?php endif; ?>
    </div>
    <?php endif; ?>
    <table>
        <thead><tr><th>Posição</th><th>Nome</th><th>Pontos</th><th>Total</th><th>Data</th></tr></thead>
        <tbody>
        <?php $pos=1; foreach ($rows as $r): ?>
            <tr>
                <td><?php echo $pos++; ?></td>
                <td><?php echo htmlspecialchars($r['nome'] ?: 'Convidado'); ?></td>
                <td><?php echo (int)$r['pontos']; ?></td>
                <td><?php echo (int)$r['total']; ?></td>
                <td><?php echo date('d/m/Y H:i', strtotime($r['created_at'])); ?></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
<?php endif; ?>
</div>
