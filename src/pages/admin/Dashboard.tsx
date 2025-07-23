import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Shield, Users, BarChart3, Settings, FileText, Database, AlertTriangle, TrendingUp, Activity, Clock, LogOut, Phone } from 'lucide-react';
import { ClientesList } from '../../components/ClientesList';
import { TelefonesAutorizados } from '../../components/TelefonesAutorizados';
import { useAuth } from '../../contexts/AuthContext';

interface Perfil {
  nome_completo?: string;
  role?: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user: authUser, userProfile, isAuthenticated, hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [activeTab, setActiveTab] = useState<'usuarios' | 'telefones'>('usuarios');
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    usuariosAtivos: 0,
    analisesHoje: 0,
    analisesPendentes: 0,
    sistemaStatus: 'online'
  });

  // Verificação adicional de segurança - verificar se usuário tem permissão admin
  useEffect(() => {
    if (!isAuthenticated || !userProfile || !hasRole(['admin'])) {
      console.log('Admin Dashboard: Acesso negado, redirecionando para /staff');
      navigate('/staff');
      return;
    }
  }, [isAuthenticated, userProfile, hasRole, navigate]);

  const handleClienteSelect = (cliente: any) => {
    console.log('Cliente selecionado:', cliente);
    // Aqui você pode adicionar ações específicas quando um cliente é selecionado
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Buscar usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Buscar perfil do admin
          const { data: perfilData } = await supabase
            .from('perfis')
            .select('nome_completo, role')
            .eq('user_id', user.id)
            .single();
          
          setPerfil(perfilData);
          
          // Buscar estatísticas do sistema
          const { count: totalUsuarios } = await supabase
            .from('perfis')
            .select('*', { count: 'exact', head: true });
          
          const { count: usuariosAtivos } = await supabase
            .from('perfis')
            .select('*', { count: 'exact', head: true })
            .eq('liberado', 'sim');
          
          const { count: analisesHoje } = await supabase
            .from('analises_medicamentos')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date().toISOString().split('T')[0]);

          const { count: analisesPendentes } = await supabase
            .from('analises_medicamentos')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PENDENTE');
          
          setStats({
            totalUsuarios: totalUsuarios || 0,
            usuariosAtivos: usuariosAtivos || 0,
            analisesHoje: analisesHoje || 0,
            analisesPendentes: analisesPendentes || 0,
            sistemaStatus: 'online'
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

  const getNomeAdmin = () => {
    if (userProfile?.nome_completo) {
      return userProfile.nome_completo.split(' ')[0];
    }
    if (perfil?.nome_completo) {
      return perfil.nome_completo.split(' ')[0];
    }
    return authUser?.email?.split('@')[0] || user?.email?.split('@')[0] || 'Admin';
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Admin */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-slate-700 rounded-xl flex items-center justify-center mr-3">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-slate-600">
                  Bem-vindo, {getNomeAdmin()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-slate-600">Online</span>
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
              <span className="text-sm text-slate-600">Sistema Online</span>
              <span className="text-xs text-slate-400 ml-2">
                Última atualização: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total de Usuários</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalUsuarios}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+12% este mês</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Usuários Ativos</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.usuariosAtivos}</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+8% esta semana</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Análises Hoje</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.analisesHoje}</p>
                </div>
                <FileText className="w-8 h-8 text-orange-600" />
              </div>
              <div className="mt-4 flex items-center">
                <Clock className="w-4 h-4 text-slate-500 mr-1" />
                <span className="text-sm text-slate-600">Últimas 24h</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Análises Pendentes</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.analisesPendentes}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              <div className="mt-4 flex items-center">
                <Clock className="w-4 h-4 text-amber-500 mr-1" />
                <span className="text-sm text-amber-600">Requer atenção</span>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('usuarios')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'usuarios'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Gerenciamento de Usuários
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('telefones')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'telefones'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telefones Autorizados
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="w-full">
            {activeTab === 'usuarios' && (
              <ClientesList onClienteSelect={handleClienteSelect} />
            )}
            
            {activeTab === 'telefones' && (
              <TelefonesAutorizados />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}