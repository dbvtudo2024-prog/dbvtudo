<?php
require_once '../includes/config.php';
require_once '../includes/conexao.php';

$current_page = 'ideais';
$action = isset($_GET['action']) ? $_GET['action'] : 'list';

$pdo->exec("CREATE TABLE IF NOT EXISTS ideais (id INT AUTO_INCREMENT PRIMARY KEY, tipo VARCHAR(50), titulo VARCHAR(255), conteudo TEXT, imagem VARCHAR(255))");
function columnExists(PDO $pdo,$t,$c){ $driver=$pdo->getAttribute(PDO::ATTR_DRIVER_NAME); $sql=$driver==='pgsql'?"SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=:t AND column_name=:c":"SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=:t AND column_name=:c"; $st=$pdo->prepare($sql); $st->execute([':t'=>$t,':c'=>$c]); return (bool)$st->fetchColumn(); }
if(!columnExists($pdo,'ideais','youtube_url')){ try{$pdo->exec("ALTER TABLE ideais ADD COLUMN youtube_url VARCHAR(255)");}catch(Exception $e){} }

function uploadImage($file) {
    if ($file['error'] === UPLOAD_ERR_OK) {
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $new_name = uniqid() . "." . $ext;
        $destination = '../uploads/' . $new_name;
        if (move_uploaded_file($file['tmp_name'], $destination)) {
            return $new_name;
        }
    }
    return null;
}

if ($action == 'delete' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("SELECT imagem FROM ideais WHERE id = ?");
    $stmt->execute([$id]);
    $img = $stmt->fetchColumn();
    $stmt = $pdo->prepare("DELETE FROM ideais WHERE id = ?");
    if ($stmt->execute([$id])) {
        if ($img && file_exists('../uploads/' . $img)) unlink('../uploads/' . $img);
        header("Location: ideais.php?msg=deleted");
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? (int)$_POST['id'] : null;
    $tipo = $_POST['tipo'];
    $publico_alvo = isset($_POST['publico_alvo']) ? $_POST['publico_alvo'] : 'Desbravador';
    $titulo = $_POST['titulo'];
    $conteudo = $_POST['conteudo'];
    $imagem = null;
    $youtube_url = isset($_POST['youtube_url']) ? trim($_POST['youtube_url']) : '';
    if (isset($_FILES['imagem']) && $_FILES['imagem']['size'] > 0) $imagem = uploadImage($_FILES['imagem']);

    if ($id) {
        $sql = "UPDATE ideais SET tipo=?, publico_alvo=?, titulo=?, conteudo=?, youtube_url=?";
        $params = [$tipo, $publico_alvo, $titulo, $conteudo, $youtube_url];
        if ($imagem) { $sql .= ", imagem=?"; $params[] = $imagem; }
        $sql .= " WHERE id=?";
        $params[] = $id;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        header("Location: ideais.php?msg=updated");
        exit;
    } else {
        $stmt = $pdo->prepare("INSERT INTO ideais (tipo, publico_alvo, titulo, conteudo, imagem, youtube_url) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$tipo, $publico_alvo, $titulo, $conteudo, $imagem, $youtube_url]);
        header("Location: ideais.php?msg=created");
        exit;
    }
}

require_once '../includes/admin_header.php';
?>
<h2>Gerenciar Ideais e Hinos</h2>
<?php if (isset($_GET['msg'])): ?>
    <div style="background: #d4edda; color: #155724; padding: 10px; margin-bottom: 20px; border-radius: 4px;">
        <?php 
            if ($_GET['msg'] == 'created') echo "Registro criado com sucesso!";
            if ($_GET['msg'] == 'updated') echo "Registro atualizado com sucesso!";
            if ($_GET['msg'] == 'deleted') echo "Registro excluído com sucesso!";
        ?>
    </div>
<?php endif; ?>

<?php if ($action == 'add' || $action == 'edit'): ?>
    <?php
    $data = ['tipo' => 'Ideal', 'titulo' => '', 'conteudo' => '', 'imagem' => ''];
    if ($action == 'edit' && isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM ideais WHERE id = ?");
        $stmt->execute([(int)$_GET['id']]);
        $data = $stmt->fetch();
    }
    ?>
    <div class="form-container">
        <h3><?php echo $action == 'add' ? 'Novo Registro' : 'Editar Registro'; ?></h3>
        <form method="POST" enctype="multipart/form-data">
            <?php if ($action == 'edit'): ?><input type="hidden" name="id" value="<?php echo $data['id']; ?>"><?php endif; ?>
            <div class="form-group">
                <label>Tipo</label>
                <select name="tipo" class="form-control">
                    <option value="Ideal" <?php echo ($data['tipo']=='Ideal')?'selected':''; ?>>Ideal</option>
                    <option value="Hino" <?php echo ($data['tipo']=='Hino')?'selected':''; ?>>Hino</option>
                </select>
            </div>
            <div class="form-group">
                <label>Público Alvo</label>
                <select name="publico_alvo" class="form-control">
                    <option value="Desbravador" <?php echo (isset($data['publico_alvo']) && $data['publico_alvo'] == 'Desbravador') ? 'selected' : ''; ?>>Desbravador</option>
                    <option value="Aventureiro" <?php echo (isset($data['publico_alvo']) && $data['publico_alvo'] == 'Aventureiro') ? 'selected' : ''; ?>>Aventureiro</option>
                </select>
            </div>
            <div class="form-group">
                <label>Título</label>
                <input type="text" name="titulo" class="form-control" value="<?php echo htmlspecialchars($data['titulo']); ?>" required>
            </div>
            <div class="form-group">
                <label>Imagem/Áudio</label>
                <?php if ($data['imagem']): ?>
                    <div style="margin-bottom:10px;">
                        <a href="../uploads/<?php echo $data['imagem']; ?>" target="_blank">Arquivo atual</a>
                    </div>
                <?php endif; ?>
                <input type="file" name="imagem" class="form-control" accept="image/*,audio/*">
            </div>
            <div class="form-group">
                <label>Link do YouTube (Hino)</label>
                <input type="url" name="youtube_url" class="form-control" value="<?php echo htmlspecialchars(isset($data['youtube_url'])?$data['youtube_url']:''); ?>" placeholder="https://www.youtube.com/watch?v=...">
            </div>
            <div class="form-group">
                <label>Conteúdo</label>
                <textarea name="conteudo" class="form-control" required><?php echo htmlspecialchars($data['conteudo']); ?></textarea>
            </div>
            <button type="submit" class="btn-new">Salvar</button>
            <a href="ideais.php" class="btn-back-standard" style="margin-left:10px;">Voltar</a>
        </form>
    </div>
<?php else: ?>
    <a href="ideais.php?action=add" class="btn-new">+ Novo</a>
    <table>
        <thead><tr><th>ID</th><th>Tipo</th><th>Público</th><th>Título</th><th>Ações</th></tr></thead>
        <tbody>
            <?php $stmt=$pdo->query("SELECT * FROM ideais ORDER BY id DESC"); while($row=$stmt->fetch()): ?>
            <tr>
                <td><?php echo $row['id']; ?></td>
                <td><?php echo htmlspecialchars($row['tipo']); ?></td>
                <td><?php echo htmlspecialchars($row['publico_alvo'] ?? 'Desbravador'); ?></td>
                <td><?php echo htmlspecialchars($row['titulo']); ?></td>
                <td class="actions">
                    <a href="ideais.php?action=edit&id=<?php echo $row['id']; ?>" class="btn-edit">Editar</a>
                    <a href="ideais.php?action=delete&id=<?php echo $row['id']; ?>" class="btn-delete" onclick="return confirm('Tem certeza?')">Excluir</a>
                </td>
            </tr>
            <?php endwhile; ?>
        </tbody>
    </table>
<?php endif; ?>
<?php require_once '../includes/admin_footer.php'; ?>
