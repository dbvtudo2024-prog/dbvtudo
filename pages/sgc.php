<a href="index.php?p=desbravadores" class="btn-back-standard">Voltar</a>
<h2>Acesso ao SGC</h2>

<div class="card" style="max-width: 800px; margin: 0 auto;">
    <div class="card-body">
        <h3>Sistema de Gerenciamento de Clubes (SGC)</h3>
        <p>O SGC é a plataforma oficial para gerenciamento das atividades, membros e relatórios do Clube de Desbravadores.</p>
        <p>Através dele, a diretoria do clube pode:</p>
        <ul style="list-style: disc; margin-left: 20px; margin-bottom: 20px;">
            <li>Cadastrar e atualizar dados dos membros</li>
            <li>Registrar classes e especialidades concluídas</li>
            <li>Inscrever o clube em eventos e camporis</li>
            <li>Gerenciar o seguro anual</li>
            <li>Emitir relatórios para a Associação/Missão</li>
        </ul>
        
        <?php
        $stmt = $pdo->prepare("SELECT valor FROM configuracoes WHERE chave = 'link_sgc'");
        $stmt->execute();
        $link = $stmt->fetchColumn();
        ?>
        
        <?php if ($link): ?>
            <div style="text-align: center; margin-top: 30px;">
                <a href="<?php echo htmlspecialchars($link); ?>" target="_blank" class="btn-admin" style="background: #004d40; padding: 15px 30px; font-size: 18px;">Acessar SGC Agora</a>
            </div>
        <?php else: ?>
            <div style="text-align: center; margin-top: 30px; color: #d32f2f;">
                Link não configurado. Entre em contato com o administrador.
            </div>
        <?php endif; ?>
    </div>
</div>
