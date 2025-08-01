import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Brain, 
  User, 
  Calendar, 
  Scale, 
  Ruler, 
  Target, 
  TrendingUp, 
  Activity,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface AnaliseCorpData {
  id: string;
  user_id: string;
  nome_completo: string;
  sexo: string;
  created_at: string;
  
  // Dados corporais básicos
  altura_usada: number;
  peso_usado: number;
  idade_calculada: number;
  imc: number;
  
  // Medidas corporais (cm)
  medida_bracos: number;
  medida_antebracos: number;
  medida_cintura: number;
  medida_quadril: number;
  medida_coxas: number;
  medida_panturrilhas: number;
  
  // Composição corporal
  percentual_gordura: number;
  massa_magra: number;
  massa_gorda: number;
  tmb: number;
  
  // Índices de risco
  razao_cintura_quadril: number;
  razao_cintura_estatura: number;
  indice_conicidade: number;
  shaped_score: number;
  
  calculado_automaticamente: boolean;
}

interface AnaliseCorporalQueueProps {
  userRole?: 'preparador' | 'nutricionista';
}

export function AnaliseCorporalQueue({ userRole = 'preparador' }: AnaliseCorporalQueueProps) {
  const [analises, setAnalises] = useState<AnaliseCorpData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnalise, setSelectedAnalise] = useState<AnaliseCorpData | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchAnalises();
  }, []);

  const fetchAnalises = async () => {
    try {
      setLoading(true);
      
      const { data: medidasData, error: medidasError } = await supabase
        .from('medidas_corporais')
        .select(`
          id,
          user_id,
          created_at,
          altura_usada,
          peso_usado,
          idade_calculada,
          imc,
          medida_bracos,
          medida_antebracos,
          medida_cintura,
          medida_quadril,
          medida_coxas,
          medida_panturrilhas,
          percentual_gordura,
          massa_magra,
          massa_gorda,
          tmb,
          razao_cintura_quadril,
          razao_cintura_estatura,
          indice_conicidade,
          shaped_score,
          calculado_automaticamente
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (medidasError) throw medidasError;

      // Buscar dados dos perfis
      const userIds = medidasData?.map(m => m.user_id) || [];
      const { data: perfisData, error: perfisError } = await supabase
        .from('perfis')
        .select('user_id, nome_completo, sexo')
        .in('user_id', userIds);

      if (perfisError) throw perfisError;

      // Criar map de perfis
      const perfisMap = new Map(perfisData?.map(p => [p.user_id, p]) || []);

      const formattedData = medidasData?.map(item => {
        const perfil = perfisMap.get(item.user_id);
        return {
          id: item.id,
          user_id: item.user_id,
          nome_completo: perfil?.nome_completo || 'Nome não disponível',
          sexo: perfil?.sexo || 'N/A',
          created_at: item.created_at,
          altura_usada: item.altura_usada,
          peso_usado: item.peso_usado,
          idade_calculada: item.idade_calculada,
          imc: item.imc,
          medida_bracos: item.medida_bracos,
          medida_antebracos: item.medida_antebracos,
          medida_cintura: item.medida_cintura,
          medida_quadril: item.medida_quadril,
          medida_coxas: item.medida_coxas,
          medida_panturrilhas: item.medida_panturrilhas,
          percentual_gordura: item.percentual_gordura,
          massa_magra: item.massa_magra,
          massa_gorda: item.massa_gorda,
          tmb: item.tmb,
          razao_cintura_quadril: item.razao_cintura_quadril,
          razao_cintura_estatura: item.razao_cintura_estatura,
          indice_conicidade: item.indice_conicidade,
          shaped_score: item.shaped_score,
          calculado_automaticamente: item.calculado_automaticamente
        };
      }) || [];

      setAnalises(formattedData);
    } catch (error) {
      console.error('Erro ao buscar análises corporais:', error);
      setError('Erro ao carregar análises corporais');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIMCClassification = (imc: number) => {
    if (imc < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-600 bg-blue-100' };
    if (imc < 25) return { label: 'Peso normal', color: 'text-green-600 bg-green-100' };
    if (imc < 30) return { label: 'Sobrepeso', color: 'text-yellow-600 bg-yellow-100' };
    if (imc < 35) return { label: 'Obesidade I', color: 'text-orange-600 bg-orange-100' };
    if (imc < 40) return { label: 'Obesidade II', color: 'text-red-600 bg-red-100' };
    return { label: 'Obesidade III', color: 'text-red-800 bg-red-200' };
  };

  const getRiskLevel = (value: number, thresholds: { low: number; medium: number; high: number }) => {
    if (value <= thresholds.low) return { label: 'Baixo', color: 'text-green-600 bg-green-100' };
    if (value <= thresholds.medium) return { label: 'Moderado', color: 'text-yellow-600 bg-yellow-100' };
    if (value <= thresholds.high) return { label: 'Alto', color: 'text-orange-600 bg-orange-100' };
    return { label: 'Muito Alto', color: 'text-red-600 bg-red-100' };
  };

  const handleViewDetails = (analise: AnaliseCorpData) => {
    setSelectedAnalise(analise);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Carregando análises corporais...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-red-800">Erro ao carregar dados</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (analises.length === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma análise corporal disponível</h3>
        <p className="text-slate-600">As análises aparecerão aqui quando os clientes tiverem fotos e formulários processados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Análises Corporais Disponíveis</h3>
          <p className="text-sm text-slate-600">Análises automáticas processadas pelo sistema</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>{analises.length} análises</span>
        </div>
      </div>

      {/* Lista de análises */}
      <div className="grid gap-4">
        {analises.map((analise) => {
          const imcClass = getIMCClassification(analise.imc);
          
          return (
            <div
              key={analise.id}
              className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Cabeçalho do card */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{analise.nome_completo}</h4>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(analise.created_at)}
                        </span>
                        <span className="capitalize">{analise.sexo}</span>
                        <span>{analise.idade_calculada} anos</span>
                      </div>
                    </div>
                  </div>

                  {/* Dados principais */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Ruler className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-medium text-slate-600 uppercase">Altura</span>
                      </div>
                      <span className="text-lg font-semibold text-slate-900">
                        {(analise.altura_usada * 100).toFixed(0)} cm
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Scale className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-medium text-slate-600 uppercase">Peso</span>
                      </div>
                      <span className="text-lg font-semibold text-slate-900">
                        {analise.peso_usado.toFixed(1)} kg
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-medium text-slate-600 uppercase">IMC</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-slate-900">
                          {analise.imc.toFixed(1)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${imcClass.color}`}>
                          {imcClass.label}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-medium text-slate-600 uppercase">% Gordura</span>
                      </div>
                      <span className="text-lg font-semibold text-slate-900">
                        {analise.percentual_gordura.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Indicadores de risco */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-600">Cintura/Quadril:</span>
                    <span className="font-medium">{analise.razao_cintura_quadril.toFixed(2)}</span>
                    
                    <span className="text-slate-600 ml-4">TMB:</span>
                    <span className="font-medium">{analise.tmb.toFixed(0)} kcal</span>
                    
                    {analise.calculado_automaticamente && (
                      <span className="ml-auto flex items-center gap-1 text-blue-600 text-xs">
                        <Brain className="w-3 h-3" />
                        Automático
                      </span>
                    )}
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleViewDetails(analise)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de detalhes */}
      {showModal && selectedAnalise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    Análise Corporal Detalhada
                  </h3>
                  <p className="text-slate-600">{selectedAnalise.nome_completo}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Medidas Corporais */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-4">Medidas Corporais (cm)</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600">Braços</span>
                      <span className="font-medium">{selectedAnalise.medida_bracos.toFixed(1)} cm</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600">Antebraços</span>
                      <span className="font-medium">{selectedAnalise.medida_antebracos.toFixed(1)} cm</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600">Cintura</span>
                      <span className="font-medium">{selectedAnalise.medida_cintura.toFixed(1)} cm</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600">Quadril</span>
                      <span className="font-medium">{selectedAnalise.medida_quadril.toFixed(1)} cm</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600">Coxas</span>
                      <span className="font-medium">{selectedAnalise.medida_coxas.toFixed(1)} cm</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600">Panturrilhas</span>
                      <span className="font-medium">{selectedAnalise.medida_panturrilhas.toFixed(1)} cm</span>
                    </div>
                  </div>
                </div>

                {/* Composição Corporal */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-4">Composição Corporal</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600">Percentual de Gordura</span>
                      <span className="font-medium">{selectedAnalise.percentual_gordura.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600">Massa Magra</span>
                      <span className="font-medium">{selectedAnalise.massa_magra.toFixed(1)} kg</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600">Massa Gorda</span>
                      <span className="font-medium">{selectedAnalise.massa_gorda.toFixed(1)} kg</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600">TMB</span>
                      <span className="font-medium">{selectedAnalise.tmb.toFixed(0)} kcal</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600">IMC</span>
                      <span className="font-medium">{selectedAnalise.imc.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Índices de Risco */}
                <div className="md:col-span-2">
                  <h4 className="font-semibold text-slate-900 mb-4">Índices de Risco</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="text-sm text-slate-600 mb-1">Razão Cintura/Quadril</div>
                      <div className="text-lg font-semibold text-slate-900">{selectedAnalise.razao_cintura_quadril.toFixed(2)}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="text-sm text-slate-600 mb-1">Razão Cintura/Estatura</div>
                      <div className="text-lg font-semibold text-slate-900">{selectedAnalise.razao_cintura_estatura.toFixed(2)}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="text-sm text-slate-600 mb-1">Shaped Score</div>
                      <div className="text-lg font-semibold text-slate-900">{selectedAnalise.shaped_score.toFixed(1)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}