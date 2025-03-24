import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Activity, Users, FileText, ArrowRight, Heart, Sparkles, ClipboardCheck, Scale, AlertTriangle, Utensils, CheckCircle, ClipboardList, BarChart, Download } from 'lucide-react';
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
  resultado_fisica?: string; // Texto com o resultado da avaliação física
  resultado_nutricional?: string; // Texto com o resultado da avaliação nutricional
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
  const [avaliacoes, setAvaliacoes] = useState({
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

  // Adicionar um log para depuração
  useEffect(() => {
    console.log('Dashboard renderizado');
    console.log('Tema atual:', theme);
    console.log('Usuário:', user);
    console.log('Perfil:', perfil);
    console.log('Botão de instalação visível:', showInstallButton);
    console.log('Evento deferredPrompt disponível:', deferredPrompt ? 'Sim' : 'Não');
    
    // Garantir que o conteúdo seja visível
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (dashboardContainer) {
      (dashboardContainer as HTMLElement).style.display = 'block';
      (dashboardContainer as HTMLElement).style.visibility = 'visible';
      (dashboardContainer as HTMLElement).style.opacity = '1';
    }
  }, [theme, user, perfil, showInstallButton, deferredPrompt]);

  // Atualize o estilo da scrollbar dinamicamente
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = isDarkMode
      ? `::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.2); }`
      : `::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.2); }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, [isDarkMode]);

  // Modifique o efeito de aplicação do background
  useEffect(() => {
    // Aplicar um background mais suave para o tema claro
    const applyBackground = () => {
      if (isDarkMode) {
        document.documentElement.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)';
        document.body.style.backgroundImage = "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%234f46e5' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E\")";
      } else {
        document.documentElement.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)';
        document.body.style.backgroundImage = "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%234f46e5' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E\")";
      }
      
      // Adicionar um estilo global para garantir que o conteúdo seja visível
      const style = document.createElement('style');
      style.textContent = `
        .dashboard-container {
          background-color: ${isDarkMode ? 'var(--brand-bg)' : 'var(--brand-bg)'};
          color: ${isDarkMode ? 'var(--brand-text)' : 'var(--brand-text)'};
          display: block !important;
          min-height: 100vh;
          width: 100%;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        .dashboard-card {
          background-color: ${isDarkMode ? 'var(--brand-card-bg)' : 'var(--brand-card-bg)'};
          border-color: ${isDarkMode ? 'var(--brand-card-border)' : 'var(--brand-card-border)'};
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => style.remove();
    };
    
    applyBackground();
  }, [isDarkMode]);

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

          // Buscar o perfil do usuário para obter o sexo e nome completo
          const { data: perfilData, error: perfilError } = await supabase
            .from('perfis')
            .select('sexo, nome_completo, liberado, resultado_fisica, resultado_nutricional')
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
            setPerfil(perfilData);
            
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
          setAvaliacoes({
            fisica: temAvaliacaoFisica,
            nutricional: temAvaliacaoNutricional
          });
          
          console.log('Avaliações definidas como:', { fisica: temAvaliacaoFisica, nutricional: temAvaliacaoNutricional });
          
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-theme">
        <div className="text-center max-w-md p-6 card shadow-theme-md">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-theme mb-2">Erro</h2>
          <p className="text-theme-secondary mb-4">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="btn btn-primary"
          >
            Voltar para o Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen ${getThemeClass(isDarkMode, 'background')} px-4 py-8`}>
        <div className="max-w-7xl mx-auto">
          {/* Banner de instalação do app - visível especialmente em mobile */}
          {showInstallButton && (
            <div className="mb-6 p-3 md:p-4 bg-indigo-600 dark:bg-indigo-500 rounded-lg shadow-lg animate-pulse-slow">
              <div className="flex flex-col md:flex-row md:justify-between items-center">
                <div className="flex items-center justify-center mb-3 md:mb-0">
                  <Download className="h-6 w-6 md:h-5 md:w-5 text-white mr-2" />
                  <p className="text-sm md:text-base font-medium text-white">
                    Instale o app para uma experiência melhor
                  </p>
                </div>
                <button
                  onClick={installPWA}
                  className="w-full md:w-auto py-2 px-4 rounded-lg text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  Instalar App
                </button>
              </div>
            </div>
          )}
          
          {sucesso ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn">
              <div className={`${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'} rounded-full p-6 mb-6`}>
                <CheckCircle className={`h-16 w-16 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
              </div>
              <h2 className={`text-2xl md:text-3xl font-bold mb-4 text-center ${getThemeClass(isDarkMode, 'text')}`}>
                Avaliação Nutricional Enviada com Sucesso!
              </h2>
              <p className={`${getThemeClass(isDarkMode, 'textSecondary')} text-center max-w-md mb-8 text-lg`}>
                Sua avaliação foi recebida e está sendo analisada por nossos especialistas.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className={`${getThemeClass(isDarkMode, 'button')} px-6 py-3 rounded-lg font-semibold`}
              >
                Voltar para o Dashboard
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="w-full md:w-auto mb-4 md:mb-0">
                  <h1 className={`text-2xl md:text-3xl font-bold ${getThemeClass(isDarkMode, 'text')} mb-2`}>
                    Bem-vindo(a), {getNomeExibicao()}!
                  </h1>
                  <p className={`text-sm md:text-base ${getThemeClass(isDarkMode, 'textSecondary')}`}>
                    Complete suas avaliações para receber seu plano personalizado.
                  </p>
                </div>
                <div className="flex space-x-4 w-full md:w-auto justify-start">
                  <Link to="/avaliacoes" className="pb-2 md:pb-4 px-1 text-sm md:text-base text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 font-medium flex items-center gap-2">
                    <ClipboardList size={20} />
                    <span>Avaliações</span>
                  </Link>
                  <Link to="/resultados" className="pb-2 md:pb-4 px-1 text-sm md:text-base text-indigo-500/70 dark:text-indigo-400/70 hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center gap-2">
                    <BarChart size={20} />
                    <span>Resultados</span>
                  </Link>
                </div>
              </div>
              
              {/* Aviso de formulários completos */}
              {mostrarAviso && (
                <div className="mb-6 p-3 md:p-4 bg-indigo-900/30 border-l-4 border-indigo-500 rounded-lg flex flex-col md:flex-row md:items-start animate-slideIn">
                  <div className="bg-indigo-500 rounded-full p-1 mr-3 mt-0.5 hidden md:block">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-medium text-indigo-400">Parabéns!</h3>
                    <p className="text-sm md:text-base text-indigo-200">
                      Você completou todas as avaliações necessárias. Seus resultados e planos personalizados estão disponíveis na aba Resultados.
                    </p>
                    <div className="mt-3">
                      <button 
                        onClick={irParaResultados}
                        className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm animate-pulse-slow"
                      >
                        Ver meus resultados
                        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Aviso de formulários completos mas perfil não liberado */}
              {formulariosCompletos && !perfilLiberado && (
                <div className="mb-6 p-3 md:p-4 bg-yellow-900/30 border-l-4 border-yellow-500 rounded-lg flex flex-col md:flex-row md:items-start animate-slideIn">
                  <div className="bg-yellow-500 rounded-full p-1 mr-3 mt-0.5 hidden md:block">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-medium text-yellow-400">Avaliações em análise</h3>
                    <p className="text-sm md:text-base text-yellow-200">
                      Você completou todas as avaliações necessárias. Seus resultados estão sendo analisados pela nossa equipe e estarão disponíveis em breve.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Cards de avaliação */}
              <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
                <div className={`card overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl shadow-lg`}>
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mr-4`}>
                        <Activity className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-theme">Avaliação Física</h2>
                    </div>
                    
                    <p className="text-theme-secondary mb-6">
                      {avaliacoes.fisica 
                        ? (perfil?.liberado?.toLowerCase() === 'sim'
                          ? "Você já completou sua avaliação física. Os resultados estão disponíveis na aba Resultados."
                          : "Você já completou sua avaliação física. Os resultados estão sendo analisados pela nossa equipe.")
                        : "Complete sua avaliação física para receber um plano de treino personalizado."}
                    </p>
                    
                    <div className="flex">
                      <button 
                        onClick={() => navigate(avaliacoes.fisica && perfil?.liberado?.toLowerCase() === 'sim' ? '/resultados' : '/avaliacao-fisica')}
                        className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          avaliacoes.fisica && perfil?.liberado?.toLowerCase() !== 'sim'
                            ? 'bg-purple-400 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700'
                        } text-white`}
                        disabled={avaliacoes.fisica && perfil?.liberado?.toLowerCase() !== 'sim'}
                      >
                        {avaliacoes.fisica 
                          ? (perfil?.liberado?.toLowerCase() === 'sim' ? "Ver Resultados" : "Em análise") 
                          : "Preencher Avaliação"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className={`px-6 py-3 bg-purple-100/10 flex items-center text-sm`}>
                    <Activity className="h-4 w-4 mr-2" />
                    <span>Análise corporal e medidas físicas</span>
                  </div>
                </div>

                <div className={`card overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl shadow-lg`}>
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center mr-4`}>
                        <Utensils className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-theme">Avaliação Nutricional</h2>
                    </div>
                    
                    <p className="text-theme-secondary mb-6">
                      {avaliacoes.nutricional 
                        ? (perfil?.liberado?.toLowerCase() === 'sim'
                          ? "Você já completou sua avaliação nutricional. Os resultados estão disponíveis na aba Resultados."
                          : "Você já completou sua avaliação nutricional. Os resultados estão sendo analisados pela nossa equipe.")
                        : "Complete sua avaliação nutricional para receber um plano alimentar personalizado."}
                    </p>
                    
                    <div className="flex">
                      <button 
                        onClick={() => navigate(avaliacoes.nutricional && perfil?.liberado?.toLowerCase() === 'sim' ? '/resultados' : getNutricionalLink())}
                        className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          avaliacoes.nutricional && perfil?.liberado?.toLowerCase() !== 'sim'
                            ? 'bg-orange-400 cursor-not-allowed'
                            : 'bg-orange-500 hover:bg-orange-600'
                        } text-white`}
                        disabled={avaliacoes.nutricional && perfil?.liberado?.toLowerCase() !== 'sim'}
                      >
                        {avaliacoes.nutricional 
                          ? (perfil?.liberado?.toLowerCase() === 'sim' ? "Ver Resultados" : "Em análise") 
                          : "Preencher Avaliação"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className={`px-6 py-3 bg-orange-100/10 flex items-center text-sm`}>
                    <Utensils className="h-4 w-4 mr-2" />
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
