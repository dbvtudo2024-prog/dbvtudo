<?php
// Verificar se a sessão já foi iniciada no config.php, caso contrário inicia
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Verifica se o usuário está logado
if (!isset($_SESSION['user_id'])) {
    // Redireciona para o login
    header("Location: " . BASE_URL . "/login.php");
    exit;
}

// Função para verificar se é admin
function isAdmin() {
    return isset($_SESSION['user_level']) && $_SESSION['user_level'] === 'admin';
}

// Se a página requerer admin, verificar aqui (opcional, pode ser feito página a página)
// Por padrão, este arquivo apenas garante que está logado.
?>
