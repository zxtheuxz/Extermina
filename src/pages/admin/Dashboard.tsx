import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from '../../components/AdminLayout';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  Filter,
  Eye,
  BarChart3,
  Shield,
  Settings,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Usuario {
  id: string;
  email: string;
  created_at: string;
  perfil: {
    nome_completo: string;
    telefone: string | null;
    role: string;
    liberado: string | null;
  };
  avaliacoes: {
    fisica: boolean;
    nutricional: boolean;
  };
  analises: {
    total: number;
    pendentes: number;
    aprovadas: number;
    rejeitadas: number;
  };
}

interface Estatisticas {
  totalUsuarios: number;
  totalClientes: number;
  totalPreparadores: number;
  totalAdmins: number;
  analisesPendentes: number;
  analisesAprovadas: number;
  analisesRejeitadas: number;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    totalUsuarios: 0,
    totalClientes: 0,
    totalPreparadores: 0,
    totalAdmins: 0,
    analisesPendentes: 0,
    analisesAprovadas: 0,
    analisesRejeitadas: 0
  });
  const [loading, setLoading] = useState(true);
  const [filtroRole, setFiltroRole] = useState<string>('TODOS');
  const [termoPesquisa, setTermoPesquisa] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      await Promise.all([
        carregarUsuarios(),
        carregarEstatisticas()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarUsuarios = async () => {
    try {
      // Buscar perfis com informações dos usuários
      const { data: perfis, error: perfisError } = await supabase
        .from('perfis')
        .select(`
          user_id,
          nome_completo,
          telefone,
          role,
          liberado
        `);

      if (perfisError) throw perfisError;

      // Buscar avaliações físicas e nutricionais
      const [avaliacoesFisicas, avaliacoesNutricionais, analisesMedicamentos] = await Promise.all([
        supabase.from('avaliacao_fisica').select('user_id'),
        supabase.from('avaliacao_nutricional').select('user_id'),
        supabase.from('analises_medicamentos').select('user_id, status')
      ]);

      // Mapear dados dos perfis com informações complementares
      const usuariosMapeados = (perfis || []).map((perfil) => {
        const temAvaliacaoFisica = avaliacoesFisicas.data?.some(af => af.user_id === perfil.user_id) || false;
        const temAvaliacaoNutricional = avaliacoesNutricionais.data?.some(an => an.user_id === perfil.user_id) || false;
        
        const analisesUsuario = analisesMedicamentos.data?.filter(am => am.user_id === perfil.user_id) || [];
        const analises = {
          total: analisesUsuario.length,
          pendentes: analisesUsuario.filter(a => a.status === 'PENDENTE').length,
          aprovadas: analisesUsuario.filter(a => a.status === 'APROVADO').length,
          rejeitadas: analisesUsuario.filter(a => a.status === 'REJEITADO').length
        };

        return {
          id: perfil.user_id,
          email: 'Email não disponível', // Será preenchido depois
          created_at: new Date().toISOString(),
          perfil: {
            nome_completo: perfil.nome_completo || 'Nome não informado',
            telefone: perfil.telefone,
            role: perfil.role || 'cliente',
            liberado: perfil.liberado
          },
          avaliacoes: {
            fisica: temAvaliacaoFisica,
            nutricional: temAvaliacaoNutricional
          },
          analises
        };
      });

      // Tentar buscar emails usando RPC para cada usuário
      for (const usuario of usuariosMapeados) {
        try {
          const { data: userData } = await supabase.rpc('get_user_info', { user_uuid: usuario.id });
          if (userData && userData[0]) {
            usuario.email = userData[0].email || 'Email não disponível';
            usuario.created_at = userData[0].created_at || usuario.created_at;
          }
        } catch (error) {
          console.warn(`Erro ao buscar dados do usuário ${usuario.id}:`, error);
        }
      }

      setUsuarios(usuariosMapeados);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      // Fallback: usar apenas dados dos perfis
      const { data: perfis } = await supabase.from('perfis').select('*');
      if (perfis) {
        const usuariosFallback = perfis.map(perfil => ({
          id: perfil.user_id,
          email: 'Email não disponível',
          created_at: new Date().toISOString(),
          perfil: {
            nome_completo: perfil.nome_completo || 'Nome não informado',
            telefone: perfil.telefone,
            role: perfil.role || 'cliente',
            liberado: perfil.liberado
          },
          avaliacoes: { fisica: false, nutricional: false },
          analises: { total: 0, pendentes: 0, aprovadas: 0, rejeitadas: 0 }
        }));
        setUsuarios(usuariosFallback);
      }
    }
  };

  const carregarEstatisticas = async () => {
    try {
      const [perfisResult, analisesResult] = await Promise.all([
        supabase.from('perfis').select('role'),
        supabase.from('analises_medicamentos').select('status')
      ]);

      const perfis = perfisResult.data || [];
      const analises = analisesResult.data || [];

      const stats = {
        totalUsuarios: perfis.length,
        totalClientes: perfis.filter(p => p.role === 'cliente').length,
        totalPreparadores: perfis.filter(p => p.role === 'preparador').length,
        totalAdmins: perfis.filter(p => p.role === 'admin').length,
        analisesPendentes: analises.filter(a => a.status === 'PENDENTE').length,
        analisesAprovadas: analises.filter(a => a.status === 'APROVADO').length,
        analisesRejeitadas: analises.filter(a => a.status === 'REJEITADO').length
      };

      setEstatisticas(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchRole = filtroRole === 'TODOS' || usuario.perfil.role === filtroRole.toLowerCase();
    const matchPesquisa = termoPesquisa === '' || 
      usuario.perfil.nome_completo.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
      usuario.email.toLowerCase().includes(termoPesquisa.toLowerCase());
    
    return matchRole && matchPesquisa;
  });

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
        return <UserCheck className="w-4 h-4" />;
      case 'cliente':
        return <Users className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="mt-2 text-gray-600">
            Gerencie usuários, roles e monitore o sistema
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.totalUsuarios}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.totalClientes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Preparadores</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.totalPreparadores}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Análises Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.analisesPendentes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas de Análises */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Análises Aprovadas</p>
                <p className="text-2xl font-bold text-green-600">{estatisticas.analisesAprovadas}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Análises Rejeitadas</p>
                <p className="text-2xl font-bold text-red-600">{estatisticas.analisesRejeitadas}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Aprovação</p>
                <p className="text-2xl font-bold text-blue-600">
                  {estatisticas.analisesAprovadas + estatisticas.analisesRejeitadas > 0 
                    ? Math.round((estatisticas.analisesAprovadas / (estatisticas.analisesAprovadas + estatisticas.analisesRejeitadas)) * 100)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Filtros e Pesquisa */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
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
                  value={filtroRole}
                  onChange={(e) => setFiltroRole(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                >
                  <option value="TODOS">Todos os Roles</option>
                  <option value="cliente">Clientes</option>
                  <option value="preparador">Preparadores</option>
                  <option value="admin">Administradores</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Usuários do Sistema ({usuariosFiltrados.length})
            </h3>
          </div>

          {usuariosFiltrados.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum usuário encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Tente ajustar os filtros de pesquisa.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avaliações
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Análises
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cadastro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuariosFiltrados.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {usuario.perfil.nome_completo}
                          </div>
                          <div className="text-sm text-gray-500">
                            {usuario.email}
                          </div>
                          {usuario.perfil.telefone && (
                            <div className="text-sm text-gray-500">
                              {usuario.perfil.telefone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(usuario.perfil.role)}`}>
                          {getRoleIcon(usuario.perfil.role)}
                          {usuario.perfil.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                            usuario.avaliacoes.fisica 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            Física
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                            usuario.avaliacoes.nutricional 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            Nutricional
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {usuario.analises.total > 0 ? (
                          <div className="space-y-1">
                            <div className="text-xs">
                              Total: {usuario.analises.total}
                            </div>
                            {usuario.analises.pendentes > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                {usuario.analises.pendentes} pendente(s)
                              </span>
                            )}
                          </div>
                        ) : (
                          'Nenhuma'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatarData(usuario.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => navigate(`/admin/usuario/${usuario.id}`)}
                          className="text-purple-600 hover:text-purple-800 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Detalhes
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
    </AdminLayout>
  );
}