import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  FileText, 
  Clock, 
  User, 
  Eye, 
  Check, 
  X, 
  AlertCircle, 
  Edit3,
  Calendar,
  Phone,
  Mail,
  ChefHat,
  Salad,
  Brain
} from 'lucide-react';
import { EditorResultadoNutricional } from './EditorResultadoNutricional';
import { VisualizadorAnaliseCorporal } from '../shared/VisualizadorAnaliseCorporal';
import { VisualizadorFormularioNutricional } from './VisualizadorFormularioNutricional';

interface AvaliacaoNutricional {
  id: string;
  avaliacao_id: string;
  user_id: string;
  tipo_avaliacao: 'masculino' | 'feminino';
  status: string;
  resultado_original: string;
  resultado_editado?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  usuario: {
    id: string;
    nome_completo: string;
    email: string;
    telefone?: string;
    data_nascimento?: string;
  };
}

interface AvaliacoesNutricionaisQueueProps {
  tipoAvaliacao: 'masculino' | 'feminino';
}

export function AvaliacoesNutricionaisQueue({ tipoAvaliacao }: AvaliacoesNutricionaisQueueProps) {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoNutricional[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'TODAS' | 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'EM_EDICAO'>('PENDENTE');
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<AvaliacaoNutricional | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [showAnaliseCorpral, setShowAnaliseCorpral] = useState<string | null>(null);
  const [showFormularioCompleto, setShowFormularioCompleto] = useState<{ userId: string; tipo: 'masculino' | 'feminino' } | null>(null);

  useEffect(() => {
    loadAvaliacoes();
  }, [filter, tipoAvaliacao]);

  const loadAvaliacoes = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('buscar_avaliacoes_nutricionais_pendentes');
      
      if (error) {
        console.error('Erro ao buscar avaliações nutricionais:', error);
        return;
      }

      let filteredData = data || [];
      
      // Filtrar por tipo de avaliação (masculino/feminino)
      filteredData = filteredData.filter((avaliacao: AvaliacaoNutricional) => 
        avaliacao.tipo_avaliacao === tipoAvaliacao
      );
      
      // Filtrar por status
      if (filter !== 'TODAS') {
        filteredData = filteredData.filter((avaliacao: AvaliacaoNutricional) => 
          avaliacao.status === filter
        );
      }
      
      setAvaliacoes(filteredData);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (avaliacaoId: string) => {
    try {
      const { error } = await supabase.rpc('atualizar_aprovacao_nutricional', {
        p_id: avaliacaoId,
        p_status: 'APROVADO'
      });

      if (error) {
        console.error('Erro ao aprovar avaliação:', error);
        return;
      }

      await loadAvaliacoes();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
    }
  };

  const handleReject = async (avaliacaoId: string, observacoes?: string) => {
    try {
      const { error } = await supabase.rpc('atualizar_aprovacao_nutricional', {
        p_id: avaliacaoId,
        p_status: 'REJEITADO',
        p_observacoes: observacoes
      });

      if (error) {
        console.error('Erro ao rejeitar avaliação:', error);
        return;
      }

      await loadAvaliacoes();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
    }
  };

  const handleEdit = (avaliacao: AvaliacaoNutricional) => {
    setSelectedAvaliacao(avaliacao);
    setEditorOpen(true);
  };

  const handleSaveEdit = async (avaliacaoId: string, novoResultado: string) => {
    try {
      const { error } = await supabase.rpc('atualizar_aprovacao_nutricional', {
        p_id: avaliacaoId,
        p_status: 'EM_EDICAO',
        p_resultado_editado: novoResultado
      });

      if (error) {
        console.error('Erro ao salvar edição:', error);
        return;
      }

      await loadAvaliacoes();
      setEditorOpen(false);
      setSelectedAvaliacao(null);
    } catch (error) {
      console.error('Erro ao salvar:', error);
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
      case 'PENDENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APROVADO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJEITADO':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'EM_EDICAO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return <Clock className="w-4 h-4" />;
      case 'APROVADO':
        return <Check className="w-4 h-4" />;
      case 'REJEITADO':
        return <X className="w-4 h-4" />;
      case 'EM_EDICAO':
        return <Edit3 className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getTipoIcon = () => {
    return tipoAvaliacao === 'masculino' ? 
      <ChefHat className="w-5 h-5" /> : 
      <Salad className="w-5 h-5" />;
  };

  const getTipoColor = () => {
    return tipoAvaliacao === 'masculino' ? 'blue' : 'pink';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg bg-${getTipoColor()}-50 text-${getTipoColor()}-600`}>
                  {getTipoIcon()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Avaliações Nutricionais - {tipoAvaliacao === 'masculino' ? 'Masculino' : 'Feminino'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    Gerencie e aprove os resultados das avaliações nutricionais
                  </p>
                </div>
              </div>
            </div>
            
            {/* Filtros */}
            <div className="flex items-center gap-2">
              {(['TODAS', 'PENDENTE', 'APROVADO', 'REJEITADO', 'EM_EDICAO'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filter === status
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  {status === 'TODAS' ? 'Todas' : 
                   status === 'EM_EDICAO' ? 'Em Edição' :
                   status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Avaliações */}
        <div className="p-6">
          {avaliacoes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhuma avaliação encontrada</h4>
              <p className="text-gray-600">
                {filter === 'PENDENTE' 
                  ? `Não há avaliações ${tipoAvaliacao === 'masculino' ? 'masculinas' : 'femininas'} pendentes no momento.` 
                  : `Não há avaliações com status "${filter.toLowerCase()}".`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {avaliacoes.map((avaliacao) => (
                <div
                  key={avaliacao.id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="font-medium text-slate-900">
                            {avaliacao.usuario.nome_completo}
                          </span>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(avaliacao.status)}`}>
                          {getStatusIcon(avaliacao.status)}
                          {avaliacao.status === 'EM_EDICAO' ? 'EM EDIÇÃO' : avaliacao.status}
                        </span>
                        <span className={`px-2 py-1 rounded-md text-xs font-medium bg-${getTipoColor()}-50 text-${getTipoColor()}-700 border border-${getTipoColor()}-200`}>
                          {tipoAvaliacao === 'masculino' ? 'Masculino' : 'Feminino'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {avaliacao.usuario.email}
                        </div>
                        {avaliacao.usuario.telefone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            {avaliacao.usuario.telefone}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {formatDate(avaliacao.created_at)}
                        </div>
                      </div>
                      
                      {avaliacao.observacoes && (
                        <div className="bg-slate-50 rounded-md p-2 mb-3">
                          <p className="text-xs text-slate-600">
                            <strong>Observações:</strong> {avaliacao.observacoes}
                          </p>
                        </div>
                      )}

                      {avaliacao.resultado_editado && (
                        <div className="bg-blue-50 rounded-md p-2 mb-3">
                          <p className="text-xs text-blue-600">
                            <strong>Resultado editado</strong> - Última atualização: {formatDate(avaliacao.updated_at)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setShowFormularioCompleto({ userId: avaliacao.user_id, tipo: tipoAvaliacao })}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                        title="Ver formulário completo"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => setShowAnaliseCorpral(avaliacao.user_id)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                        title="Ver análise corporal"
                      >
                        <Brain className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleEdit(avaliacao)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Editar resultado"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      
                      {(avaliacao.status === 'PENDENTE' || avaliacao.status === 'EM_EDICAO') && (
                        <>
                          <button
                            onClick={() => handleApprove(avaliacao.id)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-sm font-medium flex items-center gap-1"
                            title="Aprovar"
                          >
                            <Check className="w-4 h-4" />
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleReject(avaliacao.id)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm font-medium flex items-center gap-1"
                            title="Rejeitar"
                          >
                            <X className="w-4 h-4" />
                            Rejeitar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {editorOpen && selectedAvaliacao && (
        <EditorResultadoNutricional
          avaliacao={selectedAvaliacao}
          isOpen={editorOpen}
          onClose={() => {
            setEditorOpen(false);
            setSelectedAvaliacao(null);
          }}
          onSave={handleSaveEdit}
        />
      )}

      {/* Modal Análise Corporal */}
      {showAnaliseCorpral && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Análise Corporal do Cliente</h2>
              <button
                onClick={() => setShowAnaliseCorpral(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <VisualizadorAnaliseCorporal userId={showAnaliseCorpral} showUserInfo={false} />
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulário Completo */}
      {showFormularioCompleto && (
        <VisualizadorFormularioNutricional
          userId={showFormularioCompleto.userId}
          tipoAvaliacao={showFormularioCompleto.tipo}
          isOpen={true}
          onClose={() => setShowFormularioCompleto(null)}
        />
      )}
    </>
  );
}