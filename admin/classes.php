<?php
require_once '../includes/config.php';
require_once '../includes/conexao.php';

$current_page = 'classes';
$action = isset($_GET['action']) ? $_GET['action'] : 'list';
$error = '';

// Função para upload de imagem (reutilizada logicamente, mas reescrita aqui para independência)
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

// DELETE
if ($action == 'delete' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("SELECT insignia FROM classes WHERE id = ?");
    $stmt->execute([$id]);
    $img = $stmt->fetchColumn();
    
    $stmt = $pdo->prepare("DELETE FROM classes WHERE id = ?");
    if ($stmt->execute([$id])) {
        if ($img && file_exists('../uploads/' . $img)) {
            unlink('../uploads/' . $img);
        }
        header("Location: classes.php?msg=deleted");
        exit;
    }
}

// SAVE
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? (int)$_POST['id'] : null;
    $nome = $_POST['nome'];
    $publico_alvo = isset($_POST['publico_alvo']) ? $_POST['publico_alvo'] : 'Desbravador';
    $descricao = $_POST['descricao'];
    $requisitos = $_POST['requisitos'];
    
    $insignia = null;
    if (isset($_FILES['insignia']) && $_FILES['insignia']['size'] > 0) {
        $insignia = uploadImage($_FILES['insignia']);
    }

    if ($id) {
        $sql = "UPDATE classes SET nome=?, publico_alvo=?, descricao=?, requisitos=?";
        $params = [$nome, $publico_alvo, $descricao, $requisitos];
        if ($insignia) {
            $sql .= ", insignia=?";
            $params[] = $insignia;
        }
        $sql .= " WHERE id=?";
        $params[] = $id;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        header("Location: classes.php?msg=updated");
        exit;
    } else {
        $sql = "INSERT INTO classes (nome, publico_alvo, descricao, requisitos, insignia) VALUES (?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$nome, $publico_alvo, $descricao, $requisitos, $insignia]);
        header("Location: classes.php?msg=created");
        exit;
    }
}

require_once '../includes/admin_header.php';
?>

<h2>Gerenciar Classes</h2>

<?php if (isset($_GET['msg'])): ?>
    <div style="background: #d4edda; color: #155724; padding: 10px; margin-bottom: 20px; border-radius: 4px;">
        <?php 
            if ($_GET['msg'] == 'created') echo "Classe criada com sucesso!";
            if ($_GET['msg'] == 'updated') echo "Classe atualizada com sucesso!";
            if ($_GET['msg'] == 'deleted') echo "Classe excluída com sucesso!";
        ?>
    </div>
<?php endif; ?>

<?php if ($action == 'add' || $action == 'edit'): ?>
    <?php
    $data = ['nome' => '', 'descricao' => '', 'requisitos' => '', 'insignia' => ''];
    if ($action == 'edit' && isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM classes WHERE id = ?");
        $stmt->execute([(int)$_GET['id']]);
        $data = $stmt->fetch();
    }
    ?>
    <div class="form-container">
        <h3><?php echo $action == 'add' ? 'Nova Classe' : 'Editar Classe'; ?></h3>
        <form method="POST" enctype="multipart/form-data">
            <?php if ($action == 'edit'): ?>
                <input type="hidden" name="id" value="<?php echo $data['id']; ?>">
            <?php endif; ?>
            
            <div class="form-group">
                <label>Nome da Classe</label>
                <input type="text" name="nome" class="form-control" value="<?php echo htmlspecialchars($data['nome']); ?>" required>
            </div>
            
            <div class="form-group">
                <label>Público Alvo</label>
                <select name="publico_alvo" class="form-control">
                    <option value="Desbravador" <?php echo (isset($data['publico_alvo']) && $data['publico_alvo'] == 'Desbravador') ? 'selected' : ''; ?>>Desbravador</option>
                    <option value="Aventureiro" <?php echo (isset($data['publico_alvo']) && $data['publico_alvo'] == 'Aventureiro') ? 'selected' : ''; ?>>Aventureiro</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Descrição Curta</label>
                <textarea name="descricao" class="form-control" style="height: 100px;" required><?php echo htmlspecialchars($data['descricao']); ?></textarea>
            </div>
            
            <div class="form-group">
                <label>Insígnia (Imagem)</label>
                <?php if ($data['insignia']): ?>
                    <div style="margin-bottom: 10px;">
                        <img src="../uploads/<?php echo $data['insignia']; ?>" width="100">
                    </div>
                <?php endif; ?>
                <input type="file" name="insignia" class="form-control" accept="image/*">
            </div>
            
            <div class="form-group">
                <label>Requisitos Completos</label>
                <textarea name="requisitos" class="form-control" required><?php echo htmlspecialchars($data['requisitos']); ?></textarea>
            </div>
            
            <button type="submit" class="btn-new">Salvar</button>
            <a href="classes.php" class="btn-delete" style="text-decoration: none; margin-left: 10px;">Cancelar</a>
        </form>
    </div>

<?php else: ?>
    <a href="classes.php?action=add" class="btn-new">+ Nova Classe</a>
    
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Insígnia</th>
                <th>Público</th>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Ações</th>
            </tr>
        </thead>
        <tbody>
            <?php
            $stmt = $pdo->query("SELECT * FROM classes ORDER BY id ASC");
            while ($row = $stmt->fetch()):
            ?>
            <tr>
                <td><?php echo $row['id']; ?></td>
                <td>
                    <?php if ($row['insignia']): ?>
                        <img src="../uploads/<?php echo $row['insignia']; ?>" width="50" height="50" style="object-fit: contain;">
                    <?php else: ?>
                        -
                    <?php endif; ?>
                </td>
                <td><?php echo htmlspecialchars($row['publico_alvo'] ?? 'Desbravador'); ?></td>
                <td><?php echo htmlspecialchars($row['nome']); ?></td>
                <td><?php echo htmlspecialchars(substr($row['descricao'], 0, 50)) . '...'; ?></td>
                <td class="actions">
                    <a href="classes.php?action=edit&id=<?php echo $row['id']; ?>" class="btn-edit">Editar</a>
                    <a href="classes.php?action=delete&id=<?php echo $row['id']; ?>" class="btn-delete" onclick="return confirm('Tem certeza que deseja excluir?')">Excluir</a>
                </td>
            </tr>
            <?php endwhile; ?>
        </tbody>
    </table>
<?php endif; ?>

<?php require_once '../includes/admin_footer.php'; ?>
