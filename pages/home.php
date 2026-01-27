<?php
$displayName = 'Nome';
$displayType = 'Função';
$foto = BASE_URL . '/assets/img/icon_perfil.png';
$profileLink = 'login.php';
if (isset($_SESSION['user_id'])) {
    $profileLink = 'index.php?p=perfil';
    try {
        $stmt = $pdo->prepare("SELECT nome, cargo, foto_perfil FROM usuarios WHERE id = :id");
        $stmt->execute([':id' => $_SESSION['user_id']]);
        $u = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($u) {
            $displayName = !empty($u['nome']) ? $u['nome'] : $displayName;
            $displayType = !empty($u['cargo']) ? $u['cargo'] : $displayType;
            if (!empty($u['foto_perfil'])) {
                $path = 'uploads/' . $u['foto_perfil'];
                if (file_exists($path)) {
                    $foto = BASE_URL . '/' . $path;
                }
            }
        } else {
            if (isset($_SESSION['user_name'])) {
                $displayName = $_SESSION['user_name'];
            }
        }
    } catch (Exception $e) {
        if (isset($_SESSION['user_name'])) {
            $displayName = $_SESSION['user_name'];
        }
    }
}
if (isset($_SESSION['user_level']) && $_SESSION['user_level'] === 'admin') {
    $displayType = 'Admin';
}
?>
<div class="split">
    <div class="panel">
        <div class="hero-brand">
            <p class="hero-note">Este NÃO é um App Oficial da IASD</p>
            <img src="<?php echo BASE_URL; ?>/assets/img/dbv_logo.png" alt="DBV Tudo" onerror="this.style.display='none'">
            
        </div>
    </div>
    <div class="panel">
        <div class="cta">
            <div class="profile-circle">
                <a href="<?php echo $profileLink; ?>" style="display:block; width:100%; height:100%;">
                    <img src="<?php echo htmlspecialchars($foto); ?>" alt="Foto de Perfil" style="width:100%; height:100%; object-fit:cover;">
                </a>
            </div>
            <div style="text-align:center;">
                <div style="font-size:14px; color:#777;">Bem-vindo(a)</div>
                <div style="font-weight:600;"><?php echo htmlspecialchars($displayType . ' ' . $displayName); ?></div>
            </div>
            <a class="cta-btn cta-btn--desbravadores" href="index.php?p=desbravadores">
                <img src="<?php echo BASE_URL; ?>/assets/img/desbravadores.png" alt="Desbravadores" onerror="this.style.display='none'">
                <span>Desbravadores</span>
            </a>
            <a class="cta-btn cta-btn--aventureiros" href="index.php?p=aventureiros">
                <span>Aventureiros</span>
                <img src="<?php echo BASE_URL; ?>/assets/img/aventureiros.png" alt="Aventureiros" onerror="this.style.display='none'">
            </a>
        </div>
    </div>
</div>
