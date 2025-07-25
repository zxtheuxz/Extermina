export interface MedidasCorporais {
  bracos: number;
  antebracos: number;
  cintura: number;
  quadril: number;
  coxas: number;
  panturrilhas: number;
}

export interface PerfilUsuario {
  altura: number; // em metros
  peso: number; // em kg
  idade: number;
  sexo: 'M' | 'F';
}

export interface ComposicaoCorporal {
  percentualGordura: number;
  massaGorda: number;
  massaMagra: number;
  tmb: number; // Taxa Metabólica Basal
  imc: number;
  aguaCorporal: number;
  aguaCorporalPercentual: number;
}

export interface ClassificacaoRisco {
  valor: number;
  faixa: 'BAIXO_RISCO' | 'ATENCAO' | 'MODERADO' | 'ALTO_RISCO' | 'ADEQUADO' | 'INADEQUADO';
  descricao: string;
}

export interface IndicesRisco {
  razaoCinturaQuadril: ClassificacaoRisco;
  razaoCinturaEstatura: ClassificacaoRisco;
  indiceConicidade: ClassificacaoRisco;
  indiceMassaMagra: ClassificacaoRisco;
  indiceMassaGorda: ClassificacaoRisco;
  cintura: ClassificacaoRisco;
  quadril: ClassificacaoRisco;
  indiceGrimaldi: number; // Índice Grimaldi de 0-100 (renomeado de shapedScore)
}

export interface ResultadoAnalise {
  composicao: ComposicaoCorporal;
  indices: IndicesRisco;
  medidas: MedidasCorporais;
  perfil: PerfilUsuario;
}

/**
 * Classifica percentual de gordura baseado nas faixas científicas padronizadas
 */
export const classificarPercentualGordura = (percentual: number): ClassificacaoRisco => {
  if (percentual <= 11.1) {
    return {
      valor: percentual,
      faixa: 'ATENCAO',
      descricao: 'Atenção'
    };
  } else if (percentual <= 18.2) {
    return {
      valor: percentual,
      faixa: 'BAIXO_RISCO',
      descricao: 'Baixo risco'
    };
  } else if (percentual <= 21.9) {
    return {
      valor: percentual,
      faixa: 'MODERADO',
      descricao: 'Moderado'
    };
  } else {
    return {
      valor: percentual,
      faixa: 'ALTO_RISCO',
      descricao: 'Alto risco'
    };
  }
};

/**
 * Classifica cintura baseado nas faixas científicas padronizadas (masculino apenas conforme documento)
 */
export const classificarCintura = (cintura: number, sexo: 'M' | 'F'): ClassificacaoRisco => {
  // Usando valores do documento de referência - masculino apenas
  const faixas = {
    baixoRisco: 94,
    moderado: 102
  };

  if (cintura <= faixas.baixoRisco) {
    return {
      valor: cintura,
      faixa: 'BAIXO_RISCO',
      descricao: 'Baixo risco'
    };
  } else if (cintura <= faixas.moderado) {
    return {
      valor: cintura,
      faixa: 'MODERADO',
      descricao: 'Moderado'
    };
  } else {
    return {
      valor: cintura,
      faixa: 'ALTO_RISCO',
      descricao: 'Alto risco'
    };
  }
};

/**
 * Classifica quadril baseado nas faixas científicas padronizadas (masculino apenas conforme documento)
 */
export const classificarQuadril = (quadril: number, sexo: 'M' | 'F'): ClassificacaoRisco => {
  // Usando valores do documento de referência - masculino apenas
  const faixas = {
    atencao: 97.2,
    baixoRisco: 104.8,
    moderado: 108.6
  };

  if (quadril <= faixas.atencao) {
    return {
      valor: quadril,
      faixa: 'ATENCAO',
      descricao: 'Atenção'
    };
  } else if (quadril <= faixas.baixoRisco) {
    return {
      valor: quadril,
      faixa: 'BAIXO_RISCO',
      descricao: 'Baixo risco'
    };
  } else if (quadril <= faixas.moderado) {
    return {
      valor: quadril,
      faixa: 'MODERADO',
      descricao: 'Moderado'
    };
  } else {
    return {
      valor: quadril,
      faixa: 'ALTO_RISCO',
      descricao: 'Alto risco'
    };
  }
};

/**
 * Classifica razão cintura/estatura baseado nas faixas padronizadas
 */
export const classificarRazaoCinturaEstatura = (razao: number): ClassificacaoRisco => {
  if (razao <= 0.5) {
    return {
      valor: razao,
      faixa: 'BAIXO_RISCO',
      descricao: 'Baixo risco'
    };
  } else if (razao <= 0.55) {
    return {
      valor: razao,
      faixa: 'MODERADO',
      descricao: 'Moderado'
    };
  } else {
    return {
      valor: razao,
      faixa: 'ALTO_RISCO',
      descricao: 'Alto risco'
    };
  }
};

/**
 * Classifica razão cintura/quadril baseado nas faixas padronizadas
 */
export const classificarRazaoCinturaQuadril = (razao: number, sexo: 'M' | 'F'): ClassificacaoRisco => {
  // Conforme documento: adequado ≤ 0,9 para ambos os sexos
  if (razao <= 0.9) {
    return {
      valor: razao,
      faixa: 'ADEQUADO',
      descricao: 'Adequado'
    };
  } else {
    return {
      valor: razao,
      faixa: 'INADEQUADO',
      descricao: 'Inadequado'
    };
  }
};

/**
 * Classifica índice de conicidade baseado nas faixas padronizadas
 */
export const classificarIndiceConicidade = (indice: number): ClassificacaoRisco => {
  if (indice <= 1.25) {
    return {
      valor: indice,
      faixa: 'ADEQUADO',
      descricao: 'Adequado'
    };
  } else {
    return {
      valor: indice,
      faixa: 'INADEQUADO',
      descricao: 'Inadequado'
    };
  }
};

/**
 * Classifica índice de massa magra baseado nas faixas padronizadas
 */
export const classificarIndiceMassaMagra = (imm: number, sexo: 'M' | 'F'): ClassificacaoRisco => {
  // Conforme documento: Baixo ≤ 17,8 | Adequado 17,8 - 22,3 | Alto > 22,3 kg/m²
  if (imm <= 17.8) {
    return {
      valor: imm,
      faixa: 'BAIXO_RISCO',
      descricao: 'Baixo'
    };
  } else if (imm <= 22.3) {
    return {
      valor: imm,
      faixa: 'ADEQUADO',
      descricao: 'Adequado'
    };
  } else {
    return {
      valor: imm,
      faixa: 'ALTO_RISCO',
      descricao: 'Alto'
    };
  }
};

/**
 * Classifica índice de massa gorda baseado nas faixas padronizadas
 */
export const classificarIndiceMassaGorda = (img: number): ClassificacaoRisco => {
  // Conforme documento: Baixo ≤ 2,2 | Adequado 2,2 - 4,4 | Alto > 4,4 kg/m²
  if (img <= 2.2) {
    return {
      valor: img,
      faixa: 'BAIXO_RISCO',
      descricao: 'Baixo'
    };
  } else if (img <= 4.4) {
    return {
      valor: img,
      faixa: 'ADEQUADO',
      descricao: 'Adequado'
    };
  } else {
    return {
      valor: img,
      faixa: 'ALTO_RISCO',
      descricao: 'Alto'
    };
  }
};

/**
 * Calcula percentual de gordura melhorado (igual ao concorrente)
 */
export const calcularPercentualGordura = (medidas: MedidasCorporais, perfil: PerfilUsuario): number => {
  const { idade, sexo } = perfil;
  let percentualGordura: number;

  if (sexo === 'M') {
    // Fórmula Jackson & Pollock adaptada para homens - ajustada para 20,8% vs 26,8%
    const somaCircunferencias = 
      (medidas.bracos * 0.50) + // Reduzido de 0.65 (-23%)
      (medidas.cintura * 0.58) + // Reduzido de 0.75 (-23%)
      (medidas.coxas * 0.42) + // Reduzido de 0.55 (-23%)
      (medidas.antebracos * 0.35) + // Reduzido de 0.45 (-23%)
      (medidas.quadril * 0.50) + // Reduzido de 0.65 (-23%)
      (medidas.panturrilhas * 0.23); // Reduzido de 0.3 (-23%)

    const densidadeCorporal = 1.112 - 
      (0.00043499 * somaCircunferencias) + 
      (0.00000055 * Math.pow(somaCircunferencias, 2)) - 
      (0.00028826 * idade);
    
    percentualGordura = ((4.95 / densidadeCorporal) - 4.5) * 100;
    
  } else {
    // Fórmula Jackson, Pollock & Ward para mulheres - ajustada para redução de 23%
    const somaCircunferencias = 
      (medidas.coxas * 0.50) + // Reduzido de 0.65 (-23%)
      (medidas.cintura * 0.58) + // Reduzido de 0.75 (-23%)
      (medidas.bracos * 0.42) + // Reduzido de 0.55 (-23%)
      (medidas.quadril * 0.50) + // Reduzido de 0.65 (-23%)
      (medidas.antebracos * 0.35) + // Reduzido de 0.45 (-23%)
      (medidas.panturrilhas * 0.27); // Reduzido de 0.35 (-23%)

    const densidadeCorporal = 1.097 - 
      (0.00046971 * somaCircunferencias) + 
      (0.00000056 * Math.pow(somaCircunferencias, 2)) - 
      (0.00012828 * idade);
    
    percentualGordura = ((4.95 / densidadeCorporal) - 4.5) * 100;
  }

  // Garantir que o resultado esteja dentro de faixas realistas
  return Math.max(3, Math.min(50, percentualGordura));
};

/**
 * Calcula a composição corporal completa
 */
export const calcularComposicaoCorporal = (
  medidas: MedidasCorporais, 
  perfil: PerfilUsuario
): ComposicaoCorporal => {
  const { altura, peso } = perfil;
  
  // Percentual de gordura
  const percentualGordura = calcularPercentualGordura(medidas, perfil);
  
  // Massas
  const massaGorda = (percentualGordura / 100) * peso;
  const massaMagra = peso - massaGorda;
  
  // TMB usando Harris-Benedict (alinhado com SHAPED)
  const tmb = perfil.sexo === 'M' 
    ? 88.362 + (13.397 * peso) + (4.799 * altura * 100) - (5.677 * perfil.idade)
    : 447.593 + (9.247 * peso) + (3.098 * altura * 100) - (4.330 * perfil.idade);
  
  // IMC
  const imc = peso / Math.pow(altura, 2);
  
  // Água corporal (72,3% da massa magra em mamíferos)
  const aguaCorporal = massaMagra * 0.723;
  const aguaCorporalPercentual = (aguaCorporal / peso) * 100;
  
  return {
    percentualGordura: Number(percentualGordura.toFixed(1)),
    massaGorda: Number(massaGorda.toFixed(1)),
    massaMagra: Number(massaMagra.toFixed(1)),
    tmb: Number(tmb.toFixed(0)),
    imc: Number(imc.toFixed(1)),
    aguaCorporal: Number(aguaCorporal.toFixed(1)),
    aguaCorporalPercentual: Number(aguaCorporalPercentual.toFixed(1))
  };
};

/**
 * Calcula Shaped Score baseado em todos os indicadores (0-100) - calibrado com SHAPED
 */
export const calcularShapedScore = (indices: Omit<IndicesRisco, 'indiceGrimaldi'>): number => {
  let pontuacao = 0;
  let totalIndicadores = 6;

  // Cada indicador vale até ~16.67 pontos (100/6)
  const pontosPorIndicador = 100 / totalIndicadores;

  // Índice de massa gorda - ainda mais rigoroso (reduzir 25 pontos)
  if (indices.indiceMassaGorda.faixa === 'ADEQUADO') pontuacao += pontosPorIndicador;
  else if (indices.indiceMassaGorda.faixa === 'MODERADO') pontuacao += pontosPorIndicador * 0.2; // mais rigoroso
  else pontuacao += pontosPorIndicador * 0.05; // mais rigoroso

  // Índice de massa magra - ainda mais rigoroso
  if (indices.indiceMassaMagra.faixa === 'ADEQUADO') pontuacao += pontosPorIndicador;
  else pontuacao += pontosPorIndicador * 0.1; // mais rigoroso

  // Razão cintura/quadril - ainda mais rigoroso
  if (indices.razaoCinturaQuadril.faixa === 'ADEQUADO') pontuacao += pontosPorIndicador;
  else pontuacao += pontosPorIndicador * 0.05; // mais rigoroso

  // Razão cintura/estatura - ainda mais rigoroso
  if (indices.razaoCinturaEstatura.faixa === 'BAIXO_RISCO') pontuacao += pontosPorIndicador;
  else if (indices.razaoCinturaEstatura.faixa === 'MODERADO') pontuacao += pontosPorIndicador * 0.2; // mais rigoroso
  else pontuacao += pontosPorIndicador * 0.05; // mais rigoroso

  // Índice de conicidade - ainda mais rigoroso
  if (indices.indiceConicidade.faixa === 'ADEQUADO') pontuacao += pontosPorIndicador;
  else pontuacao += pontosPorIndicador * 0.1; // mais rigoroso

  // Cintura - ainda mais rigoroso
  if (indices.cintura.faixa === 'BAIXO_RISCO') pontuacao += pontosPorIndicador;
  else if (indices.cintura.faixa === 'MODERADO') pontuacao += pontosPorIndicador * 0.2; // mais rigoroso
  else pontuacao += pontosPorIndicador * 0.05; // mais rigoroso

  return Math.round(Math.max(0, Math.min(100, pontuacao)));
};

/**
 * Calcula índices de risco cardiometabólico (igual ao concorrente)
 */
export const calcularIndicesRisco = (
  medidas: MedidasCorporais, 
  perfil: PerfilUsuario,
  composicao: ComposicaoCorporal
): IndicesRisco => {
  const { altura, sexo } = perfil;
  const alturaCm = altura * 100;
  
  // Cálculos de índices e classificações
  const razaoCinturaQuadril = medidas.cintura / medidas.quadril;
  const razaoCinturaEstatura = medidas.cintura / alturaCm;
  const indiceConicidade = (medidas.cintura / 100) / (0.109 * Math.sqrt((perfil.peso) / (altura)));
  const indiceMassaMagra = composicao.massaMagra / Math.pow(altura, 2);
  const indiceMassaGorda = composicao.massaGorda / Math.pow(altura, 2);

  // Classificações baseadas nas faixas científicas (igual ao concorrente)
  const indices: Omit<IndicesRisco, 'indiceGrimaldi'> = {
    razaoCinturaQuadril: classificarRazaoCinturaQuadril(razaoCinturaQuadril, sexo),
    razaoCinturaEstatura: classificarRazaoCinturaEstatura(razaoCinturaEstatura),
    indiceConicidade: classificarIndiceConicidade(indiceConicidade),
    indiceMassaMagra: classificarIndiceMassaMagra(indiceMassaMagra, sexo),
    indiceMassaGorda: classificarIndiceMassaGorda(indiceMassaGorda),
    cintura: classificarCintura(medidas.cintura, sexo),
    quadril: classificarQuadril(medidas.quadril, sexo)
  };

  // Calcular Shaped Score
  const indiceGrimaldi = calcularShapedScore(indices);

  return {
    ...indices,
    indiceGrimaldi
  };
};


/**
 * Função principal que realiza toda a análise corporal
 */
export const analisarComposicaoCorporal = (
  medidas: MedidasCorporais,
  perfil: PerfilUsuario
): ResultadoAnalise => {
  
  // Validar dados de entrada
  if (!medidas || !perfil) {
    throw new Error('Dados insuficientes para análise');
  }
  
  if (perfil.altura <= 0 || perfil.peso <= 0 || perfil.idade <= 0) {
    throw new Error('Dados do perfil inválidos');
  }
  
  // Verificar se todas as 6 medidas estão disponíveis (igual ao concorrente)
  const medidasEssenciais = ['bracos', 'antebracos', 'cintura', 'quadril', 'coxas', 'panturrilhas'];
  for (const medida of medidasEssenciais) {
    if (!medidas[medida as keyof MedidasCorporais] || medidas[medida as keyof MedidasCorporais] <= 0) {
      throw new Error(`Medida essencial ausente: ${medida}`);
    }
  }
  
  try {
    // Calcular composição corporal
    const composicao = calcularComposicaoCorporal(medidas, perfil);
    
    // Calcular índices de risco
    const indices = calcularIndicesRisco(medidas, perfil, composicao);
    
    return {
      composicao,
      indices,
      medidas,
      perfil
    };
    
  } catch (error) {
    console.error('Erro durante análise corporal:', error);
    throw new Error('Erro durante o cálculo da composição corporal');
  }
};

/**
 * Gera interpretações textuais dos resultados (igual ao concorrente)
 */
export const interpretarResultados = (resultado: ResultadoAnalise): {
  imc: string;
  percentualGordura: string;
  massaMagra: string;
  indiceGrimaldi: string;
} => {
  const { composicao, indices, perfil } = resultado;
  
  // Interpretação do IMC
  let imcInterpretacao: string;
  if (composicao.imc < 18.5) imcInterpretacao = 'Baixo peso';
  else if (composicao.imc < 25) imcInterpretacao = 'Eutrofia';
  else if (composicao.imc < 30) imcInterpretacao = 'Sobrepeso';
  else imcInterpretacao = 'Obesidade';
  
  // Interpretação do percentual de gordura baseado nas faixas científicas corretas
  let gorduraInterpretacao: string;
  if (composicao.percentualGordura <= 11.1) {
    gorduraInterpretacao = 'Atenção';
  } else if (composicao.percentualGordura <= 18.2) {
    gorduraInterpretacao = 'Baixo risco';
  } else if (composicao.percentualGordura <= 21.9) {
    gorduraInterpretacao = 'Moderado';
  } else {
    gorduraInterpretacao = 'Alto risco';
  }
  
  // Interpretação da massa magra
  const massaMagraInterpretacao = indices.indiceMassaMagra.descricao;
  
  // Interpretação do Shaped Score
  let indiceGrimaldiInterpretacao: string;
  if (indices.indiceGrimaldi >= 80) indiceGrimaldiInterpretacao = 'Excelente';
  else if (indices.indiceGrimaldi >= 60) indiceGrimaldiInterpretacao = 'Bom';
  else if (indices.indiceGrimaldi >= 40) indiceGrimaldiInterpretacao = 'Regular';
  else indiceGrimaldiInterpretacao = 'Necessita atenção';
  
  return {
    imc: imcInterpretacao,
    percentualGordura: gorduraInterpretacao,
    massaMagra: massaMagraInterpretacao,
    indiceGrimaldi: indiceGrimaldiInterpretacao
  };
};

/**
 * Obtém valores de referência para a tabela de indicadores (igual ao concorrente)
 */
export const obterValoresReferencia = (sexo: 'M' | 'F') => {
  return {
    indiceMassaGorda: '< 4,4 kg/m²',
    indiceMassaMagra: sexo === 'M' ? '> 17,8 kg/m²' : '> 14,8 kg/m²',
    razaoCinturaEstatura: '< 0,5',
    razaoCinturaQuadril: sexo === 'M' ? '< 0,9' : '< 0,8',
    indiceConicidade: '< 1,25'
  };
};