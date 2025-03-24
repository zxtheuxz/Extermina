/*
  # Criação da tabela de perfis

  1. Nova Tabela
    - `perfis`
      - `id` (uuid, chave primária)
      - `user_id` (uuid, referência para auth.users)
      - `nome_completo` (text)
      - `telefone` (text)
      - `sexo` (text)
      - `created_at` (timestamp com timezone)

  2. Segurança
    - Habilita RLS na tabela perfis
    - Adiciona políticas para:
      - Leitura: usuários podem ler apenas seu próprio perfil
      - Inserção: usuários podem criar seu próprio perfil
      - Atualização: usuários podem atualizar apenas seu próprio perfil
*/

CREATE TABLE IF NOT EXISTS perfis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  nome_completo text NOT NULL,
  telefone text,
  sexo text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ler seu próprio perfil"
  ON perfis
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON perfis
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON perfis
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);