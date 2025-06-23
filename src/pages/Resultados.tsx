import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ClipboardCheck, Scale, ArrowLeft, Loader2, Download, Clock, Sun, Moon, FileText, Activity, Heart, Play, X, Calendar, TrendingUp, Award, Bell, User, BarChart3, Lock } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useTheme } from '../contexts/ThemeContext';
import { extrairNomeExercicio, encontrarVideoDoExercicio } from '../utils/exercicios';
import { BotaoMetodoTreino } from '../components/BotaoMetodoTreino';
import { formatarMetodoPDF } from '../utils/metodosTreino';

// Design limpo e profissional
const themeStyles = {
  light: {
    background: "bg-gray-50",
    text: "text-gray-900",
    textSecondary: "text-gray-600",
    card: "bg-white shadow-sm border border-gray-200",
    button: "bg-blue-600 hover:bg-blue-700 text-white",
    buttonSecondary: "bg-gray-100 hover:bg-gray-200 text-gray-700",
    input: "bg-white border border-gray-300 focus:border-blue-500",
    scrollbar: {
      track: "bg-gray-100",
      thumb: "bg-gray-400 hover:bg-gray-500"
    }
  },
  dark: {
    background: "bg-gray-900",
    text: "text-white",
    textSecondary: "text-gray-300",
    card: "bg-gray-800 border border-gray-700",
    button: "bg-blue-600 hover:bg-blue-700 text-white",
    buttonSecondary: "bg-gray-700 hover:bg-gray-600 text-gray-200",
    input: "bg-gray-800 border border-gray-600 focus:border-blue-400",
    scrollbar: {
      track: "bg-gray-800",
      thumb: "bg-gray-600 hover:bg-gray-500"
    }
  }
};

// Estilos básicos sem animações
const animationStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: var(--scrollbar-track);
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: 3px;
  }
`;

// Interface para os exercícios
interface Exercicio {
  numero: string;
  nome: string;
  series: string;
  repeticoes: string;
}

// Interface para o treino
interface Treino {
  letra: string;
  descricao: string;
  titulo: string;
  exercicios: Exercicio[];
}

interface Perfil {
  liberado: string; // 'sim' ou 'nao'
  resultado_fisica: string; // Texto com o resultado da avaliação física
  resultado_nutricional: string; // Texto com o resultado da avaliação nutricional
  nome?: string; // Optional nome
  nome_completo?: string;
  user_id?: string; // ID do usuário no Supabase
}

// Componente Modal de Vídeo
const VideoModal = ({ videoUrl, onClose }: { videoUrl: string; onClose: () => void }) => {
  // Extrair o ID do vídeo do YouTube da URL
  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYoutubeVideoId(videoUrl);
  
  // Log para debug
  console.log("Abrindo vídeo modal com URL:", videoUrl);
  console.log("ID do vídeo extraído:", videoId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={(e) => {
      // Fechar o modal quando clicar fora do container do vídeo
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-1"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="relative pt-[56.25%]">
          {videoId ? (
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white flex-col p-6">
              <div className="text-center mb-4">Erro ao carregar o vídeo</div>
              <div className="text-sm text-gray-400 text-center">URL inválida ou não suportada: {videoUrl}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function Resultados() {
  const navigate = useNavigate();
  const [gerandoNutricional, setGerandoNutricional] = useState(false);
  const [gerandoFisico, setGerandoFisico] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [perfilLiberado, setPerfilLiberado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const location = useLocation();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const themeStyle = isDarkMode ? themeStyles.dark : themeStyles.light;
  const [error, setError] = useState<string | null>(null);
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const [mostrarResultadoNutricional, setMostrarResultadoNutricional] = useState(false);
  const [ultimaAvaliacao, setUltimaAvaliacao] = useState<string | null>(null);
  
  // Obter o ID da query string
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get('id');

  // Aplicar estilos de animação
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = animationStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Atualize o estilo da scrollbar dinamicamente
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        ${themeStyle.scrollbar.track};
        border-radius: 8px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        ${themeStyle.scrollbar.thumb};
        border-radius: 8px;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, [isDarkMode]);

  useEffect(() => {
    const buscarPerfil = async () => {
      try {
        setCarregando(true);
        
        if (!id) {
          console.log('ID não fornecido na URL, buscando perfil do usuário logado');
          
          // Obter o usuário logado
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.error('Usuário não autenticado');
            setCarregando(false);
            return;
          }
          
          // Buscar o perfil do usuário logado
          const { data: perfilUsuario, error: perfilError } = await supabase
            .from('perfis')
            .select('*, nome_completo')
            .eq('user_id', user.id)
            .single();
            
          if (perfilError) {
            console.error('Erro ao buscar perfil do usuário:', perfilError);
            setCarregando(false);
            return;
          }
          
          console.log('Dados do perfil do usuário logado:', perfilUsuario);
          
          if (!perfilUsuario) {
            console.error('Nenhum perfil encontrado para o usuário logado');
            setCarregando(false);
            return;
          }
          
          console.log('Campo liberado:', perfilUsuario.liberado, typeof perfilUsuario.liberado);
          
          // Verificar se o campo liberado é 'sim' (case insensitive)
          const liberado = typeof perfilUsuario.liberado === 'string' && 
                          perfilUsuario.liberado.toLowerCase() === 'sim';
          
          console.log('Perfil liberado?', liberado);
          
          setPerfil(perfilUsuario);
          setPerfilLiberado(liberado);
          setCarregando(false);
          return;
        }
        
        console.log('Buscando perfil com ID:', id);
        
        const { data, error } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Erro ao buscar perfil:', error);
          throw error;
        }
        
        console.log('Dados do perfil recebidos:', data);
        
        if (!data) {
          console.error('Nenhum dado de perfil encontrado');
          setCarregando(false);
          return;
        }
        
        console.log('Campo liberado:', data.liberado, typeof data.liberado);
        
        // Verificar se o campo liberado é 'sim' (case insensitive)
        const liberado = typeof data.liberado === 'string' && 
                        data.liberado.toLowerCase() === 'sim';
        
        console.log('Perfil liberado?', liberado);
        
        setPerfil(data);
        setPerfilLiberado(liberado);
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        alert('Erro ao carregar os dados. Por favor, tente novamente.');
      } finally {
        setCarregando(false);
      }
    };

    buscarPerfil();
  }, [id]);

  // Dados de progresso
  useEffect(() => {
    if (perfil) {
      setUltimaAvaliacao('15/03/2024');
    }
  }, [perfil]);

  // Adicionar função para gerar PDF do resultado físico
  const gerarPDFFisico = async () => {
    console.log('[gerarPDFFisico] Iniciando geração...');
    
    if (!perfil) {
      console.error('[gerarPDFFisico] Perfil não encontrado');
      alert('Perfil não encontrado. Não é possível gerar o PDF.');
      return;
    }
    
    const conteudo = perfil.resultado_fisica;
      
    if (!conteudo) {
      console.error('[gerarPDFFisico] Conteúdo físico não disponível');
      alert('Não há resultado de programação física disponível para gerar o PDF');
      return;
    }

    try {
      setGerandoFisico(true);
      
      // Configuração do documento
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Definições básicas do PDF
      const margemEsquerda = 15;
      const margemDireita = 15;
      const margemSuperior = 30;
      const larguraUtil = doc.internal.pageSize.width - margemEsquerda - margemDireita;
      
      // Adicionar cabeçalho com título - cor roxa para física
      doc.setFillColor(124, 58, 237); // Cor roxa (purple-600) para física
      doc.rect(0, 0, doc.internal.pageSize.width, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('Programação Física', doc.internal.pageSize.width / 2, 12, { align: 'center' });
      
      // Adicionar conteúdo
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      
      // Processar o texto
      const linhas = doc.splitTextToSize(conteudo, larguraUtil);
      doc.text(linhas, margemEsquerda, margemSuperior);

      // Salvar o PDF
      doc.save('avaliacao_fisica.pdf');
      console.log('PDF físico gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF da avaliação física:', error);
      alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
    } finally {
      setTimeout(() => {
        setGerandoFisico(false);
      }, 1000);
    }
  };
  
  // Função para gerar PDF nutricional (atualizar cor para laranja)
  const gerarPDFNutricional = async () => {
    console.log('[gerarPDFNutricional] Iniciando geração...');
    
    if (!perfil) {
      console.error('[gerarPDFNutricional] Perfil não encontrado');
      alert('Perfil não encontrado. Não é possível gerar o PDF.');
      return;
    }
    
    const conteudo = perfil.resultado_nutricional;
      
    if (!conteudo) {
      console.error('[gerarPDFNutricional] Conteúdo nutricional não disponível');
      alert('Não há resultado de programação nutricional disponível para gerar o PDF');
      return;
    }

    try {
      console.log('[gerarPDFNutricional] Definindo estado...');
      setGerandoNutricional(true);
      
      // Configuração do documento
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Definições de margens e dimensões
      const margemEsquerda = 15;
      const margemDireita = 15;
      const margemSuperior = 30;
      const margemInferior = 20;
      const larguraUtil = doc.internal.pageSize.width - margemEsquerda - margemDireita;
      
      // Adicionar cabeçalho com título - usando laranja para nutricional
      doc.setFillColor(249, 115, 22); // Cor laranja (orange-500) para nutricional
      doc.rect(0, 0, doc.internal.pageSize.width, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('Programação Nutricional', doc.internal.pageSize.width / 2, 12, { align: 'center' });
      
      // Adicionar conteúdo
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      
      // Processar o texto
      const linhas = doc.splitTextToSize(conteudo, larguraUtil);
      doc.text(linhas, margemEsquerda, margemSuperior);
      
      // Salvar o PDF
      doc.save('avaliacao_nutricional.pdf');
      console.log('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF da avaliação nutricional:', error);
      alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
    } finally {
      setTimeout(() => {
        setGerandoNutricional(false);
      }, 1000);
    }
  };

  // Função genérica para renderizar resultados
  const renderizarResultado = (conteudo: string | null) => {
    if (!conteudo) {
      return <div className="text-gray-500">Nenhum resultado disponível ainda.</div>;
    }

    // Verificar se o conteúdo parece ser um planejamento alimentar
    const pareceSerPlanejamentoAlimentar = conteudo.includes('Planejamento alimentar') || 
                                           conteudo.includes('Café da manhã') ||
                                           conteudo.includes('Almoço') ||
                                           conteudo.includes('Jantar') ||
                                           conteudo.includes('kcal') ||
                                           conteudo.includes('Colação') ||
                                           conteudo.includes('Ceia');
    
    // Se parece ser um planejamento alimentar, renderizar como plano alimentar
    if (pareceSerPlanejamentoAlimentar) {
      try {
        // Código para renderizar plano alimentar
        // ...
        return <div>Renderização do plano alimentar</div>;
      } catch (error) {
        console.error('Erro ao processar plano alimentar:', error);
        // Em caso de erro, renderizar como texto simples
        return <pre className="whitespace-pre-wrap">{conteudo}</pre>;
      }
    }
    
    // Caso contrário, renderizar como texto simples
    return <pre className="whitespace-pre-wrap">{conteudo}</pre>;
  };



  // Loading state
  if (carregando) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  // Renderização principal
  return (
    <Layout>
      <div className={`min-h-screen ${themeStyle.background} p-4 md:p-8`}>
                  {/* Header */}
        <div className="mb-8">
          <div className={`${themeStyle.card} rounded-lg p-6`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                  <User className={`w-6 h-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                </div>
                <div>
                  <h1 className={`text-2xl font-semibold ${themeStyle.text}`}>
                    Olá, {perfil?.nome_completo || 'Usuário'}
                  </h1>
                  <p className={`${themeStyle.textSecondary} text-sm`}>
                    Acesse suas programações
                  </p>
                </div>
              </div>
              
              <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                perfilLiberado 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
              }`}>
                {perfilLiberado ? 'Ativo' : 'Aguardando liberação'}
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className={`text-center p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className={`text-2xl font-bold ${themeStyle.text}`}>2</div>
                <div className={`text-sm ${themeStyle.textSecondary}`}>Programações</div>
              </div>
              <div className={`text-center p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className={`text-2xl font-bold ${themeStyle.text}`}>PDF</div>
                <div className={`text-sm ${themeStyle.textSecondary}`}>Downloads</div>
              </div>
              <div className={`text-center p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className={`text-2xl font-bold ${themeStyle.text}`}>24.5</div>
                <div className={`text-sm ${themeStyle.textSecondary}`}>IMC Objetivo</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de programação */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Programação Física */}
          <div className={`${themeStyle.card} rounded-lg p-6 ${!perfilLiberado ? 'opacity-75' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center`}>
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${themeStyle.text}`}>
                    Programação Física
                  </h3>
                  <p className={`text-sm ${themeStyle.textSecondary}`}>
                    {perfilLiberado ? 'Seu treino personalizado' : 'Aguardando liberação'}
                  </p>
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${perfilLiberado ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            </div>
            
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} mb-4`}>
              <div className="flex items-center justify-between text-sm">
                <span className={themeStyle.textSecondary}>Última atualização</span>
                <span className={themeStyle.text}>{ultimaAvaliacao || 'Não realizada'}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (perfilLiberado) {
                    navigate(`/resultado-fisico${id ? `?id=${id}` : ''}`)
                  } else {
                    alert('Sua programação física ainda está sendo preparada. Aguarde a liberação do administrador.')
                  }
                }}
                disabled={!perfilLiberado}
                className={`w-full py-3 px-4 rounded-lg transition-colors text-sm font-medium ${
                  perfilLiberado 
                    ? `${themeStyle.button}`
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {perfilLiberado ? (
                  <>
                    <FileText className="w-4 h-4 inline mr-2" />
                    Ver Programação
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 inline mr-2" />
                    Em Preparação
                  </>
                )}
              </button>
              
              <button
                onClick={gerarPDFFisico}
                disabled={gerandoFisico || !perfilLiberado || !perfil?.resultado_fisica}
                className={`w-full py-3 px-4 rounded-lg transition-colors text-sm font-medium
                  ${gerandoFisico || !perfilLiberado || !perfil?.resultado_fisica
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : `${themeStyle.buttonSecondary}`}`}
              >
                {gerandoFisico ? (
                  <>
                    <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 inline mr-2" />
                    Baixar PDF
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Programação Nutricional */}
          <div className={`${themeStyle.card} rounded-lg p-6 ${!perfilLiberado ? 'opacity-75' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center`}>
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${themeStyle.text}`}>
                    Programação Nutricional
                  </h3>
                  <p className={`text-sm ${themeStyle.textSecondary}`}>
                    {perfilLiberado ? 'Sua dieta personalizada' : 'Aguardando liberação'}
                  </p>
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${perfilLiberado ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            </div>
            
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} mb-4`}>
              <div className="flex items-center justify-between text-sm">
                <span className={themeStyle.textSecondary}>Última atualização</span>
                <span className={themeStyle.text}>{ultimaAvaliacao || 'Não realizada'}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (perfilLiberado) {
                    navigate(`/resultado-nutricional${id ? `?id=${id}` : ''}`)
                  } else {
                    alert('Sua programação nutricional ainda está sendo preparada. Aguarde a liberação do administrador.')
                  }
                }}
                disabled={!perfilLiberado}
                className={`w-full py-3 px-4 rounded-lg transition-colors text-sm font-medium ${
                  perfilLiberado 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {perfilLiberado ? (
                  <>
                    <FileText className="w-4 h-4 inline mr-2" />
                    Ver Programação
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 inline mr-2" />
                    Em Preparação
                  </>
                )}
              </button>
              
              <button
                onClick={gerarPDFNutricional}
                disabled={gerandoNutricional || !perfilLiberado || !perfil?.resultado_nutricional}
                className={`w-full py-3 px-4 rounded-lg transition-colors text-sm font-medium
                  ${gerandoNutricional || !perfilLiberado || !perfil?.resultado_nutricional
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-300'}`}
              >
                {gerandoNutricional ? (
                  <>
                    <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 inline mr-2" />
                    Baixar PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Dicas úteis */}
        <div className={`${themeStyle.card} rounded-lg p-6 mb-8`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center`}>
              <Bell className="w-4 h-4 text-white" />
            </div>
            <h3 className={`text-lg font-semibold ${themeStyle.text}`}>Dicas Importantes</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border-l-4 border-blue-500`}>
              <h4 className={`font-medium text-blue-600 dark:text-blue-400 text-sm mb-2`}>Hidratação</h4>
              <p className={`text-sm ${themeStyle.textSecondary}`}>Mantenha-se hidratado com pelo menos 2L de água diariamente</p>
            </div>
            
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border-l-4 border-purple-500`}>
              <h4 className={`font-medium text-purple-600 dark:text-purple-400 text-sm mb-2`}>Descanso</h4>
              <p className={`text-sm ${themeStyle.textSecondary}`}>8 horas de sono para otimizar sua recuperação</p>
            </div>
            
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border-l-4 border-orange-500`}>
              <h4 className={`font-medium text-orange-600 dark:text-orange-400 text-sm mb-2`}>Alimentação</h4>
              <p className={`text-sm ${themeStyle.textSecondary}`}>Refeições regulares a cada 3 horas</p>
            </div>
          </div>
        </div>

        {/* Resultado nutricional */}
        {!carregando && perfilLiberado && perfil?.resultado_nutricional && mostrarResultadoNutricional && (
          <div id="resultado-nutricional" className={`${themeStyle.card} rounded-lg mt-8 mb-10`}>
            <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-6 flex justify-between items-center`}>
              <h2 className={`text-lg font-semibold ${themeStyle.text} flex items-center`}>
                <Heart className="w-5 h-5 mr-3 text-orange-500" />
                Programação Nutricional
              </h2>
              
              <button
                onClick={gerarPDFNutricional}
                disabled={gerandoNutricional}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${gerandoNutricional 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' 
                    : `${themeStyle.button}`}`}
              >
                {gerandoNutricional ? 
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </> : 
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PDF
                  </>
                }
              </button>
            </div>
            
            <div className="p-6">
              <div className="custom-scrollbar overflow-y-auto max-h-[70vh]">
                {renderizarResultado(perfil.resultado_nutricional)}
              </div>
            </div>
          </div>
        )}

        {videoModalUrl && (
          <VideoModal
            videoUrl={videoModalUrl}
            onClose={() => setVideoModalUrl(null)}
          />
        )}
      </div>
    </Layout>
  );
} 