<?php
require_once '../includes/config.php';
require_once '../includes/conexao.php';

$current_page = 'estudos';
$action = isset($_GET['action']) ? $_GET['action'] : 'list';

// Create table if not exists
$pdo->exec("CREATE TABLE IF NOT EXISTS estudos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    conteudo TEXT,
    imagem VARCHAR(255),
    arquivo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$stmtCol = $pdo->prepare("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'estudos' AND COLUMN_NAME = 'arquivo'");
$stmtCol->execute();
if ((int)$stmtCol->fetchColumn() === 0) {
    $pdo->exec("ALTER TABLE estudos ADD COLUMN arquivo VARCHAR(255) NULL");
}

function uploadImage($file) {
    if ($file['error'] === UPLOAD_ERR_OK) {
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $new = uniqid() . "." . $ext;
        $dest = '../uploads/' . $new;
        if (move_uploaded_file($file['tmp_name'], $dest)) {
            return $new;
        }
    }
    return null;
}

function uploadFileGeneric($file, $allowed) {
    if ($file['error'] === UPLOAD_ERR_OK) {
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, $allowed)) return null;
        $new = uniqid() . "." . $ext;
        $dest = '../uploads/' . $new;
        if (move_uploaded_file($file['tmp_name'], $dest)) {
            return $new;
        }
    }
    return null;
}


if ($action == 'delete' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("SELECT imagem, arquivo FROM estudos WHERE id=?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $img = isset($row['imagem']) ? $row['imagem'] : null;
    $file = isset($row['arquivo']) ? $row['arquivo'] : null;
    
    $stmt = $pdo->prepare("DELETE FROM estudos WHERE id=?");
    if ($stmt->execute([$id])) {
        if ($img && file_exists('../uploads/' . $img)) {
            unlink('../uploads/' . $img);
        }
        if ($file && file_exists('../uploads/' . $file)) {
            unlink('../uploads/' . $file);
        }
        header("Location: estudos.php?msg=deleted");
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? (int)$_POST['id'] : null;
    $titulo = $_POST['titulo'];
    $publico_alvo = isset($_POST['publico_alvo']) ? $_POST['publico_alvo'] : 'Desbravador';
    $descricao = $_POST['descricao'];
    $conteudo = $_POST['conteudo'];
    
    $imagem = null;
    if (isset($_FILES['imagem']) && $_FILES['imagem']['size'] > 0) {
        $imagem = uploadImage($_FILES['imagem']);
    }
    $arquivo = null;
    if (isset($_FILES['arquivo']) && $_FILES['arquivo']['size'] > 0) {
        $arquivo = uploadFileGeneric($_FILES['arquivo'], ['pdf','doc','docx']);
    }

    if ($id) {
        $sql = "UPDATE estudos SET titulo=?, publico_alvo=?, descricao=?, conteudo=?";
        $params = [$titulo, $publico_alvo, $descricao, $conteudo];
        
        if ($imagem) {
            $sql .= ", imagem=?";
            $params[] = $imagem;
        }
        if ($arquivo) {
            $sql .= ", arquivo=?";
            $params[] = $arquivo;
        }
        
        $sql .= " WHERE id=?";
        $params[] = $id;
        
        $pdo->prepare($sql)->execute($params);
        header("Location: estudos.php?msg=updated");
        exit;
    } else {
        $pdo->prepare("INSERT INTO estudos (titulo, publico_alvo, descricao, conteudo, imagem, arquivo) VALUES (?,?,?,?,?,?)")
            ->execute([$titulo, $publico_alvo, $descricao, $conteudo, $imagem, $arquivo]);
        header("Location: estudos.php?msg=created");
        exit;
    }
}

require_once '../includes/admin_header.php';
?>

<h2>Gerenciar Estudos</h2>

<?php if (isset($_GET['msg'])): ?>
    <div style="background:#d4edda;color:#155724;padding:10px;margin-bottom:20px;border-radius:4px;">
        <?php 
        if($_GET['msg']=='created') echo "Estudo criado com sucesso!";
        if($_GET['msg']=='updated') echo "Estudo atualizado com sucesso!";
        if($_GET['msg']=='deleted') echo "Estudo excluído com sucesso!";
        ?>
    </div>
<?php endif; ?>

<?php if ($action == 'add' || $action == 'edit'): 
    $data = ['titulo'=>'','descricao'=>'','conteudo'=>'','imagem'=>''];
    if ($action == 'edit' && isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM estudos WHERE id=?");
        $stmt->execute([(int)$_GET['id']]);
        $data = $stmt->fetch();
    }
?>
    <div class="form-container">
        <h3><?php echo $action == 'add' ? 'Novo Estudo' : 'Editar Estudo'; ?></h3>
        <form method="POST" enctype="multipart/form-data">
            <?php if($action == 'edit'): ?>
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
                <label>Capa (Imagem)</label>
                <?php if($data['imagem']): ?>
                    <div style="margin-bottom:10px;">
                        <img src="../uploads/<?php echo $data['imagem']; ?>" width="100">
                    </div>
                <?php endif; ?>
                <input type="file" name="imagem" class="form-control" accept="image/*">
            </div>
            
            <div class="form-group">
                <label>Arquivo (PDF ou DOC/DOCX)</label>
                <?php if(!empty($data['arquivo'])): ?>
                    <div style="margin-bottom:10px;">
                        <a href="../uploads/<?php echo $data['arquivo']; ?>" target="_blank">Arquivo atual</a>
                    </div>
                <?php endif; ?>
                <input type="file" name="arquivo" class="form-control" accept=".pdf,.doc,.docx">
            </div>
            
            <div class="form-group">
                <label>Descrição (Resumo)</label>
                <textarea name="descricao" class="form-control" rows="3" required><?php echo htmlspecialchars($data['descricao']); ?></textarea>
            </div>

            <div class="form-group">
                <label>Conteúdo Completo</label>
                <textarea name="conteudo" class="form-control" rows="10"><?php echo htmlspecialchars($data['conteudo']); ?></textarea>
            </div>
            
            <button type="submit" class="btn-new">Salvar</button>
            <a href="estudos.php" class="btn-back-standard" style="margin-left:10px;">Voltar</a>
        </form>
    </div>
<?php else: ?>
    <a href="estudos.php?action=add" class="btn-new">+ Novo Estudo</a>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Capa</th>
                <th>Arquivo</th>
                <th>Título</th>
                <th>Público</th>
                <th>Descrição</th>
                <th>Ações</th>
            </tr>
        </thead>
        <tbody>
            <?php 
            $stmt = $pdo->query("SELECT * FROM estudos ORDER BY created_at DESC");
            while($row = $stmt->fetch()): 
            ?>
            <tr>
                <td><?php echo $row['id']; ?></td>
                <td>
                    <?php if($row['imagem']): ?>
                        <img src="../uploads/<?php echo $row['imagem']; ?>" width="50" height="50" style="object-fit:cover;">
                    <?php else: ?>
                        -
                    <?php endif; ?>
                </td>
                <td>
                    <?php if(!empty($row['arquivo'])): ?>
                        <span class="badge">OK</span>
                    <?php else: ?>
                        -
                    <?php endif; ?>
                </td>
                <td><?php echo htmlspecialchars($row['titulo']); ?></td>
                <td><?php echo htmlspecialchars($row['publico_alvo'] ?? 'Desbravador'); ?></td>
                <td><?php echo htmlspecialchars(substr($row['descricao'], 0, 50)) . '...'; ?></td>
                <td class="actions">
                    <a href="estudos.php?action=edit&id=<?php echo $row['id']; ?>" class="btn-edit">Editar</a>
                    <a href="estudos.php?action=delete&id=<?php echo $row['id']; ?>" class="btn-delete" onclick="return confirm('Tem certeza?')">Excluir</a>
                </td>
            </tr>
            <?php endwhile; ?>
        </tbody>
    </table>
<?php endif; ?>

<?php require_once '../includes/admin_footer.php'; ?>
