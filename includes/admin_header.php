<?php
require_once '../includes/auth.php';
// Garantir que é admin
if (!isAdmin()) {
    header("Location: ../index.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel Admin - <?php echo SITE_NAME; ?></title>
    <link rel="stylesheet" href="../assets/css/style.css?v=<?php echo filemtime(__DIR__ . '/../assets/css/style.css'); ?>">
    
    <!-- PWA Configuration -->
    <link rel="manifest" href="<?php echo BASE_URL; ?>/manifest.json">
    <meta name="theme-color" content="#003366">
    <link rel="apple-touch-icon" href="<?php echo BASE_URL; ?>/assets/img/dbv_logo.PNG">
    
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('<?php echo BASE_URL; ?>/sw.js')
            .then(registration => {
              console.log('ServiceWorker registration successful');
            }, err => {
              console.log('ServiceWorker registration failed: ', err);
            });
        });
      }
    </script>
    <style>
      .admin-menu-btn{display:none;background:#003366;color:#fff;border:none;border-radius:8px;padding:8px 12px}
      .dash-card{padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;text-align:center}
      .sidebar{box-shadow:0 8px 24px rgba(0,0,0,.12)}
      body.admin-sidebar-open{overflow:hidden}
      /* Mobile-only styling is activated via body.admin-mobile to avoid affecting desktop */
      body.admin-mobile header .container{display:flex;align-items:center;justify-content:space-between;gap:8px}
      body.admin-mobile .admin-menu-btn{display:inline-block}
      body.admin-mobile .container.admin-container{position:relative;display:block}
      body.admin-mobile .sidebar{position:fixed;top:0;left:0;width:80%;max-width:300px;height:100vh;background:#fff;overflow-y:auto;transform:translateX(-100%);transition:transform .25s ease;z-index:100000}
      body.admin-mobile .sidebar.open{transform:translateX(0)}
      body.admin-mobile .sidebar-overlay{position:fixed;inset:0;background:rgba(0,0,0,.3);opacity:0;pointer-events:none;transition:opacity .2s;z-index:99999}
      body.admin-mobile .sidebar-overlay.active{opacity:1;pointer-events:auto}
      body.admin-mobile .admin-content{padding:12px;margin-left:0}
      body.admin-mobile .sidebar ul{padding:12px}
      body.admin-mobile .sidebar ul li a{display:block;padding:10px 12px;border-radius:8px}
      body.admin-mobile .dash-cards{display:grid;grid-template-columns:repeat(2, minmax(0,1fr));gap:12px}
      body.admin-mobile.admin-narrow .dash-cards{grid-template-columns:repeat(1, minmax(0,1fr))}
      /* Desktop layout safety: ensure sidebar/content grid stable */
      @media (min-width: 769px){
        .container.admin-container{display:grid;grid-template-columns: 260px 1fr;gap:16px}
        .sidebar{position:static;width:260px;height:auto;transform:none !important}
        .admin-content{margin-left:0 !important;padding:16px}
        #sidebarOverlay{display:none !important}
      }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <div class="logo">
                <a href="dashboard.php">
                    <h1><?php echo SITE_NAME; ?> - Admin</h1>
                </a>
            </div>
            <button id="adminMenuBtn" class="admin-menu-btn" type="button">Menu</button>
            <nav>
                <ul>
                    <li>Olá, <?php echo $_SESSION['user_name']; ?></li>
                    <li><a href="../index.php" target="_blank">Ver Site</a></li>
                    <li><a href="../logout.php">Sair</a></li>
                </ul>
            </nav>
        </div>
    </header>
    <div class="container admin-container">
        <div id="sidebarOverlay" class="sidebar-overlay"></div>
        <aside class="sidebar">
            <ul>
                <li><a href="dashboard.php" class="<?php echo ($current_page == 'dashboard') ? 'active' : ''; ?>">Dashboard</a></li>
                <li><a href="especialidades.php" class="<?php echo ($current_page == 'especialidades') ? 'active' : ''; ?>">Especialidades</a></li>
                <li><a href="classes.php" class="<?php echo ($current_page == 'classes') ? 'active' : ''; ?>">Classes</a></li>
                <li><a href="historia.php" class="<?php echo ($current_page == 'historia') ? 'active' : ''; ?>">História</a></li>
                <li><a href="emblemas.php" class="<?php echo ($current_page == 'emblemas') ? 'active' : ''; ?>">Emblemas</a></li>
                <li><a href="uniformes.php" class="<?php echo ($current_page == 'uniformes') ? 'active' : ''; ?>">Uniformes</a></li>
                <li><a href="ideais.php" class="<?php echo ($current_page == 'ideais') ? 'active' : ''; ?>">Ideais e Hinos</a></li>
                <li><a href="livros.php" class="<?php echo ($current_page == 'livros') ? 'active' : ''; ?>">Livros</a></li>
                <li><a href="manuais.php" class="<?php echo ($current_page == 'manuais') ? 'active' : ''; ?>">Manuais</a></li>
                <li><a href="materiais.php" class="<?php echo ($current_page == 'materiais') ? 'active' : ''; ?>">Materiais</a></li>
                <li><a href="videos.php" class="<?php echo ($current_page == 'videos') ? 'active' : ''; ?>">Vídeos</a></li>
                <li><a href="estudos.php" class="<?php echo ($current_page == 'estudos') ? 'active' : ''; ?>">Estudos</a></li>
                <li><a href="desbrava_mais.php" class="<?php echo ($current_page == 'desbrava_mais') ? 'active' : ''; ?>">Desbrava Mais</a></li>
                <li><a href="devocionais.php" class="<?php echo ($current_page == 'devocionais') ? 'active' : ''; ?>">Devocionais</a></li>
                <li><a href="quiz.php" class="<?php echo ($current_page == 'quiz') ? 'active' : ''; ?>">Quiz</a></li>
                <li><a href="biblia.php" class="<?php echo ($current_page == 'biblia') ? 'active' : ''; ?>">Bíblia</a></li>
                <li><a href="biblia_dicionario.php" class="<?php echo ($current_page == 'biblia_dicionario') ? 'active' : ''; ?>">Dicionário Bíblico</a></li>
                <li><a href="sgc.php" class="<?php echo ($current_page == 'sgc') ? 'active' : ''; ?>">Configurar SGC</a></li>
            </ul>
        </aside>
        <main class="admin-content">
