
export enum ClubType {
  PATHFINDER = 'PATHFINDER',
  ADVENTURER = 'ADVENTURER'
}

export interface Category {
  id: number;
  nome: string;
  imagem?: string;
  cor?: string;
  sigla?: string;
}

export interface ClubClass {
  id: number;
  titulo: string;
  sigla?: string;
  imagem?: string;
  subtitulo?: string;
  cor?: string;
  corpo?: string;
}

export interface Especialidade {
  id: number;
  nome: string;
  area: string;
  logo: string;
  requisitos: string[];
  club: ClubType;
  sigla?: string;
  nivel?: string;
  ano?: string;
  origem?: string;
  codigo?: string;
}

export interface Member {
  id: string;
  name: string;
  club: ClubType;
  class: string;
  unit: string;
  active: boolean;
}

export interface DesbravaMais {
  id: number;
  Nome: string;
  Capa: string;
  descricao: string;
  Conteudo: string;
  PDF?: string;
}

export interface BibleBook {
  id: number;
  book_name: string;
  book_abbrev: string;
  total_chapters: number;
  testament: string;
}

export interface BibleVerse {
  id: number;
  book_name: string;
  chapter: string;
  verse_number: string;
  text: string;
}

export interface BibleDictionaryEntry {
  id: number;
  nome: string;
  texto: string;
  categoria: string;
  referencia: string;
}

export interface BibleNote {
  id: string;
  title: string;
  reference: string;
  content: string;
  date: string;
}

export interface Devocional {
  id: string;
  titulo: string;
  link?: string;
  texto: string;
  agendado_para: string;
  created_at?: string;
}

export interface ContentBlock {
  id: string;
  type: 'text' | 'image';
  content: string;
}

export interface CulturaItem {
  id: string;
  titulo: string;
  subtitulo?: string;
  descricao: string;
  imagem?: string;
  blocks?: ContentBlock[];
  club?: ClubType;
  subitems?: CulturaItem[];
}

export interface Cultura {
  id: number;
  club_type: string;
  ideais: string;
  voto?: string;
  lei?: string;
  alvo?: string;
  lema?: string;
  objetivo?: string;
  voto_biblia?: string;
  hino_letra: string;
  hino_video: string;
  historia_mundial?: string;
  historia_mundial_img?: string;
  historia_america_sul?: string;
  historia_america_sul_img?: string;
  historia_argentina?: string;
  historia_argentina_img?: string;
  historia_bolivia?: string;
  historia_bolivia_img?: string;
  historia_brasil?: string;
  historia_brasil_img?: string;
  historia_chile?: string;
  historia_chile_img?: string;
  historia_colombia?: string;
  historia_colombia_img?: string;
  historia_equador?: string;
  historia_equador_img?: string;
  historia_peru?: string;
  historia_peru_img?: string;
  historia_uruguai?: string;
  historia_uruguai_img?: string;
  uniformes_list?: CulturaItem[];
  emblemas_list?: CulturaItem[];
  // Deprecated fixed fields
  uniforme_gala?: string;
  uniforme_gala_img?: string;
  uniforme_atividades?: string;
  uniforme_atividades_img?: string;
  uniforme_unidade?: string;
  uniforme_unidade_img?: string;
  lencos_prendedores?: string;
  lencos_prendedores_img?: string;
  cobertura?: string;
  cobertura_img?: string;
  cinto?: string;
  cinto_img?: string;
  calcados_meias?: string;
  calcados_meias_img?: string;
  torcal?: string;
  torcal_img?: string;
  platina_galao?: string;
  platina_galao_img?: string;
  uniforme_diretoria?: string;
  uniforme_diretoria_img?: string;
  uniforme_lideres?: string;
  uniforme_lideres_img?: string;
  emblemas?: string;
  emblemas_img?: string;
  insignias_tiras?: string;
  insignias_tiras_img?: string;
  distintivos?: string;
  distintivos_img?: string;
  bandeira_oficial?: string;
  bandeira_oficial_img?: string;
  bandeirim?: string;
  bandeirim_img?: string;
}

export interface UserProfile {
  user_id: string;
  created_at?: string;
  foto?: string;
  telefone?: string;
  email?: string;
  nome?: string;
  funçao?: string;
  clubes?: string;
  clube_de?: string;
  cidade?: string;
  estado?: string;
  ADM?: boolean;
  fundo?: string;
  clube?: string;
  Especialidades?: string;
}

export interface LivroClasse {
  id: number;
  created_at: string;
  Nome: string;
  Capa: string;
  Resumo: string;
  Conteudo: string;
  Classe: string;
  ClasseIMG: string;
}

export interface LivroAno {
  id: number;
  created_at: string;
  Nome: string;
  Capa: string;
  Resumo: string;
  Conteudo: string;
  Ano: string;
}

export interface OutroLivro {
  id: number;
  created_at: string;
  Nome: string;
  capa: string;
  Resumo: string;
  Conteudo: string;
}

export interface ManualDBV {
  id: number;
  created_at: string;
  Nome: string;
  Capa: string;
  Descricao: string;
  Conteudo: string;
}

export interface CampingDBV {
  id: number;
  created_at: string;
  Nome: string;
  Capa: string;
  Conteudo: string;
}

export interface Formulario {
  id: number;
  created_at: string;
  titulo: string;
  categoria: string;
  link: string;
  descricao?: string;
  icone?: string;
}

export interface Video {
  id: number;
  created_at: string;
  titulo: string;
  canal: string;
  duracao: string;
  visualizacoes: string;
  link: string;
  categoria_id: number;
  club: ClubType;
}

export interface VideoCategory {
  id: number;
  nome: string;
  icone: string;
  club: ClubType;
}

export interface LivroAVT {
  id: number;
  created_at: string;
  Nome: string;
  Capa: string;
  Resumo: string;
  Conteudo: string;
  Ano: string;
}

export interface ManualAVT {
  id: number;
  created_at: string;
  Nome: string;
  Capa: string;
  Descricao: string;
  Conteudo: string;
}

export interface AppLink {
  id: number;
  name: string;
  url: string;
}

export interface Conquista {
  id: number;
  nome: string;
  tipo: 'INSIGNIA' | 'CLASSE_REGULAR' | 'CLASSE_AVANCADA' | 'LIDERANCA';
  imagem_colorida: string;
  imagem_cinza: string;
  ordem: number;
  shape: 'RECTANGLE' | 'CIRCLE' | 'OVAL' | 'FLAG';
}

export type ViewState = 'LOGIN' | 'SIGNUP' | 'HOME' | 'CLUB_LIST' | 'SETTINGS' | 'PROFILE';
