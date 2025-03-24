/*
  # Update nutritional assessment schema with new fields

  1. Changes
    - Add new fields for personal information
    - Add fields for health history
    - Add fields for lifestyle information
    - Add fields for eating habits
    - Update data types to match form requirements

  2. New Fields
    - Personal Information:
      - data_nascimento (date)
      - estado_civil (text)
      - tem_filhos (boolean)
      - quantidade_filhos (integer)
      - objetivo_consulta (text)
    - Health Metrics:
      - peso_habitual (numeric)
      - variacao_peso_6meses (text)
    - Medical History:
      - tem_doencas_cronicas (boolean)
      - doencas_cronicas (text[])
      - tem_cirurgias (boolean)
      - cirurgias_anteriores (text[])
      - tem_alergias (boolean)
      - alergias_intolerancias (text[])
      - usa_medicamentos (boolean)
      - medicamentos (text[])
      - tem_historico_familiar (boolean)
      - historico_familiar_doencas (text[])
      - nivel_ansiedade (integer)
    - Lifestyle:
      - nivel_atividade (text)
      - horas_sono (numeric)
      - horario_acordar (time)
      - consumo_alcool (boolean)
      - frequencia_alcool (text)
      - fumante (boolean)
      - cigarros_por_dia (integer)
      - horas_trabalho (numeric)
      - usa_suplementos (boolean)
      - suplementos (text[])
    - Digestive Health:
      - intestino_regular (boolean)
      - frequencia_intestino (text)
      - tem_problemas_digestivos (boolean)
      - problemas_digestivos (text[])
    - Diet History:
      - ja_fez_dieta (boolean)
      - dificuldades_dieta (text[])
      - diario_alimentar (text)
      - alimentos_aversao (text[])
      - alimentos_preferidos (text[])
      - consumo_refrigerante (boolean)
      - frequencia_refrigerante (text)
      - alimentacao_fim_semana (text)
      - come_frente_tv (boolean)
      - consumo_agua (numeric)
      - urina_normal (boolean)
      - urina_caracteristicas (text[])
      - intestino_diario (boolean)
*/

-- Adicionar novas colunas booleanas para controle de campos condicionais
ALTER TABLE avaliacao_nutricional
  ADD COLUMN IF NOT EXISTS tem_doencas_cronicas boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tem_cirurgias boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tem_alergias boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS usa_medicamentos boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tem_historico_familiar boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS usa_suplementos boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tem_problemas_digestivos boolean DEFAULT false;