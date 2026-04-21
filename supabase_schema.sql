-- ==============================================================================
-- SCHEMA COMPLETO DO SUPABASE - DBV TUDO
-- ==============================================================================

-- 1. Categorias
CREATE TABLE IF NOT EXISTS public."CategoriaEspecialidadeDBV" (
    id BIGSERIAL PRIMARY KEY,
    "Mestrado" TEXT,
    "Nome" TEXT,
    nome TEXT,
    "Titulo" TEXT,
    "Imagem" TEXT,
    imagem TEXT,
    "Icone" TEXT,
    "Cor" TEXT,
    cor TEXT,
    "Sigla" TEXT,
    sigla TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."CategoriaEspecialidadeAVT" (
    id BIGSERIAL PRIMARY KEY,
    "Mestrado" TEXT,
    "Nome" TEXT,
    nome TEXT,
    "Titulo" TEXT,
    "Imagem" TEXT,
    imagem TEXT,
    "Icone" TEXT,
    "Cor" TEXT,
    cor TEXT,
    "Sigla" TEXT,
    sigla TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Classes
CREATE TABLE IF NOT EXISTS public."ClasseDBV" (
    id BIGSERIAL PRIMARY KEY,
    titulo TEXT,
    "Titulo" TEXT,
    nome TEXT,
    "Nome" TEXT,
    classe TEXT,
    "Classe" TEXT,
    "Sigla" TEXT,
    sigla TEXT,
    imagem TEXT,
    "Imagem" TEXT,
    subtitulo TEXT,
    "Subtitulo" TEXT,
    cor TEXT,
    "Cor" TEXT,
    corpo TEXT,
    "Corpo" TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."ClasseAVT" (
    id BIGSERIAL PRIMARY KEY,
    titulo TEXT,
    "Titulo" TEXT,
    nome TEXT,
    "Nome" TEXT,
    classe TEXT,
    "Classe" TEXT,
    "Sigla" TEXT,
    sigla TEXT,
    imagem TEXT,
    "Imagem" TEXT,
    subtitulo TEXT,
    "Subtitulo" TEXT,
    cor TEXT,
    "Cor" TEXT,
    corpo TEXT,
    "Corpo" TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Especialidades
CREATE TABLE IF NOT EXISTS public."EspecialidadesDBV" (
    id BIGSERIAL PRIMARY KEY,
    "ID" BIGINT,
    "Nome" TEXT,
    "Categoria" TEXT,
    "Logo" TEXT,
    "Requisitos" JSONB DEFAULT '[]'::jsonb,
    "Sigla" TEXT,
    "Nivel" TEXT,
    "Ano" TEXT,
    "Origem" TEXT,
    "Codigo" TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."EspecialidadesAVT" (
    id BIGSERIAL PRIMARY KEY,
    "ID" BIGINT,
    "Nome" TEXT,
    "Categoria" TEXT,
    "Logo" TEXT,
    "Requisitos" JSONB DEFAULT '[]'::jsonb,
    "Sigla" TEXT,
    "Nivel" TEXT,
    "Ano" TEXT,
    "Origem" TEXT,
    "Codigo" TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Cultura e História
CREATE TABLE IF NOT EXISTS public."Cultura" (
    id BIGSERIAL PRIMARY KEY,
    club_type TEXT NOT NULL,
    ideais TEXT,
    voto TEXT,
    lei TEXT,
    alvo TEXT,
    lema TEXT,
    objetivo TEXT,
    voto_biblia TEXT,
    hino_letra TEXT,
    hino_video TEXT,
    historia_mundial TEXT,
    historia_mundial_img TEXT,
    historia_america_sul TEXT,
    historia_america_sul_img TEXT,
    historia_argentina TEXT,
    historia_argentina_img TEXT,
    historia_bolivia TEXT,
    historia_bolivia_img TEXT,
    historia_brasil TEXT,
    historia_brasil_img TEXT,
    historia_chile TEXT,
    historia_chile_img TEXT,
    historia_colombia TEXT,
    historia_colombia_img TEXT,
    historia_equador TEXT,
    historia_equador_img TEXT,
    historia_peru TEXT,
    historia_peru_img TEXT,
    historia_uruguai TEXT,
    historia_uruguai_img TEXT,
    uniformes_list JSONB DEFAULT '[]'::jsonb,
    emblemas_list JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Bíblia e Devocional
CREATE TABLE IF NOT EXISTS public."LivrosBiblia" (
    id BIGSERIAL PRIMARY KEY,
    book_name TEXT,
    book_abbrev TEXT,
    total_chapters INTEGER,
    testament TEXT
);

CREATE TABLE IF NOT EXISTS public."VersiculosBiblia" (
    id BIGSERIAL PRIMARY KEY,
    book_name TEXT,
    chapter TEXT,
    verse_number TEXT,
    text TEXT
);

CREATE TABLE IF NOT EXISTS public."DicionarioBiblico" (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT,
    texto TEXT,
    categoria TEXT,
    referencia TEXT
);

CREATE TABLE IF NOT EXISTS public."Devocionais" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    link TEXT,
    texto TEXT NOT NULL,
    agendado_para DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Livros e Manuais
CREATE TABLE IF NOT EXISTS public."LivroDasClasses" (
    id BIGSERIAL PRIMARY KEY,
    "Nome" TEXT,
    "Capa" TEXT,
    "Resumo" TEXT,
    "Conteudo" TEXT,
    "Classe" TEXT,
    "ClasseIMG" TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."LivroDoAno" (
    id BIGSERIAL PRIMARY KEY,
    "Nome" TEXT,
    "Capa" TEXT,
    "Resumo" TEXT,
    "Conteudo" TEXT,
    "Ano" TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."OutrosLivros" (
    id BIGSERIAL PRIMARY KEY,
    "Nome" TEXT,
    capa TEXT,
    "Resumo" TEXT,
    "Conteudo" TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."ManuaisDBV" (
    id BIGSERIAL PRIMARY KEY,
    "Nome" TEXT,
    "Capa" TEXT,
    "Descricao" TEXT,
    "Conteudo" TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."CampingDBV" (
    id BIGSERIAL PRIMARY KEY,
    "Nome" TEXT,
    "Capa" TEXT,
    "Conteudo" TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."LivrosAVT" (
    id BIGSERIAL PRIMARY KEY,
    "Nome" TEXT,
    "Capa" TEXT,
    "Resumo" TEXT,
    "Conteudo" TEXT,
    "Ano" TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."ManuaisAVT" (
    id BIGSERIAL PRIMARY KEY,
    "Nome" TEXT,
    "Capa" TEXT,
    "Descricao" TEXT,
    "Conteudo" TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."DesbravaMais" (
    id BIGSERIAL PRIMARY KEY,
    "Nome" TEXT,
    "Capa" TEXT,
    descricao TEXT,
    "Conteudo" TEXT,
    "PDF" TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."Formularios" (
    id BIGSERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    categoria TEXT,
    link TEXT,
    descricao TEXT,
    icone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Vídeos e Categorias
CREATE TABLE IF NOT EXISTS public."VideoCategories" (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    icone TEXT,
    club TEXT NOT NULL DEFAULT 'PATHFINDER'
);

CREATE TABLE IF NOT EXISTS public."VideosDBV" (
    id BIGSERIAL PRIMARY KEY,
    "Titulo" TEXT,
    titulo TEXT,
    canal TEXT,
    duracao TEXT,
    visualizacoes TEXT,
    link TEXT,
    categoria_id BIGINT,
    club TEXT DEFAULT 'PATHFINDER',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."AtividadesJogosDBV" (
    id BIGSERIAL PRIMARY KEY,
    "Titulo" TEXT,
    titulo TEXT,
    canal TEXT,
    duracao TEXT,
    visualizacoes TEXT,
    link TEXT,
    categoria_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."CerimoniasDBV" (
    id BIGSERIAL PRIMARY KEY,
    "Titulo" TEXT,
    titulo TEXT,
    canal TEXT,
    duracao TEXT,
    visualizacoes TEXT,
    link TEXT,
    categoria_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Conquistas e Links
CREATE TABLE IF NOT EXISTS public."Conquistas" (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    imagem_colorida TEXT,
    imagem_cinza TEXT,
    ordem INTEGER DEFAULT 0,
    shape TEXT DEFAULT 'RECTANGLE'
);

CREATE TABLE IF NOT EXISTS public."AppLinks" (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL
);

-- 9. Usuários e Perfis
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    foto TEXT,
    telefone TEXT,
    email TEXT,
    nome TEXT,
    "funçao" TEXT,
    clubes TEXT,
    clube_de TEXT,
    cidade TEXT,
    estado TEXT,
    "ADM" BOOLEAN DEFAULT false,
    fundo TEXT,
    clube TEXT,
    "Especialidades" TEXT
);

-- ==============================================================================
-- POLÍTICAS DE SEGURANÇA (RLS) - PERMISSÕES PÚBLICAS / LEITURA E GRAVAÇÃO
-- ==============================================================================

DO $$ 
DECLARE 
    t text;
    tables text[] := ARRAY[
        'CategoriaEspecialidadeDBV', 'CategoriaEspecialidadeAVT',
        'ClasseDBV', 'ClasseAVT',
        'EspecialidadesDBV', 'EspecialidadesAVT',
        'Cultura',
        'LivrosBiblia', 'VersiculosBiblia', 'DicionarioBiblico', 'Devocionais',
        'LivroDasClasses', 'LivroDoAno', 'OutrosLivros', 'ManuaisDBV', 'CampingDBV',
        'LivrosAVT', 'ManuaisAVT', 'DesbravaMais', 'Formularios',
        'VideoCategories', 'VideosDBV', 'AtividadesJogosDBV', 'CerimoniasDBV',
        'Conquistas', 'AppLinks', 'profiles'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Public Read Access" ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Public Full Access" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "Public Full Access" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t);
    END LOOP;
END $$;
