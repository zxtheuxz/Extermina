import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { 
  Brain, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Loader2,
  Info
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useActivityLoggerContext } from '../providers/ActivityLoggerProvider';
import MedidasCorporais from '../components/analise-corporal/MedidasCorporais';

export function AnaliseCorporal() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const navigate = useNavigate();
  const activityLogger = useActivityLoggerContext();

  useEffect(() => {
    async function loadAnalysisPage() {
      try {
        setLoading(true);
        
        // Buscar usuário logado
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Registrar acesso à página
          try {
            await activityLogger.logPageVisit('Página de Análise Corporal', '/analise-corporal');
          } catch (error) {
            console.error('Erro ao registrar acesso à página de análise corporal:', error);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar página de análise:', error);
        setError('Erro ao verificar sua sessão.');
      } finally {
        setLoading(false);
      }
    }

    loadAnalysisPage();
  }, [navigate, activityLogger]);

  if (loading) {
    return (
      <Layout>
        <div className={`flex items-center justify-center min-h-screen ${
          isDarkMode ? 'bg-black' : 'bg-gray-50'
        }`}>
          <div className="flex items-center space-x-3">
            <Loader2 className="animate-spin rounded-full h-12 w-12 text-purple-500" />
            <span className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Carregando análise corporal...
            </span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={`flex items-center justify-center min-h-screen ${
          isDarkMode ? 'bg-black' : 'bg-gray-50'
        }`}>
          <div className={`text-center max-w-md p-6 rounded-2xl shadow-xl ${
            isDarkMode 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-white border-gray-200'
          } border`}>
            <AlertTriangle className={`h-16 w-16 mx-auto mb-4 ${
              isDarkMode ? 'text-red-400' : 'text-red-500'
            }`} />
            <h2 className={`text-xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Erro
            </h2>
            <p className={`mb-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {error}
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 px-6 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white transition-all duration-200"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen ${
        isDarkMode ? 'bg-black' : 'bg-gray-50'
      } px-4 py-8`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className={`p-3 rounded-2xl mr-4 ${
                isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
              }`}>
                <Brain className={`h-8 w-8 ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`} />
              </div>
              <div>
                <h1 className={`text-4xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Análise Corporal
                </h1>
                <p className={`text-lg ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Análise automatizada de composição corporal
                </p>
              </div>
            </div>

            {/* Informações sobre a análise */}
            <div className={`p-6 rounded-2xl border mb-6 ${
              isDarkMode 
                ? 'bg-blue-900/20 border-blue-500/30' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start">
                <Info className={`h-6 w-6 mr-4 mt-1 flex-shrink-0 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isDarkMode ? 'text-blue-200' : 'text-blue-800'
                  }`}>
                    Como funciona a análise corporal?
                  </h3>
                  <div className={`text-sm space-y-2 ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-700'
                  }`}>
                    <p>
                      • <strong>Extração de medidas:</strong> Utilizamos tecnologia avançada para extrair medidas corporais precisas das suas fotos
                    </p>
                    <p>
                      • <strong>Cálculos científicos:</strong> Aplicamos fórmulas validadas científicamente para determinar composição corporal
                    </p>
                    <p>
                      • <strong>Análise de risco:</strong> Avaliamos indicadores de risco cardiometabólico baseados em evidências médicas
                    </p>
                    <p>
                      • <strong>Resultados visuais:</strong> Apresentamos os dados de forma clara com escalas coloridas e explicações detalhadas
                    </p>
                    
                    <div className={`mt-4 p-3 rounded-lg border-l-4 ${
                      isDarkMode 
                        ? 'bg-yellow-900/20 border-yellow-500/50' 
                        : 'bg-yellow-50 border-yellow-400'
                    }`}>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-yellow-200' : 'text-yellow-800'
                      }`}>
                        <strong>⚠️ Importante:</strong> O sistema de análise automatizada pode apresentar uma margem de variação de 0 a 5cm nas medidas corporais. Os resultados são estimativas baseadas em algoritmos avançados e devem ser considerados como referência orientativa.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards de recursos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className={`p-6 rounded-2xl border ${
                isDarkMode 
                  ? 'bg-gray-900 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className={`p-3 rounded-xl mb-4 w-fit ${
                  isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
                }`}>
                  <Activity className={`h-6 w-6 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`} />
                </div>
                <h3 className={`font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Composição Corporal
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Percentual de gordura, massa magra, TMB e outros indicadores essenciais
                </p>
              </div>

              <div className={`p-6 rounded-2xl border ${
                isDarkMode 
                  ? 'bg-gray-900 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className={`p-3 rounded-xl mb-4 w-fit ${
                  isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'
                }`}>
                  <TrendingUp className={`h-6 w-6 ${
                    isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  }`} />
                </div>
                <h3 className={`font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Escalas de Risco
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Avaliação de risco cardiometabólico com base em parâmetros científicos
                </p>
              </div>

              <div className={`p-6 rounded-2xl border ${
                isDarkMode 
                  ? 'bg-gray-900 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className={`p-3 rounded-xl mb-4 w-fit ${
                  isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                }`}>
                  <Brain className={`h-6 w-6 ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                </div>
                <h3 className={`font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Tecnologia Avançada
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Sistema automatizado para extração precisa de medidas corporais
                </p>
              </div>
            </div>
          </div>

          {/* Componente principal de análise */}
          <div className={`p-6 rounded-2xl shadow-lg border ${
            isDarkMode 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <MedidasCorporais />
          </div>
        </div>
      </div>
    </Layout>
  );
}