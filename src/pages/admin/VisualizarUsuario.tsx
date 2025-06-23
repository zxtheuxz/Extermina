import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from '../../components/AdminLayout';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Shield,
  FileText,
  Activity,
  Utensils,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X,
  AlertTriangle,
  History
} from 'lucide-react';

interface UsuarioCompleto {
  id: string;
  email: string;
  created_at: string;
  perfil: {
    nome_completo: string;
    telefone: string | null;
    role: string;
    liberado: string | null;
    resultado_fisica: string | null;
    resultado_nutricional: string | null;
  };
  avaliacoes_fisica: any[];
  avaliacoes_nutricional: any[];
  avaliacoes_nutricional_feminino: any[];
  analises_medicamentos: any[];
}

export function VisualizarUsuario() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [usuario, setUsuario] = useState<UsuarioCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [editandoRole, setEditandoRole] = useState(false);
  const [novoRole, setNovoRole] = useState('');
  const [salvandoRole, setSalvandoRole] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    if (id) {
      carregarUsuario();
    }
  }, [id]);

  const carregarUsuario = async () => {
    try {
      // Buscar perfil
      const { data: perfil, error: perfilError } = await supabase
        .from('perfis')
        .select('*')
        .eq('user_id', id)
        .single();

      if (perfilError) throw perfilError;

      // Buscar dados do auth.users via RPC
      let userData = null;
      try {
        const { data: userInfo } = await supabase.rpc('get_user_info', { user_uuid: id });
        userData = userInfo?.[0];
      } catch (error) {
        console.warn('Erro ao buscar dados de autenticação:', error);
      }

      // Buscar todas as avaliações (histórico completo)
      const [avaliacoesFisica, avaliacoesNutricional, avaliacoesNutricionaisFeminino, analisesMedicamentos] = await Promise.all([
        supabase.from('avaliacao_fisica').select('*').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('avaliacao_nutricional').select('*').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('avaliacao_nutricional_feminino').select('*').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('analises_medicamentos').select('*').eq('user_id', id).order('created_at', { ascending: false })
      ]);

      // Debug: verificar se os dados estão chegando
      console.log('Debug - Avaliações encontradas:', {
        fisica: avaliacoesFisica.data?.length || 0,
        nutricional: avaliacoesNutricional.data?.length || 0,
        nutricional_feminino: avaliacoesNutricionaisFeminino.data?.length || 0,
        analises: analisesMedicamentos.data?.length || 0
      });

      const usuarioCompleto: UsuarioCompleto = {
        id: id!,
        email: userData?.email || 'Email não disponível',
        created_at: userData?.created_at || new Date().toISOString(),
        perfil: {
          nome_completo: perfil.nome_completo,
          telefone: perfil.telefone,
          role: perfil.role || 'cliente',
          liberado: perfil.liberado,
          resultado_fisica: perfil.resultado_fisica,
          resultado_nutricional: perfil.resultado_nutricional
        },
        avaliacoes_fisica: avaliacoesFisica.data || [],
        avaliacoes_nutricional: avaliacoesNutricional.data || [],
        avaliacoes_nutricional_feminino: avaliacoesNutricionaisFeminino.data || [],
        analises_medicamentos: analisesMedicamentos.data || []
      };

      setUsuario(usuarioCompleto);
      setNovoRole(usuarioCompleto.perfil.role);
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      setErro('Erro ao carregar dados do usuário.');
    } finally {
      setLoading(false);
    }
  };

  const salvarRole = async () => {
    if (!novoRole || novoRole === usuario?.perfil.role) {
      setEditandoRole(false);
      return;
    }

    setSalvandoRole(true);
    setErro('');

    try {
      const { error } = await supabase
        .from('perfis')
        .update({ role: novoRole })
        .eq('user_id', id);

      if (error) throw error;

      setSucesso('Role atualizado com sucesso!');
      setEditandoRole(false);
      
      // Recarregar dados
      await carregarUsuario();
      
    } catch (error) {
      console.error('Erro ao salvar role:', error);
      setErro('Erro ao atualizar role. Tente novamente.');
    } finally {
      setSalvandoRole(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'preparador':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cliente':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'preparador':
        return <User className="w-4 h-4" />;
      case 'cliente':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
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
        return <Clock className="w-4 h-4" />;
      case 'APROVADO':
        return <CheckCircle className="w-4 h-4" />;
      case 'REJEITADO':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
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

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Usuário não encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              O usuário solicitado não existe ou você não tem permissão para acessá-lo.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/admin/dashboard')}
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
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Perfil do Usuário</h1>
              <p className="mt-2 text-gray-600">
                Visualize e gerencie informações completas do usuário
              </p>
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

        {/* Debug Info - remover após teste */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-yellow-800 mb-2">Debug - Dados de Avaliações:</h4>
          <div className="text-sm text-yellow-700">
            <p>Avaliações Físicas: {usuario.avaliacoes_fisica.length}</p>
            <p>Avaliações Nutricionais: {usuario.avaliacoes_nutricional.length}</p>
            <p>Avaliações Nutricionais Feminino: {usuario.avaliacoes_nutricional_feminino.length}</p>
            <p>Análises de Medicamentos: {usuario.analises_medicamentos.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Básicas */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Informações Básicas</h3>
                
                {/* Controle de Role */}
                <div className="flex items-center gap-2">
                  {editandoRole ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={novoRole}
                        onChange={(e) => setNovoRole(e.target.value)}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1"
                        disabled={salvandoRole}
                      >
                        <option value="cliente">Cliente</option>
                        <option value="preparador">Preparador</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={salvarRole}
                        disabled={salvandoRole}
                        className="p-1 text-green-600 hover:text-green-800"
                      >
                        {salvandoRole ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditandoRole(false);
                          setNovoRole(usuario.perfil.role);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(usuario.perfil.role)}`}>
                        {getRoleIcon(usuario.perfil.role)}
                        {usuario.perfil.role.toUpperCase()}
                      </span>
                      <button
                        onClick={() => setEditandoRole(true)}
                        className="p-1 text-purple-600 hover:text-purple-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Nome</p>
                    <p className="font-medium">{usuario.perfil.nome_completo}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{usuario.email}</p>
                  </div>
                </div>
                
                {usuario.perfil.telefone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Telefone</p>
                      <p className="font-medium">{usuario.perfil.telefone}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Cadastro</p>
                    <p className="font-medium">{formatarData(usuario.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Histórico de Avaliações Físicas */}
            {usuario.avaliacoes_fisica.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-medium text-gray-900">Histórico de Avaliações Físicas</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {usuario.avaliacoes_fisica.length}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {usuario.avaliacoes_fisica.map((avaliacao, index) => (
                    <div key={avaliacao.id} className={`border rounded-lg p-4 ${index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <History className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {formatarData(avaliacao.created_at)}
                        </span>
                        {index === 0 && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Mais Recente</span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Objetivo</p>
                          <p className="font-medium">{avaliacao.objetivo}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Experiência</p>
                          <p className="font-medium">{avaliacao.experiencia_musculacao}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Disponibilidade</p>
                          <p className="font-medium">{avaliacao.disponibilidade_semanal}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Tem Laudo Médico</p>
                          <p className="font-medium">
                            {avaliacao.tem_laudo_medico ? 'Sim' : 'Não'}
                          </p>
                        </div>
                      </div>

                      {avaliacao.laudo_medico_url && (
                        <div className="mt-3 p-2 bg-blue-50 rounded">
                          <a 
                            href={avaliacao.laudo_medico_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-700 hover:text-blue-800 underline"
                          >
                            Ver Laudo Médico
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {usuario.perfil.resultado_fisica && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">Resultado Físico Atual:</p>
                    <a 
                      href={usuario.perfil.resultado_fisica}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-700 hover:text-blue-800 underline"
                    >
                      Ver Plano de Treino
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Histórico de Avaliações Nutricionais */}
            {(usuario.avaliacoes_nutricional.length > 0 || usuario.avaliacoes_nutricional_feminino.length > 0) && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Utensils className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-medium text-gray-900">Histórico de Avaliações Nutricionais</h3>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                    {usuario.avaliacoes_nutricional.length + usuario.avaliacoes_nutricional_feminino.length}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {/* Avaliações Nutricionais Regulares */}
                  {usuario.avaliacoes_nutricional.map((avaliacao, index) => (
                    <div key={avaliacao.id} className={`border rounded-lg p-4 ${index === 0 ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <History className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {formatarData(avaliacao.created_at)} - Avaliação Geral
                        </span>
                        {index === 0 && (
                          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">Mais Recente</span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Objetivo</p>
                          <p className="font-medium">{avaliacao.objetivo}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Peso</p>
                          <p className="font-medium">{avaliacao.peso} kg</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Altura</p>
                          <p className="font-medium">{avaliacao.altura} cm</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Nível de Atividade</p>
                          <p className="font-medium">{avaliacao.nivel_atividade}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Avaliações Nutricionais Femininas */}
                  {usuario.avaliacoes_nutricional_feminino.map((avaliacao, index) => (
                    <div key={avaliacao.id} className={`border rounded-lg p-4 ${index === 0 && usuario.avaliacoes_nutricional.length === 0 ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <History className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {formatarData(avaliacao.created_at)} - Avaliação Feminina
                        </span>
                        {index === 0 && usuario.avaliacoes_nutricional.length === 0 && (
                          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">Mais Recente</span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Objetivo</p>
                          <p className="font-medium">{avaliacao.objetivo}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Peso</p>
                          <p className="font-medium">{avaliacao.peso} kg</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Altura</p>
                          <p className="font-medium">{avaliacao.altura} cm</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Idade</p>
                          <p className="font-medium">{avaliacao.idade} anos</p>
                        </div>
                      </div>

                      {avaliacao.ciclo_menstrual_regular !== undefined && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-500 mb-2">Informações Específicas:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>Ciclo Regular: {avaliacao.ciclo_menstrual_regular ? 'Sim' : 'Não'}</div>
                            {avaliacao.tem_filhos && <div>Filhos: {avaliacao.quantidade_filhos}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {usuario.perfil.resultado_nutricional && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-900 mb-1">Resultado Nutricional Atual:</p>
                    <a 
                      href={usuario.perfil.resultado_nutricional}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-700 hover:text-green-800 underline"
                    >
                      Ver Plano Nutricional
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Análises de Medicamentos */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-medium text-gray-900">Análises de Medicamentos</h3>
              </div>
              
              {usuario.analises_medicamentos.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma análise encontrada.</p>
              ) : (
                <div className="space-y-3">
                  {usuario.analises_medicamentos.map((analise) => (
                    <div key={analise.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{analise.tipo_documento}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(analise.status)}`}>
                          {getStatusIcon(analise.status)}
                          {analise.status}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-2">
                        {formatarData(analise.created_at)}
                      </p>
                      
                      {analise.documento_url && (
                        <a
                          href={analise.documento_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-600 hover:text-purple-800 underline"
                        >
                          Ver documento
                        </a>
                      )}
                      
                      {analise.observacoes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <strong>Observações:</strong> {analise.observacoes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}