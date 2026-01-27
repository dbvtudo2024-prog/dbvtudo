<?php
require_once '../includes/config.php';
require_once '../includes/conexao.php';

$current_page = 'especialidades';
$action = isset($_GET['action']) ? $_GET['action'] : 'list';
$error = '';
$success = '';

function columnExists(PDO $pdo, $table, $column) {
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    if ($driver === 'pgsql') {
        $stmt = $pdo->prepare("SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name = :t AND column_name = :c");
    } else {
        $stmt = $pdo->prepare("SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :t AND column_name = :c");
    }
    $stmt->execute([':t' => $table, ':c' => $column]);
    return (bool)$stmt->fetchColumn();
}

function columnMaxLength(PDO $pdo, $table, $column) {
    try {
        $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        if ($driver === 'pgsql') {
            $stmt = $pdo->prepare("SELECT character_maximum_length FROM information_schema.columns WHERE table_schema='public' AND table_name = :t AND column_name = :c");
        } else {
            $stmt = $pdo->prepare("SELECT CHARACTER_MAXIMUM_LENGTH FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :t AND column_name = :c");
        }
        $stmt->execute([':t' => $table, ':c' => $column]);
        $len = $stmt->fetchColumn();
        return $len ? (int)$len : null;
    } catch (Exception $e) {
        return null;
    }
}

function ensureColumns(PDO $pdo) {
    $defs = [
        'especialidade_id' => 'VARCHAR(50)',
        'sigla'            => 'VARCHAR(50)',
        'nivel'            => 'VARCHAR(50)',
        'likes'            => 'INT DEFAULT 0',
        'origem'           => 'VARCHAR(100)',
        'cor'              => 'VARCHAR(10)',
    ];
    foreach ($defs as $col => $type) {
        if (!columnExists($pdo, 'especialidades', $col)) {
            try { $pdo->exec("ALTER TABLE especialidades ADD COLUMN {$col} {$type}"); } catch (Exception $e) {}
        }
    }
}

ensureColumns($pdo);

// Excluir todos os registros da tabela do Supabase (EspecialidadesDBV)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_all_supabase'])) {
    $deleted = false;
    $err = '';
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    try {
        if ($driver === 'pgsql') {
            $pdo->exec('TRUNCATE TABLE public."EspecialidadesDBV" RESTART IDENTITY CASCADE');
        } else {
            $pdo->exec('TRUNCATE TABLE especialidades');
        }
        $deleted = true;
    } catch (Exception $e) {
        $err = $e->getMessage();
        try {
            if ($driver === 'pgsql') {
                $pdo->exec('DELETE FROM public."EspecialidadesDBV"');
            } else {
                $pdo->exec('DELETE FROM especialidades');
            }
            $deleted = true;
        } catch (Exception $e2) {
            $err = $e2->getMessage();
        }
    }
    if ($deleted) {
        header("Location: especialidades.php?msg=deleted_all");
        exit;
    } else {
        header("Location: especialidades.php?msg=delete_all_error&err=" . urlencode($err));
        exit;
    }
}

// Resetar dados locais da tabela especialidades
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_all_local'])) {
    $ok = false;
    $err = '';
    try {
        $pdo->exec('TRUNCATE TABLE especialidades');
        $ok = true;
    } catch (Exception $e) {
        $err = $e->getMessage();
        try {
            $pdo->exec('DELETE FROM especialidades');
            $ok = true;
        } catch (Exception $e2) {
            $err = $e2->getMessage();
        }
    }
    if ($ok) {
        header("Location: especialidades.php?msg=deleted_local");
        exit;
    } else {
        header("Location: especialidades.php?msg=delete_local_error&err=" . urlencode($err));
        exit;
    }
}

// Renumerar IDs sequencialmente a partir de 1
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['reset_ids_seq'])) {
    $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    if ($driver === 'pgsql') {
        header("Location: especialidades.php?msg=ids_reset_error");
        exit;
    }
    $err = '';
    try {
        $pdo->beginTransaction();
        $pdo->exec("DROP TABLE IF EXISTS especialidades_tmp");
        $pdo->exec("CREATE TABLE especialidades_tmp LIKE especialidades");
        // Adicionar coluna auxiliar para mapear IDs antigos
        $pdo->exec("ALTER TABLE especialidades_tmp ADD COLUMN old_id INT");
        // Montar lista de colunas (exceto id)
        $colsStmt = $pdo->prepare("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'especialidades' AND COLUMN_NAME <> 'id' ORDER BY ORDINAL_POSITION");
        $colsStmt->execute();
        $cols = $colsStmt->fetchAll(PDO::FETCH_COLUMN);
        $list = implode(',', array_map(function($c){ return "`{$c}`"; }, $cols));
        // Reiniciar auto-increment e copiar dados com ordenação por id, guardando old_id
        $pdo->exec("ALTER TABLE especialidades_tmp AUTO_INCREMENT=1");
        $pdo->exec("INSERT INTO especialidades_tmp ({$list}, old_id) SELECT {$list}, id FROM especialidades ORDER BY id ASC");
        // Atualizar tabela de relacionamento para apontar para os novos IDs
        $pdo->exec("SET FOREIGN_KEY_CHECKS=0");
        $pdo->exec("UPDATE usuarios_especialidades ue JOIN especialidades_tmp et ON ue.especialidade_id = et.old_id SET ue.especialidade_id = et.id");
        // Substituir tabela original
        $pdo->exec("DROP TABLE especialidades");
        $pdo->exec("RENAME TABLE especialidades_tmp TO especialidades");
        $pdo->exec("SET FOREIGN_KEY_CHECKS=1");
        $pdo->commit();
        header("Location: especialidades.php?msg=ids_reset");
        exit;
    } catch (Exception $e) {
        $err = $e->getMessage();
        try { $pdo->exec("SET FOREIGN_KEY_CHECKS=1"); } catch (Exception $e2) {}
        if ($pdo->inTransaction()) { $pdo->rollBack(); }
        header("Location: especialidades.php?msg=ids_reset_error&err=" . urlencode($err));
        exit;
    }
}

// Função para upload de imagem
function uploadImage($file) {
    if ($file['error'] === UPLOAD_ERR_OK) {
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $new_name = uniqid() . "." . $ext;
        $destination = '../uploads/' . $new_name;
        if (move_uploaded_file($file['tmp_name'], $destination)) {
            return $new_name;
        }
    }
    return null;
}

// DELETE
if ($action == 'delete' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    // Buscar imagem para deletar
    $stmt = $pdo->prepare("SELECT imagem FROM especialidades WHERE id = ?");
    $stmt->execute([$id]);
    $img = $stmt->fetchColumn();
    
    $stmt = $pdo->prepare("DELETE FROM especialidades WHERE id = ?");
    if ($stmt->execute([$id])) {
        if ($img && file_exists('../uploads/' . $img)) {
            unlink('../uploads/' . $img);
        }
        header("Location: especialidades.php?msg=deleted");
        exit;
    } else {
        $error = "Erro ao excluir.";
    }
}

// SAVE (Insert/Update)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !isset($_POST['delete_all_supabase']) && !isset($_POST['delete_all_local']) && !isset($_POST['reset_ids_seq'])) {
    if (isset($_POST['import_supabase_csv'])) {
        $inserted = 0;
        $updated = 0;
        $skipped = 0;
        $importPublico = isset($_POST['import_publico_alvo']) ? $_POST['import_publico_alvo'] : 'Desbravador';
        try {
            if (!columnExists($pdo, 'especialidades', 'publico_alvo')) {
                $pdo->exec("ALTER TABLE especialidades ADD COLUMN publico_alvo VARCHAR(50) DEFAULT 'Desbravador'");
            }
        } catch (Exception $e) {}
        if (isset($_FILES['csv_file']) && $_FILES['csv_file']['error'] === UPLOAD_ERR_OK) {
            $tmp = $_FILES['csv_file']['tmp_name'];
            $fh = fopen($tmp, 'r');
            if ($fh) {
                $delims = [',',';','\t'];
                $header = null;
                $rows = [];
                foreach ($delims as $d) {
                    rewind($fh);
                    $header = fgetcsv($fh, 0, $d);
                    if ($header && count($header) >= 5) {
                        $rows = [];
                        while (($r = fgetcsv($fh, 0, $d)) !== false) { $rows[] = $r; }
                        break;
                    }
                }
                if ($header && $rows) {
                    $map = [];
                    foreach ($header as $i => $h) {
                        $key = trim(str_replace(['"',"'"], '', $h));
                        $map[strtolower($key)] = $i;
                    }
                    $pdo->beginTransaction();
                    
                    // Prepara gerador de IDs sequenciais
                    $maxIdStmt = $pdo->query("SELECT MAX(CAST(especialidade_id AS UNSIGNED)) FROM especialidades WHERE especialidade_id REGEXP '^[0-9]+$'");
                    $nextId = (int)$maxIdStmt->fetchColumn() + 1;
                    
                    $sel = $pdo->prepare("SELECT id FROM especialidades WHERE especialidade_id = ? AND area = ? AND publico_alvo = ?");
                    $ins = $pdo->prepare("INSERT INTO especialidades (especialidade_id, nome, requisitos, sigla, imagem, area, nivel, ano, origem, likes, cor, status, publico_alvo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
                    $upd = $pdo->prepare("UPDATE especialidades SET nome=?, requisitos=?, sigla=?, imagem=?, nivel=?, ano=?, origem=?, likes=?, cor=?, status=?, publico_alvo=? WHERE id=?");
                    foreach ($rows as $r) {
                        $get = function($name) use ($map, $r) {
                            $idx = $map[strtolower($name)] ?? null;
                            if ($idx === null) return null;
                            return isset($r[$idx]) ? trim($r[$idx]) : null;
                        };
                        
                        $ignoreIds = isset($_POST['ignore_ids']) && $_POST['ignore_ids'] == '1';
                        
                        $eid = $get('ID');
                        if ($ignoreIds || !$eid) {
                            $eid = str_pad($nextId, 3, '0', STR_PAD_LEFT);
                            $nextId++;
                        }
                        
                        $nome = $get('Nome');
                        $requisitos = $get('Questoes');
                        $sigla = $get('Sigla');
                        $imagem = $get('Imagem');
                        $area = $get('Categoria');
                        $nivel = $get('Nivel');
                        $ano = $get('Ano');
                        $origem = $get('Origem');
                        $like = $get('Like');
                        $cor = $get('Cor');
                        $corTexto = $get('CorTexto');
                        if ((!$cor || $cor === '') && $corTexto) {
                            $cor = $corTexto;
                        }
                        
                        // Normalização da Área (Categoria)
                        // Mapeia variações comuns para os nomes exatos esperados pelo site
                        $areaMap = [
                            'adra' => 'ADRA',
                            'artes e habilidades manuais' => 'Artes e Habilidades Manuais',
                            'atividades agricolas' => 'Atividades Agrícolas',
                            'atividades agrícolas' => 'Atividades Agrícolas',
                            'atividades missionarias' => 'Atividades Missionárias',
                            'atividades missionárias' => 'Atividades Missionárias',
                            'atividades missionarias e comunitarias' => 'Atividades Missionárias',
                            'atividades missionárias e comunitárias' => 'Atividades Missionárias',
                            'atividades profissionais' => 'Atividades Profissionais',
                            'atividades recreativas' => 'Atividades Recreativas',
                            'ciencia e saude' => 'Ciência e Saúde',
                            'ciência e saúde' => 'Ciência e Saúde',
                            'ensinos biblicos' => 'Ensinos Bíblicos',
                            'ensinos bíblicos' => 'Ensinos Bíblicos',
                            'estudo da natureza' => 'Estudo da Natureza',
                            'habilidades domesticas' => 'Habilidades Domésticas',
                            'habilidades domésticas' => 'Habilidades Domésticas'
                        ];
                        
                        $areaLower = mb_strtolower($area, 'UTF-8');
                        if (isset($areaMap[$areaLower])) {
                            $area = $areaMap[$areaLower];
                        }

                        $maxLenArea = columnMaxLength($pdo, 'especialidades', 'area');
                        if ($maxLenArea && mb_strlen($area, 'UTF-8') > $maxLenArea) {
                            // Preferir reduzir para uma categoria curta válida quando possível
                            if (strpos($area, 'Missionárias') !== false) {
                                $area = 'Atividades Missionárias';
                            } else {
                                $area = mb_substr($area, 0, $maxLenArea, 'UTF-8');
                            }
                        }

                        if (!$eid && !$nome) { $skipped++; continue; }
                        $likes = null;
                        if ($like !== null && $like !== '') {
                            $lv = strtolower($like);
                            $likes = ($lv === 'true' || $lv === '1') ? 1 : 0;
                        } else {
                            $likes = 0;
                        }
                        $status = 'ativo';
                        $anoNum = is_numeric($ano) ? (int)$ano : null;
                        
                        // Tenta encontrar pelo par ID + Área + Público Alvo
                        $sel->execute([$eid, $area, $importPublico]);
                        $existingId = $sel->fetchColumn();
                        
                        if ($existingId) {
                            $ok = $upd->execute([$nome, $requisitos, $sigla, $imagem, $nivel, $anoNum, $origem, $likes, $cor, $status, $importPublico, $existingId]);
                            if ($ok) $updated++; else $skipped++;
                        } else {
                            $ok = $ins->execute([$eid, $nome, $requisitos, $sigla, $imagem, $area, $nivel, $anoNum, $origem, $likes, $cor, $status, $importPublico]);
                            if ($ok) $inserted++; else $skipped++;
                        }
                    }
                    $pdo->commit();
                    header("Location: especialidades.php?msg=csv_import&ins={$inserted}&upd={$updated}&skp={$skipped}");
                    exit;
                }
            }
        }
        header("Location: especialidades.php?msg=csv_error");
        exit;
    }
    $id = isset($_POST['id']) ? (int)$_POST['id'] : null;
    $especialidade_id = isset($_POST['especialidade_id']) ? trim($_POST['especialidade_id']) : '';
    $nome = $_POST['nome'];
    $publico_alvo = isset($_POST['publico_alvo']) ? $_POST['publico_alvo'] : 'Desbravador';
    $area = $_POST['area'];
    $sigla = isset($_POST['sigla']) ? trim($_POST['sigla']) : '';
    $requisitos = $_POST['requisitos'];
    $ano = (int)$_POST['ano'];
    $status = $_POST['status'];
    $nivel = isset($_POST['nivel']) ? trim($_POST['nivel']) : '';
    $likes = isset($_POST['likes']) ? (int)$_POST['likes'] : 0;
    $origem = isset($_POST['origem']) ? trim($_POST['origem']) : '';
    $cor = isset($_POST['cor']) ? trim($_POST['cor']) : '';
    
    $imagem = null;
    if (isset($_FILES['imagem']) && $_FILES['imagem']['size'] > 0) {
        $imagem = uploadImage($_FILES['imagem']);
    }

    if ($id) {
        // Update
        $sql = "UPDATE especialidades SET especialidade_id=?, nome=?, publico_alvo=?, sigla=?, area=?, requisitos=?, ano=?, status=?, nivel=?, likes=?, origem=?, cor=?";
        $params = [$especialidade_id, $nome, $publico_alvo, $sigla, $area, $requisitos, $ano, $status, $nivel, $likes, $origem, $cor];
        
        if ($imagem) {
            $sql .= ", imagem=?";
            $params[] = $imagem;
            // Buscar imagem antiga para deletar (opcional, boa prática)
        }
        
        $sql .= " WHERE id=?";
        $params[] = $id;
        
        $stmt = $pdo->prepare($sql);
        if ($stmt->execute($params)) {
            header("Location: especialidades.php?msg=updated");
            exit;
        }
    } else {
        // Insert
        $sql = "INSERT INTO especialidades (especialidade_id, nome, publico_alvo, sigla, area, requisitos, ano, status, nivel, likes, origem, cor, imagem) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        if ($stmt->execute([$especialidade_id, $nome, $publico_alvo, $sigla, $area, $requisitos, $ano, $status, $nivel, $likes, $origem, $cor, $imagem])) {
            header("Location: especialidades.php?msg=created");
            exit;
        }
    }
}

require_once '../includes/admin_header.php';
?>

<h2>Gerenciar Especialidades</h2>

<?php if (isset($_GET['msg'])): ?>
    <div style="background: #d4edda; color: #155724; padding: 10px; margin-bottom: 20px; border-radius: 4px;">
        <?php 
            if ($_GET['msg'] == 'created') echo "Especialidade criada com sucesso!";
            if ($_GET['msg'] == 'updated') echo "Especialidade atualizada com sucesso!";
            if ($_GET['msg'] == 'deleted') echo "Especialidade excluída com sucesso!";
            if ($_GET['msg'] == 'deleted_all') echo "Todos os registros de EspecialidadesDBV foram excluídos.";
            if ($_GET['msg'] == 'deleted_local') echo "Tabela local de especialidades foi resetada.";
            if ($_GET['msg'] == 'csv_import') {
                $ins = isset($_GET['ins']) ? (int)$_GET['ins'] : 0;
                $upd = isset($_GET['upd']) ? (int)$_GET['upd'] : 0;
                $skp = isset($_GET['skp']) ? (int)$_GET['skp'] : 0;
                echo "CSV importado. Inseridos: {$ins}, Atualizados: {$upd}, Ignorados: {$skp}.";
            }
            if ($_GET['msg'] == 'csv_error') echo "Falha ao importar CSV.";
            if ($_GET['msg'] == 'ids_reset') echo "IDs renumerados a partir de 1.";
        ?>
    </div>
<?php endif; ?>
<?php if (isset($_GET['msg']) && $_GET['msg'] == 'delete_all_error'): ?>
    <div style="background: #fff3cd; color: #856404; padding: 10px; margin-bottom: 20px; border-radius: 4px;">
        Não foi possível excluir os registros de EspecialidadesDBV.
        <?php if (isset($_GET['err']) && $_GET['err']): ?>
            <div style="margin-top:8px; font-size:12px; color:#6c757d;">
                Motivo: <?php echo htmlspecialchars($_GET['err']); ?>
            </div>
        <?php endif; ?>
    </div>
<?php endif; ?>

<?php if ($action == 'add' || $action == 'edit'): ?>
    <?php
    $data = ['nome' => '', 'area' => '', 'requisitos' => '', 'ano' => date('Y'), 'status' => 'ativo', 'imagem' => ''];
    if ($action == 'edit' && isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM especialidades WHERE id = ?");
        $stmt->execute([(int)$_GET['id']]);
        $data = $stmt->fetch();
    }
    ?>
    <div class="form-container">
        <h3><?php echo $action == 'add' ? 'Nova Especialidade' : 'Editar Especialidade'; ?></h3>
        <form method="POST" enctype="multipart/form-data">
            <?php if ($action == 'edit'): ?>
                <input type="hidden" name="id" value="<?php echo $data['id']; ?>">
            <?php endif; ?>
            
            <div class="form-group">
                <label>ID da Especialidade</label>
                <input type="text" name="especialidade_id" class="form-control" value="<?php echo htmlspecialchars(isset($data['especialidade_id']) ? $data['especialidade_id'] : ''); ?>" required>
            </div>
            
            <div class="form-group">
                <label>Nome</label>
                <input type="text" name="nome" class="form-control" value="<?php echo htmlspecialchars($data['nome']); ?>" required>
            </div>
            
            <div class="form-group">
                <label>Público Alvo</label>
                <select name="publico_alvo" class="form-control">
                    <option value="Desbravador" <?php echo (isset($data['publico_alvo']) && $data['publico_alvo'] == 'Desbravador') ? 'selected' : ''; ?>>Desbravador</option>
                    <option value="Aventureiro" <?php echo (isset($data['publico_alvo']) && $data['publico_alvo'] == 'Aventureiro') ? 'selected' : ''; ?>>Aventureiro</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Categoria</label>
                <select name="area" class="form-control" required>
                    <?php 
                    $areas = ['ADRA', 'Artes e Habilidades Manuais', 'Atividades Agrícolas', 'Atividades Missionárias', 'Atividades Profissionais', 'Atividades Recreativas', 'Ciência e Saúde', 'Estudo da Natureza', 'Habilidades Domésticas'];
                    foreach($areas as $area) {
                        $selected = ($data['area'] == $area) ? 'selected' : '';
                        echo "<option value='$area' $selected>$area</option>";
                    }
                    ?>
                </select>
            </div>
            
            <div class="form-group">
                <label>Sigla</label>
                <input type="text" name="sigla" class="form-control" value="<?php echo htmlspecialchars(isset($data['sigla']) ? $data['sigla'] : ''); ?>">
            </div>
            
            <div class="form-group">
                <label>Nível</label>
                <select name="nivel" class="form-control">
                    <?php 
                        $niv = isset($data['nivel']) ? (string)$data['nivel'] : '';
                        $opts = ['' => 'Nulo', '1' => '1', '2' => '2', '3' => '3', '4' => '4', '5' => '5'];
                        foreach ($opts as $val => $lab) {
                            $sel = ($niv === $val) ? 'selected' : '';
                            echo "<option value=\"{$val}\" {$sel}>{$lab}</option>";
                        }
                    ?>
                </select>
            </div>
            
            <div class="form-group">
                <label>Ano</label>
                <input type="number" name="ano" class="form-control" value="<?php echo $data['ano']; ?>" required>
            </div>
            
            <div class="form-group">
                <label>Status</label>
                <select name="status" class="form-control">
                    <option value="ativo" <?php echo ($data['status'] == 'ativo') ? 'selected' : ''; ?>>Ativo</option>
                    <option value="inativo" <?php echo ($data['status'] == 'inativo') ? 'selected' : ''; ?>>Inativo</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Likes</label>
                <input type="number" name="likes" class="form-control" value="<?php echo htmlspecialchars(isset($data['likes']) ? $data['likes'] : 0); ?>" min="0">
            </div>
            
            <div class="form-group">
                <label>Imagem (Emblema)</label>
                <?php if ($data['imagem']): ?>
                    <div style="margin-bottom: 10px;">
                        <img src="../uploads/<?php echo $data['imagem']; ?>" width="100">
                    </div>
                <?php endif; ?>
                <input type="file" name="imagem" class="form-control" accept="image/*">
            </div>
            
            <div class="form-group">
                <label>Questões</label>
                <textarea name="requisitos" class="form-control" required><?php echo htmlspecialchars($data['requisitos']); ?></textarea>
            </div>
            
            <div class="form-group">
                <label>Origem</label>
                <select name="origem" class="form-control">
                    <?php 
                        $orig = isset($data['origem']) ? $data['origem'] : '';
                        $origens = [
                            '' => 'Nulo',
                            'Associação Geral' => 'Associação Geral',
                            'Divisão Sul-Americana' => 'Divisão Sul-Americana',
                            'Divisão Norte-Americana' => 'Divisão Norte-Americana',
                            'Divisão do Sul do Pacífico' => 'Divisão do Sul do Pacífico'
                        ];
                        foreach ($origens as $val => $lab) {
                            $sel = ($orig === $val) ? 'selected' : '';
                            echo "<option value=\"{$val}\" {$sel}>{$lab}</option>";
                        }
                    ?>
                </select>
            </div>
            
            <div class="form-group">
                <label>Cor da Categoria</label>
                <input type="text" name="cor" class="form-control" value="<?php echo htmlspecialchars(isset($data['cor']) ? $data['cor'] : ''); ?>" readonly>
            </div>
            
            <script>
            (function(){
                var select = document.querySelector('select[name="area"]');
                var cor = document.querySelector('input[name="cor"]');
                var sigla = document.querySelector('input[name="sigla"]');
                var map = {
                    'ADRA': '#070a51',
                    'Artes e Habilidades Manuais': '#0b699c',
                    'Atividades Agrícolas': '#7a3532',
                    'Atividades Missionárias': '#1f4b9a',
                    'Atividades Profissionais': '#ce0b0b',
                    'Atividades Recreativas': '#21741d',
                    'Ciência e Saúde': '#5b1b80',
                    'Estudo da Natureza': '#b5b5b8',
                    'Habilidades Domésticas': '#f09a07'
                };
                var mapSigla = {
                    'ADRA': 'AD',
                    'Artes e Habilidades Manuais': 'AHM',
                    'Atividades Agrícolas': 'AA',
                    'Atividades Missionárias': 'AM',
                    'Atividades Profissionais': 'AP',
                    'Atividades Recreativas': 'AR',
                    'Ciência e Saúde': 'CS',
                    'Estudo da Natureza': 'EN',
                    'Habilidades Domésticas': 'HD'
                };
                function updateColor(){ cor.value = map[select.value] || ''; }
                function updateSigla(){ 
                    var s = mapSigla[select.value] || ''; 
                    if (sigla) { sigla.value = s; }
                }
                select.addEventListener('change', updateColor);
                select.addEventListener('change', updateSigla);
                updateColor();
                updateSigla();
            })();
            </script>
            
            <button type="submit" class="btn-new">Salvar</button>
            <a href="especialidades.php" class="btn-back-standard" style="margin-left: 10px;">Voltar</a>
        </form>
    </div>

<?php else: ?>
    <!-- LISTAGEM -->
    <div style="display:flex; gap:10px; margin-bottom:10px;">
        <a href="especialidades.php?action=add" class="btn-new">+ Nova Especialidade</a>
        <form method="POST" onsubmit="return confirm('Tem certeza que deseja excluir TODOS os dados da tabela EspecialidadesDBV? Esta ação não pode ser desfeita.');">
            <input type="hidden" name="delete_all_supabase" value="1">
            <button type="submit" class="btn-delete">Excluir todos (Supabase)</button>
        </form>
        <form method="POST" onsubmit="return confirm('Tem certeza que deseja RESETAR a tabela local de especialidades?');">
            <input type="hidden" name="delete_all_local" value="1">
            <button type="submit" class="btn-delete">Resetar Especialidades (Local)</button>
        </form>
        <form method="POST" onsubmit="return confirm('Isso irá renumerar os IDs de todas as especialidades começando do 1. Deseja continuar?');">
            <input type="hidden" name="reset_ids_seq" value="1">
            <button type="submit" class="btn-delete">Renumerar IDs (começar do 1)</button>
        </form>
    </div>
    <div class="form-container" style="margin-bottom:16px;">
        <h3>Importar CSV (Supabase)</h3>
        <form method="POST" enctype="multipart/form-data">
            <input type="hidden" name="import_supabase_csv" value="1">
            <div class="form-group">
                <label>Arquivo CSV</label>
                <input type="file" name="csv_file" class="form-control" accept=".csv" required>
            </div>
            <div class="form-group">
                <label>Público Alvo para importação</label>
                <select name="import_publico_alvo" class="form-control">
                    <option value="Desbravador">Desbravador</option>
                    <option value="Aventureiro">Aventureiro</option>
                </select>
            </div>
            <div class="form-group" style="margin: 10px 0;">
                <input type="checkbox" name="ignore_ids" id="ignore_ids" value="1">
                <label for="ignore_ids" style="display:inline; font-weight:normal;">Ignorar IDs do CSV e criar novos (use se os IDs estiverem duplicados ou errados)</label>
            </div>
            <button type="submit" class="btn-new">Importar CSV</button>
        </form>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Imagem</th>
                <th>Público</th>
                <th>Nome</th>
                <th>Área</th>
                <th>Sigla</th>
                <th>Ano</th>
                <th>Nível</th>
                <th>Likes</th>
                <th>Ações</th>
            </tr>
        </thead>
        <tbody>
            <?php
            $stmt = $pdo->query("SELECT * FROM especialidades ORDER BY id DESC");
            while ($row = $stmt->fetch()):
            ?>
            <tr>
                <td><?php echo $row['id']; ?></td>
                <td>
                    <?php if ($row['imagem']): ?>
                        <img src="../uploads/<?php echo $row['imagem']; ?>" width="50" height="50" style="object-fit: contain;">
                    <?php else: ?>
                        -
                    <?php endif; ?>
                </td>
                <td><?php echo htmlspecialchars($row['publico_alvo'] ?? 'Desbravador'); ?></td>
                <td><?php echo htmlspecialchars($row['nome']); ?></td>
                <td><?php echo htmlspecialchars($row['area']); ?></td>
                <td><?php echo htmlspecialchars(isset($row['sigla']) ? $row['sigla'] : ''); ?></td>
                <td><?php echo $row['ano']; ?></td>
                <td><?php echo htmlspecialchars(isset($row['nivel']) ? $row['nivel'] : ''); ?></td>
                <td><?php echo htmlspecialchars(isset($row['likes']) ? $row['likes'] : 0); ?></td>
                <td class="actions">
                    <a href="especialidades.php?action=edit&id=<?php echo $row['id']; ?>" class="btn-edit">Editar</a>
                    <a href="especialidades.php?action=delete&id=<?php echo $row['id']; ?>" class="btn-delete" onclick="return confirm('Tem certeza que deseja excluir?')">Excluir</a>
                </td>
            </tr>
            <?php endwhile; ?>
        </tbody>
    </table>
<?php endif; ?>

<?php require_once '../includes/admin_footer.php'; ?>
