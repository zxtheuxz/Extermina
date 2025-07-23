export interface MedidasCorporais {
  pescoco: number;
  peito: number;
  cintura: number;
  quadril: number;
  bracos: number;
  antebracos: number;
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

export interface IndicesGrimaldi {
  razaoCinturaQuadril: ClassificacaoRisco;
  razaoCinturaEstatura: ClassificacaoRisco;
  indiceConicidade: ClassificacaoRisco;
  indiceMassaMagra: ClassificacaoRisco;
  indiceMassaGorda: ClassificacaoRisco;
  cintura: ClassificacaoRisco;
  quadril: ClassificacaoRisco;
  grimaldiScore: number;
}

export interface ResultadoGrimaldi {
  composicao: ComposicaoCorporal;
  indices: IndicesGrimaldi;
  medidas: MedidasCorporais;
  perfil: PerfilUsuario;
  dataAnalise: string;
}

/**
 * Classifica cintura baseado nas faixas científicas
 */
export const classificarCintura = (cintura: number, sexo: 'M' | 'F'): ClassificacaoRisco => {
  // Faixas baseadas em literatura científica
  const faixas = sexo === 'M' ? {
    baixoRisco: 94,
    moderado: 102
  } : {
    baixoRisco: 80,
    moderado: 88
  };

  if (cintura < faixas.baixoRisco) {
    return {
      valor: cintura,
      faixa: 'BAIXO_RISCO',
      descricao: 'Baixo risco'
    };
  } else if (cintura < faixas.moderado) {
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
 * Classifica quadril baseado nas faixas científicas
 */
export const classificarQuadril = (quadril: number, sexo: 'M' | 'F'): ClassificacaoRisco => {
  // Faixas baseadas em literatura científica
  const faixas = sexo === 'M' ? {
    atencao: 97.2,
    baixoRisco: 104.8,
    moderado: 108.6
  } : {
    atencao: 92,
    baixoRisco: 100,
    moderado: 108
  };

  if (quadril < faixas.atencao) {
    return {
      valor: quadril,
      faixa: 'ATENCAO',
      descricao: 'Atenção'
    };
  } else if (quadril < faixas.baixoRisco) {
    return {
      valor: quadril,
      faixa: 'BAIXO_RISCO',
      descricao: 'Baixo risco'
    };
  } else if (quadril < faixas.moderado) {
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
 * Classifica razão cintura/estatura baseado em evidências científicas
 */
export const classificarRazaoCinturaEstatura = (razao: number): ClassificacaoRisco => {
  // Baseado em literatura: < 0,5 é baixo risco, 0,5-0,55 é moderado
  if (razao < 0.5) {
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
 * Classifica razão cintura/quadril baseado em evidências científicas
 */
export const classificarRazaoCinturaQuadril = (razao: number, sexo: 'M' | 'F'): ClassificacaoRisco => {
  // Baseado nas faixas científicas da literatura
  const limite = sexo === 'M' ? 0.9 : 0.8;
  
  if (razao < limite) {
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
 * Classifica índice de conicidade baseado em evidências científicas
 */
export const classificarIndiceConicidade = (indice: number): ClassificacaoRisco => {
  // Baseado em literatura: < 1,25 é adequado, >= 1,25 é inadequado
  if (indice < 1.25) {
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
 * Classifica índice de massa magra baseado em evidências científicas
 */
export const classificarIndiceMassaMagra = (imm: number, sexo: 'M' | 'F'): ClassificacaoRisco => {
  // Baseado em literatura: > 17,8 kg/m² é adequado para homens
  const limite = sexo === 'M' ? 17.8 : 14.8;
  
  if (imm >= limite) {
    return {
      valor: imm,
      faixa: 'ADEQUADO',
      descricao: 'Adequado'
    };
  } else {
    return {
      valor: imm,
      faixa: 'BAIXO_RISCO',
      descricao: 'Baixo'
    };
  }
};

/**
 * Classifica índice de massa gorda baseado em evidências científicas
 */
export const classificarIndiceMassaGorda = (img: number): ClassificacaoRisco => {
  // Baseado em literatura: < 4,4 kg/m² é adequado
  if (img < 4.4) {
    return {
      valor: img,
      faixa: 'ADEQUADO',
      descricao: 'Adequado'
    };
  } else if (img < 7.0) {
    return {
      valor: img,
      faixa: 'MODERADO',
      descricao: 'Moderado'
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
 * Calcula Grimaldi Score baseado em todos os indicadores (0-100)
 */
export const calcularGrimaldiScore = (indices: Omit<IndicesGrimaldi, 'grimaldiScore'>): number => {
  let pontuacao = 0;
  let totalIndicadores = 6;

  // Cada indicador vale até ~16.67 pontos (100/6)
  const pontosPorIndicador = 100 / totalIndicadores;

  // Percentual de gordura (baseado na classificação de risco)
  if (indices.indiceMassaGorda.faixa === 'ADEQUADO') pontuacao += pontosPorIndicador;
  else if (indices.indiceMassaGorda.faixa === 'MODERADO') pontuacao += pontosPorIndicador * 0.6;
  else pontuacao += pontosPorIndicador * 0.2;

  // Índice de massa magra
  if (indices.indiceMassaMagra.faixa === 'ADEQUADO') pontuacao += pontosPorIndicador;
  else pontuacao += pontosPorIndicador * 0.3;

  // Razão cintura/quadril
  if (indices.razaoCinturaQuadril.faixa === 'ADEQUADO') pontuacao += pontosPorIndicador;
  else pontuacao += pontosPorIndicador * 0.2;

  // Razão cintura/estatura
  if (indices.razaoCinturaEstatura.faixa === 'BAIXO_RISCO') pontuacao += pontosPorIndicador;
  else if (indices.razaoCinturaEstatura.faixa === 'MODERADO') pontuacao += pontosPorIndicador * 0.6;
  else pontuacao += pontosPorIndicador * 0.2;

  // Índice de conicidade
  if (indices.indiceConicidade.faixa === 'ADEQUADO') pontuacao += pontosPorIndicador;
  else pontuacao += pontosPorIndicador * 0.3;

  // Cintura
  if (indices.cintura.faixa === 'BAIXO_RISCO') pontuacao += pontosPorIndicador;
  else if (indices.cintura.faixa === 'MODERADO') pontuacao += pontosPorIndicador * 0.6;
  else pontuacao += pontosPorIndicador * 0.2;

  return Math.round(Math.max(0, Math.min(100, pontuacao)));
};

/**
 * Calcula percentual de gordura melhorado baseado no método Grimaldi
 */
export const calcularPercentualGorduraGrimaldi = (medidas: MedidasCorporais, perfil: PerfilUsuario): number => {
  const { idade, sexo } = perfil;
  let percentualGordura: number;

  if (sexo === 'M') {
    // Fórmula Jackson & Pollock adaptada para homens - 7 dobras
    // Utilizando circunferências como proxy das dobras cutâneas
    const somaCircunferencias = 
      (medidas.peito * 0.8) + // Peito como proxy para dobra peitoral
      (medidas.cintura * 0.9) + // Cintura como proxy para dobra abdominal
      (medidas.coxas * 0.7) + // Coxa como proxy para dobra da coxa
      (medidas.bracos * 0.6) + // Braço como proxy para tríceps
      (medidas.antebracos * 0.5) + // Antebraço como proxy para subescapular
      (medidas.quadril * 0.8) + // Quadril como proxy para supra-ilíaca
      (medidas.panturrilhas * 0.4); // Panturrilha como proxy para axilar média

    const densidadeCorporal = 1.112 - 
      (0.00043499 * somaCircunferencias) + 
      (0.00000055 * Math.pow(somaCircunferencias, 2)) - 
      (0.00028826 * idade);
    
    percentualGordura = ((4.95 / densidadeCorporal) - 4.5) * 100;
    
  } else {
    // Fórmula Jackson, Pollock & Ward para mulheres - 7 dobras
    const somaCircunferencias = 
      (medidas.coxas * 0.8) + // Coxa
      (medidas.cintura * 0.9) + // Abdominal
      (medidas.bracos * 0.7) + // Tríceps
      (medidas.quadril * 0.8) + // Supra-ilíaca
      (medidas.peito * 0.6) + // Peito
      (medidas.antebracos * 0.5) + // Subescapular
      (medidas.panturrilhas * 0.4); // Axilar média

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
 * Realiza análise corporal completa no padrão Grimaldi
 */
export const analisarComposicaoGrimaldi = (
  medidas: MedidasCorporais,
  perfil: PerfilUsuario
): ResultadoGrimaldi => {
  
  const { altura, peso, sexo } = perfil;
  
  // Cálculos de composição corporal
  const percentualGordura = calcularPercentualGorduraGrimaldi(medidas, perfil);
  const massaGorda = (percentualGordura / 100) * peso;
  const massaMagra = peso - massaGorda;
  const tmb = 370 + (21.6 * massaMagra); // Cunningham equation
  const imc = peso / Math.pow(altura, 2);
  const aguaCorporal = massaMagra * 0.723; // 72.3% da massa magra
  const aguaCorporalPercentual = (aguaCorporal / peso) * 100;

  const composicao: ComposicaoCorporal = {
    percentualGordura: Number(percentualGordura.toFixed(1)),
    massaGorda: Number(massaGorda.toFixed(1)),
    massaMagra: Number(massaMagra.toFixed(1)),
    tmb: Number(tmb.toFixed(1)),
    imc: Number(imc.toFixed(1)),
    aguaCorporal: Number(aguaCorporal.toFixed(1)),
    aguaCorporalPercentual: Number(aguaCorporalPercentual.toFixed(1))
  };

  // Cálculos de índices e classificações
  const alturaCm = altura * 100;
  const razaoCinturaQuadril = medidas.cintura / medidas.quadril;
  const razaoCinturaEstatura = medidas.cintura / alturaCm;
  const indiceConicidade = (medidas.cintura / 100) / (2 * Math.sqrt(Math.PI * (medidas.quadril / 100)));
  const indiceMassaMagra = massaMagra / Math.pow(altura, 2);
  const indiceMassaGorda = massaGorda / Math.pow(altura, 2);

  // Classificações baseadas nas faixas científicas Grimaldi
  const indices: Omit<IndicesGrimaldi, 'grimaldiScore'> = {
    razaoCinturaQuadril: classificarRazaoCinturaQuadril(razaoCinturaQuadril, sexo),
    razaoCinturaEstatura: classificarRazaoCinturaEstatura(razaoCinturaEstatura),
    indiceConicidade: classificarIndiceConicidade(indiceConicidade),
    indiceMassaMagra: classificarIndiceMassaMagra(indiceMassaMagra, sexo),
    indiceMassaGorda: classificarIndiceMassaGorda(indiceMassaGorda),
    cintura: classificarCintura(medidas.cintura, sexo),
    quadril: classificarQuadril(medidas.quadril, sexo)
  };

  // Calcular Grimaldi Score
  const grimaldiScore = calcularGrimaldiScore(indices);

  const indicesCompletos: IndicesGrimaldi = {
    ...indices,
    grimaldiScore
  };

  return {
    composicao,
    indices: indicesCompletos,
    medidas,
    perfil,
    dataAnalise: new Date().toISOString()
  };
};

/**
 * Obtém valores de referência para a tabela de indicadores
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