<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($page_title) ? $page_title . ' - ' : ''; ?><?php echo SITE_NAME; ?></title>
    <link rel="stylesheet" href="<?php echo BASE_URL; ?>/assets/css/style.css?v=<?php echo filemtime(__DIR__ . '/../assets/css/style.css'); ?>">
    
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
      let deferredPrompt;
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        var btn = document.getElementById('install-app-btn');
        if (btn) { btn.style.display = 'inline-block'; }
      });
      function installApp(){
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
          deferredPrompt = null;
          var btn = document.getElementById('install-app-btn');
          if (btn) { btn.style.display = 'none'; }
        });
      }
    </script>
</head>
<body>
    <header class="<?php echo (isset($page) && strpos($page, 'aventureiros') === 0) ? 'header-aventureiros' : ''; ?>">
        <div class="container">
            <div class="logo">
                <a href="<?php echo BASE_URL; ?>/index.php">
                    <h1><?php echo SITE_NAME; ?></h1>
                </a>
            </div>
            <nav>
                <ul>
                    <li><a href="<?php echo BASE_URL; ?>/index.php">Início</a></li>
                <li><a href="<?php echo BASE_URL; ?>/index.php?p=sobre">Sobre</a></li>
                <?php if (isset($_SESSION['user_id'])): ?>
                        <li><a href="<?php echo BASE_URL; ?>/logout.php">Sair</a></li>
                    <?php else: ?>
                        <li><a href="<?php echo BASE_URL; ?>/login.php">Login</a></li>
                    <?php endif; ?>
                    <li><a id="install-app-btn" onclick="installApp()" class="btn-admin" style="display:none;">Instalar App</a></li>
                </ul>
            </nav>
        </div>
    </header>
    <main class="container">
