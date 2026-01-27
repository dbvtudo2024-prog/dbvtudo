<?php
require_once '../includes/config.php';
require_once '../includes/conexao.php';

$current_page = 'emblemas';
$action = isset($_GET['action']) ? $_GET['action'] : 'list';
$error = '';

try {
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    if ($driver === 'mysql') {
        $chk = $pdo->prepare("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'emblemas' AND COLUMN_NAME = 'ordem'");
        $chk->execute();
        if ((int)$chk->fetchColumn() === 0) {
            $pdo->exec("ALTER TABLE emblemas ADD COLUMN ordem INT DEFAULT 0");
        }
    } elseif ($driver === 'pgsql') {
        $pdo->exec("ALTER TABLE emblemas ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0");
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
    $stmt = $pdo->prepare("SELECT imagem FROM emblemas WHERE id = ?");
    $stmt->execute([$id]);
    $img = $stmt->fetchColumn();
    
    $stmt = $pdo->prepare("DELETE FROM emblemas WHERE id = ?");
    if ($stmt->execute([$id])) {
        if ($img && file_exists('../uploads/' . $img)) {
            unlink('../uploads/' . $img);
        }
        header("Location: emblemas.php?msg=deleted");
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? (int)$_POST['id'] : null;
    $nome = $_POST['nome'];
    $publico_alvo = isset($_POST['publico_alvo']) ? $_POST['publico_alvo'] : 'Desbravador';
    $categoria = $_POST['categoria'];
    $descricao = $_POST['descricao'];
    $ordem = isset($_POST['ordem']) && $_POST['ordem'] !== '' ? (int)$_POST['ordem'] : 0;
    
    $imagem = null;
    if (isset($_FILES['imagem']) && $_FILES['imagem']['size'] > 0) {
        $imagem = uploadImage($_FILES['imagem']);
    }

    if ($id) {
        $sql = "UPDATE emblemas SET nome=?, publico_alvo=?, categoria=?, descricao=?, ordem=?";
        $params = [$nome, $publico_alvo, $categoria, $descricao, $ordem];
        if ($imagem) {
            $sql .= ", imagem=?";
            $params[] = $imagem;
        }
        $sql .= " WHERE id=?";
        $params[] = $id;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        header("Location: emblemas.php?msg=updated");
        exit;
    } else {
        $sql = "INSERT INTO emblemas (nome, publico_alvo, categoria, descricao, imagem, ordem) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$nome, $publico_alvo, $categoria, $descricao, $imagem, $ordem]);
        header("Location: emblemas.php?msg=created");
        exit;
    }
}

require_once '../includes/admin_header.php';
?>

<h2>Gerenciar Emblemas</h2>

<?php if (isset($_GET['msg'])): ?>
    <div style="background: #d4edda; color: #155724; padding: 10px; margin-bottom: 20px; border-radius: 4px;">
        <?php 
            if ($_GET['msg'] == 'created') echo "Emblema criado com sucesso!";
            if ($_GET['msg'] == 'updated') echo "Emblema atualizado com sucesso!";
            if ($_GET['msg'] == 'deleted') echo "Emblema excluído com sucesso!";
        ?>
    </div>
<?php endif; ?>

<?php if ($action == 'add' || $action == 'edit'): ?>
    <?php
    $data = ['nome' => '', 'categoria' => '', 'descricao' => '', 'imagem' => '', 'ordem' => 0];
    if ($action == 'edit' && isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM emblemas WHERE id = ?");
        $stmt->execute([(int)$_GET['id']]);
        $data = $stmt->fetch();
    }
    ?>
    <div class="form-container">
        <h3><?php echo $action == 'add' ? 'Novo Emblema' : 'Editar Emblema'; ?></h3>
        <form method="POST" enctype="multipart/form-data">
            <?php if ($action == 'edit'): ?>
                <input type="hidden" name="id" value="<?php echo $data['id']; ?>">
            <?php endif; ?>
            
            <div class="form-group">
                <label>Nome do Emblema</label>
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
                <label>Categoria</label>
                <select name="categoria" class="form-control">
                    <option value="Emblemas" <?php echo ($data['categoria'] == 'Emblemas') ? 'selected' : ''; ?>>Emblemas</option>
                    <option value="Insignias e Tiras" <?php echo ($data['categoria'] == 'Insignias e Tiras') ? 'selected' : ''; ?>>Insignias e Tiras</option>
                    <option value="Distintivos" <?php echo ($data['categoria'] == 'Distintivos') ? 'selected' : ''; ?>>Distintivos</option>
                    <option value="Bandeira Oficial dos Desbravadores" <?php echo ($data['categoria'] == 'Bandeira Oficial dos Desbravadores') ? 'selected' : ''; ?>>Bandeira Oficial dos Desbravadores</option>
                    <option value="Bandeirim" <?php echo ($data['categoria'] == 'Bandeirim') ? 'selected' : ''; ?>>Bandeirim</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Ordem na lista</label>
                <input type="number" name="ordem" class="form-control" value="<?php echo htmlspecialchars(isset($data['ordem']) ? $data['ordem'] : 0); ?>" min="0">
            </div>
            
            <div class="form-group">
                <label>Imagem</label>
                <?php if ($data['imagem']): ?>
                    <div style="margin-bottom: 10px;">
                        <img src="../uploads/<?php echo $data['imagem']; ?>" width="100">
                    </div>
                <?php endif; ?>
                <input type="file" name="imagem" class="form-control" accept="image/*">
            </div>
            
            <div class="form-group">
                <label>Descrição</label>
                <textarea name="descricao" class="form-control" required><?php echo htmlspecialchars($data['descricao']); ?></textarea>
            </div>
            
            <button type="submit" class="btn-new">Salvar</button>
            <a href="emblemas.php" class="btn-delete" style="text-decoration: none; margin-left: 10px;">Cancelar</a>
        </form>
    </div>

<?php else: ?>
    <a href="emblemas.php?action=add" class="btn-new">+ Novo Emblema</a>
    
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Ordem</th>
                <th>Imagem</th>
                <th>Público</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Ações</th>
            </tr>
        </thead>
        <tbody>
            <?php
            $stmt = $pdo->query("SELECT * FROM emblemas ORDER BY ordem ASC, nome ASC");
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
                <td><?php echo htmlspecialchars($row['nome']); ?></td>
                <td><?php echo htmlspecialchars($row['categoria']); ?></td>
                <td class="actions">
                    <a href="emblemas.php?action=edit&id=<?php echo $row['id']; ?>" class="btn-edit">Editar</a>
                    <a href="emblemas.php?action=delete&id=<?php echo $row['id']; ?>" class="btn-delete" onclick="return confirm('Tem certeza que deseja excluir?')">Excluir</a>
                </td>
            </tr>
            <?php endwhile; ?>
        </tbody>
    </table>
<?php endif; ?>

<?php require_once '../includes/admin_footer.php'; ?>
