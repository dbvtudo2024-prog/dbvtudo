<?php
require_once '../includes/config.php';
require_once '../includes/conexao.php';
$current_page='manuais'; $action=isset($_GET['action'])?$_GET['action']:'list';
$pdo->exec("CREATE TABLE IF NOT EXISTS manuais (id INT AUTO_INCREMENT PRIMARY KEY, titulo VARCHAR(255), descricao TEXT, arquivo VARCHAR(255), imagem VARCHAR(255))");
function uploadFile($file){ if($file['error']===UPLOAD_ERR_OK){ $ext=pathinfo($file['name'],PATHINFO_EXTENSION); $new=uniqid().".".$ext; $dest='../uploads/'.$new; if(move_uploaded_file($file['tmp_name'],$dest)) return $new; } return null; }
if($action=='delete' && isset($_GET['id'])){ $id=(int)$_GET['id']; $stmt=$pdo->prepare("SELECT imagem,arquivo FROM manuais WHERE id=?"); $stmt->execute([$id]); $data=$stmt->fetch(); $stmt=$pdo->prepare("DELETE FROM manuais WHERE id=?"); if($stmt->execute([$id])){ foreach(['imagem','arquivo'] as $k){ if(!empty($data[$k]) && file_exists('../uploads/'.$data[$k])) unlink('../uploads/'.$data[$k]); } header("Location: manuais.php?msg=deleted"); exit; } }
if($_SERVER['REQUEST_METHOD']==='POST'){ $id=isset($_POST['id'])?(int)$_POST['id']:null; $titulo=$_POST['titulo']; $descricao=$_POST['descricao']; $publico_alvo=isset($_POST['publico_alvo'])?$_POST['publico_alvo']:'Desbravador'; $imagem=null; $arquivo=null; if(isset($_FILES['imagem']) && $_FILES['imagem']['size']>0) $imagem=uploadFile($_FILES['imagem']); if(isset($_FILES['arquivo']) && $_FILES['arquivo']['size']>0) $arquivo=uploadFile($_FILES['arquivo']); if($id){ $sql="UPDATE manuais SET titulo=?, descricao=?, publico_alvo=?"; $params=[$titulo,$descricao,$publico_alvo]; if($imagem){ $sql.=", imagem=?"; $params[]=$imagem; } if($arquivo){ $sql.=", arquivo=?"; $params[]=$arquivo; } $sql.=" WHERE id=?"; $params[]=$id; $pdo->prepare($sql)->execute($params); header("Location: manuais.php?msg=updated"); exit; } else { $pdo->prepare("INSERT INTO manuais (titulo, descricao, publico_alvo, arquivo, imagem) VALUES (?,?,?,?,?)")->execute([$titulo,$descricao,$publico_alvo,$arquivo,$imagem]); header("Location: manuais.php?msg=created"); exit; } }
require_once '../includes/admin_header.php';
?>
<h2>Gerenciar Manuais</h2>
<?php if(isset($_GET['msg'])): ?><div style="background:#d4edda;color:#155724;padding:10px;margin-bottom:20px;border-radius:4px;"><?php if($_GET['msg']=='created')echo"Manual criado"; if($_GET['msg']=='updated')echo"Manual atualizado"; if($_GET['msg']=='deleted')echo"Manual excluído"; ?></div><?php endif; ?>
<?php if($action=='add' || $action=='edit'):
    $data=['titulo'=>'','descricao'=>'','arquivo'=>'','imagem'=>'']; if($action=='edit' && isset($_GET['id'])){ $stmt=$pdo->prepare("SELECT * FROM manuais WHERE id=?"); $stmt->execute([(int)$_GET['id']]); $data=$stmt->fetch(); } ?>
    <div class="form-container">
        <h3><?php echo $action=='add'?'Novo Manual':'Editar Manual'; ?></h3>
        <form method="POST" enctype="multipart/form-data">
            <?php if($action=='edit'): ?><input type="hidden" name="id" value="<?php echo $data['id']; ?>"><?php endif; ?>
            <div class="form-group"><label>Título</label><input type="text" name="titulo" class="form-control" value="<?php echo htmlspecialchars($data['titulo']); ?>" required></div>
            <div class="form-group"><label>Público Alvo</label><select name="publico_alvo" class="form-control"><option value="Desbravador" <?php echo (isset($data['publico_alvo']) && $data['publico_alvo']=='Desbravador')?'selected':''; ?>>Desbravador</option><option value="Aventureiro" <?php echo (isset($data['publico_alvo']) && $data['publico_alvo']=='Aventureiro')?'selected':''; ?>>Aventureiro</option></select></div>
            <div class="form-group"><label>Imagem</label><?php if($data['imagem']): ?><div style="margin-bottom:10px;"><img src="../uploads/<?php echo $data['imagem']; ?>" width="100"></div><?php endif; ?><input type="file" name="imagem" class="form-control" accept="image/*"></div>
            <div class="form-group"><label>Arquivo (PDF/Doc)</label><?php if($data['arquivo']): ?><div style="margin-bottom:10px;"><a href="../uploads/<?php echo $data['arquivo']; ?>" target="_blank">Arquivo atual</a></div><?php endif; ?><input type="file" name="arquivo" class="form-control" accept=".pdf,.doc,.docx"></div>
            <div class="form-group"><label>Descrição</label><textarea name="descricao" class="form-control" required><?php echo htmlspecialchars($data['descricao']); ?></textarea></div>
            <button type="submit" class="btn-new">Salvar</button><a href="manuais.php" class="btn-delete" style="text-decoration:none;margin-left:10px;">Cancelar</a>
        </form>
    </div>
<?php else: ?>
    <a href="manuais.php?action=add" class="btn-new">+ Novo Manual</a>
    <table><thead><tr><th>ID</th><th>Imagem</th><th>Público</th><th>Título</th><th>Ações</th></tr></thead><tbody>
        <?php $stmt=$pdo->query("SELECT * FROM manuais ORDER BY id DESC"); while($row=$stmt->fetch()): ?>
        <tr>
            <td><?php echo $row['id']; ?></td>
            <td><?php if($row['imagem']): ?><img src="../uploads/<?php echo $row['imagem']; ?>" width="50" height="50" style="object-fit:contain;"><?php else: ?>-<?php endif; ?></td>
            <td><?php echo htmlspecialchars($row['publico_alvo']??'Desbravador'); ?></td>
            <td><?php echo htmlspecialchars($row['titulo']); ?></td>
            <td class="actions"><a href="manuais.php?action=edit&id=<?php echo $row['id']; ?>" class="btn-edit">Editar</a> <a href="manuais.php?action=delete&id=<?php echo $row['id']; ?>" class="btn-delete" onclick="return confirm('Tem certeza?')">Excluir</a></td>
        </tr>
        <?php endwhile; ?>
    </tbody></table>
<?php endif; ?>
<?php require_once '../includes/admin_footer.php'; ?>

