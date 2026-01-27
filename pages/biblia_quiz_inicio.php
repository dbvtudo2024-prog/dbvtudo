<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/conexao.php';
?>
<a href="index.php?p=biblia" class="btn-back-standard">Voltar</a>
<div style="background: linear-gradient(180deg, #1e3c72 0%, #2a5298 100%); color:#fff; border-radius:16px; padding:20px; box-shadow:0 6px 18px rgba(0,0,0,0.25); margin-bottom:14px;">
    <div style="display:flex; align-items:center; justify-content:space-between;">
        <div>
            <div style="font-size:22px; font-weight:800;">Quiz Bíblico</div>
            <div style="opacity:0.9; margin-top:4px;">Teste seus conhecimentos</div>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
            <span style="opacity:0.8;">❓</span>
        </div>
    </div>
</div>
<div style="max-width:900px; margin:0 auto; text-align:center;">
    <div style="width:120px; height:120px; border-radius:50%; background:#fbc02d33; color:#fbc02d; display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor"><path d="M15 18H9v-2h6v2zm1-11a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
    </div>
    <div style="font-weight:800; font-size:24px; margin-bottom:8px; color:#2c3e50;">Pronto para o Desafio?</div>
    <div style="color:#607d8b; margin-bottom:20px;">Responda 10 perguntas sobre a Bíblia e teste seus conhecimentos!</div>
    <div style="display:flex; gap:12px; justify-content:center;">
        <a href="index.php?p=biblia_quiz" class="btn-admin" style="border:2px solid #fbc02d; background:#fbc02d; color:#fff; border-radius:12px; padding:12px 18px;">Iniciar Quiz</a>
        <a href="index.php?p=biblia_quiz_ranking" style="border:2px solid #1e88e5; background:#fff; color:#1e88e5 !important; border-radius:12px; padding:12px 18px;">Ranking</a>
    </div>
</div>
