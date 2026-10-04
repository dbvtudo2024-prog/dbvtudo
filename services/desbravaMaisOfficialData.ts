import { DesbravaMais } from './supabaseService';

export interface DesbravaMaisChecklistItem {
  id: string;
  nivel: 'NIVEL_1' | 'NIVEL_2';
  secao: string;
  codigo: string;
  titulo: string;
  detalhe: string;
}

export interface DesbravaMaisOfficialItem extends DesbravaMais {
  categoriaBadge: string;
  publicoAlvo: string;
  destaqueCor: string;
}

/**
 * Requisitos Oficiais do Guia do Programa Desbrava+ (Divisão Sul-Americana - DSA)
 * Destinado aos adolescentes de 16 e 17 anos no Clube de Desbravadores.
 */
export const DESBRAVA_MAIS_CHECKLIST: DesbravaMaisChecklistItem[] = [
  // NÍVEL 1 — ANO 1 (16 ANOS)
  {
    id: 'dbv_plus_n1_1',
    nivel: 'NIVEL_1',
    secao: 'I. Requisitos Gerais',
    codigo: '1.1',
    titulo: 'Ter no mínimo 16 anos de idade e ser membro ativo do Clube de Desbravadores',
    detalhe: 'Manter frequência regular, uniforme em dia (RUD) e cadastro ativo no SGC.'
  },
  {
    id: 'dbv_plus_n1_2',
    nivel: 'NIVEL_1',
    secao: 'I. Requisitos Gerais',
    codigo: '1.2',
    titulo: 'Ano Bíblico Jovem e Leitura do Livro do Ano',
    detalhe: 'Completar o plano anual de leitura bíblica e ler o Livro do Ano dos Desbravadores/Jovens indicado pela DSA.'
  },
  {
    id: 'dbv_plus_n1_3',
    nivel: 'NIVEL_1',
    secao: 'II. Trilha do Saber',
    codigo: '2.1',
    titulo: 'Concluir Classes Regulares/Avançadas pendentes ou Classes Agrupadas',
    detalhe: 'Regularizar classes de 10 a 15 anos (Amigo a Guia) e/ou avançar no currículo de Classes Agrupadas.'
  },
  {
    id: 'dbv_plus_n1_4',
    nivel: 'NIVEL_1',
    secao: 'II. Trilha do Saber',
    codigo: '2.2',
    titulo: 'Conquistar 1 Mestrado em Especialidades ou 4 novas Especialidades',
    detalhe: 'Priorizar especialidades que auxiliem na instrução de unidades (Arte de Acampar, Primeiros Socorros, Nós e Amarras, Cidadania Cristã).'
  },
  {
    id: 'dbv_plus_n1_5',
    nivel: 'NIVEL_1',
    secao: 'III. Capacitação Aplicada • Unidade',
    codigo: '3.1',
    titulo: 'Estágio Supervisionado como Conselheiro(a) Associado(a) por no mínimo 3 meses',
    detalhe: 'Auxiliar diretamente um Conselheiro titular (18+ anos) em uma unidade de 10-12 ou 13-15 anos.'
  },
  {
    id: 'dbv_plus_n1_6',
    nivel: 'NIVEL_1',
    secao: 'III. Capacitação Aplicada • Unidade',
    codigo: '3.2',
    titulo: 'Planejar e dirigir pelo menos 4 momentos do Cantinho da Unidade',
    detalhe: 'Conduzir chamada, inspeção de uniforme, devocional da unidade e acompanhamento do cartão sob supervisão.'
  },
  {
    id: 'dbv_plus_n1_7',
    nivel: 'NIVEL_1',
    secao: 'III. Capacitação Aplicada • Unidade',
    codigo: '3.3',
    titulo: 'Realizar pelo menos 2 visitas aos lares de desbravadores da unidade',
    detalhe: 'Visitar as famílias acompanhado do Conselheiro titular ou membro da Diretoria, fortalecendo o vínculo Clube-Família.'
  },
  {
    id: 'dbv_plus_n1_8',
    nivel: 'NIVEL_1',
    secao: 'IV. Capacitação Aplicada • Instrução',
    codigo: '4.1',
    titulo: 'Preparar e ministrar 2 requisitos de uma Classe Regular e 1 Especialidade',
    detalhe: 'Elaborar plano de aula prático e aplicar avaliação junto ao Instrutor responsável.'
  },

  // NÍVEL 2 — ANO 2 (17 ANOS)
  {
    id: 'dbv_plus_n2_1',
    nivel: 'NIVEL_2',
    secao: 'I. Requisitos Gerais',
    codigo: '1.1',
    titulo: 'Ter 17 anos de idade e testemunho cristão exemplar no Clube e na Igreja',
    detalhe: 'Participar ativamente dos cultos, Escola Sabatina de Adolescentes/Jovens e projetos missionários.'
  },
  {
    id: 'dbv_plus_n2_2',
    nivel: 'NIVEL_2',
    secao: 'I. Requisitos Gerais',
    codigo: '1.2',
    titulo: 'Participar do Curso de Treinamento de Diretoria (CTD - 10 horas) promovido pela Associação/Missão',
    detalhe: 'Concluir os módulos básicos de formação para liderança do Clube de Desbravadores.'
  },
  {
    id: 'dbv_plus_n2_3',
    nivel: 'NIVEL_2',
    secao: 'II. Capacitação Aplicada • Gestão do Clube',
    codigo: '2.1',
    titulo: 'Estágio prático nos setores de Secretaria (SGC), Tesouraria e Almoxarifado',
    detalhe: 'Conhecer relatórios mensais, controle de seguro anual, patrimônio de barracas e livro de atas.'
  },
  {
    id: 'dbv_plus_n2_4',
    nivel: 'NIVEL_2',
    secao: 'II. Capacitação Aplicada • Gestão do Clube',
    codigo: '2.2',
    titulo: 'Participar como convidado/estagiário em reuniões de planejamento da Diretoria',
    detalhe: 'Compreender o funcionamento da Comissão Executiva e da Comissão Regular do Clube (Manual Administrativo DSA).'
  },
  {
    id: 'dbv_plus_n2_5',
    nivel: 'NIVEL_2',
    secao: 'III. Comissão Especial e Eventos',
    codigo: '3.1',
    titulo: 'Integrar a Comissão Especial de organização do Acampamento do Clube',
    detalhe: 'Auxiliar no planejamento de cardápio, segurança, pioneiria, programa espiritual ou fogo do conselho.'
  },
  {
    id: 'dbv_plus_n2_6',
    nivel: 'NIVEL_2',
    secao: 'III. Comissão Especial e Eventos',
    codigo: '3.2',
    titulo: 'Colaborar na organização do Dia Mundial dos Desbravadores ou Cerimônia de Investidura',
    detalhe: 'Apoiar na liturgia, recepção, guarda de bandeiras e ensaio de Ordem Unida.'
  },
  {
    id: 'dbv_plus_n2_7',
    nivel: 'NIVEL_2',
    secao: 'IV. Ordem Unida e Campo',
    codigo: '4.1',
    titulo: 'Comandar uma formatura completa (abertura/encerramento) e instruir evolução básica de Ordem Unida',
    detalhe: 'Aplicar corretamente os comandos a pé firme, em marcha, apito e gestos conforme o Manual de Ordem Unida da DSA.'
  },
  {
    id: 'dbv_plus_n2_8',
    nivel: 'NIVEL_2',
    secao: 'V. Transição para a Classe de Líder',
    codigo: '5.1',
    titulo: 'Apresentar relatório final ao Orientador Desbrava+ para recebimento do Pin Nível 2 e ingresso em Líder aos 18 anos',
    detalhe: 'Concluir o ciclo de 16-17 anos pronto para assumir funções oficiais de liderança aos 18 anos.'
  }
];

/**
 * Acervo Oficial de Materiais do Programa Desbrava+ e Guias Complementares (DSA)
 */
export const DESBRAVA_MAIS_OFFICIAL_MATERIALS: DesbravaMaisOfficialItem[] = [
  {
    id: 9001,
    Nome: 'Guia Oficial do Programa Desbrava+ (16 e 17 Anos - DSA)',
    categoriaBadge: 'Programa Desbrava+',
    publicoAlvo: 'Adolescentes de 16 e 17 anos e Diretoria',
    destaqueCor: 'from-fuchsia-600 to-purple-700',
    descricao:
      'Estrutura oficial da Divisão Sul-Americana (DSA) para retenção, discipulado e capacitação prática de adolescentes de 16 e 17 anos na transição entre as Classes Regulares e a Classe de Líder.',
    Conteudo: `1. O QUE É O PROGRAMA DESBRAVA+?
O Programa Desbrava+ (Desbrava Mais) foi instituído pela Divisão Sul-Americana (DSA) da Igreja Adventista do Sétimo Dia para atender especificamente a faixa etária de 16 e 17 anos no Clube de Desbravadores.
Aos 15 anos, o desbravador conclui a última classe regular (Guia / Guia de Exploração), mas pelo Regulamento oficial da DSA só pode ingressar na Classe de Líder ao completar 18 anos. O Desbrava+ preenche essa lacuna de 2 anos com um programa prático de liderança assistida ("aprender fazendo").

2. OBJETIVOS OFICIAIS DO DESBRAVA+ (DSA)
• Evitar a evasão dos adolescentes de 16 e 17 anos após concluírem a classe de Guia.
• Proporcionar uma transição gradual, segura e supervisionada de "desbravador" para "membro da diretoria".
• Concluir classes regulares/avançadas pendentes por meio das Classes Agrupadas.
• Desenvolver habilidades práticas de aconselhamento, instrução, administração e acampamento sob mentoria.
• Preparar o jovem técnica e espiritualmente para ingressar na Classe de Líder aos 18 anos.

3. OS 3 PILARES DO PROGRAMA
• PILAR 1 — TRILHA DO SABER: Conclusão das Classes Regulares/Avançadas (via Classes Agrupadas para quem entrou mais tarde no Clube), conquista de novas Especialidades e Mestrados, Ano Bíblico e leitura do Livro do Ano.
• PILAR 2 — CAPACITAÇÃO APLICADA: Estágio prático supervisionado nas Unidades (como Conselheiro Associado), nas Classes e Especialidades (como Instrutor Auxiliar) e nos setores administrativos (Secretaria/SGC, Tesouraria, Capelania e Almoxarifado).
• PILAR 3 — COMISSÃO ESPECIAL: Participação direta no planejamento e execução de eventos oficiais do Clube (Acampamento anual, Dia Mundial dos Desbravadores, Admissão em Lenço, Investidura e Feira de Especialidades).

4. ESTRUTURA EM 2 NÍVEIS E INSÍGNIA (PIN RUD)
• Nível 1 (Ano 1 — 16 anos): Foco no trabalho com a Unidade (Conselheiro Associado), instrução de requisitos e conclusão da Trilha do Saber.
• Nível 2 (Ano 2 — 17 anos): Foco em Gestão do Clube, Comissão Especial de Acampamento/Eventos, Curso de Treinamento de Diretoria (CTD - 10h) e preparação para Líder.
• Reconhecimento no Uniforme: Ao concluir cada nível, o participante recebe o Pin/Insígnia oficial do Desbrava+ conforme previsto no Regulamento de Uniformes (RUD-DSA).`
  },
  {
    id: 9002,
    Nome: 'Diretrizes do Manual Administrativo: Atuação de 16 e 17 Anos',
    categoriaBadge: 'Diretrizes DSA',
    publicoAlvo: 'Diretores, Associados e Conselheiros',
    destaqueCor: 'from-indigo-600 to-blue-700',
    descricao:
      'Normas oficiais do Manual Administrativo do Clube de Desbravadores (DSA) sobre responsabilidades legais, supervisão adulta e cargos permitidos para jovens de 16 e 17 anos (batizados e não batizados).',
    Conteudo: `1. PRINCÍPIO LEGAL E ECLESIÁSTICO (MANUAL ADMINISTRATIVO DSA)
De acordo com o Manual Administrativo do Clube de Desbravadores da Divisão Sul-Americana (DSA) e a legislação civil de proteção ao menor:
• Adolescentes de 16 e 17 anos ainda são menores de idade perante a lei civil; portanto, NÃO podem responder legalmente sozinhos por crianças e adolescentes de 10 a 15 anos em acampamentos, pernoites ou saídas externas.
• Toda atuação de participantes de 16 e 17 anos no Clube deve ocorrer SEMPRE sob supervisão direta de um membro adulto da Diretoria (18 anos ou mais).

2. DIFERENCIAÇÃO DE ATUAÇÃO (BATIZADOS X NÃO BATIZADOS)
O Guia Desbrava+ e o Manual Administrativo estabelecem critérios claros e inclusivos para manter todos os adolescentes de 16 e 17 anos engajados:

A) ADOLESCENTES DE 16 E 17 ANOS BATIZADOS:
• Podem atuar como Conselheiro(a) Associado(a) (Auxiliar de Unidade), acompanhando o Conselheiro titular (18+ anos).
• Podem atuar como Instrutores de Classes e Especialidades sob coordenação do Diretor Associado.
• Podem atuar como Auxiliares de Secretaria, Tesouraria, Capelania e Almoxarifado.
• Usam o uniforme de Desbravador com os distintivos correspondentes às classes conquistadas e participam da formação Desbrava+.

B) ADOLESCENTES DE 16 E 17 ANOS NÃO BATIZADOS:
• Permanecem integrados ao grupo Desbrava+ e são acompanhados com carinho na Classe Bíblica Juvenil rumo ao batismo.
• Podem atuar em funções técnicas e de apoio operacional: Instrutor Auxiliar de Habilidades Técnicas (ex: Nós e Amarras, Arte de Acampar, Ordem Unida), Auxiliar de Logística, Patrimônio/Almoxarifado e Equipe de Eventos.
• Não assumem cargos de liderança espiritual direta (Capelania ou Conselheiro) até a realização do batismo, conforme normas eclesiásticas da IASD.

3. CARGOS EXCLUSIVOS PARA MAIORES DE 18 ANOS (BATIZADOS)
Conforme o Manual Administrativo da DSA, somente membros batizados com 18 anos completos ou mais podem exercer a titularidade de:
• Diretor(a) do Clube (eleito pela Comissão de Nomeações da Igreja)
• Diretor(a) Associado(a)
• Conselheiro(a) Titular de Unidade
• Secretário(a) Titular e Tesoureiro(a) Titular do Clube
• Capelão(ã) Titular do Clube.`
  },
  {
    id: 9003,
    Nome: 'Manual do Orientador Desbrava+ (Como Implantar no Clube)',
    categoriaBadge: 'Diretrizes DSA',
    publicoAlvo: 'Diretor do Clube e Orientador Desbrava+',
    destaqueCor: 'from-emerald-600 to-teal-700',
    descricao:
      'Passo a passo prático para a Diretoria implantar a turma Desbrava+ no Clube local, organizar a escala de rodízio prático e avaliar o progresso mensal.',
    Conteudo: `1. QUEM É O ORIENTADOR DESBRAVA+?
No início do ano, a Comissão Executiva do Clube designa um membro experiente da Diretoria (geralmente um Diretor Associado ou Instrutor Sênior investido em Líder) para ser o Orientador Desbrava+.
Sua função é mentorar individualmente os adolescentes de 16 e 17 anos, distribuir as escalas de estágio prático e assinar o Guia do Programa Desbrava+.

2. COMO FUNCIONA NA REUNIÃO DE DOMINGO?
Os participantes do Desbrava+ não ficam ociosos nem formam uma "unidade isolada" o tempo todo:
• Abertura e Ordem Unida: Participam em forma junto à guarda de bandeiras, pelotão especial ou auxiliando a unidade onde fazem estágio.
• Cantinho da Unidade (30-40 min): Atuam nas unidades de 10-15 anos como Conselheiros Associados em regime de escala trimestral, aprendendo na prática como pastorear desbravadores.
• Momento das Classes e Especialidades (50-60 min): Reúnem-se por 20 minutos com o Orientador Desbrava+ para sua própria Trilha do Saber (Classes Agrupadas / CTD) e, no tempo restante, atuam como Instrutores Auxiliares nas classes de Amigo a Guia.

3. ESCALA DE RODÍZIO PRÁTICO (CAPACITAÇÃO APLICADA)
Para que o jovem de 16 e 17 anos conheça todo o funcionamento do Clube antes dos 18 anos, recomenda-se o rodízio trimestral:
• 1º Trimestre: Estágio em Unidade de 10-12 anos (Amigo, Companheiro, Pesquisador).
• 2º Trimestre: Estágio em Unidade de 13-15 anos (Pioneiro, Excursionista, Guia).
• 3º Trimestre: Estágio em Instrução de Especialidades e Ordem Unida.
• 4º Trimestre: Estágio em Gestão (Secretaria/SGC, Almoxarifado e Comissão do Acampamento).

4. AVALIAÇÃO E INVESTIDURA / RECONHECIMENTO
• A avaliação no Desbrava+ é contínua, prática e formativa (sem provas punitivas).
• Ao final do Ano 1 (16 anos) e do Ano 2 (17 anos), o Clube realiza a entrega solene do Certificado e do Pin Desbrava+ durante a Cerimônia de Investidura ou Dia Mundial dos Desbravadores.`
  },
  {
    id: 9004,
    Nome: 'Curso de Treinamento de Diretoria (CTD - 10 Horas DSA)',
    categoriaBadge: 'Capacitação & Liderança',
    publicoAlvo: 'Aspirantes a Líder, Desbrava+ e Diretoria',
    destaqueCor: 'from-amber-500 to-orange-600',
    descricao:
      'Síntese completa dos módulos oficiais do Curso de Treinamento de Diretoria (10 horas) exigido pelo Manual Administrativo da DSA e pré-requisito da Classe de Líder.',
    Conteudo: `MÓDULO 1 — HISTÓRIA, FILOSOFIA E OBJETIVOS DO CLUBE (1h30)
• Raízes históricas mundiais (1907 MV, 1919 Camaradas de J.P. Neff, 1930 Santa Ana com Theron Johnston e Lester Bond, 1946 primeiro triângulo por John Hancock, 1950 oficialização pela Associação Geral com Laurence Skinner).
• História na Divisão Sul-Americana (1955 em Lima-Peru com o casal Nercida e Armando Ruiz; 1959 primeiros clubes no Brasil em Ribeirão Preto-SP, Rio de Janeiro e Florianópolis).
• Filosofia da Educação Tripla (Físico, Mental e Espiritual — Lucas 2:52) e Salvação pelo Serviço.

MÓDULO 2 — COMPREENDENDO O ADOLESCENTE DE 10 A 15 ANOS (1h30)
• Características físicas, mentais, sociais e espirituais dos pré-adolescentes (10-12 anos: idade da energia, colecionismo e admiração por heróis) e adolescentes (13-15 anos: busca de identidade, grupo de amigos e questionamento).
• Disciplina Redentiva (Manual Administrativo): administrar com amor, firmeza e propósito restaurador, nunca aplicando castigos físicos ou constrangimento público.

MÓDULO 3 — ADMINISTRAÇÃO E PLANEJAMENTO DO CLUBE (2h)
• Eleição do Diretor pela Comissão da Igreja; formação da Comissão Executiva e da Comissão Regular do Clube.
• Planejamento Anual aprovado pela Comissão da Igreja; calendário integrado com a Associação/Missão.
• Finanças: Todo recurso do Clube (mensalidades, taxas, doações) passa obrigatoriamente pela Tesouraria da Igreja local (Sistema 7me / ACMS).
• SGC (Sistema de Gerenciamento de Clubes) e obrigatoriedade do Seguro Anual (ARM) para 100% dos membros antes de qualquer atividade externa.

MÓDULO 4 — SISTEMA DE UNIDADES E REUNIÃO REGULAR (1h30)
• A Unidade é o coração do Clube: 6 a 8 desbravadores do mesmo sexo, liderados pelo Conselheiro.
• Cargos da Unidade: Capitão (eleito pela unidade, porta o banderim), Secretário, Tesoureiro, Capelão, Padioleiro e Almoxarife.
• Estrutura da Reunião de 3 horas: Abertura e Ordem Unida (20 min), Devocional Geral (15 min), Cantinho da Unidade (35 min), Classes e Especialidades (60 min), Recreio/Jogos Cooperativos (35 min), Encerramento (15 min).

MÓDULO 5 — CURRÍCULO DE CLASSES E ESPECIALIDADES (1h30)
• Classes Regulares e Avançadas: Amigo (10 anos - Azul), Companheiro (11 anos - Vermelho), Pesquisador (12 anos - Verde), Pioneiro (13 anos - Cinza), Excursionista (14 anos - Roxo) e Guia (15 anos - Amarelo).
• Classes Agrupadas para adolescentes de 11 a 17 anos que ingressam mais tarde no Clube.
• Metodologia prática de ensino: proibição de transformar o Clube em "sala de aula escolar"; pelo menos 50% do ensino deve ser prático e ao ar livre.

MÓDULO 6 — ACAMPAMENTO, ORDEM UNIDA E SEGURANÇA (2h)
• Escolha do local, autorização assinada pelos pais/responsáveis, ficha médica atualizada e kit de primeiros socorros.
• Regras de segurança em acampamento, cozinha higiênica, pioneirias com amarras corretas e Fogo do Conselho.
• Finalidade educativa da Ordem Unida (disciplina voluntária, postura, espírito de equipe e respeito aos símbolos pátrios e do Clube).`
  },
  {
    id: 9005,
    Nome: 'Protocolo Oficial de Cerimônias do Clube (Manual Administrativo)',
    categoriaBadge: 'Capacitação & Liderança',
    publicoAlvo: 'Diretoria, Regional e Desbrava+',
    destaqueCor: 'from-rose-600 to-red-700',
    descricao:
      'Diretrizes oficiais da DSA para realização das cerimônias de Admissão em Lenço, Entrega de Especialidades, Investidura de Classes e Dia Mundial dos Desbravadores.',
    Conteudo: `1. CERIMÔNIA DE ADMISSÃO EM LENÇO (RECEBIMENTO DO LENÇO)
• Quando ocorre: Após o aspirante frequentar regularmente o Clube pelo período probatório (geralmente 2 a 3 meses) e cumprir os pré-requisitos do folheto "Conhecendo o Meu Clube".
• Pré-requisitos oficiais: Memorizar e explicar o Voto e a Lei do Desbravador, conhecer o Hino dos Desbravadores, o significado do Emblema D1 (Triângulo) e possuir o uniforme oficial ou uniforme de atividades conforme orientação do Clube.
• Quem coloca o lenço: Membros investidos em Líder (ou Diretoria autorizada pelo Regional/Departamental), com a participação dos pais ou padrinhos ao lado do desbravador.
• Saudação: Após receber o lenço e o arganel, o novo desbravador presta o Voto na posição oficial ("Para o Voto, Posição!").

2. CERIMÔNIA DE INVESTIDURA (CLASSES REGULARES, AVANÇADAS E LÍDER)
• Autoridade competente: A Investidura de Classes Regulares e Avançadas é presidida pelo Diretor do Ministério de Desbravadores da Associação/Missão (Departamental), Coordenador Geral ou Regional devidamente autorizado. A Investidura de Líder é presidida exclusivamente pelo Departamental ou seu representante oficial.
• Avaliação prévia: Os cartões/cadernos e relatórios no SGC devem ser auditados e aprovados pelo Regional antes da data da cerimônia.
• Simbolismo: Inclui entrada solene das bandeiras, acendimento das velas dos Ideais e das Classes, comprovação prática de conhecimentos e colocação do botão/tira de classe e divisa.

3. CERIMÔNIA DE ENTREGA DE ESPECIALIDADES E MESTRADOS
• Pode ser realizada trimestralmente no Clube ou na igreja local pelo próprio Diretor do Clube e Instrutores, não precisando aguardar o final do ano, mantendo a motivação dos desbravadores elevada.

4. DIA MUNDIAL DOS DESBRAVADORES (3º SÁBADO DE SETEMBRO)
• Data oficial estabelecida pela Associação Geral e celebrada em toda a Divisão Sul-Americana no terceiro sábado de setembro.
• Precedido pela Semana do Lenço (uso do lenço na escola, trabalho e comunidade com projetos de impacto social e evangelismo juvenil).`
  },
  {
    id: 9006,
    Nome: 'Guia Prático de Visitação e Pastoreio da Unidade',
    categoriaBadge: 'Prática na Unidade',
    publicoAlvo: 'Conselheiros e Associados Desbrava+',
    destaqueCor: 'from-cyan-600 to-blue-700',
    descricao:
      'Roteiro oficial baseado no Manual Administrativo da DSA para visitação aos lares dos desbravadores, integração com pais não adventistas e acompanhamento da Classe Bíblica.',
    Conteudo: `1. A IMPORTÂNCIA DA VISITAÇÃO NO MANUAL ADMINISTRATIVO
O Manual Administrativo do Clube de Desbravadores destaca que o Conselheiro é o pastor imediato de seus 6 a 8 desbravadores. Conhecer a realidade familiar de cada juvenil é requisito essencial tanto para o Conselheiro quanto para o jovem do Desbrava+ (Nível 1).

2. REGRAS DE OURO ANTES DA VISITA
• Nunca visite sozinho: Vá sempre em dupla (Conselheiro titular + Conselheiro Associado/Desbrava+ ou membro da Diretoria).
• Agende previamente com os pais ou responsáveis, informando o horário de chegada e que a visita será breve (20 a 30 minutos).
• Apresente-se com o uniforme oficial ou uniforme de atividades do Clube com o lenço, transmitindo organização e confiança aos pais.

3. ROTEIRO DE 25 MINUTOS NO LAR DO DESBRAVADOR
• 1º Quebra-gelo e Elogio Sincero (5 min): Cumprimente os pais pelo nome e destaque qualidades reais e progressos que o filho(a) tem demonstrado na Unidade.
• 2º Apresentação do Calendário e Atividades (10 min): Mostre aos pais o cartão de classe que o desbravador está cumprindo, explique os próximos eventos (acampamento, projetos comunitários) e tire dúvidas sobre segurança.
• 3º Momento Espiritual e Oração pela Família (10 min): Compartilhe um verso bíblico curto de encorajamento, pergunte se a família tem algum pedido especial de oração e ore abençoando o lar.

4. ATENÇÃO ESPECIAL ÀS FAMÍLIAS NÃO ADVENTISTAS
• O Clube de Desbravadores é uma das maiores pontes missionárias da igreja: muitas unidades possuem de 30% a 60% de desbravadores de lares não adventistas.
• Respeite a cultura familiar, convide os pais para assistirem ao Dia Mundial dos Desbravadores, Cerimônia de Lenço e Investidura, e apoie o juvenil na Classe Bíblica.`
  }
];
