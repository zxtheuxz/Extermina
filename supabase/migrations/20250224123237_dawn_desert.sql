/*
  # Corrigir campos booleanos na tabela avaliacao_fisica

  1. Alterações
    - Modificar campos booleanos para usar valores true/false em vez de 'SIM'/'NÃO'
    - Adicionar restrições NOT NULL para campos obrigatórios
    - Atualizar tipos de dados para campos de texto

  2. Segurança
    - Mantém as políticas RLS existentes
*/

-- Alterar tipos de colunas para booleano
ALTER TABLE avaliacao_fisica
  ALTER COLUMN sente_dores TYPE boolean USING CASE 
    WHEN sente_dores = 'SIM' THEN true 
    WHEN sente_dores = 'NÃO' THEN false 
    ELSE null 
  END,
  ALTER COLUMN usa_medicamentos TYPE boolean USING CASE 
    WHEN usa_medicamentos = 'SIM' THEN true 
    WHEN usa_medicamentos = 'NÃO' THEN false 
    ELSE null 
  END,
  ALTER COLUMN doenca_impossibilita TYPE boolean USING CASE 
    WHEN doenca_impossibilita = 'SIM' THEN true 
    WHEN doenca_impossibilita = 'NÃO' THEN false 
    ELSE null 
  END,
  ALTER COLUMN tem_lesao TYPE boolean USING CASE 
    WHEN tem_lesao = 'SIM' THEN true 
    WHEN tem_lesao = 'NÃO' THEN false 
    ELSE null 
  END;