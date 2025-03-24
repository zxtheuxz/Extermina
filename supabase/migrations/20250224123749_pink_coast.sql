/*
  # Corrigir campos booleanos na tabela avaliacao_fisica

  1. Alterações
    - Adicionar colunas booleanas temporárias
    - Copiar dados convertidos para as novas colunas
    - Remover colunas antigas
    - Renomear colunas temporárias

  2. Segurança
    - Mantém as políticas RLS existentes
*/

-- Adicionar colunas booleanas temporárias
ALTER TABLE avaliacao_fisica
  ADD COLUMN sente_dores_new boolean DEFAULT false,
  ADD COLUMN usa_medicamentos_new boolean DEFAULT false,
  ADD COLUMN doenca_impossibilita_new boolean DEFAULT false,
  ADD COLUMN tem_lesao_new boolean DEFAULT false;

-- Remover colunas antigas e renomear as novas
ALTER TABLE avaliacao_fisica
  DROP COLUMN IF EXISTS sente_dores,
  DROP COLUMN IF EXISTS usa_medicamentos,
  DROP COLUMN IF EXISTS doenca_impossibilita,
  DROP COLUMN IF EXISTS tem_lesao;

ALTER TABLE avaliacao_fisica
  RENAME COLUMN sente_dores_new TO sente_dores;

ALTER TABLE avaliacao_fisica
  RENAME COLUMN usa_medicamentos_new TO usa_medicamentos;

ALTER TABLE avaliacao_fisica
  RENAME COLUMN doenca_impossibilita_new TO doenca_impossibilita;

ALTER TABLE avaliacao_fisica
  RENAME COLUMN tem_lesao_new TO tem_lesao;

-- Definir as colunas como NOT NULL
ALTER TABLE avaliacao_fisica
  ALTER COLUMN sente_dores SET NOT NULL,
  ALTER COLUMN usa_medicamentos SET NOT NULL,
  ALTER COLUMN doenca_impossibilita SET NOT NULL,
  ALTER COLUMN tem_lesao SET NOT NULL;