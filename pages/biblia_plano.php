<a href="index.php?p=biblia_mais" class="btn-back-standard">Voltar</a>
<h2>Plano de Leitura</h2>
<?php
$pdo->exec("CREATE TABLE IF NOT EXISTS biblia_planos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NULL,
    dias INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");
$cnt = (int)$pdo->query("SELECT COUNT(*) FROM biblia_planos")->fetchColumn();
if ($cnt === 0) {
    $ins = $pdo->prepare("INSERT INTO biblia_planos (titulo, descricao, dias) VALUES (?,?,?)");
    $ins->execute(['Bíblia em 1 Ano','Leia toda a Bíblia em 365 dias',365]);
    $ins->execute(['Novo Testamento em 90 dias','Complete o Novo Testamento em 3 meses',90]);
    $ins->execute(['Salmos e Provérbios','30 dias de sabedoria e louvor',30]);
}
$stmt = $pdo->query("SELECT * FROM biblia_planos ORDER BY dias DESC");
$plans = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<div style="display:grid; grid-template-columns:1fr; gap:12px;">
<?php foreach ($plans as $p): ?>
    <div class="card">
        <div class="card-body">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                <span class="badge"><?php echo ($p['dias']>=365?'Completo':($p['dias']>=90?'Novo Testamento':'Sabedoria')); ?></span>
                <div style="font-weight:800;"><?php echo htmlspecialchars($p['titulo']); ?></div>
            </div>
            <div style="color:#555;"><?php echo htmlspecialchars($p['descricao']); ?></div>
            <div style="display:flex; align-items:center; gap:6px; color:#777; margin-top:8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                <span><?php echo (int)$p['dias']; ?> dias</span>
            </div>
            <a href="index.php?p=biblia_plano_detalhe&id=<?php echo (int)$p['id']; ?>" class="btn-admin" style="margin-top:10px; display:inline-block;">Ver plano</a>
        </div>
    </div>
<?php endforeach; ?>
</div>
