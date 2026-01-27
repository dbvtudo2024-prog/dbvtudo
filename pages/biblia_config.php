<?php
$prefVersao = isset($_SESSION['bible_version']) ? $_SESSION['bible_version'] : 'ARC';
$tema = isset($_SESSION['theme']) ? $_SESSION['theme'] : 'light';
$fontSize = isset($_SESSION['font_size']) ? (int)$_SESSION['font_size'] : 16;
$reminder = isset($_SESSION['daily_reminder']) ? (int)$_SESSION['daily_reminder'] : 0;
$chapterStyle = isset($_SESSION['chapter_style']) ? $_SESSION['chapter_style'] : 'texto';
if ($_SERVER['REQUEST_METHOD']==='POST') {
    if (isset($_POST['clear_all'])) {
        $uid = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
        $pdo->prepare("DELETE FROM biblia_favoritos WHERE user_id <=> ?")->execute([$uid]);
        $pdo->prepare("DELETE FROM biblia_notas WHERE user_id <=> ?")->execute([$uid]);
        $pdo->prepare("DELETE FROM biblia_reflexoes WHERE user_id <=> ?")->execute([$uid]);
        $pdo->prepare("DELETE FROM biblia_lidos WHERE user_id <=> ?")->execute([$uid]);
    } else {
        $_SESSION['bible_version'] = $_POST['versao'];
        $_SESSION['theme'] = $_POST['tema'];
        $_SESSION['font_size'] = (int)$_POST['font_size'];
        $_SESSION['daily_reminder'] = isset($_POST['reminder']) ? 1 : 0;
        $_SESSION['chapter_style'] = $_POST['chapter_style'];
        $prefVersao = $_POST['versao'];
        $tema = $_POST['tema'];
        $fontSize = (int)$_POST['font_size'];
        $reminder = isset($_POST['reminder']) ? 1 : 0;
        $chapterStyle = $_POST['chapter_style'];
    }
}
?>
<a href="index.php?p=biblia_mais" class="btn-back-standard">Voltar</a>
<h2>Configurações</h2>
<div class="form-container" style="max-width:640px;">
    <form method="POST">
        <div class="card" style="margin-bottom:12px;">
            <div class="card-body">
                <div style="font-weight:700; margin-bottom:8px;">Aparência</div>
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                    <div>
                        <div style="font-weight:600;">Modo Escuro</div>
                        <div style="font-size:12px; color:#777;">Alterna entre tema claro e escuro</div>
                    </div>
                    <label style="display:inline-flex; align-items:center; gap:8px;">
                        <input type="checkbox" name="tema" value="dark" <?php echo $tema==='dark'?'checked':''; ?> onclick="this.form.tema.value=this.checked?'dark':'light'">
                        <span><?php echo $tema==='dark'?'Ligado':'Desligado'; ?></span>
                        <input type="hidden" name="tema" value="<?php echo $tema; ?>">
                    </label>
                </div>
                <div>
                    <div style="font-weight:600;">Tamanho da Fonte</div>
                    <div style="font-size:12px; color:#777;">Ajuste a leitura da Bíblia</div>
                    <input type="range" name="font_size" min="14" max="24" value="<?php echo $fontSize; ?>" oninput="document.getElementById('fsVal').innerText=this.value+'px'" style="width:100%; margin-top:8px;">
                    <div id="fsVal" style="margin-top:6px;"><?php echo $fontSize; ?>px</div>
                </div>
            </div>
        </div>
        <div class="card" style="margin-bottom:12px;">
            <div class="card-body">
                <div style="font-weight:700; margin-bottom:8px;">Notificações</div>
                <div style="display:flex; align-items:center; justify-content:space-between;">
                    <div>
                        <div style="font-weight:600;">Lembrete Diário</div>
                        <div style="font-size:12px; color:#777;">Receba o versículo do dia</div>
                    </div>
                    <label style="display:inline-flex; align-items:center; gap:8px;">
                        <input type="checkbox" name="reminder" <?php echo $reminder? 'checked':''; ?>>
                        <span><?php echo $reminder? 'Ligado':'Desligado'; ?></span>
                    </label>
                </div>
            </div>
        </div>
        <div class="card" style="margin-bottom:12px;">
            <div class="card-body">
                <div style="font-weight:700; margin-bottom:8px;">Estilo de Capítulos</div>
                <select name="chapter_style" class="form-control">
                    <option value="texto" <?php echo $chapterStyle==='texto'?'selected':''; ?>>Exibir “Capítulo N”</option>
                    <option value="numero" <?php echo $chapterStyle==='numero'?'selected':''; ?>>Exibir apenas número</option>
                </select>
            </div>
        </div>
        <div class="card" style="margin-bottom:12px;">
            <div class="card-body">
                <div style="font-weight:700; margin-bottom:8px;">Dados</div>
                <button name="clear_all" value="1" class="btn-admin" style="background:#e53935; color:#fff; border:none; padding:10px 16px; border-radius:10px;">Limpar Todos os Dados</button>
                <div style="font-size:12px; color:#777; margin-top:6px;">Remove anotações, favoritos e progresso</div>
            </div>
        </div>
        <div class="card">
            <div class="card-body">
                <div style="font-weight:700; margin-bottom:8px;">Versão da Bíblia</div>
                <select name="versao" class="form-control">
                    <option value="ARC" <?php echo $prefVersao==='ARC'?'selected':''; ?>>Almeida Revista e Corrigida</option>
                    <option value="NVI" <?php echo $prefVersao==='NVI'?'selected':''; ?>>Nova Versão Internacional</option>
                    <option value="ARA" <?php echo $prefVersao==='ARA'?'selected':''; ?>>Almeida Revista e Atualizada</option>
                </select>
            </div>
        </div>
        <button class="btn-new" type="submit" style="margin-top:12px;">Salvar</button>
    </form>
</div>
