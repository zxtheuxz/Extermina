/*
  # Criação da tabela de compras e atualização do sistema de validação

  1. Nova Tabela
    - `compras`
      - `id` (uuid, chave primária)
      - `telefone` (text, não nulo)
      - `created_at` (timestamp com timezone)

  2. Segurança
    - Habilita RLS na tabela compras
    - Adiciona política para leitura apenas para validação
*/

CREATE TABLE IF NOT EXISTS compras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE compras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura para validação de telefone"
  ON compras
  FOR SELECT
  TO authenticated
  USING (true);