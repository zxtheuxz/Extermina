import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Brain, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Loader2,
  Eye,
  X,
  Calendar,
  User
} from 'lucide-react';

interface AnaliseCorpral {
  id: string;
  user_id: string;
  foto_url: string;
  resultado: any;
  status: string;
  created_at: string;
  usuario?: {
    nome_completo: string;
    email: string;
  };
}

interface VisualizadorAnaliseCorpoalProps {
  userId: string;
  showUserInfo?: boolean;
  className?: string;
}

export function VisualizadorAnaliseCorporal({ 
  userId, 
  showUserInfo = false,
  className = ""
}: VisualizadorAnaliseCorpoalProps) {
  const [analises, setAnalises] = useState<AnaliseCorpral[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalise, setSelectedAnalise] = useState<AnaliseCorpral | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadAnalises();
  }, [userId]);

  const loadAnalises = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('analises_corporais')
        .select(`
          id,
          user_id,
          foto_url,
          resultado,
          status,
          created_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (showUserInfo) {
        query = supabase
          .from('analises_corporais')
          .select(`
            id,
            user_id,
            foto_url,
            resultado,
            status,
            created_at,
            usuario:perfis!user_id(nome_completo, email)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar análises corporais:', error);
        return;
      }

      setAnalises(data || []);
    } catch (error) {
      console.error('Erro ao carregar análises:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSANDO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONCLUIDO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ERRO':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewAnalise = (analise: AnaliseCorpral) => {
    setSelectedAnalise(analise);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Análise Corporal</h3>
              <p className="text-sm text-slate-600">
                Resultados da análise por foto usando IA
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {analises.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhuma análise encontrada</h4>
              <p className="text-gray-600">
                Ainda não há análises corporais para este usuário.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {analises.map((analise) => (
                <div
                  key={analise.id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {showUserInfo && analise.usuario && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-500" />
                            <span className="font-medium text-slate-900">
                              {analise.usuario.nome_completo}
                            </span>
                          </div>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(analise.status)}`}>
                          {analise.status === 'PROCESSANDO' && <Loader2 className="w-3 h-3 animate-spin" />}
                          {analise.status === 'CONCLUIDO' && <Activity className="w-3 h-3" />}
                          {analise.status === 'ERRO' && <AlertTriangle className="w-3 h-3" />}
                          {analise.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {formatDate(analise.created_at)}
                        </div>
                        {analise.resultado && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" />
                            Dados disponíveis
                          </div>
                        )}
                      </div>

                      {analise.status === 'CONCLUIDO' && analise.resultado && (
                        <div className="bg-purple-50 rounded-md p-3 mb-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            {analise.resultado.peso && (
                              <div>
                                <span className="text-purple-600 font-medium">Peso:</span>
                                <div className="text-purple-800">{analise.resultado.peso}kg</div>
                              </div>
                            )}
                            {analise.resultado.bf && (
                              <div>
                                <span className="text-purple-600 font-medium">BF:</span>
                                <div className="text-purple-800">{analise.resultado.bf}%</div>
                              </div>
                            )}
                            {analise.resultado.massa_magra && (
                              <div>
                                <span className="text-purple-600 font-medium">Massa Magra:</span>
                                <div className="text-purple-800">{analise.resultado.massa_magra}kg</div>
                              </div>
                            )}
                            {analise.resultado.massa_gorda && (
                              <div>
                                <span className="text-purple-600 font-medium">Massa Gorda:</span>
                                <div className="text-purple-800">{analise.resultado.massa_gorda}kg</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {analise.status === 'CONCLUIDO' && (
                        <button
                          onClick={() => handleViewAnalise(analise)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {modalOpen && selectedAnalise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Análise Corporal Detalhada</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDate(selectedAnalise.created_at)}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Foto */}
                {selectedAnalise.foto_url && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Foto Analisada</h3>
                    <img
                      src={selectedAnalise.foto_url}
                      alt="Foto para análise"
                      className="w-full h-auto rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                {/* Resultados */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Resultados</h3>
                  {selectedAnalise.resultado ? (
                    <div className="space-y-4">
                      {Object.entries(selectedAnalise.resultado).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 rounded-lg p-3">
                          <div className="text-sm font-medium text-gray-600 capitalize">
                            {key.replace('_', ' ')}
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            {typeof value === 'number' ? 
                              (key.includes('peso') || key.includes('massa') ? `${value}kg` : 
                               key.includes('bf') || key.includes('gordura') ? `${value}%` : value) : 
                              String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">Nenhum resultado disponível.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}