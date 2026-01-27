<?php
// Verificar se está logado
if (!isset($_SESSION['user_id'])) {
    echo '<div style="text-align:center; padding:50px;">
        <h2>Você precisa estar logado para acessar esta página.</h2>
        <a href="login.php" class="btn" style="background:#004d40; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Fazer Login</a>
    </div>';
    return;
}

$user_id = $_SESSION['user_id'];

// Processar AJAX de curtir/descurtir
if (isset($_POST['action']) && $_POST['action'] === 'toggle_like') {
    // Como estamos num include dentro do index.php, podemos processar e sair se for AJAX puro
    // Mas aqui vamos processar e recarregar ou usar JS.
    // Para simplificar, vou assumir que o JS vai chamar este mesmo arquivo via POST em um endpoint separado ou aqui mesmo com reload.
    // Melhor: Criar um script JS no final que faz fetch para um arquivo separado.
    // Mas como o usuário pediu "minha faixa", vamos focar na listagem primeiro.
}

// Buscar tipo do usuário (Desbravador/Aventureiro)
$stTipo = $pdo->prepare("SELECT tipo FROM usuarios WHERE id = ?");
$stTipo->execute([$user_id]);
$tipoUsuario = $stTipo->fetchColumn();
if (!$tipoUsuario) { $tipoUsuario = 'Desbravador'; }

// Buscar especialidades filtradas pelo público alvo conforme o tipo do usuário
$stmt = $pdo->prepare("SELECT * FROM especialidades WHERE status='ativo' AND publico_alvo = :tipo ORDER BY nome ASC");
$stmt->execute([':tipo' => $tipoUsuario]);
$especialidades = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Buscar especialidades que o usuário já tem
$stmt = $pdo->prepare("SELECT especialidade_id FROM usuarios_especialidades WHERE user_id = ?");
$stmt->execute([$user_id]);
$minhas = $stmt->fetchAll(PDO::FETCH_COLUMN);
$minhas_ids = array_flip($minhas); // Para busca rápida O(1)

?>

<div class="container" style="padding-top: 20px;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h2>Minha Faixa - Adicionar Especialidades</h2>
        <a href="index.php?p=perfil" class="btn-back-standard">Voltar</a>
    </div>
    <div style="text-align:right; margin-bottom:12px;">
        <span style="display:inline-block; padding:6px 10px; background:#eee; border-radius:14px; font-size:12px; color:#333;">
            Filtrando: <?php echo htmlspecialchars($tipoUsuario); ?>
        </span>
    </div>

    <div class="especialidades-grid">
        <?php foreach ($especialidades as $esp): ?>
            <?php 
                $tem = isset($minhas_ids[$esp['id']]);
                $btnText = $tem ? 'Remover' : 'Adicionar'; // Pode ser "Conquistei"
                $btnClass = $tem ? 'btn-remove' : 'btn-add';
                $cardClass = $tem ? 'esp-card conquistada' : 'esp-card';
            ?>
            <div class="esp-card" id="card-<?php echo $esp['id']; ?>" style="border:1px solid #ddd; border-radius:8px; padding:15px; text-align:center; background:white; position:relative;">
                <?php
                    $imgSrc = '';
                    if (!empty($esp['imagem'])) {
                        $img = $esp['imagem'];
                        if (strpos($img, 'http://') === 0 || strpos($img, 'https://') === 0) {
                            $imgSrc = $img;
                        } else {
                            $imgSrc = 'uploads/' . $img;
                        }
                    }
                ?>
                <?php if ($imgSrc): ?>
                    <img src="<?php echo htmlspecialchars($imgSrc); ?>" style="width:80px; height:80px; object-fit:contain; margin-bottom:10px;">
                <?php else: ?>
                    <div style="width:80px; height:80px; background:#eee; border-radius:50%; margin:0 auto 10px auto; display:flex; align-items:center; justify-content:center;">Sem img</div>
                <?php endif; ?>
                
                <h4 style="margin:5px 0; font-size:14px; min-height:40px; display:flex; align-items:center; justify-content:center;"><?php echo htmlspecialchars($esp['nome']); ?></h4>
                
                <button 
                    onclick="toggleEspecialidade(<?php echo $esp['id']; ?>, this)" 
                    class="btn-toggle-esp <?php echo $tem ? 'active' : ''; ?>"
                    style="width:100%; padding:8px; border:none; border-radius:4px; cursor:pointer; font-weight:bold; 
                           background-color: <?php echo $tem ? '#d32f2f' : '#2e7d32'; ?>; 
                           color: white; transition: background 0.3s;"
                    data-id="<?php echo $esp['id']; ?>"
                    data-status="<?php echo $tem ? '1' : '0'; ?>">
                    <?php echo $tem ? 'Remover' : 'Conquistei!'; ?>
                </button>
            </div>
        <?php endforeach; ?>
    </div>
</div>

<style>
    .especialidades-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 20px;
    }
    @media (max-width: 600px) {
        .especialidades-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
</style>

<script>
function toggleEspecialidade(id, btn) {
    const currentStatus = btn.getAttribute('data-status');
    const newStatus = currentStatus === '1' ? '0' : '1';
    
    // Feedback visual imediato
    btn.disabled = true;
    btn.style.opacity = '0.7';
    
    // Enviar requisição
    const formData = new FormData();
    formData.append('action', 'toggle_especialidade');
    formData.append('id', id);
    formData.append('status', newStatus);

    fetch('ajax_minha_faixa.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        btn.disabled = false;
        btn.style.opacity = '1';
        
        if (data.success) {
            if (newStatus === '1') {
                btn.textContent = 'Remover';
                btn.style.backgroundColor = '#d32f2f'; // Vermelho para remover
                btn.setAttribute('data-status', '1');
            } else {
                btn.textContent = 'Conquistei!';
                btn.style.backgroundColor = '#2e7d32'; // Verde para adicionar
                btn.setAttribute('data-status', '0');
            }
        } else {
            alert('Erro ao atualizar: ' + (data.message || 'Erro desconhecido'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        btn.disabled = false;
        btn.style.opacity = '1';
        alert('Erro de conexão');
    });
}
</script>
