<?php
// Verificar se está logado
if (!isset($_SESSION['user_id'])) {
    echo '<div style="text-align:center; padding:50px;">
        <h2>Você precisa estar logado para ver seu perfil.</h2>
        <a href="login.php" class="btn" style="background:#004d40; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Fazer Login</a>
    </div>';
    return;
}

$user_id = $_SESSION['user_id'];
$msg = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'toggle_icon') {
    // Limpar output buffer para garantir JSON limpo (remove headers HTML do index.php)
    while (ob_get_level()) { ob_end_clean(); }
    header('Content-Type: application/json');
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS usuarios_icones (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, icon_key VARCHAR(50) NOT NULL, active TINYINT(1) DEFAULT 0, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uniq_user_icon (user_id, icon_key))");
        $key = isset($_POST['key']) ? substr($_POST['key'], 0, 50) : '';
        if ($key === '') { echo json_encode(['success'=>false]); exit; }
        $stmt = $pdo->prepare("SELECT active FROM usuarios_icones WHERE user_id=? AND icon_key=?");
        $stmt->execute([$user_id, $key]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $new = ((int)$row['active'] === 1) ? 0 : 1;
            $upd = $pdo->prepare("UPDATE usuarios_icones SET active=? WHERE user_id=? AND icon_key=?");
            $upd->execute([$new, $user_id, $key]);
        } else {
            $new = 1;
            $ins = $pdo->prepare("INSERT INTO usuarios_icones (user_id, icon_key, active) VALUES (?,?,?)");
            $ins->execute([$user_id, $key, $new]);
        }
        echo json_encode(['success'=>true,'active'=>$new]);
    } catch (Throwable $e) {
        echo json_encode(['success'=>false]);
    }
    exit;
}

// Processar formulário de atualização
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_profile') {
    $nome = filter_input(INPUT_POST, 'nome', FILTER_SANITIZE_SPECIAL_CHARS);
    $clube = filter_input(INPUT_POST, 'clube', FILTER_SANITIZE_SPECIAL_CHARS);
    $cargo = filter_input(INPUT_POST, 'cargo', FILTER_SANITIZE_SPECIAL_CHARS);
    $telefone = filter_input(INPUT_POST, 'telefone', FILTER_SANITIZE_SPECIAL_CHARS);
    $tipo = filter_input(INPUT_POST, 'tipo', FILTER_SANITIZE_SPECIAL_CHARS);
    
    // Upload de Foto
    $foto_sql = "";
    $params = [
        ':nome' => $nome,
        ':clube' => $clube,
        ':cargo' => $cargo,
        ':telefone' => $telefone,
        ':tipo' => $tipo,
        ':id' => $user_id
    ];

    if (isset($_FILES['foto_perfil']) && $_FILES['foto_perfil']['error'] === 0) {
        $ext = pathinfo($_FILES['foto_perfil']['name'], PATHINFO_EXTENSION);
        $new_name = uniqid() . '.' . $ext;
        $upload_dir = 'uploads/';
        if (!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);
        
        if (move_uploaded_file($_FILES['foto_perfil']['tmp_name'], $upload_dir . $new_name)) {
            $foto_sql = ", foto_perfil = :foto";
            $params[':foto'] = $new_name;
        }
    }

    $sql = "UPDATE usuarios SET nome = :nome, clube = :clube, cargo = :cargo, telefone = :telefone, tipo = :tipo $foto_sql WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    
    try {
        if ($stmt->execute($params)) {
            $msg = '<div style="color:green; text-align:center; margin-bottom:10px;">Perfil atualizado com sucesso!</div>';
            // Atualizar sessão se nome mudou
            $_SESSION['user_name'] = $nome;
        } else {
            $msg = '<div style="color:red; text-align:center; margin-bottom:10px;">Erro ao atualizar perfil.</div>';
        }
    } catch (PDOException $e) {
        $msg = '<div style="color:red; text-align:center; margin-bottom:10px;">Erro: ' . $e->getMessage() . '</div>';
    }
}

// Buscar dados do usuário
$stmt = $pdo->prepare("SELECT * FROM usuarios WHERE id = :id");
$stmt->execute([':id' => $user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS usuarios_icones (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, icon_key VARCHAR(50) NOT NULL, active TINYINT(1) DEFAULT 0, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uniq_user_icon (user_id, icon_key))");
    $st = $pdo->prepare("SELECT icon_key, active FROM usuarios_icones WHERE user_id=?");
    $st->execute([$user_id]);
    $iconStates = [];
    foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) { $iconStates[$r['icon_key']] = (int)$r['active']; }
} catch (Throwable $e) { $iconStates = []; }

// Buscar especialidades do usuário
$stmt = $pdo->prepare("
    SELECT e.* 
    FROM especialidades e 
    JOIN usuarios_especialidades ue ON e.id = ue.especialidade_id 
    WHERE ue.user_id = :uid 
    ORDER BY ue.data_conquista DESC
");
$stmt->execute([':uid' => $user_id]);
$minhas_especialidades = $stmt->fetchAll(PDO::FETCH_ASSOC);
// Inicializar como array vazio se for false
if (!$minhas_especialidades) {
    $minhas_especialidades = [];
}

$foto = !empty($user['foto_perfil']) ? 'uploads/' . $user['foto_perfil'] : 'assets/img/icon_perfil.png'; // Fallback image
if (!file_exists($foto) && !empty($user['foto_perfil'])) $foto = 'assets/img/icon_perfil.png'; // Validate existence

?>

<style>
    .profile-header {
        background-color: #d32f2f; /* Vermelho do topo */
        color: white;
        padding: 15px;
        position: relative;
        border-radius: 0 0 20px 20px; /* Curva suave embaixo se quiser */
        margin-bottom: 60px; /* Espaço para a foto sobreposta */
    }
    .profile-nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px; /* Aumentado de 20px */
        position: relative;
        padding: 0 10px; /* Adicionado padding lateral */
    }
    .profile-title {
        font-size: 18px;
        font-weight: bold;
        /* Remover position absolute se houver */
    }
    .profile-avatar-container {
        position: absolute;
        bottom: -50px;
        left: 50%;
        transform: translateX(-50%);
        width: 100px;
        height: 100px;
        border-radius: 50%;
        border: 4px solid white;
        background: white;
        overflow: hidden;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    .profile-avatar {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .profile-logout {
        /* position: absolute removido para fluir no flexbox */
        background: #1a237e; /* Azul escuro */
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        text-decoration: none;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid rgba(255,255,255,0.3);
    }
    .profile-info {
        text-align: center;
        padding: 0 20px;
    }
    .profile-name {
        color: #d32f2f;
        font-size: 22px;
        font-weight: bold;
        margin: 5px 0;
    }
    .profile-email {
        color: #666;
        font-size: 14px;
        margin-bottom: 20px;
    }
    .profile-details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        max-width: 500px;
        margin: 0 auto 30px;
        text-align: center;
    }
    .detail-item label {
        display: block;
        font-size: 12px;
        color: #888;
        margin-bottom: 2px;
    }
    .detail-item span {
        display: block;
        font-size: 14px;
        color: #333;
        font-weight: 500;
    }
    
    /* Edit Form Styles */
    .edit-form {
        max-width: 500px;
        margin: 0 auto;
        background: #f9f9f9;
        padding: 20px;
        border-radius: 10px;
        border: 1px solid #eee;
    }
    .form-group {
        margin-bottom: 15px;
        text-align: left;
    }
    .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
        color: #555;
    }
    .form-control {
        width: 100%;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
        box-sizing: border-box;
    }
    .btn-save {
        width: 100%;
        padding: 12px;
        background: #d32f2f;
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        cursor: pointer;
    }
    .btn-save:hover {
        background: #b71c1c;
    }
    .file-input-wrapper {
        margin-top: 10px;
        text-align: center;
    }
    .badge-layout { max-width: 720px; margin: 10px auto 20px; display: grid; gap: 10px; }
    .badge-row { display: grid; gap: 10px; }
    .badge-row--3 { grid-template-columns: repeat(3, 1fr); }
    .badge-row--6 { grid-template-columns: repeat(6, 1fr); }
    .badge-item { cursor:pointer; display:flex; align-items:center; justify-content:center; background:#f5f5f5; border:none; border-radius:10px; overflow:hidden; transition:transform .15s ease; }
    .badge-item img { width:100%; height:100%; object-fit:contain; display:block; }
    .badge-item.circle { width:38px; height:38px; border-radius:50%; border:none; background:#eee; margin:auto; }
    .badge-item.circle.leader, .badge-item.circle.baptism { width:48px; height:48px; border-radius:12px; padding:6px; }
    .badge-item.rect { height:34px; }
    .badge-item.rect-large { height:42px; grid-column: 1 / -1; }
    .badge-item.flag { height:60px; grid-column: 1 / -1; }
    .badge-item:active { transform:scale(0.98); }

    /* Fix for Chrome autofill background */
    input:-webkit-autofill,
    input:-webkit-autofill:hover, 
    input:-webkit-autofill:focus, 
    input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px white inset !important;
        -webkit-text-fill-color: black !important;
    }

    /* Modal Styles */
    .modal-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 99999 !important;
        padding: 20px;
        box-sizing: border-box;
    }
    .modal-content {
        background: #ffffff;
        border-radius: 10px;
        max-width: min(560px, 94vw);
        width: 100%;
        padding: 20px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        max-height: 90vh;
        overflow-y: auto;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #eee;
        padding-bottom: 15px;
        margin-bottom: 20px;
    }
    
    .modal-title {
        margin: 0;
        color: #d32f2f;
        font-size: 20px;
        font-weight: bold;
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 28px;
        color: #999;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        transition: color 0.2s;
    }
    
    .modal-close:hover {
        color: #d32f2f;
    }

    /* Override form styles for modal usage */
    .modal-content .edit-form {
        background: transparent;
        padding: 0;
        border: none;
        box-shadow: none;
    }
    @media (max-width: 768px){
        .profile-details-grid{grid-template-columns:repeat(2, 1fr)}
        .profile-title{font-size:16px}
        .profile-logout{padding:6px 10px;font-size:11px}
        .badge-row--6{display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:8px}
        .badge-row--6 .badge-item{flex:0 0 auto}
    }
</style>

<div class="profile-header">
    <div class="profile-nav">
        <a href="index.php" class="btn-back-standard">Voltar</a>
        <div class="profile-title">Meu Perfil</div>
        <a href="logout.php" class="profile-logout">
            <span style="font-size: 16px;">⏻</span> Sair
        </a>
    </div>
    <div class="profile-avatar-container">
        <img src="<?php echo htmlspecialchars($foto); ?>" alt="Foto de Perfil" class="profile-avatar">
    </div>
</div>

<div class="profile-info">
    <?php echo $msg; ?>
    <h2 class="profile-name"><?php echo htmlspecialchars($user['nome']); ?></h2>
    <p class="profile-email"><?php echo htmlspecialchars($user['email']); ?></p>

    <div class="profile-details-grid">
        <div class="detail-item">
            <label>Tipo</label>
            <span><?php echo htmlspecialchars($user['tipo'] ?? 'Desbravador'); ?></span>
        </div>
        <div class="detail-item">
            <label>Clube</label>
            <span><?php echo htmlspecialchars($user['clube'] ?? 'Não informado'); ?></span>
        </div>
        <div class="detail-item">
            <label>Cargo/Função</label>
            <span><?php echo htmlspecialchars($user['cargo'] ?? 'Não informado'); ?></span>
        </div>
        <div class="detail-item">
            <label>Telefone</label>
            <span><?php echo htmlspecialchars($user['telefone'] ?? 'Não informado'); ?></span>
        </div>
    </div>

    <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;">

    <div style="display:flex; gap:10px; margin-bottom: 20px;">
        <button onclick="toggleEdit()" class="btn-save" style="flex:1;">Editar Perfil</button>
        <a href="index.php?p=minha_faixa" class="btn-save" style="flex:1; background-color: #2e7d32; text-decoration:none; text-align:center; display:flex; align-items:center; justify-content:center;">Minha Faixa</a>
    </div>

    <div>
        <h3 style="color:#d32f2f; border-bottom:2px solid #eee; padding-bottom:10px; margin-bottom:12px;">Conquistas</h3>
        <?php
            $basePath = BASE_URL . '/assets/img/badges/';
            $excelencia = 'excelencia';
            $linha_avancada1 = ['amigo_avancado','companheiro_avancado','pesquisador_avancado'];
            $linha_avancada2 = ['pioneiro_avancado','excursionista_avancado','guia_avancado'];
            $linha_lideres = ['lider','lider_master','lider_master_avancado'];
            $linha_basicas = ['amigo','companheiro','pesquisador','pioneiro','excursionista','guia'];
            $bandeira = 'bandeira_brasil';
            $batismo = 'pin_batismo';
            function badgeSrc($name, $active, $basePath) {
                $file = $name . ($active ? '_cor' : '') . '.png';
                return $basePath . $file;
            }
        ?>
        <div class="badge-layout">
            <div class="badge-row">
                <?php $on = !empty($iconStates[$excelencia]); ?>
                <div class="badge-item rect-large<?php echo $on ? ' active' : ''; ?>" data-key="<?php echo $excelencia; ?>">
                    <img src="<?php echo htmlspecialchars(badgeSrc($excelencia, $on, $basePath)); ?>" alt="Excelência" onerror="this.style.display='none'">
                </div>
            </div>
            <div class="badge-row badge-row--3">
                <?php foreach ($linha_avancada1 as $k): $on = !empty($iconStates[$k]); ?>
                    <div class="badge-item rect<?php echo $on ? ' active' : ''; ?>" data-key="<?php echo $k; ?>">
                        <img src="<?php echo htmlspecialchars(badgeSrc($k, $on, $basePath)); ?>" alt="<?php echo htmlspecialchars($k); ?>" onerror="this.style.display='none'">
                    </div>
                <?php endforeach; ?>
            </div>
            <div class="badge-row badge-row--3">
                <?php foreach ($linha_avancada2 as $k): $on = !empty($iconStates[$k]); ?>
                    <div class="badge-item rect<?php echo $on ? ' active' : ''; ?>" data-key="<?php echo $k; ?>">
                        <img src="<?php echo htmlspecialchars(badgeSrc($k, $on, $basePath)); ?>" alt="<?php echo htmlspecialchars($k); ?>" onerror="this.style.display='none'">
                    </div>
                <?php endforeach; ?>
            </div>
            <div class="badge-row badge-row--3">
                <?php foreach ($linha_lideres as $k): $on = !empty($iconStates[$k]); ?>
                    <div class="badge-item circle leader<?php echo $on ? ' active' : ''; ?>" data-key="<?php echo $k; ?>">
                        <img src="<?php echo htmlspecialchars(badgeSrc($k, $on, $basePath)); ?>" alt="<?php echo htmlspecialchars($k); ?>" onerror="this.style.display='none'">
                    </div>
                <?php endforeach; ?>
            </div>
            <div class="badge-row badge-row--6">
                <?php foreach ($linha_basicas as $k): $on = !empty($iconStates[$k]); ?>
                    <div class="badge-item circle<?php echo $on ? ' active' : ''; ?>" data-key="<?php echo $k; ?>">
                        <img src="<?php echo htmlspecialchars(badgeSrc($k, $on, $basePath)); ?>" alt="<?php echo htmlspecialchars($k); ?>" onerror="this.style.display='none'">
                    </div>
                <?php endforeach; ?>
            </div>
            <div class="badge-row">
                <?php $on = !empty($iconStates[$bandeira]); ?>
                <div class="badge-item flag<?php echo $on ? ' active' : ''; ?>" data-key="<?php echo $bandeira; ?>">
                    <img src="<?php echo htmlspecialchars(badgeSrc($bandeira, $on, $basePath)); ?>" alt="Bandeira do Brasil" onerror="this.style.display='none'">
                </div>
            </div>
            <div class="badge-row">
                <?php $on = !empty($iconStates[$batismo]); ?>
                <div class="badge-item circle baptism<?php echo $on ? ' active' : ''; ?>" data-key="<?php echo $batismo; ?>">
                    <img src="<?php echo htmlspecialchars(badgeSrc($batismo, $on, $basePath)); ?>" alt="Pin de Batismo" onerror="this.style.display='none'">
                </div>
            </div>
        </div>
    </div>



    <div class="minha-faixa-section" style="margin-bottom: 30px;">
        <h3 style="color: #d32f2f; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">Minha Faixa (<?php echo count($minhas_especialidades); ?>)</h3>
        <?php if (count($minhas_especialidades) > 0): ?>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                <?php foreach ($minhas_especialidades as $esp): ?>
                    <div style="text-align: center; border: 1px solid #eee; padding: 12px; border-radius: 10px; background:white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <?php
                            $imgSrc = '';
                            if (!empty($esp['imagem'])) {
                                $img = $esp['imagem'];
                                if (strpos($img, 'http://') === 0 || strpos($img, 'https://') === 0) {
                                    $imgSrc = $img;
                                } else {
                                    $imgSrc = 'uploads/' . $img;
                                }
                            }
                        ?>
                        <?php if ($imgSrc): ?>
                            <img src="<?php echo htmlspecialchars($imgSrc); ?>" style="width: 60px; height: 60px; object-fit: contain; display:block; margin:0 auto;">
                        <?php else: ?>
                            <div style="width: 60px; height: 60px; background: #eee; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 11px;">Sem img</div>
                        <?php endif; ?>
                        <div style="margin-top:6px; font-size:12px; color:#333; line-height:1.3; white-space:normal;"><?php echo htmlspecialchars($esp['nome']); ?></div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php else: ?>
            <p style="color: #666; font-style: italic; text-align: center;">Nenhuma especialidade conquistada ainda.</p>
        <?php endif; ?>
    </div>
</div>

<div id="edit-modal" class="modal-overlay" style="z-index: 99999;">
    <div class="modal-content">
        <div class="modal-header">
            <h3 class="modal-title">Editar Perfil</h3>
            <button onclick="toggleEdit()" class="modal-close">&times;</button>
        </div>
        <form method="POST" action="index.php?p=perfil" enctype="multipart/form-data" class="edit-form">
            <input type="hidden" name="action" value="update_profile">
            
            <div class="form-group">
                <label for="foto_perfil">Alterar Foto</label>
                <input type="file" id="foto_perfil" name="foto_perfil" accept="image/*" class="form-control">
            </div>

            <div class="form-group">
                <label for="nome">Nome Completo</label>
                <input type="text" id="nome" name="nome" value="<?php echo htmlspecialchars($user['nome']); ?>" class="form-control" required>
            </div>

            <div class="form-group">
                <label>Tipo de Clube</label>
                <div style="display: flex; gap: 20px;">
                    <label style="font-weight: normal; color: #333;">
                        <input type="radio" name="tipo" value="Desbravador" <?php echo ($user['tipo'] ?? 'Desbravador') === 'Desbravador' ? 'checked' : ''; ?> style="width: auto;"> Desbravador
                    </label>
                    <label style="font-weight: normal; color: #333;">
                        <input type="radio" name="tipo" value="Aventureiro" <?php echo ($user['tipo'] ?? '') === 'Aventureiro' ? 'checked' : ''; ?> style="width: auto;"> Aventureiro
                    </label>
                </div>
            </div>

            <div class="form-group">
                <label for="clube">Clube</label>
                <input type="text" id="clube" name="clube" value="<?php echo htmlspecialchars($user['clube'] ?? ''); ?>" class="form-control" placeholder="Nome do seu clube">
            </div>

            <div class="form-group">
                <label for="cargo">Cargo/Função</label>
                <select id="cargo" name="cargo" class="form-control">
                    <option value="">Selecione um cargo</option>
                    <?php
                    $cargos = [
                        "Diretor (a)",
                        "Diretor (a) Associado (a)",
                        "Secretário (a)",
                        "Tesoureiro (a)",
                        "Capelão (ã)",
                        "Conselheiro (a)",
                        "Instrutor (a)",
                        "Conselheiro (a) Associado (a)",
                        "Capitão (ã)",
                        "Desbravador (a)",
                        "Aspirante"
                    ];
                    foreach ($cargos as $c) {
                        $selected = ($user['cargo'] === $c) ? 'selected' : '';
                        echo "<option value=\"$c\" $selected>$c</option>";
                    }
                    ?>
                </select>
            </div>

            <div class="form-group">
                <label for="telefone">Telefone/Whatsapp</label>
                <input type="text" id="telefone" name="telefone" value="<?php echo htmlspecialchars($user['telefone'] ?? ''); ?>" class="form-control" placeholder="(00) 00000-0000">
            </div>

            <div class="form-group">
                <button type="submit" class="btn-save">Salvar Alterações</button>
            </div>
        </form>
    </div>
</div>

<script>
function toggleEdit() {
    var modal = document.getElementById('edit-modal');
    if (modal) {
        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
        } else {
            modal.style.display = 'flex';
        }
    } else {
        console.error('Modal edit-modal not found');
    }
}

// Fechar modal ao clicar fora (usando addEventListener para não sobrescrever outros handlers)
window.addEventListener('click', function(event) {
    var modal = document.getElementById('edit-modal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
});

document.addEventListener('DOMContentLoaded',function(){
    // Mover modal para o body para garantir que o position:fixed funcione corretamente
    var modal = document.getElementById('edit-modal');
    if (modal && document.body) {
        document.body.appendChild(modal);
    }

    // Definir basePath corretamente sem duplicar barras
    var basePath = '<?php echo rtrim(BASE_URL, "/"); ?>/assets/img/badges/';
    
    function srcFor(name, active){ 
        // Construir URL e adicionar timestamp para evitar cache
        return basePath + name + (active ? '_cor' : '') + '.png?t=' + new Date().getTime(); 
    }

    var els=document.querySelectorAll('.badge-item');
    els.forEach(function(el){
        el.addEventListener('click',function(e){
            e.preventDefault(); // Prevenir comportamento padrão
            
            var k=el.getAttribute('data-key');
            var img = el.querySelector('img');
            
            // --- Optimistic UI Update (Atualiza antes de esperar o servidor) ---
            var isActive = el.classList.contains('active');
            var optimisticState = !isActive; // Inverte o estado atual
            
            // Aplica mudança visual imediata
            if (optimisticState) {
                el.classList.add('active');
                if(img) img.src = srcFor(k, true);
            } else {
                el.classList.remove('active');
                if(img) img.src = srcFor(k, false);
            }
            // -----------------------------------------------------------------

            var fd=new URLSearchParams(); 
            fd.append('action','toggle_icon'); 
            fd.append('key',k);

            fetch('index.php?p=perfil',{
                method:'POST',
                headers:{'Content-Type':'application/x-www-form-urlencoded'},
                body:fd.toString()
            })
            .then(function(r){
                if (!r.ok) { throw new Error('Network response was not ok'); }
                return r.text();
            })
            .then(function(text){
                try {
                    return JSON.parse(text);
                } catch(e) {
                    console.error('Invalid JSON:', text);
                    return { success: false };
                }
            })
            .then(function(j){
                if(j && j.success){
                    // Confirma se o estado do servidor bate com o nosso otimista
                    // Se o servidor retornar algo diferente, corrigimos
                    var serverState = (j.active === 1);
                    if (serverState !== optimisticState) {
                         if (serverState) {
                            el.classList.add('active');
                            if(img) img.src = srcFor(k, true);
                        } else {
                            el.classList.remove('active');
                            if(img) img.src = srcFor(k, false);
                        }
                    }
                } else {
                    console.error('Action failed', j);
                    // Reverte em caso de erro lógico
                    if (isActive) { // Era ativo, voltamos a ser ativo
                        el.classList.add('active');
                        if(img) img.src = srcFor(k, true);
                    } else { // Era inativo, voltamos a ser inativo
                        el.classList.remove('active');
                        if(img) img.src = srcFor(k, false);
                    }
                }
            })
            .catch(function(err){
                console.error('Fetch error:', err);
                // Reverte em caso de erro de rede
                if (isActive) {
                    el.classList.add('active');
                    if(img) img.src = srcFor(k, true);
                } else {
                    el.classList.remove('active');
                    if(img) img.src = srcFor(k, false);
                }
            });
        });
    });
});
</script>
