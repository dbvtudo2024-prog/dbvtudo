<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/conexao.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autenticado']);
    exit;
}

$user_id = (int)$_SESSION['user_id'];
$id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
$status = isset($_POST['status']) ? trim($_POST['status']) : '';

if ($id <= 0 || ($status !== '0' && $status !== '1')) {
    echo json_encode(['success' => false, 'message' => 'Parâmetros inválidos']);
    exit;
}

try {
    if ($status === '1') {
        $stmt = $pdo->prepare("INSERT INTO usuarios_especialidades (user_id, especialidade_id) VALUES (?, ?)");
        $stmt->execute([$user_id, $id]);
    } else {
        $stmt = $pdo->prepare("DELETE FROM usuarios_especialidades WHERE user_id = ? AND especialidade_id = ?");
        $stmt->execute([$user_id, $id]);
    }
    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    echo json_encode(['success' => false, 'message' => 'Falha ao atualizar']);
}
?>
