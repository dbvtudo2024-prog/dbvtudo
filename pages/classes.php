<a href="index.php?p=desbravadores" class="btn-back-standard">Voltar</a>
<h2>Classes</h2>
<p style="margin-bottom: 30px;">As classes dos desbravadores são agrupadas por idade e envolvem requisitos físicos, mentais e espirituais.</p>
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
$stmt = $pdo->query("SELECT * FROM classes WHERE publico_alvo = 'Desbravador' ORDER BY id ASC");
?>
<!-- Container Principal: Grid Responsivo para Cards Horizontais -->
<div style="
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
    gap: 20px; 
    padding: 20px 0;
">
    <?php while ($row = $stmt->fetch()): 
        // Helper para cor da classe (mesma lógica anterior ou aprimorada)
        $color = '#004aad'; // fallback
        if (function_exists('classColor')) {
            $color = classColor($row['nome']);
        }
    ?>
    
    <!-- Card Estilo 'Aspirante' Horizontal -->
    <a href="index.php?p=classe&id=<?php echo (int)$row['id']; ?>" style="
        display: flex; 
        align-items: center; 
        gap: 15px; 
        padding: 15px; 
        border-radius: 12px; 
        background: #fff; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.08); 
        text-decoration: none; 
        color: #333; 
        border-left: 8px solid <?php echo $color; ?>;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.12)';" 
       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)';">
        
        <!-- Ícone / Imagem (se houver, ou um placeholder baseado na cor) -->
        <div style="
            width: 50px; 
            height: 50px; 
            border-radius: 50%; 
            background-color: <?php echo $color; ?>20; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            flex-shrink: 0;
            overflow: hidden;
        ">
            <?php if (!empty($row['insignia'])): ?>
                <img src="uploads/<?php echo $row['insignia']; ?>" alt="<?php echo htmlspecialchars($row['nome']); ?>" style="width: 40px; height: 40px; object-fit: contain;">
            <?php else: ?>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="<?php echo $color; ?>">
                    <path d="M12 2L2 22h20L12 2z"/>
                </svg>
            <?php endif; ?>
        </div>

        <div style="display: flex; flex-direction: column;">
            <span style="font-weight: 700; font-size: 1.1rem; color: #2c3e50;">
                <?php echo htmlspecialchars($row['nome']); ?>
            </span>
            <?php if (!empty($row['idade_minima'])): ?>
            <span style="font-size: 0.85rem; color: #7f8c8d; margin-top: 2px;">
                Idade: <?php echo htmlspecialchars($row['idade_minima']); ?> anos
            </span>
            <?php endif; ?>
        </div>

        <!-- Seta indicativa no final -->
        <div style="margin-left: auto; color: #ccc;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
            </svg>
        </div>
    </a>
    <?php endwhile; ?>
</div>
