import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  ResultadoAnalise, 
  interpretarResultados, 
  classificarPercentualGordura,
  classificarIndiceMassaMagra,
  classificarIndiceMassaGorda,
  classificarRazaoCinturaQuadril,
  classificarRazaoCinturaEstatura,
  classificarIndiceConicidade
} from '../../utils/calculosComposicaoCorporal';
import { Activity, TrendingUp, Scale, Zap, AlertCircle, Calendar, Target, Heart, Ruler } from 'lucide-react';
import EscalaRisco from './EscalaRisco';
import GraficoPizzaComposicao from './GraficoPizzaComposicao';
import AvatarMedidas from './AvatarMedidas';
import LoadingAnalise from './LoadingAnalise';

interface ResultadosAnaliseProps {
  resultado?: ResultadoAnalise | null;
}

interface MedidaSalva {
  id: string;
  medida_bracos: number;
  medida_antebracos: number;
  medida_cintura: number;
  medida_quadril: number;
  medida_coxas: number;
  medida_panturrilhas: number;
  percentual_gordura: number;
  massa_magra: number;
  massa_gorda: number;
  tmb: number;
  imc: number;
  razao_cintura_quadril: number;
  razao_cintura_estatura: number;
  indice_conicidade: number;
  shaped_score: number;
  altura_usada: number;
  peso_usado: number;
  idade_calculada: number;
  sexo_usado: string;
  created_at: string;
}


const ResultadosAnalise: React.FC<ResultadosAnaliseProps> = ({ resultado }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [medidaSalva, setMedidaSalva] = useState<MedidaSalva | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!resultado && user?.id) {
      buscarUltimaMedida();
    }
  }, [resultado, user?.id]);

  const buscarUltimaMedida = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medidas_corporais')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Erro ao buscar medida:', error);
        return;
      }

      setMedidaSalva(data);
    } catch (error) {
      console.error('Erro ao buscar medida:', error);
    } finally {
      setLoading(false);
    }
  };


  // Loading agora é controlado pelo componente pai MedidasCorporais
  // if (loading) {
  //   return <LoadingAnalise step="loading_results" isDarkMode={isDarkMode} />;
  // }

  const dados = resultado || (medidaSalva ? {
    composicao: {
      percentualGordura: medidaSalva.percentual_gordura || 0,
      massaGorda: medidaSalva.massa_gorda || 0,
      massaMagra: medidaSalva.massa_magra || 0,
      tmb: medidaSalva.tmb || 0,
      imc: medidaSalva.imc || 0,
      aguaCorporal: (medidaSalva.massa_magra || 0) * 0.723,
      aguaCorporalPercentual: medidaSalva.peso_usado > 0 ? ((medidaSalva.massa_magra || 0) * 0.723 / medidaSalva.peso_usado) * 100 : 0
    },
    indices: {
      indiceGrimaldi: medidaSalva.shaped_score || 0, // Renomeado de shapedScore para indiceGrimaldi
      // Recalcular classificações baseado nos valores salvos com validações
      razaoCinturaQuadril: { valor: medidaSalva.razao_cintura_quadril || 0, faixa: 'ADEQUADO', descricao: 'Adequado' },
      razaoCinturaEstatura: { valor: medidaSalva.razao_cintura_estatura || 0, faixa: 'BAIXO_RISCO', descricao: 'Baixo risco' },
      indiceConicidade: { valor: medidaSalva.indice_conicidade || 0, faixa: 'ADEQUADO', descricao: 'Adequado' },
      indiceMassaMagra: { 
        valor: medidaSalva.altura_usada > 0 ? (medidaSalva.massa_magra || 0) / Math.pow(medidaSalva.altura_usada, 2) : 0, 
        faixa: 'ADEQUADO', 
        descricao: 'Adequado' 
      },
      indiceMassaGorda: { 
        valor: medidaSalva.altura_usada > 0 ? (medidaSalva.massa_gorda || 0) / Math.pow(medidaSalva.altura_usada, 2) : 0, 
        faixa: 'ADEQUADO', 
        descricao: 'Adequado' 
      },
      cintura: { valor: medidaSalva.medida_cintura || 0, faixa: 'BAIXO_RISCO', descricao: 'Baixo risco' },
      quadril: { valor: medidaSalva.medida_quadril || 0, faixa: 'BAIXO_RISCO', descricao: 'Baixo risco' }
    },
    medidas: {
      bracos: medidaSalva.medida_bracos || 0,
      antebracos: medidaSalva.medida_antebracos || 0,
      cintura: medidaSalva.medida_cintura || 0,
      quadril: medidaSalva.medida_quadril || 0,
      coxas: medidaSalva.medida_coxas || 0,
      panturrilhas: medidaSalva.medida_panturrilhas || 0
    },
    perfil: {
      altura: medidaSalva.altura_usada || 0,
      peso: medidaSalva.peso_usado || 0,
      idade: medidaSalva.idade_calculada || 0,
      sexo: (medidaSalva.sexo_usado || 'M') as 'M' | 'F'
    }
  } : null);

  // Debug temporário
  console.log('🔍 Debug ResultadosAnalise:', {
    resultado,
    medidaSalva,
    dados,
    perfil_peso: dados?.perfil?.peso
  });

  if (!dados) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Nenhuma análise encontrada
        </p>
      </div>
    );
  }

  const interpretacoes = interpretarResultados(dados);

  // Calcular classificações corretas usando as funções padronizadas
  const classificacoes = {
    percentualGordura: classificarPercentualGordura(dados.composicao.percentualGordura),
    indiceMassaMagra: classificarIndiceMassaMagra(dados.indices.indiceMassaMagra.valor, dados.perfil.sexo),
    indiceMassaGorda: classificarIndiceMassaGorda(dados.indices.indiceMassaGorda.valor),
    razaoCinturaQuadril: classificarRazaoCinturaQuadril(dados.indices.razaoCinturaQuadril.valor, dados.perfil.sexo),
    razaoCinturaEstatura: classificarRazaoCinturaEstatura(dados.indices.razaoCinturaEstatura.valor),
    indiceConicidade: classificarIndiceConicidade(dados.indices.indiceConicidade.valor)
  };

  // Funções para gerar faixas padronizadas baseadas no documento de referência
  const obterFaixasPercentualGordura = () => [
    { label: 'Atenção', cor: '#22c55e', inicio: 0, fim: 11.1 },
    { label: 'Baixo risco', cor: '#eab308', inicio: 11.1, fim: 18.2 },
    { label: 'Moderado', cor: '#f97316', inicio: 18.2, fim: 21.9 },
    { label: 'Alto risco', cor: '#ef4444', inicio: 21.9, fim: 35 }
  ];

  const obterFaixasCintura = () => [
    { label: 'Baixo risco', cor: '#22c55e', inicio: 0, fim: 94 },
    { label: 'Moderado', cor: '#eab308', inicio: 94, fim: 102 },
    { label: 'Alto risco', cor: '#ef4444', inicio: 102, fim: 200 }
  ];

  const obterFaixasQuadril = () => [
    { label: 'Atenção', cor: '#22c55e', inicio: 0, fim: 97.2 },
    { label: 'Baixo risco', cor: '#eab308', inicio: 97.2, fim: 104.8 },
    { label: 'Moderado', cor: '#f97316', inicio: 104.8, fim: 108.6 },
    { label: 'Alto risco', cor: '#ef4444', inicio: 108.6, fim: 200 }
  ];

  const obterFaixasIMM = () => [
    { label: 'Baixo', cor: '#ef4444', inicio: 0, fim: 17.8 },
    { label: 'Adequado', cor: '#22c55e', inicio: 17.8, fim: 22.3 },
    { label: 'Alto', cor: '#eab308', inicio: 22.3, fim: 32 }
  ];

  const obterFaixasIMG = () => [
    { label: 'Baixo', cor: '#22c55e', inicio: 0, fim: 2.2 },
    { label: 'Adequado', cor: '#eab308', inicio: 2.2, fim: 4.4 },
    { label: 'Alto', cor: '#ef4444', inicio: 4.4, fim: 12 }
  ];

  const obterFaixasRazaoCinturaQuadril = () => [
    { label: 'Adequado', cor: '#22c55e', inicio: 0, fim: 0.9 },
    { label: 'Inadequado', cor: '#ef4444', inicio: 0.9, fim: 1.3 }
  ];

  const obterFaixasRazaoCinturaEstatura = () => [
    { label: 'Baixo risco', cor: '#22c55e', inicio: 0, fim: 0.5 },
    { label: 'Moderado', cor: '#eab308', inicio: 0.5, fim: 0.55 },
    { label: 'Alto risco', cor: '#ef4444', inicio: 0.55, fim: 0.8 }
  ];

  const obterFaixasIndiceConicidade = () => [
    { label: 'Adequado', cor: '#22c55e', inicio: 0, fim: 1.25 },
    { label: 'Inadequado', cor: '#ef4444', inicio: 1.25, fim: 1.8 }
  ];

  return (
    <div className="space-y-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header igual ao PDF do concorrente */}
      <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {dados.perfil.sexo === 'M' ? 'Masculino' : 'Feminino'} {dados.perfil.idade} anos {(dados.perfil.altura).toFixed(2)} m
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Avaliação em: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>

      {/* PÁGINA 1 - Composição Corporal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lado esquerdo - Gráfico de pizza */}
        <div>
          <GraficoPizzaComposicao composicao={dados.composicao} peso={dados.perfil.peso} />
        </div>

        {/* Lado direito - Indicadores com escalas */}
        <div className="space-y-8">
          {/* IMC */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Índice de massa corporal (IMC): {interpretacoes.imc} ({dados.composicao.imc.toFixed(1)} kg/m²)
            </h3>
            <div className="text-xs text-gray-600 dark:text-gray-400 grid grid-cols-2 gap-2">
              <span>Baixo peso: &lt;18 kg/m²</span>
              <span>Eutrofia: 18 a 24,9 kg/m²</span>
              <span>Sobrepeso: 25 a 29,9 kg/m²</span>
              <span>Obesidade: &gt;30 kg/m²</span>
            </div>
          </div>

          {/* Percentual de gordura com escala */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              O percentual de gordura nessa avaliação tem como objetivo classificar risco para doenças cardiometabólicas, portanto não possui fins estéticos.
            </p>
            
            <EscalaRisco
              titulo="Percentual de gordura"
              valorAtual={dados.composicao.percentualGordura}
              unidade="%"
              faixas={obterFaixasPercentualGordura()}
              resultadoTexto={classificacoes.percentualGordura.descricao}
            />
          </div>

          {/* Índices em grid */}
          <div className="grid grid-cols-1 gap-6">
            <EscalaRisco
              titulo="Índice de massa magra"
              valorAtual={dados.indices.indiceMassaMagra.valor}
              unidade="kg/m²"
              faixas={obterFaixasIMM()}
              resultadoTexto={classificacoes.indiceMassaMagra.descricao}
              altura="pequena"
            />
            
            <EscalaRisco
              titulo="Índice de massa gorda"
              valorAtual={dados.indices.indiceMassaGorda.valor}
              unidade="kg/m²"
              faixas={obterFaixasIMG()}
              resultadoTexto={classificacoes.indiceMassaGorda.descricao}
              altura="pequena"
            />
          </div>
        </div>
      </div>

      {/* PÁGINA 2 - Medidas e Avatar */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lado esquerdo - Avatar com medidas */}
          <div>
            <AvatarMedidas 
              medidas={dados.medidas} 
              userId={user?.id || ''} 
            />
          </div>

          {/* Lado direito - 6 Escalas dos Indicadores */}
          <div className="space-y-6">
            <EscalaRisco
              titulo="Percentual de gordura"
              valorAtual={dados.composicao.percentualGordura}
              unidade="%"
              faixas={obterFaixasPercentualGordura()}
              resultadoTexto={interpretacoes.percentualGordura}
              altura="pequena"
            />

            <EscalaRisco
              titulo="Índice de massa magra"
              valorAtual={dados.indices.indiceMassaMagra.valor}
              unidade="kg/m²"
              faixas={obterFaixasIMM()}
              resultadoTexto={classificacoes.indiceMassaMagra.descricao}
              altura="pequena"
            />
            
            <EscalaRisco
              titulo="Índice de massa gorda"
              valorAtual={dados.indices.indiceMassaGorda.valor}
              unidade="kg/m²"
              faixas={obterFaixasIMG()}
              resultadoTexto={classificacoes.indiceMassaGorda.descricao}
              altura="pequena"
            />

            <EscalaRisco
              titulo="Razão cintura/quadril"
              valorAtual={dados.indices.razaoCinturaQuadril.valor}
              faixas={obterFaixasRazaoCinturaQuadril()}
              resultadoTexto={classificacoes.razaoCinturaQuadril.descricao}
              altura="pequena"
            />

            <EscalaRisco
              titulo="Razão cintura/estatura"
              valorAtual={dados.indices.razaoCinturaEstatura.valor}
              faixas={obterFaixasRazaoCinturaEstatura()}
              resultadoTexto={classificacoes.razaoCinturaEstatura.descricao}
              altura="pequena"
            />

            <EscalaRisco
              titulo="Índice de conicidade"
              valorAtual={dados.indices.indiceConicidade.valor}
              faixas={obterFaixasIndiceConicidade()}
              resultadoTexto={classificacoes.indiceConicidade.descricao}
              altura="pequena"
            />
          </div>
        </div>
      </div>

      {/* Índice Grimaldi expandido - largura total */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4 text-green-800 dark:text-green-200">
              Índice Grimaldi {dados.indices.indiceGrimaldi}/100
            </h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                O índice é gerado com base nos indicadores de composição corporal. 
                Quanto maior o índice, melhor a condição física. Utilize-o como complemento à avaliação clínica.
              </p>
              
              {/* Barra de progresso do Índice Grimaldi */}
              <div className="relative">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 mb-4">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-6 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(dados.indices.indiceGrimaldi, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>0</span>
                  <span className="font-semibold text-green-700 dark:text-green-300">
                    {dados.indices.indiceGrimaldi}
                  </span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aviso final igual ao PDF */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 text-center">
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          <strong>Avaliação por fotos</strong><br/>
          Os dados gerados por esta avaliação não têm poder diagnóstico.<br/>
          Eles devem ser interpretados em conjunto com a história clínica do paciente.<br/>
          Poses, vestimentas e a qualidade da imagem podem influenciar os resultados.<br/>
          A avaliação final e a interpretação são de responsabilidade do profissional de saúde.
        </p>
      </div>
    </div>
  );
};

export default ResultadosAnalise;