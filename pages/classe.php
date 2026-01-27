<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/conexao.php';
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
?>
<a href="index.php?p=classes" class="btn-back-standard">Voltar</a>
<h2>Classe</h2>
<?php if ($id <= 0): ?>
    <p>Classe não encontrada.</p>
<?php else: ?>
    <?php
        $stmt = $pdo->prepare("SELECT * FROM classes WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
    ?>
    <?php if (!$row): ?>
        <p>Classe não encontrada.</p>
    <?php else: ?>
        <?php
        function classColor($name){
            $n = mb_strtolower(trim($name));
            $map = [
                'aspirante' => '#ff8f00',
                'amigo' => '#1e88e5',
                'companheiro' => '#e53935',
                'pesquisador' => '#43a047',
                'pioneiro' => '#9e9e9e',
                'excursionista' => '#8e24aa',
                'guia' => '#fbc02d',
                'agrupadas' => '#607d8b',
                'líder' => '#1565c0',
                'lider' => '#1565c0',
                'líder master' => '#1b5e20',
                'lider master' => '#1b5e20'
            ];
            foreach ($map as $k=>$v) {
                if (strpos($n,$k) !== false) return $v;
            }
            return '#e0e0e0';
        }
        function avtClassColor($name){
            $n = mb_strtolower(trim($name));
            $map = [
                'abelhinhas laboriosas' => '#25AAE1',
                'luminares' => '#FACD01',
                'edificadores' => '#2E3192',
                'mãos ajudadoras' => '#690106',
                'maos ajudadoras' => '#690106',
                'líder' => '#FFD204',
                'lider' => '#FFD204',
            ];
            foreach ($map as $k=>$v) {
                if (strpos($n,$k) !== false) return $v;
            }
            return '#800000';
        }
        $isAvt = isset($row['publico_alvo']) && $row['publico_alvo'] === 'Aventureiro';
        $color = $isAvt ? avtClassColor($row['nome']) : classColor($row['nome']);
        ?>
        <div class="card" style="max-width:800px;margin:0 auto; border-left:6px solid <?php echo $color; ?>;">
            <?php if (!empty($row['insignia'])): ?>
                <img src="uploads/<?php echo $row['insignia']; ?>" alt="<?php echo htmlspecialchars($row['nome']); ?>" class="card-img" style="height: 200px; object-fit: contain; padding: 10px;">
            <?php endif; ?>
            <div class="card-body">
                <h3 class="card-title" style="color: <?php echo $color; ?>;"><?php echo htmlspecialchars($row['nome']); ?></h3>
                <?php if (!empty($row['descricao'])): ?>
                    <p class="card-text"><?php echo htmlspecialchars($row['descricao']); ?></p>
                <?php endif; ?>
                <?php if (!empty($row['requisitos'])): ?>
                    <h4 style="margin-top:12px;color:#004d40;">Requisitos</h4>
                    <div style="margin-top: 6px; font-size: 14px; white-space: pre-wrap;"><?php echo htmlspecialchars($row['requisitos']); ?></div>
                <?php endif; ?>
            </div>
        </div>
    <?php endif; ?>
<?php endif; ?>
