export interface VersionRelease {
  version: string;
  date: string;
  tag?: 'NOVO' | 'ATUAL' | 'ESTÁVEL';
  title: string;
  changes: string[];
}

export const APP_VERSION = '3.0.97';
export const APP_BUILD_DATE = '7 de Outubro de 2026';

export const VERSION_HISTORY: VersionRelease[] = [
  {
    version: '3.0.97',
    date: '07/10/2026',
    tag: 'NOVO',
    title: 'Sincronização Automática em Nuvem Multi-Dispositivo (Celular ↔ PC) em Todo o App',
    changes: [
      'Sincronização Instantânea do Cantinho da Unidade (Celular ↔ PC): Agora os membros da unidade cadastrados no celular, o nome da unidade, conselheiro(a), chamadas de domingo e pontuações aparecem automaticamente quando você abre o aplicativo no PC (e vice-versa).',
      'Acampamento & Checklist de Mochila na Nuvem: Escalas de acampamento, cardápio da unidade e itens marcados na mochila são sincronizados em tempo real entre todos os seus aparelhos.',
      'Bíblia Sagrada, Minha Faixa, Favoritas e Quiz Sincronizados: Versículos marcados, anotações bíblicas, último capítulo lido, especialidades da faixa, conquistas, recordes do Quiz e rascunhos de provas acompanham sua conta tanto no celular quanto no computador.'
    ]
  },
  {
    version: '3.0.96',
    date: '06/10/2026',
    tag: 'ATUAL',
    title: 'Criar Prova Personalizada (Manual ou Tema IA), Criar Prova de Especialidade & Botões Compactos no Celular',
    changes: [
      'Adicionado tanto no Celular quanto no PC o botão "Criar Prova (Manual ou IA)", permitindo criar salas de prova ao vivo adicionando questões manualmente ou digitando qualquer tema para a IA gerar as questões.',
      'Botão de criação por catálogo renomeado para "Criar Prova de Especialidade" e botões da tela inicial de Prova Ao Vivo reduzidos em formato horizontal compacto para celular.',
      'Melhorias na tela de projeção (Telão): ocultação automática do QR Code e PIN ao iniciar a prova com destaque ao cronômetro, contador contínuo via Web Worker mesmo com navegador minimizado e lista de participantes fixa na lateral.'
    ]
  },
  {
    version: '3.0.95',
    date: '06/10/2026',
    tag: 'ATUAL',
    title: 'Navegação pelos Botões Laterais do Mouse & Zoom de Imagens nos Trunfos',
    changes: [
      'Adicionado suporte completo ao botão lateral "Voltar" do mouse para retornar páginas, sub-páginas (Bíblia, Especialidades, Classes, Cultura, Biblioteca, Treinamento) e fechar modais abertos sem sair do aplicativo.',
      'Adicionado o botão de ampliar imagem nos cards e no modal de detalhes dos Trunfos para visualização em tamanho expandido.',
      'Removidos os botões de editar e excluir da visualização de Trunfos, mantendo o gerenciamento centralizado apenas no Painel Administrativo.'
    ]
  },
  {
    version: '3.0.94',
    date: '06/10/2026',
    tag: 'ATUAL',
    title: 'Histórico de Provas Feitas para Usuários Logados no Aplicativo',
    changes: [
      'Adicionado o "Meu Histórico de Provas Feitas" exclusivo para quem está logado pelo aplicativo, sincronizado automaticamente na conta do usuário.',
      'Exibe todas as provas realizadas com especialidade, PIN da sala, data/horário, tempo gasto, saídas anti-cola, nota final e modal com o gabarito individual completo assim que o instrutor liberar o resultado.'
    ]
  },
  {
    version: '3.0.93',
    date: '06/10/2026',
    tag: 'ATUAL',
    title: 'Penalidade Automática de -0,1 Ponto por Saída de Tela na Prova Ao Vivo',
    changes: [
      'Cada saída de tela registrada pelo Sistema Anti-Cola aplica automaticamente uma penalidade de -0,1 ponto na nota final do aluno (e -1% no percentual equivalente).',
      'Exibição em tempo real do desconto acumulado no cabeçalho da prova do aluno, no alerta de bloqueio, no boletim final individual e no painel de monitoramento do instrutor.'
    ]
  },
  {
    version: '3.0.92',
    date: '06/10/2026',
    tag: 'ATUAL',
    title: 'Escolha Inicial no App (Criar Prova / Escanear QR Code no Celular) & Anti-Cola Mobile em Tempo Real',
    changes: [
      'Ao entrar na área de Prova Ao Vivo pelo aplicativo no celular, exibe primeiro os botões "Criar Prova" (vai para a área de criação) e "Escanear QR Code" (vai para a área da prova).',
      'A opção de ler/escanear QR Code com a câmera fica exclusiva para dispositivos móveis (celular).',
      'O botão e ação "Ver Resultado" nos cards dos participantes ficam ocultos enquanto a prova ainda não começou (status Aguardando).',
      'Reforço completo na detecção e envio de alertas Anti-Cola no celular (via sendBeacon, keepalive, WebSocket e reenvio automático ao retornar à janela, impedindo sobrescrita de bloqueios no servidor).'
    ]
  },
  {
    version: '3.0.91',
    date: '06/10/2026',
    tag: 'ATUAL',
    title: 'Prova Ao Vivo Exclusiva de Conselheiro+, Leitor de QR Code no App e Resultado Individual por Aparelho',
    changes: [
      'A criação e gerenciamento de salas de Prova Ao Vivo agora fica liberada exclusivamente para cargos de Conselheiro para cima (Conselheiro, Instrutor, Capelão, Secretário, Tesoureiro, Diretor, Distrital, Regional, Pastor e ADM).',
      'Adicionada a opção "Ler QR Code da Prova" com câmera integrada diretamente dentro do aplicativo para quem abrir pelo app escaneando o QR Code da sala.',
      'Ao clicar em "Liberar Resultado", o sistema envia e exibe automaticamente o resultado individual (nota final, acertos, desempenho e gabarito individual) de cada aluno diretamente no seu respectivo aparelho.'
    ]
  },
  {
    version: '3.0.90',
    date: '06/10/2026',
    tag: 'ATUAL',
    title: 'Botão Liberar Resultado Após Encerrar Prova & Card Clicável de Resultado',
    changes: [
      'Adicionado o botão "Liberar Resultado" no painel do instrutor após o encerramento da Prova Ao Vivo, permitindo liberar a nota final e o gabarito das questões na tela dos alunos no momento desejado.',
      'Todo o card do aluno na lista de quem está fazendo a prova (e o botão "Ver Resultado") agora pode ser clicado diretamente para abrir as respostas detalhadas da prova.'
    ]
  },
  {
    version: '3.0.89',
    date: '06/10/2026',
    tag: 'ATUAL',
    title: 'Sincronização Automática PC ↔ Celular do Instrutor Logado na Prova Ao Vivo',
    changes: [
      'Detecção automática do usuário/instrutor logado que criou a Prova Ao Vivo tanto no PC quanto no Celular.',
      'Sincronização bidirecional em tempo real entre PC e Celular: ao abrir ou gerenciar salas de prova no PC e alternar para o Celular (ou vice-versa), todas as provas abertas, aba selecionada, cronômetro, status da sala, alertas anti-cola e lista de alunos aparecem sincronizados automaticamente.'
    ]
  },
  {
    version: '3.0.88',
    date: '06/10/2026',
    tag: 'ATUAL',
    title: 'Múltiplas Provas Simultâneas & Painel em Tela Única com Lista Ao Vivo',
    changes: [
      'Suporte para abrir e gerenciar múltiplas salas de Prova Ao Vivo simultaneamente, com barra de abas no topo mostrando cada especialidade, PIN, quantidade de alunos e alertas anti-cola em tempo real.',
      'Layout da sala ao vivo remodelado em tela única (2 colunas lado a lado): QR Code, PIN, cronômetro e controles à esquerda, e a lista ao vivo de quem entrou na prova sempre visível à direita sem precisar rolar a página.'
    ]
  },
  {
    version: '3.0.87',
    date: '06/10/2026',
    tag: 'ATUAL',
    title: 'Opção de Abrir no App ou no Navegador via QR Code & Efeito da Logo com a Cor do Fundo',
    changes: [
      'Ao escanear o QR Code da Prova Ao Vivo, o sistema detecta automaticamente se o aluno possui o aplicativo DBV Tudo instalado no aparelho e exibe a opção de escolher entre "Abrir no Aplicativo DBV Tudo" ou "Abrir no Navegador Padrão".',
      'Caso a pessoa não possua o aplicativo instalado no dispositivo, a prova abre diretamente no navegador padrão sem etapas extras.',
      'O efeito luminoso de clique na logo do aplicativo agora acompanha dinamicamente a cor de realce/fundo selecionada.'
    ]
  },
  {
    version: '3.0.86',
    date: '06/10/2026',
    tag: 'ATUAL',
    title: 'Projeção do QR Code em Outra Tela (Telão da Igreja) & Ajustes na Prova Ao Vivo',
    changes: [
      'Adicionada opção "Projetar em Outra Tela (Telão)" ao ampliar o QR Code da prova no PC, abrindo uma janela dedicada e sincronizada em tempo real para o telão/projetor da igreja (2ª tela HDMI) enquanto o instrutor mantém o painel de monitoramento aberto.',
      'Modal "Ampliar QR" mantido no formato modal centralizado com o mesmo padrão horizontal em 2 colunas do modo Projetar, sem cortar informações.',
      'Subtítulo do cabeçalho na tela da avaliação simplificado para "Prova Ao Vivo" e remoção de referências externas nos títulos e selos.',
      'Sincronização em nuvem das salas de prova ao vivo reforçada via Supabase (com suporte a testes direto do Studio) e correção da digitação/teclado na entrada do aluno pelo celular.'
    ]
  },
  {
    version: '3.0.85',
    date: '06/10/2026',
    tag: 'ATUAL',
    title: 'Prova Ao Vivo de Especialidade com QR Code, Área Isolada e Sistema Anti-Cola',
    changes: [
      'Criação de Salas de Prova Ao Vivo para qualquer Especialidade com geração automática de questões (IA + requisitos oficiais), edição de perguntas e definição de tempo limite.',
      'Geração de QR Code e Código PIN de 6 dígitos que levam os alunos diretamente para uma Área Isolada de Prova em Tela Cheia (sem acesso aos menus do aplicativo).',
      'Sistema Anti-Cola em Tempo Real: detecta instantaneamente se o aluno minimizar a tela, trocar de aba ou sair da tela cheia, bloqueando a prova do aluno e disparando um alerta visual e sonoro imediato no painel do instrutor.',
      'Painel ao vivo do instrutor com lista em tempo real de todos que estão fazendo a prova, questão atual, progresso, nota final, histórico de alertas de cola e botão para liberar/inspecionar respostas.'
    ]
  },
  {
    version: '3.0.84',
    date: '05/10/2026',
    tag: 'ATUAL',
    title: 'Avanço Automático em 3s no Quiz + Opção de Clicar para a Próxima',
    changes: [
      'Adicionada no modal de configuração do Quiz a opção de escolher entre "Clicar p/ Próxima" (manual) e "Automático (3s)" (conta 3 segundos após a resposta e avança sozinho).',
      'Mesmo com o avanço automático de 3 segundos ativado, o botão "Próxima Pergunta" permanece visível e clicável com contador regressivo (3s, 2s, 1s) para quem desejar avançar imediatamente.'
    ]
  },
  {
    version: '3.0.83',
    date: '05/10/2026',
    tag: 'ATUAL',
    title: 'Novos Vídeos de Desbravadores & Permanência na Página ao Alternar Ministério no PC',
    changes: [
      'Adição de novos vídeos verificados para o Clube de Desbravadores nas categorias Tutorial de Especialidades (Temperança, Cactos, Sábado, Instrutor de Especialidades), Atividades e Jogos (Gincanas Partes 2, 3 e 4, Brincadeiras de Unidade) e Cerimônias (Admissão em Lenço e Investidura).',
      'No PC, ao clicar no botão do outro ministério na barra lateral, o aplicativo mantém a página/seção aberta alterando apenas o ministério; e ao clicar novamente no ministério já ativo, reseta e volta para a tela inicial do ministério.',
      'Correção da versão: diferenciação entre troca de ministério (mantém a página) e clique no ministério já selecionado (volta para a tela inicial do ministério).'
    ]
  },
  {
    version: '3.0.82',
    date: '05/10/2026',
    tag: 'ATUAL',
    title: 'Layout de Vídeos em Duas Colunas para PC e Compacto no Celular',
    changes: [
      'Manutenção do formato compacto das miniaturas 16:9 em 1 coluna para telas de celular e organização automática em 2 colunas lado a lado para PC/Desktop.'
    ]
  },
  {
    version: '3.0.81',
    date: '05/10/2026',
    tag: 'ATUAL',
    title: 'Acervo de Vídeos do Clube de Aventureiros (IASD) por Categoria',
    changes: [
      'Adição de vídeos verificados para o Clube de Aventureiros da IASD nas categorias Tutorial de Especialidades (Tabernáculo, Cortesia, Arte com Sombras, Flores), Atividades e Jogos e Cerimônias (Admissão em Lenço e Investidura).',
      'Miniaturas compactas 16:9 no estilo lista do YouTube tanto para Desbravadores quanto para Aventureiros.'
    ]
  },
  {
    version: '3.0.80',
    date: '05/10/2026',
    tag: 'ATUAL',
    title: 'Central de Vídeos Estilo YouTube com Miniaturas Reais',
    changes: [
      'Exibição da miniatura oficial 16:9 (thumbnail do YouTube) de todos os vídeos cadastrados, com selo de duração no canto inferior direito e botão Play central.',
      'Reorganização do layout em estilo YouTube mantendo as categorias originais (Tutorial de Especialidades, Atividades e Jogos, Cerimônias) com barra de filtros por categoria no topo, avatar do canal, título e contagem de visualizações.',
      'Lista de "Próximos Vídeos" com miniaturas na tela do reprodutor de vídeo.',
      'Correção da versão: importação do ícone Play na Central de Vídeos.'
    ]
  },
  {
    version: '3.0.79',
    date: '05/10/2026',
    tag: 'ATUAL',
    title: 'Materiais Gráficos Exclusivos com Emblemas Oficiais',
    changes: [
      'Seção Materiais Gráficos simplificada para exibir exclusivamente os Emblemas Oficiais de Desbravadores (D1 a D5 e L1 a L3) e Aventureiros (A1 a A5 e L A1) em CorelDRAW (.CDR e vetor).',
      'Removidos os demais itens extras (guias, manuais e bandeiras) da categoria Materiais Gráficos.'
    ]
  },
  {
    version: '3.0.78',
    date: '05/10/2026',
    tag: 'ATUAL',
    title: 'Círculos de Cores de Realce Mais Compactos, Fundo do Container em Modo Claro & Visibilidade dos Fios no Modo Claro',
    changes: [
      'Redução adicional do tamanho das esferas de seleção em "Cores de Realce" (24px) com anel de seleção proporcional.',
      'Correção do fundo do sub-container "Cores de Realce" no Modo Claro (fundo claro com brilho suave da cor selecionada e texto escuro nítido, eliminando o degradê escuro metade preto/metade bege).',
      'Ajuste de contraste do quadriculado de fios no Modo Claro para que os fios permaneçam visíveis e suaves tanto no tema claro quanto no tema escuro.'
    ]
  },
  {
    version: '3.0.77',
    date: '05/10/2026',
    tag: 'ESTÁVEL',
    title: 'Refinamento do Quadriculado de Fios, Botões de Cores de Realce Compactos & Preservação da Faixa e Bolso no Perfil',
    changes: [
      'Suavização da intensidade do quadriculado de fios do fundo para um efeito visual ainda mais delicado.',
      'Redução do tamanho dos botões circulares de seleção em "Cores de Realce" conforme o layout de referência.',
      'Blindagem das cores oficiais da Faixa Verde-Petróleo e do Bolso do Uniforme no Perfil para que não sofram qualquer alteração ao mudar a Cor de Realce ou o Modo Escuro.'
    ]
  },
  {
    version: '3.0.76',
    date: '05/10/2026',
    tag: 'ESTÁVEL',
    title: 'Cores de Realce com Fundo Radial Central, Quadriculado de Fios Suave & Separação Estrita DBV/AVT',
    changes: [
      'Adição do seletor "Cores de Realce" (Âmbar Dourado, Coral Terracota, Turquesa Real e Verde Sálvia) dentro do container de Modo Escuro em Ajustes, aplicando fundo em círculo começando do centro e dissipando até as bordas, acompanhado de um quadriculado de fios bem suave e mudança dinâmica da cor dos textos em destaque em todo o aplicativo.',
      'Separação 100% estrita de todos os Formulários, Fichas de Atividades, Certificados, Materiais Gráficos, Trunfos e referências entre a área de Desbravadores (DBV) e a área de Aventureiros (AVT), garantindo que cada ministério exiba exclusivamente seus próprios documentos e conteúdos oficiais.'
    ]
  },
  {
    version: '3.0.75',
    date: '04/10/2026',
    tag: 'ESTÁVEL',
    title: 'Edição de Dias, Adição de Novos Dias/Refeições, Prato Principal em 2 Linhas e Suco & Frutas no Acampamento',
    changes: [
      'Adição de gerenciador completo de Dias e Refeições na aba Cardápio & Escala de Acampamento (Cantinho da Unidade): permite filtrar por dia, renomear um dia inteiro ou editar o dia/título diretamente em cada card, adicionar novos dias completos (com Desjejum, Almoço e Jantar) e adicionar ou remover refeições avulsas.',
      'Ampliação do campo de Prato Principal / Cardápio para 2 linhas de texto visíveis e inclusão do campo dedicado de Suco Natural e Frutas em todas as refeições do acampamento (incluindo na exportação para o WhatsApp).'
    ]
  },
  {
    version: '3.0.74',
    date: '04/10/2026',
    tag: 'ESTÁVEL',
    title: 'Correção do Quiz de Especialidades de Aventureiros no Celular e PC',
    changes: [
      'Correção da consulta leve da tabela EspecialidadesAVT no Supabase (que não possui as colunas Nivel e Ano existentes apenas em EspecialidadesDBV), destravando o carregamento imediato das 125 especialidades oficiais de Aventureiros.',
      'Normalização automática da especialidade de Astronomia (AR-003) dos Aventureiros para garantir seu emblema oficial e sua área ("Atividades Recreativas") corretamente no filtro do Quiz.',
      'Recarregamento automático sob demanda ao iniciar o desafio "Qual é esta Especialidade?" caso a conexão móvel oscile.'
    ]
  },
  {
    version: '3.0.73',
    date: '04/10/2026',
    tag: 'ESTÁVEL',
    title: 'Centralização do Modal do Quiz na Tela (Portal Viewport)',
    changes: [
      'Correção da renderização do Modal de Configuração da Partida no Quiz (utilizando React Portal direto no body com z-index 9999), garantindo que o modal apareça sempre centralizado exatamente na tela visível do celular ou PC, sem precisar rolar a página.'
    ]
  },
  {
    version: '3.0.72',
    date: '04/10/2026',
    tag: 'ESTÁVEL',
    title: 'Botões Compactos no Quiz com Modal de Configuração & Correção de Layout no Cantinho da Unidade',
    changes: [
      'Botões das modalidades do Quiz e Simulado reorganizados em formato horizontal compacto para celular, reduzindo a altura dos cartões.',
      'Abertura de modal dedicado ao clicar em qualquer modalidade do Quiz com todos os controles de partida (Rodadas 5Q/10Q/15Q, Tempo por Questão 15s/25s/40s, campo de foco para IA, botão Iniciar Desafio e botão Simulado IA).',
      'Correção do layout responsivo do bloco "Cadastrar Membro na Unidade" no Cantinho da Unidade para que o seletor de função e o botão "+ Adicionar" fiquem 100% contidos dentro do card no celular sem sair da tela.'
    ]
  },
  {
    version: '3.0.71',
    date: '04/10/2026',
    tag: 'ESTÁVEL',
    title: 'Botões Horizontais Compactos, Emblemas Oficiais em CorelDRAW (IASD) & Certificados Personalizáveis',
    changes: [
      'Reorganização horizontal dos botões principais no celular (Bíblia Sagrada, Classes e Especialidades) e dos botões da área de Treinamento em Campo (Quiz e Simulado, Cantinho & Acamp., Guia de Campo e Ordem Unida), reduzindo significativamente a altura dos botões e removendo a palavra "Acessar".',
      'Adição da Central de Emblemas Oficiais no formato CorelDRAW (.CDR / .SVG / .EPS) em Materiais Gráficos, incluindo os pacotes oficiais abertos do Portal da IASD (downloads.adventistas.org) e download individual em curvas dos emblemas D1, D2, D3, D4, D5, L1, L2, L3, Bandeira DBV, A1, A2, A3, A4, A5, L A1 e Bandeira AVT.',
      'Implementação de Modelo Padrão Oficial e Personalizador de Certificados na hora de baixar: exibe o padrão oficial e permite personalizar com o Nome do Clube, Associação/Missão, Classe/Especialidade, Nome do Investido, Cidade/Data e Diretor(a), gerando o arquivo em PDF A4 Paisagem ou PNG de alta resolução.'
    ]
  },
  {
    version: '3.0.70',
    date: '04/10/2026',
    tag: 'ESTÁVEL',
    title: 'Sinais de Pista Oficiais (29 Sinais), Acervo de 45 Formulários DSA & Créditos Oficiais',
    changes: [
      'Atualização completa de Sinais de Pista no Guia de Campo com os 19 sinais fiéis à Tabela Oficial (Começo do jogo, Siga nesta direção, Volte ao ponto de partida, Diminuir a marcha, Apressar o passo, Caminho a evitar, Objeto escondido a 3 passos, Obstáculo a transpor, Perigo, Dividir o grupo, Virar à direita/esquerda, Seguir em frente, Reunir o grupo, Acampamento nessa direção, Siga rapidamente, Grupo dividido 2 e 3, Água potável e Água não potável) + 10 sinais verificados de Pioneiria, Pedras e Capim e quadro de regras de distância na trilha.',
      'Preenchimento de Biblioteca → Materiais → Formulários com 45 documentos oficiais do Ministério de Desbravadores e Aventureiros (DSA), organizados nas 4 categorias: Fichas de Atividades (13 cadernos de classes regulares, avançadas, agrupadas e líder), Formulários (12 fichas de inscrição, ficha médica, autorizações ECA/LGPD, caderneta da unidade e inspeção), Certificados (13 certificados de investidura de classes, especialidades, mestrados e ano bíblico) e Materiais Gráficos (7 manuais de identidade visual, bandeiras, emblemas e folders).',
      'Inclusão de filtros por Ministério (Todos, Desbravadores DSA e Aventureiros DSA) e barra de pesquisa rápida em Formulários, além de acesso liberado também no modo Aventureiros.',
      'Adição de rodapés de Créditos e Fontes Oficiais em todas as novas áreas (Treinamento em Campo, Guia de Campo, Ordem Unida, Cantinho da Unidade & Acampamento, Quiz e Simulado, Trunfos, Formulários) e no programa Desbrava+.'
    ]
  },
  {
    version: '3.0.69',
    date: '04/10/2026',
    tag: 'ESTÁVEL',
    title: 'Central Treinamento em Campo, 30 Trunfos Bordados, Libras Brasileira Oficial & Posições de Ordem Unida',
    changes: [
      'Criação do botão unificado "Treinamento em Campo" na tela principal agrupando Quiz e Simulado, Cantinho & Acamp., Guia de Campo e Ordem Unida, eliminando a aba duplicada de Ordem Unida dentro do Guia de Campo.',
      'Botão de acionamento do menu flutuante nas áreas práticas redesenhado para exibir apenas uma seta discreta e compacta no rodapé.',
      'Atualização do acervo de Trunfos com 30 imagens reais dos emblemas bordados oficiais (todos os 6 Camporis Sul-Americanos da DSA, Camporis de União UCB/UNeB/UNB/USB/UCOB, Associações, Aventuris e Dias Mundiais).',
      'Substituição completa do alfabeto manual e números pelo Alfabeto Manual Brasileiro de Libras oficial (A a Z, Ç e 0 a 9), corrigindo as letras M (3 dedos apontados para baixo), N (2 dedos apontados para baixo) e demais configurações.',
      'Adição de ilustrações visuais para cada uma das 22 posições de Ordem Unida (no seletor do treinador de voz, nos cards e com ampliação em tela cheia) e suporte a rolagem pelo mouse (roda do mouse + arraste) em todos os menus horizontais no PC.',
      'Remoção da barra e botão voltar duplicados na visualização de detalhes do programa Desbrava+.'
    ]
  },
  {
    version: '3.0.68',
    date: '04/10/2026',
    tag: 'ESTÁVEL',
    title: 'Acervo Oficial Desbrava+ (16 e 17 Anos DSA), Revisão de Manuais e Quiz Limpo',
    changes: [
      'Adição do acervo oficial do Programa Desbrava+ (16 e 17 anos - DSA) na seção Desbrava+, com guias completos, diretrizes do Manual Administrativo, Curso de Treinamento de Diretoria (10h) e checklists interativos para Nível 1 (16 anos) e Nível 2 (17 anos).',
      'Revisão técnica completa de Ordem Unida, Cantinho da Unidade e Quiz segundo os Manuais Oficiais da DSA ("Para o Voto, Posição!", sinais de apito regulamentares, ângulo de 45° na posição de Sentido e todos os cargos oficiais da Unidade).',
      'Limpeza visual da área de perguntas nos Quizzes, mantendo apenas o enunciado da questão (e a insígnia no modo de Especialidades) sem ícones ou selos extras.',
      'Ocultação completa do menu flutuante inferior na página de Histórico de Atualizações no celular.'
    ]
  },
  {
    version: '3.0.67',
    date: '04/10/2026',
    tag: 'ESTÁVEL',
    title: 'Nova Seção de Atividades & Campo, Quiz 2 Colunas no PC e Menu Flutuante Recolhível',
    changes: [
      'Nova seção dedicada "Atividades & Campo" na tela principal reunindo Quiz e Simulado, Cantinho da Unidade, Manual de Campo e Ordem Unida (removendo Cantinho e Ordem Unida da aba Gerenciar).',
      'Menu flutuante inferior oculto por padrão nas novas áreas, com ícone discreto no rodapé para ativá-lo ou recolhê-lo quando desejar.',
      'Tela inicial do Quiz e Simulado com rolagem liberada e espaçamento amplo para leitura confortável.',
      'Remodelação das arenas de perguntas do Quiz no computador em 2 colunas: ilustração/insígnia e enunciado à esquerda, e alternativas com ações à direita.'
    ]
  },
  {
    version: '3.0.66',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Histórico na Área Útil do PC, Cabeçalho Mobile Limpo & Logo DBV à Esquerda',
    changes: [
      'Histórico de Atualizações integrado diretamente à área útil do programa no computador, mantendo o menu lateral ativo e visível.',
      'Cabeçalho para celular da tela de Atualizações simplificado (apenas botão voltar, título enxuto, versão atual e botão compacto de verificação).',
      'Posicionamento da logo dos Desbravadores ajustado para o lado esquerdo do botão DBV no menu flutuante inferior.'
    ]
  },
  {
    version: '3.0.65',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Módulo Dedicado "Ordem Unida" no Acesso Rápido com Simulador de Vozes e 8 Evoluções',
    changes: [
      'Botão dedicado "Ordem Unida (Vozes, Marcha, Apito e Evoluções)" adicionado diretamente ao Acesso Rápido e ao menu Gerenciar.',
      'Treinador Prático das 3 Etapas da Voz de Comando (1. Voz de Advertência, 2. Comando Propriamente Dito, Pausa de 2 Tempos e 3. Voz de Execução) com simulação sonora e visual passo a passo.',
      'Metrônomo Sonoro de Cadência com seletor entre Passo Ordinário (116 BPM) e Passo Acelerado (180 BPM) marcando Pé Esquerdo e Pé Direito.',
      '22 Comandos a Pé Firme e em Marcha (Manual DSA), 8 Sinais de Apito com reprodução de áudio, 6 Gestos Visuais de Comando para Líderes e 8 Roteiros Ilustrados de Evoluções para Apresentações.'
    ]
  },
  {
    version: '3.0.64',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Botão de Acesso em Ajustes e Página Completa com Todos os Dados das Atualizações',
    changes: [
      'Substituição da lista recolhível (dropdown) dentro do modal de Ajustes por um botão direto ("Histórico de Versões & Modificações • Ver Página").',
      'Nova página dedicada em tela cheia exibindo todos os dados das atualizações: painel de estatísticas (Versão Atual, Data de Publicação, Versões Lançadas e Total de Melhorias), barra de pesquisa por número/data/recurso, botão para buscar atualização e linha do tempo completa de todas as versões.'
    ]
  },
  {
    version: '3.0.63',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Alerta de Nova Versão Compacto e Direto',
    changes: [
      'Redução e simplificação do card de alerta de atualização no topo da tela, exibindo apenas "Nova versão" com a numeração, o link direto para ver as novidades em Ajustes > Histórico de Versões e os botões "Depois" e "Atualizar".'
    ]
  },
  {
    version: '3.0.62',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Guia de Ordem Unida e Vozes de Comando (Padrão Manual DSA)',
    changes: [
      'Vozes de Comando: Explicação detalhada das 3 etapas oficiais (Voz de Advertência, Comando Propriamente Dito e Voz de Execução) com regras de entonação e cadência oficial (116 passos/min em marcha e 180 passos/min em acelerado).',
      'Comandos a Pé Firme e em Marcha: 15 comandos oficiais do Manual de Ordem Unida da DSA com divisão silábica exata da voz de comando, passo a passo técnico de execução e erros comuns a evitar.',
      'Sinais de Apito (com Áudio) e Gestos de Comando: 7 comandos acústicos de apito (silvos curtos e longos reproduzidos em áudio pelo celular/PC) e 6 gestos visuais de braço para formações silenciosas (Colunas, Linha/Fileira, Ferradura/U, Círculo, Alto e Acelerado).',
      'Ideias de Evoluções para Apresentações: 6 roteiros coreográficos ilustrados para Camporis e Dia do Desbravador (Cruzamento em X, Moinho de 4 Pontas, Efeito Dominó/Onda, Triângulo Oficial DBV, Abertura em Espelho e Quadrado Fantasma).'
    ]
  },
  {
    version: '3.0.61',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Centralização Instantânea dos Modais de Letras, Números e Nós na Tela Atual',
    changes: [
      'Renderização dos modais de ampliação (Código Semáfora, Alfabeto/Números em Libras e Zoom 3D dos Nós) diretamente no centro da tela visível (via React Portal), sem precisar rolar a página para encontrá-los.'
    ]
  },
  {
    version: '3.0.60',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Alfabeto Completo (A–Z) e Números (0–9) no Código Semáfora',
    changes: [
      'Código Semáfora (Números 0 a 9 + Sinal Numérico #): Adição da tabela completa de números em Semáfora (0 a 9 com correspondência às posições A–I e K, mais o Sinal Numérico # e o Sinal de Espaço/Descanso).',
      'Código Semáfora (Alfabeto Completo A a Z): Adição da tabela visual de referência com todas as 26 letras do alfabeto internacional em Semáfora.',
      'Tradução e Ampliação em Semáfora: O tradutor e animador instantâneo agora suporta letras e números digitados, e clicar em qualquer letra ou número abre um modal ampliado com a descrição exata da posição dos braços.'
    ]
  },
  {
    version: '3.0.59',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Correção da Lista de Números e Expressões em Libras no Guia de Campo',
    changes: [
      'Correção da estrutura de dados de Números em Libras (0 a 9) e Expressões Mais Usadas em Libras para evitar erro ao abrir o Guia de Campo.'
    ]
  },
  {
    version: '3.0.58',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Nós Oficiais das Classes em 3D e Guia de Números e Expressões em Libras',
    changes: [
      'Nós e Amarras das Classes em 3D: Exibição limpa focada apenas nas imagens 3D de alta definição (com crédito a Knots 3D e sem links externos), trazendo exatamente os 22 nós e amarras oficiais dos cartões das Classes (14 de Amigo, 9 de Companheiro e 6 de Pesquisador a Guia).',
      'Números em Libras (0 a 9): Guia ilustrado completo dos algarismos de 0 a 9 em Libras com imagem da configuração da mão, posição dos dedos e tradução visual instantânea de números digitados.',
      'Expressões Mais Usadas em Libras: Adição de 24 sinais e frases práticas em Libras divididas em Cumprimentos, Desbravadores e Clube, Acampamento e Emergência, e Perguntas e Diálogo.'
    ]
  },
  {
    version: '3.0.57',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Nós em 3D (Knots 3D & Animated Knots), Alfabeto Libras Ilustrado e 27 Sinais de Pista',
    changes: [
      'Nós e Amarras em 3D: Renderizações 3D de alta definição e integração interativa ao vivo com Knots3D.com (rotação 360°, play/pause e espelhamento) e AnimatedKnots.com para 16 nós e amarras oficiais.',
      'Alfabeto em Libras Ilustrado (A a Z): Imagens vetoriais da configuração exata da mão para cada letra digitada no tradutor e tabela visual completa de A a Z com ampliação.',
      'Catálogo Expandido de Sinais de Pista: 27 sinais de pista oficiais divididos em 4 categorias (Direção e Navegação, Perigo e Obstáculos, Água e Acampamento, Mensagens e Equipe) com instruções de como montá-los na trilha.'
    ]
  },
  {
    version: '3.0.56',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Imagens Reais de Nós e Amarras com Zoom e Botão Único "Guia de Campo"',
    changes: [
      'Substituição dos diagramas esquemáticos por fotografias e ilustrações reais de cada nó e amarra (Nó Direito, Cirurgião, Lais de Guia em 4 etapas, Volta do Fiel, Escota, Catau, Pescador, Prusik e Amarras Quadrada, Diagonal, Paralela e Tripé) com opção de ampliar imagem em tela cheia.',
      'Unificação dos 3 botões finais em um único botão "Guia de Campo (Nós, Códigos e Socorros)" no Acesso Rápido.'
    ]
  },
  {
    version: '3.0.55',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Passo a Passo de Nós e Amarras, Tradutor de Códigos e Guia de Primeiros Socorros',
    changes: [
      'Passo a Passo de Nós e Amarras: Guia visual separado por Classe (Amigo a Guia) com diagramas passo a passo de nós básicos e amarras de pioneiria (Quadrada, Diagonal, Paralela e Tripé), utilidade prática e marcação de nós dominados.',
      'Tradutor e Guia de Códigos: Tradução instantânea da palavra digitada em Código Morse (com emissão de apito sonoro e sinal luminoso piscando a tela), Código Semáfora animado, Alfabeto Libras e tabela de Sinais de Pista para trilhas.',
      'Guia Rápido de Primeiros Socorros e Peçonhentos: Cartões de consulta rápida sobre bandagens, transporte de acidentados, queimaduras, engasgo (Heimlich), picadas de animais peçonhentos e plantas tóxicas.'
    ]
  },
  {
    version: '3.0.54',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Ajustes de Layout no PC, Exclusão de Datas de Domingo e Reordenação de Botões',
    changes: [
      'Formulário "Cadastrar Membro na Unidade" posicionado no topo da aba Cantinho com largura total (100%), corrigindo o corte do botão Adicionar no computador.',
      'Campo de nome da unidade iniciando vazio para preenchimento personalizado.',
      'Botão de exclusão (X) em cada data de reunião de domingo para remover facilmente domingos adicionados.',
      'Novas funções (Quiz e Simulado, Cantinho & Acampamento) posicionadas ao final da lista de botões de Acesso Rápido e Gerenciar.'
    ]
  },
  {
    version: '3.0.53',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Lista de Membros Limpa no Cantinho da Unidade',
    changes: [
      'A lista de membros do Cantinho da Unidade agora inicia vazia, permitindo que o conselheiro, capitão ou secretário cadastre diretamente os desbravadores/aventureiros reais da unidade sem precisar apagar nomes de exemplo.'
    ]
  },
  {
    version: '3.0.52',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Melhoria Visual do Menu Mobile no Cantinho da Unidade e Acampamento',
    changes: [
      'Novo design dos 3 botões de navegação (Cantinho / Chamada & Pontos, Acampamento / Escala & Cardápio e Mochila / Checklist) com ícone em destaque, título e subtítulo completos sem corte de texto no celular.'
    ]
  },
  {
    version: '3.0.51',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Ampliação da Insígnia da Especialidade e Ajuste de Borda das Modalidades no Quiz',
    changes: [
      'Aumento expressivo do tamanho da imagem da insígnia no desafio "Qual é esta Especialidade?" (no jogo e no gabarito final) para facilitar a visualização dos detalhes.',
      'Correção do recorte lateral no botão selecionado da grade de modalidades no celular utilizando borda interna (ring-inset) e respiro lateral.'
    ]
  },
  {
    version: '3.0.50',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Cantinho da Unidade e Acampamento (Para Conselheiros, Capitães e Secretários)',
    changes: [
      'Pontuação do Cantinho da Unidade: Caderneta digital de domingo para registrar presença, pontualidade, Bíblia, uniforme e mensalidade de cada membro, com ranking acumulado e envio de relatório via WhatsApp.',
      'Planejador de Acampamento da Unidade: Escala interativa de tarefas por refeição (quem busca água/lenha, quem cozinha e quem lava a louça) com sorteio automático entre membros e lista de cardápio e ingredientes.',
      'Checklist de Mochila de Acampamento: Lista interativa categorizada (Bíblia e Documentos, Uniformes, Dormitório, Higiene e Campo) com barra de progresso e adição de itens personalizados.'
    ]
  },
  {
    version: '3.0.49',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Aleatorização Balanceada de Alternativas (A, B, C, D) e Filtro Exclusivo do Livro Nisto Cremos para Desbravadores',
    changes: [
      'Restrição das categorias do livro "Nisto Cremos" (Capítulos 1-10, 11-20 e 21-28) exclusivamente para a área de Desbravadores.',
      'Novo algoritmo criptográfico de embaralhamento balanceado das alternativas (A, B, C, D) no Quiz e nas Avaliações de Especialidade, distribuindo uniformemente a resposta correta e evitando repetições da opção A.'
    ]
  },
  {
    version: '3.0.48',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Otimização Visual do Quiz em Tela Cheia Sem Rolagem e 2 Colunas no Celular',
    changes: [
      'Layout do Quiz e Simulado 100% ajustado à tela sem necessidade de rolagem vertical.',
      'Grade de modalidades organizada em 2 colunas no celular para visualização rápida e direta.',
      'Ocultação do menu flutuante inferior no celular durante o Quiz e remoção do botão "Sair" redundante (integrado ao botão Voltar do cabeçalho).',
      'Exibição limpa da insígnia no modo "Qual é esta Especialidade?" sem container em volta.'
    ]
  },
  {
    version: '3.0.47',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Novas Categorias no Quiz: Livro "Nisto Cremos" (Capítulos 1-10, 11-20 e 21-28) e Manual Administrativo dos Desbravadores',
    changes: [
      'Adicionada a categoria "Livro Nisto Cremos • Capítulos 1 ao 10" (Escrituras Sagradas, Trindade, Pai, Filho, Espírito Santo, Criação, Natureza da Humanidade, Grande Conflito, Vida/Morte/Ressurreição de Cristo e Experiência da Salvação).',
      'Adicionada a categoria "Livro Nisto Cremos • Capítulos 11 ao 20" (Crescer em Cristo, Igreja, Remanescente e Sua Missão, Unidade no Corpo de Cristo, Batismo, Ceia do Senhor, Dons e Ministérios Espirituais, Dom de Profecia, Lei de Deus e Sábado).',
      'Adicionada a categoria "Livro Nisto Cremos • Capítulos 21 ao 28" (Mordomia, Conduta Cristã, Casamento e Família, Ministério de Cristo no Santuário Celestial, Segunda Vinda, Morte e Ressurreição, Milênio e Fim do Pecado, e Nova Terra).',
      'Adicionada a categoria dedicada "Manual Administrativo dos Desbravadores" (Filosofia, Faixa Etária, Eleição da Diretoria, Comissões Executiva e Regular, Sistema de Unidades, Conselheiros, Capitão e Secretário, Cerimônias, Finanças, Seguro Anual/SGC, Bandeira, Banderim e Disciplina Redentiva).'
    ]
  },
  {
    version: '3.0.46',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Quiz Interativo, Simulado "Bom de Bíblia" e Concursos do Clube',
    changes: [
      'Nova área de Quiz e Simulado com perguntas cronometradas, recordes pessoais, sistema de combo e ajudas estratégicas (Eliminar 2 alternativas, +15 Segundos e Dica/Referência).',
      'Trilha História, Ideais, Emblemas e Manual Administrativo (Desbravadores e Aventureiros) com explicação comentada e referência oficial.',
      'Simulado estilo "Bom de Bíblia", Livro do Ano e Ano Bíblico com gerador opcional de perguntas inéditas sob demanda.',
      'Modo visual "Qual é esta Especialidade?" que exibe apenas a insígnia oficial do catálogo para acertar o nome da especialidade contra o relógio.'
    ]
  },
  {
    version: '3.0.45',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Ajuste no Cabeçalho da Prova de Especialidade (Desbravadores / Aventureiros)',
    changes: [
      'Simplificação da faixa superior do cabeçalho no PDF da prova para exibir diretamente "DESBRAVADORES • AVALIAÇÃO DE ESPECIALIDADE" ou "AVENTUREIROS • AVALIAÇÃO DE ESPECIALIDADE" conforme o clube ativo.'
    ]
  },
  {
    version: '3.0.44',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Gerador de Provas Oficiais das Especialidades com Folha de Gabarito Comentado (.pdf)',
    changes: [
      'Novo Gerador de Provas nas Especialidades (exclusivo para liderança, instrutores, conselheiros e diretores) com elaboração inteligente baseada nos requisitos oficiais de Desbravadores e Aventureiros.',
      'Três modos de avaliação configuráveis: Mista (Múltipla Escolha + Verdadeiro/Falso + Discursivas/Práticas), 100% Objetiva (A, B, C, D) e Discursiva + Prática (com linhas pautadas e quadro de parecer prático do avaliador).',
      'Folha de Gabarito Oficial do Instrutor destacável ao final do PDF (com resumo rápido do cartão-resposta, respostas comentadas e critérios de correção) e pré-visualização interativa das questões dentro do aplicativo.'
    ]
  },
  {
    version: '3.0.43',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Otimização de Especialidades e Faixa: -77% de Peso SQL e -98% de Consumo de Imagens no Modal',
    changes: [
      'Consultas leves de Especialidades no Perfil e Catálogo (sem baixar os 700 KB de textos da coluna Questoes até que o usuário abra uma especialidade específica), reduzindo o consumo da tabela em 77%.',
      'Cache inteligente em memória e LocalStorage (12h) para evitar consultas repetidas ao Supabase ao alternar entre telas.',
      'Paginação progressiva sob demanda (40 itens por lote ao rolar) e carregamento assíncrono (lazy loading) nos modais de Minha Faixa e Pesquisa de Especialidades, evitando baixar as 534 imagens (~84 MB) de uma só vez.'
    ]
  },
  {
    version: '3.0.42',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Ícone do Topo do App com Navegação Direta para o Início',
    changes: [
      'Ao clicar no ícone/logo do aplicativo no topo da tela, o usuário agora é direcionado imediatamente para a tela de Início.'
    ]
  },
  {
    version: '3.0.41',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Cartão de Classes com a Cor Oficial dos Aventureiros (#800000)',
    changes: [
      'Ajuste da cor do cartão de Classes na Área de Gestão de Aventureiros (Mobile e PC) para a cor oficial vinho/bordô dos Aventureiros (#800000).'
    ]
  },
  {
    version: '3.0.40',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Emblemas Sombreados no Menu Inferior (DBV / AVT) e Menu Principal',
    changes: [
      'Adição dos emblemas oficiais sombreados em marca d\'água à direita nos botões DBV (Desbravadores) e AVT (Aventureiros) da barra de navegação inferior.',
      'Alinhamento visual dos botões do Menu Principal sem ícones frontais duplicados, mantendo apenas o texto e o emblema sombreado à direita no estilo da tela inicial.'
    ]
  },
  {
    version: '3.0.39',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Novo Visual do Menu Principal com Ícones/Brasões Livres e Marca d\'Água Sombreada à Direita',
    changes: [
      'Remoção dos containers quadrados internos em volta do ícone de Início e dos brasões de Desbravadores e Aventureiros no Menu Principal.',
      'Aplicação do mesmo estilo visual da tela inicial nos botões do Menu Principal, com a imagem/ícone sombreado em marca d\'água à direita e preservação das cores de destaque de cada ministério.'
    ]
  },
  {
    version: '3.0.38',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Regra de Investidura de Líder no Perfil (18+ Anos e Todas as Classes Regulares Ativas)',
    changes: [
      'Bloqueio estrito do distintivo de Líder no bolso do perfil: liberado exclusivamente para quem possui 18 anos ou mais (idade oficial de investidura, apesar de poder iniciar a classe aos 16 anos) E está com todas as 6 Classes Regulares (Amigo, Companheiro, Pesquisador, Pioneiro, Excursionista e Guia) ativas.',
      'Caso falte qualquer uma das 6 Classes Regulares ou a idade seja inferior a 18 anos, o distintivo de Líder permanece bloqueado com ícone de cadeado e opacidade reduzida igual a Líder Master e Líder Master Avançado.'
    ]
  },
  {
    version: '3.0.37',
    date: '04/10/2026',
    tag: 'ATUAL',
    title: 'Otimização de Imagens (99,6% Menos Peso no Banco), Padrão Emblemas Unificado e Créditos Oficiais do RUD',
    changes: [
      'Migração completa de imagens Base64 para URLs leves em CDN/Supabase Storage e Wiki Oficial MDA, reduzindo o tamanho da tabela Cultura de 8,64 MB para apenas 28,9 KB (redução de 99,66% de tráfego no banco de dados).',
      'Estrutura de Uniformes 100% padronizada igual à aba de Emblemas (mesmo alinhamento de títulos, posição superior de imagem e proporção compacta em acordeão).',
      'Adicionado rodapé oficial de créditos e referências técnicas (RUD da Divisão Sul-Americana da IASD, Wiki Oficial MDA e Portal Adventistas.org) nas abas de Uniformes e Emblemas.',
      'Envio automático de novas imagens do painel administrativo de Cultura direto para o Supabase Storage em vez de gravar Base64 na tabela.'
    ]
  },
  {
    version: '3.0.36',
    date: '03/10/2026',
    tag: 'ATUAL',
    title: 'Uniformes RUD Direto da Internet (Padrão Emblemas) para Desbravadores e Aventureiros',
    changes: [
      'Uniformes carregados diretamente da internet seguindo o RUD (Regulamento de Uniformes da DSA), sem necessidade de povoar o banco de dados Supabase e no mesmo padrão visual de acordeão da aba de Emblemas.',
      'Catálogo completo do RUD de Desbravadores: Uniforme de Gala (10 a 15 anos e 16+ anos/Liderança), Posição de Emblemas/Tiras/Distintivos (camisa e mangas), Lenços e Prendedores, Faixa de Especialidades, Cobertura/Cinto/Calçados/Torçal/Colete/Jaqueta, todas as Platinas/Galões ilustradas (Diretor a Associação Geral) e Uniforme de Atividades.',
      'Catálogo oficial RUD de Uniformes e Emblemas de Aventureiros (6 a 9 anos e Liderança) integrado com imagens diretas da internet.'
    ]
  },
  {
    version: '3.0.35',
    date: '03/10/2026',
    tag: 'ATUAL',
    title: 'Efeito Interativo de Clique (Balançada Suave) na Logo da Tela Inicial',
    changes: [
      'Adicionado efeito interativo de clique/toque na logo do aplicativo nas telas iniciais (Início, Login e Topo/Barra Lateral), com animação elástica de balanço suave e brilho sutil adaptado para celular, tablet, computador e modos claro/escuro.'
    ]
  },
  {
    version: '3.0.34',
    date: '03/10/2026',
    tag: 'ATUAL',
    title: 'Correção Definitiva do Login no Celular/Vercel (Autenticação Multi-Instância Supabase) e Estabilização de Rolagem',
    changes: [
      'Correção da causa raiz do erro de "Credenciais Inválidas" no celular/Vercel: Na Vercel (sem variáveis de ambiente locais), o aplicativo apontava por padrão para a instância secundária do Supabase (dembhtmryutggifbpuka), enquanto as contas principais estão registradas na instância oficial (qfpyjavbncijowjvznkg). Agora o app autentica simultaneamente em ambas as instâncias e testa automaticamente variações de maiúscula/minúscula na 1ª letra da senha.',
      'Rolagem automática estabilizada em Emblemas e Uniformes: Desativado o scroll anchoring nativo do navegador móvel para que, ao fechar um tópico grande (ex: Insígnias e Tiras) e abrir o próximo, o cabeçalho do novo tópico posicione-se com precisão no topo.',
      'Atualização dos modelos Gemini (gemini-3.1-flash-lite e gemini-flash-latest) para resposta imediata sem falhas.'
    ]
  },
  {
    version: '3.0.33',
    date: '03/10/2026',
    tag: 'ATUAL',
    title: 'Rolagem Automática para o Topo ao Abrir Tópicos em Emblemas e Uniformes',
    changes: [
      'Ao abrir um tópico em Emblemas ou Uniformes (fechando o anterior), a página rola suavemente de forma automática para posicionar o início do novo tópico exatamente no topo da área de leitura.'
    ]
  },
  {
    version: '3.0.32',
    date: '03/10/2026',
    tag: 'ATUAL',
    title: 'Acordeão Único em Emblemas/Uniformes, Correção de Login Mobile e Ajustes para Visitantes',
    changes: [
      'Emblemas e Uniformes com abertura exclusiva: Ao abrir um novo tópico (ex: Insígnias e Tiras → outro tópico), o tópico anterior é fechado automaticamente.',
      'Correção do login no celular: Desativada a capitalização/espaço automático do teclado móvel no e-mail e na senha, adicionado botão de olho para visualizar a senha no login e preenchimento automático do último e-mail utilizado.',
      'Menu de Ajustes inteligente: Exibe o botão "Fazer Login" quando o usuário entra sem login (em vez de "Sair da Conta") e oculta a opção "Fixar Menu Lateral" (exclusiva de computador) no celular.',
      'Organização do Painel Administrativo: Removido o card duplicado do Painel Administrativo do meio da tela inicial dos clubes, mantendo-o centralizado dentro do Perfil.'
    ]
  },
  {
    version: '3.0.31',
    date: '03/10/2026',
    tag: 'ATUAL',
    title: 'Geração de PowerPoint com IA Otimizada e Ultrarrápida no Celular',
    changes: [
      'Processamento paralelo em lotes na IA do PowerPoint: As questões e sub-itens agora são respondidos simultaneamente em lotes compactos (4 a 7 segundos no celular), eliminando o timeout de 10 segundos da Vercel.',
      'Conexão REST direta e resolução instantânea de chave (0ms) no aplicativo móvel (PWA/Android/iOS), evitando demora ao salvar e garantindo respostas reais da IA em vez de respostas padrão.',
      'Parser JSON resiliente e carregamento simultâneo de insígnias com controle de tempo limite em redes móveis.'
    ]
  },
  {
    version: '3.0.30',
    date: '03/10/2026',
    tag: 'ATUAL',
    title: 'Limite de Idade (16+), Leitor de PDF Interno e História Direta dos Aventureiros',
    changes: [
      'Limite de idade (16+ anos) nas Especialidades: As funções de Gerar PDF da Especialidade e Apresentação PowerPoint (.pptx) ficam disponíveis apenas para usuários logados a partir de 16 anos (e respeitando os cargos permitidos no PowerPoint).',
      'Leitura de PDF 100% interna nos livros e materiais: Ocultados os botões de "Abrir em Nova Aba / Outra Janela" no cabeçalho, no rodapé e no canto superior direito do visualizador.',
      'História dos Aventureiros com abertura direta: Ao tocar em História nos Aventureiros, a História Mundial é aberta diretamente sem o botão intermediário.'
    ]
  },
  {
    version: '3.0.29',
    date: '03/10/2026',
    tag: 'ATUAL',
    title: 'Controle de Acesso por Cargo no PowerPoint e PDF de Especialidades',
    changes: [
      'Ocultação do gerador de apresentações PowerPoint (.pptx) para os cargos Aspirante, Desbravador(a) e Capitão(ã), mantendo o recurso exclusivo para instrutores, conselheiros e diretoria.',
      'Ocultação do gerador de PDF das especialidades e do PowerPoint para visitantes que acessam o aplicativo na opção "Entrar sem login".',
      'Sincronização em tempo real do cargo/função do perfil com o banco de dados e armazenamento local.'
    ]
  },
  {
    version: '3.0.28',
    date: '03/10/2026',
    tag: 'ATUAL',
    title: 'IA Funcionando Automaticamente na Vercel Após Deploy',
    changes: [
      'Resolução automática de credenciais na Vercel: Mesmo que a variável não esteja configurada manualmente no painel da Vercel, a função Serverless e o app recuperam a configuração codificada sincronizada com o banco Supabase.',
      'Timeout estendido na Vercel (maxDuration: 60s): Configurado em vercel.json para evitar que o plano gratuito da Vercel interrompa a geração de apresentações com muitos requisitos após 10 segundos.',
      'Desbravinho e Gerador de PPT integrados: Ambos utilizam a rota Serverless (/api/gemini/generate-didactic) com fallback automático para máxima disponibilidade em produção.',
      'Correção de pareamento URL/Key do Supabase: Alinhamento automático da URL do projeto pelo payload JWT para evitar falhas de autenticação.'
    ]
  },
  {
    version: '3.0.27',
    date: '03/10/2026',
    tag: 'ATUAL',
    title: 'Apresentações PPT 100% Focadas no Conteúdo Pedagógico (Sem Imagens nas Questões)',
    changes: [
      'Remoção definitiva de imagens nos slides de requisitos e sub-itens: Evita associações literais equivocadas (como termos compostos em nomes de nós ou técnicas) e mantém foco total na instrução.',
      'Layout didático estruturado em duas colunas: Todos os requisitos exibem Resposta Completa, Pontos Fundamentais de Fixação, Dinâmica Prática na Unidade e Conselho Pedagógico ao Instrutor.',
      'Geração mais rápida e limpa: A apresentação mantém apenas a insígnia oficial da especialidade na capa, otimizando o tempo de geração do arquivo PowerPoint (.pptx).'
    ]
  },
  {
    version: '3.0.26',
    date: '01/10/2026',
    tag: 'ATUAL',
    title: 'Apresentações PPT Sem Imagens Forçadas ou Desconexas',
    changes: [
      'Eliminação total de imagens genéricas/aleatórias: Apenas imagens genuinamente relacionadas ao tema da questão são inseridas nos slides.',
      'Sem caixas vazias ou imagens fora de contexto: Quando não há imagem de alta confiança para o quesito, o slide não força ilustrações aleatórias.',
      'Layout adaptativo inteligente: Slides sem imagem aproveitam a coluna direita com a Dinâmica Prática na Unidade e o Conselho Pedagógico para o Instrutor em destaque.',
      'Sub-itens otimizados: Slides de sub-itens sem imagem focam na Aplicação Prática e nos Critérios de Avaliação e Fixação da unidade.'
    ]
  },
  {
    version: '3.0.25',
    date: '01/10/2026',
    tag: 'ATUAL',
    title: 'Geração de Apresentações PPT com IA na Vercel e Imagens 100% Contextualizadas',
    changes: [
      'Geração de IA compatível com Vercel: Criada Serverless Function oficial (/api/gemini/generate-didactic) com suporte a runtime serverless da Vercel e atualização das regras de rewrite em vercel.json.',
      'Fim das imagens genéricas ou aleatórias: Busca multimodal com Wikimedia Commons em tempo real para encontrar fotos de domínio público de animais, estrelas, nós, fogueiras, computadores, primeiros socorros e botânica diretamente ligados à pergunta.',
      'Dicionário Temático Expandido dos Desbravadores: Mais de 120 categorias fotográficas curadas e mapeadas para todas as 9 áreas do Ministério dos Desbravadores.',
      'Respostas didáticas inteligentes offline: Gerador pedagógico aprofundado para todas as áreas (Natureza, Recreativas, Pioneirismo, Saúde, Artes, Missionárias e Domésticas) que substitui instruções padrão por conteúdos práticos e detalhados mesmo sem internet.'
    ]
  },
  {
    version: '3.0.24',
    date: '01/10/2026',
    tag: 'ATUAL',
    title: 'Resiliência Total no Banco de Dados para Classes, Especialidades, Livros e Manuais',
    changes: [
      'Classes e Áreas 100% resilientes: Classes (DBV e AVT) e Categorias de Especialidades agora possuem tripla contingência (SDK Supabase, fallback direto à API REST e cache local persistente).',
      'Biblioteca Digital sem falhas: Livros das Classes, Livros do Ano, Outros Livros e Manuais agora contam com carregamento resiliente com recuperação automática e cache offline.',
      'Botões de recarga sob demanda: Classes, Especialidades e Biblioteca agora contam com estados informativos claros e botão "Recarregar do Banco" caso ocorra oscilação de rede.',
      'Especialidades protegidas contra bloqueios de rede: As mais de 534 especialidades DBV e 125 AVT agora possuem fallback REST direto com chave anônima oficial.'
    ]
  },
  {
    version: '3.0.23',
    date: '01/10/2026',
    tag: 'ATUAL',
    title: 'Bíblia Sagrada e Visualizador de Documentos com Resiliência Total e Cache Local',
    changes: [
      'Bíblia Sagrada sempre disponível: Carregamento canônico imediato dos 66 livros (39 do AT e 27 do NT) garantindo disponibilidade desde o primeiro instante, sem telas em branco.',
      'Filtro unificado Todos os Livros (AT + NT): A Bíblia agora inicia exibindo todos os 66 livros por padrão, permitindo buscas instantâneas por qualquer livro do Antigo ou Novo Testamento sem bloqueios de abas.',
      'Resiliência e Cache Offline de Versículos: Os versículos agora contam com tripla camada de recuperação (Supabase SDK, API REST direta com chave anônima e cache local de leitura), com botão de recarga instantânea e mensagens explicativas amigáveis.',
      'Acesso direto e Versículo do Dia interativo: Cartão hero da Bíblia com botão para leitura direta dos 66 livros e versículo do dia que abre diretamente o capítulo completo.',
      'Visualizador de Documentos e PDFs protegido: Adicionada barra inferior de contingência com botão "Abrir em Nova Aba" para acesso direto mesmo quando bloqueado por restrições de iframe do navegador.'
    ]
  },
  {
    version: '3.0.22',
    date: '30/09/2026',
    tag: 'ATUAL',
    title: 'Visualizador de Itens do Banco Sempre Ativo e Sincronização Automática',
    changes: [
      'Visualizador de itens do banco aberto por padrão: O visualizador de itens no modal de apresentação agora inicia expandido e visível automaticamente, permitindo conferir todos os requisitos do banco sem necessidade de clicar em expandir.',
      'Sincronização automática e resiliente do Supabase: Implementada busca automática sob demanda dos requisitos oficiais caso uma especialidade seja aberta sem itens em cache, garantindo que nada fique em branco.',
      'Indicadores de status e botão de recarga: Adicionado status ao vivo da conexão com o banco oficial e botão para recarregar requisitos instantaneamente caso necessário.',
      'Visualização aprimorada de itens e sub-itens: Layout limpo com badges identificadoras de requisitos, bullets estilizados para sub-itens e rolagem suave.'
    ]
  },
  {
    version: '3.0.21',
    date: '30/09/2026',
    tag: 'ESTÁVEL',
    title: 'Visualizador de Itens do Banco de Dados e Compatibilidade Total de Numerações',
    changes: [
      'Visualizador de itens do banco no modal de PowerPoint: Adicionada lista expansível dentro do modal para conferência imediata de todos os requisitos e sub-itens originais extraídos do Supabase.',
      'Compatibilidade universal com numerações do banco: Reconhecimento perfeito de itens sem pontuação (ex: "1 Ler...", "2 Entrevistar..."), garantindo que a numeração oficial e os enunciados sejam exibidos com 100% de integridade.',
      'Contador oficial visível: Indicador destacado em tela com o número exato de itens carregados do banco de dados na visualização da especialidade.'
    ]
  },
  {
    version: '3.0.20',
    date: '30/09/2026',
    tag: 'ESTÁVEL',
    title: 'Geração Didática Unificada com Respostas Reais e Ilustrações Temáticas',
    changes: [
      'Geração em fluxo único: Removida a seleção dupla ("Com IA" / "Rápido"). Agora o aplicativo gera sempre a apresentação completa com todas as questões respondidas.',
      'Eliminação definitiva de respostas padrão: Fim de textos genéricos de orientação. Cada questão e sub-item recebe respostas reais, técnicas e esclarecedoras com conteúdo verdadeiro.',
      'Ilustrações temáticas precisas para toda questão e sub-item: Cada slide de questão e de sub-item recebe ilustração específica sobre o tema exato abordado (equipamentos, regras, nós, socorrismo, trilha, etc.), nunca imagens aleatórias.',
      'Motor resiliente atualizado: Integração server-side com Gemini 3.5 Flash Lite para geração rápida e sem falhas de cota ou sobrecarga.'
    ]
  },
  {
    version: '3.0.19',
    date: '29/09/2026',
    tag: 'ESTÁVEL',
    title: 'Slides Individuais para Sub-itens com Resolução Completa e Ilustrações Visuais',
    changes: [
      'Slides individuais para sub-itens: Cada sub-item (a, b, c...) agora ganha seu próprio slide de estudo aprofundado, com explicação técnica abrangente, pontos-chave e desafio prático para a unidade.',
      'Ilustrações visuais temáticas: Cada slide de sub-item conta com ilustração visual (fotografia em alta resolução correspondente ao tema ou banner infográfico estilizado gerado em Canvas).',
      'Sincronia rigorosa de numeração: Cada sub-item é claramente identificado como "REQUISITO X • SUB-ITEM (LETRA)" mantendo o contador oficial "ITEM X DE TOTAL", para que a ordem da especialidade continue 100% perfeita sem nunca misturar a contagem.',
      'Slide de visão geral do requisito: O slide pai apresenta o roteiro inicial e o resumo geral, seguido pelos slides detalhados de cada letra.'
    ]
  },
  {
    version: '3.0.18',
    date: '29/09/2026',
    tag: 'ESTÁVEL',
    title: 'Agrupamento de Sub-itens (Letras) e Modal Compacto sem Cortes',
    changes: [
      'Agrupamento inteligente de sub-itens: Requisitos com sub-itens identificados por letras (a, b, c...), numeração romana ou traços agora pertencem estritamente ao seu respectivo requisito e não criam mais slides isolados fora de ordem no PowerPoint.',
      'Sincronia oficial da numeração: O número do slide (ex: Requisito 1, 2, 3...) e a contagem total de questões refletem com 100% de exatidão os requisitos oficiais do manual.',
      'Resolução didática completa de sub-itens: Cada sub-item possui sua explicação técnica e didática formulada dentro do respectivo slide do requisito.',
      'Modal de PowerPoint compacto e sem corte: Redesenhado com altura equilibrada e centralização segura com margem automática, eliminando o corte de tela no topo e a necessidade de rolar para acessar opções e botões.',
      'Hierarquia visual no app: Na tela de detalhes da especialidade, os sub-itens agora aparecem indentados com marcadores de letras dedicados.'
    ]
  },
  {
    version: '3.0.17',
    date: '29/09/2026',
    tag: 'ESTÁVEL',
    title: 'Correção de Posicionamento do Modal de PowerPoint em Todas as Resoluções',
    changes: [
      'Correção do corte do modal do PowerPoint: o modal agora é renderizado via Portal nativo no nível raiz da tela (document.body), eliminando qualquer deslocamento ou corte causado pelo scroll e transform da página.',
      'Centralização perfeita na viewport em computadores, celulares e tablets, com área de rolagem interna adaptável (max-h 90vh) que mantém o cabeçalho e os botões sempre visíveis e acessíveis.',
      'Adicionado fechamento automático ao clicar no fundo escuro ou pressionar a tecla Escape.'
    ]
  },
  {
    version: '3.0.16',
    date: '29/09/2026',
    tag: 'ESTÁVEL',
    title: 'Correção da Numeração dos Requisitos e Respostas Didáticas Específicas nos Slides',
    changes: [
      'Correção definitiva da numeração dos requisitos: as notas, introduções e avisos foram isolados, garantindo que o número do slide e do cabeçalho coincida exatamente com o número oficial de cada questão.',
      'Fim das respostas genéricas: agora cada questão é respondida com conteúdo teórico, técnico e prático de verdade, com explicações aprofundadas sobre o tema exato da especialidade (ex: Trail Run, nós, primeiros socorros, etc.).',
      'Integração aprimorada com IA Gemini via servidor e modelos modernos resilientes (gemini-3.1-flash-lite e gemini-3.8-flash) com fallback inteligente especializado.',
      'Destacadas as orientações oficiais da especialidade no slide de Visão Geral e notas em cards visuais dedicados.'
    ]
  },
  {
    version: '3.0.15',
    date: '29/09/2026',
    tag: 'ESTÁVEL',
    title: 'Gerador de Apresentação em PowerPoint Didática (.pptx) para Especialidades',
    changes: [
      'Adicionado botão dedicado "Apresentação PowerPoint (.pptx)" ao final dos requisitos de cada especialidade, permitindo criar slides para ministrar ou estudar.',
      'Elaboração de slides pedagógicos didáticos e widescreen (16:9) com insígnia oficial, código, área temática colorida e dados da instrução.',
      'Preenchimento didático de cada questão com guia explicativo teórico, pontos fundamentais de fixação, sugestão de dinâmica prática na reunião de unidade e caixas de anotação.',
      'Suporte a geração rápida (instantânea/offline) e preenchimento detalhado por inteligência artificial, além de slide final de avaliação com ficha de aprovação do instrutor e diretor.'
    ]
  },
  {
    version: '3.0.14',
    date: '29/09/2026',
    tag: 'ESTÁVEL',
    title: 'Eliminação de Cabeçalho Redundante no Visualizador em Celulares',
    changes: [
      'Remoção da barra secundária interna que duplicava cabeçalhos e botões de ação em celulares durante a leitura de PDFs e materiais do Desbrava+.',
      'Unificação elegante e centralizada dos controles no topo: botão fechar rápido (X), título do documento, subtítulo identificador e atalho para abrir em nova aba.',
      'Aumento da área útil de leitura nos dispositivos móveis sem sobreposições desnecessárias.'
    ]
  },
  {
    version: '3.0.13',
    date: '17/09/2026',
    tag: 'ESTÁVEL',
    title: 'Diagnóstico e Alerta de Restrição de Cota do Supabase',
    changes: [
      'Detecção automática de erro de cota de dados excedida (HTTP 402 - exceed_cached_egress_quota) no Supabase.',
      'Banner de alerta em tempo real no topo do app informando quando o banco/storage está restrito pelo provedor.',
      'Modal com orientações passo a passo para restauração do serviço no painel do Supabase e botão para testar conexão novamente.'
    ]
  },
  {
    version: '3.0.12',
    date: '16/09/2026',
    tag: 'ESTÁVEL',
    title: 'Otimização de Navegação e Encerramento de Leitura de PDFs',
    changes: [
      'Remoção do botão redundante "Fechar PDF" na parte inferior do painel de miniatura lateral.',
      'Substituição do botão voltar tradicional por um botão de ação rápida "X" (fechar) no cabeçalho superior e móvel durante a leitura.',
      'Aproveitamento máximo e visual limpo da capa do documento sobreposta com fundo esfumaçado ao menu lateral.'
    ]
  },
  {
    version: '3.0.11',
    date: '16/09/2026',
    tag: 'ESTÁVEL',
    title: 'PDF no Corpo do App com Miniatura Sobreposta ao Menu Lateral',
    changes: [
      'Visualizador de PDF integrado diretamente ao corpo da aplicação para PC, mantendo a experiência no corpo do app.',
      'Abertura simultânea da imagem de miniatura/capa do documento por cima do menu lateral com fundo esfumaçado (backdrop blur).',
      'Atalho para abrir documento em nova aba no topo e botão dedicado para fechar o PDF.'
    ]
  },
  {
    version: '3.0.10',
    date: '16/09/2026',
    tag: 'ESTÁVEL',
    title: 'Visualizador de Documentos Sobreposto com Fundo Esfumaçado',
    changes: [
      'Visualização de PDFs em janela de leitura com fundo esfumaçado (backdrop blur).',
      'Sobreposição elegante sobre o menu lateral e interface principal, mesmo com a barra lateral aberta.',
      'Controles dedicados e limpos no topo da janela com botão voltar, link para nova aba e fechar.'
    ]
  },
  {
    version: '3.0.9',
    date: '16/09/2026',
    tag: 'ESTÁVEL',
    title: 'Eliminação de Redundância no Visualizador de Documentos',
    changes: [
      'Remoção de botões duplicados de voltar e títulos repetidos na visualização de PDFs no PC.',
      'Unificação dos controles no cabeçalho superior do aplicativo, incluindo botão para abrir em nova aba.',
      'Aproveitamento máximo da área de leitura do documento no corpo da aplicação sem barras internas redundantes.'
    ]
  },
  {
    version: '3.0.8',
    date: '16/09/2026',
    tag: 'ESTÁVEL',
    title: 'Visualização de PDFs no Corpo do Aplicativo no PC',
    changes: [
      'Ajuste para que PDFs e materiais digitais abram integrados diretamente no corpo do aplicativo em telas de PC/desktop.',
      'Fim da sobreposição fullscreen invasiva no PC: a barra lateral de navegação e o cabeçalho continuam acessíveis e visíveis.',
      'Inclusão de atalho prático para "Abrir em Nova Aba" e manutenção da experiência imersiva em dispositivos móveis.'
    ]
  },
  {
    version: '3.0.7',
    date: '16/09/2026',
    tag: 'ESTÁVEL',
    title: 'Harmonização Tipográfica e Escala de Letras dos Cartões',
    changes: [
      'Ajuste proporcional da tipografia de títulos e subtítulos nos cartões principais retangulares.',
      'Impedimento de quebras de linha indesejadas e eliminação de truncamentos de texto nos subtítulos (Almeida Revista e Corrigida / Requisitos e Progresso / Manual, Áreas e Requisitos).',
      'Balanceamento de ícones e espaçamentos internos para garantir leitura limpa em qualquer resolução.'
    ]
  },
  {
    version: '3.0.6',
    date: '16/09/2026',
    tag: 'ESTÁVEL',
    title: 'Ajuste em Proporcionalidade dos Cartões Retangulares',
    changes: [
      'Aplicação de proporção retangular fixa (16:10) para os cartões principais (Bíblia Sagrada, Classes e Especialidades).',
      'Escalonamento proporcional suave de altura, largura, ícones e tipografias quando em telas menores ou janelas redimensionadas, preservando o formato retangular sem achatamentos.'
    ]
  },
  {
    version: '3.0.5',
    date: '16/09/2026',
    tag: 'ESTÁVEL',
    title: 'Restauração do Formato Retangular dos Cartões Principais',
    changes: [
      'Restauração do formato retangular amplo original dos 3 cartões principais superiores (Bíblia Sagrada, Classes e Especialidades).',
      'Manutenção da proporção perfeita e não-achatada dos botões de acesso rápido em telas menores.'
    ]
  },
  {
    version: '3.0.4',
    date: '16/09/2026',
    tag: 'ESTÁVEL',
    title: 'Ajuste Proporcional dos Botões da Tela Inicial',
    changes: [
      'Eliminação do achatamento horizontal dos botões em telas médias e menores.',
      'Aplicação de proporção exata para os botões de acesso rápido (Cultura, Biblioteca, Gerenciar, Trunfos, Desbrava+, Vídeos).',
      'Escalabilidade suave e proporcional dos ícones e textos mantendo a harmonia visual em qualquer resolução.'
    ]
  },
  {
    version: '3.0.3',
    date: '16/09/2026',
    tag: 'ESTÁVEL',
    title: 'Apenas a Escrita em Vermelho do Tipo Sanguíneo/Fator RH na Faixa',
    changes: [
      'Remoção total de qualquer contêiner, caixa, fundo ou borda ao redor do tipo sanguíneo e fator RH.',
      'Exibição limpa exclusivamente da escrita em vermelho bordada diretamente sobre a plaqueta do nome no lado direito.'
    ]
  },
  {
    version: '3.0.2',
    date: '16/09/2026',
    tag: 'ESTÁVEL',
    title: 'Tipo Sanguíneo/Fator RH na Faixa, Costura da Ponta Corrigida e Regras de Liderança',
    changes: [
      'Inclusão dos campos de Tipo Sanguíneo e Fator RH na edição do perfil, com sincronização na nuvem e exibição exclusiva em vermelho na plaqueta do nome na faixa.',
      'Correção definitiva da costura pespontada do corte da ponta da faixa (eliminando a subida indevida da linha de costura para o topo da faixa).',
      'Implementação de regra de elegibilidade para os pins de liderança: Líder Master só pode ser selecionado se Líder estiver ativo, e Líder Master Avançado só pode ser selecionado se Líder Master estiver ativo, com desmarcação em cascata e alertas visuais de cadeado.'
    ]
  },
  {
    version: '3.0.1',
    date: '15/09/2026',
    tag: 'ESTÁVEL',
    title: 'Alinhamento Geométrico Perfeito: Linha Reta Central do Globo Paralela ao Corte a 45°',
    changes: [
      'Ajuste angular de precisão (45° exatos) garantindo que a linha reta central (equador) que passa no meio do globo atrás do triângulo esteja rigorosamente alinhada e paralela à inclinação diagonal do corte da faixa.',
      'Sincronização matemática entre o vetor de subida da linha de corte (deltaY/W = 1.0) e a rotação horária do globo (+45°).',
      'Harmonização idêntica na maquete de simulação da ponta da faixa no Painel Administrativo.'
    ]
  },
  {
    version: '3.0.0',
    date: '15/09/2026',
    tag: 'ESTÁVEL',
    title: 'Ponta da Faixa Idêntica à Referência: Rotação Horária do Globo (+40°) e Alinhamento Preciso',
    changes: [
      'Inversão e correção da rotação do globo oficial para o sentido horário oficial (+40°), alinhando o vértice superior e o escudo voltados para cima e à direita exatamente como na imagem de referência.',
      'Corte diagonal da extremidade da faixa com angulação a 45 graus iniciando na ponta inferior esquerda e transpassando o emblema com transparência total na área externa.',
      'Preservação nítida da espada, do escudo e do triângulo D1 na área verde-petróleo da faixa.',
      'Harmonização da maquete do simulador de ponta da faixa e globos no Painel Administrativo.'
    ]
  },
  {
    version: '2.9.9',
    date: '15/09/2026',
    tag: 'ESTÁVEL',
    title: 'Ponta da Faixa Fiel ao Uniforme: Angulação Oficial a 45° e Rotação Exata do Globo',
    changes: [
      'Corte diagonal da extremidade da faixa corrigido para a angulação oficial de 45 graus (subida equivalente à largura total da faixa), com vértice agudo no canto inferior esquerdo subindo em direção à borda direita.',
      'Globo oficial ampliado para escala real e rotacionado em -38°, alinhando o lado direito do triângulo D1 perfeitamente à reta diagonal do corte conforme a imagem de referência.',
      'Corte preciso transpassando a espada e o escudo, mantendo o polo norte, curvatura amarela e a ponta do triângulo em destaque na faixa verde, com transparência total na área externa.',
      'Costura pespontada verde-clara acompanhando rigorosamente a inclinação de 45° por toda a extremidade da faixa e do simulador administrativo.'
    ]
  },
  {
    version: '2.9.8',
    date: '15/09/2026',
    tag: 'ESTÁVEL',
    title: 'Ajuste Fiel do Globo na Ponta da Faixa: Triângulo e Espada em Destaque com Corte Diagonal Realista',
    changes: [
      'Reposicionamento milimétrico do globo oficial na ponta da faixa verde-petróleo, garantindo que mais de 60% do emblema permaneça visível com nitidez.',
      'Triângulo D1, escudo branco e espada azul totalmente preservados e em evidência na faixa, com a linha diagonal cortando realisticamente a extremidade inferior direita do emblema exatamente como na foto de referência.',
      'Eliminação do deslocamento excessivo que cortava o triângulo por completo.',
      'Harmonização das proporções do globo no simulador interativo do Painel Administrativo.'
    ]
  },
  {
    version: '2.9.7',
    date: '15/09/2026',
    tag: 'ESTÁVEL',
    title: 'Ponta da Faixa Fiel à Faixa Real com Globo Cortado na Diagonal e Transparência',
    changes: [
      'Corte diagonal da extremidade da faixa ampliado em ângulo realista (150px), acompanhando perfeitamente a linha diagonal.',
      'Globo oficial redimensionado e posicionado na extremidade da faixa de modo que o corte diagonal traspasse e corte o emblema ao meio, reproduzindo exatamente o padrão oficial da imagem de referência.',
      'Área externa ao corte 100% transparente via clip-path nativo, eliminando o globo inteiro flutuando e exibindo a costura pespontada acompanhando toda a inclinação do corte.',
      'Alinhamento do simulador de ponta da faixa e globos no Painel Administrativo com a mesma inclinação e proporção realista.'
    ]
  },
  {
    version: '2.9.6',
    date: '15/09/2026',
    tag: 'ESTÁVEL',
    title: 'Agrupamento Lado a Lado dos Mestrados com Especialidades Compartilhadas e Alinhamento de Grade',
    changes: [
      'Correção no agrupamento da família de Ciência, Tecnologia e Atividades Profissionais, garantindo que ambos os mestrados entrem no mesmo cluster e venham posicionados no topo da faixa.',
      'Exibição rigorosa lado a lado dos mestrados que compartilham especialidades (ex: Ciência e Tecnologia à esquerda e Atividades Profissionais à direita).',
      'Alinhamento exato das especialidades abaixo dos mestrados: especialidades compartilhadas e de tecnologia nas colunas 1 a 3 (sob o mestrado da esquerda) e especialidades específicas nas colunas seguintes (sob o mestrado da direita), reproduzindo com fidelidade a imagem de referência.',
      'Preservação da ordem oficial: blocos de mestrados ativos com suas especialidades no topo, seguidos das especialidades avulsas das áreas que não possuem mestrado.'
    ]
  },
  {
    version: '2.9.5',
    date: '15/09/2026',
    tag: 'ESTÁVEL',
    title: 'Corte Diagonal Aberto com Globo Transpassado, Mestrados Concluídos e Exatidão de Especialidades',
    changes: [
      'Corte diagonal da faixa verde-petróleo ampliado e mais aberto (92px), com costura pespontada acompanhando a inclinação e emblema do globo posicionado na extremidade com corte diagonal simulando a faixa real.',
      'Filtro estrito de mestrados na faixa: inclusão apenas de mestrados que possuem todos os requisitos de especialidades concluídos pelo desbravador.',
      'Correspondência estrita de especialidades com normalização precisa, eliminando falsas associações (ex: Cultura Física na área recreativa isolada de Física/Ciência e Tecnologia).',
      'Disposição lado a lado dos mestrados que compartilham especialidades no topo com grade alinhada de 4 colunas para as especialidades correspondentes.',
      'Alinhamento do simulador de ponta da faixa e globos no Painel Administrativo com o corte diagonal aberto e pesponto estilizado.'
    ]
  },
  {
    version: '2.9.4',
    date: '14/09/2026',
    tag: 'ESTÁVEL',
    title: 'Alinhamento Fiel da Faixa: Sequência Oficial de Mestrados e Especialidades e Ponta Realista',
    changes: [
      'Alinhamento estrito da ordem de mestrados e especialidades conforme as diretrizes oficiais e imagem de referência: mestrados e suas respectivas especialidades no topo por ordem de regras oficiais, seguidos pelas especialidades agrupadas por áreas na ordem oficial da DSA (ADRA, Artes Manuais, Agrícolas, Espiritual, Profissional/Tecnologia, Recreativas/Campestre, Saúde, Natureza e Domésticas).',
      'Ordenação canônica das especialidades dentro de cada mestrado conforme os requisitos e matriz da regra oficial.',
      'Refinamento da ponta da faixa verde-petróleo com proporção e acabamento fiéis ao uniforme real e emblema do globo dinâmico perfeitamente emoldurado.',
      'Ajuste simultâneo no simulador interativo de globos no Painel Administrativo.'
    ]
  },
  {
    version: '2.9.3',
    date: '14/09/2026',
    tag: 'ESTÁVEL',
    title: 'Ponta da Faixa com Corte Diagonal Oficial, Globo Dinâmico por Idade/Liderança e Painel Admin de Imagens',
    changes: [
      'Ponta da faixa com extremidade inferior em corte diagonal autêntico (64px) e pesponto estilizado em conformidade com o Manual de Uniformes da DSA e referência fotográfica oficial.',
      'Globo dinâmico na ponta da faixa: até 15 anos exibe o Globo Desbravador (fundo cáqui), a partir de 16 anos exibe o Globo Liderança (fundo branco), e com pin de Líder, Master ou Master Avançado ativo exibe o Globo de Líder (L1 com estrela dourada ao centro).',
      'Gestão dos Globos da Faixa no Painel Administrativo: tela dedicada com visualização prévia, campos de URL, upload direto de imagens locais e restauração rápida para os padrões oficiais.',
      'Simulador Interativo da Ponta da Faixa no Admin com alternância em tempo real entre os três modos (Até 15 anos, 16+ anos e Líder Ativo).',
      'Modal informativo no perfil do usuário ao clicar no globo da faixa, detalhando as regras oficiais da DSA e o status do usuário.'
    ]
  },
  {
    version: '2.9.2',
    date: '14/09/2026',
    tag: 'ESTÁVEL',
    title: 'Ordenação Sequencial de Mestrados e Agrupamento Preciso de Especialidades na Faixa',
    changes: [
      'Estrutura sequencial em áreas com mais de um mestrado independente: exibe o primeiro mestrado seguido de suas especialidades, depois o segundo mestrado seguido de suas especialidades, e ao final as especialidades que não completam um mestrado.',
      'Mestrados que compartilham a mesma especialidade (ex: Atividades Profissionais e Ciência e Tecnologia): posicionados lado a lado no topo do bloco, acima de suas especialidades em comum.',
      'Especialidades de outras áreas atribuídas a mestrados (ex: Bactérias, Citologia, Protozoários, Vírus na área de Natureza atribuídos a Mestrado em Saúde): agrupadas e exibidas diretamente junto ao mestrado conquistado a que pertencem, sem irem para as sobras da outra área.'
    ]
  },
  {
    version: '2.9.1',
    date: '14/09/2026',
    tag: 'ESTÁVEL',
    title: 'Mestrados que Dividem Especialidades Lado a Lado e Especialidades de Outras Áreas Agrupadas ao Mestrado',
    changes: [
      'Posicionamento lado a lado de mestrados que compartilham especialidades (ex: Ciência e Tecnologia e Atividades Profissionais): ambos os emblemas ovais agora são exibidos juntos acima de suas especialidades unificadas na Faixa.',
      'Agrupamento de especialidades de outras áreas junto ao mestrado: especialidades que pertencem a um mestrado ativo (mesmo cadastradas sob outra categoria no banco) agora são reunidas diretamente sob o mestrado correspondente.',
      'Reconhecimento ampliado de especialidades compartilhadas de tecnologia e computação para os mestrados em Atividades Profissionais e Ciência e Tecnologia.',
      'Exibição das especialidades avulsas restantes da área logo após o bloco dos mestrados e suas especialidades.'
    ]
  },
  {
    version: '2.9.0',
    date: '14/09/2026',
    tag: 'ESTÁVEL',
    title: 'Sincronização Celular/PC e Sequência de Mestrados e Especialidades na Faixa',
    changes: [
      'Correção da sincronização em tempo real da faixa: eliminada falha de escrita no Supabase (coluna inexistente updated_at), garantindo persistência imediata das especialidades salvas no celular.',
      'Sincronização bidirecional completa: ao logar ou abrir o perfil no PC, as especialidades da faixa são baixadas do Supabase e sincronizadas automaticamente.',
      'Nova regra de disposição na Faixa: cada mestrado é seguido diretamente por suas especialidades correspondentes. Se houver 2 mestrados na mesma área, é exibido o primeiro com suas especialidades, depois o segundo com as suas, e por fim as especialidades restantes que não pertencem a nenhum dos 2 mestrados daquela área.',
      'Sincronização imediata das especialidades da faixa logo após o login no Auth.'
    ]
  },
  {
    version: '2.8.0',
    date: '13/09/2026',
    tag: 'ESTÁVEL',
    title: 'Mestrados Lado a Lado e Agrupamento Preciso de Vida Campestre e Botânica',
    changes: [
      'Mestrados com especialidades compartilhadas (ex: Atividades Profissionais e Ciência e Tecnologia) agora são posicionados lado a lado acima das especialidades na Faixa.',
      'Correção do agrupamento das especialidades de Vida Campestre: acampamentos, pioneirias, fogueiras e nós agora se agrupam perfeitamente sob o Mestrado em Vida Campestre.',
      'Correção do agrupamento das especialidades de Botânica: árvores, flores, cactos, sementes e samambaias agora se agrupam perfeitamente sob o Mestrado em Botânica.',
      'Distribuição protegida de áreas afins: nenhum mestrado ativo rouba especialidades específicas de outro mestrado.',
      'União harmoniosa de todas as especialidades correspondentes aos mestrados irmãos na mesma seção da faixa.'
    ]
  },
  {
    version: '2.7.0',
    date: '13/09/2026',
    tag: 'ESTÁVEL',
    title: 'Layout Responsivo de Especialidades, Sincronização em Nuvem e Proteção da Faixa',
    changes: [
      'Cabeçalho de Especialidades responsivo: no celular imagem centralizada no topo e textos abaixo; no PC imagem à esquerda e textos à direita.',
      'Eliminada redundância de texto na barra de navegação superior das Classes e Especialidades.',
      'Sincronização imediata e persistente da Faixa de Especialidades com o Supabase ao adicionar ou remover pelo celular.',
      'Distintivos de mestrado e especialidades na faixa protegidos contra cliques indesejados (gestão exclusiva na modal Minha Faixa).',
      'Painel de atualizações e sincronização de versão aprimorados.'
    ]
  },
  {
    version: '2.6.0',
    date: '13/09/2026',
    tag: 'ESTÁVEL',
    title: 'Uniforme Oficial, Condecorações Militares e Escala Real da Faixa',
    changes: [
      'Cor cáqui da camisa de gala oficial dos Desbravadores ajustada com fidelidade cromática e textura têxtil refinada.',
      'Condecorações de Classes Regulares unidas em suporte metálico dourado horizontal contínuo, idêntico ao modelo oficial.',
      'Porta-barretas metálico dourado duplo para as Classes Avançadas com divisões esmaltadas e brilho vitrificado.',
      'Insígnia de Excelência com moldura dourada polida e acabamento esmaltado vitrificado.',
      'Distintivos de Liderança separados na lapela, preservando espaçamento e relevo independente.',
      'Faixa de Especialidades e Mestrados em escala real de 100%, preenchendo a largura total de costura a costura.',
      'Sistema de histórico de versões e numeração sincronizado com o pacote do aplicativo.'
    ]
  },
  {
    version: '2.5.0',
    date: '10/03/2026',
    tag: 'ESTÁVEL',
    title: 'Modal de Ajustes, Modo Paisagem e Sistema de Versões',
    changes: [
      'Menu lateral retrátil para PC: inicia fechado, logo limpa sem containers, fecha ao clicar fora e botão de Ajustes no rodapé.',
      'Destaque dos botões da página ativa por cor pura, sem tags de status ou abreviações no modo expandido.',
      'Layout exclusivo para PC com Bíblia Sagrada, Classes e Especialidades em retângulos grandes lado a lado e espaçamento superior ampliado.',
      'Tela de Ajustes reformulada em formato de Modal flutuante com backdrop blur.',
      'Suporte completo a modo Paisagem (Landscape) e tela cheia contínua (100dvh).',
      'Painel de Controle de Versões e Histórico de Atualizações integrado aos Ajustes.',
      'Otimização da navegação entre Desbravadores e Aventureiros.'
    ]
  },
  {
    version: '2.4.0',
    date: '05/03/2026',
    tag: 'ESTÁVEL',
    title: 'Módulo de Trunfos Históricos e Bíblia Integrada',
    changes: [
      'Novo acervo de Trunfos dos Desbravadores e Aventureiros com fotos em alta definição.',
      'Filtro por ano, clube e zoom em tela cheia nos trunfos históricos.',
      'Bíblia Sagrada completa com devocional diário, notas e versículos marcados.',
      'Persistência local reforçada de especialidades e progresso de classes.'
    ]
  },
  {
    version: '2.3.0',
    date: '24/02/2026',
    title: 'Tema Escuro Refinado e Modo Offline PWA',
    changes: [
      'Suporte a PWA avançado com instalação no celular e cache inteligente de recursos.',
      'Paleta de alto contraste para o Modo Escuro e economia de bateria.',
      'Melhorias no leitor de manuais PDF e materiais do Desbrava+.'
    ]
  },
  {
    version: '2.2.0',
    date: '10/02/2026',
    title: 'Gestão de Especialidades e Classes',
    changes: [
      'Requisitos completos e atualizados para todas as classes regulares e avançadas.',
      'Registro de especialidades concluídas e em andamento.',
      'Geração de relatórios e fichas de avaliação para instrutores.'
    ]
  },
  {
    version: '2.0.0',
    date: '01/01/2026',
    title: 'Lançamento DBV Tudo 2026',
    changes: [
      'Nova arquitetura visual com suporte unificado para Desbravadores e Aventureiros.',
      'Sincronização na nuvem com autenticação segura e perfil de usuário.'
    ]
  }
];
