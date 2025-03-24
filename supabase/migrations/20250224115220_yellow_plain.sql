/*
  # Criar tabela de avaliação física

  1. Nova Tabela
    - `avaliacao_fisica`
      - `id` (uuid, primary key)
      - `user_id` (uuid, referência para auth.users)
      - `sexo` (text)
      - `idade` (text)
      - `objetivo` (text)
      - `tempo_inativo` (text)
      - `experiencia_musculacao` (text)
      - `disponibilidade_semanal` (text)
      - `nivel_experiencia` (text)
      - `sente_dores` (boolean)
      - `tem_laudo_medico` (boolean)
      - `usa_medicamentos` (boolean)
      - `doenca_pre_existente` (text)
      - `doenca_impossibilita` (boolean)
      - `tem_lesao` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS avaliacao_fisica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  sexo text NOT NULL,
  idade text NOT NULL,
  objetivo text NOT NULL,
  tempo_inativo text NOT NULL,
  experiencia_musculacao text NOT NULL,
  disponibilidade_semanal text NOT NULL,
  nivel_experiencia text NOT NULL,
  sente_dores boolean NOT NULL,
  tem_laudo_medico boolean,
  usa_medicamentos boolean NOT NULL,
  doenca_pre_existente text,
  doenca_impossibilita boolean NOT NULL,
  tem_lesao boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE avaliacao_fisica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ler sua própria avaliação física"
  ON avaliacao_fisica
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar sua própria avaliação física"
  ON avaliacao_fisica
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar sua própria avaliação física"
  ON avaliacao_fisica
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);