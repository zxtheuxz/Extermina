/*
  # Update nutritional assessment schema

  1. Changes
    - Add new fields to avaliacao_nutricional table for detailed patient information
    - Add data validation for numeric fields
    - Add array fields for multiple values
    - Add boolean flags for yes/no questions

  2. New Fields
    - Personal Information:
      - data_nascimento (date)
      - estado_civil (text)
      - tem_filhos (boolean)
      - quantidade_filhos (integer)
    - Health Metrics:
      - peso_habitual (numeric)
      - variacao_peso_6meses (text)
    - Medical History:
      - doencas_cronicas (text[])
      - cirurgias_anteriores (text[])
      - medicamentos (text[])
      - historico_familiar_doencas (text[])
      - nivel_ansiedade (integer with check constraint)
    - Lifestyle:
      - horas_sono (numeric)
      - consumo_alcool (boolean)
      - frequencia_alcool (text)
      - fumante (boolean)
      - cigarros_por_dia (integer)
      - horas_trabalho (numeric)
    - Digestive Health:
      - intestino_regular (boolean)
      - frequencia_intestino (text)
      - problemas_digestivos (text[])
    - Diet History:
      - ja_fez_dieta (boolean)
      - dificuldades_dieta (text[])
      - diario_alimentar (text)
      - alimentos_aversao (text[])
      - alimentos_preferidos (text[])
    - Eating Habits:
      - consumo_refrigerante (boolean)
      - frequencia_refrigerante (text)
      - alimentacao_fim_semana (text)
      - come_frente_tv (boolean)
    - Health Indicators:
      - urina_normal (boolean)
      - urina_caracteristicas (text[])
      - intestino_diario (boolean)
*/

-- Adicionar novas colunas à tabela avaliacao_nutricional
ALTER TABLE avaliacao_nutricional
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS estado_civil text,
  ADD COLUMN IF NOT EXISTS tem_filhos boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS quantidade_filhos integer,
  ADD COLUMN IF NOT EXISTS peso_habitual numeric,
  ADD COLUMN IF NOT EXISTS variacao_peso_6meses text,
  ADD COLUMN IF NOT EXISTS doencas_cronicas text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cirurgias_anteriores text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS medicamentos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS historico_familiar_doencas text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS nivel_ansiedade integer CHECK (nivel_ansiedade >= 0 AND nivel_ansiedade <= 10),
  ADD COLUMN IF NOT EXISTS horas_sono numeric,
  ADD COLUMN IF NOT EXISTS consumo_alcool boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS frequencia_alcool text,
  ADD COLUMN IF NOT EXISTS fumante boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cigarros_por_dia integer,
  ADD COLUMN IF NOT EXISTS horas_trabalho numeric,
  ADD COLUMN IF NOT EXISTS intestino_regular boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS frequencia_intestino text,
  ADD COLUMN IF NOT EXISTS problemas_digestivos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ja_fez_dieta boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS dificuldades_dieta text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS diario_alimentar text,
  ADD COLUMN IF NOT EXISTS alimentos_aversao text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS alimentos_preferidos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS consumo_refrigerante boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS frequencia_refrigerante text,
  ADD COLUMN IF NOT EXISTS alimentacao_fim_semana text,
  ADD COLUMN IF NOT EXISTS come_frente_tv boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS urina_normal boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS urina_caracteristicas text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS intestino_diario boolean DEFAULT false;