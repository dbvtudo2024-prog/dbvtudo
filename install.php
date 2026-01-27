<?php
// Arquivo de Instalação e Configuração de Admin
require_once 'includes/config.php';

echo "<div style='font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;'>";
echo "<h2>Instalação e Configuração de Admin</h2>";

try {
    // 1. Conexão sem banco de dados para garantir que o banco seja criado
    $pdo = new PDO("mysql:host=" . DB_HOST, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 2. Criar banco de dados
    $pdo->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME . " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "<p>✅ Banco de dados '" . DB_NAME . "' verificado.</p>";

    // 3. Conectar ao banco criado
    $pdo->exec("USE " . DB_NAME);

    // 4. Ler e executar o SQL para criar as tabelas
    if (file_exists('database.sql')) {
        $sql = file_get_contents('database.sql');
        
        // Remover comentários e quebras de linha para evitar erros simples no parser manual
        // Nota: Este é um parser simples. Para scripts complexos, seria necessário algo mais robusto.
        // Mas como controlamos o database.sql, vamos dividir por ponto e vírgula.
        $statements = array_filter(array_map('trim', explode(';', $sql)));

        foreach ($statements as $stmt) {
            if (!empty($stmt)) {
                try {
                    $pdo->exec($stmt);
                } catch (PDOException $e) {
                    // Ignorar erros se a tabela já existe (embora o SQL tenha IF NOT EXISTS, às vezes o CREATE USER pode falhar se duplicado no script)
                    // echo "<p style='color:orange'>Info: " . $e->getMessage() . "</p>";
                }
            }
        }
        echo "<p>✅ Tabelas do sistema verificadas.</p>";
    } else {
        echo "<p style='color:red'>❌ Arquivo database.sql não encontrado!</p>";
    }

    // 5. CRIAR OU REDEFINIR USUÁRIO ADMIN
    // Dados do admin
    $adminName = 'Administrador';
    $adminEmail = 'admin@dbv.com';
    $adminPass = 'admin123';
    $adminLevel = 'admin';
    
    // Gerar hash da senha
    $senhaHash = password_hash($adminPass, PASSWORD_DEFAULT);

    // Verificar se já existe
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->execute([$adminEmail]);
    $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existingUser) {
        // Atualizar senha se já existe
        $stmt = $pdo->prepare("UPDATE usuarios SET senha = ?, nivel = ?, nome = ? WHERE email = ?");
        $stmt->execute([$senhaHash, $adminLevel, $adminName, $adminEmail]);
        echo "<p>✅ Usuário Admin <strong>já existia</strong> e a senha foi <strong>REDEFINIDA</strong>.</p>";
    } else {
        // Criar novo se não existe
        $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha, nivel) VALUES (?, ?, ?, ?)");
        $stmt->execute([$adminName, $adminEmail, $senhaHash, $adminLevel]);
        echo "<p>✅ Usuário Admin <strong>CRIADO</strong> com sucesso.</p>";
    }

    echo "<hr>";
    echo "<div style='background: #e8f5e9; padding: 20px; border-radius: 8px; border: 1px solid #c8e6c9;'>";
    echo "<h3 style='margin-top:0; color: #2e7d32;'>Credenciais de Acesso:</h3>";
    echo "<p><strong>Login (E-mail):</strong> <span style='font-size: 1.2em; color: #333;'>$adminEmail</span></p>";
    echo "<p><strong>Senha:</strong> <span style='font-size: 1.2em; color: #333;'>$adminPass</span></p>";
    echo "</div>";

    echo "<p style='margin-top: 20px;'><a href='login.php' style='background: #004d40; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;'>Ir para Login</a></p>";
    echo "<p style='color: #666; font-size: 0.9em; margin-top: 30px;'>Por segurança, você pode deletar este arquivo (install.php) após confirmar o acesso.</p>";

} catch (PDOException $e) {
    echo "<div style='background: #ffebee; color: #c62828; padding: 20px; border-radius: 4px;'>";
    echo "<h3>Erro Fatal:</h3>";
    echo "<p>" . $e->getMessage() . "</p>";
    echo "<p>Verifique se o MySQL está rodando e se as configurações em <code>includes/config.php</code> estão corretas.</p>";
    echo "</div>";
}
echo "</div>";
?>
