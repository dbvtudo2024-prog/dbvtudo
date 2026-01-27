<?php
require_once '../includes/config.php';
require_once '../includes/conexao.php';

$current_page = 'historia';
$action = isset($_GET['action']) ? $_GET['action'] : 'list';
$error = '';

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
    $stmt = $pdo->prepare("SELECT imagem FROM historia WHERE id = ?");
    $stmt->execute([$id]);
    $img = $stmt->fetchColumn();
    
    $stmt = $pdo->prepare("DELETE FROM historia WHERE id = ?");
    if ($stmt->execute([$id])) {
        if ($img && file_exists('../uploads/' . $img)) {
            unlink('../uploads/' . $img);
        }
        header("Location: historia.php?msg=deleted");
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? (int)$_POST['id'] : null;
    $titulo = $_POST['titulo'];
    $publico_alvo = isset($_POST['publico_alvo']) ? $_POST['publico_alvo'] : 'Desbravador';
    $conteudo = $_POST['conteudo'];
    $ano_periodo = $_POST['ano_periodo'];
    
    $imagem = null;
    if (isset($_FILES['imagem']) && $_FILES['imagem']['size'] > 0) {
        $imagem = uploadImage($_FILES['imagem']);
    }

    if ($id) {
        $sql = "UPDATE historia SET titulo=?, publico_alvo=?, conteudo=?, ano_periodo=?";
        $params = [$titulo, $publico_alvo, $conteudo, $ano_periodo];
        if ($imagem) {
            $sql .= ", imagem=?";
            $params[] = $imagem;
        }
        $sql .= " WHERE id=?";
        $params[] = $id;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        header("Location: historia.php?msg=updated");
        exit;
    } else {
        $sql = "INSERT INTO historia (titulo, publico_alvo, conteudo, ano_periodo, imagem) VALUES (?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$titulo, $publico_alvo, $conteudo, $ano_periodo, $imagem]);
        header("Location: historia.php?msg=created");
        exit;
    }
}

require_once '../includes/admin_header.php';
?>

<h2>Gerenciar História</h2>

<?php if (isset($_GET['msg'])): ?>
    <div style="background: #d4edda; color: #155724; padding: 10px; margin-bottom: 20px; border-radius: 4px;">
        <?php 
            if ($_GET['msg'] == 'created') echo "Conteúdo criado com sucesso!";
            if ($_GET['msg'] == 'updated') echo "Conteúdo atualizado com sucesso!";
            if ($_GET['msg'] == 'deleted') echo "Conteúdo excluído com sucesso!";
        ?>
    </div>
<?php endif; ?>

<?php if ($action == 'add' || $action == 'edit'): ?>
    <?php
    $data = ['titulo' => '', 'conteudo' => '', 'ano_periodo' => '', 'imagem' => ''];
    if ($action == 'edit' && isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM historia WHERE id = ?");
        $stmt->execute([(int)$_GET['id']]);
        $data = $stmt->fetch();
    }
    ?>
    <div class="form-container">
        <h3><?php echo $action == 'add' ? 'Novo Conteúdo Histórico' : 'Editar Conteúdo'; ?></h3>
        <form method="POST" enctype="multipart/form-data">
            <?php if ($action == 'edit'): ?>
                <input type="hidden" name="id" value="<?php echo $data['id']; ?>">
            <?php endif; ?>
            
            <div class="form-group">
                <label>Título</label>
                <input type="text" name="titulo" class="form-control" value="<?php echo htmlspecialchars($data['titulo']); ?>" required>
            </div>
            
            <div class="form-group">
                <label>Público Alvo</label>
                <select name="publico_alvo" class="form-control">
                    <option value="Desbravador" <?php echo (isset($data['publico_alvo']) && $data['publico_alvo'] == 'Desbravador') ? 'selected' : ''; ?>>Desbravador</option>
                    <option value="Aventureiro" <?php echo (isset($data['publico_alvo']) && $data['publico_alvo'] == 'Aventureiro') ? 'selected' : ''; ?>>Aventureiro</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Ano ou Período</label>
                <input type="text" name="ano_periodo" class="form-control" value="<?php echo htmlspecialchars($data['ano_periodo']); ?>" placeholder="Ex: 1950 ou Década de 80">
            </div>
            
            <div class="form-group">
                <label>Imagem Ilustrativa</label>
                <?php if ($data['imagem']): ?>
                    <div style="margin-bottom: 10px;">
                        <img src="../uploads/<?php echo $data['imagem']; ?>" width="100">
                    </div>
                <?php endif; ?>
                <input type="file" name="imagem" class="form-control" accept="image/*">
            </div>
            
            <div class="form-group">
                <label>Conteúdo</label>
                <textarea name="conteudo" class="form-control" required><?php echo htmlspecialchars($data['conteudo']); ?></textarea>
            </div>
            
            <button type="submit" class="btn-new">Salvar</button>
            <a href="historia.php" class="btn-delete" style="text-decoration: none; margin-left: 10px;">Cancelar</a>
        </form>
    </div>

<?php else: ?>
    <a href="historia.php?action=add" class="btn-new">+ Novo Conteúdo</a>
    
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Imagem</th>
                <th>Público</th>
                <th>Título</th>
                <th>Ano/Período</th>
                <th>Ações</th>
            </tr>
        </thead>
        <tbody>
            <?php
            $stmt = $pdo->query("SELECT * FROM historia ORDER BY id ASC");
            while ($row = $stmt->fetch()):
            ?>
            <tr>
                <td><?php echo $row['id']; ?></td>
                <td>
                    <?php if ($row['imagem']): ?>
                        <img src="../uploads/<?php echo $row['imagem']; ?>" width="50" height="50" style="object-fit: contain;">
                    <?php else: ?>
                        -
                    <?php endif; ?>
                </td>
                <td><?php echo htmlspecialchars($row['publico_alvo'] ?? 'Desbravador'); ?></td>
                <td><?php echo htmlspecialchars($row['titulo']); ?></td>
                <td><?php echo htmlspecialchars($row['ano_periodo']); ?></td>
                <td class="actions">
                    <a href="historia.php?action=edit&id=<?php echo $row['id']; ?>" class="btn-edit">Editar</a>
                    <a href="historia.php?action=delete&id=<?php echo $row['id']; ?>" class="btn-delete" onclick="return confirm('Tem certeza que deseja excluir?')">Excluir</a>
                </td>
            </tr>
            <?php endwhile; ?>
        </tbody>
    </table>
<?php endif; ?>

<?php require_once '../includes/admin_footer.php'; ?>
