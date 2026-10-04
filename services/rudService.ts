import { ClubType, CulturaItem } from '../types';

/**
 * Catálogo Oficial do Regulamento de Uniformes (RUD - Divisão Sul-Americana)
 * Carregado diretamente com as imagens oficiais da internet (Wiki MDA / DSA e Supabase Storage),
 * sem armazenar imagens em Base64 no banco de dados.
 * Estruturado exatamente no mesmo padrão visual da aba de Emblemas (Acordeão -> Sub-itens).
 */

export const RUD_CREDITS = {
  titulo: 'Créditos e Fonte Oficial das Informações',
  regulamento: 'Regulamento de Uniformes (RUD) — Ministério de Desbravadores e Aventureiros da Divisão Sul-Americana (DSA) da Igreja Adventista do Sétimo Dia (IASD).',
  acervo: 'Acervo técnico, normas e ilustrações extraídos da Wiki Oficial do Ministério de Desbravadores e Aventureiros (mda.wiki.br) e do portal oficial Adventistas.org.',
  urlWikiUniforme: 'https://mda.wiki.br/Uniforme',
  urlWikiGala: 'https://mda.wiki.br/Uniforme_de_Gala',
  urlWikiEmblemasDbv: 'https://mda.wiki.br/Emblemas_dos_Desbravadores',
  urlWikiEmblemasAvt: 'https://mda.wiki.br/Emblemas_dos_Aventureiros'
};

export const RUD_UNIFORMES_DBV: CulturaItem[] = [
  {
    id: 'rud_dbv_gala_10_15',
    club: ClubType.PATHFINDER,
    titulo: 'Uniforme de Gala (10 a 15 Anos)',
    imagem: '',
    subitems: [
      {
        id: 'rud_dbv_gala_admissao',
        club: ClubType.PATHFINDER,
        titulo: 'Admissão em Lenço e Posse do Uniforme A',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_d1.svg',
        imageSize: 'sm',
        descricao:
          'O Uniforme de Gala somente poderá ser usado a partir da cerimônia de Admissão em Lenço, após cumpridos os requisitos do Cartão "Nosso Clube". A admissão em lenço somente poderá ocorrer quando o Desbravador ou adulto possuir o seu próprio Uniforme A (Gala oficial).'
      },
      {
        id: 'rud_dbv_gala_masc_camisa_10_15',
        club: ClubType.PATHFINDER,
        titulo: 'Camisa Masculina — 10 a 15 Anos (Cáqui)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@camisa_masculina_uniforme_gala_desbravadores.png',
        imageSize: 'sm',
        descricao:
          'Conforme o modelo oficial, em tecido Grafil, Grafil Plus ou Tricoline na cor cáqui e botões transparentes, com mangas curtas ou compridas conforme o padrão do Clube. No caso da manga curta, a barra deverá ter 2,6 cm com costura externa.\n\nTerá dois bolsos frontais com uma prega vertical sobreposta de 3 cm e uma tampa retangular de 4 cm de largura. É opcional fechar a tampa (utilizar colchetes de pressão ou velcro ocultos — nunca usar botões nos bolsos). Sobre cada ombro haverá um porta-platina (com entretela), costurado na extremidade da costura da cava e abotoado junto à gola com 4 cm de largura.'
      },
      {
        id: 'rud_dbv_gala_masc_calca_10_15',
        club: ClubType.PATHFINDER,
        titulo: 'Calça Masculina — 10 a 15 Anos (Verde-Petróleo)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@calca_uniforme_gala_desbravadores.png',
        imageSize: 'sm',
        descricao:
          'Modelo social, em tecido Terbrim ou Gabardine na cor verde-petróleo, barra lisa, com 6 (seis) passadores de cinto, dois bolsos frontais em diagonal (modelo faca) e dois bolsos traseiros embutidos, sem tampa e sem botão. É opcional o uso de bolsinho frontal embutido.'
      },
      {
        id: 'rud_dbv_gala_fem_camisa_10_15',
        club: ClubType.PATHFINDER,
        titulo: 'Blusa Feminina — 10 a 15 Anos (Cáqui)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@camisa_feminina_uniforme_gala_desbravadores.png',
        imageSize: 'sm',
        descricao:
          'Conforme o modelo oficial, em tecido Grafil, Grafil Plus ou Tricoline na cor cáqui e botões transparentes, com mangas curtas ou compridas conforme o padrão do Clube (na manga curta, barra de 2,6 cm com costura externa).\n\nTerá dois bolsos com uma prega vertical sobreposta de 3 cm e uma tampa retangular de 4 cm de largura (opcional fechar com colchetes de pressão ou velcro ocultos, sem botões). Sobre cada ombro haverá um porta-platina com entretela de 4 cm de largura. A blusa poderá ser acinturada, tendo pences na frente e atrás.'
      },
      {
        id: 'rud_dbv_gala_fem_saia_10_15',
        club: ClubType.PATHFINDER,
        titulo: 'Saia Feminina — 10 a 15 Anos (Verde-Petróleo)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@saia_uniforme_gala_desbravadores.png',
        imageSize: 'sm',
        descricao:
          'Conforme o modelo oficial, em tecido Terbrim ou Gabardine na cor verde-petróleo, com uma prega macho central na frente (15 ou 20 cm medidos a partir da base da saia, conforme a altura da pessoa) e lisa atrás, com zíper na cintura, 6 (seis) passadores de cinto e duas pences na frente e atrás.\n\nÉ opcional o uso de bolsos embutidos na frente. É obrigatório usar na altura do joelho ou abaixo.'
      }
    ]
  },
  {
    id: 'rud_dbv_gala_16_mais',
    club: ClubType.PATHFINDER,
    titulo: 'Uniforme de Gala (A partir de 16 Anos e Liderança)',
    imagem: '',
    subitems: [
      {
        id: 'rud_dbv_gala_masc_camisa_16',
        club: ClubType.PATHFINDER,
        titulo: 'Camisa Masculina — A partir de 16 Anos (Branca)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@camisa_masculina_uniforme_gala_desbravadores_diretoria.png',
        imageSize: 'sm',
        descricao:
          'Conforme o modelo oficial, na cor branca em tecido Grafil, Grafil Plus ou Tricoline, com mangas curtas ou compridas quando as circunstâncias assim exigirem. Terá dois bolsos com prega vertical sobreposta de 3 cm e tampa retangular de 4 cm de largura (fechamento opcional com velcro ou colchetes ocultos, sem botões).\n\nSobre cada ombro haverá um porta-platina (com entretela) de 4 cm de largura, costurado na extremidade do ombro e abotoado junto à gola. Barra da manga curta com dobra de 2,6 cm e costura externa. Botões transparentes.'
      },
      {
        id: 'rud_dbv_gala_masc_calca_16',
        club: ClubType.PATHFINDER,
        titulo: 'Calça Masculina — A partir de 16 Anos (Verde-Petróleo)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@calca_uniforme_gala_desbravadores.png',
        imageSize: 'sm',
        descricao:
          'Modelo social, na cor verde-petróleo em tecido Terbrim ou Gabardine, barra lisa, com 6 passadores, dois bolsos traseiros embutidos (sem tampa e sem botão), dois bolsos dianteiros em diagonal modelo faca, um bolsinho frontal embutido e duas pregas (voltadas para fora) de cada lado.'
      },
      {
        id: 'rud_dbv_gala_fem_blusa_16',
        club: ClubType.PATHFINDER,
        titulo: 'Blusa Feminina — A partir de 16 Anos (Branca)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@camisa_feminina_uniforme_gala_desbravadores_diretoria.png',
        imageSize: 'sm',
        descricao:
          'Conforme o modelo oficial, na cor branca em tecido Grafil, Grafil Plus ou Tricoline, com mangas curtas ou compridas quando as circunstâncias exigirem. Terá dois bolsos com prega vertical sobreposta de 3 cm e tampa retangular de 4 cm de largura.\n\nSobre cada ombro haverá um porta-platina (com entretela) de 4 cm de largura. Barra da manga curta com dobra de 2,6 cm e costura externa, botões transparentes, podendo ser acinturada com pences na frente e atrás.'
      },
      {
        id: 'rud_dbv_gala_fem_saia_16',
        club: ClubType.PATHFINDER,
        titulo: 'Saia Feminina — A partir de 16 Anos (Verde-Petróleo)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@saia_uniforme_gala_desbravadores.png',
        imageSize: 'sm',
        descricao:
          'Conforme o modelo oficial, na cor verde-petróleo em tecido Terbrim ou Gabardine. Com uma prega macho na frente, zíper atrás, 6 passadores de 4 x 1,5 cm, duas pences dianteiras e duas traseiras, tendo a base da saia na altura do joelho. O uso de bolsos embutidos na costura lateral é opcional (o uso de saia-calça fica vinculado a permissão especial da DSA).'
      },
      {
        id: 'rud_dbv_gala_clube_lideres',
        club: ClubType.PATHFINDER,
        titulo: 'Uniforme do Clube de Líderes',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_l_d1.png',
        imageSize: 'sm',
        descricao:
          'Utiliza o mesmo uniforme dos Desbravadores acima de 16 anos:\n• Calça ou saia verde-petróleo (referência Santista, Gabardine 31 - X66 - 194906 TP).\n• Camisa ou blusa branca (referência Santista, Tricoline, Grafio 007 ou Grafio Plus 007 - 110601 TP).\n• Utiliza a mesma Bandeira Oficial dos Desbravadores.'
      },
      {
        id: 'rud_dbv_gala_departamentais',
        club: ClubType.PATHFINDER,
        titulo: 'Uniforme de Diretores, Regionais, Distritais, Pastores e Departamentais',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@galao.jpeg',
        imageSize: 'sm',
        descricao:
          'Usarão o mesmo uniforme dos Desbravadores acima de 16 anos, com a respectiva platina/galão correspondente à função.\n\nUniforme Exclusivo de Departamentais e Associados:\n• Túnica / Terno: Verde-petróleo na cor e tecidos definidos pela DSA, modelo americano.\n• Camisa: Branca lisa sem detalhes.\n• Gravata: Preta lisa sem detalhes (ou verde-petróleo conforme ocasião oficial).\n• Cinto: Verde-petróleo com fivela tendo o emblema D3.\n• Platina / Galão: No mesmo tecido da túnica/terno com tiras douradas de acordo com o cargo.\n• Tira de Cargo: Na manga direita, e identificação do Campo no local regulamentar.\n• Lenço: Usado de acordo com a investidura.\n• Tarjeta de Identificação: Com nome e campo identificado.\n• Torçal: Nas cores nacionais do país definidas pela DSA, com apito no bolso.'
      }
    ]
  },
  {
    id: 'rud_dbv_posicao_emblemas',
    club: ClubType.PATHFINDER,
    titulo: 'Posição dos Emblemas, Tiras e Distintivos',
    imagem: '',
    subitems: [
      {
        id: 'rud_dbv_pos_frente_10_15',
        club: ClubType.PATHFINDER,
        titulo: 'Frente da Camisa / Blusa (10 a 15 Anos)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@camisa_frente_uniforme_gala_desbravadores.png',
        imageSize: 'sm',
        descricao:
          'Pelo RUD (versão 2020):\n• Os Distintivos de Classes Regulares devem ser alinhados e centralizados na tampa do bolso esquerdo conforme forem sendo recebidos, sempre da esquerda para a direita de quem vê, com espaçamento de 0,4 cm entre eles.\n• Os Distintivos de Classes Avançadas ficam alinhados acima do bolso esquerdo em até duas linhas horizontais, dispostos em ordem crescente da esquerda para a direita de quem vê e de baixo para cima, centralizados.\n• A Tira com o Nome do Desbravador fica centralizada acima da tampa do bolso direito, e a Insígnia de Excelência acima dela.\n• O Distintivo de Batismo é usado na tampa do bolso direito (ou na faixa, abaixo da bandeira do país).'
      },
      {
        id: 'rud_dbv_pos_frente_16_mais',
        club: ClubType.PATHFINDER,
        titulo: 'Frente da Camisa / Blusa (A partir de 16 Anos e Diretoria)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@camisa_frente_uniforme_gala_desbravadores_diretoria.webp',
        imageSize: 'sm',
        descricao:
          'Para maiores de 16 anos, diretoria e líderes investidos:\n• Os Distintivos de Liderança (Líder, Líder Master e Líder Master Avançado) são posicionados acima dos distintivos de Classes Regulares na tampa do bolso esquerdo.\n• Os Distintivos de Classes Avançadas permanecem centralizados acima da tampa do bolso esquerdo.\n• No lado direito posicionam-se a Tira com o Nome (ou Tarjeta de Identificação), o Distintivo de Batismo na tampa do bolso direito e o Distintivo de Função quando aplicável.'
      },
      {
        id: 'rud_dbv_pos_mangas_10_15',
        club: ClubType.PATHFINDER,
        titulo: 'Mangas Direita e Esquerda (10 a 15 Anos)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@manga_uniforme_gala_desbravadores.png',
        imageSize: 'sm',
        descricao:
          'Posicionamento oficial nas mangas (10 a 15 anos):\n• Manga Direita: Tira com o Nome do Clube a 1,5 cm abaixo da costura do ombro; Tira de Cargo (quando houver) e Tira de Classe abaixo; Emblema D1 centralizado a 1,5 cm abaixo das tiras (ou a 6,0 cm da costura do ombro quando não houver tira de cargo/classe).\n• Manga Esquerda: Emblema do Campo (Associação/Missão) a 1,5 cm abaixo da costura do ombro; Emblema D2 a 1,5 cm abaixo do Emblema do Campo; Divisas de Classes a 1,0 cm abaixo do Emblema D2 (em ordem ascendente). O RUD também permite optar pelo uso de uma tira de classe individual correspondente à cor da última classe investida.'
      },
      {
        id: 'rud_dbv_pos_mangas_16_mais',
        club: ClubType.PATHFINDER,
        titulo: 'Mangas Direita e Esquerda (A partir de 16 Anos e Diretoria)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@manga_uniforme_gala_desbravadores_diretoria.webp',
        imageSize: 'sm',
        descricao:
          'Posicionamento oficial nas mangas para Diretoria e Líderes:\n• Manga Direita: Tira com o Nome do Clube (ou do Campo para Regionais/Distritais/Departamentais) a 1,5 cm da costura do ombro; Estrela de Tempo de Serviço; Tira de Cargo; Emblema D1 abaixo.\n• Manga Esquerda: Emblema do Campo a 1,5 cm da costura do ombro; Emblema L D1 (para investidos em Líder) ou D2 a 1,5 cm abaixo; Divisa de Líder (ou Divisas de Classes) a 1,0 cm abaixo.'
      }
    ]
  },
  {
    id: 'rud_dbv_lencos_prendedores',
    club: ClubType.PATHFINDER,
    titulo: 'Lenços e Prendedores de Lenço',
    imagem: '',
    subitems: [
      {
        id: 'rud_dbv_lenco_desbravador',
        club: ClubType.PATHFINDER,
        titulo: 'Lenço do Desbravador',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@lenco_desbravadores.jpg',
        imageSize: 'sm',
        descricao:
          'Triangular na cor amarela com o Emblema D2 bordado em suas cores originais no tamanho 11,5 cm x 8,5 cm. Deverá ser usado com o uniforme oficial de gala e com o uniforme de atividades. Quando necessário, também poderá ser usado com outra roupa, desde que combine com os princípios dos Desbravadores e que a pessoa esteja envolvida em atividades do Clube.\n\nÉ a identificação mundial dos Desbravadores; por isso, somente o lenço oficial pode ser usado. Disponível em 3 tamanhos (medidos de uma ponta superior à outra): P (85 cm), M (100 cm) e G (114 cm).'
      },
      {
        id: 'rud_dbv_lenco_lider',
        club: ClubType.PATHFINDER,
        titulo: 'Lenço de Líder',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@lenco_de_lider.jpg',
        imageSize: 'sm',
        descricao:
          'Na cor amarela com borda em viés vermelho e com 6 tiras bordadas correspondentes às cores das Classes Regulares, tendo abaixo o Emblema L D1 bordado no tamanho 10,5 cm x 10,5 cm.\n\nDe uso exclusivo após a investidura em Líder, com o uniforme oficial de gala e de atividades. Disponível em 3 tamanhos: P (85 cm), M (100 cm) e G (114 cm).'
      },
      {
        id: 'rud_dbv_prendedor_oficial',
        club: ClubType.PATHFINDER,
        titulo: 'Prendedor de Lenço Oficial (Metálico)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@prendedores_de_lenco_1.jpg',
        imageSize: 'sm',
        descricao:
          'Metálico dourado, medindo 3,8 cm x 2,0 cm com o Emblema D3 para o Desbravador, e com o Emblema L D1 para Líder investido na medida de 2,5 cm de diâmetro. Será permitido às unidades desenvolverem seus próprios prendedores exclusivamente para uso com o uniforme de atividades do clube.'
      },
      {
        id: 'rud_dbv_prendedor_opcional',
        club: ClubType.PATHFINDER,
        titulo: 'Prendedores de Lenço Opcionais (Tecido Bordado e 3 Anéis)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@prendedores_de_lenco_2.jpg',
        imageSize: 'sm',
        descricao:
          'Prendedores em tecido bordado no tamanho 4,5 cm x 2,5 cm (para Desbravadores com Emblema D2 em fundo cáqui ou branco e contorno verde-petróleo; para Líderes com Emblema L D1 e contorno amarelo), ou em metal com três anéis e Emblema D3.\n\nRegra de padronização: Todo o Clube deverá fazer a opção de usar o mesmo modelo de prendedor de lenço no uniforme de gala.'
      }
    ]
  },
  {
    id: 'rud_dbv_faixa_especialidades',
    club: ClubType.PATHFINDER,
    titulo: 'Faixa de Especialidades',
    imagem: '',
    subitems: [
      {
        id: 'rud_dbv_faixa_modelo',
        club: ClubType.PATHFINDER,
        titulo: 'Modelos, Tamanhos e Uso da Faixa',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@faixa_de_especialidades.gif',
        imageSize: 'sm',
        descricao:
          'Usada da direita para a esquerda, apoiada no ombro direito (sobre o porta-platina) e apoiada sobre a coxa esquerda, na cor verde-petróleo.\n\n• Larguras oficiais: P (11 cm), M (13 cm), G (16 cm) e GG (18 cm). Nos tamanhos de 16 cm e 18 cm há uma abertura caseada de 8 cm na parte superior central para a entrada do porta-platina.\n• Na ponta inferior da faixa, o Desbravador usa o Emblema D2 e o Líder investido usa o Emblema L D1.\n• Cada Desbravador ou Líder poderá usar apenas uma faixa, sempre com o Uniforme de Gala e somente quando possuir ao menos uma insígnia de especialidade.'
      },
      {
        id: 'rud_dbv_faixa_o_que_colocar',
        club: ClubType.PATHFINDER,
        titulo: 'O que colocar na Faixa (Frente e Atrás)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: '',
        imageSize: 'sm',
        descricao:
          'Itens permitidos na Faixa de Especialidades segundo o RUD:\n\n1. Bandeira do País: Centralizada e bordada a 4 cm abaixo da costura do ombro, medindo 5,2 cm x 3,3 cm.\n2. Distintivos de Classes Regulares e de Liderança: Quando usados na faixa, posicionam-se acima da Tira com o Nome.\n3. Distintivo de Batismo: Pode ser usado centralizado abaixo da bandeira do país e acima do nome.\n4. Tira com o Nome do Desbravador: A 8 cm abaixo da costura do ombro.\n5. Tira com o Nome da Última Classe investida.\n6. Distintivo de Função na Unidade: Abaixo da Tira de Classe.\n7. Distinções Honrosas: Outorgadas oficialmente ao Desbravador.\n8. Distintivos das Classes de Aventureiros: Se concluídas e investidas na idade correspondente.\n9. Insígnias de Especialidades e Mestrados (Na Frente): Agrupadas por categoria/cor de fundo e encabeçadas pela respectiva insígnia de Mestrado.\n10. Trunfos Oficiais (Na Parte de Trás): Exclusivamente de eventos de Associação, Missão, União e Divisão nos quais o Desbravador ou Líder tenha participado (contendo nome do evento, data e local, no tamanho padrão de 7,2 cm x 7,2 cm). Trunfos de eventos em que não participou só podem ser colocados no Colete.'
      }
    ]
  },
  {
    id: 'rud_dbv_acessorios_gala',
    club: ClubType.PATHFINDER,
    titulo: 'Cobertura, Cinto, Calçados, Torçal e Acessórios',
    imagem: '',
    subitems: [
      {
        id: 'rud_dbv_cobertura',
        club: ClubType.PATHFINDER,
        titulo: 'Cobertura (Boné Oficial)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@bones_gala.jpg',
        imageSize: 'sm',
        descricao:
          'Boné de uso opcional. Na cor verde-petróleo, com cordão torcido na cor ouro sobre a pala até as extremidades da aba e, na base, uma listra (sutache) amarela. Modelo americano com emblema bordado: D3 para Desbravadores e L D1 para Líderes investidos, com regulador e revestimento interno (carneira) na cor do boné.'
      },
      {
        id: 'rud_dbv_cinto',
        club: ClubType.PATHFINDER,
        titulo: 'Cinto e Fivela Oficial',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@cinto.jpeg',
        imageSize: 'sm',
        descricao:
          'Cinto de cadarço na cor verde-petróleo com 3,4 cm de altura, com fivela metálica dourada tendo ao centro o Emblema D3 nas cores oficiais e em alto-relevo, medindo 3,6 cm de altura por 5,5 cm de comprimento. Não há fivela diferenciada para líderes no uniforme de gala.'
      },
      {
        id: 'rud_dbv_calcados_meias',
        club: ClubType.PATHFINDER,
        titulo: 'Calçados e Meias',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: '',
        imageSize: 'sm',
        descricao:
          'Sapato preto baixo ou tênis preto liso (sem detalhes coloridos).\n• Rapazes (todas as idades): Meias social pretas.\n• Moças de 10 a 15 anos: Meias brancas 3/4.\n• Moças a partir de 16 anos: Meia-calça fina na cor da pele (em reuniões e cerimônias especiais poderá usar sapato social preto de salto baixo/médio ou sapatilha preta lisa).'
      },
      {
        id: 'rud_dbv_torcal_apito',
        club: ClubType.PATHFINDER,
        titulo: 'Torçal e Apito',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@apito.jpeg',
        imageSize: 'sm',
        descricao:
          'De uso opcional pela diretoria no ombro esquerdo com apito. Cordão trançado em polipropileno (bitola ø 4,00 mm). O torçal é trançado com Nó de Surrão na parte superior que envolve o braço, e trançado com o nó de surrão invertido no prolongamento até o apito.'
      },
      {
        id: 'rud_dbv_torcal_cores_paises',
        club: ClubType.PATHFINDER,
        titulo: 'Nó de Surrão e Cores dos Torçais por País (DSA)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@no_de_surrao.jpeg',
        imageSize: 'sm',
        descricao:
          'Cores oficiais dos torçais da liderança por país na Divisão Sul-Americana:\n• Brasil: Verde e amarelo\n• Argentina: Azul-celeste e branco\n• Bolívia: Vermelho, amarelo e verde\n• Chile: Vermelho, branco e azul\n• Equador: Amarelo, azul e vermelho\n• Paraguai: Azul, vermelho e branco\n• Peru: Branco e vermelho\n• Uruguai: Azul e branco\n• Departamental da Divisão (DSA): Cor vermelha (uso exclusivo).'
      },
      {
        id: 'rud_dbv_colete',
        club: ClubType.PATHFINDER,
        titulo: 'Colete Oficial',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@colete.jpeg',
        imageSize: 'sm',
        descricao:
          'Na cor vermelha, usado por Desbravadores e Líderes fora do uniforme de gala. Deverá ser aberto, sem botões, com dois bolsos frontais na parte inferior e com o Emblema D4 (para Desbravadores) ou L D4 (para Líderes investidos) bordado no lado esquerdo, na altura do peito, nas medidas de 11,5 cm x 8,5 cm.\n\nNo colete podem ser colocados trunfos, emblemas, pins e botons. As insígnias de Especialidades nunca podem ser colocadas no colete.'
      },
      {
        id: 'rud_dbv_jaqueta',
        club: ClubType.PATHFINDER,
        titulo: 'Jaqueta Oficial',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_d5.gif',
        imageSize: 'sm',
        descricao:
          'De uso opcional, conforme modelo definido pela DSA. Disponível na cor preta com o Emblema D5 (para Desbravadores) ou L D4 (para Líderes investidos) bordado na cor prata do lado esquerdo do peito. Em situações especiais de clima frio, pode ser usada tanto com o uniforme oficial quanto fora dele.'
      }
    ]
  },
  {
    id: 'rud_dbv_platinas_galoes',
    club: ClubType.PATHFINDER,
    titulo: 'Platina ou Galão (Cargos de Liderança)',
    imagem: '',
    subitems: [
      {
        id: 'rud_dbv_galao_geral',
        club: ClubType.PATHFINDER,
        titulo: 'Padrão e Medidas da Platina / Galão',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@galao.jpeg',
        imageSize: 'sm',
        descricao:
          'Usado nos porta-platinas dos ombros no tamanho de 8,0 cm x 5,5 cm (no caso de uso de tiras, cada tira mede 8 mm de largura, iniciando a 1 cm da base e com espaço de 5 mm entre elas). É de uso exclusivo de diretores de clube, distritais, regionais, pastores, coordenadores gerais, secretários(as) de campo, departamentais e associados.'
      },
      {
        id: 'rud_dbv_galao_diretor',
        club: ClubType.PATHFINDER,
        titulo: 'Diretor de Clube',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@galao_a.jpeg',
        imageSize: 'sm',
        descricao:
          'Platina em tecido verde-petróleo com o Emblema D5 vazado bordado na cor prata no tamanho de 3,5 cm x 3,5 cm.'
      },
      {
        id: 'rud_dbv_galao_distrital',
        club: ClubType.PATHFINDER,
        titulo: 'Distrital',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@galao_b.jpeg',
        imageSize: 'sm',
        descricao:
          'Platina em tecido verde-petróleo com 1 (uma) tira na cor prata.'
      },
      {
        id: 'rud_dbv_galao_regional',
        club: ClubType.PATHFINDER,
        titulo: 'Regional',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@galao_c.jpeg',
        imageSize: 'sm',
        descricao:
          'Platina em tecido verde-petróleo com 2 (duas) tiras na cor prata.'
      },
      {
        id: 'rud_dbv_galao_pastor',
        club: ClubType.PATHFINDER,
        titulo: 'Pastores',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@galao_d.jpeg',
        imageSize: 'sm',
        descricao:
          'Platina em tecido verde-petróleo com o logotipo oficial da IASD bordado na cor dourada no tamanho de 3,5 cm x 3,8 cm.'
      },
      {
        id: 'rud_dbv_galao_coordenador',
        club: ClubType.PATHFINDER,
        titulo: 'Coordenadores Gerais e Secretários(as) de Campo / União / Divisão',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@galao_e.webp',
        imageSize: 'sm',
        descricao:
          'Platina em tecido verde-petróleo com 1 (uma) tira dourada.'
      },
      {
        id: 'rud_dbv_galao_dep_campo',
        club: ClubType.PATHFINDER,
        titulo: 'Departamentais e Associados de Associação ou Missão',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@galao_f.webp',
        imageSize: 'sm',
        descricao:
          'Platina em tecido verde-petróleo com 2 (duas) tiras douradas.'
      },
      {
        id: 'rud_dbv_galao_dep_uniao',
        club: ClubType.PATHFINDER,
        titulo: 'Departamentais e Associados de União',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@galao_g.webp',
        imageSize: 'sm',
        descricao:
          'Platina em tecido verde-petróleo com 3 (três) tiras douradas.'
      },
      {
        id: 'rud_dbv_galao_dep_divisao',
        club: ClubType.PATHFINDER,
        titulo: 'Departamental e Associados da Divisão (DSA)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@galao_h.webp',
        imageSize: 'sm',
        descricao:
          'Platina em tecido verde-petróleo com 4 (quatro) tiras douradas.'
      },
      {
        id: 'rud_dbv_galao_dep_ag',
        club: ClubType.PATHFINDER,
        titulo: 'Departamental e Associados da Associação Geral',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@galao_i.webp',
        imageSize: 'sm',
        descricao:
          'Platina em tecido verde-petróleo com 5 (cinco) tiras douradas.'
      }
    ]
  },
  {
    id: 'rud_dbv_uniforme_atividades',
    club: ClubType.PATHFINDER,
    titulo: 'Uniforme de Atividades e Normas Gerais (RUD)',
    imagem: '',
    subitems: [
      {
        id: 'rud_dbv_ativ_clube',
        club: ClubType.PATHFINDER,
        titulo: 'Uniforme de Atividades do Clube',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_d4.gif',
        imageSize: 'sm',
        descricao:
          'Destinado às reuniões recreativas, acampamentos, caminhadas e projetos comunitários:\n\n• Itens Obrigatórios: Camiseta com identificação do Clube, do Campo (Associação/Missão) e o Emblema D4, acompanhada sempre do Lenço e Prendedor de Lenço oficiais.\n• Itens Opcionais: Calça, bermuda ou saia (de acordo com o critério da igreja local, vedado tecido camuflado), tênis, boné na cor e modelo definidos pelo Clube ou chapéu tipo australiano com Emblema D4 ou L D4 conforme investidura (nesta cobertura podem ser usados pins e botons), e agasalho definido pelo Clube com o Emblema D5.'
      },
      {
        id: 'rud_dbv_ativ_campo',
        club: ClubType.PATHFINDER,
        titulo: 'Uniforme de Atividades da Associação ou Missão',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_do_campo.jpeg',
        imageSize: 'sm',
        descricao:
          'Padronizado pelo Campo local para eventos e Camporis:\n\n• Itens Obrigatórios: Camiseta com identificação do Campo e o Emblema D4, acompanhada do Lenço oficial.\n• Itens Opcionais: Calça, bermuda ou saia (jeans ou outro tecido, exceto camuflado), tênis, boné com o Emblema D4, cinto preto com o Emblema D4 na fivela cor prata e prendedor de lenço comemorativo com o Emblema D4 (que não pode ser usado no uniforme de gala).'
      },
      {
        id: 'rud_dbv_ativ_lideres',
        club: ClubType.PATHFINDER,
        titulo: 'Uniforme de Atividades do Clube de Líderes',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_l_d4.gif',
        imageSize: 'sm',
        descricao:
          'Composto por:\n• Camiseta definida pelo Campo com o Emblema L D4.\n• Lenço e Prendedor de Lenço conforme a investidura.\n• Cobertura para Líderes Investidos: Chapéu tipo australiano na cor azul-marinho com o Emblema L D4 (no qual podem ser afixados pins e botons).'
      },
      {
        id: 'rud_dbv_regras_uso_saudacao',
        club: ClubType.PATHFINDER,
        titulo: 'Regras de Uso do Uniforme e Saudação Maranata',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: '',
        imageSize: 'sm',
        descricao:
          'Normas oficiais do RUD (Divisão Sul-Americana):\n• O uniforme oficial não poderá ser usado antes da inscrição no Clube, antes da Cerimônia de Admissão em Lenço, quando empenhado em vendas particulares/comerciais, ou incompleto.\n• Nenhum acampamento ou excursão poderá ser realizado sem que os membros estejam visualmente identificados (lenço e/ou camiseta de atividades).\n• Saudação Maranata: Braço direito levantado em ângulo reto (cotovelo a 90°), mão espalmada com os quatro dedos unidos apontando para cima (representando os quatro "A" de Amar, Anunciar, Apressar e Aguardar a volta de Cristo) e o polegar dobrado sobre a palma (representando o Desbravador ajoelhado perante Deus).'
      }
    ]
  }
];

export const RUD_UNIFORMES_AVT: CulturaItem[] = [
  {
    id: 'rud_avt_gala_6_9',
    club: ClubType.ADVENTURER,
    titulo: 'Uniforme de Gala dos Aventureiros (6 a 9 Anos)',
    imagem: '',
    subitems: [
      {
        id: 'rud_avt_gala_admissao',
        club: ClubType.ADVENTURER,
        titulo: 'Admissão em Lenço e Uso Oficial',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_a1.svg',
        imageSize: 'sm',
        descricao:
          'O Uniforme de Gala dos Aventureiros (6 a 9 anos) passa a ser usado a partir da Cerimônia de Admissão em Lenço. Identifica a criança como membro oficial do Clube de Aventureiros em reuniões solenes, investiduras, desfiles e programações especiais da igreja.'
      },
      {
        id: 'rud_avt_gala_camisa_blusa',
        club: ClubType.ADVENTURER,
        titulo: 'Camisa Masculina e Blusa Feminina (Branca)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@tira_com_o_nome_do_aventureiro.jpeg',
        imageSize: 'sm',
        descricao:
          'Confeccionada em tecido Grafil, Grafil Plus ou Tricoline na cor branca, com mangas curtas (ou compridas em regiões frias conforme padrão do Clube), botões brancos ou transparentes, dois bolsos frontais com prega vertical sobreposta e tampa retangular, além de porta-platina sobre os ombros.'
      },
      {
        id: 'rud_avt_gala_calca_saia',
        club: ClubType.ADVENTURER,
        titulo: 'Calça Masculina e Saia Feminina (Azul-Marinho)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: '',
        imageSize: 'sm',
        descricao:
          'Confeccionadas em tecido Terbrim ou Gabardine na cor azul-marinho:\n• Meninos (6 a 9 anos): Calça social azul-marinho com passadores de cinto, bolsos frontais em diagonal (modelo faca) e bolsos traseiros embutidos sem tampa.\n• Meninas (6 a 9 anos): Saia azul-marinho na altura do joelho com prega macho frontal (ou modelo com suspensórios/jardineira conforme orientação para as menores faixas etárias), zíper e passadores para o cinto oficial.'
      }
    ]
  },
  {
    id: 'rud_avt_gala_lideranca',
    club: ClubType.ADVENTURER,
    titulo: 'Uniforme de Gala da Diretoria e Líderes (16+ Anos)',
    imagem: '',
    subitems: [
      {
        id: 'rud_avt_lider_camisa_calca',
        club: ClubType.ADVENTURER,
        titulo: 'Uniforme Masculino e Feminino da Liderança',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_l_a1.png',
        imageSize: 'sm',
        descricao:
          'Conselheiros, instrutores, diretores e líderes de Aventureiros utilizam:\n• Camisa (masculina) ou blusa (feminina) na cor branca em tecido Tricoline ou Grafil, com dois bolsos frontais com tampa e porta-platina nos ombros.\n• Calça social (masculina) ou saia na altura do joelho (feminina) na cor azul-marinho em tecido Terbrim ou Gabardine.\n• Gravata azul-marinho (masculino, opcional para líderes em ocasiões formais).\n• Platinas azul-marinho para Diretor de Clube (com Emblema A5 em prata), Distrital, Regional, Pastor e Departamental.'
      },
      {
        id: 'rud_avt_lider_divisa_distintivo',
        club: ClubType.ADVENTURER,
        titulo: 'Distintivo e Divisa de Líder de Aventureiros',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@divisa_de_lider_de_aventureiros.png',
        imageSize: 'sm',
        descricao:
          'Após a investidura em Líder de Aventureiros:\n• Na manga esquerda, o Emblema A2 é substituído pelo Emblema L A1 (7,5 x 5,5 cm), aplicando-se abaixo dele a Divisa de Líder (7,7 x 4,5 cm, com contorno vinho e as tiras das 4 classes).\n• Na tampa do bolso esquerdo, o Distintivo de Líder (0,9 x 1,2 cm) é posicionado centralizado acima dos distintivos das quatro classes.'
      }
    ]
  },
  {
    id: 'rud_avt_lencos_faixa',
    club: ClubType.ADVENTURER,
    titulo: 'Lenços, Prendedores e Faixa de Especialidades',
    imagem: '',
    subitems: [
      {
        id: 'rud_avt_lenco_aventureiro',
        club: ClubType.ADVENTURER,
        titulo: 'Lenço Oficial do Aventureiro e de Líder',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_a1.svg',
        imageSize: 'sm',
        descricao:
          'Confeccionado na cor vinho (bordô):\n• Lenço do Aventureiro: Na cor vinho com o Emblema A1 bordado na ponta posterior.\n• Lenço de Líder de Aventureiros: Na cor vinho com viés branco na borda, as quatro tiras nas cores das classes (azul-celeste, laranja, azul-marinho e vinho) e o Emblema L A1 bordado.'
      },
      {
        id: 'rud_avt_prendedor_cinto',
        club: ClubType.ADVENTURER,
        titulo: 'Prendedor de Lenço e Cinto Oficial',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_a3.jpeg',
        imageSize: 'sm',
        descricao:
          '• Prendedor de Lenço: Metálico ou bordado contendo o Emblema A3 para Aventureiros e o Emblema L A1 para Líderes investidos.\n• Cinto Oficial: Cadarço na cor azul-marinho com fivela metálica contendo ao centro o Emblema A3 em relevo.\n• Calçados e Meias: Sapatos pretos ou tênis preto totalmente liso; meninos com meias pretas (ou azul-marinho), meninas de 6 a 9 anos com meias brancas 3/4, e líderes femininas com meia-calça fina cor da pele.'
      },
      {
        id: 'rud_avt_faixa_especialidades',
        club: ClubType.ADVENTURER,
        titulo: 'Faixa de Especialidades dos Aventureiros',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_a2.png',
        imageSize: 'sm',
        descricao:
          'Na cor azul-marinho, usada do ombro direito para o quadril esquerdo sobre o porta-platina:\n• Na ponta inferior traz o Emblema A2 (para Aventureiros) ou Emblema L A1 (para Líderes) no tamanho de 10,5 x 7,5 cm.\n• Na parte superior frontal (a 4 cm do ombro) aplica-se a bandeira do país, seguida opcionalmente da tira com o nome e das insígnias triangulares das Especialidades de Aventureiros conquistadas.'
      }
    ]
  },
  {
    id: 'rud_avt_posicao_mangas_camisa',
    club: ClubType.ADVENTURER,
    titulo: 'Posição das Tiras, Emblemas e Distintivos (Aventureiros)',
    imagem: '',
    subitems: [
      {
        id: 'rud_avt_manga_direita',
        club: ClubType.ADVENTURER,
        titulo: 'Manga Direita (Tira do Clube, Cargo e Emblema A1)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@tira_nome_clube_aventureiros.jpeg',
        imageSize: 'sm',
        descricao:
          'Na manga direita da camisa ou blusa:\n• Tira com o Nome do Clube: A 2 cm abaixo da costura do ombro, medindo 8 x 2,5 cm (curvatura de 5 cm), com letras bordadas em azul-marinho e borda vinho sobre fundo branco.\n• Tira de Cargo (para diretoria): Medindo 7,5 x 2 cm, posicionada a 1 cm acima do Emblema A1.\n• Emblema A1: Centralizado na manga direita (tamanho infantil 6 x 6,5 cm e adulto 7 x 7,5 cm).'
      },
      {
        id: 'rud_avt_manga_esquerda',
        club: ClubType.ADVENTURER,
        titulo: 'Manga Esquerda (Emblema do Campo e Emblema A2 / L A1)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_do_campo.jpeg',
        imageSize: 'sm',
        descricao:
          'Na manga esquerda da camisa ou blusa:\n• Emblema do Campo (Associação/Missão): Posicionado na parte superior da manga esquerda (tamanhos 7 x 4,5 cm ou 9 x 5,5 cm).\n• Emblema A2 (Aventureiro) ou Emblema L A1 (Líder investido): Posicionado abaixo do Emblema do Campo (tamanho infantil 6,5 x 4,5 cm e adulto 7,5 x 5,5 cm).\n• Divisa de Líder: Posicionada abaixo do Emblema L A1 para líderes investidos.'
      },
      {
        id: 'rud_avt_frente_camisa',
        club: ClubType.ADVENTURER,
        titulo: 'Frente da Camisa (Tira do Nome e Distintivos de Classes)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@distintivos_de_classes_regulares_aventureiros.png',
        imageSize: 'sm',
        descricao:
          'Na parte frontal da camisa ou blusa:\n• Bolso Direito: Tira com o Nome do Aventureiro (8 x 2 cm, letras em azul-marinho e borda vinho sobre fundo branco) posicionada a 0,5 cm acima da tampa do bolso direito.\n• Bolso Esquerdo: Distintivos das 4 Classes (Abelhinhas Laboriosas em azul-celeste, Luminares em laranja, Edificadores em azul-marinho e Mãos Ajudadoras em vinho), medindo 1,7 cm de diâmetro cada, alinhados na tampa do bolso esquerdo com espaçamento de 0,4 cm.'
      }
    ]
  },
  {
    id: 'rud_avt_atividades',
    club: ClubType.ADVENTURER,
    titulo: 'Uniforme de Atividades dos Aventureiros',
    imagem: '',
    subitems: [
      {
        id: 'rud_avt_ativ_clube_campo',
        club: ClubType.ADVENTURER,
        titulo: 'Uniforme de Atividades (Clube e Associação/Missão)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_a4.jpeg',
        imageSize: 'sm',
        descricao:
          'Usado em recreações, passeios, Rede Familiar e atividades práticas:\n• Obrigatório: Camiseta com identificação do Clube e/ou Campo aplicando o Emblema A4 (globo com o emblema dos Aventureiros), sempre acompanhada do Lenço e Prendedor oficiais.\n• Opcional: Calça, bermuda ou saia confortável conforme padrão do Clube, tênis, boné ou cobertura com o Emblema A4 e agasalho/jaqueta com o Emblema A5.'
      }
    ]
  }
];

const EMBLEMAS_STORAGE_BASE = 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Emblemas';

export const RUD_EMBLEMAS_DBV: CulturaItem[] = [
  {
    id: 'cat_0_1776792488105',
    club: ClubType.PATHFINDER,
    titulo: 'Emblemas',
    imagem: '',
    subitems: [
      {
        id: 'sub_0_0_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Emblema D1',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_emblema_d1_0_0.png`,
        descricao: 'É o símbolo que representa o Clube de Desbravadores. Apresenta a inscrição DESBRAVADORES na parte superior do triângulo e a inscrição CLUBE abaixo do escudo com a espada. É usado na manga direita da camisa ou blusa no tamanho 7,5 cm x 7,5 cm.'
      },
      {
        id: 'sub_0_1_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Emblema D2',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_emblema_d2_0_1.png`,
        descricao: 'É usado na manga esquerda da camisa ou blusa no tamanho 7,0 cm x 5,0 cm. No lenço é bordado no tamanho 11,5 cm x 8,5 cm.'
      },
      {
        id: 'sub_0_2_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Emblema D3',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_emblema_d3_0_2.png`,
        descricao: 'É usado na cobertura, no prendedor de lenço, na fivela do cinto e na bandeira dos Desbravadores no tamanho de 3,8 cm x 2,0 cm.'
      },
      {
        id: 'sub_0_3_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Emblema D4',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_emblema_d4_0_3.png`,
        descricao: 'Apresenta o triângulo em perspectiva sobre um globo com as linhas meridionais e equatoriais. É usado na jaqueta, camiseta e boné de atividades e em materiais promocionais.'
      },
      {
        id: 'sub_0_4_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Emblema D5',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_emblema_d5_0_4.png`,
        descricao: 'Apresenta apenas o traçado do triângulo e escudo com espada. É usado nos distintivos de classes e liderança.'
      },
      {
        id: 'sub_0_5_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Emblema L D1',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_emblema_l_d1_0_5.png`,
        descricao: 'É o símbolo que representa a Liderança dos Desbravadores. Apresenta o globo com as linhas meridionais e o triângulo D1 ao centro com a estrela de liderança. É usado no lenço de líder e na manga esquerda.'
      },
      {
        id: 'sub_0_6_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Emblema L D2',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_emblema_l_d2_0_6.png`,
        descricao: 'Globo de líder estilizado usado em materiais da liderança dos Desbravadores.'
      },
      {
        id: 'sub_0_7_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Emblema L D3',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_emblema_l_d3_0_7.png`,
        descricao: 'Usado na fivela de cinto e prendedor de lenço de líderes investidos.'
      },
      {
        id: 'sub_0_8_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Emblema L D4',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_emblema_l_d4_0_8.png`,
        descricao: 'Símbolo promocional de líderes dos Desbravadores.'
      },
      {
        id: 'sub_0_9_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Emblema do Campo',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_emblema_do_campo_0_9.png`,
        descricao: 'Representa a Associação ou Missão local à qual o clube pertence. Usado na manga esquerda da camisa oficial.'
      }
    ]
  },
  {
    id: 'cat_1_1776792488105',
    club: ClubType.PATHFINDER,
    titulo: 'Insígnias e Tiras',
    imagem: '',
    subitems: [
      {
        id: 'sub_1_0_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Tira com o Nome do Clube',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_tira_com_o_nome_do_clube_1_0.png`,
        descricao: 'Usada na manga direita da camisa ou blusa, na posição superior, curvada, medindo 8 cm x 2,5 cm.'
      },
      {
        id: 'sub_1_1_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Tira de Cargo',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_tira_de_cargo_1_1.png`,
        descricao: 'Usada na manga direita abaixo da tira com o nome do clube, medindo 8 cm x 2 cm.'
      },
      {
        id: 'sub_1_2_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Tira de Classe',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_tira_de_classe_1_2.png`,
        descricao: 'Usada na manga esquerda abaixo do emblema do campo, indicando a classe mais alta em andamento ou concluída.'
      },
      {
        id: 'sub_1_3_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Tira com o Nome do Desbravador',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_tira_com_o_nome_do_desbravador_1_3.png`,
        descricao: 'Usado por desbravadores e líderes em tecido, e bordado apenas um nome. Seu uso é centralizado a 5 cm acima da tampa do bolso direito, e na faixa 8 cm abaixo da costura do ombro, medindo 8 cm x 2 cm.'
      },
      {
        id: 'sub_1_4_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Tarjeta de Identificação',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_tarjeta_de_identificacao_1_4.jpg`,
        descricao: 'Em metal. Uso exclusivo de Diretor Local, Distrital, Regional, Coordenador Geral, Associado, Secretária de Campo e Departamental.'
      },
      {
        id: 'sub_1_5_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Estrela de Tempo de Serviço',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_estrela_de_tempo_de_servico_1_5.png`,
        descricao: 'Estrela de cinco pontas que representa os anos de serviço prestados na Diretoria do Clube ou Liderança dos Desbravadores.'
      },
      {
        id: 'sub_1_6_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Faixa de Especialidades',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_faixa_de_especialidades_1_6.png`,
        descricao: 'Usada da direita para a esquerda, apoiada no ombro direito, sobre o porta platina e apoiado sobre a coxa esquerda. Cor verde petróleo.'
      },
      {
        id: 'sub_1_7_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Lenço do Desbravador',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_lenco_do_desbravador_1_7.png`,
        descricao: 'Amarelo com emblema D2 bordado em suas cores originais no tamanho 11,5 cm x 8,5 cm. É a identificação mundial dos desbravadores.'
      },
      {
        id: 'sub_1_8_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Lenço de Líder',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_lenco_de_lider_1_8.png`,
        descricao: 'Amarelo com borda em viés vermelho e com tiras bordadas correspondentes às Classes regulares, tendo abaixo o emblema L D1 bordado no tamanho 10,5 cm x 10,5 cm.'
      }
    ]
  },
  {
    id: 'cat_2_1776792488105',
    club: ClubType.PATHFINDER,
    titulo: 'Distintivos',
    imagem: '',
    subitems: [
      {
        id: 'sub_2_0_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Distintivos de Classes Regulares',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_distintivos_de_classes_regulares_2_0.png`,
        descricao: 'Em formato redondo, medindo 1,2 cm de diâmetro, produzido em metal nas cores correspondentes às classes. O Emblema D5 e a borda são traçados em amarelo ouro.'
      },
      {
        id: 'sub_2_1_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Divisas de Classes',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_divisas_de_classes_2_1.png`,
        descricao: 'Colocadas na manga esquerda após a respectiva investidura, abaixo do emblema D2, em ordem ascendente, bordadas nas cores das Classes Regulares.'
      },
      {
        id: 'sub_2_2_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Distintivos de Classes Avançadas',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_distintivos_de_classes_avancadas_2_2.png`,
        descricao: 'Usados separadamente ou agrupados em metal ou bordado. Distintivos alinhados em duas linhas horizontais, medindo 3,5 cm x 1,0 cm cada.'
      },
      {
        id: 'sub_2_3_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Insígnia de Excelência',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_insignia_de_excelencia_2_3.png`,
        descricao: 'Representa o elevado padrão de excelência do Desbravador dedicado ao Clube. Concedida pelo Clube ao final de cada ano.'
      },
      {
        id: 'sub_2_4_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Distintivo de Batismo',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_distintivo_de_batismo_2_4.png`,
        descricao: 'Usado por todos os membros batizados, na tampa do bolso direito, como identificação de seu batismo, no tamanho de 1,5 cm x 1,6 cm.'
      },
      {
        id: 'sub_2_5_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Divisa de Líder',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_divisa_de_lider_2_5.png`,
        descricao: 'No tamanho 8,5 x 4,5 cm sobre fundo branco com contorno verde petróleo. Estrela amarela de 5 pontas e as divisas das classes regulares.'
      },
      {
        id: 'sub_2_6_1776792488105',
        club: ClubType.PATHFINDER,
        titulo: 'Distintivo de Função na Unidade',
        titleAlign: 'left',
        imagePosition: 'top',
        imageSize: 'sm',
        imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_distintivo_de_funcao_na_unidade_2_6.png`,
        descricao: 'O capitão(ã), secretário(a), ou outra função necessária usarão um distintivo bordado, acrílico ou metal, designando sua função.'
      }
    ]
  },
  {
    id: 'cat_3_1776792488105',
    club: ClubType.PATHFINDER,
    titulo: 'Bandeira Oficial dos Desbravadores',
    titleAlign: 'left',
    imagePosition: 'top',
    imageSize: 'sm',
    imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_bandeira_oficial_dos_desbravadores_3.png`,
    subitems: [],
    descricao: 'Medindo 128 x 90 cm. O retângulo superior esquerdo e o inferior direito na cor azul royal, e o retângulo inferior esquerdo e o superior direito na cor branca. Ao centro o emblema D1 de 30 x 30 cm nas cores originais.'
  },
  {
    id: 'cat_4_1776792488105',
    club: ClubType.PATHFINDER,
    titulo: 'Bandeirim',
    titleAlign: 'left',
    imagePosition: 'top',
    imageSize: 'sm',
    imagem: `${EMBLEMAS_STORAGE_BASE}/dbv_bandeirim_4.png`,
    subitems: [],
    descricao: 'Representa a Unidade. Bordado com contorno e desenho estabelecido pelo Campo local. Será produzido em dois tamanhos, o menor com 7 x 4,5 cm e o maior com 9 x 5,5 cm. Deve conter o nome da unidade e o emblema D1.'
  }
];

export const RUD_EMBLEMAS_AVT: CulturaItem[] = [
  {
    id: 'rud_avt_cat_emblemas',
    club: ClubType.ADVENTURER,
    titulo: 'Emblemas',
    imagem: '',
    subitems: [
      {
        id: 'rud_avt_emb_a1',
        club: ClubType.ADVENTURER,
        titulo: 'Emblema A1',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_a1.svg',
        imageSize: 'sm',
        descricao:
          'É o símbolo que representa o Clube de Aventureiros. Apresenta a inscrição "CLUBE DE AVENTUREIROS" na parte superior e representa as 3 ênfases do ministério: Jesus Cristo (cruz), família e natureza. É usado no lenço, na manga direita e na cobertura, com contorno bordado em vinho. Tamanhos: infantil (6 x 6,5 cm) e adulto (7 x 7,5 cm).'
      },
      {
        id: 'rud_avt_emb_a2',
        club: ClubType.ADVENTURER,
        titulo: 'Emblema A2',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_a2.png',
        imageSize: 'sm',
        descricao:
          'Representa a organização mundial dos Aventureiros. É usado na manga esquerda da camisa ou blusa (infantil 6,5 x 4,5 cm; adulto 7,5 x 5,5 cm) e na ponta inferior da faixa de especialidades (10,5 x 7,5 cm).'
      },
      {
        id: 'rud_avt_emb_a3',
        club: ClubType.ADVENTURER,
        titulo: 'Emblema A3',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_a3.jpeg',
        imageSize: 'sm',
        descricao:
          'Semelhante ao Emblema A1, mas sem a inscrição interna "CLUBE DE AVENTUREIROS". É utilizado no prendedor de lenço e na fivela do cinto.'
      },
      {
        id: 'rud_avt_emb_a4',
        club: ClubType.ADVENTURER,
        titulo: 'Emblema A4',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_a4.jpeg',
        imageSize: 'sm',
        descricao:
          'Apresenta o emblema em perspectiva sobre um globo com o mapa da América do Sul (fundo azul, mapa branco e contorno vinho). Deve ser usado no uniforme de atividades e em materiais promocionais.'
      },
      {
        id: 'rud_avt_emb_a5',
        club: ClubType.ADVENTURER,
        titulo: 'Emblema A5',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_a5.jpeg',
        imageSize: 'sm',
        descricao:
          'Apresenta somente o traçado do emblema em uma cor. Usado na platina de diretor de clube e na jaqueta na cor prata.'
      },
      {
        id: 'rud_avt_emb_la1',
        club: ClubType.ADVENTURER,
        titulo: 'Emblema L A1 (Líder de Aventureiros)',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_l_a1.png',
        imageSize: 'sm',
        descricao:
          'Globinho oval contendo um círculo com as quatro classes em suas respectivas cores e uma estrela de quatro pontas ao centro. Usado na faixa (10,5 x 7,5 cm), no lenço e prendedor de Líder, e na manga esquerda da camisa ou blusa (7,5 x 5,5 cm), substituindo o Emblema A2 após a investidura.'
      },
      {
        id: 'rud_avt_emb_campo',
        club: ClubType.ADVENTURER,
        titulo: 'Emblema do Campo',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_do_campo.jpeg',
        imageSize: 'sm',
        descricao:
          'Identifica a Associação ou Missão local. Bordado com contorno e desenho estabelecidos pelo Campo, produzido em dois tamanhos: infantil (7 x 4,5 cm) e adulto (9 x 5,5 cm). Usado na parte superior da manga esquerda.'
      }
    ]
  },
  {
    id: 'rud_avt_cat_insignias_tiras',
    club: ClubType.ADVENTURER,
    titulo: 'Insígnias e Tiras',
    imagem: '',
    subitems: [
      {
        id: 'rud_avt_tira_nome_clube',
        club: ClubType.ADVENTURER,
        titulo: 'Tira com o Nome do Clube',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@tira_nome_clube_aventureiros.jpeg',
        imageSize: 'sm',
        descricao:
          'Usada na manga direita a 2 cm abaixo da costura do ombro, medindo 8 x 2,5 cm (curvatura de 5 cm nas extremidades). Letras bordadas em azul-marinho e borda vinho sobre fundo branco.'
      },
      {
        id: 'rud_avt_tira_cargo',
        club: ClubType.ADVENTURER,
        titulo: 'Tira de Cargo',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@tira_de_cargo_aventureiros.jpeg',
        imageSize: 'sm',
        descricao:
          'Usada por diretores, associados, conselheiros, instrutores, secretários, tesoureiros, capelães, regionais, distritais e departamentais na manga direita, a 1 cm acima do Emblema A1. Mede 7,5 x 2 cm, com letras em azul-marinho e borda vinho sobre fundo branco.'
      },
      {
        id: 'rud_avt_tira_nome_aventureiro',
        club: ClubType.ADVENTURER,
        titulo: 'Tira com o Nome do Aventureiro',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@tira_com_o_nome_do_aventureiro.jpeg',
        imageSize: 'sm',
        descricao:
          'Medindo 8 x 2 cm, bordado apenas um nome em fonte Arial Black na cor azul-marinho, fundo branco e borda vinho. Usada a 0,5 cm acima da tampa do bolso direito da camisa (e opcionalmente na faixa abaixo da bandeira do país).'
      },
      {
        id: 'rud_avt_estrela_servico',
        club: ClubType.ADVENTURER,
        titulo: 'Estrela de Tempo de Serviço',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@estrela_de_tempo_de_servico_aventureiros.png',
        imageSize: 'sm',
        descricao:
          'Estrela de cinco pontas que representa os anos de serviço prestados na diretoria ou liderança dos Aventureiros, outorgada pelo Campo a partir do final do segundo ano. Mede 3 x 3 cm com borda vinho sobre fundo branco e número em azul-marinho (0,8 cm).'
      }
    ]
  },
  {
    id: 'rud_avt_cat_distintivos',
    club: ClubType.ADVENTURER,
    titulo: 'Distintivos',
    imagem: '',
    subitems: [
      {
        id: 'rud_avt_dist_classes',
        club: ClubType.ADVENTURER,
        titulo: 'Distintivos de Classes dos Aventureiros',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@distintivos_de_classes_regulares_aventureiros.png',
        imageSize: 'sm',
        descricao:
          'Representam as quatro classes do currículo dos Aventureiros (1,7 cm de diâmetro cada):\n• Abelhinhas Laboriosas (6 anos): Azul-celeste\n• Luminares (7 anos): Laranja\n• Edificadores (8 anos): Azul-marinho\n• Mãos Ajudadoras (9 anos): Vinho\nUsados na aba do bolso esquerdo da camisa do uniforme após a investidura, alinhados e centralizados com espaçamento de 0,4 cm.'
      },
      {
        id: 'rud_avt_dist_lider',
        club: ClubType.ADVENTURER,
        titulo: 'Distintivo de Líder',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@distintivo_lider_aventureiros.jpeg',
        imageSize: 'sm',
        descricao:
          'Usado pelo líder investido acima dos distintivos das classes, centralizado na aba do bolso esquerdo, medindo 0,9 x 1,2 cm.'
      },
      {
        id: 'rud_avt_divisa_lider',
        club: ClubType.ADVENTURER,
        titulo: 'Divisa de Líder de Aventureiros',
        titleAlign: 'left',
        imagePosition: 'top',
        imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@divisa_de_lider_de_aventureiros.png',
        imageSize: 'sm',
        descricao:
          'Contém o círculo com as cores das quatro classes no topo e as divisas regulares de cada classe abaixo, com contorno bordado na cor vinho. Usada na manga esquerda abaixo do Emblema L A1, medindo 7,7 x 4,5 cm.'
      }
    ]
  },
  {
    id: 'rud_avt_cat_bandeira',
    club: ClubType.ADVENTURER,
    titulo: 'Bandeira Oficial dos Aventureiros',
    titleAlign: 'left',
    imagePosition: 'top',
    imageSize: 'sm',
    imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@bandeira_aventureiros.jpeg',
    subitems: [],
    descricao:
      'Medindo 128 x 90 cm, dividida em quatro partes iguais: a superior esquerda e a inferior direita na cor amarela, e as outras duas partes na cor branca. Ao centro aplica-se o Emblema A1 medindo 29 x 29,5 cm nas cores originais. O nome do Clube é bordado em azul no canto direito inferior (8 cm de altura por no máximo 50 cm de comprimento). Mastro com 200 cm de altura e 3,5 cm de espessura.'
  },
  {
    id: 'rud_avt_cat_bandeirim',
    club: ClubType.ADVENTURER,
    titulo: 'Bandeirim',
    titleAlign: 'left',
    imagePosition: 'top',
    imageSize: 'sm',
    imagem: 'https://mda.wiki.br/site/@imgs_wiki/imagem@bandeirim_aventureiros.jpeg',
    subitems: [],
    descricao:
      'Nas cores amarela e branca com contorno vinho, medindo 55 cm de largura por 36 cm de altura junto ao mastro (estreitando para 34 cm na extremidade oposta). Possui uma faixa vertical amarela de 10 x 36 cm à esquerda com o nome do Clube bordado de baixo para cima e o Emblema A1 (9,5 x 10 cm) a 7,5 cm do topo. Na parte branca centraliza-se o símbolo e nome da Unidade (12,5 x 12,5 cm). Mastro de 170 cm de altura.'
  }
];

export function getOfficialRudUniforms(clubType: string | ClubType): CulturaItem[] {
  const isAVT = clubType === 'ADVENTURER' || clubType === ClubType.ADVENTURER;
  return isAVT ? RUD_UNIFORMES_AVT : RUD_UNIFORMES_DBV;
}

export function getOfficialRudEmblems(clubType: string | ClubType): CulturaItem[] {
  const isAVT = clubType === 'ADVENTURER' || clubType === ClubType.ADVENTURER;
  return isAVT ? RUD_EMBLEMAS_AVT : RUD_EMBLEMAS_DBV;
}
