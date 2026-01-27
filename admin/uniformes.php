<?php
require_once '../includes/config.php';
require_once '../includes/conexao.php';

$current_page = 'uniformes';
$action = isset($_GET['action']) ? $_GET['action'] : 'list';
$error = '';

// Ensure 'ordem' column exists
try {
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    if ($driver === 'mysql') {
        $chk = $pdo->prepare("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'uniformes' AND COLUMN_NAME = 'ordem'");
        $chk->execute();
        if ((int)$chk->fetchColumn() === 0) {
            $pdo->exec("ALTER TABLE uniformes ADD COLUMN ordem INT DEFAULT 0");
        }
    } elseif ($driver === 'pgsql') {
        $pdo->exec("ALTER TABLE uniformes ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0");
    }
} catch (Exception $e) {}
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
    $stmt = $pdo->prepare("SELECT imagem FROM uniformes WHERE id = ?");
    $stmt->execute([$id]);
    $img = $stmt->fetchColumn();
    
    $stmt = $pdo->prepare("DELETE FROM uniformes WHERE id = ?");
    if ($stmt->execute([$id])) {
        if ($img && file_exists('../uploads/' . $img)) {
            unlink('../uploads/' . $img);
        }
        header("Location: uniformes.php?msg=deleted");
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? (int)$_POST['id'] : null;
    $tipo = $_POST['tipo'];
    $publico_alvo = isset($_POST['publico_alvo']) ? $_POST['publico_alvo'] : 'Desbravador';
    $descricao = $_POST['descricao'];
    $regras_uso = $_POST['regras_uso'];
    $ordem = isset($_POST['ordem']) && $_POST['ordem'] !== '' ? (int)$_POST['ordem'] : 0;
    
    $imagem = null;
    if (isset($_FILES['imagem']) && $_FILES['imagem']['size'] > 0) {
        $imagem = uploadImage($_FILES['imagem']);
    }

    if ($id) {
        $sql = "UPDATE uniformes SET tipo=?, publico_alvo=?, descricao=?, regras_uso=?, ordem=?";
        $params = [$tipo, $publico_alvo, $descricao, $regras_uso, $ordem];
        if ($imagem) {
            $sql .= ", imagem=?";
            $params[] = $imagem;
        }
        $sql .= " WHERE id=?";
        $params[] = $id;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        header("Location: uniformes.php?msg=updated");
        exit;
    } else {
        $sql = "INSERT INTO uniformes (tipo, publico_alvo, descricao, regras_uso, imagem, ordem) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$tipo, $publico_alvo, $descricao, $regras_uso, $imagem, $ordem]);
        header("Location: uniformes.php?msg=created");
        exit;
    }
}

require_once '../includes/admin_header.php';
?>

<h2>Gerenciar Uniformes</h2>

<?php if (isset($_GET['msg'])): ?>
    <div style="background: #d4edda; color: #155724; padding: 10px; margin-bottom: 20px; border-radius: 4px;">
        <?php 
            if ($_GET['msg'] == 'created') echo "Uniforme criado com sucesso!";
            if ($_GET['msg'] == 'updated') echo "Uniforme atualizado com sucesso!";
            if ($_GET['msg'] == 'deleted') echo "Uniforme excluído com sucesso!";
        ?>
    </div>
<?php endif; ?>

<?php if ($action == 'add' || $action == 'edit'): ?>
    <?php
    $data = ['tipo' => '', 'descricao' => '', 'regras_uso' => '', 'imagem' => '', 'ordem' => 0];
    if ($action == 'edit' && isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM uniformes WHERE id = ?");
        $stmt->execute([(int)$_GET['id']]);
        $data = $stmt->fetch();
    }
    ?>
    <div class="form-container">
        <h3><?php echo $action == 'add' ? 'Novo Uniforme' : 'Editar Uniforme'; ?></h3>
        <form method="POST" enctype="multipart/form-data">
            <?php if ($action == 'edit'): ?>
                <input type="hidden" name="id" value="<?php echo $data['id']; ?>">
            <?php endif; ?>
            
            <div class="form-group">
                <label>Tipo de Uniforme</label>
                <input type="text" name="tipo" class="form-control" value="<?php echo htmlspecialchars($data['tipo']); ?>" placeholder="Ex: Uniforme de Gala, Uniforme de Campo" required>
            </div>
            
            <div class="form-group">
                <label>Público Alvo</label>
                <select name="publico_alvo" class="form-control">
                    <option value="Desbravador" <?php echo (isset($data['publico_alvo']) && $data['publico_alvo'] == 'Desbravador') ? 'selected' : ''; ?>>Desbravador</option>
                    <option value="Aventureiro" <?php echo (isset($data['publico_alvo']) && $data['publico_alvo'] == 'Aventureiro') ? 'selected' : ''; ?>>Aventureiro</option>
                </select>
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
                <label>Descrição</label>
                <textarea name="descricao" class="form-control" style="height: 100px;" required><?php echo htmlspecialchars($data['descricao']); ?></textarea>
            </div>

            <div class="form-group">
                <label>Ordem na lista</label>
                <input type="number" name="ordem" class="form-control" value="<?php echo htmlspecialchars(isset($data['ordem']) ? $data['ordem'] : 0); ?>" min="0">
            </div>

            <div class="form-group">
                <label>Regras de Uso</label>
                <textarea name="regras_uso" class="form-control" required><?php echo htmlspecialchars($data['regras_uso']); ?></textarea>
            </div>
            
            <button type="submit" class="btn-new">Salvar</button>
            <a href="uniformes.php" class="btn-delete" style="text-decoration: none; margin-left: 10px;">Cancelar</a>
        </form>
    </div>

<?php else: ?>
    <a href="uniformes.php?action=add" class="btn-new">+ Novo Uniforme</a>
    
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Ordem</th>
                <th>Imagem</th>
                <th>Público</th>
                <th>Tipo</th>
                <th>Descrição Curta</th>
                <th>Ações</th>
            </tr>
        </thead>
        <tbody>
            <?php
            $stmt = $pdo->query("SELECT * FROM uniformes ORDER BY ordem ASC, tipo ASC, id ASC");
            while ($row = $stmt->fetch()):
            ?>
            <tr>
                <td><?php echo $row['id']; ?></td>
                <td><?php echo isset($row['ordem']) ? (int)$row['ordem'] : 0; ?></td>
                <td>
                    <?php if ($row['imagem']): ?>
                        <img src="../uploads/<?php echo $row['imagem']; ?>" width="50" height="50" style="object-fit: contain;">
                    <?php else: ?>
                        -
                    <?php endif; ?>
                </td>
                <td><?php echo htmlspecialchars($row['publico_alvo'] ?? 'Desbravador'); ?></td>
                <td><?php echo htmlspecialchars($row['tipo']); ?></td>
                <td><?php echo htmlspecialchars(substr($row['descricao'], 0, 50)) . '...'; ?></td>
                <td class="actions">
                    <a href="uniformes.php?action=edit&id=<?php echo $row['id']; ?>" class="btn-edit">Editar</a>
                    <a href="uniformes.php?action=delete&id=<?php echo $row['id']; ?>" class="btn-delete" onclick="return confirm('Tem certeza que deseja excluir?')">Excluir</a>
                </td>
            </tr>
            <?php endwhile; ?>
        </tbody>
    </table>
<?php endif; ?>

<?php require_once '../includes/admin_footer.php'; ?>
