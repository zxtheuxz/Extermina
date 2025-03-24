/*
  # Atualização da política de acesso à tabela de compras

  1. Alterações
    - Remove a política anterior
    - Cria nova política permitindo acesso público para leitura
    
  2. Segurança
    - Permite leitura pública para validação de telefones
    - Mantém RLS ativado para controle de acesso
*/

DROP POLICY IF EXISTS "Permitir leitura para validação de telefone" ON compras;

CREATE POLICY "Permitir leitura pública para validação de telefone"
  ON compras
  FOR SELECT
  TO public
  USING (true);