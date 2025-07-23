import React, { useState } from 'react';
import { useAnaliseCorpData } from '../../hooks/useAnaliseCorpData';
import AnaliseCorpoMediaPipe from './AnaliseCorpoMediaPipe';
import ResultadosAnalise from './ResultadosAnalise';
import { analisarComposicaoCorporal, ResultadoAnalise } from '../../utils/calculosComposicaoCorporal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Camera, AlertTriangle, Loader2 } from 'lucide-react';

const MedidasCorporais: React.FC = () => {
  const { user } = useAuth();
  const { dadosCorporais, fotos, loading, error, hasMedidasExistentes, refetch } = useAnaliseCorpData();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultadoAnalise, setResultadoAnalise] = useState<ResultadoAnalise | null>(null);
  const [errorAnalise, setErrorAnalise] = useState<string | null>(null);

  const salvarResultadosNoSupabase = async (resultado: ResultadoAnalise) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const { error: insertError } = await supabase
      .from('medidas_corporais')
      .insert({
        user_id: user.id,
        
        // Medidas extraídas (apenas as 6 do concorrente)
        medida_bracos: resultado.medidas.bracos,
        medida_antebracos: resultado.medidas.antebracos,
        medida_cintura: resultado.medidas.cintura,
        medida_quadril: resultado.medidas.quadril,
        medida_coxas: resultado.medidas.coxas,
        medida_panturrilhas: resultado.medidas.panturrilhas,
        
        // Composição corporal
        percentual_gordura: resultado.composicao.percentualGordura,
        massa_magra: resultado.composicao.massaMagra,
        massa_gorda: resultado.composicao.massaGorda,
        tmb: resultado.composicao.tmb,
        imc: resultado.composicao.imc,
        
        // Índices de risco (valores numéricos)
        razao_cintura_quadril: resultado.indices.razaoCinturaQuadril.valor,
        razao_cintura_estatura: resultado.indices.razaoCinturaEstatura.valor,
        indice_conicidade: resultado.indices.indiceConicidade.valor,
        shaped_score: resultado.indices.shapedScore,
        
        // Metadados
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
    setErrorAnalise(null);

    try {
      // Realizar análise completa
      const resultado = analisarComposicaoCorporal(medidas, dadosCorporais);
      
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          <span className="text-gray-600 dark:text-gray-400">
            Carregando dados para análise...
          </span>
        </div>
      </div>
    );
  }

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

  // Verificar se tem as fotos necessárias
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

  // Se já tem análise salva e não está fazendo nova análise, mostrar resultados
  if (hasMedidasExistentes && !isAnalyzing && !resultadoAnalise) {
    return <ResultadosAnalise />;
  }

  // Se tem resultado da análise atual, mostrar
  if (resultadoAnalise) {
    return <ResultadosAnalise resultado={resultadoAnalise} />;
  }

  // Interface principal de análise
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
          📊 Análise Corporal Automatizada
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Utilize inteligência artificial para extrair medidas corporais das suas fotos e calcular 
          composição corporal com base em fórmulas científicas validadas.
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
        onMedidasExtraidas={handleMedidasExtraidas}
        onError={handleError}
      />
    </div>
  );
};

export default MedidasCorporais;