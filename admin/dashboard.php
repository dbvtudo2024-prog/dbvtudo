<?php
require_once '../includes/config.php';
require_once '../includes/conexao.php';

$current_page = 'dashboard';

// Contadores
$stats = [];

// Especialidades
try {
    $stmt = $pdo->query('SELECT COUNT(*) FROM public."EspecialidadesDBV"');
    $stats['especialidades'] = (int)$stmt->fetchColumn();
} catch (Exception $e) {
    try {
        $stmt = $pdo->query("SELECT COUNT(*) FROM especialidades");
        $stats['especialidades'] = (int)$stmt->fetchColumn();
    } catch (Exception $e2) {
        $stats['especialidades'] = 0;
    }
}
// Especialidades por público-alvo (quando disponível na base local)
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM especialidades WHERE status='ativo' AND publico_alvo='Desbravador'");
    $stats['esp_desbravadores'] = (int)$stmt->fetchColumn();
} catch (Exception $e) {
    $stats['esp_desbravadores'] = 0;
}
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM especialidades WHERE status='ativo' AND publico_alvo='Aventureiro'");
    $stats['esp_aventureiros'] = (int)$stmt->fetchColumn();
} catch (Exception $e) {
    $stats['esp_aventureiros'] = 0;
}

// Classes
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM classes");
    $stats['classes'] = (int)$stmt->fetchColumn();
} catch (Exception $e) {
    $stats['classes'] = 0;
}

// História
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM historia");
    $stats['historia'] = (int)$stmt->fetchColumn();
} catch (Exception $e) {
    $stats['historia'] = 0;
}

// Emblemas
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM emblemas");
    $stats['emblemas'] = (int)$stmt->fetchColumn();
} catch (Exception $e) {
    $stats['emblemas'] = 0;
}

// Ideais e Hinos
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM ideais");
    $stats['ideais'] = (int)$stmt->fetchColumn();
} catch (Exception $e) {
    $stats['ideais'] = 0;
}

// Livros
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM livros");
    $stats['livros'] = (int)$stmt->fetchColumn();
} catch (Exception $e) {
    $stats['livros'] = 0;
}

// Manuais
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM manuais");
    $stats['manuais'] = (int)$stmt->fetchColumn();
} catch (Exception $e) {
    $stats['manuais'] = 0;
}

// Materiais
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM materiais");
    $stats['materiais'] = (int)$stmt->fetchColumn();
} catch (Exception $e) {
    $stats['materiais'] = 0;
}

// Vídeos
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM videos");
    $stats['videos'] = (int)$stmt->fetchColumn();
} catch (Exception $e) {
    $stats['videos'] = 0;
}
 
// Uniformes
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM uniformes");
    $stats['uniformes'] = (int)$stmt->fetchColumn();
} catch (Exception $e) {
    $stats['uniformes'] = 0;
}
 
// Estudos
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM estudos");
    $stats['estudos'] = (int)$stmt->fetchColumn();
} catch (Exception $e) {
    $stats['estudos'] = 0;
}
 
// Desbrava Mais
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM desbrava_mais");
    $stats['desbrava_mais'] = (int)$stmt->fetchColumn();
} catch (Exception $e) {
    $stats['desbrava_mais'] = 0;
}
 
// Devocionais Agendados
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM biblia_devocionais_agendados");
    $stats['devocionais_agendados'] = (int)$stmt->fetchColumn();
} catch (Exception $e) {
    $stats['devocionais_agendados'] = 0;
}
 
// Devocionais Publicados
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM biblia_devocionais");
    $stats['devocionais_publicados'] = (int)$stmt->fetchColumn();
} catch (Exception $e) {
    $stats['devocionais_publicados'] = 0;
}
 
// Quiz Questões
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM quiz_questoes");
    $stats['quiz_questoes'] = (int)$stmt->fetchColumn();
} catch (Exception $e) {
    $stats['quiz_questoes'] = 0;
}
 
// Quiz Categorias
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM quiz_categorias");
    $stats['quiz_categorias'] = (int)$stmt->fetchColumn();
} catch (Exception $e) {
    $stats['quiz_categorias'] = 0;
}
 
// Versos Bíblicos
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM biblia_versos");
    $stats['biblia_versos'] = (int)$stmt->fetchColumn();
} catch (Exception $e) {
    $stats['biblia_versos'] = 0;
}

require_once '../includes/admin_header.php';
?>

<h2>Dashboard</h2>
<p>Bem-vindo ao painel administrativo.</p>

<h3>Conteúdos</h3>
<div class="dash-cards">
    <div class="dash-card"><h3><?php echo $stats['esp_desbravadores']; ?></h3><p>Esp. Desbravadores</p></div>
    <div class="dash-card"><h3><?php echo $stats['esp_aventureiros']; ?></h3><p>Esp. Aventureiros</p></div>
    <div class="dash-card"><h3><?php echo $stats['especialidades']; ?></h3><p>Especialidades (Total)</p></div>
    <div class="dash-card"><h3><?php echo $stats['classes']; ?></h3><p>Classes</p></div>
    <div class="dash-card"><h3><?php echo $stats['historia']; ?></h3><p>Conteúdos Históricos</p></div>
    <div class="dash-card"><h3><?php echo $stats['emblemas']; ?></h3><p>Emblemas</p></div>
    <div class="dash-card"><h3><?php echo $stats['ideais']; ?></h3><p>Ideais e Hinos</p></div>
    <div class="dash-card"><h3><?php echo $stats['livros']; ?></h3><p>Livros</p></div>
    <div class="dash-card"><h3><?php echo $stats['manuais']; ?></h3><p>Manuais</p></div>
    <div class="dash-card"><h3><?php echo $stats['materiais']; ?></h3><p>Materiais</p></div>
    <div class="dash-card"><h3><?php echo $stats['videos']; ?></h3><p>Vídeos</p></div>
    <div class="dash-card"><h3><?php echo $stats['uniformes']; ?></h3><p>Uniformes</p></div>
    <div class="dash-card"><h3><?php echo $stats['estudos']; ?></h3><p>Estudos</p></div>
    <div class="dash-card"><h3><?php echo $stats['desbrava_mais']; ?></h3><p>Desbrava Mais</p></div>
</div>

<h3>Devocionais</h3>
<div class="dash-cards">
    <div class="dash-card"><h3><?php echo $stats['devocionais_agendados']; ?></h3><p>Agendados</p></div>
    <div class="dash-card"><h3><?php echo $stats['devocionais_publicados']; ?></h3><p>Publicados</p></div>
</div>

<h3>Quiz</h3>
<div class="dash-cards">
    <div class="dash-card"><h3><?php echo $stats['quiz_questoes']; ?></h3><p>Questões</p></div>
    <div class="dash-card"><h3><?php echo $stats['quiz_categorias']; ?></h3><p>Categorias</p></div>
</div>

<h3>Bíblia</h3>
<div class="dash-cards">
    <div class="dash-card"><h3><?php echo $stats['biblia_versos']; ?></h3><p>Versos Bíblicos</p></div>
</div>

<?php require_once '../includes/admin_footer.php'; ?>
