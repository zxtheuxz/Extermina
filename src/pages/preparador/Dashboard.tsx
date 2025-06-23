import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { PreparadorLayout } from '../../components/PreparadorLayout';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter,
  FileText,
  Eye,
  AlertTriangle,
  LogOut,
  RefreshCw,
  User,
  Bell,
  TrendingUp,
  Activity
} from 'lucide-react';

interface AnaliseComUsuario {
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
}

interface Estatisticas {
  total: number;
  pendentes: number;
  aprovados: number;
  rejeitados: number;
}

export function PreparadorDashboard() {
  const navigate = useNavigate();
  const [analises, setAnalises] = useState<AnaliseComUsuario[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    total: 0,
    pendentes: 0,
    aprovados: 0,
    rejeitados: 0
  });
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [userInfo, setUserInfo] = useState<{ nome: string; email: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    carregarAnalises();
    carregarEstatisticas();
    carregarInfoUsuario();
  }, []);

  const carregarInfoUsuario = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: perfil } = await supabase
          .from('perfis')
          .select('nome_completo')
          .eq('user_id', user.id)
          .single();
        
        setUserInfo({
          nome: perfil?.nome_completo || 'Preparador',
          email: user.email || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar informações do usuário:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        carregarAnalises(),
        carregarEstatisticas()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const carregarAnalises = async () => {
    try {
      // Query SQL personalizada para buscar dados completos
      const { data, error } = await supabase.rpc('buscar_analises_preparador');

      if (error) {
        console.error('Erro na função RPC:', error);
        // Fallback para query simples
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('analises_medicamentos')
          .select(`
            id,
            user_id,
            status,
            tipo_documento,
            documento_url,
            observacoes,
            created_at,
            updated_at,
            perfis!inner(
              nome_completo,
              telefone
            )
          `)
          .order('created_at', { ascending: false });

        if (fallbackError) throw fallbackError;

        const analisesMapeadas = fallbackData?.map(analise => ({
          ...analise,
          usuario: {
            nome_completo: (analise.perfis as any).nome_completo,
            telefone: (analise.perfis as any).telefone,
            email: 'Email não disponível'
          }
        })) || [];

        setAnalises(analisesMapeadas);
        return;
      }

      setAnalises(data || []);
    } catch (error) {
      console.error('Erro ao carregar análises:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarEstatisticas = async () => {
    try {
      const { data, error } = await supabase
        .from('analises_medicamentos')
        .select('status');

      if (error) throw error;

      const stats = data?.reduce((acc, item) => {
        acc.total++;
        switch (item.status) {
          case 'PENDENTE':
            acc.pendentes++;
            break;
          case 'APROVADO':
            acc.aprovados++;
            break;
          case 'REJEITADO':
            acc.rejeitados++;
            break;
        }
        return acc;
      }, { total: 0, pendentes: 0, aprovados: 0, rejeitados: 0 }) || estatisticas;

      setEstatisticas(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const analisesFiltradasEPesquisadas = analises.filter(analise => {
    const matchStatus = filtroStatus === 'TODOS' || analise.status === filtroStatus;
    const matchPesquisa = termoPesquisa === '' || 
      analise.usuario.nome_completo.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
      analise.usuario.email.toLowerCase().includes(termoPesquisa.toLowerCase());
    
    return matchStatus && matchPesquisa;
  });

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

  return (
    <PreparadorLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Header Aprimorado */}
      <div className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard do Preparador</h1>
                <p className="text-sm text-gray-600">Gerencie análises de medicamentos e documentos médicos</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Informações do Usuário */}
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{userInfo?.nome}</p>
                <p className="text-xs text-gray-500">{userInfo?.email}</p>
              </div>
              
              {/* Botões de Ação */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Atualizar dados"
                >
                  <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Estatísticas Aprimoradas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-gray-900">{estatisticas.total}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-xs text-blue-600 font-medium">Análises</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pendentes</p>
                <p className="text-3xl font-bold text-gray-900">{estatisticas.pendentes}</p>
                <div className="flex items-center mt-2">
                  <Bell className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-xs text-yellow-600 font-medium">Aguardando</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                <Clock className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Aprovados</p>
                <p className="text-3xl font-bold text-gray-900">{estatisticas.aprovados}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600 font-medium">Liberados</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Rejeitados</p>
                <p className="text-3xl font-bold text-gray-900">{estatisticas.rejeitados}</p>
                <div className="flex items-center mt-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-xs text-red-600 font-medium">Bloqueados</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl">
                <XCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Pesquisa Aprimorados */}
        <div className="bg-white rounded-xl shadow-lg mb-6 p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou email..."
                  value={termoPesquisa}
                  onChange={(e) => setTermoPesquisa(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="PENDENTE">Pendentes</option>
                  <option value="APROVADO">Aprovados</option>
                  <option value="REJEITADO">Rejeitados</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Análises Aprimorada */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Análises de Medicamentos ({analisesFiltradasEPesquisadas.length})
            </h3>
          </div>

          {analisesFiltradasEPesquisadas.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma análise encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                {termoPesquisa || filtroStatus !== 'TODOS' 
                  ? 'Tente ajustar os filtros de pesquisa.'
                  : 'Aguardando novos documentos para análise.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analisesFiltradasEPesquisadas.map((analise) => (
                    <tr key={analise.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {analise.usuario.nome_completo}
                          </div>
                          <div className="text-sm text-gray-500">
                            {analise.usuario.email}
                          </div>
                          {analise.usuario.telefone && (
                            <div className="text-sm text-gray-500">
                              {analise.usuario.telefone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {analise.tipo_documento}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(analise.status)}`}>
                          {getStatusIcon(analise.status)}
                          {analise.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatarData(analise.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {analise.documento_url ? (
                          <a 
                            href={analise.documento_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-800 flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            Ver documento
                          </a>
                        ) : (
                          <span className="text-gray-400">Sem documento</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => navigate(`/preparador/analisar/${analise.id}`)}
                          className="text-purple-600 hover:text-purple-800 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Analisar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PreparadorLayout>
  );
}