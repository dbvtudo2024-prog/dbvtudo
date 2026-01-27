<?php
require_once '../includes/config.php';
require_once '../includes/conexao.php';

$current_page = 'livros';
$action = isset($_GET['action']) ? $_GET['action'] : 'list';
$pdo->exec("CREATE TABLE IF NOT EXISTS livros (id INT AUTO_INCREMENT PRIMARY KEY, titulo VARCHAR(255), autor VARCHAR(255), descricao TEXT, imagem VARCHAR(255))");

function uploadImage($file) { if ($file['error']===UPLOAD_ERR_OK){ $ext=pathinfo($file['name'],PATHINFO_EXTENSION); $new=uniqid().".".$ext; $dest='../uploads/'.$new; if(move_uploaded_file($file['tmp_name'],$dest)) return $new; } return null; }
function columnExists(PDO $pdo,$t,$c){ $driver=$pdo->getAttribute(PDO::ATTR_DRIVER_NAME); $sql=$driver==='pgsql'?"SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=:t AND column_name=:c":"SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=:t AND column_name=:c"; $st=$pdo->prepare($sql); $st->execute([':t'=>$t,':c'=>$c]); return (bool)$st->fetchColumn(); }
if(!columnExists($pdo,'livros','arquivo')){ try{$pdo->exec("ALTER TABLE livros ADD COLUMN arquivo VARCHAR(255)");}catch(Exception $e){} }
if(!columnExists($pdo,'livros','categoria')){ try{$pdo->exec("ALTER TABLE livros ADD COLUMN categoria VARCHAR(50)");}catch(Exception $e){} }

if ($action=='delete' && isset($_GET['id'])) {
    $id=(int)$_GET['id'];
    $stmt=$pdo->prepare("SELECT imagem,arquivo FROM livros WHERE id=?"); $stmt->execute([$id]); $row=$stmt->fetch(PDO::FETCH_ASSOC); $img=isset($row['imagem'])?$row['imagem']:null; $arq=isset($row['arquivo'])?$row['arquivo']:null;
    $stmt=$pdo->prepare("DELETE FROM livros WHERE id=?"); if($stmt->execute([$id])){ foreach([$img,$arq] as $f){ if($f && file_exists('../uploads/'.$f)) unlink('../uploads/'.$f); } header("Location: livros.php?msg=deleted"); exit; }
}

if ($_SERVER['REQUEST_METHOD']==='POST'){
    $id=isset($_POST['id'])?(int)$_POST['id']:null;
    $titulo=$_POST['titulo']; $autor=$_POST['autor']; $descricao=$_POST['descricao']; $categoria=isset($_POST['categoria'])?$_POST['categoria']:null;
    $publico_alvo=isset($_POST['publico_alvo'])?$_POST['publico_alvo']:'Desbravador';
    $imagem=null; if(isset($_FILES['imagem']) && $_FILES['imagem']['size']>0) $imagem=uploadImage($_FILES['imagem']);
    $arquivo=null; if(isset($_FILES['arquivo']) && $_FILES['arquivo']['size']>0) $arquivo=uploadImage($_FILES['arquivo']);
    if($id){ $sql="UPDATE livros SET titulo=?, autor=?, descricao=?, publico_alvo=?"; $params=[$titulo,$autor,$descricao,$publico_alvo]; if($categoria!==null){ $sql.=", categoria=?"; $params[]=$categoria; } if($imagem){ $sql.=", imagem=?"; $params[]=$imagem; } if($arquivo){ $sql.=", arquivo=?"; $params[]=$arquivo; } $sql.=" WHERE id=?"; $params[]=$id; $pdo->prepare($sql)->execute($params); header("Location: livros.php?msg=updated"); exit; }
    else { $pdo->prepare("INSERT INTO livros (titulo, autor, descricao, publico_alvo, imagem, arquivo, categoria) VALUES (?,?,?,?,?,?,?)")->execute([$titulo,$autor,$descricao,$publico_alvo,$imagem,$arquivo,$categoria]); header("Location: livros.php?msg=created"); exit; }
}

require_once '../includes/admin_header.php';
?>
<h2>Gerenciar Livros</h2>
<?php if (isset($_GET['msg'])): ?><div style="background:#d4edda;color:#155724;padding:10px;margin-bottom:20px;border-radius:4px;"><?php if($_GET['msg']=='created')echo"Livro criado"; if($_GET['msg']=='updated')echo"Livro atualizado"; if($_GET['msg']=='deleted')echo"Livro excluído"; ?></div><?php endif; ?>
<?php if ($action=='add' || $action=='edit'):
    $data=['titulo'=>'','autor'=>'','descricao'=>'','imagem'=>'','arquivo'=>'','categoria'=>'']; if($action=='edit' && isset($_GET['id'])){ $stmt=$pdo->prepare("SELECT * FROM livros WHERE id=?"); $stmt->execute([(int)$_GET['id']]); $data=$stmt->fetch(); } ?>
    <div class="form-container">
        <h3><?php echo $action=='add'?'Novo Livro':'Editar Livro'; ?></h3>
        <form method="POST" enctype="multipart/form-data">
            <?php if($action=='edit'): ?><input type="hidden" name="id" value="<?php echo $data['id']; ?>"><?php endif; ?>
            <div class="form-group"><label>Título</label><input type="text" name="titulo" class="form-control" value="<?php echo htmlspecialchars($data['titulo']); ?>" required></div>
            <div class="form-group"><label>Público Alvo</label><select name="publico_alvo" class="form-control"><option value="Desbravador" <?php echo (isset($data['publico_alvo']) && $data['publico_alvo']=='Desbravador')?'selected':''; ?>>Desbravador</option><option value="Aventureiro" <?php echo (isset($data['publico_alvo']) && $data['publico_alvo']=='Aventureiro')?'selected':''; ?>>Aventureiro</option></select></div>
            <div class="form-group"><label>Autor</label><input type="text" name="autor" class="form-control" value="<?php echo htmlspecialchars($data['autor']); ?>"></div>
            <div class="form-group"><label>Categoria</label><select name="categoria" class="form-control"><option value="">Selecione...</option><option value="Livros do Ano" <?php echo ($data['categoria']=='Livros do Ano')?'selected':''; ?>>Livros do Ano</option><option value="Livros das Classes" <?php echo ($data['categoria']=='Livros das Classes')?'selected':''; ?>>Livros das Classes</option><option value="Outros Livros" <?php echo ($data['categoria']=='Outros Livros')?'selected':''; ?>>Outros Livros</option></select></div>
            <div class="form-group"><label>Imagem</label><?php if($data['imagem']): ?><div style="margin-bottom:10px;"><img src="../uploads/<?php echo $data['imagem']; ?>" width="100"></div><?php endif; ?><input type="file" name="imagem" class="form-control" accept="image/*"></div>
            <div class="form-group"><label>Arquivo (PDF/DOC)</label><?php if(!empty($data['arquivo'])): ?><div style="margin-bottom:10px;"><a href="../uploads/<?php echo $data['arquivo']; ?>" target="_blank">Arquivo atual</a></div><?php endif; ?><input type="file" name="arquivo" class="form-control" accept=".pdf,.doc,.docx"></div>
            <div class="form-group"><label>Descrição</label><textarea name="descricao" class="form-control" required><?php echo htmlspecialchars($data['descricao']); ?></textarea></div>
            <button type="submit" class="btn-new">Salvar</button><a href="livros.php" class="btn-back-standard" style="margin-left:10px;">Voltar</a>
        </form>
    </div>
<?php else: ?>
    <a href="livros.php?action=add" class="btn-new">+ Novo Livro</a>
    <table><thead><tr><th>ID</th><th>Imagem</th><th>Público</th><th>Título</th><th>Autor</th><th>Categoria</th><th>Ações</th></tr></thead><tbody>
        <?php $stmt=$pdo->query("SELECT * FROM livros ORDER BY id DESC"); while($row=$stmt->fetch()): ?>
        <tr>
            <td><?php echo $row['id']; ?></td>
            <td><?php if($row['imagem']): ?><img src="../uploads/<?php echo $row['imagem']; ?>" width="50" height="50" style="object-fit:contain;"><?php else: ?>-<?php endif; ?></td>
            <td><?php echo htmlspecialchars($row['publico_alvo']??'Desbravador'); ?></td>
            <td><?php echo htmlspecialchars($row['titulo']); ?></td>
            <td><?php echo htmlspecialchars($row['autor']); ?></td>
            <td><?php echo htmlspecialchars(isset($row['categoria'])?$row['categoria']:''); ?></td>
            <td class="actions"><a href="livros.php?action=edit&id=<?php echo $row['id']; ?>" class="btn-edit">Editar</a> <a href="livros.php?action=delete&id=<?php echo $row['id']; ?>" class="btn-delete" onclick="return confirm('Tem certeza?')">Excluir</a></td>
        </tr>
        <?php endwhile; ?>
    </tbody></table>
<?php endif; ?>
<?php require_once '../includes/admin_footer.php'; ?>
