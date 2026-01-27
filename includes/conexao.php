<?php
require_once 'config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    
    // Configurar PDO para lançar exceções em caso de erro
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Configurar o fetch padrão para objeto anônimo ou array associativo
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    // Garantir colunas necessárias em 'usuarios'
    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = :db AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'tipo'");
        $stmt->execute([':db' => DB_NAME]);
        if ((int)$stmt->fetchColumn() === 0) {
            $pdo->exec("ALTER TABLE usuarios ADD COLUMN tipo VARCHAR(20) DEFAULT 'Desbravador'");
        }
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = :db AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'foto_perfil'");
        $stmt->execute([':db' => DB_NAME]);
        if ((int)$stmt->fetchColumn() === 0) {
            $pdo->exec("ALTER TABLE usuarios ADD COLUMN foto_perfil VARCHAR(255) NULL");
        }
        $stmt = $pdo->prepare("SELECT CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = :db AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'clube'");
        $stmt->execute([':db' => DB_NAME]);
        $len = $stmt->fetchColumn();
        if ($len !== false && (int)$len < 255) {
            $pdo->exec("ALTER TABLE usuarios MODIFY COLUMN clube VARCHAR(255)");
        }
        
        // Garantir tabela usuarios_especialidades
        $pdo->exec("CREATE TABLE IF NOT EXISTS usuarios_especialidades (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            especialidade_id INT NOT NULL,
            data_conquista TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            FOREIGN KEY (especialidade_id) REFERENCES especialidades(id) ON DELETE CASCADE,
            UNIQUE KEY user_especialidade (user_id, especialidade_id)
        )");

        // Atualização para Aventureiros (Adicionar coluna publico_alvo)
        $tables_to_update = ['especialidades', 'classes', 'historia', 'emblemas', 'uniformes', 'ideais', 'livros', 'manuais', 'videos', 'estudos', 'materiais'];
        foreach ($tables_to_update as $tb) {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :tb AND COLUMN_NAME = 'publico_alvo'");
            $stmt->execute([':db' => DB_NAME, ':tb' => $tb]);
            if ((int)$stmt->fetchColumn() === 0) {
                $pdo->exec("ALTER TABLE $tb ADD COLUMN publico_alvo VARCHAR(20) DEFAULT 'Desbravador'");
            }
        }

    } catch (Exception $e) {}
} catch (PDOException $e) {
    die("Erro na conexão com o banco de dados: " . $e->getMessage());
}
?>
