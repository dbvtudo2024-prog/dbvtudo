
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

<<<<<<< HEAD
export interface Devocional {
  id: string;
  titulo: string;
  link?: string;
  texto: string;
  agendado_para: string;
  created_at?: string;
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

=======
>>>>>>> 52bf42a0913516331346d464e05cdef6a94b819f
export type ViewState = 'LOGIN' | 'SIGNUP' | 'HOME' | 'CLUB_LIST' | 'AI_ADVISOR' | 'SETTINGS' | 'PROFILE';
