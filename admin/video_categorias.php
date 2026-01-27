<?php
require_once '../includes/config.php';
require_once '../includes/conexao.php';

$current_page = 'video_categorias';
$action = isset($_GET['action']) ? $_GET['action'] : 'list';

$pdo->exec("CREATE TABLE IF NOT EXISTS video_categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100),
  ordem INT DEFAULT 0
)");

if ($action === 'delete' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("DELETE FROM video_categorias WHERE id=?");
    if ($stmt->execute([$id])) {
        header("Location: video_categorias.php?msg=deleted");
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? (int)$_POST['id'] : null;
    $nome = trim($_POST['nome']);
    $ordem = isset($_POST['ordem']) ? (int)$_POST['ordem'] : 0;
    if ($id) {
        $stmt = $pdo->prepare("UPDATE video_categorias SET nome=?, ordem=? WHERE id=?");
        $stmt->execute([$nome, $ordem, $id]);
        header("Location: video_categorias.php?msg=updated");
        exit;
    } else {
        $stmt = $pdo->prepare("INSERT INTO video_categorias (nome, ordem) VALUES (?, ?)");
        $stmt->execute([$nome, $ordem]);
        header("Location: video_categorias.php?msg=created");
        exit;
    }
}

require_once '../includes/admin_header.php';
?>
<h2>Categorias de Vídeo</h2>
<?php if (isset($_GET['msg'])): ?>
    <div style="background:#d4edda;color:#155724;padding:10px;margin-bottom:20px;border-radius:4px;">
        <?php if($_GET['msg']=='created')echo"Categoria criada"; if($_GET['msg']=='updated')echo"Categoria atualizada"; if($_GET['msg']=='deleted')echo"Categoria excluída"; ?>
    </div>
<?php endif; ?>

<?php if ($action === 'add' || $action === 'edit'): ?>
    <?php
    $data = ['nome'=>'', 'ordem'=>0];
    if ($action === 'edit' && isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM video_categorias WHERE id=?");
        $stmt->execute([(int)$_GET['id']]);
        $data = $stmt->fetch();
    }
    ?>
    <div class="form-container">
        <h3><?php echo $action==='add'?'Nova Categoria':'Editar Categoria'; ?></h3>
        <form method="POST">
            <?php if($action==='edit'): ?><input type="hidden" name="id" value="<?php echo $data['id']; ?>"><?php endif; ?>
            <div class="form-group">
                <label>Nome</label>
                <input type="text" name="nome" class="form-control" value="<?php echo htmlspecialchars($data['nome']); ?>" required>
            </div>
            <div class="form-group">
                <label>Ordem</label>
                <input type="number" name="ordem" class="form-control" value="<?php echo (int)$data['ordem']; ?>" min="0">
            </div>
            <button type="submit" class="btn-new">Salvar</button>
            <a href="video_categorias.php" class="btn-back-standard" style="margin-left:10px;">Voltar</a>
        </form>
    </div>
<?php else: ?>
    <a href="video_categorias.php?action=add" class="btn-new">+ Nova Categoria</a>
    <table>
        <thead><tr><th>ID</th><th>Nome</th><th>Ordem</th><th>Ações</th></tr></thead>
        <tbody>
            <?php $stmt=$pdo->query("SELECT * FROM video_categorias ORDER BY ordem ASC, nome ASC"); while($row=$stmt->fetch()): ?>
            <tr>
                <td><?php echo $row['id']; ?></td>
                <td><?php echo htmlspecialchars($row['nome']); ?></td>
                <td><?php echo (int)$row['ordem']; ?></td>
                <td class="actions">
                    <a href="video_categorias.php?action=edit&id=<?php echo $row['id']; ?>" class="btn-edit">Editar</a>
                    <a href="video_categorias.php?action=delete&id=<?php echo $row['id']; ?>" class="btn-delete" onclick="return confirm('Tem certeza?')">Excluir</a>
                </td>
            </tr>
            <?php endwhile; ?>
        </tbody>
    </table>
<?php endif; ?>
<?php require_once '../includes/admin_footer.php'; ?>
