/*
  # Atualização da tabela de avaliação nutricional

  1. Alterações
    - Adição de novos campos para avaliação nutricional mais detalhada
    - Campos para histórico de saúde
    - Campos para estilo de vida
    - Campos para hábitos alimentares

  2. Segurança
    - Mantém as políticas RLS existentes
*/

-- Adicionar novas colunas à tabela avaliacao_nutricional
ALTER TABLE avaliacao_nutricional
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS estado_civil text,
  ADD COLUMN IF NOT EXISTS tem_filhos boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS quantidade_filhos integer,
  ADD COLUMN IF NOT EXISTS peso_habitual numeric,
  ADD COLUMN IF NOT EXISTS variacao_peso_6meses text,
  ADD COLUMN IF NOT EXISTS doencas_cronicas text[],
  ADD COLUMN IF NOT EXISTS cirurgias_anteriores text[],
  ADD COLUMN IF NOT EXISTS medicamentos text[],
  ADD COLUMN IF NOT EXISTS historico_familiar_doencas text[],
  ADD COLUMN IF NOT EXISTS nivel_ansiedade integer CHECK (nivel_ansiedade >= 0 AND nivel_ansiedade <= 10),
  ADD COLUMN IF NOT EXISTS horas_sono numeric,
  ADD COLUMN IF NOT EXISTS consumo_alcool boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS frequencia_alcool text,
  ADD COLUMN IF NOT EXISTS fumante boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cigarros_por_dia integer,
  ADD COLUMN IF NOT EXISTS horas_trabalho numeric,
  ADD COLUMN IF NOT EXISTS intestino_regular boolean,
  ADD COLUMN IF NOT EXISTS frequencia_intestino text,
  ADD COLUMN IF NOT EXISTS problemas_digestivos text[],
  ADD COLUMN IF NOT EXISTS ja_fez_dieta boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS dificuldades_dieta text[],
  ADD COLUMN IF NOT EXISTS diario_alimentar text,
  ADD COLUMN IF NOT EXISTS alimentos_aversao text[],
  ADD COLUMN IF NOT EXISTS alimentos_preferidos text[],
  ADD COLUMN IF NOT EXISTS consumo_refrigerante boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS frequencia_refrigerante text,
  ADD COLUMN IF NOT EXISTS alimentacao_fim_semana text,
  ADD COLUMN IF NOT EXISTS come_frente_tv boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS urina_normal boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS urina_caracteristicas text[],
  ADD COLUMN IF NOT EXISTS intestino_diario boolean DEFAULT false;