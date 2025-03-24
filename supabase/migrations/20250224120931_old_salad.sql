/*
  # Adicionar suporte para upload de laudo médico

  1. Alterações
    - Adiciona coluna `laudo_medico_url` na tabela `avaliacao_fisica`
    - Adiciona política de storage para laudos médicos

  2. Segurança
    - Permite que usuários autenticados façam upload de arquivos
    - Restringe acesso aos arquivos apenas ao próprio usuário
*/

-- Adicionar coluna para URL do laudo médico
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'avaliacao_fisica' 
    AND column_name = 'laudo_medico_url'
  ) THEN
    ALTER TABLE avaliacao_fisica ADD COLUMN laudo_medico_url text;
  END IF;
END $$;

-- Criar bucket para laudos médicos se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('laudos', 'laudos', false)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload de laudos
CREATE POLICY "Usuários podem fazer upload de seus laudos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'laudos' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir leitura de laudos
CREATE POLICY "Usuários podem ler seus próprios laudos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'laudos' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir deleção de laudos
CREATE POLICY "Usuários podem deletar seus próprios laudos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'laudos' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);