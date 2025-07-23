import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Target, Users, FileCheck, TrendingUp, Clock, BarChart3, AlertCircle, CheckCircle, Activity, Calendar, LogOut } from 'lucide-react';
import { AnalisesQueue } from '../../components/AnalisesQueue';

interface Perfil {
  nome_completo?: string;
  role?: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [stats, setStats] = useState({
    clientesAtivos: 0,
    avaliacoesPendentes: 0,
    programacoesHoje: 0,
    taxaSucesso: 0
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Buscar usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Buscar perfil do preparador
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
          
          const { count: avaliacoesPendentes } = await supabase
            .from('analises_medicamentos')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PENDENTE');
          
          const { count: programacoesHoje } = await supabase
            .from('avaliacao_fisica')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date().toISOString().split('T')[0]);
          
          setStats({
            clientesAtivos: clientesAtivos || 0,
            avaliacoesPendentes: avaliacoesPendentes || 0,
            programacoesHoje: programacoesHoje || 0,
            taxaSucesso: 92 // Valor fixo para demonstração
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

  const getNomePreparador = () => {
    if (perfil?.nome_completo) {
      return perfil.nome_completo.split(' ')[0];
    }
    return user?.email?.split('@')[0] || 'Preparador';
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
      <div className="flex items-center justify-center min-h-screen bg-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header Preparador */}
      <header className="bg-white shadow-sm border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-teal-700 rounded-xl flex items-center justify-center mr-3">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Preparador Dashboard
                </h1>
                <p className="text-sm text-slate-600">
                  Bem-vindo, {getNomePreparador()}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Clientes Ativos</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.clientesAtivos}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+5% esta semana</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Análises Pendentes</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.avaliacoesPendentes}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
              <div className="mt-4 flex items-center">
                <Clock className="w-4 h-4 text-orange-500 mr-1" />
                <span className="text-sm text-orange-600">Requer atenção</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Programações Hoje</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.programacoesHoje}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <div className="mt-4 flex items-center">
                <Activity className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-sm text-blue-600">Meta: 8 por dia</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-purple-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Taxa de Sucesso</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.taxaSucesso}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <div className="mt-4 flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">Excelente performance</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full">
            <AnalisesQueue />
          </div>

        </div>
      </div>
    </div>
  );
}