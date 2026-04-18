
export interface MasteryRule {
  name: string;
  category: string;
  requirementsCount: number;
  specialties: string[]; // Nomes ou parte dos nomes das especialidades
  isGlobalArea?: boolean; // Se true, qualquer uma da área serve
}

export const MASTERY_RULES: MasteryRule[] = [
  {
    name: "Mestrado em ADRA",
    category: "ADRA",
    requirementsCount: 7,
    specialties: [],
    isGlobalArea: true
  },
  {
    name: "Mestrado em Artes e Habilidades Manuais",
    category: "Artes e Habilidades Manuais",
    requirementsCount: 7,
    specialties: [],
    isGlobalArea: true
  },
  {
    name: "Mestrado em Atividades Agrícolas",
    category: "Atividades Agrícolas",
    requirementsCount: 7,
    specialties: [],
    isGlobalArea: true
  },
  {
    name: "Mestrado em Testificação",
    category: "Atividades Missionárias",
    requirementsCount: 7,
    specialties: [
      "Adoração cristã", "Apocalipse", "Arqueologia bíblica", "Arte da pregação cristã", 
      "Arte de contar histórias cristãs", "Arte em fantoches", "Asseio e cortesia cristã", 
      "Aventuras com Cristo", "Braille", "Cidadania cristã", "Colportagem", "Criacionismo", 
      "Crítico de mídia", "Dramatização cristã", "Escatologia", "Espírito de Profecia", 
      "Etnologia missionária", "Evangelismo pessoal", "Evangelismo web", "Historiador eclesiástico", 
      "Intercessor", "Interpretação bíblica", "Investigador bíblico", "Liderança juvenil", 
      "Língua de sinais", "Lives", "Livro de Daniel", "Marcação bíblica", "Mensageira de Deus", 
      "Mordomia", "Pacificador", "Parábolas de Jesus", "Pioneiros adventistas", 
      "Pregador evangelista", "Relacionamentos saudáveis", "Santuário", "Sonoplastia", 
      "Temperança", "Testemunho juvenil", "Vida familiar"
    ]
  },
  {
    name: "Mestrado em Atividades Profissionais",
    category: "Atividades Profissionais",
    requirementsCount: 7,
    specialties: [
      "Administração", "Alvenaria", "Barbearia", "Biblioteconomia", "Cães", "Carpintaria", 
      "Colocação de papel de parede", "Conserto de sapatos", "Contabilidade", "Corte e costura", 
      "Cuidados e manutenção de violões", "Software", "Eletricidade", "Eletrônica", 
      "Encadernação", "Evangelismo", "Fotografia", "Hidráulica", "Informática", 
      "Língua de sinais", "Jornalismo", "Logística", "Magistério", "Manutenção de bicicletas", 
      "Marcenaria", "Marketing", "Mecânica", "Modelagem têxtil", "Computadores", "Direito", 
      "Economia", "Alfaiate", "Impressoras", "Pintura", "Produção de vídeo", "Radioamadorismo", 
      "Restauro", "Secretariado", "Incêndios", "Silvicultura", "Soldagem", "Taquigrafia", 
      "Tipografia", "Vendas", "Web designer"
    ]
  },
  {
    name: "Mestrado em Ciência e Tecnologia",
    category: "Ciência e Tecnologia",
    requirementsCount: 7,
    specialties: [
      "Computação", "Software", "Eletrônica", "Experimentos científicos", "Física", 
      "Matemática", "Informática", "Internet", "Metodologia de estudo", "Óptica", 
      "Química", "Redes sociais", "Web designer"
    ]
  },
  {
    name: "Mestrado em Aquática",
    category: "Atividades Aquáticas",
    requirementsCount: 7,
    specialties: [
      "Caiaque", "Canoagem", "Esqui aquático", "Mergulho", "Natação", "Navegação", 
      "Rafting", "Remo", "Saltos ornamentais", "Salvamento", "Segurança básica na água", "Vela"
    ]
  },
  {
    name: "Mestrado em Esportes",
    category: "Atividades Recreativas",
    requirementsCount: 7,
    specialties: [
      "Arco e flecha", "Atletismo", "Basquete", "Ciclismo", "Cultura física", "Equitação", 
      "Escalada", "Esportes adaptados", "Esqui aquático", "Exploração de cavernas", 
      "Futebol", "Futsal", "Ginástica acrobática", "Handebol", "Mountain biking", 
      "Rapel", "Softbol", "Tênis de mesa", "Triathlon", "Vôlei"
    ]
  },
  {
    name: "Mestrado em Vida Campestre",
    category: "Atividades Recreativas",
    requirementsCount: 7,
    specialties: [
      "Acampamento", "Arte de acampar", "Artes mateiras", "Comida mateira", 
      "Construções rústicas", "Cozinha com forno holandês", "Escalada em árvores", 
      "Excursionismo", "Fogueiras", "Liderança campestre", "Liderança na selva", 
      "Mapa e bússola", "Nós e amarras", "Orientação com GPS", "Pioneiras", 
      "Pioneirismo", "Plantas silvestres comestíveis", "Trilha de sinais", "Vida silvestre"
    ]
  },
  {
    name: "Mestrado em Atividades Recreativas",
    category: "Atividades Recreativas",
    requirementsCount: 7,
    specialties: [
      "Aquarismo", "Boliche", "Bolinha de gude", "Carrinho de rolimã", "Colecionador", 
      "Cubo mágico", "Ordem unida", "Fanfarra", "Filatelia", "Futebol de botão", 
      "Geocaching", "Nós e amarras", "Numismática", "Patins", "Pião", "Pipas", 
      "Segurança básica na água", "Skate", "Slackline", "Troca de pins", 
      "Viagem e turismo"
    ]
  },
  {
    name: "Mestrado em Saúde",
    category: "Saúde",
    requirementsCount: 7,
    specialties: [
      "Alerta vermelho", "Anatomia", "Bactérias", "Bioquímica", "Biossegurança", "Citologia", 
      "Coração", "Digestão", "Enfermagem", "Hereditariedade", "Higiene oral", 
      "Inteligência emocional", "Microscopia", "Nutrição", "Ossos", "Músculos", 
      "Plantas medicinais", "Doenças tropicais", "Primeiros socorros", "Protozoários", 
      "Reanimação", "Remédios da natureza", "Resgate", "Sangue", "Saúde e cura", 
      "Saúde mental", "Sexualidade humana", "Sistema nervoso", "Sistema respiratório", 
      "Vacinas", "Vírus", "Zoonoses"
    ]
  },
  {
    name: "Mestrado em Zoologia",
    category: "Estudo da Natureza",
    requirementsCount: 7,
    specialties: [
      "Abelhas", "Vespas", "Anfíbios", "Animais migratórios", "Animais nocivos", 
      "Animais noturnos", "Animais peçonhentos", "Aranhas", "Araras", "Papagaios", 
      "Periquitos", "Aves", "Cães", "Camelos", "Cetáceos", "Cigarras", "Crustáceos", 
      "Equinodermos", "Fauna marinha", "Felinos", "Formigas", "Insetos", "Mamíferos", 
      "Mariposas", "Borboletas", "Marsupiais", "Mimetismo", "Moluscos", "Morcegos", 
      "Odonata", "Peixes", "Pequenos mamíferos", "Poríferos", "Primatas", "Quelônios", 
      "Rastreio", "Rebanhos", "Répteis", "Tubarões", "Vermes", "Zoonoses"
    ]
  },
  {
    name: "Mestrado em Ecologia",
    category: "Estudo da Natureza",
    requirementsCount: 7,
    specialties: [
      "Animais ameaçados", "Araras", "Papagaios", "Periquitos", "Compostagem", 
      "Conservação ambiental", "Ecologia", "Energias renováveis", "Estuário", 
      "Recursos hídricos", "Quedas d'água", "Quelônios", "Reciclagem"
    ]
  },
  {
    name: "Mestrado em Botânica",
    category: "Estudo da Natureza",
    requirementsCount: 7,
    specialties: [
      "Algas", "Arbustos", "Árvores", "Briófitas", "Bromélias", "Cactos", "Ervas", 
      "Eucaliptos", "Fisiologia vegetal", "Flores", "Gramíneas", "Liquens", 
      "Orquídeas", "Palmeiras", "Plantas carnívoras", "Plantas caseiras", 
      "Samambaias", "Sementes"
    ]
  },
  {
    name: "Mestrado em Habilidades Domésticas",
    category: "Habilidades Domésticas",
    requirementsCount: 7,
    specialties: [],
    isGlobalArea: true
  },
  {
    name: "Mestrado em Ensinos Bíblicos",
    category: "Atividades Missionárias",
    requirementsCount: 14,
    specialties: [],
    isGlobalArea: true
  }
];
