
import { createClient } from '@supabase/supabase-js';
import { ClubType, Category, Especialidade, ClubClass, DesbravaMais, BibleBook, BibleVerse, BibleDictionaryEntry, UserProfile, Devocional, Cultura, LivroClasse, LivroAno, OutroLivro, ManualDBV, CampingDBV, Formulario, Video, VideoCategory, LivroAVT, ManualAVT, AppLink, Conquista } from '../types';

const DEFAULT_URL = 'https://qfpyjavbncijowjvznkg.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHlqYXZibmNpam93anZ6bmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDcxMDUsImV4cCI6MjA3NDQyMzEwNX0.adxRCkobV-m_XUHp1KBXmg67VXkR-HL4QKFVtgQOmYc';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.startsWith('http') 
  ? import.meta.env.VITE_SUPABASE_URL 
  : DEFAULT_URL;

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchVideos(club: ClubType): Promise<Video[]> {
  const { data, error } = await supabase
    .from('Videos')
    .select('*')
    .eq('club', club)
    .order('id', { ascending: true });
  if (error) return [];
  return data;
}

export async function fetchAtividadesJogosDBV(): Promise<Video[]> {
  const { data, error } = await supabase.from('AtividadesJogosDBV').select('*').order('id', { ascending: true });
  if (error) return [];
  return data.map(v => ({
    id: v.id,
    created_at: v.created_at,
    titulo: v.Titulo || '',
    canal: v.Canal || '',
    duracao: v.Minutos || '',
    visualizacoes: v.Visualizacao || '0',
    link: v.Link || '',
    categoria_id: -1, // Virtual ID
    club: ClubType.PATHFINDER
  }));
}

export async function fetchCerimoniasDBV(): Promise<Video[]> {
  const { data, error } = await supabase.from('CerimoniasDBV').select('*').order('id', { ascending: true });
  if (error) return [];
  return data.map(v => ({
    id: v.id,
    created_at: v.created_at,
    titulo: v.Titulo || '',
    canal: v.Canal || '',
    duracao: v.Minutos || '',
    visualizacoes: v.Visualizacao || '0',
    link: v.Link || '',
    categoria_id: -2, // Virtual ID
    club: ClubType.PATHFINDER
  }));
}

export async function fetchVideosDBV(): Promise<Video[]> {
  const { data, error } = await supabase.from('VideosDBV').select('*').order('id', { ascending: true });
  if (error) return [];
  return data.map(v => ({
    id: v.id,
    created_at: v.created_at,
    titulo: v.Titulo || '',
    canal: v.Canal || '',
    duracao: v.Minutos || '',
    visualizacoes: v.Visualizacao || '0',
    link: v.Link || '',
    categoria_id: -3, // Virtual ID
    club: ClubType.PATHFINDER
  }));
}

export async function fetchVideoCategories(club: ClubType): Promise<VideoCategory[]> {
  const { data, error } = await supabase
    .from('VideoCategories')
    .select('*')
    .eq('club', club)
    .order('id', { ascending: true });
  if (error) return [];
  return data;
}

export async function createVideo(video: Omit<Video, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('Videos').insert([video]).select().single();
  return { data, error };
}

export async function deleteVideo(id: number) {
  const { error } = await supabase.from('Videos').delete().eq('id', id);
  return { error };
}

export async function createVideoCategory(category: Omit<VideoCategory, 'id'>) {
  const { data, error } = await supabase.from('VideoCategories').insert([category]).select().single();
  return { data, error };
}

export async function deleteVideoCategory(id: number) {
  const { error } = await supabase.from('VideoCategories').delete().eq('id', id);
  return { error };
}

export async function fetchLivrosClasses(): Promise<LivroClasse[]> {
  const { data, error } = await supabase.from('LivroDasClasses').select('*').order('id', { ascending: true });
  if (error) return [];
  return data;
}

export async function fetchLivrosAno(): Promise<LivroAno[]> {
  const { data, error } = await supabase.from('LivrosDoAno').select('*').order('id', { ascending: true });
  if (error) return [];
  return data;
}

export async function fetchOutrosLivros(): Promise<OutroLivro[]> {
  const { data, error } = await supabase.from('OutrosLivros').select('*').order('id', { ascending: true });
  if (error) return [];
  return data;
}

export async function fetchManuaisDBV(): Promise<ManualDBV[]> {
  const { data, error } = await supabase.from('ManuaisDBV').select('*').order('id', { ascending: true });
  if (error) return [];
  return data;
}

export async function fetchCampingDBV(): Promise<CampingDBV[]> {
  const { data, error } = await supabase.from('CampingDBV').select('*').order('id', { ascending: true });
  if (error) return [];
  return data;
}

export async function fetchFormularios(): Promise<Formulario[]> {
  // Assuming a table 'Formularios' exists or will be created
  const { data, error } = await supabase.from('Formularios').select('*').order('id', { ascending: true });
  if (error) return [];
  return data;
}

export async function createFormulario(formulario: Omit<Formulario, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('Formularios').insert([formulario]).select().single();
  return { data, error };
}

export async function deleteFormulario(id: number) {
  const { error } = await supabase.from('Formularios').delete().eq('id', id);
  return { error };
}

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
  return data.map(item => ({
    ...item,
    PDF: item.PDF || item.pdf || item.Pdf || item.Link || item.link
  }));
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
    .update({ Especialidades: specialties.join(',') })
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
    console.error("Erro ao buscar perfil por ID:", error);
    return null;
  }
  return data;
}

export async function fetchUserProfileByEmail(email: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('Usuarios')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  
  if (error) {
    console.error("Erro ao buscar perfil por email:", error);
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

export async function fetchCultura(clubType: string): Promise<Cultura | null> {
  const { data, error } = await supabase
    .from('Cultura')
    .select('*')
    .eq('club_type', clubType)
    .maybeSingle();
  
  if (error) {
    console.error("Erro ao buscar cultura:", error);
    return null;
  }
  return data;
}

export async function updateCultura(cultura: Partial<Cultura>) {
  // First attempt with all fields
  const { data, error } = await supabase
    .from('Cultura')
    .upsert(cultura, { onConflict: 'club_type' })
    .select()
    .single();
  
  // If error is "column does not exist" or "not found in schema cache", try removing the list fields
  if (error && error.message && (
    (error.message.includes('column') && error.message.includes('does not exist')) ||
    (error.message.includes('Could not find') && error.message.includes('column') && error.message.includes('schema cache'))
  )) {
    console.warn("Colunas de lista não encontradas no banco de dados, tentando salvar apenas campos básicos...", error.message);
    const { uniformes_list, emblemas_list, ...rest } = cultura;
    const { data: retryData, error: retryError } = await supabase
      .from('Cultura')
      .upsert(rest, { onConflict: 'club_type' })
      .select()
      .single();
    
    if (retryError) return { data: retryData, error: retryError };
    
    // If retry succeeded, return the data but with a warning about the lists
    return { 
      data: retryData, 
      error: { 
        message: "Os campos básicos foram salvos, mas as listas de Uniformes e Emblemas não puderam ser salvas porque as colunas ainda não existem no banco de dados. Entre em contato com o suporte para atualizar a tabela 'Cultura'." 
      } as any 
    };
  }
  
  return { data, error };
}

export async function fetchLivrosAVT(): Promise<LivroAVT[]> {
  const { data, error } = await supabase.from('LivrosAVT').select('*').order('id', { ascending: true });
  if (error) return [];
  return data;
}

export async function fetchManuaisAVT(): Promise<ManualAVT[]> {
  const { data, error } = await supabase.from('ManuaisAVT').select('*').order('id', { ascending: true });
  if (error) return [];
  return data;
}

export async function fetchAppLinks(): Promise<AppLink[]> {
  const { data, error } = await supabase.from('AppLinks').select('*').order('id', { ascending: true });
  if (error) return [];
  return data;
}

export async function updateAppLink(link: Partial<AppLink>) {
  const { data, error } = await supabase.from('AppLinks').upsert(link).select().single();
  return { data, error };
}

export async function fetchConquistas(): Promise<Conquista[]> {
  const { data, error } = await supabase.from('Conquistas').select('*').order('ordem', { ascending: true });
  if (error) return [];
  return data;
}

export async function updateConquista(conquista: Partial<Conquista>) {
  const { data, error } = await supabase.from('Conquistas').upsert(conquista).select().single();
  return { data, error };
}

export async function deleteConquista(id: number) {
  const { error } = await supabase.from('Conquistas').delete().eq('id', id);
  return { error };
}

export async function fetchUserAchievements(email: string): Promise<number[]> {
  const { data, error } = await supabase
    .from('Usuarios')
    .select('Conquistas')
    .eq('email', email)
    .maybeSingle();
  
  if (error || !data || !data.Conquistas) return [];
  
  if (typeof data.Conquistas === 'string') {
    return data.Conquistas.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
  }
  
  if (Array.isArray(data.Conquistas)) {
    return data.Conquistas.map(id => parseInt(id.toString())).filter(id => !isNaN(id));
  }

  return [];
}

export async function updateUserAchievements(email: string, achievementIds: number[]) {
  const { error } = await supabase
    .from('Usuarios')
    .update({ Conquistas: achievementIds.join(',') })
    .eq('email', email);
  return { error };
}
