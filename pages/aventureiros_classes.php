<div class="aventureiros-theme">
    <a href="index.php?p=aventureiros" class="btn-back-standard">Voltar</a>
    <h2 class="feature-title">Classes dos Aventureiros</h2>
    <?php
    function avtClassColorFromCsv(){
        static $cache = null;
        if ($cache !== null) return $cache;
        $cache = [];
        $dir = __DIR__ . '/../uploads';
        $files = [];
        if (is_dir($dir)) {
            foreach (scandir($dir) as $f) {
                if (preg_match('/\.csv$/i', $f)) $files[] = $dir . '/' . $f;
            }
        }
        foreach ($files as $path) {
            $h = fopen($path, 'r');
            if (!$h) continue;
            $header = fgetcsv($h, 0, ';');
            if (!$header) { fclose($h); continue; }
            if (count($header) < 2) { rewind($h); $header = fgetcsv($h, 0, ','); }
            $idxNome = null; $idxCor = null;
            foreach ($header as $i=>$col) {
                $lc = mb_strtolower(trim($col));
                if ($lc === 'nome' || $lc === 'mestrado' || $lc === 'classe') $idxNome = $i;
                if ($lc === 'cor') $idxCor = $i;
            }
            if ($idxNome === null || $idxCor === null) { fclose($h); continue; }
            while (($row = fgetcsv($h, 0, ';')) !== false) {
                if (count($row) < max($idxNome,$idxCor)+1) continue;
                $nome = mb_strtolower(trim($row[$idxNome]));
                $cor = trim($row[$idxCor]);
                if ($nome !== '' && preg_match('/^#?[0-9a-fA-F]{6}$/', $cor)) {
                    if ($cor[0] !== '#') $cor = '#' . $cor;
                    $cache[$nome] = $cor;
                }
            }
            fclose($h);
            if (!empty($cache)) break;
        }
        return $cache;
    }
    function avtClassColor($name){
        $map = avtClassColorFromCsv();
        if (empty($map)) {
            $byName = [
                'abelhinhas laboriosas' => '#25AAE1',
                'luminares' => '#FACD01',
                'edificadores' => '#2E3192',
                'mãos ajudadoras' => '#690106',
                'maos ajudadoras' => '#690106',
                'líder' => '#FFD204',
                'lider' => '#FFD204',
            ];
            $key = mb_strtolower(trim($name));
            return $byName[$key] ?? '#800000';
        }
        $key = mb_strtolower(trim($name));
        return $map[$key] ?? '#800000';
    }
    $stmt = $pdo->query("SELECT * FROM classes WHERE publico_alvo = 'Aventureiro' ORDER BY id ASC"); // Classes geralmente tem ordem lógica de ID ou nome
    $items = $stmt->fetchAll();
    ?>
    <div class="grid" style="margin-top: 30px;">
        <?php if (count($items) > 0): ?>
            <?php foreach ($items as $row): ?>
                <?php $color = avtClassColor($row['nome']); ?>
                <a href="index.php?p=classe&id=<?php echo (int)$row['id']; ?>" 
                   style="position:relative; display:flex; align-items:center; gap:14px; padding:14px; border-radius:14px; background:#fff; border:1px solid #e5e7eb; text-decoration:none; color:#333; box-shadow:0 2px 6px rgba(0,0,0,0.06);">
                    <span style="position:absolute; left:0; top:0; bottom:0; width:10px; background: <?php echo $color; ?>; border-radius:14px 0 0 14px;"></span>
                    <div style="width:64px; height:64px; flex-shrink:0; display:flex; align-items:center; justify-content:center; background:#fff;">
                        <?php if (!empty($row['insignia'])): ?>
                            <img src="uploads/<?php echo $row['insignia']; ?>" alt="<?php echo htmlspecialchars($row['nome']); ?>" style="max-width:56px; max-height:56px; object-fit:contain; display:block;">
                        <?php else: ?>
                            <div style="width:48px; height:48px; background:#eee; border-radius:12px;"></div>
                        <?php endif; ?>
                    </div>
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:700; font-size:16px; color:#0b1d42; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><?php echo htmlspecialchars($row['nome']); ?></div>
                        <?php if (!empty($row['descricao'])): ?>
                            <div style="font-size:12px; color:#666; margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><?php echo htmlspecialchars($row['descricao']); ?></div>
                        <?php endif; ?>
                    </div>
                    <div style="margin-left:auto; color:#ccc;">›</div>
                </a>
            <?php endforeach; ?>
        <?php else: ?>
            <p>Nenhuma classe cadastrada para Aventureiros.</p>
        <?php endif; ?>
    </div>
</div>
