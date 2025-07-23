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
  shapedScore: number; // Score de 0-100 igual ao concorrente
}

export interface ResultadoAnalise {
  composicao: ComposicaoCorporal;
  indices: IndicesRisco;
  medidas: MedidasCorporais;
  perfil: PerfilUsuario;
}

/**
 * Classifica cintura baseado nas faixas científicas (igual ao concorrente)
 */
export const classificarCintura = (cintura: number, sexo: 'M' | 'F'): ClassificacaoRisco => {
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
 * Classifica quadril baseado nas faixas científicas (igual ao concorrente)
 */
export const classificarQuadril = (quadril: number, sexo: 'M' | 'F'): ClassificacaoRisco => {
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
 * Classifica razão cintura/estatura (igual ao concorrente)
 */
export const classificarRazaoCinturaEstatura = (razao: number): ClassificacaoRisco => {
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
 * Classifica razão cintura/quadril (igual ao concorrente)
 */
export const classificarRazaoCinturaQuadril = (razao: number, sexo: 'M' | 'F'): ClassificacaoRisco => {
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
 * Classifica índice de conicidade (igual ao concorrente)
 */
export const classificarIndiceConicidade = (indice: number): ClassificacaoRisco => {
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
 * Classifica índice de massa magra (igual ao concorrente)
 */
export const classificarIndiceMassaMagra = (imm: number, sexo: 'M' | 'F'): ClassificacaoRisco => {
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
 * Classifica índice de massa gorda (igual ao concorrente)
 */
export const classificarIndiceMassaGorda = (img: number): ClassificacaoRisco => {
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
 * Calcula percentual de gordura melhorado (igual ao concorrente)
 */
export const calcularPercentualGordura = (medidas: MedidasCorporais, perfil: PerfilUsuario): number => {
  const { idade, sexo } = perfil;
  let percentualGordura: number;

  if (sexo === 'M') {
    // Fórmula Jackson & Pollock adaptada para homens - usando as 6 circunferências
    const somaCircunferencias = 
      (medidas.bracos * 0.8) + // Braço como proxy para dobra peitoral
      (medidas.cintura * 0.9) + // Cintura como proxy para dobra abdominal
      (medidas.coxas * 0.7) + // Coxa como proxy para dobra da coxa
      (medidas.antebracos * 0.6) + // Antebraço como proxy para tríceps
      (medidas.quadril * 0.8) + // Quadril como proxy para supra-ilíaca
      (medidas.panturrilhas * 0.4); // Panturrilha como proxy para axilar média

    const densidadeCorporal = 1.112 - 
      (0.00043499 * somaCircunferencias) + 
      (0.00000055 * Math.pow(somaCircunferencias, 2)) - 
      (0.00028826 * idade);
    
    percentualGordura = ((4.95 / densidadeCorporal) - 4.5) * 100;
    
  } else {
    // Fórmula Jackson, Pollock & Ward para mulheres - usando as 6 circunferências
    const somaCircunferencias = 
      (medidas.coxas * 0.8) + // Coxa
      (medidas.cintura * 0.9) + // Abdominal
      (medidas.bracos * 0.7) + // Tríceps
      (medidas.quadril * 0.8) + // Supra-ilíaca
      (medidas.antebracos * 0.6) + // Peito
      (medidas.panturrilhas * 0.5); // Subescapular

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
  
  // TMB usando equação de Cunningham (mais precisa para pessoas ativas)
  const tmb = 370 + (21.6 * massaMagra);
  
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
 * Calcula Shaped Score baseado em todos os indicadores (0-100)
 */
export const calcularShapedScore = (indices: Omit<IndicesRisco, 'shapedScore'>): number => {
  let pontuacao = 0;
  let totalIndicadores = 6;

  // Cada indicador vale até ~16.67 pontos (100/6)
  const pontosPorIndicador = 100 / totalIndicadores;

  // Índice de massa gorda
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
  const indiceConicidade = (medidas.cintura / 100) / (2 * Math.sqrt(Math.PI * (medidas.quadril / 100)));
  const indiceMassaMagra = composicao.massaMagra / Math.pow(altura, 2);
  const indiceMassaGorda = composicao.massaGorda / Math.pow(altura, 2);

  // Classificações baseadas nas faixas científicas (igual ao concorrente)
  const indices: Omit<IndicesRisco, 'shapedScore'> = {
    razaoCinturaQuadril: classificarRazaoCinturaQuadril(razaoCinturaQuadril, sexo),
    razaoCinturaEstatura: classificarRazaoCinturaEstatura(razaoCinturaEstatura),
    indiceConicidade: classificarIndiceConicidade(indiceConicidade),
    indiceMassaMagra: classificarIndiceMassaMagra(indiceMassaMagra, sexo),
    indiceMassaGorda: classificarIndiceMassaGorda(indiceMassaGorda),
    cintura: classificarCintura(medidas.cintura, sexo),
    quadril: classificarQuadril(medidas.quadril, sexo)
  };

  // Calcular Shaped Score
  const shapedScore = calcularShapedScore(indices);

  return {
    ...indices,
    shapedScore
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
  shapedScore: string;
} => {
  const { composicao, indices, perfil } = resultado;
  
  // Interpretação do IMC
  let imcInterpretacao: string;
  if (composicao.imc < 18.5) imcInterpretacao = 'Baixo peso';
  else if (composicao.imc < 25) imcInterpretacao = 'Eutrofia';
  else if (composicao.imc < 30) imcInterpretacao = 'Sobrepeso';
  else imcInterpretacao = 'Obesidade';
  
  // Interpretação do percentual de gordura baseado no IMM (igual ao concorrente)
  const gorduraInterpretacao = indices.indiceMassaGorda.descricao === 'Alto' ? 'Alto risco' : 
                              indices.indiceMassaGorda.descricao === 'Moderado' ? 'Moderado' : 'Baixo risco';
  
  // Interpretação da massa magra
  const massaMagraInterpretacao = indices.indiceMassaMagra.descricao;
  
  // Interpretação do Shaped Score
  let shapedScoreInterpretacao: string;
  if (indices.shapedScore >= 80) shapedScoreInterpretacao = 'Excelente';
  else if (indices.shapedScore >= 60) shapedScoreInterpretacao = 'Bom';
  else if (indices.shapedScore >= 40) shapedScoreInterpretacao = 'Regular';
  else shapedScoreInterpretacao = 'Necessita atenção';
  
  return {
    imc: imcInterpretacao,
    percentualGordura: gorduraInterpretacao,
    massaMagra: massaMagraInterpretacao,
    shapedScore: shapedScoreInterpretacao
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