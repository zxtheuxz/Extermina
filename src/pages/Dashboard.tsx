import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Activity, Users, FileText, ArrowRight, Heart, Sparkles, ClipboardCheck, Scale, AlertTriangle, Utensils, CheckCircle, ClipboardList, BarChart, Download, TrendingUp, Target } from 'lucide-react';
import '../styles/global.css';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClass } from '../styles/theme';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { pwaManager } from '../lib/pwaManager';

interface Perfil {
  sexo?: string;
  nome_completo?: string;
  liberado?: string; // 'sim' ou 'nao'
  resultado_fisica?: string; // Texto com o resultado da programação física
  resultado_nutricional?: string; // Texto com o resultado da programação nutricional
  role?: string; // 'cliente', 'preparador' ou 'admin'
}

// Adicione essa interface para o evento beforeinstallprompt logo no início do arquivo, após as outras interfaces
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [roleChecked, setRoleChecked] = useState(false);
  const [programacoes, setProgramacoes] = useState({
    fisica: false,
    nutricional: false
  });
  const [perfilLiberado, setPerfilLiberado] = useState(false);
  const [mostrarAviso, setMostrarAviso] = useState(false);
  const [formulariosCompletos, setFormulariosCompletos] = useState(false);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [showResultadoFisica, setShowResultadoFisica] = useState(false);
  const [showResultadoNutricional, setShowResultadoNutricional] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);





  // Efeito principal para carregar dados do usuário
  useEffect(() => {
    async function getUser() {
      try {
        setLoading(true);
        console.log('Buscando usuário...');
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          console.log("Usuário autenticado:", user.id);

          // Buscar o perfil do usuário para obter o sexo, nome completo e role
          const { data: perfilData, error: perfilError } = await supabase
            .from('perfis')
            .select('sexo, nome_completo, liberado, resultado_fisica, resultado_nutricional, role')
            .eq('user_id', user.id)
            .single();

          if (perfilError) {
            console.error('Erro ao buscar perfil do usuário:', perfilError);
            setError('Erro ao carregar seu perfil. Por favor, tente novamente mais tarde.');
          } else {
            console.log('Perfil do usuário:', perfilData);
            console.log('Sexo do usuário:', perfilData?.sexo);
            console.log('Tipo do sexo:', typeof perfilData?.sexo);
            console.log('Status de liberação:', perfilData?.liberado);
            console.log('Role do usuário:', perfilData?.role);
            setPerfil(perfilData);
            
            // Verificar se é admin ou preparador e redirecionar
            if (perfilData?.role === 'admin') {
              console.log('Usuário é admin, redirecionando...');
              navigate('/admin/dashboard');
              return;
            } else if (perfilData?.role === 'preparador') {
              console.log('Usuário é preparador, redirecionando...');
              navigate('/preparador/dashboard');
              return;
            }
            
            setRoleChecked(true);
            
            // Definir corretamente o estado de liberação do perfil
            if (perfilData?.liberado && typeof perfilData.liberado === 'string') {
              const liberado = perfilData.liberado.toLowerCase() === 'sim';
              setPerfilLiberado(liberado);
              console.log('perfilLiberado definido como:', liberado);
            } else {
              // Não forçar mais para true, respeitar o valor do banco de dados
              setPerfilLiberado(false);
              console.log('perfilLiberado definido como:', false);
            }
          }

          // Verificar se o usuário já tem avaliações físicas - usando contagem para maior precisão
          const { count: countFisica, error: errorFisicaCount } = await supabase
            .from('avaliacao_fisica')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          
          if (errorFisicaCount) {
            console.error('Erro ao contar avaliações físicas:', errorFisicaCount);
          }
          
          const temAvaliacaoFisica = countFisica !== null && countFisica > 0;
          console.log('Contagem de avaliações físicas:', countFisica);
          console.log('Tem avaliação física:', temAvaliacaoFisica);

          // Verificar se o usuário já tem avaliações nutricionais - usando contagem para maior precisão
          // Verificar primeiro na tabela avaliacao_nutricional
          let countNutricional = 0;
          const { count: countNutri, error: errorNutriCount } = await supabase
            .from('avaliacao_nutricional')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          
          if (errorNutriCount) {
            console.error('Erro ao contar avaliações nutricionais:', errorNutriCount);
          } else {
            countNutricional = countNutri || 0;
          }
          
          // Verificar também na tabela avaliacao_nutricional_feminino
          // Verificar independente do sexo para garantir que o formulário seja contabilizado
          console.log('Verificando avaliação nutricional feminina independente do sexo');
          
          // Primeiro vamos verificar se o registro existe
          const { data: avaliacaoFem, error: errorFemGet } = await supabase
            .from('avaliacao_nutricional_feminino')
            .select('id, user_id')
            .eq('user_id', user.id);
            
          console.log('Avaliação nutricional feminina encontrada:', avaliacaoFem);
          
          if (errorFemGet) {
            console.error('Erro ao buscar avaliação nutricional feminina:', errorFemGet);
          }
          
          // Agora fazemos a contagem
          const { count: countNutriFem, error: errorNutriFemCount } = await supabase
            .from('avaliacao_nutricional_feminino')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          
          console.log('Contagem de avaliações nutricionais femininas:', countNutriFem);
          
          if (errorNutriFemCount) {
            console.error('Erro ao contar avaliações nutricionais femininas:', errorNutriFemCount);
          } else {
            countNutricional += countNutriFem || 0;
            console.log('Contagem nutricional atualizada para:', countNutricional);
          }

          // Verificar se o usuário tem avaliação nutricional
          // Verificação mais rigorosa para garantir que o formulário realmente existe
          let temAvaliacaoNutricional = countNutricional > 0;
          
          // Verificação adicional para garantir que o formulário feminino seja contabilizado corretamente
          if (Array.isArray(avaliacaoFem) && avaliacaoFem.length > 0) {
            temAvaliacaoNutricional = true;
          }
          
          console.log('Contagem total de avaliações nutricionais:', countNutricional);
          console.log('Tem avaliação nutricional (com verificação direta):', temAvaliacaoNutricional);

          // Atualizar o estado das avaliações
          setProgramacoes({
            fisica: temAvaliacaoFisica,
            nutricional: temAvaliacaoNutricional
          });
          
          console.log('Programações definidas como:', { fisica: temAvaliacaoFisica, nutricional: temAvaliacaoNutricional });
          
          // Verificar se ambos os formulários estão preenchidos para mostrar o aviso
          const ambosFormulariosPreenchidos = temAvaliacaoFisica && temAvaliacaoNutricional;
          setFormulariosCompletos(ambosFormulariosPreenchidos);
          
          console.log('Ambos formulários preenchidos:', ambosFormulariosPreenchidos);
          console.log('Perfil liberado:', perfilData?.liberado);
          
          // Verificação mais rigorosa para mostrar o aviso apenas quando ambos os formulários estiverem preenchidos
          // e o perfil estiver liberado com o valor 'sim'
          if (ambosFormulariosPreenchidos && perfilData?.liberado?.toLowerCase() === 'sim') {
            console.log('Ambos os formulários estão preenchidos e perfil liberado, mostrando aviso');
            setMostrarAviso(true);
          } else {
            console.log('Não mostrando aviso: formulários completos =', ambosFormulariosPreenchidos, 'perfil liberado =', perfilData?.liberado);
            setMostrarAviso(false);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        setError('Erro ao verificar sua sessão. Por favor, faça login novamente.');
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, [navigate]);

  // Detector de evento beforeinstallprompt - executa antes do componente ser montado
  useEffect(() => {
    console.log('[Dashboard] Configurando detecção de PWA...');
    
    // Força mostrar o botão de instalação se o navegador suportar PWA
    if (pwaManager.forceShowInstallButton()) {
      console.log('[Dashboard] Navegador suporta PWA, mostrando botão de instalação');
      setShowInstallButton(true);
    }
    
    // Função para verificar e atualizar o estado do botão de instalação
    const checkInstallable = () => {
      // Verifica se o app já está instalado
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallButton(false);
        return;
      }
      
      // Verifica se o app pode ser instalado usando o localStorage
      if (localStorage.getItem('pwaInstallable') === 'true') {
        console.log('[Dashboard] PWA é instalável de acordo com localStorage');
        setShowInstallButton(true);
        
        // Se temos o evento global, podemos usá-lo
        if (window._pwaPrompt) {
          console.log('[Dashboard] Evento global _pwaPrompt encontrado, salvando no estado');
          setDeferredPrompt(window._pwaPrompt);
        }
      }
    };
    
    // Verifica imediatamente
    checkInstallable();
    
    // Listener para o evento customizado
    const handlePwaPromptAvailable = () => {
      console.log('[Dashboard] Evento pwaPromptAvailable recebido');
      setShowInstallButton(true);
      if (window._pwaPrompt) {
        setDeferredPrompt(window._pwaPrompt);
      }
    };
    
    // Listener para quando o PWA é instalado
    const handlePwaInstalled = () => {
      console.log('[Dashboard] Evento pwaInstalled recebido');
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };
    
    // Adiciona os listeners para os eventos customizados
    document.addEventListener('pwaPromptAvailable', handlePwaPromptAvailable);
    document.addEventListener('pwaInstalled', handlePwaInstalled);
    
    // Configura verificação periódica (a cada 2 segundos)
    const checkInterval = setInterval(() => {
      checkInstallable();
    }, 2000);
    
    // Adiciona listeners locais para garantir sincronização do estado
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[Dashboard] Evento beforeinstallprompt capturado localmente');
      setShowInstallButton(true);
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Atualiza estado quando o app for instalado
    window.addEventListener('appinstalled', () => {
      console.log('[Dashboard] PWA instalado, atualizando estado');
      setShowInstallButton(false);
      setDeferredPrompt(null);
    });
    
    // Limpa quando o componente for desmontado
    return () => {
      clearInterval(checkInterval);
      document.removeEventListener('pwaPromptAvailable', handlePwaPromptAvailable);
      document.removeEventListener('pwaInstalled', handlePwaInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Força exibição do botão de instalação quando o componente for montado
  useEffect(() => {
    if (!loading && user) {
      console.log('[Dashboard] Usuário logado, verificando dispositivo para botão de instalação');
      
      // Força mostrar o botão de instalação baseado no tipo de dispositivo
      const isMobile = pwaManager.isMobileDevice();
      
      if (isMobile) {
        console.log('[Dashboard] Dispositivo móvel detectado, priorizando botão de instalação');
        setShowInstallButton(true);
        
        // Em dispositivos móveis, vamos verificar a cada 5 segundos em caso de evento perdido
        const mobileInterval = setInterval(() => {
          if (pwaManager.forceShowInstallButton() || localStorage.getItem('pwaInstallable') === 'true') {
            setShowInstallButton(true);
          }
        }, 5000);
        
        return () => clearInterval(mobileInterval);
      } else if (pwaManager.forceShowInstallButton()) {
        console.log('[Dashboard] Desktop com suporte a PWA, mostrando botão de instalação');
        setShowInstallButton(true);
      }
    }
  }, [loading, user]);

  // Função para instalar o PWA
  const installPWA = async () => {
    console.log('[Dashboard] Tentando instalar PWA');
    console.log('[Dashboard] deferredPrompt:', deferredPrompt ? 'disponível' : 'não disponível');
    console.log('[Dashboard] Evento global:', window._pwaPrompt ? 'disponível' : 'não disponível');
    
    // Tenta usar o evento salvo no componente
    if (deferredPrompt) {
      try {
        console.log('[Dashboard] Usando evento do estado para instalação');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[Dashboard] Usuário ${outcome === 'accepted' ? 'aceitou' : 'recusou'} a instalação`);
        // Limpa após o uso
        setDeferredPrompt(null);
      } catch (error) {
        console.error('[Dashboard] Erro ao instalar PWA com evento do estado:', error);
      }
    } 
    // Tenta usar o evento global
    else if (window._pwaPrompt) {
      try {
        console.log('[Dashboard] Usando evento global para instalação');
        window._pwaPrompt.prompt();
        const { outcome } = await window._pwaPrompt.userChoice;
        console.log(`[Dashboard] Usuário ${outcome === 'accepted' ? 'aceitou' : 'recusou'} a instalação`);
        window._pwaPrompt = null;
        localStorage.removeItem('pwaInstallable');
      } catch (error) {
        console.error('[Dashboard] Erro ao instalar PWA com evento global:', error);
      }
    } 
    // Sem evento disponível
    else {
      console.log('[Dashboard] Nenhum evento disponível, mostrando instrução manual');
      alert('Para instalar o app, use a opção "Adicionar à tela inicial" ou "Instalar" no menu do seu navegador');
    }
  };

  // Função para ir para a aba de resultados
  const irParaResultados = () => {
    console.log('Navegando para a página de resultados');
    navigate('/resultados');
    setMostrarAviso(false);
  };

  // Efeito para esconder o aviso quando a aba de resultados estiver ativa
  useEffect(() => {
    if (formulariosCompletos && perfil?.liberado?.toLowerCase() === 'sim') {
      console.log('Formulários completos e perfil liberado, mostrando aviso');
      setMostrarAviso(true);
    } else {
      console.log('Condições não atendidas, escondendo aviso');
      setMostrarAviso(false);
    }
  }, [formulariosCompletos, perfil?.liberado]);

  // Função para obter o nome de exibição do usuário
  const getNomeExibicao = () => {
    if (perfil?.nome_completo) {
      // Se tiver nome completo, pega o primeiro nome
      const primeiroNome = perfil.nome_completo.split(' ')[0];
      return primeiroNome;
    }
    
    // Se não tiver nome completo, usa o email sem o domínio
    return user?.email?.split('@')[0] || 'Usuário';
  };

  // Função para determinar qual formulário nutricional mostrar com base no sexo
  const getNutricionalLink = () => {
    console.log('Perfil completo:', perfil);
    console.log('Sexo do usuário:', perfil?.sexo);
    console.log('Tipo do sexo:', typeof perfil?.sexo);
    console.log('Sexo em lowercase:', perfil?.sexo?.toLowerCase());
    
    if (perfil?.sexo?.toLowerCase() === 'feminino') {
      console.log('Redirecionando para formulário feminino');
      return '/avaliacao-nutricional/feminino';
    } else if (perfil?.sexo?.toLowerCase() === 'masculino') {
      console.log('Redirecionando para formulário masculino');
      return '/avaliacao-nutricional/masculino';
    } else {
      console.log('Sexo não definido, redirecionando para configurações');
      setError('Por favor, configure seu perfil com o sexo antes de prosseguir.');
      return '/configuracoes';
    }
  };

  if (loading || !roleChecked) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${
        isDarkMode ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${
        isDarkMode ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className={`text-center max-w-md p-6 rounded-2xl shadow-xl ${
          isDarkMode 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-white border-gray-200'
        } border`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isDarkMode ? 'bg-red-900/30' : 'bg-red-100'
          }`}>
            <AlertTriangle className={`h-8 w-8 ${
              isDarkMode ? 'text-red-400' : 'text-red-500'
            }`} />
          </div>
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
            onClick={() => navigate('/login')}
            className="w-full py-3 px-6 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white transition-all duration-200"
          >
            Voltar para o Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen ${
        isDarkMode ? 'bg-black' : 'bg-gray-50'
      } px-4 py-8`}>
        
        <div className="max-w-7xl mx-auto">
          {/* Banner de instalação do app */}
          {showInstallButton && (
            <div className={`mb-8 p-4 rounded-2xl shadow-lg border ${
              isDarkMode 
                ? 'bg-gray-900 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex flex-col md:flex-row md:justify-between items-center">
                <div className="flex items-center mb-3 md:mb-0">
                  <Download className="h-5 w-5 text-orange-500 mr-3" />
                  <p className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Instale o app para uma experiência melhor
                  </p>
                </div>
                <button
                  onClick={installPWA}
                  className="w-full md:w-auto py-2 px-4 rounded-xl font-medium bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white transition-all duration-200"
                >
                  Instalar App
                </button>
              </div>
            </div>
          )}
          
          {sucesso ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className={`rounded-full p-6 mb-6 ${
                isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
              }`}>
                <CheckCircle className={`h-16 w-16 ${
                  isDarkMode ? 'text-green-400' : 'text-green-500'
                }`} />
              </div>
              <h2 className={`text-3xl font-bold mb-4 text-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Programação Nutricional Enviada
              </h2>
              <p className={`text-center max-w-md mb-8 text-lg ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Sua programação foi recebida e está sendo analisada por nossos especialistas.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white transition-all duration-200"
              >
                Voltar para o Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="w-full md:w-auto mb-4 md:mb-0">
                  <h1 className={`text-4xl font-bold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Bem-vindo, {getNomeExibicao()}
                  </h1>
                  <p className={`text-lg ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Sua jornada de transformação está acontecendo
                  </p>
                </div>
                <div className="flex space-x-6 w-full md:w-auto justify-start">
                  <Link 
                    to="/programacoes" 
                    className={`pb-4 px-1 border-b-2 border-orange-500 font-medium flex items-center gap-2 transition-all ${
                      isDarkMode ? 'text-orange-400' : 'text-orange-600'
                    }`}
                  >
                    <ClipboardList size={20} />
                    <span>Programações</span>
                  </Link>
                  <Link 
                    to="/resultados" 
                    className={`pb-4 px-1 font-medium flex items-center gap-2 transition-all hover:${
                      isDarkMode ? 'text-orange-400' : 'text-orange-600'
                    } ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    <BarChart size={20} />
                    <span>Resultados</span>
                  </Link>
                </div>
              </div>
              
              {/* Status Cards */}
              {mostrarAviso && (
                <div className={`mb-8 p-6 rounded-2xl shadow-lg border ${
                  isDarkMode 
                    ? 'bg-green-900/20 border-green-500/30' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-start">
                    <div className={`rounded-full p-2 mr-4 ${
                      isDarkMode ? 'bg-green-500' : 'bg-green-600'
                    }`}>
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold mb-2 ${
                        isDarkMode ? 'text-green-400' : 'text-green-700'
                      }`}>
                        Programações Concluídas
                      </h3>
                      <p className={`mb-4 ${
                        isDarkMode ? 'text-green-200' : 'text-green-800'
                      }`}>
                        Você completou todas as programações necessárias. Seus resultados personalizados estão prontos para download.
                      </p>
                      <button 
                        onClick={() => navigate('/resultados')}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 font-medium"
                      >
                        Ver Resultados
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {formulariosCompletos && !perfilLiberado && (
                <div className={`mb-8 p-6 rounded-2xl shadow-lg border ${
                  isDarkMode 
                    ? 'bg-yellow-900/20 border-yellow-500/30' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-start">
                    <div className={`rounded-full p-2 mr-4 ${
                      isDarkMode ? 'bg-yellow-500' : 'bg-yellow-600'
                    }`}>
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold mb-2 ${
                        isDarkMode ? 'text-yellow-400' : 'text-yellow-700'
                      }`}>
                        Programações em Análise
                      </h3>
                      <p className={`${
                        isDarkMode ? 'text-yellow-200' : 'text-yellow-800'
                      }`}>
                        Você completou todas as programações. Nossa equipe está analisando seus dados para criar o plano perfeito.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Main Cards */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Card Programação Física */}
                <div className={`rounded-2xl shadow-lg border transition-all duration-200 hover:shadow-xl ${
                  isDarkMode 
                    ? 'bg-gray-900 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center mr-4">
                        <Activity className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h2 className={`text-2xl font-bold mb-1 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Programação Física
                        </h2>
                        <p className="text-sm font-medium text-purple-600">
                          {programacoes.fisica 
                            ? (perfil?.liberado?.toLowerCase() === 'sim' ? "Treino personalizado pronto" : "Aguardando análise")
                            : "Avaliação pendente"}
                        </p>
                      </div>
                    </div>
                    
                    <p className={`mb-6 leading-relaxed ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {programacoes.fisica 
                        ? (perfil?.liberado?.toLowerCase() === 'sim'
                          ? "Sua programação física está pronta. Acesse seus resultados personalizados e baixe seu plano de treino completo."
                          : "Sua programação física foi enviada com sucesso. Nossa equipe está analisando seus dados para criar o treino perfeito.")
                        : "Complete sua avaliação física para receber um plano de treino personalizado baseado em seus objetivos e condicionamento atual."}
                    </p>
                    
                    <button 
                      onClick={() => navigate(programacoes.fisica && perfil?.liberado?.toLowerCase() === 'sim' ? '/resultado-fisico' : '/avaliacao-fisica')}
                      className={`inline-flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                        programacoes.fisica && perfil?.liberado?.toLowerCase() !== 'sim'
                          ? 'bg-gray-400 cursor-not-allowed text-white'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                      }`}
                      disabled={programacoes.fisica && perfil?.liberado?.toLowerCase() !== 'sim'}
                    >
                      {programacoes.fisica 
                        ? (perfil?.liberado?.toLowerCase() === 'sim' ? "Ver Treino" : "Em Preparação") 
                        : "Iniciar Avaliação"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className={`px-8 py-4 border-t flex items-center text-sm ${
                    isDarkMode 
                      ? 'bg-purple-900/10 border-purple-500/20 text-gray-400' 
                      : 'bg-purple-50 border-purple-200 text-gray-600'
                  }`}>
                    <TrendingUp className="h-4 w-4 mr-3 text-purple-600" />
                    <span>Análise corporal e medidas físicas</span>
                  </div>
                </div>

                {/* Card Programação Nutricional */}
                <div className={`rounded-2xl shadow-lg border transition-all duration-200 hover:shadow-xl ${
                  isDarkMode 
                    ? 'bg-gray-900 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center mr-4">
                        <Utensils className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h2 className={`text-2xl font-bold mb-1 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Programação Nutricional
                        </h2>
                        <p className="text-sm font-medium text-orange-600">
                          {programacoes.nutricional 
                            ? (perfil?.liberado?.toLowerCase() === 'sim' ? "Plano alimentar pronto" : "Aguardando análise")
                            : "Avaliação pendente"}
                        </p>
                      </div>
                    </div>
                    
                    <p className={`mb-6 leading-relaxed ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {programacoes.nutricional 
                        ? (perfil?.liberado?.toLowerCase() === 'sim'
                          ? "Sua programação nutricional está pronta. Acesse sua dieta personalizada e baixe seu plano alimentar completo."
                          : "Sua programação nutricional foi enviada com sucesso. Nossa equipe está criando sua dieta personalizada.")
                        : "Complete sua avaliação nutricional para receber um plano alimentar personalizado baseado em seus hábitos e objetivos."}
                    </p>
                    
                    <button 
                      onClick={() => navigate(programacoes.nutricional && perfil?.liberado?.toLowerCase() === 'sim' ? '/resultado-nutricional' : getNutricionalLink())}
                      className={`inline-flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                        programacoes.nutricional && perfil?.liberado?.toLowerCase() !== 'sim'
                          ? 'bg-gray-400 cursor-not-allowed text-white'
                          : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white'
                      }`}
                      disabled={programacoes.nutricional && perfil?.liberado?.toLowerCase() !== 'sim'}
                    >
                      {programacoes.nutricional 
                        ? (perfil?.liberado?.toLowerCase() === 'sim' ? "Ver Dieta" : "Em Preparação") 
                        : "Iniciar Avaliação"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className={`px-8 py-4 border-t flex items-center text-sm ${
                    isDarkMode 
                      ? 'bg-orange-900/10 border-orange-500/20 text-gray-400' 
                      : 'bg-orange-50 border-orange-200 text-gray-600'
                  }`}>
                    <Target className="h-4 w-4 mr-3 text-orange-600" />
                    <span>Hábitos alimentares e objetivos nutricionais</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
