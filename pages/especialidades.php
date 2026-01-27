<?php
$catCode = isset($_GET['cat']) ? strtoupper($_GET['cat']) : null;
?>
<?php
// Detectar tipo do usuário para filtrar (padrão: Desbravador)
$tipoUsuario = 'Desbravador';
if (isset($_SESSION['user_id'])) {
    try {
        $stTipo = $pdo->prepare("SELECT tipo FROM usuarios WHERE id = ?");
        $stTipo->execute([$_SESSION['user_id']]);
        $t = $stTipo->fetchColumn();
        if ($t) { $tipoUsuario = $t; }
    } catch (Throwable $e) { /* manter padrão */ }
}
?>
<?php if (!$catCode): ?>
    <a href="index.php?p=<?php echo ($tipoUsuario === 'Aventureiro' ? 'aventureiros' : 'desbravadores'); ?>" class="btn-back-standard">Voltar</a>
<?php else: ?>
    <a href="index.php?p=especialidades" class="btn-back-standard">Voltar</a>
<?php endif; ?>
<h2>Especialidades</h2>
<p style="margin-bottom: 30px;">Selecione uma categoria para ver as especialidades relacionadas.</p>
<?php $q = isset($_GET['q']) ? trim($_GET['q']) : ''; ?>
<div class="search-wrap" style="max-width:720px; margin-bottom:12px;">
    <form method="GET" class="search-form">
        <input type="hidden" name="p" value="especialidades">
        <input class="search-input" name="q" value="<?php echo htmlspecialchars($q); ?>" placeholder="Buscar especialidades...">
        <button class="search-button" type="submit">Buscar</button>
    </form>
</div>
<script>
    (function(){
        var input = document.querySelector('.search-input');
        var results = document.getElementById('search-results');
        if (!input) return;
        var t;
        input.addEventListener('input', function(){
            clearTimeout(t);
            t = setTimeout(function(){
                var q = input.value.trim();
                var url = 'index.php?p=especialidades&q=' + encodeURIComponent(q);
                fetch(url, {headers:{'X-Requested-With':'XMLHttpRequest'}}).then(function(r){return r.text();}).then(function(html){
                    var doc = new DOMParser().parseFromString(html, 'text/html');
                    var newRes = doc.getElementById('search-results');
                    if (newRes && results) { results.innerHTML = newRes.innerHTML; }
                }).catch(function(){});
            }, 250);
        });
    })();
</script>

<?php
$categorias = [
    'AD' => 'ADRA',
    'HM' => 'Artes e Habilidades Manuais',
    'AA' => 'Atividades Agrícolas',
    'AM' => 'Atividades Missionárias e Comunitárias',
    'AP' => 'Atividades Profissionais',
    'AR' => 'Atividades Recreativas',
    'CS' => 'Ciência e Saúde',
    'EB' => 'Ensinos Bíblicos',
    'EN' => 'Estudo da Natureza',
    'HD' => 'Habilidades Domésticas',
    'ME' => 'Mestrados',
];

$categoriaColors = [
    'AD' => '#070a51',
    'HM' => '#0b699c',
    'AA' => '#7a3532',
    'AM' => '#1f4b9a',
    'AP' => '#ce0b0b',
    'AR' => '#21741d',
    'CS' => '#5b1b80',
    'EB' => '#509bae',
    'EN' => '#b5b5b8',
    'HD' => '#f09a07',
    'ME' => '#000000',
];

// Buscar contagem de especialidades por área
$driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
if ($driver === 'pgsql') {
    $sqlCount = 'SELECT "Categoria" as area, COUNT(*) as qtd FROM public."EspecialidadesDBV" GROUP BY "Categoria"';
} else {
    $sqlCount = "SELECT area, COUNT(*) as qtd FROM especialidades WHERE status='ativo' AND publico_alvo = :tipo GROUP BY area";
}
$stmtCount = ($driver === 'pgsql') ? $pdo->query($sqlCount) : (function($pdo, $sqlCount, $tipoUsuario){
    $st = $pdo->prepare($sqlCount);
    $st->execute([':tipo' => $tipoUsuario]);
    return $st;
})($pdo, $sqlCount, $tipoUsuario);
$counts = [];
// Normalização de nomes de área vindos do banco para rótulos canônicos da UI
$areaMap = [
    'ADRA' => 'ADRA',
    'Adra' => 'ADRA',
    'AD' => 'ADRA',
    'Artes e Habilidades Manuais' => 'Artes e Habilidades Manuais',
    'HM' => 'Artes e Habilidades Manuais',
    'Atividades Agrícolas' => 'Atividades Agrícolas',
    'AA' => 'Atividades Agrícolas',
    'Atividades Missionárias' => 'Atividades Missionárias e Comunitárias',
    'Atividades Missionárias e Comunitárias' => 'Atividades Missionárias e Comunitárias',
    'AM' => 'Atividades Missionárias e Comunitárias',
    'Atividades Profissionais' => 'Atividades Profissionais',
    'AP' => 'Atividades Profissionais',
    'Atividades Recreativas' => 'Atividades Recreativas',
    'AR' => 'Atividades Recreativas',
    'Ciência e Saúde' => 'Ciência e Saúde',
    'CS' => 'Ciência e Saúde',
    'Ensinos Bíblicos' => 'Ensinos Bíblicos',
    'EB' => 'Ensinos Bíblicos',
    'Estudo da Natureza' => 'Estudo da Natureza',
    'EN' => 'Estudo da Natureza',
    'Habilidades Domésticas' => 'Habilidades Domésticas',
    'HD' => 'Habilidades Domésticas',
    'Mestrados' => 'Mestrados',
    'ME' => 'Mestrados',
];
while ($r = $stmtCount->fetch(PDO::FETCH_ASSOC)) {
    $areaBanco = $r['area'];
    $canon = isset($areaMap[$areaBanco]) ? $areaMap[$areaBanco] : $areaBanco;
    if (!isset($counts[$canon])) $counts[$canon] = 0;
    $counts[$canon] += (int)$r['qtd'];
}

// Resultado de busca global
if ($q !== '') {
    if ($driver === 'pgsql') {
        $sqlSearch = 'SELECT id, "ID" AS Codigo, "Sigla", "Nome", "Imagem", "Categoria", "Nivel", "Ano", "Origem" FROM public."EspecialidadesDBV"
                      WHERE "Nome" ILIKE :q OR "Sigla" ILIKE :q OR CAST("ID" AS TEXT) ILIKE :q
                      ORDER BY "Nome" ASC';
    } else {
        $sqlSearch = "SELECT id, especialidade_id AS Codigo, sigla AS Sigla, nome AS Nome, imagem AS Imagem, area AS Categoria, COALESCE(nivel, status) AS Nivel, ano AS Ano, origem AS Origem
                      FROM especialidades
                      WHERE status='ativo' AND publico_alvo = :tipo AND (nome LIKE :q OR sigla LIKE :q OR CAST(especialidade_id AS CHAR) LIKE :q)
                      ORDER BY nome ASC";
    }
    $st = $pdo->prepare($sqlSearch);
    if ($driver !== 'pgsql') {
        $st->bindValue(':tipo', $tipoUsuario);
    }
    $st->bindValue(':q', '%'.$q.'%');
    $st->execute();
    $results = $st->fetchAll(PDO::FETCH_ASSOC);
    echo '<div id="search-results">';
    echo '<h3 style="margin-top:10px; color:#0b1d42;">Resultados da busca</h3>';
    if (count($results) === 0) {
        echo '<div class="card"><div class="card-body">Nenhuma especialidade encontrada.</div></div>';
    } else {
        echo '<div class="list-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap:12px; margin-top: 12px;">';
        foreach ($results as $row) {
            $img = isset($row['Imagem']) ? $row['Imagem'] : '';
            $imgSrc = '';
            if ($img) {
                if (strpos($img, 'http://') === 0 || strpos($img, 'https://') === 0) {
                    $imgSrc = $img;
                } else {
                    $imgSrc = 'uploads/' . $img;
                }
            }
            $itemId = isset($row['id']) ? (int)$row['id'] : (isset($row['ID']) ? (int)$row['ID'] : 0);
            $codigo = trim((isset($row['Sigla']) ? $row['Sigla'] : '') . ' ' . (isset($row['Codigo']) ? $row['Codigo'] : ''));
            echo '<a href="index.php?p=especialidade&id='.$itemId.'" style="text-decoration:none; color:inherit; background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.08); padding:10px; display:flex; align-items:center; gap:12px; border:1px solid #e4e4e4;">';
            echo '<div style="width:64px; height:64px; border-radius:8px; background:#f7f7f7; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">';
            if ($imgSrc) {
                echo '<img src="'.htmlspecialchars($imgSrc).'" alt="'.htmlspecialchars($row['Nome']).'" style="width:64px; height:64px; object-fit:contain;">';
            } else {
                echo '<span style="color:#aaa; font-size:12px;">Sem Imagem</span>';
            }
            echo '</div>';
            echo '<div style="flex:1; min-width:0;">';
            echo '<div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">';
            echo '<span class="badge" style="background:#0b1d42; color:#fff;">'.htmlspecialchars($row['Categoria']).'</span>';
            if ($codigo !== '') {
                echo '<span class="badge" style="background:#f8f9fa; color:#333; border:1px solid #dee2e6;">'.htmlspecialchars($codigo).'</span>';
            }
            echo '</div>';
            echo '<div style="font-weight:700;">'.htmlspecialchars($row['Nome'] ?? '').'</div>';
            if (!empty($row['Origem'])) {
                echo '<div style="font-size:12px; color:#666; margin-top:2px;">'.htmlspecialchars($row['Origem']).'</div>';
            }
            echo '</div>';
            echo '<div style="margin-left:auto; text-align:right; min-width:70px;">';
            $nivelRaw = trim($row['Nivel'] ?? '');
            $nivelText = $nivelRaw !== '' ? (stripos($nivelRaw, 'nível') !== false ? $nivelRaw : ('Nível ' . $nivelRaw)) : '';
            if ($nivelText !== '') {
                echo '<div style="font-weight:600; font-size:12px;">'.htmlspecialchars($nivelText).'</div>';
            }
            echo '<div style="margin-top:6px; font-size:12px;">'.htmlspecialchars($row['Ano'] ?? '').'</div>';
            echo '</div>';
            echo '</a>';
        }
        echo '</div>';
    }
    echo '</div>';
}

if (!$catCode || !isset($categorias[$catCode])): ?>
    <div class="category-list" id="category-list">
        <?php foreach ($categorias as $code => $label): ?>
            <?php 
                $qtd = isset($counts[$label]) ? $counts[$label] : 0;
            ?>
            <a class="category-item cat-<?php echo htmlspecialchars($code); ?>" href="index.php?p=especialidades&cat=<?php echo urlencode($code); ?>">
                <span class="label">
                    <?php echo htmlspecialchars($label); ?>
                    <span style="font-size: 0.85em; opacity: 0.8; margin-left: 5px;">(<?php echo $qtd; ?>)</span>
                </span>
                <span class="chevron">›</span>
            </a>
        <?php endforeach; ?>
    </div>
<?php else: ?>
    <?php
        $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        $categoriaNome = $categorias[$catCode];
        $catColor = isset($categoriaColors[$catCode]) ? $categoriaColors[$catCode] : '#0b1d42';
        function _textColorForBg($hex){
            $h = ltrim($hex, '#');
            if (strlen($h) === 3) { $h = $h[0].$h[0].$h[1].$h[1].$h[2].$h[2]; }
            $r = hexdec(substr($h,0,2));
            $g = hexdec(substr($h,2,2));
            $b = hexdec(substr($h,4,2));
            $l = (0.2126*$r + 0.7152*$g + 0.0722*$b) / 255;
            return $l > 0.7 ? '#333' : '#fff';
        }
        $catText = _textColorForBg($catColor);
        if ($driver === 'pgsql') {
        $sql = 'SELECT id, "Nome", "Imagem", "Categoria", "Nivel", "Ano", "Questoes" FROM public."EspecialidadesDBV" WHERE "Categoria" = :categoria ORDER BY "Nome" ASC';
    } else {
        // Permitir alias de área (nome e código) para compatibilizar rótulo canônico com valores do banco
        $aliases = [$categoriaNome, $catCode];
        if ($categoriaNome === 'ADRA') { $aliases = ['ADRA','Adra','AD']; }
        if ($categoriaNome === 'Artes e Habilidades Manuais') { $aliases[] = 'HM'; }
        if ($categoriaNome === 'Atividades Agrícolas') { $aliases[] = 'AA'; }
        if ($categoriaNome === 'Atividades Missionárias e Comunitárias') { $aliases = ['Atividades Missionárias e Comunitárias','Atividades Missionárias','AM']; }
        if ($categoriaNome === 'Atividades Profissionais') { $aliases[] = 'AP'; }
        if ($categoriaNome === 'Atividades Recreativas') { $aliases[] = 'AR'; }
        if ($categoriaNome === 'Ciência e Saúde') { $aliases[] = 'CS'; }
        if ($categoriaNome === 'Ensinos Bíblicos') { $aliases[] = 'EB'; }
        if ($categoriaNome === 'Estudo da Natureza') { $aliases[] = 'EN'; }
        if ($categoriaNome === 'Habilidades Domésticas') { $aliases[] = 'HD'; }
        if ($categoriaNome === 'Mestrados') { $aliases[] = 'ME'; }
        // Montar placeholders dinamicamente
        $placeholders = [];
        $params = [':tipo' => $tipoUsuario];
        foreach ($aliases as $i => $al) {
            $ph = ':a' . $i;
            $placeholders[] = $ph;
            $params[$ph] = $al;
        }
        $in = implode(',', $placeholders);
        $sql = "SELECT id, especialidade_id AS Codigo, sigla AS Sigla, nome AS Nome, imagem AS Imagem, area AS Categoria, COALESCE(nivel, status) AS Nivel, ano AS Ano, requisitos AS Questoes 
                FROM especialidades 
                WHERE status='ativo' AND publico_alvo = :tipo AND area IN ($in)
                ORDER BY CAST(especialidade_id AS UNSIGNED) ASC, nome ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }
    ?>
    <h3 style="margin-top:10px; color:<?php echo $catColor; ?>;"><?php echo htmlspecialchars($categoriaNome); ?></h3>
    <div class="list-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap:12px; margin-top: 12px;">
        <?php while ($row = $stmt->fetch()): ?>
            <?php
                $img = isset($row['Imagem']) ? $row['Imagem'] : '';
                $imgSrc = '';
                if ($img) {
                    if (strpos($img, 'http://') === 0 || strpos($img, 'https://') === 0) {
                        $imgSrc = $img;
                    } else {
                        $imgSrc = 'uploads/' . $img;
                    }
                }
                $itemId = isset($row['id']) ? (int)$row['id'] : (isset($row['ID']) ? (int)$row['ID'] : 0);
                $codigo = trim((isset($row['Sigla']) ? $row['Sigla'] : '') . ' ' . (isset($row['Codigo']) ? $row['Codigo'] : ''));
            ?>
            <a href="index.php?p=especialidade&id=<?php echo $itemId; ?>" style="text-decoration:none; color:inherit; background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.08); padding:10px; display:flex; align-items:center; gap:12px; border:1px solid #e4e4e4;">
                <div style="width:64px; height:64px; border-radius:8px; background:#f7f7f7; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">
                    <?php if ($imgSrc): ?>
                        <img src="<?php echo htmlspecialchars($imgSrc); ?>" alt="<?php echo htmlspecialchars($row['Nome']); ?>" style="width:64px; height:64px; object-fit:contain;">
                    <?php else: ?>
                        <span style="color:#aaa; font-size:12px;">Sem Imagem</span>
                    <?php endif; ?>
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                        <span class="badge" style="background:<?php echo $catColor; ?>; color:<?php echo $catText; ?>;"><?php echo htmlspecialchars($row['Categoria']); ?></span>
                        <?php if ($codigo !== ''): ?>
                            <span class="badge" style="background:#f8f9fa; color:#333; border:1px solid #dee2e6;"><?php echo htmlspecialchars($codigo); ?></span>
                        <?php endif; ?>
                    </div>
                    <div style="font-weight:700;"><?php echo htmlspecialchars($row['Nome'] ?? ''); ?></div>
                    <?php if (!empty($row['Origem'])): ?>
                        <div style="font-size:12px; color:#666; margin-top:2px;"><?php echo htmlspecialchars($row['Origem']); ?></div>
                    <?php endif; ?>
                </div>
                <div style="margin-left:auto; text-align:right; min-width:70px;">
                    <?php
                        $nivelRaw = trim($row['Nivel'] ?? '');
                        $nivelText = $nivelRaw !== '' ? (stripos($nivelRaw, 'nível') !== false ? $nivelRaw : ('Nível ' . $nivelRaw)) : '';
                    ?>
                    <?php if ($nivelText !== ''): ?>
                        <div style="font-weight:600; font-size:12px;"><?php echo htmlspecialchars($nivelText); ?></div>
                    <?php endif; ?>
                    <div style="margin-top:6px; font-size:12px;"><?php echo htmlspecialchars($row['Ano'] ?? ''); ?></div>
                </div>
            </a>
        <?php endwhile; ?>
    </div>
<?php endif; ?>
