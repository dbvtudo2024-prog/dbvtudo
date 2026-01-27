<?php
require_once '../includes/config.php';
require_once '../includes/conexao.php';

$current_page = 'videos';
$view = isset($_GET['view']) ? $_GET['view'] : 'videos'; // 'videos' or 'categories'
$action = isset($_GET['action']) ? $_GET['action'] : 'list';

// Ensure tables exist
$pdo->exec("CREATE TABLE IF NOT EXISTS videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  youtube_url VARCHAR(255),
  video_id VARCHAR(32),
  titulo VARCHAR(255),
  canal VARCHAR(255),
  inscritos INT NULL,
  visualizacoes INT NULL,
  criado_em DATETIME,
  categoria_id INT NULL
)");
$pdo->exec("CREATE TABLE IF NOT EXISTS video_categorias (id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(100), ordem INT DEFAULT 0)");

function columnExists(PDO $pdo, $table, $column) {
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    if ($driver === 'pgsql') {
        $stmt = $pdo->prepare("SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name = :t AND column_name = :c");
    } else {
        $stmt = $pdo->prepare("SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :t AND column_name = :c");
    }
    $stmt->execute([':t' => $table, ':c' => $column]);
    return (bool)$stmt->fetchColumn();
}

if (!columnExists($pdo, 'videos', 'publico_alvo')) {
    try { $pdo->exec("ALTER TABLE videos ADD COLUMN publico_alvo VARCHAR(50) DEFAULT 'Desbravador'"); } catch (Exception $e) {}
}

// Helpers
function httpGet($url) {
    $ctx = stream_context_create(['http' => ['timeout' => 8, 'ignore_errors' => true]]);
    $res = @file_get_contents($url, false, $ctx);
    if ($res !== false) return $res;
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 8);
        $out = curl_exec($ch);
        curl_close($ch);
        return $out;
    }
    return null;
}

function parseVideoId($url) {
    if (preg_match('/v=([^&]+)/', $url, $m)) return $m[1];
    if (preg_match('#youtu\.be/([^?&]+)#', $url, $m)) return $m[1];
    if (preg_match('#youtube\.com/embed/([^?&]+)#', $url, $m)) return $m[1];
    return '';
}

function fetchBasicMeta($videoUrl) {
    $meta = ['titulo'=>'','canal'=>''];
    $resp = httpGet('https://noembed.com/embed?url=' . urlencode($videoUrl));
    if ($resp) {
        $data = @json_decode($resp, true);
        if (is_array($data)) {
            $meta['titulo'] = isset($data['title']) ? $data['title'] : '';
            $meta['canal'] = isset($data['author_name']) ? $data['author_name'] : '';
        }
    }
    return $meta;
}

function fetchAdvancedMeta($videoId) {
    $adv = ['inscritos'=>null, 'visualizacoes'=>null];
    if (defined('YT_API_KEY') && YT_API_KEY) {
        $api = 'https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=' . urlencode($videoId) . '&key=' . urlencode(YT_API_KEY);
        $resp = httpGet($api);
        if ($resp) {
            $data = @json_decode($resp, true);
            if (is_array($data) && isset($data['items'][0])) {
                $item = $data['items'][0];
                $adv['visualizacoes'] = isset($item['statistics']['viewCount']) ? (int)$item['statistics']['viewCount'] : null;
                $channelId = isset($item['snippet']['channelId']) ? $item['snippet']['channelId'] : '';
                if ($channelId) {
                    $api2 = 'https://www.googleapis.com/youtube/v3/channels?part=statistics&id=' . urlencode($channelId) . '&key=' . urlencode(YT_API_KEY);
                    $resp2 = httpGet($api2);
                    if ($resp2) {
                        $d2 = @json_decode($resp2, true);
                        if (is_array($d2) && isset($d2['items'][0]['statistics']['subscriberCount'])) {
                            $adv['inscritos'] = (int)$d2['items'][0]['statistics']['subscriberCount'];
                        }
                    }
                }
            }
        }
    }
    return $adv;
}

// Logic for Deletion
if ($action === 'delete' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    if ($view === 'categories') {
        $stmt = $pdo->prepare("DELETE FROM video_categorias WHERE id=?");
        if ($stmt->execute([$id])) {
            header("Location: videos.php?view=categories&msg=deleted");
            exit;
        }
    } else {
        $stmt = $pdo->prepare("DELETE FROM videos WHERE id=?");
        if ($stmt->execute([$id])) {
            header("Location: videos.php?msg=deleted");
            exit;
        }
    }
}

// Logic for POST (Save)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($view === 'categories') {
        $id = isset($_POST['id']) ? (int)$_POST['id'] : null;
        $nome = trim($_POST['nome']);
        $ordem = isset($_POST['ordem']) ? (int)$_POST['ordem'] : 0;
        if ($id) {
            $stmt = $pdo->prepare("UPDATE video_categorias SET nome=?, ordem=? WHERE id=?");
            $stmt->execute([$nome, $ordem, $id]);
            header("Location: videos.php?view=categories&msg=updated");
            exit;
        } else {
            $stmt = $pdo->prepare("INSERT INTO video_categorias (nome, ordem) VALUES (?, ?)");
            $stmt->execute([$nome, $ordem]);
            header("Location: videos.php?view=categories&msg=created");
            exit;
        }
    } else {
        // Videos
        $id = isset($_POST['id']) ? (int)$_POST['id'] : null;
        $youtube_url = trim($_POST['youtube_url']);
        $video_id = parseVideoId($youtube_url);
        $basic = fetchBasicMeta($youtube_url);
        $adv = fetchAdvancedMeta($video_id);
        $titulo = $basic['titulo'];
        $canal = $basic['canal'];
        $inscritos = $adv['inscritos'];
        $visualizacoes = $adv['visualizacoes'];
        $agora = date('Y-m-d H:i:s');
        $categoria_id = isset($_POST['categoria_id']) && $_POST['categoria_id'] !== '' ? (int)$_POST['categoria_id'] : null;
        $publico_alvo = isset($_POST['publico_alvo']) ? $_POST['publico_alvo'] : 'Desbravador';

        if ($id) {
            $sql = "UPDATE videos SET youtube_url=?, video_id=?, titulo=?, canal=?, inscritos=?, visualizacoes=?, criado_em=?, categoria_id=?, publico_alvo=? WHERE id=?";
            $pdo->prepare($sql)->execute([$youtube_url, $video_id, $titulo, $canal, $inscritos, $visualizacoes, $agora, $categoria_id, $publico_alvo, $id]);
            header("Location: videos.php?msg=updated");
            exit;
        } else {
            $sql = "INSERT INTO videos (youtube_url, video_id, titulo, canal, inscritos, visualizacoes, criado_em, categoria_id, publico_alvo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $pdo->prepare($sql)->execute([$youtube_url, $video_id, $titulo, $canal, $inscritos, $visualizacoes, $agora, $categoria_id, $publico_alvo]);
            header("Location: videos.php?msg=created");
            exit;
        }
    }
}

require_once '../includes/admin_header.php';
?>

<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
    <h2>Gerenciar Vídeos</h2>
    <div>
        <a href="videos.php?view=videos" class="btn-new" style="<?php echo $view=='videos'?'background:#333;':'background:#777;'; ?>">Vídeos</a>
        <a href="videos.php?view=categories" class="btn-new" style="<?php echo $view=='categories'?'background:#333;':'background:#777;'; ?>">Categorias</a>
    </div>
</div>

<?php if (isset($_GET['msg'])): ?>
    <div style="background:#d4edda;color:#155724;padding:10px;margin-bottom:20px;border-radius:4px;">
        <?php if($_GET['msg']=='created')echo "Registro criado"; if($_GET['msg']=='updated')echo "Registro atualizado"; if($_GET['msg']=='deleted')echo "Registro excluído"; ?>
    </div>
<?php endif; ?>

<?php if ($view === 'categories'): ?>
    <!-- CATEGORIES VIEW -->
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
                <a href="videos.php?view=categories" class="btn-back-standard" style="margin-left:10px;">Voltar</a>
            </form>
        </div>
    <?php else: ?>
        <a href="videos.php?view=categories&action=add" class="btn-new">+ Nova Categoria</a>
        <table>
            <thead><tr><th>ID</th><th>Nome</th><th>Ordem</th><th>Ações</th></tr></thead>
            <tbody>
                <?php $stmt=$pdo->query("SELECT * FROM video_categorias ORDER BY ordem ASC, nome ASC"); while($row=$stmt->fetch()): ?>
                <tr>
                    <td><?php echo $row['id']; ?></td>
                    <td><?php echo htmlspecialchars($row['nome']); ?></td>
                    <td><?php echo (int)$row['ordem']; ?></td>
                    <td class="actions">
                        <a href="videos.php?view=categories&action=edit&id=<?php echo $row['id']; ?>" class="btn-edit">Editar</a>
                        <a href="videos.php?view=categories&action=delete&id=<?php echo $row['id']; ?>" class="btn-delete" onclick="return confirm('Tem certeza?')">Excluir</a>
                    </td>
                </tr>
                <?php endwhile; ?>
            </tbody>
        </table>
    <?php endif; ?>

<?php else: ?>
    <!-- VIDEOS VIEW -->
    <?php if ($action === 'add' || $action === 'edit'): ?>
        <?php
        $data = ['youtube_url'=>'', 'video_id'=>'', 'titulo'=>'', 'canal'=>'', 'inscritos'=>null, 'visualizacoes'=>null, 'categoria_id'=>null];
        if ($action === 'edit' && isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM videos WHERE id=?");
            $stmt->execute([(int)$_GET['id']]);
            $data = $stmt->fetch();
        }
        ?>
        <div class="form-container">
            <h3><?php echo $action==='add'?'Novo Vídeo':'Editar Vídeo'; ?></h3>
            <form method="POST">
                <?php if($action==='edit'): ?><input type="hidden" name="id" value="<?php echo $data['id']; ?>"><?php endif; ?>
                <div class="form-group">
                    <label>Link do YouTube</label>
                    <input type="url" name="youtube_url" class="form-control" value="<?php echo htmlspecialchars($data['youtube_url']); ?>" required placeholder="https://www.youtube.com/watch?v=...">
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
                    <select name="categoria_id" class="form-control">
                        <option value="">Sem categoria</option>
                        <?php $cats=$pdo->query("SELECT * FROM video_categorias ORDER BY ordem ASC, nome ASC"); while($c=$cats->fetch()): ?>
                            <option value="<?php echo $c['id']; ?>" <?php echo ($data['categoria_id']==$c['id'])?'selected':''; ?>><?php echo htmlspecialchars($c['nome']); ?></option>
                        <?php endwhile; ?>
                    </select>
                </div>
                <button type="submit" class="btn-new">Salvar</button>
                <a href="videos.php" class="btn-back-standard" style="margin-left:10px;">Voltar</a>
            </form>
            <?php if (!empty($data['video_id'])): ?>
                <div style="margin-top:12px;">
                    <iframe width="100%" height="315" src="https://www.youtube.com/embed/<?php echo htmlspecialchars($data['video_id']); ?>" frameborder="0" allowfullscreen></iframe>
                </div>
            <?php endif; ?>
        </div>
    <?php else: ?>
        <a href="videos.php?action=add" class="btn-new">+ Novo Vídeo</a>
        <table>
            <thead><tr><th>ID</th><th>Título</th><th>Público</th><th>Canal</th><th>Ações</th></tr></thead>
            <tbody>
                <?php $stmt=$pdo->query("SELECT * FROM videos ORDER BY id DESC"); while($row=$stmt->fetch()): ?>
                <tr>
                    <td><?php echo $row['id']; ?></td>
                    <td><?php echo htmlspecialchars($row['titulo']); ?></td>
                    <td><?php echo htmlspecialchars($row['publico_alvo']??'Desbravador'); ?></td>
                    <td><?php echo htmlspecialchars($row['canal']); ?></td>
                    <td class="actions">
                        <a href="videos.php?action=edit&id=<?php echo $row['id']; ?>" class="btn-edit">Editar</a>
                        <a href="videos.php?action=delete&id=<?php echo $row['id']; ?>" class="btn-delete" onclick="return confirm('Tem certeza?')">Excluir</a>
                    </td>
                </tr>
                <?php endwhile; ?>
            </tbody>
        </table>
    <?php endif; ?>
<?php endif; ?>

<?php require_once '../includes/admin_footer.php'; ?>
