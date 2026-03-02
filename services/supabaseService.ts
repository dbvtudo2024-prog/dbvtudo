
import { createClient } from '@supabase/supabase-js';
import { ClubType, Category, Especialidade, ClubClass, DesbravaMais, BibleBook, BibleVerse, BibleDictionaryEntry, UserProfile, Devocional } from '../types';

const supabaseUrl = 'https://qfpyjavbncijowjvznkg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHlqYXZibmNpam93anZ6bmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDcxMDUsImV4cCI6MjA3NDQyMzEwNX0.adxRCkobV-m_XUHp1KBXmg67VXkR-HL4QKFVtgQOmYc'; 

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchCategories(club: ClubType): Promise<Category[]> {
  const table = club === ClubType.PATHFINDER ? 'CategoriaEspecialidadeDBV' : 'CategoriaEspecialidadeAVT';
  const { data, error } = await supabase.from(table).select('*').order('id', { ascending: true });
  if (error) return [];
  return data.map(item => ({
    id: item.id,
    nome: item.Mestrado || item.Nome || item.nome || item.Titulo || 'Sem Nome',
    imagem: item.Imagem || item.imagem || item.Icone,
    cor: item.CorCorpo || item.Cor || item.cor,
    sigla: item.Sigla || item.sigla
  }));
}

export async function fetchClasses(club: ClubType): Promise<ClubClass[]> {
  const table = club === ClubType.PATHFINDER ? 'Classes' : 'ClassesAVT';
  const { data, error } = await supabase.from(table).select('*').order('id', { ascending: true });
  
  if (error) {
    console.error("Erro ao buscar classes:", error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    titulo: item.titulo || item.Titulo || item.nome || item.Nome || item.classe || item.Classe || '',
    sigla: item.Sigla || item.sigla,
    imagem: item.Imagem || item.imagem || item.logo || item.Logo || item.Icone || item.icone,
    subtitulo: item.SubTitulo || item.Subtitulo || item.subtitulo || item.descricao || item.Descricao || '',
    // Puxa exatamente o campo 'Cor' do banco de dados
    cor: item.Cor || item.cor,
    corpo: item.Corpo || item.corpo
  }));
}

export async function fetchEspecialidades(club: ClubType, categoryFilter?: string): Promise<Especialidade[]> {
  const table = club === ClubType.PATHFINDER ? 'EspecialidadesDBV' : 'EspecialidadesAVT';
  let query = supabase.from(table).select('*');
  if (categoryFilter) query = query.eq('Categoria', categoryFilter);
  
  const { data, error } = await query.order('ID', { ascending: true });
  if (error) return [];
  return data.map(item => ({
    id: item.id,
    nome: item.Nome,
    area: item.Categoria,
    logo: item.Imagem,
    requisitos: item.Questoes ? item.Questoes.split(/\r?\n/).map((r: string) => r.trim()).filter((r: string) => r.length > 0) : [],
    club,
    sigla: item.Sigla,
    nivel: item.Nivel,
    ano: item.Ano,
    origem: item.Origem,
    codigo: item.ID
  }));
}

export async function fetchDesbravaMais(): Promise<DesbravaMais[]> {
  const { data, error } = await supabase
    .from('DesbravaMais')
    .select('*')
    .order('id', { ascending: true });
  
  if (error) {
    console.error("Erro ao buscar DesbravaMais:", error);
    return [];
  }
  return data;
}

// Funções para a Faixa (Especialidades Curtidas) no Banco de Dados - Tabela Usuarios, Coluna Especialidades
export async function fetchUserSpecialties(email: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('Usuarios')
    .select('Especialidades')
    .eq('email', email)
    .maybeSingle();
  
  if (error || !data || !data.Especialidades) return [];
  
  // Se for string (ex: "1,2,3"), converte para array de strings
  if (typeof data.Especialidades === 'string') {
    return data.Especialidades.split(',').map(id => id.trim()).filter(id => id.length > 0);
  }
  
  // Se já for array
  if (Array.isArray(data.Especialidades)) {
    return data.Especialidades.map(id => id.toString());
  }

  return [];
}

export async function updateUserSpecialties(email: string, specialties: string[]) {
  const { error } = await supabase
    .from('Usuarios')
    .update({ Especialidades: specialties })
    .eq('email', email);
  return { error };
}

export async function fetchBibleBooks(): Promise<BibleBook[]> {
  // A Bíblia tem 66 livros. Cada livro começa no capítulo 1, versículo 1.
  // Filtrando por chapter='1' e verse_number='1', conseguimos exatamente 
  // um registro por livro de forma extremamente eficiente.
  const { data, error } = await supabase
    .from('Biblia_Completa')
    .select('id, book_name, book_abbrev, total_chapters, testament')
    .eq('chapter', '1')
    .eq('verse_number', '1')
    .order('id', { ascending: true });
  
  if (error || !data) {
    console.error("Erro ao buscar livros da Bíblia:", error);
    return [];
  }

  // Mapeamos os dados para o tipo BibleBook, garantindo que total_chapters seja número
  return data.map(item => ({
    id: Number(item.id),
    book_name: item.book_name || '',
    book_abbrev: item.book_abbrev || '',
    total_chapters: Number(item.total_chapters) || 0,
    testament: item.testament || ''
  }));
}

export async function fetchBibleVerses(bookName: string, chapter: string): Promise<BibleVerse[]> {
  const { data, error } = await supabase
    .from('Biblia_Completa')
    .select('id, book_name, chapter, verse_number, text')
    .eq('book_name', bookName)
    .eq('chapter', chapter)
    .order('id', { ascending: true });

  if (error || !data) {
    console.error("Erro ao buscar versículos:", error);
    return [];
  }

  return data.map(item => ({
    id: Number(item.id),
    book_name: item.book_name || '',
    chapter: item.chapter || '',
    verse_number: item.verse_number || '',
    text: item.text || ''
  }));
}

export async function fetchBibleDictionary(search?: string): Promise<BibleDictionaryEntry[]> {
  let query = supabase.from('Biblia_Dicionario').select('*');
  
  if (search) {
    query = query.ilike('nome', `%${search}%`);
  }
  
  const { data, error } = await query.order('nome', { ascending: true }).limit(100);
  
  if (error || !data) {
    console.error("Erro ao buscar dicionário bíblico:", error);
    return [];
  }
  
  return data.map(item => ({
    id: Number(item.id),
    nome: item.nome || '',
    texto: item.texto || '',
    categoria: item.categoria || '',
    referencia: item.referencia || ''
  }));
}

// Funções para Devocionais
export async function fetchDevocionais(): Promise<Devocional[]> {
  const { data, error } = await supabase
    .from('devocionais')
    .select('*')
    .order('agendado_para', { ascending: false });
  
  if (error) {
    console.error("Erro ao buscar devocionais:", error);
    return [];
  }
  return data;
}

export async function createDevocional(devocional: Omit<Devocional, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('devocionais')
    .insert([devocional])
    .select()
    .single();
  
  return { data, error };
}

export async function deleteDevocional(id: string) {
  const { error } = await supabase
    .from('devocionais')
    .delete()
    .eq('id', id);
  
  return { error };
}

// Funções para Perfil do Usuário
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('Usuarios')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) {
    console.error("Erro ao buscar perfil:", error);
    return null;
  }
  return data;
}

export async function updateUserProfile(profile: Partial<UserProfile>) {
  if (!profile.user_id) return { error: "User ID is required" };
  
  const { error } = await supabase
    .from('Usuarios')
    .upsert(profile, { onConflict: 'user_id' });
    
  return { error };
}
