<?php
require_once '../includes/config.php';
require_once '../includes/conexao.php';

$current_page = 'desbrava_mais';
$action = isset($_GET['action']) ? $_GET['action'] : 'list';

// Create table if not exists
$pdo->exec("CREATE TABLE IF NOT EXISTS desbrava_mais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    conteudo TEXT,
    imagem VARCHAR(255),
    arquivo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

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

if ($action == 'delete' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("SELECT imagem, arquivo FROM desbrava_mais WHERE id=?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $img = isset($row['imagem']) ? $row['imagem'] : null;
    $arq = isset($row['arquivo']) ? $row['arquivo'] : null;
    
    $stmt = $pdo->prepare("DELETE FROM desbrava_mais WHERE id=?");
    if ($stmt->execute([$id])) {
        foreach([$img, $arq] as $f) {
            if ($f && file_exists('../uploads/' . $f)) {
                unlink('../uploads/' . $f);
            }
        }
        header("Location: desbrava_mais.php?msg=deleted");
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = isset($_POST['id']) ? (int)$_POST['id'] : null;
    $nome = $_POST['nome'];
    $descricao = $_POST['descricao'];
    $conteudo = $_POST['conteudo'];
    
    $imagem = null;
    if (isset($_FILES['imagem']) && $_FILES['imagem']['size'] > 0) {
        $imagem = uploadImage($_FILES['imagem']);
    }

    $arquivo = null;
    if (isset($_FILES['arquivo']) && $_FILES['arquivo']['size'] > 0) {
        $arquivo = uploadImage($_FILES['arquivo']);
    }

    if ($id) {
        $sql = "UPDATE desbrava_mais SET nome=?, descricao=?, conteudo=?";
        $params = [$nome, $descricao, $conteudo];
        
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
        header("Location: desbrava_mais.php?msg=updated");
        exit;
    } else {
        $pdo->prepare("INSERT INTO desbrava_mais (nome, descricao, conteudo, imagem, arquivo) VALUES (?,?,?,?,?)")
            ->execute([$nome, $descricao, $conteudo, $imagem, $arquivo]);
        header("Location: desbrava_mais.php?msg=created");
        exit;
    }
}

require_once '../includes/admin_header.php';
?>

<h2>Gerenciar Desbrava Mais</h2>

<?php if (isset($_GET['msg'])): ?>
    <div style="background:#d4edda;color:#155724;padding:10px;margin-bottom:20px;border-radius:4px;">
        <?php 
        if($_GET['msg']=='created') echo "Item criado com sucesso!";
        if($_GET['msg']=='updated') echo "Item atualizado com sucesso!";
        if($_GET['msg']=='deleted') echo "Item excluído com sucesso!";
        ?>
    </div>
<?php endif; ?>

<?php if ($action == 'add' || $action == 'edit'): 
    $data = ['nome'=>'','descricao'=>'','conteudo'=>'','imagem'=>'','arquivo'=>''];
    if ($action == 'edit' && isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM desbrava_mais WHERE id=?");
        $stmt->execute([(int)$_GET['id']]);
        $data = $stmt->fetch();
    }
?>
    <div class="form-container">
        <h3><?php echo $action == 'add' ? 'Novo Item' : 'Editar Item'; ?></h3>
        <form method="POST" enctype="multipart/form-data">
            <?php if($action == 'edit'): ?>
                <input type="hidden" name="id" value="<?php echo $data['id']; ?>">
            <?php endif; ?>
            
            <div class="form-group">
                <label>Nome</label>
                <input type="text" name="nome" class="form-control" value="<?php echo htmlspecialchars($data['nome']); ?>" required>
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
                <label>Arquivo (PDF/DOC)</label>
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
            <a href="desbrava_mais.php" class="btn-back-standard" style="margin-left:10px;">Voltar</a>
        </form>
    </div>
<?php else: ?>
    <a href="desbrava_mais.php?action=add" class="btn-new">+ Novo Item</a>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Capa</th>
                <th>Nome</th>
                <th>Arquivo</th>
                <th>Ações</th>
            </tr>
        </thead>
        <tbody>
            <?php 
            $stmt = $pdo->query("SELECT * FROM desbrava_mais ORDER BY created_at DESC");
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
                <td><?php echo htmlspecialchars($row['nome']); ?></td>
                <td>
                    <?php if($row['arquivo']): ?>
                        <a href="../uploads/<?php echo $row['arquivo']; ?>" target="_blank">Baixar</a>
                    <?php else: ?>
                        -
                    <?php endif; ?>
                </td>
                <td class="actions">
                    <a href="desbrava_mais.php?action=edit&id=<?php echo $row['id']; ?>" class="btn-edit">Editar</a>
                    <a href="desbrava_mais.php?action=delete&id=<?php echo $row['id']; ?>" class="btn-delete" onclick="return confirm('Tem certeza?')">Excluir</a>
                </td>
            </tr>
            <?php endwhile; ?>
        </tbody>
    </table>
<?php endif; ?>

<?php require_once '../includes/admin_footer.php'; ?>
