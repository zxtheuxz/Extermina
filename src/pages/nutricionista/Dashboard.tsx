import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Apple, Users, FileCheck, TrendingUp, Clock, BarChart3, AlertCircle, CheckCircle, Activity, Calendar, LogOut, Salad, ChefHat, Brain } from 'lucide-react';
import { AvaliacoesNutricionaisQueue } from '../../components/nutricionista/AvaliacoesNutricionaisQueue';
import { AnaliseCorporalQueue } from '../../components/shared/AnaliseCorporalQueue';
import { ClientesAptosCorporal } from '../../components/nutricionista/ClientesAptosCorporal';

interface Perfil {
  nome_completo?: string;
  role?: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [activeTab, setActiveTab] = useState<'masculino' | 'feminino' | 'corporal'>('masculino');
  const [stats, setStats] = useState({
    clientesAtivos: 0,
    avaliacoesMasculinoPendentes: 0,
    avaliacoesFemininoPendentes: 0,
    analisesCorporaisPendentes: 0,
    avaliacoesHoje: 0,
    taxaAdesao: 0
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Buscar usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Buscar perfil do nutricionista
          const { data: perfilData } = await supabase
            .from('perfis')
            .select('nome_completo, role')
            .eq('user_id', user.id)
            .single();
          
          setPerfil(perfilData);
          
          // Buscar estatísticas dos clientes
          const { count: clientesAtivos } = await supabase
            .from('perfis')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'cliente')
            .eq('liberado', 'sim');
          
          const { count: avaliacoesMasculino } = await supabase
            .from('aprovacoes_nutricionais')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PENDENTE')
            .eq('tipo_avaliacao', 'masculino');
          
          const { count: avaliacoesFeminino } = await supabase
            .from('aprovacoes_nutricionais')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PENDENTE')
            .eq('tipo_avaliacao', 'feminino');
          
          const { count: avaliacoesHoje } = await supabase
            .from('aprovacoes_nutricionais')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date().toISOString().split('T')[0]);
          
          const { count: analisesCorporais } = await supabase
            .from('medidas_corporais')
            .select('*', { count: 'exact', head: true });
          
          setStats({
            clientesAtivos: clientesAtivos || 0,
            avaliacoesMasculinoPendentes: avaliacoesMasculino || 0,
            avaliacoesFemininoPendentes: avaliacoesFeminino || 0,
            analisesCorporaisPendentes: analisesCorporais || 0,
            avaliacoesHoje: avaliacoesHoje || 0,
            taxaAdesao: 87 // Valor fixo para demonstração
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  const getNomeNutricionista = () => {
    if (perfil?.nome_completo) {
      return perfil.nome_completo.split(' ')[0];
    }
    return user?.email?.split('@')[0] || 'Nutricionista';
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/staff');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amber-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header Nutricionista */}
      <header className="bg-white shadow-sm border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-orange-700 rounded-xl flex items-center justify-center mr-3">
                <Apple className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Dashboard Nutricional
                </h1>
                <p className="text-sm text-slate-600">
                  Bem-vindo, {getNomeNutricionista()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-slate-600">Ativo</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Status Info */}
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-slate-600">Status: Ativo</span>
              <span className="text-xs text-slate-400 ml-2">
                Última atualização: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Clientes Ativos</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.clientesAtivos}</p>
                </div>
                <Users className="w-8 h-8 text-amber-600" />
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+8% este mês</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Avaliações Masculino</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.avaliacoesMasculinoPendentes}</p>
                </div>
                <ChefHat className="w-8 h-8 text-blue-600" />
              </div>
              <div className="mt-4 flex items-center">
                <Clock className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-sm text-blue-600">Pendentes</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-pink-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Avaliações Feminino</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.avaliacoesFemininoPendentes}</p>
                </div>
                <Salad className="w-8 h-8 text-pink-600" />
              </div>
              <div className="mt-4 flex items-center">
                <Clock className="w-4 h-4 text-pink-500 mr-1" />
                <span className="text-sm text-pink-600">Pendentes</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Análises Corporais</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.analisesCorporaisPendentes}</p>
                </div>
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <div className="mt-4 flex items-center">
                <Activity className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-sm text-blue-600">Disponíveis para revisão</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Taxa de Adesão</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.taxaAdesao}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <div className="mt-4 flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">Ótimo desempenho</span>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('masculino')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'masculino'
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4" />
                    Avaliações Masculino
                    {stats.avaliacoesMasculinoPendentes > 0 && (
                      <span className="ml-2 bg-blue-100 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full">
                        {stats.avaliacoesMasculinoPendentes}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('feminino')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'feminino'
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Salad className="w-4 h-4" />
                    Avaliações Feminino
                    {stats.avaliacoesFemininoPendentes > 0 && (
                      <span className="ml-2 bg-pink-100 text-pink-600 text-xs font-medium px-2 py-0.5 rounded-full">
                        {stats.avaliacoesFemininoPendentes}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('corporal')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'corporal'
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Análise Corporal
                    {stats.analisesCorporaisPendentes > 0 && (
                      <span className="ml-2 bg-blue-100 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full">
                        {stats.analisesCorporaisPendentes}
                      </span>
                    )}
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full">
            {activeTab === 'corporal' ? (
              <div className="space-y-8">
                {/* Clientes aptos para gerar análise */}
                <ClientesAptosCorporal />
                
                {/* Divisor */}
                <div className="border-t border-slate-200 pt-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Análises Corporais Processadas</h3>
                  <AnaliseCorporalQueue userRole="nutricionista" />
                </div>
              </div>
            ) : (
              <AvaliacoesNutricionaisQueue tipoAvaliacao={activeTab as 'masculino' | 'feminino'} />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}