/*
  # Criar tabela de avaliação nutricional

  1. Nova Tabela
    - `avaliacao_nutricional`
      - `id` (uuid, primary key)
      - `user_id` (uuid, referência para auth.users)
      - `sexo` (text) - Para diferenciar formulários masculino/feminino
      - `peso` (numeric) - Peso atual em kg
      - `altura` (numeric) - Altura em metros
      - `idade` (integer) - Idade em anos
      - `nivel_atividade` (text) - Nível de atividade física
      - `objetivo` (text) - Objetivo (ganho, perda, manutenção)
      - `restricao_alimentar` (text[]) - Lista de restrições alimentares
      - `intolerancia_alimentar` (text[]) - Lista de intolerâncias
      - `suplementacao` (text[]) - Lista de suplementos em uso
      - `consumo_agua` (numeric) - Litros de água por dia
      - `horario_acordar` (time) - Horário que acorda
      - `horario_dormir` (time) - Horário que dorme
      - `qtd_refeicoes` (integer) - Quantidade de refeições por dia
      - `preferencia_alimentar` (text[]) - Preferências alimentares
      - `aversao_alimentar` (text[]) - Aversões alimentares
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilitar RLS
    - Políticas para CRUD apenas pelo próprio usuário
*/

CREATE TABLE IF NOT EXISTS avaliacao_nutricional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  sexo text NOT NULL,
  peso numeric NOT NULL,
  altura numeric NOT NULL,
  idade integer NOT NULL,
  nivel_atividade text NOT NULL,
  objetivo text NOT NULL,
  restricao_alimentar text[] DEFAULT '{}',
  intolerancia_alimentar text[] DEFAULT '{}',
  suplementacao text[] DEFAULT '{}',
  consumo_agua numeric NOT NULL,
  horario_acordar time NOT NULL,
  horario_dormir time NOT NULL,
  qtd_refeicoes integer NOT NULL,
  preferencia_alimentar text[] DEFAULT '{}',
  aversao_alimentar text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE avaliacao_nutricional ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Usuários podem ler sua própria avaliação nutricional"
  ON avaliacao_nutricional
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar sua própria avaliação nutricional"
  ON avaliacao_nutricional
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar sua própria avaliação nutricional"
  ON avaliacao_nutricional
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);