<?php
require_once 'includes/config.php';
require_once 'includes/conexao.php';

// Garantir que as colunas existam na tabela usuarios
try {
    $columnsToCheck = ['clube', 'cargo', 'telefone', 'foto_perfil'];
    $existingColumns = [];
    $stmt = $pdo->query("DESCRIBE usuarios");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $existingColumns[] = $row['Field'];
    }

    $alterations = [];
    if (!in_array('clube', $existingColumns)) $alterations[] = "ADD COLUMN clube VARCHAR(150)";
    if (!in_array('cargo', $existingColumns)) $alterations[] = "ADD COLUMN cargo VARCHAR(100)";
    if (!in_array('telefone', $existingColumns)) $alterations[] = "ADD COLUMN telefone VARCHAR(20)";
    if (!in_array('foto_perfil', $existingColumns)) $alterations[] = "ADD COLUMN foto_perfil VARCHAR(255)";

    if (!empty($alterations)) {
        $pdo->exec("ALTER TABLE usuarios " . implode(", ", $alterations));
    }
} catch (PDOException $e) {
    // Ignorar erro se não conseguir alterar (pode ser permissão ou outro problema)
    error_log("Erro ao atualizar tabela usuarios: " . $e->getMessage());
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome = filter_input(INPUT_POST, 'nome', FILTER_SANITIZE_SPECIAL_CHARS);
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $senha = $_POST['senha'];
    $clube = filter_input(INPUT_POST, 'clube', FILTER_SANITIZE_SPECIAL_CHARS);
    $cargo = filter_input(INPUT_POST, 'cargo', FILTER_SANITIZE_SPECIAL_CHARS);
    $telefone = filter_input(INPUT_POST, 'telefone', FILTER_SANITIZE_SPECIAL_CHARS);

    if ($nome && $email && $senha) {
        // Verificar se email já existe
        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = :email");
        $stmt->execute([':email' => $email]);
        if ($stmt->fetch()) {
            $error = "Este e-mail já está cadastrado.";
        } else {
            $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
            $nivel = 'usuario'; // Padrão

            $sql = "INSERT INTO usuarios (nome, email, senha, nivel, clube, cargo, telefone) VALUES (:nome, :email, :senha, :nivel, :clube, :cargo, :telefone)";
            $stmt = $pdo->prepare($sql);
            
            try {
                $stmt->execute([
                    ':nome' => $nome,
                    ':email' => $email,
                    ':senha' => $senhaHash,
                    ':nivel' => $nivel,
                    ':clube' => $clube,
                    ':cargo' => $cargo,
                    ':telefone' => $telefone
                ]);
                $success = "Cadastro realizado com sucesso! <a href='login.php'>Clique aqui para entrar</a>.";
            } catch (PDOException $e) {
                $error = "Erro ao cadastrar: " . $e->getMessage();
            }
        }
    } else {
        $error = "Preencha os campos obrigatórios (Nome, E-mail, Senha).";
    }
}

$page_title = "Cadastro";
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cadastro - <?php echo SITE_NAME; ?></title>
    <link rel="stylesheet" href="assets/css/style.css">
    <style>
        .register-container {
            max-width: 500px;
            margin: 30px auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: #fff;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input { width: 100%; padding: 8px; box-sizing: border-box; }
        .btn { width: 100%; padding: 10px; background: #004d40; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .btn:hover { background: #00332a; }
        .error { color: red; margin-bottom: 15px; text-align: center; }
        .success { color: green; margin-bottom: 15px; text-align: center; }
        .back-link { display: block; text-align: center; margin-top: 10px; text-decoration: none; color: #666; }
        
        /* Fix for Chrome autofill background */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px white inset !important;
            -webkit-text-fill-color: black !important;
        }
    </style>
</head>
<body>
    <div class="register-container">
        <h2 style="text-align: center;">Criar Nova Conta</h2>
        <?php if ($error): ?>
            <div class="error"><?php echo $error; ?></div>
        <?php endif; ?>
        <?php if ($success): ?>
            <div class="success"><?php echo $success; ?></div>
        <?php else: ?>
            <form method="POST" action="register.php">
                <div class="form-group">
                    <label for="nome">Nome Completo *</label>
                    <input type="text" id="nome" name="nome" required value="<?php echo isset($_POST['nome']) ? htmlspecialchars($_POST['nome']) : ''; ?>">
                </div>
                <div class="form-group">
                    <label for="email">E-mail *</label>
                    <input type="email" id="email" name="email" required value="<?php echo isset($_POST['email']) ? htmlspecialchars($_POST['email']) : ''; ?>">
                </div>
                <div class="form-group">
                    <label for="senha">Senha *</label>
                    <input type="password" id="senha" name="senha" required>
                </div>
                <div class="form-group">
                <label>Tipo de Clube</label>
                <div style="display: flex; gap: 20px;">
                    <label style="font-weight: normal;">
                        <input type="radio" name="tipo" value="Desbravador" checked style="width: auto;"> Desbravador
                    </label>
                    <label style="font-weight: normal;">
                        <input type="radio" name="tipo" value="Aventureiro" style="width: auto;"> Aventureiro
                    </label>
                </div>
            </div>

            <div class="form-group">
                <label for="clube">Clube</label>
                    <input type="text" id="clube" name="clube" placeholder="Ex: Sentinelas da Verdade" value="<?php echo isset($_POST['clube']) ? htmlspecialchars($_POST['clube']) : ''; ?>">
                </div>
                <div class="form-group">
                    <label for="cargo">Cargo/Função</label>
                    <select id="cargo" name="cargo" class="form-control" style="width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="">Selecione um cargo</option>
                        <option value="Diretor (a)">Diretor (a)</option>
                        <option value="Diretor (a) Associado (a)">Diretor (a) Associado (a)</option>
                        <option value="Secretário (a)">Secretário (a)</option>
                        <option value="Tesoureiro (a)">Tesoureiro (a)</option>
                        <option value="Capelão (ã)">Capelão (ã)</option>
                        <option value="Conselheiro (a)">Conselheiro (a)</option>
                        <option value="Instrutor (a)">Instrutor (a)</option>
                        <option value="Conselheiro (a) Associado (a)">Conselheiro (a) Associado (a)</option>
                        <option value="Capitão (ã)">Capitão (ã)</option>
                        <option value="Desbravador (a)">Desbravador (a)</option>
                        <option value="Aspirante">Aspirante</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="telefone">Telefone/Whatsapp</label>
                    <input type="text" id="telefone" name="telefone" placeholder="(00) 00000-0000" value="<?php echo isset($_POST['telefone']) ? htmlspecialchars($_POST['telefone']) : ''; ?>">
                </div>
                <button type="submit" class="btn">Cadastrar</button>
            </form>
        <?php endif; ?>
        <a href="login.php" class="back-link">Já tem uma conta? Faça login</a>
    </div>
</body>
</html>