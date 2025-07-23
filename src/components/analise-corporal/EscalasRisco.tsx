import React from 'react';
import { IndicesGrimaldi, obterValoresReferencia } from '../../utils/calculosGrimaldi';
import { AlertTriangle, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface EscalasRiscoProps {
  indices: IndicesGrimaldi;
  sexo: 'M' | 'F';
}

interface IndicadorRisco {
  nome: string;
  valor: number;
  valorFormatado: string;
  faixa: string;
  descricao: string;
  referencia: string;
  unidade: string;
  corFundo: string;
  corTexto: string;
  corBarra: string;
  icone: React.ReactNode;
  posicaoNaEscala: number; // 0-100 posição na barra
}

const EscalasRisco: React.FC<EscalasRiscoProps> = ({ indices, sexo }) => {
  const valoresRef = obterValoresReferencia(sexo);

  // Função para obter cor baseada na classificação
  const obterCoresClassificacao = (faixa: string) => {
    switch (faixa) {
      case 'BAIXO_RISCO':
      case 'ADEQUADO':
        return {
          corFundo: 'bg-green-50 dark:bg-green-900/20',
          corTexto: 'text-green-800 dark:text-green-200',
          corBarra: '#22C55E',
          icone: <CheckCircle className="h-5 w-5 text-green-600" />
        };
      case 'ATENCAO':
      case 'MODERADO':
        return {
          corFundo: 'bg-yellow-50 dark:bg-yellow-900/20',
          corTexto: 'text-yellow-800 dark:text-yellow-200',
          corBarra: '#F59E0B',
          icone: <AlertTriangle className="h-5 w-5 text-yellow-600" />
        };
      case 'ALTO_RISCO':
      case 'INADEQUADO':
        return {
          corFundo: 'bg-red-50 dark:bg-red-900/20',
          corTexto: 'text-red-800 dark:text-red-200',
          corBarra: '#EF4444',
          icone: <XCircle className="h-5 w-5 text-red-600" />
        };
      default:
        return {
          corFundo: 'bg-gray-50 dark:bg-gray-700',
          corTexto: 'text-gray-800 dark:text-gray-200',
          corBarra: '#6B7280',
          icone: <AlertCircle className="h-5 w-5 text-gray-600" />
        };
    }
  };

  // Função para calcular posição na escala baseada nos limites científicos (0-100)
  const calcularPosicaoEscala = (valor: number, tipo: string, sexo: 'M' | 'F'): number => {
    switch (tipo) {
      case 'cintura': {
        const limites = sexo === 'M' ? { baixo: 94, moderado: 102 } : { baixo: 80, moderado: 88 };
        if (valor < limites.baixo) {
          // Zona verde: 0-33% da barra
          return (valor / limites.baixo) * 33;
        } else if (valor < limites.moderado) {
          // Zona amarela: 33-66% da barra
          return 33 + ((valor - limites.baixo) / (limites.moderado - limites.baixo)) * 33;
        } else {
          // Zona vermelha: 66-100% da barra
          const maxEscala = limites.moderado * 1.5; // Estende escala para valores extremos
          return 66 + Math.min(((valor - limites.moderado) / (maxEscala - limites.moderado)) * 34, 34);
        }
      }
      
      case 'quadril': {
        const limites = sexo === 'M' ? 
          { atencao: 97.2, baixo: 104.8, moderado: 108.6 } : 
          { atencao: 92, baixo: 100, moderado: 108 };
        
        if (valor < limites.atencao) {
          // Zona amarela início: 0-25% da barra 
          return (valor / limites.atencao) * 25;
        } else if (valor < limites.baixo) {
          // Zona verde: 25-58% da barra
          return 25 + ((valor - limites.atencao) / (limites.baixo - limites.atencao)) * 33;
        } else if (valor < limites.moderado) {
          // Zona amarela fim: 58-75% da barra
          return 58 + ((valor - limites.baixo) / (limites.moderado - limites.baixo)) * 17;
        } else {
          // Zona vermelha: 75-100% da barra
          const maxEscala = limites.moderado * 1.3;
          return 75 + Math.min(((valor - limites.moderado) / (maxEscala - limites.moderado)) * 25, 25);
        }
      }
      
      case 'razaoCinturaQuadril': {
        const limite = sexo === 'M' ? 0.9 : 0.8;
        if (valor < limite) {
          // Zona verde: 0-50% da barra
          return (valor / limite) * 50;
        } else {
          // Zona vermelha: 50-100% da barra
          const maxEscala = limite * 1.5;
          return 50 + Math.min(((valor - limite) / (maxEscala - limite)) * 50, 50);
        }
      }
      
      case 'razaoCinturaEstatura': {
        if (valor < 0.5) {
          // Zona verde: 0-50% da barra
          return (valor / 0.5) * 50;
        } else if (valor <= 0.55) {
          // Zona amarela: 50-75% da barra
          return 50 + ((valor - 0.5) / (0.55 - 0.5)) * 25;
        } else {
          // Zona vermelha: 75-100% da barra
          return 75 + Math.min(((valor - 0.55) / (0.7 - 0.55)) * 25, 25);
        }
      }
      
      case 'indiceConicidade': {
        if (valor < 1.25) {
          // Zona verde: 0-70% da barra
          return (valor / 1.25) * 70;
        } else {
          // Zona vermelha: 70-100% da barra
          return 70 + Math.min(((valor - 1.25) / (1.8 - 1.25)) * 30, 30);
        }
      }
      
      case 'indiceMassaMagra': {
        const limite = sexo === 'M' ? 17.8 : 14.8;
        if (valor >= limite) {
          // Zona verde: 50-100% da barra (valores adequados)
          const maxEscala = limite * 1.5;
          return 50 + Math.min(((valor - limite) / (maxEscala - limite)) * 50, 50);
        } else {
          // Zona amarela: 0-50% da barra (valores baixos)
          return (valor / limite) * 50;
        }
      }
      
      case 'indiceMassaGorda': {
        if (valor < 4.4) {
          // Zona verde: 0-40% da barra
          return (valor / 4.4) * 40;
        } else if (valor < 7.0) {
          // Zona amarela: 40-70% da barra
          return 40 + ((valor - 4.4) / (7.0 - 4.4)) * 30;
        } else {
          // Zona vermelha: 70-100% da barra
          return 70 + Math.min(((valor - 7.0) / (12 - 7.0)) * 30, 30);
        }
      }
      
      default:
        return 50;
    }
  };

  // Preparar dados dos indicadores
  const indicadores: IndicadorRisco[] = [
    {
      nome: 'Circunferência da Cintura',
      valor: indices.cintura.valor,
      valorFormatado: `${indices.cintura.valor.toFixed(1)}`,
      faixa: indices.cintura.faixa,
      descricao: indices.cintura.descricao,
      referencia: `< ${sexo === 'M' ? '94' : '80'} cm (baixo risco)`,
      unidade: 'cm',
      posicaoNaEscala: calcularPosicaoEscala(indices.cintura.valor, 'cintura', sexo),
      ...obterCoresClassificacao(indices.cintura.faixa)
    },
    {
      nome: 'Circunferência do Quadril',
      valor: indices.quadril.valor,
      valorFormatado: `${indices.quadril.valor.toFixed(1)}`,
      faixa: indices.quadril.faixa,
      descricao: indices.quadril.descricao,
      referencia: `${sexo === 'M' ? '97-108' : '92-108'} cm (adequado)`,
      unidade: 'cm',
      posicaoNaEscala: calcularPosicaoEscala(indices.quadril.valor, 'quadril', sexo),
      ...obterCoresClassificacao(indices.quadril.faixa)
    },
    {
      nome: 'Razão Cintura/Quadril',
      valor: indices.razaoCinturaQuadril.valor,
      valorFormatado: indices.razaoCinturaQuadril.valor.toFixed(3),
      faixa: indices.razaoCinturaQuadril.faixa,
      descricao: indices.razaoCinturaQuadril.descricao,
      referencia: valoresRef.razaoCinturaQuadril,
      unidade: '',
      posicaoNaEscala: calcularPosicaoEscala(indices.razaoCinturaQuadril.valor, 'razaoCinturaQuadril', sexo),
      ...obterCoresClassificacao(indices.razaoCinturaQuadril.faixa)
    },
    {
      nome: 'Razão Cintura/Estatura',
      valor: indices.razaoCinturaEstatura.valor,
      valorFormatado: indices.razaoCinturaEstatura.valor.toFixed(3),
      faixa: indices.razaoCinturaEstatura.faixa,
      descricao: indices.razaoCinturaEstatura.descricao,
      referencia: valoresRef.razaoCinturaEstatura,
      unidade: '',
      posicaoNaEscala: calcularPosicaoEscala(indices.razaoCinturaEstatura.valor, 'razaoCinturaEstatura', sexo),
      ...obterCoresClassificacao(indices.razaoCinturaEstatura.faixa)
    },
    {
      nome: 'Índice de Conicidade',
      valor: indices.indiceConicidade.valor,
      valorFormatado: indices.indiceConicidade.valor.toFixed(3),
      faixa: indices.indiceConicidade.faixa,
      descricao: indices.indiceConicidade.descricao,
      referencia: valoresRef.indiceConicidade,
      unidade: '',
      posicaoNaEscala: calcularPosicaoEscala(indices.indiceConicidade.valor, 'indiceConicidade', sexo),
      ...obterCoresClassificacao(indices.indiceConicidade.faixa)
    },
    {
      nome: 'Índice de Massa Magra',
      valor: indices.indiceMassaMagra.valor,
      valorFormatado: `${indices.indiceMassaMagra.valor.toFixed(1)}`,
      faixa: indices.indiceMassaMagra.faixa,
      descricao: indices.indiceMassaMagra.descricao,
      referencia: valoresRef.indiceMassaMagra,
      unidade: 'kg/m²',
      posicaoNaEscala: calcularPosicaoEscala(indices.indiceMassaMagra.valor, 'indiceMassaMagra', sexo),
      ...obterCoresClassificacao(indices.indiceMassaMagra.faixa)
    },
    {
      nome: 'Índice de Massa Gorda',
      valor: indices.indiceMassaGorda.valor,
      valorFormatado: `${indices.indiceMassaGorda.valor.toFixed(1)}`,
      faixa: indices.indiceMassaGorda.faixa,
      descricao: indices.indiceMassaGorda.descricao,
      referencia: valoresRef.indiceMassaGorda,
      unidade: 'kg/m²',
      posicaoNaEscala: calcularPosicaoEscala(indices.indiceMassaGorda.valor, 'indiceMassaGorda', sexo),
      ...obterCoresClassificacao(indices.indiceMassaGorda.faixa)
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <h3 className="text-lg font-semibold flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Escalas de Risco Cardiometabólico
        </h3>
        <p className="text-sm text-purple-100 mt-1">
          Avaliação baseada em parâmetros científicos validados
        </p>
      </div>

      <div className="p-6 space-y-6">
        {indicadores.map((indicador, index) => (
          <div key={index} className={`p-4 rounded-lg border ${indicador.corFundo} border-gray-200 dark:border-gray-600`}>
            {/* Header do indicador */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {indicador.icone}
                <div>
                  <h4 className={`font-semibold ${indicador.corTexto}`}>
                    {indicador.nome}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Referência: {indicador.referencia}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${indicador.corTexto}`}>
                  {indicador.valorFormatado} {indicador.unidade}
                </div>
                <div className={`text-sm font-medium ${indicador.corTexto}`}>
                  {indicador.descricao}
                </div>
              </div>
            </div>

            {/* Barra de risco visual */}
            <div className="relative">
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 overflow-hidden">
                {/* Segmentos de risco na barra - proporções baseadas nos critérios científicos */}
                <div className="absolute inset-0 flex">
                  {(() => {
                    // Calcular proporções específicas para cada indicador
                    const getZoneWidths = (nomeIndicador: string, sexo: 'M' | 'F') => {
                      switch (nomeIndicador) {
                        case 'Circunferência da Cintura':
                          return { verde: '33%', amarela: '33%', vermelha: '34%' };
                        
                        case 'Circunferência do Quadril':
                          return { amarela1: '25%', verde: '33%', amarela2: '17%', vermelha: '25%' };
                        
                        case 'Razão Cintura/Quadril':
                          return { verde: '50%', vermelha: '50%' };
                        
                        case 'Razão Cintura/Estatura':
                          return { verde: '50%', amarela: '25%', vermelha: '25%' };
                        
                        case 'Índice de Conicidade':
                          return { verde: '70%', vermelha: '30%' };
                        
                        case 'Índice de Massa Magra':
                          return { amarela: '50%', verde: '50%' };
                        
                        case 'Índice de Massa Gorda':
                          return { verde: '40%', amarela: '30%', vermelha: '30%' };
                        
                        default:
                          return { verde: '33%', amarela: '33%', vermelha: '34%' };
                      }
                    };
                    
                    const zones = getZoneWidths(indicador.nome, sexo);
                    
                    // Renderizar zonas baseadas no tipo de indicador
                    if (indicador.nome === 'Circunferência do Quadril') {
                      return (
                        <>
                          <div className="bg-yellow-300 h-full" style={{ width: zones.amarela1 }} />
                          <div className="bg-green-400 h-full" style={{ width: zones.verde }} />
                          <div className="bg-yellow-400 h-full" style={{ width: zones.amarela2 }} />
                          <div className="bg-red-400 h-full" style={{ width: zones.vermelha }} />
                        </>
                      );
                    } else if (indicador.nome === 'Razão Cintura/Quadril' || indicador.nome === 'Índice de Conicidade') {
                      return (
                        <>
                          <div className="bg-green-400 h-full" style={{ width: zones.verde }} />
                          <div className="bg-red-400 h-full" style={{ width: zones.vermelha }} />
                        </>
                      );
                    } else if (indicador.nome === 'Índice de Massa Magra') {
                      return (
                        <>
                          <div className="bg-yellow-400 h-full" style={{ width: zones.amarela }} />
                          <div className="bg-green-400 h-full" style={{ width: zones.verde }} />
                        </>
                      );
                    } else {
                      return (
                        <>
                          <div className="bg-green-400 h-full" style={{ width: zones.verde }} />
                          <div className="bg-yellow-400 h-full" style={{ width: zones.amarela }} />
                          <div className="bg-red-400 h-full" style={{ width: zones.vermelha }} />
                        </>
                      );
                    }
                  })()}
                </div>
                
                {/* Marcador da posição atual */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-gray-800 dark:bg-white shadow-lg transition-all duration-500 z-10"
                  style={{ left: `${Math.min(Math.max(indicador.posicaoNaEscala, 1), 99)}%` }}
                />
                
                {/* Círculo indicador */}
                <div
                  className="absolute top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full border-3 border-gray-800 dark:border-white shadow-lg transition-all duration-500 z-20"
                  style={{ 
                    left: `${Math.min(Math.max(indicador.posicaoNaEscala, 1), 99)}%`,
                    backgroundColor: indicador.corBarra,
                    marginLeft: '-12px'
                  }}
                />
              </div>
              
              {/* Labels da escala - específicos para cada indicador */}
              <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                {(() => {
                  const getScaleLabels = (nomeIndicador: string, sexo: 'M' | 'F') => {
                    switch (nomeIndicador) {
                      case 'Circunferência da Cintura':
                        const limitesCintura = sexo === 'M' ? '<94cm' : '<80cm';
                        const moderadoCintura = sexo === 'M' ? '94-102cm' : '80-88cm';
                        const altoCintura = sexo === 'M' ? '>102cm' : '>88cm';
                        return [limitesCintura, moderadoCintura, altoCintura];
                      
                      case 'Circunferência do Quadril':
                        if (sexo === 'M') {
                          return ['<97cm', '97-105cm', '105-109cm', '>109cm'];
                        } else {
                          return ['<92cm', '92-100cm', '100-108cm', '>108cm'];
                        }
                      
                      case 'Razão Cintura/Quadril':
                        const limiteRCQ = sexo === 'M' ? '<0,9' : '<0,8';
                        const inadequadoRCQ = sexo === 'M' ? '≥0,9' : '≥0,8';
                        return [limiteRCQ, inadequadoRCQ];
                      
                      case 'Razão Cintura/Estatura':
                        return ['<0,5', '0,5-0,55', '>0,55'];
                      
                      case 'Índice de Conicidade':
                        return ['<1,25', '≥1,25'];
                      
                      case 'Índice de Massa Magra':
                        const limiteIMM = sexo === 'M' ? '<17,8' : '<14,8';
                        const adequadoIMM = sexo === 'M' ? '≥17,8' : '≥14,8';
                        return [limiteIMM, adequadoIMM];
                      
                      case 'Índice de Massa Gorda':
                        return ['<4,4', '4,4-7,0', '>7,0'];
                      
                      default:
                        return ['Baixo', 'Moderado', 'Alto'];
                    }
                  };
                  
                  const labels = getScaleLabels(indicador.nome, sexo);
                  
                  return labels.map((label, index) => (
                    <span key={index} className="text-center" style={{ 
                      flex: indicador.nome === 'Circunferência do Quadril' ? 
                        (index === 0 ? '0 0 25%' : 
                         index === 1 ? '0 0 33%' : 
                         index === 2 ? '0 0 17%' : '0 0 25%') :
                        `0 0 ${100/labels.length}%`
                    }}>
                      {label}
                    </span>
                  ));
                })()}
              </div>
            </div>

            {/* Explicação adicional */}
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {getExplicacaoIndicador(indicador.nome, indicador.faixa, sexo)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Resumo geral */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Grimaldi Score Geral
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Pontuação combinada de todos os indicadores
            </p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${
              indices.grimaldiScore >= 80 ? 'text-green-600' :
              indices.grimaldiScore >= 60 ? 'text-yellow-600' :
              indices.grimaldiScore >= 40 ? 'text-orange-600' :
              'text-red-600'
            }`}>
              {indices.grimaldiScore}/100
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {indices.grimaldiScore >= 80 ? 'Excelente' :
               indices.grimaldiScore >= 60 ? 'Bom' :
               indices.grimaldiScore >= 40 ? 'Regular' :
               'Necessita atenção'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Função para obter explicações específicas de cada indicador
const getExplicacaoIndicador = (nome: string, faixa: string, sexo: 'M' | 'F'): string => {
  switch (nome) {
    case 'Circunferência da Cintura':
      if (faixa === 'BAIXO_RISCO') {
        const limite = sexo === 'M' ? '94cm' : '80cm';
        return `Excelente! Sua medida está abaixo de ${limite}, indicando baixo risco para doenças cardiovasculares, diabetes tipo 2 e síndrome metabólica.`;
      } else if (faixa === 'MODERADO') {
        const faixa_valores = sexo === 'M' ? '94-102cm' : '80-88cm';
        return `Atenção: sua medida está na faixa de risco moderado (${faixa_valores}). Recomenda-se atividade física regular e alimentação equilibrada para redução da gordura abdominal.`;
      } else {
        const limite = sexo === 'M' ? '102cm' : '88cm';
        return `Alto risco: sua medida excede ${limite}, indicando risco elevado para complicações metabólicas. É necessário acompanhamento médico e mudanças significativas no estilo de vida.`;
      }
    
    case 'Circunferência do Quadril':
      if (faixa === 'ATENCAO') {
        const limite = sexo === 'M' ? '97cm' : '92cm';
        return `Atenção: sua medida está abaixo de ${limite}, o que pode indicar pouco desenvolvimento da musculatura dos glúteos e membros inferiores.`;
      } else if (faixa === 'BAIXO_RISCO') {
        const faixa_valores = sexo === 'M' ? '97-105cm' : '92-100cm';
        return `Adequado! Sua medida está na faixa ideal (${faixa_valores}), indicando bom desenvolvimento muscular dos membros inferiores.`;
      } else if (faixa === 'MODERADO') {
        const faixa_valores = sexo === 'M' ? '105-109cm' : '100-108cm';
        return `Moderado: sua medida está na faixa de atenção (${faixa_valores}). Pode indicar acúmulo de gordura na região pélvica.`;
      } else {
        const limite = sexo === 'M' ? '109cm' : '108cm';
        return `Alto risco: medida acima de ${limite} pode indicar excesso significativo de gordura corporal na região pélvica.`;
      }
    
    case 'Razão Cintura/Quadril':
      const limite_rcq = sexo === 'M' ? '0,9' : '0,8';
      return faixa === 'ADEQUADO'
        ? `Adequado! Sua razão está abaixo de ${limite_rcq}, indicando distribuição de gordura favorável com menor risco cardiometabólico. Formato corporal mais saudável com menos gordura visceral.`
        : `Inadequado: sua razão está acima de ${limite_rcq}, sugerindo distribuição de gordura desfavorável (tipo "maçã"). Há maior concentração de gordura abdominal, aumentando o risco de doenças cardiovasculares e diabetes.`;
    
    case 'Razão Cintura/Estatura':
      if (faixa === 'BAIXO_RISCO') {
        return 'Excelente! Razão abaixo de 0,5 indica baixíssimo risco cardiometabólico. Sua cintura é proporcional à sua altura, sugerindo distribuição saudável de gordura corporal.';
      } else if (faixa === 'MODERADO') {
        return 'Moderado: razão entre 0,5-0,55 indica risco moderado. Considere monitorar sua alimentação e incluir exercícios para reduzir a gordura abdominal.';
      } else {
        return 'Alto risco: razão acima de 0,55 está associada a risco significativamente elevado para doenças cardiovasculares, diabetes e síndrome metabólica. Intervenção urgente é recomendada.';
      }
    
    case 'Índice de Conicidade':
      return faixa === 'ADEQUADO'
        ? 'Adequado! Índice abaixo de 1,25 indica formato corporal saudável com distribuição de gordura favorável. Menor risco de complicações cardiovasculares.'
        : 'Inadequado: índice acima de 1,25 sugere formato corporal cônico (mais largo na cintura), indicando acúmulo de gordura abdominal e maior risco cardiometabólico.';
    
    case 'Índice de Massa Magra':
      const limite_imm = sexo === 'M' ? '17,8 kg/m²' : '14,8 kg/m²';
      return faixa === 'ADEQUADO'
        ? `Adequado! Sua massa muscular está acima de ${limite_imm}, o que é excelente para metabolismo, força, funcionalidade e prevenção de sarcopenia.`
        : `Baixo: massa muscular abaixo de ${limite_imm} pode comprometer metabolismo basal, força e capacidade funcional. Recomenda-se treinamento resistido e adequação proteica.`;
    
    case 'Índice de Massa Gorda':
      if (faixa === 'ADEQUADO') {
        return 'Adequado! Índice abaixo de 4,4 kg/m² indica percentual de gordura dentro da faixa saudável, com menor risco para doenças relacionadas ao excesso de gordura corporal.';
      } else if (faixa === 'MODERADO') {
        return 'Moderado: índice entre 4,4-7,0 kg/m² indica percentual de gordura moderadamente elevado. Monitoramento e intervenções podem ser benéficos.';
      } else {
        return 'Alto: índice acima de 7,0 kg/m² indica excesso significativo de gordura corporal, associado a maior risco de doenças metabólicas. Acompanhamento profissional é recomendado.';
      }
    
    default:
      return 'Indicador importante para avaliação do risco cardiometabólico geral baseado em evidências científicas.';
  }
};

export default EscalasRisco;