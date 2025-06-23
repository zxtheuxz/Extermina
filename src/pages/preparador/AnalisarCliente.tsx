import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { PreparadorLayout } from '../../components/PreparadorLayout';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  CheckCircle, 
  XCircle, 
  Clock,
  Save,
  ExternalLink,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface AnaliseCompleta {
  id: string;
  user_id: string;
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  tipo_documento: string;
  documento_url: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  usuario: {
    nome_completo: string;
    telefone: string | null;
    email: string;
  };
  avaliacao_fisica?: any;
  avaliacao_nutricional?: any;
}

export function AnalisarCliente() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [analise, setAnalise] = useState<AnaliseCompleta | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [novoStatus, setNovoStatus] = useState<'APROVADO' | 'REJEITADO' | ''>('');
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    if (id) {
      carregarAnalise();
    }
  }, [id]);

  const carregarAnalise = async () => {
    try {
      // Usar a função RPC para buscar dados completos
      const { data: analisesData, error: rpcError } = await supabase.rpc('buscar_analises_preparador');
      
      if (rpcError) {
        console.error('Erro na função RPC:', rpcError);
        throw rpcError;
      }

      // Encontrar a análise específica
      const analiseData = analisesData?.find((analise: any) => analise.id === id);
      
      if (!analiseData) {
        throw new Error('Análise não encontrada');
      }

      // Buscar avaliações do usuário para contexto adicional
      const [avaliacaoFisica, avaliacaoNutricional] = await Promise.all([
        supabase
          .from('avaliacao_fisica')
          .select('*')
          .eq('user_id', analiseData.user_id)
          .single(),
        supabase
          .from('avaliacao_nutricional')
          .select('*')
          .eq('user_id', analiseData.user_id)
          .single()
      ]);

      const analiseCompleta: AnaliseCompleta = {
        ...analiseData,
        avaliacao_fisica: avaliacaoFisica.data || null,
        avaliacao_nutricional: avaliacaoNutricional.data || null
      };

      setAnalise(analiseCompleta);
      setObservacoes(analiseCompleta.observacoes || '');
    } catch (error) {
      console.error('Erro ao carregar análise:', error);
      setErro('Erro ao carregar dados da análise.');
    } finally {
      setLoading(false);
    }
  };

  const salvarAnalise = async () => {
    if (!novoStatus) {
      setErro('Selecione um status para a análise.');
      return;
    }

    setSalvando(true);
    setErro('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const updateData: any = {
        status: novoStatus,
        observacoes: observacoes || null,
        updated_at: new Date().toISOString()
      };

      if (sessionData.session) {
        updateData.preparador_id = sessionData.session.user.id;
      }

      if (novoStatus === 'APROVADO') {
        updateData.aprovado_em = new Date().toISOString();
      }

      const { error } = await supabase
        .from('analises_medicamentos')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setSucesso('Análise salva com sucesso!');
      
      // Recarregar dados
      await carregarAnalise();
      
      // Limpar formulário após salvar
      setNovoStatus('');
      
    } catch (error) {
      console.error('Erro ao salvar análise:', error);
      setErro('Erro ao salvar análise. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APROVADO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJEITADO':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return <Clock className="w-5 h-5" />;
      case 'APROVADO':
        return <CheckCircle className="w-5 h-5" />;
      case 'REJEITADO':
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!analise) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Análise não encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              A análise solicitada não existe ou você não tem permissão para acessá-la.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/preparador/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PreparadorLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/preparador/dashboard')}
            className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Análise de Medicamento</h1>
              <p className="mt-2 text-gray-600">
                Revise e aprove documentos médicos
              </p>
            </div>
            
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(analise.status)}`}>
              {getStatusIcon(analise.status)}
              <span className="font-medium">{analise.status}</span>
            </div>
          </div>
        </div>

        {/* Mensagens */}
        {erro && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {sucesso && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{sucesso}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal - Informações da Análise */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações do Cliente */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Cliente</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Nome</p>
                    <p className="font-medium">{analise.usuario.nome_completo}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{analise.usuario.email}</p>
                  </div>
                </div>
                
                {analise.usuario.telefone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Telefone</p>
                      <p className="font-medium">{analise.usuario.telefone}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Data de Envio</p>
                    <p className="font-medium">{formatarData(analise.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Documento Médico */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Documento Médico</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Tipo de Documento</p>
                  <p className="font-medium">{analise.tipo_documento}</p>
                </div>
                
                {analise.documento_url ? (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Arquivo</p>
                    <a
                      href={analise.documento_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Visualizar Documento
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800">
                      <AlertTriangle className="w-4 h-4 inline mr-2" />
                      Nenhum documento foi enviado
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Histórico de Avaliações */}
            {(analise.avaliacao_fisica || analise.avaliacao_nutricional) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Histórico de Avaliações</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analise.avaliacao_fisica && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Avaliação Física</h4>
                      <p className="text-sm text-blue-700">
                        Objetivo: {analise.avaliacao_fisica.objetivo}
                      </p>
                      <p className="text-sm text-blue-700">
                        Experiência: {analise.avaliacao_fisica.experiencia_musculacao}
                      </p>
                      {analise.avaliacao_fisica.tem_laudo_medico && (
                        <p className="text-sm text-blue-700 font-medium">
                          ✓ Possui laudo médico
                        </p>
                      )}
                    </div>
                  )}
                  
                  {analise.avaliacao_nutricional && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Avaliação Nutricional</h4>
                      <p className="text-sm text-green-700">
                        Objetivo: {analise.avaliacao_nutricional.objetivo}
                      </p>
                      <p className="text-sm text-green-700">
                        Nível de Atividade: {analise.avaliacao_nutricional.nivel_atividade}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Ações */}
          <div className="space-y-6">
            {/* Painel de Aprovação */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Análise do Documento</h3>
              
              {analise.status === 'PENDENTE' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status da Análise
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="APROVADO"
                          checked={novoStatus === 'APROVADO'}
                          onChange={(e) => setNovoStatus(e.target.value as 'APROVADO')}
                          className="mr-2 text-green-600"
                        />
                        <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                        Aprovar
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="REJEITADO"
                          checked={novoStatus === 'REJEITADO'}
                          onChange={(e) => setNovoStatus(e.target.value as 'REJEITADO')}
                          className="mr-2 text-red-600"
                        />
                        <XCircle className="w-4 h-4 text-red-600 mr-1" />
                        Rejeitar
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-2">
                      Observações
                    </label>
                    <textarea
                      id="observacoes"
                      rows={4}
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Adicione observações sobre a análise (opcional)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <button
                    onClick={salvarAnalise}
                    disabled={salvando || !novoStatus}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {salvando ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {salvando ? 'Salvando...' : 'Salvar Análise'}
                  </button>
                </div>
              )}
              
              {analise.status !== 'PENDENTE' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Esta análise já foi processada.
                  </p>
                  
                  {analise.observacoes && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Observações:</p>
                      <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                        {analise.observacoes}
                      </p>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    Última atualização: {formatarData(analise.updated_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PreparadorLayout>
  );
}