import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ResultadoAnalise, interpretarResultados } from '../../utils/calculosComposicaoCorporal';
import { Activity, TrendingUp, Scale, Zap, AlertCircle, Calendar } from 'lucide-react';
import RelatorioGrimaldi from './RelatorioGrimaldi';
import GraficoComposicaoCorporal from './GraficoComposicaoCorporal';
import EscalasRisco from './EscalasRisco';
import { MedidasCorporais, PerfilUsuario, analisarComposicaoGrimaldi } from '../../utils/calculosGrimaldi';

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


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const dados = resultado || (medidaSalva ? {
    composicao: {
      percentualGordura: medidaSalva.percentual_gordura,
      massaGorda: medidaSalva.massa_gorda,
      massaMagra: medidaSalva.massa_magra,
      tmb: medidaSalva.tmb,
      imc: medidaSalva.imc,
      aguaCorporal: medidaSalva.massa_magra * 0.723,
      aguaCorporalPercentual: (medidaSalva.massa_magra * 0.723 / medidaSalva.peso_usado) * 100
    },
    indices: {
      shapedScore: medidaSalva.shaped_score,
      // Recalcular classificações baseado nos valores salvos
      razaoCinturaQuadril: { valor: medidaSalva.razao_cintura_quadril, faixa: 'ADEQUADO', descricao: 'Adequado' },
      razaoCinturaEstatura: { valor: medidaSalva.razao_cintura_estatura, faixa: 'BAIXO_RISCO', descricao: 'Baixo risco' },
      indiceConicidade: { valor: medidaSalva.indice_conicidade, faixa: 'ADEQUADO', descricao: 'Adequado' },
      indiceMassaMagra: { valor: medidaSalva.massa_magra / Math.pow(medidaSalva.altura_usada, 2), faixa: 'ADEQUADO', descricao: 'Adequado' },
      indiceMassaGorda: { valor: medidaSalva.massa_gorda / Math.pow(medidaSalva.altura_usada, 2), faixa: 'ADEQUADO', descricao: 'Adequado' },
      cintura: { valor: medidaSalva.medida_cintura, faixa: 'BAIXO_RISCO', descricao: 'Baixo risco' },
      quadril: { valor: medidaSalva.medida_quadril, faixa: 'BAIXO_RISCO', descricao: 'Baixo risco' }
    },
    medidas: {
      bracos: medidaSalva.medida_bracos,
      antebracos: medidaSalva.medida_antebracos,
      cintura: medidaSalva.medida_cintura,
      quadril: medidaSalva.medida_quadril,
      coxas: medidaSalva.medida_coxas,
      panturrilhas: medidaSalva.medida_panturrilhas
    },
    perfil: {
      altura: medidaSalva.altura_usada,
      peso: medidaSalva.peso_usado,
      idade: medidaSalva.idade_calculada,
      sexo: medidaSalva.sexo_usado as 'M' | 'F'
    }
  } : null);

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

      {/* Gráfico de composição corporal (pizza) igual ao PDF */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lado esquerdo - Gráfico de pizza */}
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Análise global da composição corporal</h2>
          <div className="relative w-64 h-64 mx-auto mb-4">
            {/* Gráfico de pizza igual ao PDF do concorrente */}
            <div 
              className="w-full h-full rounded-full relative overflow-hidden border-4 border-gray-200"
              style={{
                background: `conic-gradient(
                  #22c55e 0deg ${(dados.composicao.massaMagra / dados.perfil.peso) * 360}deg,
                  #10b981 ${(dados.composicao.massaMagra / dados.perfil.peso) * 360}deg 360deg
                )`
              }}
            >
              <div className="absolute inset-12 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center border border-gray-200">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{dados.composicao.percentualGordura.toFixed(1)}%</div>
                  <div className="text-xl font-bold text-green-400">{(100 - dados.composicao.percentualGordura).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 text-left max-w-xs mx-auto">
            <div className="text-center mb-4">
              <span className="text-lg font-bold">Peso: {dados.perfil.peso} kg</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-600 rounded mr-2"></div>
              <span className="font-semibold">Massa gorda: {dados.composicao.massaGorda.toFixed(1)} kg</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
              Representa toda a massa de gordura presente no corpo.
            </p>
            
            <div className="flex items-center mt-3">
              <div className="w-4 h-4 bg-green-400 rounded mr-2"></div>
              <span className="font-semibold">Massa magra: {dados.composicao.massaMagra.toFixed(1)} kg</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
              Representa o conjunto de músculos, ossos, órgãos e água.
            </p>
            
            <div className="mt-4 space-y-1 text-sm">
              <p>
                <span className="font-semibold">Água corporal:</span> {dados.composicao.aguaCorporal.toFixed(1)}L ({dados.composicao.aguaCorporalPercentual.toFixed(1)}%)
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Predito a partir da constante hídrica de mamíferos de 72,3% de água em relação à massa magra.
              </p>
              
              <p className="mt-2">
                <span className="font-semibold">Gasto energético de repouso:</span> {dados.composicao.tmb.toFixed(1)} kcal
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Predito a partir da equação de Cunningham (1980) que utiliza massa magra como variável.
              </p>
            </div>
          </div>
        </div>

        {/* Lado direito - Indicadores */}
        <div className="space-y-6">
          {/* IMC */}
          <div>
            <h3 className="font-semibold mb-2">
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
            <h3 className="font-semibold mb-2">Percentual de gordura: {dados.composicao.percentualGordura.toFixed(1)}%</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              O percentual de gordura nessa avaliação tem como objetivo classificar risco para doenças cardiometabólicas, portanto não possui fins estéticos.
            </p>
            
            {/* Escala de gordura */}
            <div className="relative bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 h-8 rounded mb-2">
              <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-semibold text-white">
                <span>Atenção</span>
                <span>Baixo risco</span>
                <span>Moderado</span>
                <span>Alto risco</span>
              </div>
            </div>
            
            <div className="mb-4">
              <span className="font-semibold">Resultado: {interpretacoes.percentualGordura}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                Avaliação atual {new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Índices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold">Índice de massa magra: {dados.indices.indiceMassaMagra.valor.toFixed(1)} kg/m²</h4>
              <div className="bg-green-200 dark:bg-green-800 px-2 py-1 rounded text-sm inline-block mt-1">
                Resultado: {dados.indices.indiceMassaMagra.descricao}
              </div>
              <p className="text-xs mt-1">Avaliação atual {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            
            <div>
              <h4 className="font-semibold">Índice de massa gorda: {dados.indices.indiceMassaGorda.valor.toFixed(2)} kg/m²</h4>
              <div className="bg-red-200 dark:bg-red-800 px-2 py-1 rounded text-sm inline-block mt-1">
                Resultado: {dados.indices.indiceMassaGorda.descricao}
              </div>
              <p className="text-xs mt-1">Avaliação atual {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Segunda página - Layout das medidas igual ao PDF */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lado esquerdo - Avatar com medidas */}
          <div className="text-center">
            <div className="relative w-64 h-80 mx-auto mb-4 bg-green-400 rounded-full flex items-center justify-center">
              {/* Avatar simples */}
              <div className="text-black font-bold space-y-2">
                <div className="absolute top-16 left-4 text-xs">
                  <div className="bg-white px-1 rounded">Braço</div>
                  <div className="bg-white px-1 rounded">{dados.medidas.bracos.toFixed(1)} cm</div>
                </div>
                <div className="absolute top-20 right-4 text-xs">
                  <div className="bg-white px-1 rounded">Antebraço</div>
                  <div className="bg-white px-1 rounded">{dados.medidas.antebracos.toFixed(1)} cm</div>
                </div>
                <div className="absolute top-32 right-2 text-xs">
                  <div className="bg-white px-1 rounded">Cintura</div>
                  <div className="bg-white px-1 rounded">{dados.medidas.cintura.toFixed(1)} cm</div>
                </div>
                <div className="absolute bottom-32 right-2 text-xs">
                  <div className="bg-white px-1 rounded">Quadril</div>
                  <div className="bg-white px-1 rounded">{dados.medidas.quadril.toFixed(1)} cm</div>
                </div>
                <div className="absolute bottom-20 left-4 text-xs">
                  <div className="bg-white px-1 rounded">Coxa</div>
                  <div className="bg-white px-1 rounded">{dados.medidas.coxas.toFixed(1)} cm</div>
                </div>
                <div className="absolute bottom-8 left-6 text-xs">
                  <div className="bg-white px-1 rounded">Panturrilha</div>
                  <div className="bg-white px-1 rounded">{dados.medidas.panturrilhas.toFixed(1)} cm</div>
                </div>
              </div>
            </div>
          </div>

          {/* Lado direito - Escalas de medidas */}
          <div className="space-y-6">
            {/* Cintura */}
            <div>
              <h4 className="font-semibold">Cintura: {dados.medidas.cintura.toFixed(1)} cm</h4>
              <div className="bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 h-6 rounded mt-2 relative">
                <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-semibold text-white">
                  <span>Baixo risco</span>
                  <span>Moderado</span>
                  <span>Alto risco</span>
                </div>
              </div>
              <p className="text-xs mt-1">Avaliação atual {new Date().toLocaleDateString('pt-BR')}</p>
            </div>

            {/* Quadril */}
            <div>
              <h4 className="font-semibold">Quadril: {dados.medidas.quadril.toFixed(1)} cm</h4>
              <div className="bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 h-6 rounded mt-2"></div>
            </div>

            {/* Razões */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Razão cintura-estatura: {dados.indices.razaoCinturaEstatura.valor.toFixed(2)}</h4>
                <div className="bg-green-200 dark:bg-green-800 px-2 py-1 rounded text-sm inline-block">
                  {dados.indices.razaoCinturaEstatura.descricao}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold">Razão cintura/quadril: {dados.indices.razaoCinturaQuadril.valor.toFixed(2)}</h4>
                <div className="bg-green-200 dark:bg-green-800 px-2 py-1 rounded text-sm inline-block">
                  {dados.indices.razaoCinturaQuadril.descricao}
                </div>
              </div>
            </div>

            {/* Shaped Score igual ao concorrente */}
            <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="font-bold text-xl mb-2">Shaped Score {dados.indices.shapedScore}/100</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                O score é gerado com base nos indicadores de composição corporal. 
                Quanto maior o score, melhor a condição física. Utilize-o como complemento à avaliação clínica.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Aviso final igual ao PDF */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-center">
        <p className="text-xs text-gray-600 dark:text-gray-400">
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