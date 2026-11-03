-- ========================================================
-- SCHEMA DO BANCO DE DADOS SUPABASE (POSTGRESQL)
-- JOGO: APÓSTOLOS QUIZ BÍBLICO
-- ========================================================

-- 1. TABELA DE PERFIS DOS IRMÃOS E IRMÃS
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT DEFAULT 'male',
  title TEXT DEFAULT 'Irmão',
  email TEXT,
  photo_url TEXT,
  avatar_config JSONB,
  birth_date TEXT,
  age INTEGER,
  cep TEXT,
  street TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  church_name TEXT,
  ministry TEXT,
  is_vip BOOLEAN DEFAULT false,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE PROGRESSO E EVOLUÇÃO NO QUIZ (MÓDULOS 1 AO 27 E PONTUAÇÃO)
CREATE TABLE IF NOT EXISTS public.quiz_progress (
  user_id TEXT PRIMARY KEY,
  user_name TEXT,
  completed_modules JSONB DEFAULT '[]'::jsonb,
  score INTEGER DEFAULT 0,
  current_level TEXT DEFAULT 'basico',
  selected_module_id INTEGER DEFAULT 1,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE CONGREGAÇÕES E MINISTÉRIOS
CREATE TABLE IF NOT EXISTS public.churches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pastor_leader TEXT,
  ministries_count JSONB DEFAULT '{}'::jsonb,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilita segurança por nível de linha (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para o aplicativo (usando a anon key)
CREATE POLICY "Permitir leitura pública de perfis" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Permitir inserção e atualização de perfis" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir leitura pública de progresso" ON public.quiz_progress FOR SELECT USING (true);
CREATE POLICY "Permitir inserção e atualização de progresso" ON public.quiz_progress FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir leitura pública de congregações" ON public.churches FOR SELECT USING (true);
CREATE POLICY "Permitir inserção e atualização de congregações" ON public.churches FOR ALL USING (true) WITH CHECK (true);

-- Índices para alta velocidade de busca e ranking
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city, state);
CREATE INDEX IF NOT EXISTS idx_progress_score ON public.quiz_progress(score DESC);
