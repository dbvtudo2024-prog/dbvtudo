<?php
require_once 'includes/config.php';
require_once 'includes/conexao.php';
$page = isset($_GET['p']) ? $_GET['p'] : 'home';
$page_title = ucfirst($page);
require_once 'includes/header.php';
$allowed_pages = [
    'home','desbravadores','aventureiros','ideais','ideais_lista','hino','ideal',
    'livros','livro','manuais','manual','materiais','material','videos','perfil',
    'cartao_virtual','clubes','unidade','especialidades','especialidade','classes',
    'classe','historia','historia_item','emblemas','emblema','uniformes','uniforme',
    'sgc','estudos','desbrava_mais','minha_faixa','sobre','creditos',
    'biblia','biblia_livros','biblia_livro','biblia_capitulo',
    'biblia_mais','biblia_palavra','biblia_devocional','biblia_devocional_lista',
    'biblia_anotacoes','biblia_dicionario','biblia_plano','biblia_quiz_inicio','biblia_quiz','biblia_quiz_ranking','biblia_favoritos','biblia_reflexoes','biblia_config',
    // Aventureiros
    'aventureiros','aventureiros_estudos','aventureiros_ideais','aventureiros_historia','aventureiros_uniformes',
    'aventureiros_emblemas','aventureiros_classes','aventureiros_especialidades','aventureiros_livros',
    'aventureiros_manuais','aventureiros_videos','aventureiros_ideais_lista','aventureiros_hino'
];
// páginas adicionais
$allowed_pages[] = 'biblia_plano_detalhe';
if (in_array($page, $allowed_pages)) {
    $file = "pages/{$page}.php";
    if (file_exists($file)) {
        include $file;
    } else {
        echo "<h2>Página em construção</h2>";
    }
} else {
    echo "<h2>Página não encontrada</h2>";
}
require_once 'includes/footer.php';
?>
