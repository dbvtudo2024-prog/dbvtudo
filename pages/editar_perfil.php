<?php
// Verificar se está logado
if (!isset($_SESSION['user_id'])) {
    echo '<div style="text-align:center; padding:50px;">
        <h2>Você precisa estar logado para editar seu perfil.</h2>
        <a href="login.php" class="btn" style="background:#004d40; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Fazer Login</a>
    </div>';
    return;
}

$user_id = $_SESSION['user_id'];
$msg = '';

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
            // Redirecionar para o perfil
            echo "<script>window.location.href='index.php?p=perfil';</script>";
            exit;
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
        margin-bottom: 20px;
    }
    .profile-title {
        font-size: 18px;
        font-weight: bold;
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
</style>

<div class="profile-header">
    <div class="profile-nav">
        <a href="index.php?p=perfil" class="btn-back-standard">Voltar</a>
        <div class="profile-title">Editar Perfil</div>
        <div style="width: 50px;"></div> <!-- Spacer -->
    </div>
    <div class="profile-avatar-container">
        <img src="<?php echo htmlspecialchars($foto); ?>" alt="Foto de Perfil" class="profile-avatar">
    </div>
</div>

<div class="profile-info">
    <?php echo $msg; ?>
    
    <div class="edit-form-container">
        <form method="POST" action="index.php?p=editar_perfil" enctype="multipart/form-data" class="edit-form">
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
