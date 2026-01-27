<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/conexao.php';

$driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
$tblQ = ($driver === 'pgsql') ? 'public."quiz_questoes"' : 'quiz_questoes';
$tblC = ($driver === 'pgsql') ? 'public."quiz_categorias"' : 'quiz_categorias';
$pdo->exec("CREATE TABLE IF NOT EXISTS quiz_resultados (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NULL, nome VARCHAR(255) NULL, pontos INT NOT NULL, total INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['save'])) {
    $score = isset($_POST['score']) ? (int)$_POST['score'] : 0;
    $total = isset($_POST['total']) ? (int)$_POST['total'] : 0;
    $uid = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
    $nome = isset($_SESSION['user_name']) ? $_SESSION['user_name'] : 'Convidado';
    $stmtS = $pdo->prepare("INSERT INTO quiz_resultados (user_id, nome, pontos, total) VALUES (?,?,?,?)");
    $stmtS->execute([$uid, $nome, $score, $total]);
    header('Content-Type: application/json');
    echo json_encode(['ok' => true]);
    exit;
}

$restart = isset($_GET['restart']);
// Se não houver conjunto em sessão OU se foi solicitado restart, tenta carregar 10 aleatórias
if (!isset($_SESSION['quiz_set']) || $restart) {
    try {
        $orderRand = ($driver === 'pgsql') ? 'ORDER BY random()' : 'ORDER BY RAND()';
        $stmt = $pdo->query("SELECT q.id, q.questao, q.opicao_1, q.opicao_2, q.opicao_3, q.opicao_4, q.opicao_correta, c.nome AS categoria FROM {$tblQ} q LEFT JOIN {$tblC} c ON c.id = q.categoria_id {$orderRand} LIMIT 10");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $_SESSION['quiz_set'] = $data;
    } catch (Exception $e) {
        $_SESSION['quiz_set'] = [];
    }
}
$set = isset($_SESSION['quiz_set']) ? $_SESSION['quiz_set'] : [];
// Caso tenha sido importado conteúdo após a sessão vazia, força recarregar se houver perguntas no banco
if (!$set) {
    try {
        $cnt = (int)$pdo->query("SELECT COUNT(*) FROM {$tblQ}")->fetchColumn();
        if ($cnt > 0) {
            $orderRand = ($driver === 'pgsql') ? 'ORDER BY random()' : 'ORDER BY RAND()';
            $stmt = $pdo->query("SELECT q.id, q.questao, q.opicao_1, q.opicao_2, q.opicao_3, q.opicao_4, q.opicao_correta, c.nome AS categoria FROM {$tblQ} q LEFT JOIN {$tblC} c ON c.id = q.categoria_id {$orderRand} LIMIT 10");
            $set = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $_SESSION['quiz_set'] = $set;
        }
    } catch (Exception $e) {}
}
?>
<a href="index.php?p=biblia" class="btn-back-standard">Voltar</a>
<h2>Quiz Bíblico</h2>
<?php if (!$set): ?>
    <div style="background:#fff3cd;color:#856404;padding:10px;border-radius:8px;max-width:780px;">
        Nenhuma questão encontrada. Importe CSV de questões no painel admin.
    </div>
<?php else: ?>
    <div id="quizApp" style="max-width:780px;">
        <div style="background:#0b1d42;color:#fff;border-radius:16px;padding:16px;box-shadow:0 6px 18px rgba(0,0,0,0.25);">
            <div style="display:flex;align-items:center;justify-content:space-between;">
                <div>Pergunta <span id="qIdx">1</span>/10</div>
                <div>Pontos: <span id="score">0</span></div>
            </div>
            <div style="height:8px;background:#ffffff22;border-radius:8px;margin-top:10px;overflow:hidden;">
                <div id="progressBar" style="height:8px;width:10%;background:#26a69a;border-radius:8px;"></div>
            </div>
        </div>
        <div id="card" style="background:#fff;border-radius:12px;padding:16px;margin-top:16px;box-shadow:0 4px 16px rgba(0,0,0,0.12);">
            <div id="cat" style="display:inline-block;background:#e9f2ff;color:#1e88e5;border-radius:10px;padding:6px 10px;font-size:12px;margin-bottom:10px;">Categoria</div>
            <div id="question" style="font-size:20px;font-weight:700;color:#222; margin-bottom:8px;">Questão</div>
            <div id="options"></div>
        </div>
        <div id="result" style="display:none;margin-top:16px;background:#e8f5e9;color:#2e7d32;border-radius:12px;padding:16px;">Resultado</div>
    </div>
    <script>
    (function(){
        var data = <?php echo json_encode($set, JSON_UNESCAPED_UNICODE); ?>;
        var idx = 0;
        var score = 0;
        var progressBar = document.getElementById('progressBar');
        var qIdx = document.getElementById('qIdx');
        var scoreEl = document.getElementById('score');
        var catEl = document.getElementById('cat');
        var qEl = document.getElementById('question');
        var optEl = document.getElementById('options');
        var resultEl = document.getElementById('result');

        function correctIndex(q){
            var raw = q.opicao_correta;
            var s = raw == null ? '' : String(raw).trim();
            var map = { 'A':1, 'B':2, 'C':3, 'D':4 };
            var up = s.toUpperCase();
            if (map[up]) return map[up];
            var n = parseInt(s, 10);
            if (!isNaN(n)) {
                if (n >= 0 && n <= 3) return n + 1;
                if (n >= 1 && n <= 4) return n;
            }
            var opts = [q.opicao_1, q.opicao_2, q.opicao_3, q.opicao_4];
            var idx = -1;
            for (var i = 0; i < opts.length; i++) {
                if ((opts[i] || '').trim() === s) { idx = i; break; }
            }
            if (idx >= 0) return idx + 1;
            return 1;
        }

        function renderQuestion() {
            var q = data[idx];
            qIdx.textContent = (idx+1);
            progressBar.style.width = ((idx+1)*10) + '%';
            catEl.textContent = q.categoria || 'Geral';
            qEl.textContent = q.questao;
            optEl.innerHTML = '';
            var opts = [q.opicao_1, q.opicao_2, q.opicao_3, q.opicao_4];
            var labels = ['A','B','C','D'];
            opts.forEach(function(text, i){
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.style.cssText = 'display:flex;align-items:center;gap:10px;width:100%;padding:12px;border-radius:12px;background:#f8f9fa;border:1px solid #e1e5ea;color:#333;margin:10px 0;cursor:pointer;text-align:left;';
                btn.innerHTML = '<span style="display:inline-flex;width:28px;height:28px;border-radius:50%;background:#e9eff6;color:#1e88e5;align-items:center;justify-content:center;font-weight:700;">'+labels[i]+'</span> '+ (text || '');
                btn.addEventListener('click', function(){ handleAnswer(i+1, btn); });
                optEl.appendChild(btn);
            });
        }

        var locked = false;
        function handleAnswer(choice, btn) {
            if (locked) return;
            locked = true;
            var correct = correctIndex(data[idx]);
            var buttons = optEl.querySelectorAll('button');
            buttons.forEach(function(b){ b.style.borderColor = '#e1e5ea'; b.style.background='#f8f9fa'; });
            if (choice === correct) {
                score += 10;
                btn.style.borderColor = '#2e7d32';
                btn.style.background = '#e8f5e9';
            } else {
                btn.style.borderColor = '#c62828';
                btn.style.background = '#ffebee';
                var correctBtn = buttons[correct-1];
                if (correctBtn) { correctBtn.style.borderColor = '#2e7d32'; correctBtn.style.background='#e8f5e9'; }
            }
            scoreEl.textContent = score;
            setTimeout(nextQuestion, 900);
        }

        function nextQuestion() {
            idx++;
            locked = false;
            if (idx >= data.length) {
                showResult();
            } else {
                renderQuestion();
            }
        }

        function showResult() {
            resultEl.style.display = 'block';
            resultEl.textContent = 'Você concluiu o quiz! Pontos: ' + score + ' de ' + (data.length*10);
            qEl.textContent = 'Fim';
            optEl.innerHTML = '';
            try {
                var fd = new FormData();
                fd.append('score', String(score));
                fd.append('total', String(data.length*10));
                fetch('index.php?p=biblia_quiz&save=1', { method: 'POST', body: fd }).then(function(){ 
                    var link = document.createElement('a');
                    link.href = 'index.php?p=biblia_quiz_ranking';
                    link.textContent = 'Ver ranking';
                    link.style.cssText = 'display:inline-block;margin-top:10px;color:#1e88e5;text-decoration:none;font-weight:600;';
                    resultEl.appendChild(link);
                }).catch(function(){});
            } catch(e){}
        }

        renderQuestion();
    })();
    </script>
<?php endif; ?>
