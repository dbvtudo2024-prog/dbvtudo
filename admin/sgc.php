<?php
require_once '../includes/config.php';
require_once '../includes/conexao.php';

$current_page = 'sgc';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $link_sgc = $_POST['link_sgc'];
    
    // Verifica se já existe
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM configuracoes WHERE chave = 'link_sgc'");
    $stmt->execute();
    if ($stmt->fetchColumn() > 0) {
        $stmt = $pdo->prepare("UPDATE configuracoes SET valor = ? WHERE chave = 'link_sgc'");
        $stmt->execute([$link_sgc]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO configuracoes (chave, valor) VALUES ('link_sgc', ?)");
        $stmt->execute([$link_sgc]);
    }
    $success = "Link atualizado com sucesso!";
}

// Buscar valor atual
$stmt = $pdo->prepare("SELECT valor FROM configuracoes WHERE chave = 'link_sgc'");
$stmt->execute();
$link_atual = $stmt->fetchColumn();
if (!$link_atual) $link_atual = '';

require_once '../includes/admin_header.php';
?>

<h2>Configurar Acesso ao SGC</h2>

<?php if ($success): ?>
    <div style="background: #d4edda; color: #155724; padding: 10px; margin-bottom: 20px; border-radius: 4px;">
        <?php echo $success; ?>
    </div>
<?php endif; ?>

<div class="form-container">
    <form method="POST">
        <div class="form-group">
            <label>Link Externo do SGC</label>
            <input type="url" name="link_sgc" class="form-control" value="<?php echo htmlspecialchars($link_atual); ?>" required placeholder="https://...">
            <small style="color: #666;">Insira a URL completa para o Sistema de Gerenciamento de Clubes.</small>
        </div>
        <button type="submit" class="btn-new">Salvar Configuração</button>
    </form>
</div>

<?php require_once '../includes/admin_footer.php'; ?>
