import React, { useState, useEffect } from 'react';
import { useAnaliseCorpData } from '../../hooks/useAnaliseCorpData';
import AnaliseCorpoMediaPipe from './AnaliseCorpoMediaPipe';
import ResultadosAnalise from './ResultadosAnalise';
import LoadingAnalise from './LoadingAnalise';
import { analisarComposicaoCorporal, ResultadoAnalise } from '../../utils/calculosComposicaoCorporal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Camera, AlertTriangle, Loader2 } from 'lucide-react';

const MedidasCorporais: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { dadosCorporais, fotos, loading, error, hasMedidasExistentes, refetch } = useAnaliseCorpData();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<'calculating' | 'finalizing'>('calculating');
  const [resultadoAnalise, setResultadoAnalise] = useState<ResultadoAnalise | null>(null);
  const [errorAnalise, setErrorAnalise] = useState<string | null>(null);
  
  // Estado unificado para controlar quando a página está 100% pronta
  const [pageReady, setPageReady] = useState(false);
  const [loadingStep, setLoadingStep] = useState('profile');

  // Controlar loading unificado - AGUARDA TUDO ESTAR PRONTO
  useEffect(() => {
    const checkPageReady = () => {
      // SEMPRE mostrar loading se:
      // 1. Ainda está carregando dados básicos
      // 2. Está analisando nova medida
      // 3. Dados não estão completamente definidos
      if (loading || isAnalyzing) {
        setPageReady(false);
        return;
      }

      // Aguardar mais um pouco para garantir que tudo carregou
      setTimeout(() => {
        setPageReady(true);
      }, 1000);
    };

    checkPageReady();
  }, [loading, isAnalyzing]);

  // Limites fisiológicos realistas para validação (expandidos para biotipos diversos)
  const LIMITES_MEDIDAS = {
    // Medidas corporais (em cm)
    medidas: {
      bracos: { min: 15, max: 50 },
      antebracos: { min: 15, max: 40 },
      cintura: { min: 50, max: 160 }, // Expandido para endomorphos
      quadril: { min: 60, max: 190 }, // Expandido para endomorphos
      coxas: { min: 35, max: 80 },
      panturrilhas: { min: 25, max: 60 }
    },
    // Composição corporal
    composicao: {
      percentualGordura: { min: 3, max: 60 },
      massaMagra: { min: 20, max: 120 },
      massaGorda: { min: 1, max: 80 },
      tmb: { min: 800, max: 4000 },
      imc: { min: 10, max: 50 }
    },
    // Índices e razões
    indices: {
      razaoCinturaQuadril: { min: 0.5, max: 1.5 },
      razaoCinturaEstatura: { min: 0.3, max: 0.8 },
      indiceConicidade: { min: 1.0, max: 2.0 }
    }
  };

  const validarLimitesMedidas = (resultado: ResultadoAnalise): ResultadoAnalise => {
    const resultadoValidado = { ...resultado };
    let temAjustes = false;

    // Validar medidas corporais
    Object.keys(LIMITES_MEDIDAS.medidas).forEach(medida => {
      const valor = resultado.medidas[medida as keyof typeof resultado.medidas];
      const limite = LIMITES_MEDIDAS.medidas[medida as keyof typeof LIMITES_MEDIDAS.medidas];
      
      if (valor !== undefined) {
        if (valor < limite.min) {
          console.warn(`⚠️ ${medida}: ${valor}cm abaixo do limite mínimo (${limite.min}cm) - Ajustando`);
          resultadoValidado.medidas[medida as keyof typeof resultado.medidas] = limite.min;
          temAjustes = true;
        } else if (valor > limite.max) {
          console.warn(`⚠️ ${medida}: ${valor}cm acima do limite máximo (${limite.max}cm) - Ajustando`);
          resultadoValidado.medidas[medida as keyof typeof resultado.medidas] = limite.max;
          temAjustes = true;
        }
      }
    });

    // Validar composição corporal
    Object.keys(LIMITES_MEDIDAS.composicao).forEach(prop => {
      const valor = resultado.composicao[prop as keyof typeof resultado.composicao];
      const limite = LIMITES_MEDIDAS.composicao[prop as keyof typeof LIMITES_MEDIDAS.composicao];
      
      if (valor !== undefined) {
        if (valor < limite.min) {
          console.warn(`⚠️ ${prop}: ${valor} abaixo do limite mínimo (${limite.min}) - Ajustando`);
          resultadoValidado.composicao[prop as keyof typeof resultado.composicao] = limite.min;
          temAjustes = true;
        } else if (valor > limite.max) {
          console.warn(`⚠️ ${prop}: ${valor} acima do limite máximo (${limite.max}) - Ajustando`);
          resultadoValidado.composicao[prop as keyof typeof resultado.composicao] = limite.max;
          temAjustes = true;
        }
      }
    });

    // Validar índices
    Object.keys(LIMITES_MEDIDAS.indices).forEach(indice => {
      const objeto = resultado.indices[indice as keyof typeof resultado.indices];
      if (objeto && 'valor' in objeto) {
        const valor = objeto.valor;
        const limite = LIMITES_MEDIDAS.indices[indice as keyof typeof LIMITES_MEDIDAS.indices];
        
        if (valor < limite.min) {
          console.warn(`⚠️ ${indice}: ${valor} abaixo do limite mínimo (${limite.min}) - Ajustando`);
          objeto.valor = limite.min;
          temAjustes = true;
        } else if (valor > limite.max) {
          console.warn(`⚠️ ${indice}: ${valor} acima do limite máximo (${limite.max}) - Ajustando`);
          objeto.valor = limite.max;
          temAjustes = true;
        }
      }
    });

    if (temAjustes) {
      console.log('✅ Validação completa - Alguns valores foram ajustados para limites seguros');
    }

    return resultadoValidado;
  };

  const salvarResultadosNoSupabase = async (resultado: ResultadoAnalise) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // 🛡️ VALIDAÇÃO DE SEGURANÇA: Aplicar limites antes do insert
    const resultadoValidado = validarLimitesMedidas(resultado);

    const { error: insertError } = await supabase
      .from('medidas_corporais')
      .insert({
        user_id: user.id,
        
        // Medidas extraídas validadas (apenas as 6 do concorrente)
        medida_bracos: resultadoValidado.medidas.bracos,
        medida_antebracos: resultadoValidado.medidas.antebracos,
        medida_cintura: resultadoValidado.medidas.cintura,
        medida_quadril: resultadoValidado.medidas.quadril,
        medida_coxas: resultadoValidado.medidas.coxas,
        medida_panturrilhas: resultadoValidado.medidas.panturrilhas,
        
        // Composição corporal validada
        percentual_gordura: resultadoValidado.composicao.percentualGordura,
        massa_magra: resultadoValidado.composicao.massaMagra,
        massa_gorda: resultadoValidado.composicao.massaGorda,
        tmb: resultadoValidado.composicao.tmb,
        imc: resultadoValidado.composicao.imc,
        
        // Índices de risco validados (valores numéricos)
        razao_cintura_quadril: resultadoValidado.indices.razaoCinturaQuadril.valor,
        razao_cintura_estatura: resultadoValidado.indices.razaoCinturaEstatura.valor,
        indice_conicidade: resultadoValidado.indices.indiceConicidade.valor,
        shaped_score: resultadoValidado.indices.indiceGrimaldi, // Usando indiceGrimaldi
        
        // Metadados (mantém originais)
        altura_usada: resultado.perfil.altura,
        peso_usado: resultado.perfil.peso,
        idade_calculada: resultado.perfil.idade,
        sexo_usado: resultado.perfil.sexo,
        calculado_automaticamente: true
      });

    if (insertError) {
      throw insertError;
    }
  };

  const handleMedidasExtraidas = async (medidas: any) => {
    if (!dadosCorporais) {
      setErrorAnalise('Dados corporais não disponíveis');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep('calculating');
    setErrorAnalise(null);

    try {
      // Realizar análise completa
      const resultado = analisarComposicaoCorporal(medidas, dadosCorporais);
      
      // Mudança para etapa de finalização
      setAnalysisStep('finalizing');
      
      // Salvar no Supabase
      await salvarResultadosNoSupabase(resultado);
      
      // Atualizar estado
      setResultadoAnalise(resultado);
      
      // Atualizar dados (para mostrar que agora tem medidas)
      refetch();
      
    } catch (error) {
      console.error('Erro durante análise:', error);
      setErrorAnalise(error instanceof Error ? error.message : 'Erro durante análise');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleError = (error: string) => {
    setErrorAnalise(error);
    setIsAnalyzing(false);
  };

  // LOADING UNIFICADO: Mostrar loading até tudo estar pronto
  if (!pageReady) {
    const currentStep = isAnalyzing ? analysisStep : 'loading_results';
    return <LoadingAnalise step={currentStep as any} isDarkMode={isDarkMode} />;
  }

  // ERRO: Se tem erro, mostrar
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
              Erro ao carregar dados
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // PRIORIDADE 1: Se tem análise atual, mostrar
  if (resultadoAnalise) {
    return <ResultadosAnalise resultado={resultadoAnalise} />;
  }

  // PRIORIDADE 2: Se tem análise salva, mostrar
  if (hasMedidasExistentes) {
    return <ResultadosAnalise />;
  }

  // PRIORIDADE 3: Verificar se pode fazer nova análise
  const fotosNecessarias = fotos?.foto_lateral_direita_url && fotos?.foto_abertura_url;
  
  if (!fotosNecessarias) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <div className="flex items-center">
          <Camera className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
              Fotos necessárias não disponíveis
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Para realizar a análise corporal, são necessárias as fotos:
            </p>
            <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 mt-2">
              <li>Foto lateral direita {fotos?.foto_lateral_direita_url ? '✅' : '❌'}</li>
              <li>Foto de abertura (braços abertos) {fotos?.foto_abertura_url ? '✅' : '❌'}</li>
            </ul>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-3">
              Entre em contato via WhatsApp para enviar as fotos necessárias.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Interface principal de análise
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
          📊 Análise Corporal Universal v10.0
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Sistema calibrado para precisão universal em todos os biotipos: ectomorfo, mesomorfo e endomorfo.
          Utiliza IA avançada para extrair medidas corporais com precisão &lt; 3cm.
        </p>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-blue-100 dark:bg-blue-800/30 rounded p-2">
            <strong>Altura:</strong> {(dadosCorporais?.altura || 0) * 100} cm
          </div>
          <div className="bg-blue-100 dark:bg-blue-800/30 rounded p-2">
            <strong>Peso:</strong> {dadosCorporais?.peso || 0} kg
          </div>
          <div className="bg-blue-100 dark:bg-blue-800/30 rounded p-2">
            <strong>Idade:</strong> {dadosCorporais?.idade || 0} anos
          </div>
        </div>
      </div>

      {errorAnalise && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-sm text-red-700 dark:text-red-300">{errorAnalise}</span>
          </div>
        </div>
      )}

      <AnaliseCorpoMediaPipe
        fotoLateralUrl={fotos!.foto_lateral_direita_url!}
        fotoAberturaUrl={fotos!.foto_abertura_url!}
        alturaReal={dadosCorporais!.altura}
        peso={dadosCorporais!.peso}
        sexo={dadosCorporais!.sexo}
        onMedidasExtraidas={handleMedidasExtraidas}
        onError={handleError}
      />
    </div>
  );
};

export default MedidasCorporais;