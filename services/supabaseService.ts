
import { createClient } from '@supabase/supabase-js';
import { ClubType, Category, Especialidade, ClubClass, DesbravaMais, BibleBook, BibleVerse, BibleDictionaryEntry, UserProfile, Devocional, Cultura, LivroClasse, LivroAno, OutroLivro, ManualDBV, CampingDBV, Formulario, Video, VideoCategory, LivroAVT, ManualAVT, AppLink, Conquista, Trunfo } from '../types';

const DEFAULT_URL = 'https://qfpyjavbncijowjvznkg.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHlqYXZibmNpam93anZ6bmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDcxMDUsImV4cCI6MjA3NDQyMzEwNX0.adxRCkobV-m_XUHp1KBXmg67VXkR-HL4QKFVtgQOmYc';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.startsWith('http') 
  ? import.meta.env.VITE_SUPABASE_URL 
  : DEFAULT_URL;

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;

const safeSupabaseStorage = {
  getItem: (key: string): string | null => {
    try {
      return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {}
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {}
  }
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: safeSupabaseStorage
  }
});

export async function fetchVideos(club: ClubType): Promise<Video[]> {
  try {
    const { data, error } = await supabase
      .from('Videos')
      .select('*')
      .eq('club', club)
      .order('id', { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchAtividadesJogosDBV(): Promise<Video[]> {
  try {
    const { data, error } = await supabase.from('AtividadesJogosDBV').select('*').order('id', { ascending: true });
    if (error) return [];
    return (data || []).map(v => ({
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
  } catch {
    return [];
  }
}

export async function fetchCerimoniasDBV(): Promise<Video[]> {
  try {
    const { data, error } = await supabase.from('CerimoniasDBV').select('*').order('id', { ascending: true });
    if (error) return [];
    return (data || []).map(v => ({
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
  } catch {
    return [];
  }
}

export async function fetchVideosDBV(): Promise<Video[]> {
  try {
    const { data, error } = await supabase.from('VideosDBV').select('*').order('id', { ascending: true });
    if (error) return [];
    return (data || []).map(v => ({
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
  } catch {
    return [];
  }
}

export async function fetchVideoCategories(club: ClubType): Promise<VideoCategory[]> {
  try {
    const { data, error } = await supabase
      .from('VideoCategories')
      .select('*')
      .eq('club', club)
      .order('id', { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function createVideo(video: Omit<Video, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase.from('Videos').insert([video]).select().single();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function updateVideo(video: Partial<Video> & { id: number }) {
  try {
    const { data, error } = await supabase.from('Videos').update(video).eq('id', video.id).select().single();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function deleteVideo(id: number) {
  try {
    const { error } = await supabase.from('Videos').delete().eq('id', id);
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

export async function createVideoCategory(category: Omit<VideoCategory, 'id'>) {
  try {
    const { data, error } = await supabase.from('VideoCategories').insert([category]).select().single();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function updateVideoCategory(category: Partial<VideoCategory> & { id: number }) {
  try {
    const { data, error } = await supabase.from('VideoCategories').update(category).eq('id', category.id).select().single();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function deleteVideoCategory(id: number) {
  try {
    const { error } = await supabase.from('VideoCategories').delete().eq('id', id);
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

export async function fetchLivrosClasses(): Promise<LivroClasse[]> {
  try {
    const { data, error } = await supabase.from('LivroDasClasses').select('*').order('id', { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchLivrosAno(): Promise<LivroAno[]> {
  try {
    const { data, error } = await supabase.from('LivrosDoAno').select('*').order('id', { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchOutrosLivros(): Promise<OutroLivro[]> {
  try {
    const { data, error } = await supabase.from('OutrosLivros').select('*').order('id', { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchManuaisDBV(): Promise<ManualDBV[]> {
  try {
    const { data, error } = await supabase.from('ManuaisDBV').select('*').order('id', { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchCampingDBV(): Promise<CampingDBV[]> {
  try {
    const { data, error } = await supabase.from('CampingDBV').select('*').order('id', { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchFormularios(): Promise<Formulario[]> {
  try {
    const { data, error } = await supabase.from('Formularios').select('*').order('id', { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function createFormulario(formulario: Omit<Formulario, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase.from('Formularios').insert([formulario]).select().single();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function updateFormulario(formulario: Partial<Formulario> & { id: number }) {
  try {
    const { data, error } = await supabase.from('Formularios').update(formulario).eq('id', formulario.id).select().single();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function deleteFormulario(id: number) {
  try {
    const { error } = await supabase.from('Formularios').delete().eq('id', id);
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

export async function fetchCategories(club: ClubType): Promise<Category[]> {
  try {
    const table = club === ClubType.PATHFINDER ? 'CategoriaEspecialidadeDBV' : 'CategoriaEspecialidadeAVT';
    const { data, error } = await supabase.from(table).select('*').order('id', { ascending: true });
    if (error) return [];
    return (data || []).map(item => ({
      id: item.id,
      nome: item.Mestrado || item.Nome || item.nome || item.Titulo || 'Sem Nome',
      imagem: item.Imagem || item.imagem || item.Icone,
      cor: item.CorCorpo || item.Cor || item.cor,
      sigla: item.Sigla || item.sigla
    }));
  } catch {
    return [];
  }
}

export async function fetchClasses(club: ClubType): Promise<ClubClass[]> {
  try {
    const table = club === ClubType.PATHFINDER ? 'Classes' : 'ClassesAVT';
    const { data, error } = await supabase.from(table).select('*').order('id', { ascending: true });
    
    if (error) return [];

    return (data || []).map(item => ({
      id: item.id,
      titulo: item.titulo || item.Titulo || item.nome || item.Nome || item.classe || item.Classe || '',
      sigla: item.Sigla || item.sigla,
      imagem: item.Imagem || item.imagem || item.logo || item.Logo || item.Icone || item.icone,
      subtitulo: item.SubTitulo || item.Subtitulo || item.subtitulo || item.descricao || item.Descricao || '',
      cor: item.Cor || item.cor,
      corpo: item.Corpo || item.corpo
    }));
  } catch {
    return [];
  }
}

export async function fetchEspecialidades(club: ClubType, categoryFilter?: string): Promise<Especialidade[]> {
  try {
    const table = club === ClubType.PATHFINDER ? 'EspecialidadesDBV' : 'EspecialidadesAVT';
    let query = supabase.from(table).select('*');
    if (categoryFilter) query = query.eq('Categoria', categoryFilter);
    
    const { data, error } = await query.order('ID', { ascending: true });
    if (error) return [];
    return (data || []).map(item => ({
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
  } catch {
    return [];
  }
}

export async function fetchDesbravaMais(): Promise<DesbravaMais[]> {
  try {
    const { data, error } = await supabase
      .from('DesbravaMais')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) return [];
    return (data || []).map(item => ({
      ...item,
      PDF: item.PDF || item.pdf || item.Pdf || item.Link || item.link
    }));
  } catch {
    return [];
  }
}

// Funções para a Faixa (Especialidades Curtidas) no Banco de Dados - Tabela Usuarios, Coluna Especialidades
export async function fetchUserSpecialties(email: string): Promise<string[]> {
  try {
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
  } catch {
    return [];
  }
}

export async function updateUserSpecialties(email: string, specialties: string[]) {
  try {
    const { error } = await supabase
      .from('Usuarios')
      .update({ Especialidades: specialties.join(',') })
      .eq('email', email);
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

export async function fetchBibleBooks(): Promise<BibleBook[]> {
  try {
    const { data, error } = await supabase
      .from('Biblia_Completa')
      .select('id, book_name, book_abbrev, total_chapters, testament')
      .eq('chapter', '1')
      .eq('verse_number', '1')
      .order('id', { ascending: true });
    
    if (error || !data) return [];

    return (data || []).map(item => ({
      id: Number(item.id),
      book_name: item.book_name || '',
      book_abbrev: item.book_abbrev || '',
      total_chapters: Number(item.total_chapters) || 0,
      testament: item.testament || ''
    }));
  } catch {
    return [];
  }
}

export async function fetchBibleVerses(bookName: string, chapter: string): Promise<BibleVerse[]> {
  try {
    const { data, error } = await supabase
      .from('Biblia_Completa')
      .select('id, book_name, chapter, verse_number, text')
      .eq('book_name', bookName)
      .eq('chapter', chapter)
      .order('id', { ascending: true });

    if (error || !data) return [];

    return (data || []).map(item => ({
      id: Number(item.id),
      book_name: item.book_name || '',
      chapter: item.chapter || '',
      verse_number: item.verse_number || '',
      text: item.text || ''
    }));
  } catch {
    return [];
  }
}

export async function fetchBibleDictionary(search?: string): Promise<BibleDictionaryEntry[]> {
  try {
    let query = supabase.from('Biblia_Dicionario').select('*');
    
    if (search) {
      query = query.ilike('nome', `%${search}%`);
    }
    
    const { data, error } = await query.order('nome', { ascending: true }).limit(100);
    
    if (error || !data) return [];
    
    return (data || []).map(item => ({
      id: Number(item.id),
      nome: item.nome || '',
      texto: item.texto || '',
      categoria: item.categoria || '',
      referencia: item.referencia || ''
    }));
  } catch {
    return [];
  }
}

// Funções para Devocionais
export async function fetchDevocionais(): Promise<Devocional[]> {
  try {
    const { data, error } = await supabase
      .from('devocionais')
      .select('*')
      .order('agendado_para', { ascending: false });
    
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function createDevocional(devocional: Omit<Devocional, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('devocionais')
      .insert([devocional])
      .select()
      .single();
    
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function updateDevocional(devocional: Partial<Devocional> & { id: string }) {
  try {
    const { data, error } = await supabase
      .from('devocionais')
      .update(devocional)
      .eq('id', devocional.id)
      .select()
      .single();
    
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function deleteDevocional(id: string) {
  try {
    const { error } = await supabase
      .from('devocionais')
      .delete()
      .eq('id', id);
    
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

// Funções para Perfil do Usuário
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('Usuarios')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function fetchUserProfileByEmail(email: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('Usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function updateUserProfile(profile: Partial<UserProfile>) {
  if (!profile.user_id) return { error: "User ID is required" };
  
  try {
    const { error } = await supabase
      .from('Usuarios')
      .upsert(profile, { onConflict: 'user_id' });
      
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

export const DEFAULT_CULTURA_DBV: Cultura = {
  id: 1,
  club_type: 'PATHFINDER',
  ideais: `Voto: Pela graça de Deus, serei puro, bondoso e leal; guardarei a lei do Desbravador, serei servo de Deus e amigo de todos.
Lei: A Lei do Desbravador ordena-me: 1. Observar a devoção matinal; 2. Cumprir fielmente a parte que me corresponde; 3. Cuidar de meu corpo; 4. Manter a consciência limpa; 5. Ser cortês e obediente; 6. Andar com reverência na casa de Deus; 7. Ter sempre um cântico no coração; 8. Ir aonde Deus mandar.
Alvo: A mensagem do advento a todo o mundo em minha geração.
Lema: O amor de Cristo me motiva.
Objetivo: Salvar do pecado e guiar no serviço.
Voto à Bíblia: Prometo fidelidade à Bíblia, à sua mensagem de um Salvador crucificado, ressurreto e prestes a vir, doador de vida e liberdade a todos que nEle crêem.`,
  voto: 'Pela graça de Deus, serei puro, bondoso e leal; guardarei a lei do Desbravador, serei servo de Deus e amigo de todos.',
  lei: 'A Lei do Desbravador ordena-me:\n1. Observar a devoção matinal;\n2. Cumprir fielmente a parte que me corresponde;\n3. Cuidar de meu corpo;\n4. Manter a consciência limpa;\n5. Ser cortês e obediente;\n6. Andar com reverência na casa de Deus;\n7. Ter sempre um cântico no coração;\n8. Ir aonde Deus mandar.',
  alvo: 'A mensagem do advento a todo o mundo em minha geração.',
  lema: 'O amor de Cristo me motiva.',
  objetivo: 'Salvar do pecado e guiar no serviço.',
  voto_biblia: 'Prometo fidelidade à Bíblia, à sua mensagem de um Salvador crucificado, ressurreto e prestes a vir, doador de vida e liberdade a todos que nEle crêem.',
  hino_letra: `Nós somos os Desbravadores,
Os servos do Rei dos reis!
Sempre avante assim marchamos,
Fiéis às Suas leis.

Devemos ao mundo anunciar,
As novas da salvação,
Que Cristo virá em breve
Dar o galardão!`,
  hino_video: 'https://www.youtube.com/watch?v=kYJjZ8kZq-E',
  historia_mundial: 'O Clube de Desbravadores é um ministério mundial da Igreja Adventista do Sétimo Dia, trabalhando com juvenis de 10 a 15 anos no desenvolvimento físico, mental e espiritual.',
  historia_america_sul: 'Na América do Sul, o movimento dos Desbravadores floresceu rapidamente a partir da década de 1950, tornando-se uma das maiores forças jovens do continente.',
  historia_brasil: 'No Brasil, os primeiros clubes oficiais surgiram em 1959 no estado de São Paulo, expandindo-se para todas as regiões do país.',
  uniformes_list: [
    {
      id: "cat-pl0im",
      club: "PATHFINDER",
      titulo: "Admissão em Lenço",
      subitems: [],
      blocks: [
        {
          id: "b_adm_1",
          type: "text",
          content: "O Uniforme de gala somente poderá ser usado a partir da cerimônia de admissão em lenço, após cumpridos os requisitos do Cartão-Nosso Clube. A admissão em lenço somente poderá ocorrer quando o Desbravador ou adulto tenha o seu próprio Uniforme A."
        }
      ]
    },
    {
      id: "grp-uniforme",
      club: "PATHFINDER",
      titulo: "Uniforme de Gala",
      subitems: [
        {
          id: "cat-yzvbd",
          club: "PATHFINDER",
          titulo: "Uniforme de Desbravador - Feminino (10 a 15 anos)",
          descricao: "Saia verde-petróleo com prega macho na frente, zíper atrás e bolsos embutidos. Camisa branca de manga curta com botões transparentes. Lenço e prendedor oficial dos Desbravadores. Cinto verde-petróleo com fivela oficial. Meias brancas 3/4 e sapatos pretos."
        },
        {
          id: "cat-b5trt",
          club: "PATHFINDER",
          titulo: "Uniforme de Desbravador - Masculino (10 a 15 anos)",
          descricao: "Calça verde-petróleo com bolsos embutidos atrás e bolso faca na frente. Camisa cáqui de manga curta com botões transparentes. Lenço e prendedor oficial dos Desbravadores. Cinto verde-petróleo com fivela oficial. Meias pretas e sapatos pretos."
        },
        {
          id: "cat-gu818",
          club: "PATHFINDER",
          titulo: "Uniforme de Desbravador - Masculino (à partir de 16 anos)",
          descricao: "Calça verde-petróleo oficial. Camisa branca de manga curta com porta-platina nos ombros. Gravata verde-petróleo com nó simples e prendedor oficial (opcional para reuniões normais). Lenço de líder quando investido. Meias pretas e sapatos pretos."
        },
        {
          id: "cat-vjv5n",
          club: "PATHFINDER",
          titulo: "Uniforme de Desbravador - Feminino (à partir de 16 anos)",
          descricao: "Saia verde-petróleo oficial. Camisa branca de manga curta com porta-platina nos ombros. Lenço de líder quando investida. Meias finas na cor da pele e sapatos pretos de salto médio/baixo ou sapatilha preta."
        },
        {
          id: "cat-h2rjr",
          club: "PATHFINDER",
          titulo: "Uniforme de diretores, distritais, regionais, pastores, coordenadores gerais e secretários(as) de campo, departamentais e associados",
          descricao: "Uniforme oficial com uso de platinas correspondentes à função, gravata verde-petróleo (masculino) ou lenço, e insígnias conforme o regulamento da DSA."
        },
        {
          id: "cat-trdfz",
          club: "PATHFINDER",
          titulo: "Uniforme do Clube de Líderes",
          descricao: "Uniforme padrão de líderes conforme o Regulamento de Uniformes dos Desbravadores (RUD)."
        }
      ],
      blocks: []
    },
    {
      id: "cat-4pu70",
      club: "PATHFINDER",
      titulo: "Posição dos Emblemas, Insígnias, Tiras e Distintivos (10 a 15 anos)",
      subitems: [],
      blocks: [
        {
          id: "b_pos_1",
          type: "text",
          content: "O novo RUD (Versão 2020), estabeleceu-se que:\n• Os Distintivos de Classes Regulares devem ser alinhados e centralizados conforme forem sendo recebidos, sempre da esquerda para a direita de quem vê, o espaçamento entre eles é de 0,4cm.\n• Os Distintivos de Classes Avançadas devem ficar alinhados em duas linhas horizontais, dispostos em ordem crescente da esquerda para a direita de quem vê e de baixo para cima, centralizados.\n• O Distintivo de Batismo pode ser usado na faixa, centralizado abaixo da bandeira e acima do nome, se este estiver sendo usado. Acompanhe abaixo as posições oficiais nas mangas e camisa:"
        },
        {
          id: "b_pos_2",
          type: "image",
          content: "https://mda.wiki.br/site/@imgs_wiki/imagem@camisa_frente_uniforme_gala_desbravadores.png"
        },
        {
          id: "b_pos_3",
          type: "image",
          content: "https://mda.wiki.br/site/@imgs_wiki/imagem@camisa_frente_uniforme_gala_desbravadores_diretoria.webp"
        },
        {
          id: "b_pos_4",
          type: "image",
          content: "https://mda.wiki.br/site/@imgs_wiki/imagem@manga_uniforme_gala_desbravadores.png"
        },
        {
          id: "b_pos_5",
          type: "image",
          content: "https://mda.wiki.br/site/@imgs_wiki/imagem@manga_uniforme_gala_desbravadores_diretoria.webp"
        },
        {
          id: "b_pos_6",
          type: "text",
          content: "• As 'Divisas de Classes' agora poderá optar pelo uso de uma tira de classe individual que corresponde somente à cor da classe investida."
        }
      ]
    },
    {
      id: "cat-ecefv",
      club: "PATHFINDER",
      titulo: "Lenço do Desbravador",
      subitems: [],
      blocks: [
        {
          id: "b_lenco_dbv_img",
          type: "image",
          content: "https://mda.wiki.br/site/@imgs_wiki/imagem@lenco_desbravadores.jpg"
        },
        {
          id: "b_lenco_dbv_txt",
          type: "text",
          content: "Amarelo com emblema D2 bordado em suas cores originais no tamanho 11,5 cm x 8,5 cm. Deverá ser usado com uniforme oficial e de atividades. Quando necessário também poderá ser usado com outra roupa, desde que a mesma combine com os princípios dos desbravadores e que a pessoa que o usa esteja envolvida em atividades do clube. É a identificação mundial dos desbravadores, por isso, somente o lenço oficial pode ser usado. Disponível em 3 tamanhos: P (85 cm), M (100 cm) e G (114 cm). As medidas são de uma a outra ponta superior do lenço."
        }
      ]
    },
    {
      id: "cat-z8422",
      club: "PATHFINDER",
      titulo: "Lenço de Líder",
      subitems: [],
      blocks: [
        {
          id: "b_lenco_lid_img",
          type: "image",
          content: "https://mda.wiki.br/site/@imgs_wiki/imagem@lenco_de_lider.jpg"
        },
        {
          id: "b_lenco_lid_txt",
          type: "text",
          content: "Amarelo com borda em viés vermelho e com tiras bordadas correspondentes às Classes Regulares, tendo abaixo o emblema L D1 bordado no tamanho 10,5 cm x 10,5 cm. Deverá ser usado com o uniforme oficial e de atividades, quando necessário também poderá ser usado com outra roupa, desde que a mesma combine com os princípios dos Desbravadores e que a pessoa que o usa esteja envolvida em atividades do Clube. É a identificação mundial dos Desbravadores, por isso, somente o lenço oficial pode ser usado. Disponível em 3 tamanhos: P (85 cm), M (100 cm) e G (114 cm). As medidas são de uma a outra ponta superior do lenço."
        }
      ]
    },
    {
      id: "cat-0165k",
      club: "PATHFINDER",
      titulo: "Prendedor de Lenço",
      subitems: [],
      blocks: [
        {
          id: "b_prendedor_img",
          type: "image",
          content: "https://mda.wiki.br/site/@imgs_wiki/imagem@prendedores_de_lenco_1.jpg"
        },
        {
          id: "b_prendedor_txt",
          type: "text",
          content: "Metálico dourado, com 3,8 cm x 2 cm com emblema D3 para o Desbravador e L D3 para Líder na medida de 2,5 cm de diâmetro. Será permitido às unidades desenvolverem seus próprios prendedores para uso com o uniforme de atividades do clube."
        }
      ]
    },
    {
      id: "cat-cf0k3",
      club: "PATHFINDER",
      titulo: "Cobertura",
      subitems: [],
      blocks: [
        {
          id: "b_cobertura_img",
          type: "image",
          content: "https://mda.wiki.br/site/@imgs_wiki/imagem@bones_gala.jpg"
        },
        {
          id: "b_cobertura_txt",
          type: "text",
          content: "Boné de uso opcional. Na cor verde petróleo, com o cordão torcido na cor ouro sobre a pala até as extremidades da aba. Na base uma listra (sutache) amarela. Modelo americano com emblema bordado D3 para desbravadores e L D3 para líderes investidos, com regulador e revestimento interno (carneira) na cor do boné."
        }
      ]
    },
    {
      id: "cat-mg9wv",
      club: "PATHFINDER",
      titulo: "Cinto",
      subitems: [],
      blocks: [
        {
          id: "b_cinto_img",
          type: "image",
          content: "https://mda.wiki.br/site/@imgs_wiki/imagem@cinto.jpeg"
        },
        {
          id: "b_cinto_txt",
          type: "text",
          content: "Verde petróleo com 3,4 cm de altura (cinto cadarço), com fivela dourada tendo ao centro o emblema D1, nas cores oficiais e em relevo, medindo 3,6 cm de altura por 5,5 cm de comprimento. Não haverá fivela diferenciada para líderes."
        }
      ]
    },
    {
      id: "cat-ts0ie",
      club: "PATHFINDER",
      titulo: "Calçados e Meias",
      subitems: [],
      blocks: [
        {
          id: "b_calcados_txt",
          type: "text",
          content: "Sapato preto baixo ou tênis preto sem detalhes coloridos.\n• Rapazes: meias pretas.\n• Moças até 15 anos: meias brancas ¾.\n• Moças a partir de 16 anos: meias finas na cor da pele, e em reuniões especiais poderá usar sapato social."
        }
      ]
    },
    {
      id: "cat-bhiqr",
      club: "PATHFINDER",
      titulo: "Torçal",
      subitems: [],
      blocks: [
        {
          id: "b_torcal_img",
          type: "image",
          content: "https://mda.wiki.br/site/@imgs_wiki/imagem@apito.jpeg"
        },
        {
          id: "b_torcal_txt",
          type: "text",
          content: "Opcional. Usado pela diretoria no ombro esquerdo com apito. Cordão trançado em polipropileno (com bitola: ø 4,00 mm). O torçal é trançado com nó de quatro pontas na parte superior que envolve o braço, e trançado com o nó de surrão invertido no prolongamento até o apito. O torçal na cor vermelha é de uso exclusivo do departamental da Divisão."
        }
      ]
    },
    {
      id: "cat-r67e7",
      club: "PATHFINDER",
      titulo: "Platina ou Galão",
      subitems: [],
      blocks: [
        {
          id: "b_platina_img",
          type: "image",
          content: "https://mda.wiki.br/site/@imgs_wiki/imagem@platina.jpeg"
        },
        {
          id: "b_platina_txt",
          type: "text",
          content: "Será usado no tamanho de 8,0 x 5,5 cm (no caso de uso de tiras de 8 mm cada, a partir de 1 cm da base e espaço de 5 mm entre elas), usado por diretores, distritais, regionais, pastores, coordenadores gerais, secretários(as) de campo, departamentais e associados."
        }
      ]
    }
  ],
  emblemas_list: [
    {
      id: "cat_0_1776792488105",
      club: "PATHFINDER",
      titulo: "Emblemas",
      imagem: "",
      subitems: [
        {
          id: "sub_0_0_1776792488105",
          club: "PATHFINDER",
          titulo: "Emblema D1",
          imagem: "https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_d1.png",
          descricao: "É o símbolo que representa o Clube de Desbravadores. Apresenta a inscrição DESBRAVADORES na parte superior do triângulo e a inscrição CLUBE abaixo do escudo com a espada. É usado na manga direita da camisa ou blusa no tamanho 7,5 cm x 7,5 cm."
        },
        {
          id: "sub_0_1_1776792488105",
          club: "PATHFINDER",
          titulo: "Emblema D2",
          imagem: "https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_d2.png",
          descricao: "É usado na manga esquerda da camisa ou blusa no tamanho 7,0 cm x 5,0 cm. No lenço é bordado no tamanho 11,5 cm x 8,5 cm."
        },
        {
          id: "sub_0_2_1776792488105",
          club: "PATHFINDER",
          titulo: "Emblema D3",
          imagem: "https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_d3.png",
          descricao: "É usado na cobertura, no prendedor de lenço, na fivela do cinto e na bandeira dos Desbravadores no tamanho de 3,8 cm x 2,0 cm."
        },
        {
          id: "sub_0_3_1776792488105",
          club: "PATHFINDER",
          titulo: "Emblema D4",
          imagem: "https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_d4.png",
          descricao: "Apresenta o triângulo em perspectiva sobre um globo com as linhas meridionais e equatoriais. É usado na jaqueta, camiseta e boné de atividades e em materiais promocionais."
        },
        {
          id: "sub_0_4_1776792488105",
          club: "PATHFINDER",
          titulo: "Emblema D5",
          imagem: "https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_d5.png",
          descricao: "Apresenta apenas o traçado do triângulo e escudo com espada. É usado nos distintivos de classes e liderança."
        },
        {
          id: "sub_0_5_1776792488105",
          club: "PATHFINDER",
          titulo: "Emblema L D1",
          imagem: "https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_ld1.png",
          descricao: "É o símbolo que representa a Liderança dos Desbravadores. Apresenta o globo com as linhas meridionais e o triângulo D1 ao centro com a estrela de liderança. É usado no lenço de líder e na manga esquerda."
        },
        {
          id: "sub_0_6_1776792488105",
          club: "PATHFINDER",
          titulo: "Emblema L D2",
          imagem: "https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_ld2.png",
          descricao: "Globo de líder estilizado usado em materiais da liderança dos Desbravadores."
        },
        {
          id: "sub_0_7_1776792488105",
          club: "PATHFINDER",
          titulo: "Emblema L D3",
          imagem: "https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_ld3.png",
          descricao: "Usado na fivela de cinto e prendedor de lenço de líderes investidos."
        },
        {
          id: "sub_0_8_1776792488105",
          club: "PATHFINDER",
          titulo: "Emblema L D4",
          imagem: "https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_ld3.png",
          descricao: "Símbolo promocional de líderes dos Desbravadores."
        },
        {
          id: "sub_0_9_1776792488105",
          club: "PATHFINDER",
          titulo: "Emblema do Campo",
          imagem: "https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_campo.png",
          descricao: "Representa a Associação ou Missão local à qual o clube pertence. Usado na manga esquerda da camisa oficial."
        }
      ]
    },
    {
      id: "cat_1_1776792488105",
      club: "PATHFINDER",
      titulo: "Insígnias e Tiras",
      imagem: "",
      subitems: [
        {
          id: "sub_1_0_1776792488105",
          club: "PATHFINDER",
          titulo: "Tira com o Nome do Clube",
          imagem: "",
          descricao: "Usada na manga direita da camisa ou blusa, na posição superior, curvada, medindo 8 cm x 2,5 cm."
        },
        {
          id: "sub_1_1_1776792488105",
          club: "PATHFINDER",
          titulo: "Tira de Cargo",
          imagem: "",
          descricao: "Usada na manga direita abaixo da tira com o nome do clube, medindo 8 cm x 2 cm."
        },
        {
          id: "sub_1_2_1776792488105",
          club: "PATHFINDER",
          titulo: "Tira de Classe",
          imagem: "",
          descricao: "Usada na manga esquerda abaixo do emblema do campo, indicando a classe mais alta em andamento ou concluída."
        },
        {
          id: "sub_1_3_1776792488105",
          club: "PATHFINDER",
          titulo: "Tira com o Nome do Desbravador",
          imagem: "",
          descricao: "Usado por desbravadores e líderes em tecido, e bordado apenas um nome. Seu uso é centralizado a 5 cm acima da tampa do bolso direito, e na faixa 8 cm abaixo da costura do ombro, medindo 8 cm x 2 cm."
        },
        {
          id: "sub_1_4_1776792488105",
          club: "PATHFINDER",
          titulo: "Tarjeta de Identificação",
          imagem: "",
          descricao: "Em metal. Uso exclusivo de Diretor Local, Distrital, Regional, Coordenador Geral, Associado, Secretária de Campo e Departamental."
        },
        {
          id: "sub_1_5_1776792488105",
          club: "PATHFINDER",
          titulo: "Estrela de Tempo de Serviço",
          imagem: "",
          descricao: "Estrela de cinco pontas que representa os anos de serviço prestados na Diretoria do Clube ou Liderança dos Desbravadores."
        },
        {
          id: "sub_1_6_1776792488105",
          club: "PATHFINDER",
          titulo: "Faixa de Especialidades",
          imagem: "",
          descricao: "Usada da direita para a esquerda, apoiada no ombro direito, sobre o porta platina e apoiado sobre a coxa esquerda. Cor verde petróleo."
        },
        {
          id: "sub_1_7_1776792488105",
          club: "PATHFINDER",
          titulo: "Lenço do Desbravador",
          imagem: "https://mda.wiki.br/site/@imgs_wiki/imagem@lenco_desbravadores.jpg",
          descricao: "Amarelo com emblema D2 bordado em suas cores originais no tamanho 11,5 cm x 8,5 cm. É a identificação mundial dos desbravadores."
        },
        {
          id: "sub_1_8_1776792488105",
          club: "PATHFINDER",
          titulo: "Lenço de Líder",
          imagem: "https://mda.wiki.br/site/@imgs_wiki/imagem@lenco_de_lider.jpg",
          descricao: "Amarelo com borda em viés vermelho e com tiras bordadas correspondentes às Classes regulares, tendo abaixo o emblema L D1 bordado no tamanho 10,5 cm x 10,5 cm."
        }
      ]
    },
    {
      id: "cat_2_1776792488105",
      club: "PATHFINDER",
      titulo: "Distintivos",
      imagem: "",
      subitems: [
        {
          id: "sub_2_0_1776792488105",
          club: "PATHFINDER",
          titulo: "Distintivos de Classes Regulares",
          imagem: "",
          descricao: "Em formato redondo, medindo 1,2 cm de diâmetro, produzido em metal nas cores correspondentes às classes. O Emblema D5 e a borda são traçados em amarelo ouro."
        },
        {
          id: "sub_2_1_1776792488105",
          club: "PATHFINDER",
          titulo: "Divisas de Classes",
          imagem: "",
          descricao: "Colocadas na manga esquerda após a respectiva investidura, abaixo do emblema D2, em ordem ascendente, bordadas nas cores das Classes Regulares."
        },
        {
          id: "sub_2_2_1776792488105",
          club: "PATHFINDER",
          titulo: "Distintivos de Classes Avançadas",
          imagem: "",
          descricao: "Usados separadamente ou agrupados em metal ou bordado. Distintivos alinhados em duas linhas horizontais, medindo 3,5 cm x 1,0 cm cada."
        },
        {
          id: "sub_2_3_1776792488105",
          club: "PATHFINDER",
          titulo: "Insígnia de Excelência",
          imagem: "",
          descricao: "Representa o elevado padrão de excelência do Desbravador dedicado ao Clube. Concedida pelo Clube ao final de cada ano."
        },
        {
          id: "sub_2_4_1776792488105",
          club: "PATHFINDER",
          titulo: "Distintivo de Batismo",
          imagem: "",
          descricao: "Usado por todos os membros batizados, na tampa do bolso direito, como identificação de seu batismo, no tamanho de 1,5 cm x 1,6 cm."
        },
        {
          id: "sub_2_5_1776792488105",
          club: "PATHFINDER",
          titulo: "Divisa de Líder",
          imagem: "",
          descricao: "No tamanho 8,5 x 4,5 cm sobre fundo branco com contorno verde petróleo. Estrela amarela de 5 pontas e as divisas das classes regulares."
        },
        {
          id: "sub_2_6_1776792488105",
          club: "PATHFINDER",
          titulo: "Distintivo de Função na Unidade",
          imagem: "",
          descricao: "O capitão(ã), secretário(a), ou outra função necessária usarão um distintivo bordado, acrílico ou metal, designando sua função."
        }
      ]
    },
    {
      id: "cat_3_1776792488105",
      club: "PATHFINDER",
      titulo: "Bandeira Oficial dos Desbravadores",
      imagem: "https://mda.wiki.br/site/@imgs_wiki/imagem@bandeira_oficial.png",
      subitems: [],
      descricao: "Medindo 128 x 90 cm. O retângulo superior esquerdo e o inferior direito na cor azul royal, e o retângulo inferior esquerdo e o superior direito na cor branca. Ao centro o emblema D1 de 30 x 30 cm nas cores originais."
    },
    {
      id: "cat_4_1776792488105",
      club: "PATHFINDER",
      titulo: "Bandeirim",
      imagem: "https://mda.wiki.br/site/@imgs_wiki/imagem@bandeirim.png",
      subitems: [],
      descricao: "Representa a Unidade. Bordado com contorno e desenho estabelecido pelo Campo local. Será produzido em dois tamanhos, o menor com 7 x 4,5 cm e o maior com 9 x 5,5 cm. Deve conter o nome da unidade e o emblema D1."
    }
  ]
};

export const DEFAULT_CULTURA_AVT: Cultura = {
  id: 2,
  club_type: 'ADVENTURER',
  ideais: `Voto: Por amor a Jesus, farei sempre o meu melhor.
Lei: A Lei do Aventureiro ordena-me: Jesus me ajuda a ser: Obediente, Puro, Reverente, Bondoso e Cortês.
Alvo: Ver o retorno de Jesus e viver eternamente com Ele.
Lema: O amor de Jesus me conduz.
Voto à Bíblia: Prometo fidelidade à Bíblia, à sua mensagem de um Salvador crucificado, ressurreto e prestes a vir, doador de vida e liberdade a todos que nEle crêem.`,
  voto: 'Por amor a Jesus, farei sempre o meu melhor.',
  lei: 'A Lei do Aventureiro manda-me: Jesus me ajuda a ser:\n• Obediente\n• Puro\n• Reverente\n• Bondoso\n• Cortês',
  alvo: 'Ver o retorno de Jesus e viver eternamente com Ele.',
  lema: 'O amor de Jesus me conduz.',
  objetivo: 'Ajudar as crianças de 6 a 9 anos a fortalecerem seu relacionamento com Deus, família e comunidade.',
  voto_biblia: 'Prometo fidelidade à Bíblia, à sua mensagem de um Salvador crucificado, ressurreto e prestes a vir, doador de vida e liberdade a todos que nEle crêem.',
  hino_letra: `Somos Aventureiros alegres,
Que confiam no amigo Jesus.
Aprendemos que sempre devemos,
Ser pra todos um brilho de luz.

Descobrimos em tudo a beleza,
E o amor de um Deus criador.
E amando a Cristo faremos,
Maravilhas pro seu louvor!`,
  hino_video: 'https://www.youtube.com/watch?v=0kFv1QGv1bM',
  historia_mundial: 'O Clube de Aventureiros foi idealizado pela Igreja Adventista para atender especificamente as necessidades de crianças de 6 a 9 anos e suas famílias.',
  historia_america_sul: 'Na Divisão Sul-Americana, os Aventureiros foram estruturados no início dos anos 1990 com currículo especializado.',
  historia_brasil: 'No Brasil, centenas de milhares de crianças participam ativamente do Clube de Aventureiros em igrejas de todo o território nacional.',
  uniformes_list: [],
  emblemas_list: []
};

export function getFallbackCultura(clubType: string): Cultura {
  const isDBV = clubType === 'PATHFINDER' || clubType === ClubType.PATHFINDER;
  const defaultObj = isDBV ? DEFAULT_CULTURA_DBV : DEFAULT_CULTURA_AVT;
  try {
    const cached = localStorage.getItem(`dbv_tudo_cultura_${clubType}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...defaultObj, ...parsed };
    }
  } catch {}
  return defaultObj;
}

export async function fetchCultura(clubType: string): Promise<Cultura | null> {
  try {
    const { data, error } = await supabase
      .from('Cultura')
      .select('*')
      .eq('club_type', clubType)
      .maybeSingle();
    
    if (error || !data) {
      return getFallbackCultura(clubType);
    }
    
    // Save to local cache for offline/instant access
    try {
      localStorage.setItem(`dbv_tudo_cultura_${clubType}`, JSON.stringify(data));
    } catch {}
    
    return data;
  } catch {
    return getFallbackCultura(clubType);
  }
}

export async function updateCultura(cultura: Partial<Cultura>) {
  // Update local cache immediately
  if (cultura.club_type) {
    try {
      const existing = getFallbackCultura(cultura.club_type);
      localStorage.setItem(`dbv_tudo_cultura_${cultura.club_type}`, JSON.stringify({ ...existing, ...cultura }));
    } catch {}
  }

  try {
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
      
      return { 
        data: retryData, 
        error: { 
          message: "Os campos básicos foram salvos, mas as listas de Uniformes e Emblemas não puderam ser salvas porque as colunas ainda não existem no banco de dados." 
        } as any 
      };
    }
    
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function fetchLivrosAVT(): Promise<LivroAVT[]> {
  try {
    const { data, error } = await supabase.from('LivrosAVT').select('*').order('id', { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchManuaisAVT(): Promise<ManualAVT[]> {
  try {
    const { data, error } = await supabase.from('ManuaisAVT').select('*').order('id', { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchAppLinks(): Promise<AppLink[]> {
  try {
    const { data, error } = await supabase.from('AppLinks').select('*').order('id', { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function updateAppLink(link: Partial<AppLink>) {
  try {
    const { data, error } = await supabase.from('AppLinks').upsert(link).select().single();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function deleteAppLink(id: number) {
  try {
    const { error } = await supabase.from('AppLinks').delete().eq('id', id);
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

export async function fetchConquistas(): Promise<Conquista[]> {
  try {
    const { data, error } = await supabase.from('Conquistas').select('*').order('ordem', { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function updateConquista(conquista: Partial<Conquista>) {
  try {
    const { data, error } = await supabase.from('Conquistas').upsert(conquista).select().single();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function deleteConquista(id: number) {
  try {
    const { error } = await supabase.from('Conquistas').delete().eq('id', id);
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

export async function fetchUserAchievements(email: string): Promise<number[]> {
  try {
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
  } catch {
    return [];
  }
}

export async function updateUserAchievements(email: string, achievementIds: number[]) {
  try {
    const { error } = await supabase
      .from('Usuarios')
      .update({ Conquistas: achievementIds.join(',') })
      .eq('email', email);
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

const DEFAULT_TRUNFOS: Trunfo[] = [
  // --- DIVISÃO SUL-AMERICANA (DSA) - DESBRAVADORES ---
  {
    id: 1,
    titulo: 'VI Campori Sul-Americano - Sempre Desbravador',
    ano: '2027',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O VI Campori de Desbravadores da Divisão Sul-Americana (DSA) da Igreja Adventista do Sétimo Dia acontecerá em janeiro de 2027 sob o tema oficial "Sempre Desbravador".

Local: Parque do Peão de Barretos, no interior de São Paulo.

Participantes: A expectativa oficial é reunir mais de 120 mil desbravadores, líderes e equipe de apoio de 8 países da América do Sul, divididos nas edições Alpha (5 a 10 de janeiro) e Ômega (12 a 17 de janeiro).

Tema central: "Sempre Desbravador" celebra o compromisso perpétuo do jovem com a fé cristã, a liderança servidora, a integridade bíblica e o cumprimento da missão até a volta de Jesus.

Atividades: O evento contará com superpalco de louvor internacional, oratória bíblica, feira de especialidades, projetos sociais na comunidade de Barretos, batismos em massa, investiduras históricas e mega gincanas de pioneirismo.`,
    club: 'PATHFINDER'
  },
  {
    id: 2,
    titulo: 'V Campori Sul-Americano - A Melhor Aventura',
    ano: '2019',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O V Campori de Desbravadores da Divisão Sul-Americana (DSA) da Igreja Adventista do Sétimo Dia foi realizado em janeiro de 2019 sob o tema "#AMelhorAventura".

Local: Parque do Peão em Barretos, São Paulo.

Participantes: Reuniu mais de 100 mil participantes de 8 países da América do Sul, distribuídos nas edições Alpha (08 a 13 de janeiro) e Ômega (15 a 20 de janeiro), consagrando-se como o maior campori da história da igreja no mundo.

Tema central: O logo e a mensagem central retratavam desbravadores escalando uma montanha íngreme de mãos dadas com seus líderes e Jesus, representando que a jornada cristã até o Céu é a maior e mais extraordinária aventura da vida.

Atividades: Incluiu a mega tenda de especialidades, feira de projetos científicos e ecológicos, museu de história dos pioneiros, musicais ao vivo, encenações bíblicas teatrais, batismos na arena e expressivas ações comunitárias de doação de sangue e alimentos na cidade.`,
    club: 'PATHFINDER'
  },
  {
    id: 3,
    titulo: 'IV Campori Sul-Americano - Encontro Marcado na Eternidade',
    ano: '2014',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O IV Campori de Desbravadores da Divisão Sul-Americana (DSA) da Igreja Adventista do Sétimo Dia foi realizado em janeiro de 2014 sob o tema "Encontro Marcado na Eternidade".

Local: Parque do Peão em Barretos, São Paulo.

Participantes: Reuniu cerca de 35 mil desbravadores e líderes de 8 países da América do Sul, inaugurando o Parque do Peão de Barretos como a "capital sul-americana dos desbravadores".

Tema central: O tema enfatizou a certeza da volta de Jesus e o reencontro glorioso dos desbravadores de todas as nações na eternidade celestial.

Atividades: Concursos de ordem unida, feira de especialidades, desfiles de gala, projetos de revitalização em praças públicas de Barretos, batismos no grande tanque central da arena e cerimônias de investidura.`,
    club: 'PATHFINDER'
  },
  {
    id: 4,
    titulo: 'III Campori Sul-Americano - Fonte de Esperança',
    ano: '2005',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O III Campori de Desbravadores da Divisão Sul-Americana (DSA) da Igreja Adventista do Sétimo Dia foi realizado em janeiro de 2005 sob o tema "Fonte de Esperança".

Local: Balneário Municipal de Santa Helena, Paraná, às margens do Lago de Itaipu.

Participantes: Reuniu mais de 20 mil desbravadores de 8 países sul-americanos.

Tema central: "Fonte de Esperança" ressaltou Cristo como a água viva inesgotável e motivou a juventude a ser um canal de paz e esperança em suas famílias e comunidades.

Atividades: Provas náuticas e de nós/amarras às margens do Lago de Itaipu, feira de artesanato sustentável, grandes momentos de louvor comunitário, desfile cívico na cidade e investiduras de liderança.`,
    club: 'PATHFINDER'
  },
  {
    id: 5,
    titulo: 'II Campori Sul-Americano - Na Trilha dos Pioneiros',
    ano: '1994',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O II Campori de Desbravadores da Divisão Sul-Americana (DSA) da Igreja Adventista do Sétimo Dia foi realizado de 10 a 15 de janeiro de 1994 sob o tema "Na Trilha dos Pioneiros".

Local: Ponta Grossa, Paraná.

Participantes: Reuniu aproximadamente 8 mil desbravadores de todos os países do território sul-americano.

Tema central: Resgate da história e bravura dos pioneiros da Igreja Adventista e dos primeiros clubes de desbravadores no mundo, inspirando as novas gerações a manterem a chama missionária acesa.

Atividades: Gincanas rústicas de acampamento e sobrevivência na mata, feira missionária, cultos ao ar livre, passeata cívica e apresentações musicais de orquestras de fanfarras.`,
    club: 'PATHFINDER'
  },
  {
    id: 6,
    titulo: 'I Campori Sul-Americano - Da Natureza ao Criador',
    ano: '1984',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O I e histórico Campori de Desbravadores da Divisão Sul-Americana (DSA) da Igreja Adventista do Sétimo Dia foi realizado de 28 de dezembro de 1983 a 04 de janeiro de 1984 sob o tema "Da Natureza ao Criador".

Local: Foz do Iguaçu, Paraná.

Participantes: Reuniu mais de 4.000 desbravadores pioneiros de Brasil, Argentina, Paraguai, Bolívia e Chile sob a liderança geral do Pastor Cláudio Belz.

Tema central: Apreciação da grandiosidade da natureza e dos ecossistemas como testemunho vivo do poder de Deus Pai Criador.

Atividades: Visitas de estudo ecológico ao Parque Nacional do Iguaçu e às Cataratas, provas de orientação com bússola, primeiros socorros, montagem de pioneirias e celebrações espirituais com os pioneiros do clube.`,
    club: 'PATHFINDER'
  },

  // --- CAMPORIS DE UNIÕES (DESBRAVADORES) ---
  {
    id: 7,
    titulo: 'Campori UCOB - O Segredo',
    ano: '2024',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O Campori "O Segredo" foi o 4º Campori de Desbravadores da União Centro-Oeste Brasileira (UCOB) da Igreja Adventista do Sétimo Dia, realizado em julho de 2024.

Local: O evento aconteceu no Instituto Adventista Brasil Central (IABC), localizado em Abadiânia, Goiás.

Participantes: Reuniu cerca de 17 mil a 20 mil desbravadores e líderes voluntários.

Tema central: A programação girou em torno da série cinematográfica "O Segredo", que contava a história de um desbravador chamado Caio em busca de seu lenço perdido, transmitindo mensagens espirituais e de fé.

Atividades: O encontro incluiu gincanas, momentos de louvor, batismos, civismo e incentivo a missões transculturais.`,
    club: 'PATHFINDER'
  },
  {
    id: 8,
    titulo: 'VIII Campori UNB - Os Escolhidos',
    ano: '2023',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O VIII Campori de Desbravadores da União Norte Brasileira (UNB) da Igreja Adventista do Sétimo Dia foi realizado em novembro de 2023 sob o tema "Os Escolhidos".

Local: Parque de Exposições Agropecuárias de Paragominas, Pará.

Participantes: Reuniu mais de 25 mil desbravadores e instrutores dos estados do Pará, Maranhão e Amapá.

Tema central: Baseado na trajetória dos discípulos e profetas bíblicos, reforçou a convicção de que cada desbravador foi pessoalmente escolhido por Deus para fazer a diferença e proclamar o evangelho na Amazônia e no mundo.

Atividades: Mega arena de gincanas esportivas e de nós, feira de ciências da natureza amazônica, projetos de reflorestamento e limpeza urbana em Paragominas, grandes batismos e festivais de música.`,
    club: 'PATHFINDER'
  },
  {
    id: 9,
    titulo: 'Campori UNoB - O Último Desafio',
    ano: '2022',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O Campori de Desbravadores da União Noroeste Brasileira (UNoB) da Igreja Adventista do Sétimo Dia foi realizado em 2022 sob o tema "O Último Desafio".

Local: Instituto Adventista Agro-Industrial (IAAI), em Rio Preto da Eva, Amazonas.

Participantes: Reuniu mais de 12 mil desbravadores do Amazonas, Rondônia, Roraima e Acre.

Tema central: Despertar os jovens para o compromisso de pregar o evangelho nos mais desafiadores rincões da floresta e comunidades ribeirinhas antes da volta de Cristo.

Atividades: Provas de sobrevivência na selva e nós rústicos, barco hospital missionário, feira ambiental, cultos com iluminação cênica na floresta e batismos no lago.`,
    club: 'PATHFINDER'
  },
  {
    id: 10,
    titulo: 'Campori de Líderes DSA - Chamados com um Propósito',
    ano: '2022',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/logo%20app.PNG',
    historia: `A Convenção Sul-Americana de Líderes de Desbravadores e Aventureiros da Divisão Sul-Americana (DSA) foi realizada em 2022 sob o tema "Chamados com um Propósito".

Local: Centro de Eventos e Arena da Fadminas / FAP, com transmissões e polos integrados em toda a América do Sul.

Participantes: Reuniu mais de 15 mil diretores, conselheiros, secretários e instrutores de clubes.

Tema central: Capacitação de excelência e alinhamento espiritual da liderança para acolher, discipular e salvar as novas gerações de juvenis e crianças.

Atividades: Oficinas de liderança e gestão de clubes, palestras sobre saúde mental na adolescência, workshops de novas especialidades, treinamentos técnicos de acampamento e vigília de oração intercessória.`,
    club: 'ALL'
  },
  {
    id: 11,
    titulo: 'VII Campori UCB - Um Chamado de Coragem',
    ano: '2017',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O VII Campori de Desbravadores da União Central Brasileira (UCB) da Igreja Adventista do Sétimo Dia foi realizado em julho de 2017 sob o tema "Um Chamado de Coragem".

Local: Parque do Peão em Barretos, São Paulo.

Participantes: Reuniu mais de 22 mil desbravadores de todo o Estado de São Paulo.

Tema central: Inspirado no livro bíblico de Daniel, desafiou os desbravadores a serem fiéis a Deus em qualquer circunstância, demonstrando coragem moral e espiritual contra as pressões do mundo.

Atividades: Musical encenando a fornalha ardente e a cova dos leões, feira de colecionismo de trunfos, mega pista de obstáculos cívicos, projetos de saúde comunitária na cidade de Barretos e batismos.`,
    club: 'PATHFINDER'
  },
  {
    id: 12,
    titulo: 'IV Campori UNeB - Inabalável (Do Poço ao Palácio)',
    ano: '2017',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O IV Campori de Desbravadores da União Nordeste Brasileira (UNeB) da Igreja Adventista do Sétimo Dia foi realizado em 2017 sob o tema "Inabalável - Do Poço ao Palácio".

Local: Parnamirim, Rio Grande do Norte.

Participantes: Reuniu cerca de 18 mil desbravadores dos estados de PE, PB, RN, CE, PI e AL.

Tema central: A vida e fidelidade de José do Egito, ensinando que mesmo em momentos de provação, a integridade diante de Deus transforma a história humana.

Atividades: Simulações de resgate e nós avançados, apresentações culturais e folclóricas bíblicas, doação massiva de sangue e alimentos para comunidades carentes, batismos emocionantes e marcha cívica.`,
    club: 'PATHFINDER'
  },
  {
    id: 13,
    titulo: 'VI Campori USEB - Somos Mais que Ouro',
    ano: '2016',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O VI Campori de Desbravadores da União Sudeste Brasileira (USEB) da Igreja Adventista do Sétimo Dia foi realizado em 2016 sob o tema "Somos Mais que Ouro".

Local: Parque de Exposições de Lavras, Minas Gerais.

Participantes: Reuniu mais de 16 mil desbravadores dos estados de Minas Gerais, Rio de Janeiro e Espírito Santo.

Tema central: Em consonância com o ano olímpico no Brasil, o evento lembrou que a coroa da vida eterna oferecida por Jesus tem valor infinito, muito superior a qualquer ouro perecível da terra.

Atividades: Olimpíadas desbravadoras de habilidades de campo, feira de nós e amarras, corrida rústica, feira de saúde pública gratuita e grande celebração com batismos em massa.`,
    club: 'PATHFINDER'
  },
  {
    id: 14,
    titulo: 'V Campori USB - Fiel a Toda Prova',
    ano: '2015',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O V Campori de Desbravadores da União Sul Brasileira (USB) da Igreja Adventista do Sétimo Dia foi realizado em 2015 sob o tema "Fiel a Toda Prova".

Local: Balneário de Santa Helena, Paraná.

Participantes: Reuniu aproximadamente 15 mil desbravadores dos estados do Paraná, Santa Catarina e Rio Grande do Sul.

Tema central: O compromisso incondicional de permanecer fiel a Deus na escola, na família, na natureza e na sociedade sob qualquer prova da vida.

Atividades: Provas aquáticas de caiaque e balsa no lago, pista de orientação topográfica na mata, desfile de fanfarras, tenda de especialidades avançadas e investiduras de Guia Maior.`,
    club: 'PATHFINDER'
  },

  // --- AVENTURIS (CLUBE DE AVENTUREIROS) ---
  {
    id: 15,
    titulo: 'Aventuri DSA - Pequenos Gigantes',
    ano: '2024',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png',
    historia: `O Grande Aventuri Comemorativo dos Aventureiros da Divisão Sul-Americana (DSA) da Igreja Adventista do Sétimo Dia foi realizado em 2024 sob o tema "Pequenos Gigantes".

Local: Evento realizado em múltiplos polos integrados com grande celebração nas uniões da América do Sul.

Participantes: Reuniu mais de 50 mil crianças de 6 a 9 anos juntamente com seus pais, instrutores e conselheiros.

Tema central: Demonstrar que, através do amor e da dependência de Jesus, mesmo sendo pequeninas, as crianças são gigantes na fé, no testemunho, na oração e na bondade.

Atividades: Gincanas lúdicas de artes e natureza, circuito de nós simples para aventureiros, peças teatrais com fantoches bíblicos, oficinas familiares com pais e filhos e investiduras de estrelas de classe.`,
    club: 'ADVENTURER'
  },
  {
    id: 16,
    titulo: 'Aventuri UCB - Uma Incrível Aventura',
    ano: '2023',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png',
    historia: `O Aventuri da União Central Brasileira (UCB) da Igreja Adventista do Sétimo Dia foi realizado em outubro de 2023 sob o tema "Uma Incrível Aventura".

Local: Centro Adventista de Treinamento e Recreação (CATRE), São Paulo.

Participantes: Reuniu mais de 8 mil aventureiros, pais e conselheiros de todo o território paulista.

Tema central: A jornada mágica e real de viver diariamente ao lado de Jesus, aprendendo valores familiares, amor à criação e serviço ao próximo.

Atividades: Brincadeiras pedagógicas, feira de especialidades infantis (como Amigo da Natureza e Jardineiro), musical infantil interativo, momentos de oração entre pais e filhos e cerimônias de condecoração.`,
    club: 'ADVENTURER'
  },
  {
    id: 17,
    titulo: 'Aventuri USEB - Heróis de Verdade',
    ano: '2023',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png',
    historia: `O Aventuri da União Sudeste Brasileira (USEB) da Igreja Adventista do Sétimo Dia foi realizado em 2023 sob o tema "Heróis de Verdade".

Local: Parque de Exposições de Governador Valadares, Minas Gerais.

Participantes: Reuniu cerca de 7 mil aventureiros de Minas Gerais, Rio de Janeiro e Espírito Santo.

Tema central: Ensinar as crianças que os verdadeiros heróis não vestem capas mágicas, mas sim praticam a obediência, a honestidade e a coragem de seguir Jesus inspirados pelos grandes personagens bíblicos.

Atividades: Vila temática dos heróis da Bíblia (Davi, Ester, Moisés, Noé), circuito de recreação inflável, noite dos talentos e cantoria, entrega de medalhas de bravura cristã e celebração com os pais.`,
    club: 'ADVENTURER'
  },
  {
    id: 18,
    titulo: 'Aventuri UNB - Guardiões da Criação',
    ano: '2022',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png',
    historia: `O Aventuri da União Norte Brasileira (UNB) da Igreja Adventista do Sétimo Dia foi realizado em 2022 sob o tema "Guardiões da Criação".

Local: Belém, Pará.

Participantes: Reuniu mais de 6 mil crianças e familiares dos estados do Pará, Maranhão e Amapá.

Tema central: O dever cristão e alegre de cuidar das plantas, dos animais e das águas da Amazônia, reconhecendo Deus como o Artista e Criador Supremo.

Atividades: Trilha guiada de conscientização ecológica, oficinas de reciclagem lúdica, plantio de mudas nativas, gincanas aquáticas seguras e celebrações bíblicas.`,
    club: 'ADVENTURER'
  },
  {
    id: 19,
    titulo: 'Aventuri USB - Brilhando por Jesus',
    ano: '2021',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png',
    historia: `O Aventuri da União Sul Brasileira (USB) da Igreja Adventista do Sétimo Dia foi realizado em 2021 sob o tema "Brilhando por Jesus".

Local: Santa Catarina (com transmissão online e polos regionais integrados).

Participantes: Reuniu mais de 10 mil famílias de aventureiros do Paraná, Santa Catarina e Rio Grande do Sul.

Tema central: Motivar as crianças a serem uma luz reluzente no lar, na escola e na vizinhança através de palavras de carinho, orações e auxílio nas tarefas de casa.

Atividades: Desafios bíblicos em família, festival de vídeos com boas ações, caça ao tesouro das especialidades e cerimônia de investidura das quatro classes (Abelhitas, Luminares, Edificadores e Mãos Ajudadoras).`,
    club: 'ADVENTURER'
  },
  {
    id: 20,
    titulo: 'Aventuri UNeB - A Grande Viagem na Arca',
    ano: '2022',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png',
    historia: `O Aventuri da União Nordeste Brasileira (UNeB) da Igreja Adventista do Sétimo Dia foi realizado em 2022 sob o tema "A Grande Viagem na Arca".

Local: Caruaru, Pernambuco.

Participantes: Reuniu cerca de 6.500 aventureiros e líderes do Nordeste.

Tema central: A jornada de fé de Noé e sua família na arca, destacando a importância do amor familiar, da obediência aos pais e do refúgio seguro em Deus.

Atividades: Cenário gigante reproduzindo a Arca de Noé, desfile de fantasias dos animais bíblicos, jogos cooperativos sem eliminação, dinâmicas de louvor e investiduras.`,
    club: 'ADVENTURER'
  },
  {
    id: 21,
    titulo: 'Aventuri UCOB - Pequenos Missionários',
    ano: '2023',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png',
    historia: `O Aventuri da União Centro-Oeste Brasileira (UCOB) da Igreja Adventista do Sétimo Dia foi realizado em 2023 sob o tema "Pequenos Missionários".

Local: Brasília, Distrito Federal.

Participantes: Reuniu mais de 7 mil crianças e pais do DF, Goiás, Mato Grosso, Mato Grosso do Sul e Tocantins.

Tema central: O poder do testemunho infantil na evangelização de amiguinhos, vizinhos e parentes através do exemplo e da oração.

Atividades: Feira de missões mundiais infantis, oficina de cartas para missionários em outros países, gincana bíblica, circuito esportivo e culto de ação de graças.`,
    club: 'ADVENTURER'
  },
  {
    id: 22,
    titulo: 'Aventuri UNoB - Amigos da Natureza',
    ano: '2022',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png',
    historia: `O Aventuri da União Noroeste Brasileira (UNoB) da Igreja Adventista do Sétimo Dia foi realizado em 2022 sob o tema "Amigos da Natureza".

Local: Manaus, Amazonas.

Participantes: Reuniu mais de 5 mil aventureiros dos quatro estados da região noroeste.

Tema central: Conectar o coração das crianças aos encantos da criação divina, promovendo amizade e companheirismo fraternal.

Atividades: Trilha ecológica educativa, observação de pássaros, jogos de cooperação em equipe, teatro de fantoches e investidura das insígnias oficiais.`,
    club: 'ADVENTURER'
  }
];

// Helper para gerenciar IDs de trunfos excluídos
function getDeletedTrunfoIds(): Set<number> {
  try {
    const raw = localStorage.getItem('dbv_tudo_trunfos_deleted_ids');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr.map(Number));
      }
    }
  } catch {}
  return new Set<number>();
}

function recordDeletedTrunfoId(id: number) {
  try {
    const set = getDeletedTrunfoIds();
    set.add(Number(id));
    localStorage.setItem('dbv_tudo_trunfos_deleted_ids', JSON.stringify(Array.from(set)));
  } catch {}
}

function unrecordDeletedTrunfoId(id: number) {
  try {
    const set = getDeletedTrunfoIds();
    set.delete(Number(id));
    localStorage.setItem('dbv_tudo_trunfos_deleted_ids', JSON.stringify(Array.from(set)));
  } catch {}
}

// Helper para mesclar os padrões com dados locais/nuvem respeitando itens excluídos
function mergeWithDefaultTrunfos(loadedList: Trunfo[] | null, isSeeding = false): Trunfo[] {
  const deletedIds = getDeletedTrunfoIds();
  
  // Se recebemos uma lista concreta da nuvem ou do localStorage
  if (loadedList && Array.isArray(loadedList) && loadedList.length > 0) {
    return loadedList.filter(item => item && item.id && !deletedIds.has(Number(item.id)));
  }

  // Se a lista estiver vazia ou for inicialização pela primeira vez
  return DEFAULT_TRUNFOS.filter(item => !deletedIds.has(Number(item.id)));
}

export async function fetchTrunfos(club?: string): Promise<Trunfo[]> {
  try {
    const deletedIds = getDeletedTrunfoIds();
    const localData = localStorage.getItem('dbv_tudo_trunfos');
    let localList: Trunfo[] = [];

    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed)) {
          localList = parsed.filter(item => item && item.id && !deletedIds.has(Number(item.id)));
        }
      } catch {}
    }

    if (localList.length === 0 && !localStorage.getItem('dbv_tudo_trunfos_initialized')) {
      localList = DEFAULT_TRUNFOS.filter(item => !deletedIds.has(Number(item.id)));
      localStorage.setItem('dbv_tudo_trunfos_initialized', 'true');
      localStorage.setItem('dbv_tudo_trunfos', JSON.stringify(localList));
    }

    // 1. Tentar buscar da tabela 'Trunfos' do Supabase
    try {
      const query = supabase.from('Trunfos').select('*').order('id', { ascending: false });
      const { data, error } = await query;
      if (!error && data && Array.isArray(data)) {
        if (data.length > 0) {
          const validData = data.filter(item => item && item.id && !deletedIds.has(Number(item.id)));
          localStorage.setItem('dbv_tudo_trunfos', JSON.stringify(validData));
          localList = validData;
          if (club) {
            return localList.filter(t => !t.club || t.club === club || t.club === 'ALL');
          }
          return localList;
        }
      }
    } catch {}

    // 2. Buscar da tabela 'Cultura' (onde os trunfos ficam persistidos na coluna 'distintivos')
    try {
      const { data: culturaRows, error: cultError } = await supabase
        .from('Cultura')
        .select('club_type, distintivos');

      if (!cultError && culturaRows && culturaRows.length > 0) {
        let combinedTrunfos: Trunfo[] = [];
        const seenIds = new Set<number>();

        for (const row of culturaRows) {
          if (row.distintivos) {
            try {
              const parsed = typeof row.distintivos === 'string' ? JSON.parse(row.distintivos) : row.distintivos;
              if (Array.isArray(parsed)) {
                for (const item of parsed) {
                  if (item && item.id && !seenIds.has(Number(item.id)) && !deletedIds.has(Number(item.id))) {
                    seenIds.add(Number(item.id));
                    combinedTrunfos.push(item);
                  }
                }
              }
            } catch {}
          }
        }

        if (combinedTrunfos.length > 0) {
          localStorage.setItem('dbv_tudo_trunfos', JSON.stringify(combinedTrunfos));
          localList = combinedTrunfos;
        }
      }
    } catch {}

    localStorage.setItem('dbv_tudo_trunfos', JSON.stringify(localList));

    if (club) {
      return localList.filter(t => !t.club || t.club === club || t.club === 'ALL');
    }
    return localList;
  } catch {
    const deletedIds = getDeletedTrunfoIds();
    const localData = localStorage.getItem('dbv_tudo_trunfos');
    let localList: Trunfo[] = [];
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed)) {
          localList = parsed.filter(item => item && item.id && !deletedIds.has(Number(item.id)));
        }
      } catch {}
    }
    if (localList.length === 0) {
      localList = DEFAULT_TRUNFOS.filter(item => !deletedIds.has(Number(item.id)));
    }
    if (club) {
      return localList.filter(t => !t.club || t.club === club || t.club === 'ALL');
    }
    return localList;
  }
}

export async function updateTrunfo(trunfo: Partial<Trunfo>) {
  try {
    const deletedIds = getDeletedTrunfoIds();
    const localData = localStorage.getItem('dbv_tudo_trunfos');
    let currentList: Trunfo[] = [];

    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed)) {
          currentList = parsed.filter(item => item && item.id && !deletedIds.has(Number(item.id)));
        }
      } catch {}
    }

    if (currentList.length === 0) {
      currentList = DEFAULT_TRUNFOS.filter(item => !deletedIds.has(Number(item.id)));
    }

    let savedItem: Trunfo;
    if (trunfo.id && trunfo.id > 0) {
      unrecordDeletedTrunfoId(trunfo.id);
      currentList = currentList.map(item => item.id === trunfo.id ? { ...item, ...trunfo } as Trunfo : item);
      savedItem = currentList.find(item => item.id === trunfo.id)!;
    } else {
      const newId = Date.now();
      savedItem = {
        id: newId,
        titulo: trunfo.titulo || 'Novo Trunfo',
        ano: trunfo.ano || '',
        imagem: trunfo.imagem || '',
        historia: trunfo.historia || '',
        club: trunfo.club || 'PATHFINDER',
        created_at: new Date().toISOString()
      };
      currentList.unshift(savedItem);
    }
    localStorage.setItem('dbv_tudo_trunfos', JSON.stringify(currentList));

    // 1. Tentar salvar na tabela Trunfos se existir
    try {
      const payload: any = { 
        id: savedItem.id,
        titulo: savedItem.titulo,
        ano: savedItem.ano,
        imagem: savedItem.imagem,
        historia: savedItem.historia,
        club: savedItem.club
      };
      await supabase.from('Trunfos').upsert(payload);
    } catch {}

    // 2. Persistir na tabela Cultura (coluna distintivos) no banco Supabase
    try {
      const jsonStr = JSON.stringify(currentList);
      await Promise.all([
        supabase.from('Cultura').update({ distintivos: jsonStr }).eq('club_type', 'PATHFINDER'),
        supabase.from('Cultura').update({ distintivos: jsonStr }).eq('club_type', 'ADVENTURER')
      ]);
    } catch (e) {
      console.error("Erro ao salvar trunfos no banco Supabase:", e);
    }

    return { data: savedItem, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function deleteTrunfo(id: number) {
  try {
    const numId = Number(id);
    recordDeletedTrunfoId(numId);

    const localData = localStorage.getItem('dbv_tudo_trunfos');
    let filtered: Trunfo[] = [];
    if (localData) {
      try {
        const currentList: Trunfo[] = JSON.parse(localData);
        if (Array.isArray(currentList)) {
          filtered = currentList.filter(item => item && Number(item.id) !== numId);
        }
      } catch {}
    } else {
      filtered = DEFAULT_TRUNFOS.filter(item => Number(item.id) !== numId);
    }

    localStorage.setItem('dbv_tudo_trunfos', JSON.stringify(filtered));

    // 1. Tentar deletar da tabela Trunfos no Supabase
    try {
      await supabase.from('Trunfos').delete().eq('id', numId);
    } catch (e) {
      console.warn("Erro ao deletar da tabela Trunfos no Supabase:", e);
    }

    // 2. Atualizar tabela Cultura no banco Supabase
    try {
      const jsonStr = JSON.stringify(filtered);
      await Promise.all([
        supabase.from('Cultura').update({ distintivos: jsonStr }).eq('club_type', 'PATHFINDER'),
        supabase.from('Cultura').update({ distintivos: jsonStr }).eq('club_type', 'ADVENTURER')
      ]);
    } catch (e) {
      console.warn("Erro ao atualizar Cultura no Supabase:", e);
    }

    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

