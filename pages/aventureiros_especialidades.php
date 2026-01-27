<?php
$catCode = isset($_GET['cat']) ? trim($_GET['cat']) : null;
?>
<div class="aventureiros-theme">
    <?php if (!$catCode): ?>
        <a href="index.php?p=aventureiros" class="btn-back-standard">Voltar</a>
    <?php else: ?>
        <a href="index.php?p=aventureiros_especialidades" class="btn-back-standard">Voltar</a>
    <?php endif; ?>
    <h2 class="feature-title">Especialidades dos Aventureiros</h2>
    <p style="margin-bottom: 30px;">Selecione uma categoria para ver as especialidades relacionadas.</p>

    <?php
    // Barra de busca
    $q = isset($_GET['q']) ? trim($_GET['q']) : '';
    ?>
    <div class="search-wrap" style="max-width:720px; margin-bottom:12px;">
        <form method="GET" class="search-form">
            <input type="hidden" name="p" value="aventureiros_especialidades">
            <input class="search-input" name="q" value="<?php echo htmlspecialchars($q); ?>" placeholder="Buscar especialidades...">
            <button class="search-button" type="submit">Buscar</button>
        </form>
    </div>
    <style>
        .aventureiros-theme .category-item::before { background: var(--cat-color, #800000) !important; }
    </style>
    <?php
    function normalizeAvtCategory($s){
        $n = mb_strtolower(trim($s));
        $map = [
            'atividades recreativas' => 'Atividades Recreativas',
            'atividades espirituais' => 'Atividades Espirituais',
            'estudos da natureza' => 'Estudos da Natureza',
            'habilidades domesticas' => 'Habilidades Domésticas',
            'artes manuais' => 'Artes Manuais',
            'atividades comunitarias' => 'Atividades Comunitárias',
        ];
        return $map[$n] ?? $s;
    }
    $avtColors = [
        'Atividades Recreativas' => '#AE0F0A',
        'Atividades Espirituais' => '#FFFCF0',
        'Estudos da Natureza' => '#047B3D',
        'Habilidades Domésticas' => '#FECC00',
        'Artes Manuais' => '#0088CF',
        'Atividades Comunitárias' => '#5F2261',
    ];
    function colorForCategory($s){
        global $avtColors;
        $norm = normalizeAvtCategory($s);
        return $avtColors[$norm] ?? '#800000';
    }
    function textColorForBg($hex){
        $h = ltrim($hex, '#');
        if (strlen($h) === 3) { $h = $h[0].$h[0].$h[1].$h[1].$h[2].$h[2]; }
        $r = hexdec(substr($h,0,2));
        $g = hexdec(substr($h,2,2));
        $b = hexdec(substr($h,4,2));
        $l = (0.2126*$r + 0.7152*$g + 0.0722*$b) / 255;
        return $l > 0.7 ? '#333' : '#fff';
    }
    if ($q !== '') {
        $sqlSearch = "SELECT id, especialidade_id AS Codigo, sigla AS Sigla, nome AS Nome, imagem AS Imagem, area AS Categoria, COALESCE(nivel, status) AS Nivel, ano AS Ano, origem AS Origem
                      FROM especialidades
                      WHERE status='ativo' AND publico_alvo='Aventureiro' AND (nome LIKE :q OR sigla LIKE :q OR CAST(especialidade_id AS CHAR) LIKE :q)
                      ORDER BY nome ASC";
        $st = $pdo->prepare($sqlSearch);
        $st->bindValue(':q', '%'.$q.'%');
        $st->execute();
        $results = $st->fetchAll(PDO::FETCH_ASSOC);
        echo '<div id="search-results">';
        echo '<h3 style="margin-top:10px; color:#800000;">Resultados da busca</h3>';
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
                $itemId = isset($row['id']) ? (int)$row['id'] : 0;
                $codigo = trim((isset($row['Sigla']) ? $row['Sigla'] : '') . ' ' . (isset($row['Codigo']) ? $row['Codigo'] : ''));
                echo '<a href="index.php?p=especialidade&id='.$itemId.'" style="display:flex; align-items:center; gap:14px; padding:14px; border-radius:12px; background:#fff; border:1px solid #e5e7eb; text-decoration:none; color:#333; box-shadow:0 2px 6px rgba(0,0,0,0.06);">';
                echo '<div style="width:62px; height:62px; flex-shrink:0; display:flex; align-items:center; justify-content:center; border-radius:12px; background:#fff;">';
                if ($imgSrc) {
                    echo '<img src="'.htmlspecialchars($imgSrc).'" style="max-width:100%; max-height:100%; object-fit:contain;" alt="Img">';
                } else {
                    echo '<div style="width:48px; height:48px; background:#eee; border-radius:12px;"></div>';
                }
                echo '</div>';
                echo '<div style="flex:1; min-width:0;">';
                echo '<div style="display:flex; align-items:center; gap:8px;">';
                $catLabel = isset($row['Categoria']) ? $row['Categoria'] : '';
                $catBg = colorForCategory($catLabel);
                $catFg = textColorForBg($catBg);
                echo '<span style="display:inline-block; padding:3px 8px; border-radius:8px; font-size:12px; background:'.$catBg.'; color:'.$catFg.';">'.htmlspecialchars($catLabel).'</span>';
                if ($codigo !== '') {
                    echo '<span style="display:inline-block; padding:3px 8px; border-radius:8px; font-size:12px; background:#f1f5f9; color:#0b1d42; border:1px solid #e2e8f0;">'.htmlspecialchars($codigo).'</span>';
                }
                echo '</div>';
                echo '<div style="font-weight:700; font-size:16px; color:#800000; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">'.htmlspecialchars($row['Nome'] ?? '').'</div>';
                echo '</div>';
                echo '<div style="margin-left:auto; color:#ccc;">›</div>';
                echo '</a>';
            }
            echo '</div>';
        }
        echo '</div>';
    }
    ?>
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
                    var url = 'index.php?p=aventureiros_especialidades&q=' + encodeURIComponent(q);
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
    // Categorias de Aventureiros geralmente são diferentes.
    // Baseado na cor e tema, são: Arte, Habilidades Domésticas, Natureza, Atividades Espirituais, Segurança
    // Vou listar as que aparecerem no banco, mas mapear cores.
    
    // Buscar todas as categorias disponíveis no banco para Aventureiros
    $sqlCats = "SELECT DISTINCT area FROM especialidades WHERE publico_alvo='Aventureiro' AND status='ativo' ORDER BY area ASC";
    $stmtCats = $pdo->query($sqlCats);
    $categoriasDB = $stmtCats->fetchAll(PDO::FETCH_COLUMN);

    if (!$catCode || !in_array($catCode, $categoriasDB)): ?>
        <div class="category-list">
            <?php foreach ($categoriasDB as $label): ?>
                <?php 
                    $label = trim($label);
                    if (preg_match('/^https?:\\/\\//i', $label)) continue;
                ?>
                <?php 
                    // Contar quantos itens
                    $stmtC = $pdo->prepare("SELECT COUNT(*) FROM especialidades WHERE area = :area AND publico_alvo='Aventureiro' AND status='ativo'");
                    $stmtC->execute([':area' => $label]);
                    $qtd = $stmtC->fetchColumn();
                ?>
                <?php $c = colorForCategory($label); ?>
                <a class="category-item" href="index.php?p=aventureiros_especialidades&cat=<?php echo urlencode($label); ?>" style="--cat-color: <?php echo $c; ?>;">
                    <span class="label">
                        <?php echo htmlspecialchars($label); ?>
                        <span style="font-size: 0.85em; opacity: 0.8; margin-left: 5px;">(<?php echo $qtd; ?>)</span>
                    </span>
                    <span class="chevron" style="color: <?php echo $c; ?>;">›</span>
                </a>
            <?php endforeach; ?>
            <?php if (empty($categoriasDB)): ?>
                <p>Nenhuma especialidade cadastrada para Aventureiros.</p>
            <?php endif; ?>
        </div>
    <?php else: ?>
        <?php
            $categoriaNome = $catCode;
            $sql = "SELECT id, especialidade_id AS Codigo, sigla AS Sigla, nome AS Nome, imagem AS Imagem, area AS Categoria, COALESCE(nivel, status) AS Nivel, origem AS Origem, requisitos AS Questoes FROM especialidades WHERE status='ativo' AND area = :categoria AND publico_alvo='Aventureiro' ORDER BY nome ASC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':categoria' => $categoriaNome]);
        ?>
        <?php $cHead = colorForCategory($categoriaNome); ?>
        <h3 style="margin-top:10px; color:<?php echo $cHead; ?>;"><?php echo htmlspecialchars($categoriaNome); ?></h3>
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
                    $itemId = isset($row['id']) ? (int)$row['id'] : 0;
                ?>
                <a href="index.php?p=especialidade&id=<?php echo $itemId; ?>" style="display:flex; align-items:center; gap:14px; padding:14px; border-radius:12px; background:#fff; border:1px solid #e5e7eb; text-decoration:none; color:#333; box-shadow:0 2px 6px rgba(0,0,0,0.06);">
                    <div style="width:62px; height:62px; flex-shrink:0; display:flex; align-items:center; justify-content:center; border-radius:12px; background:#fff;">
                        <?php if ($imgSrc): ?>
                            <img src="<?php echo htmlspecialchars($imgSrc); ?>" style="max-width:100%; max-height:100%; object-fit:contain;" alt="Img">
                        <?php else: ?>
                            <div style="width:48px; height:48px; background:#eee; border-radius:12px;"></div>
                        <?php endif; ?>
                    </div>
                    <div style="flex:1; min-width:0;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <?php $cat = isset($row['Categoria']) ? $row['Categoria'] : ''; ?>
                            <?php if ($cat): ?>
                                <?php $cbg = colorForCategory($cat); $cfg = textColorForBg($cbg); ?>
                                <span style="display:inline-block; padding:3px 8px; border-radius:8px; font-size:12px; background:<?php echo $cbg; ?>; color:<?php echo $cfg; ?>;"><?php echo htmlspecialchars($cat); ?></span>
                            <?php endif; ?>
                            <?php
                                $sigla = isset($row['Sigla']) && $row['Sigla'] !== '' ? $row['Sigla'] : '';
                                $codigo = isset($row['Codigo']) && $row['Codigo'] !== '' ? $row['Codigo'] : '';
                                $codeBadge = trim($sigla . ' ' . $codigo);
                            ?>
                            <?php if ($codeBadge !== ''): ?>
                                <span style="display:inline-block; padding:3px 8px; border-radius:8px; font-size:12px; background:#f1f5f9; color:#0b1d42; border:1px solid #e2e8f0;"><?php echo htmlspecialchars($codeBadge); ?></span>
                            <?php endif; ?>
                            <span style="margin-left:auto; font-size:12px; color:#555;">
                                <?php
                                    $origem = isset($row['Origem']) && $row['Origem'] !== '' ? $row['Origem'] : 'N/A';
                                    echo 'Origem: ' . htmlspecialchars((string)$origem);
                                ?>
                            </span>
                        </div>
                        <div style="font-weight:700; font-size:16px; color:#800000; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><?php echo htmlspecialchars($row['Nome'] ?? ''); ?></div>
                    </div>
                    <div style="margin-left:auto; color:#ccc;">›</div>
                </a>
            <?php endwhile; ?>
        </div>
    <?php endif; ?>
</div>
