import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ClipboardCheck, Scale, ArrowLeft, Loader2, Download, Clock, Sun, Moon, FileText, Activity, Heart, Play, X, Calendar, TrendingUp, Award, Bell } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useTheme } from '../contexts/ThemeContext';
import { extrairNomeExercicio, encontrarVideoDoExercicio } from '../utils/exercicios';
import { BotaoMetodoTreino } from '../components/BotaoMetodoTreino';
import { formatarMetodoPDF } from '../utils/metodosTreino';

// Adicione estas classes ao seu arquivo de estilos globais ou como uma constante
const themeStyles = {
  light: {
    background: "bg-gradient-to-b from-gray-100 to-white",
    text: "text-gray-800",
    textSecondary: "text-gray-600",
    card: "bg-white shadow-lg border border-gray-200",
    button: "bg-orange-500 hover:bg-orange-600 text-white",
    buttonSecondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    input: "bg-white border border-gray-300 focus:border-orange-500",
    scrollbar: {
      track: "bg-gray-200",
      thumb: "bg-orange-400/50 hover:bg-orange-400/70"
    }
  },
  dark: {
    background: "bg-gradient-to-b from-slate-900 to-slate-800",
    text: "text-white",
    textSecondary: "text-gray-300",
    card: "bg-slate-800/80 backdrop-blur-sm border border-orange-500/20",
    button: "bg-orange-500 hover:bg-orange-600 text-white",
    buttonSecondary: "bg-slate-700 hover:bg-slate-600 text-white",
    input: "bg-slate-700 border border-slate-600 focus:border-orange-500",
    scrollbar: {
      track: "bg-slate-700",
      thumb: "bg-orange-500/50 hover:bg-orange-500/70"
    }
  }
};

// Adicionar estilos para animações personalizadas
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideInUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes scaleIn {
    from { 
      opacity: 0;
      transform: scale(0.95);
    }
    to { 
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .hover\\:scale-102:hover {
    transform: scale(1.02);
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out forwards;
  }
  
  .animate-slideInUp {
    animation: slideInUp 0.5s ease-out forwards;
  }
  
  .animate-scaleIn {
    animation: scaleIn 0.3s ease-out forwards;
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
  const [mostrarAnimacao, setMostrarAnimacao] = useState(false);
  const [ultimaAvaliacao, setUltimaAvaliacao] = useState<string | null>(null);
  const [progressoMes, setProgressoMes] = useState<number>(0);
  
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
        width: 8px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        ${themeStyle.scrollbar.track};
        border-radius: 10px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        ${themeStyle.scrollbar.thumb};
        border-radius: 10px;
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

  // Simular dados de progresso (você pode substituir isso com dados reais do backend)
  useEffect(() => {
    if (perfil) {
      setUltimaAvaliacao('15/03/2024');
      setProgressoMes(75);
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

  // Adicionar efeito de animação ao entrar na página
  useEffect(() => {
    setMostrarAnimacao(true);
  }, []);

  // Renderização principal
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 md:p-6">
        {/* Banner de Boas-vindas */}
        <div className="mb-4 md:mb-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 md:p-6 relative">
            <div className="absolute inset-0 bg-pattern opacity-10"></div>
            <div className="relative z-10">
              <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
                Olá, {perfil?.nome_completo || 'Atleta'}! 👋
              </h1>
              <p className="text-sm md:text-base text-blue-100">
                Acompanhe suas programações e resultados
              </p>
              
              {/* Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4">
                  <div className="flex items-center text-white">
                    <Activity className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    <span className="text-xs md:text-sm">Status Atual</span>
                  </div>
                  <p className="text-lg md:text-xl font-semibold text-white mt-1 md:mt-2">
                    {perfilLiberado ? 'Ativo' : 'Pendente'}
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4">
                  <div className="flex items-center text-white">
                    <FileText className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    <span className="text-xs md:text-sm">Programações</span>
                  </div>
                  <div className="mt-1 md:mt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg md:text-xl font-semibold text-white">2</span>
                      <span className="text-xs md:text-sm text-blue-100">Disponíveis</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4">
                  <div className="flex items-center text-white">
                    <ClipboardCheck className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    <span className="text-xs md:text-sm">Documentos</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1 md:mt-2">
                    <span className="text-lg md:text-xl font-semibold text-white">PDF</span>
                    <span className="text-xs md:text-sm text-blue-100">Disponível</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Resultados */}
        <div className="grid grid-cols-1 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* Card para Resultado Físico - Cor ROXA */}
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-102
            border-t-4 border-purple-500 ${mostrarAnimacao ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
            style={{transitionDelay: '100ms'}}>
            <div className="p-4 md:p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-300 to-transparent"></div>
              <h2 className="text-base md:text-lg font-bold flex items-center relative z-10 uppercase mb-2">
                <Activity className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                Programação Física
              </h2>
              <div className="flex items-center space-x-4 text-purple-100">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>
                    {ultimaAvaliacao ? `Última programação: ${ultimaAvaliacao}` : 'Não realizada'}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gradient-to-b from-white to-purple-50 dark:from-gray-800 dark:to-gray-900">
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ClipboardCheck className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Última Medição</h3>
                    <p className="text-gray-600 dark:text-gray-300">IMC: 24.5 | Peso: 75kg</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => navigate(`/resultado-fisico${id ? `?id=${id}` : ''}`)}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center transition-all duration-200 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Ver Programação Física
                </button>
                
                <button
                  onClick={gerarPDFFisico}
                  disabled={gerandoFisico || !perfilLiberado || !perfil?.resultado_fisica}
                  className={`w-full px-4 py-3 rounded-lg flex items-center justify-center transition-all duration-200
                    ${gerandoFisico || !perfilLiberado || !perfil?.resultado_fisica
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                      : 'bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1'}`}
                >
                  {gerandoFisico ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Gerando PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Baixar PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Card para Resultado Nutricional - Cor LARANJA */}
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-102
            border-t-4 border-orange-500 ${mostrarAnimacao ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
            style={{transitionDelay: '200ms'}}>
            <div className="p-4 md:p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-300 to-transparent"></div>
              <h2 className="text-base md:text-lg font-bold flex items-center relative z-10 uppercase mb-2">
                <Heart className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                Programação Nutricional
              </h2>
              <div className="flex items-center space-x-4 text-orange-100">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Última programação: {ultimaAvaliacao || 'Não realizada'}</span>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gradient-to-b from-white to-orange-50 dark:from-gray-800 dark:to-gray-900">
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Scale className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Medidas Atuais</h3>
                    <p className="text-gray-600 dark:text-gray-300">IMC: 24.5 | Peso: 75kg</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => navigate(`/resultado-nutricional${id ? `?id=${id}` : ''}`)}
                  className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center transition-all duration-200 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Ver Programação Nutricional
                </button>
                
                <button
                  onClick={gerarPDFNutricional}
                  disabled={gerandoNutricional}
                  className={`w-full px-4 py-3 rounded-lg flex items-center justify-center transition-all duration-200
                    ${gerandoNutricional 
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                      : 'bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900 dark:hover:bg-orange-800 dark:text-orange-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1'}`}
                >
                  {gerandoNutricional ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Gerando PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Baixar PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de dicas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-4 md:mb-6">
          <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm md:text-base font-bold text-gray-900 dark:text-white flex items-center">
              <Bell className="w-5 h-5 md:w-6 md:h-6 mr-2 text-blue-500" />
              Dicas Personalizadas
            </h2>
          </div>
          <div className="p-4 md:p-6 grid grid-cols-1 gap-4 md:gap-6">
            <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 border-l-4 border-blue-500">
              <h3 className="text-sm md:text-base font-semibold text-blue-700 dark:text-blue-300 mb-2">Hidratação</h3>
              <p className="text-xs md:text-sm text-blue-600 dark:text-blue-200">Lembre-se de beber pelo menos 2L de água por dia para manter o corpo hidratado.</p>
            </div>
            
            <div className="bg-purple-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 border-l-4 border-purple-500">
              <h3 className="text-sm md:text-base font-semibold text-purple-700 dark:text-purple-300 mb-2">Descanso</h3>
              <p className="text-xs md:text-sm text-purple-600 dark:text-purple-200">Mantenha 8 horas de sono por noite para otimizar sua recuperação muscular.</p>
            </div>
            
            <div className="bg-orange-50 dark:bg-gray-700 rounded-lg p-3 md:p-4 border-l-4 border-orange-500">
              <h3 className="text-sm md:text-base font-semibold text-orange-700 dark:text-orange-300 mb-2">Alimentação</h3>
              <p className="text-xs md:text-sm text-orange-600 dark:text-orange-200">Faça suas refeições a cada 3 horas para manter o metabolismo ativo.</p>
            </div>
          </div>
        </div>

        {/* Resultado nutricional */}
        {!carregando && perfilLiberado && perfil?.resultado_nutricional && mostrarResultadoNutricional && (
          <div id="resultado-nutricional" 
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mt-6 mb-10 border-l-4 border-orange-500
              ${mostrarResultadoNutricional ? 'animate-fadeIn' : ''}`}
            style={{boxShadow: '0 20px 25px -5px rgba(249, 115, 22, 0.1), 0 10px 10px -5px rgba(249, 115, 22, 0.05)'}}>
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center bg-gradient-to-r from-orange-50 to-white dark:from-gray-800 dark:to-gray-700 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-300 to-transparent"></div>
              <h2 className="text-lg font-medium text-orange-800 dark:text-orange-300 flex items-center relative z-10 uppercase">
                <Heart className="w-5 h-5 mr-2 text-orange-500" />
                Programação Nutricional
              </h2>
              
              <button
                onClick={gerarPDFNutricional}
                disabled={gerandoNutricional}
                className={`
                  flex items-center px-4 py-2 rounded-md text-sm font-medium relative z-10
                  ${gerandoNutricional 
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white transform transition hover:scale-105 shadow-md hover:shadow-lg'}
                  transition-all duration-200
                `}
              >
                {gerandoNutricional ? 
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando PDF...
                  </> : 
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PDF
                  </>
                }
              </button>
            </div>
            
            <div className="p-4">
              <div className="custom-scrollbar overflow-y-auto max-h-[70vh] animate-fadeIn">
                {renderizarResultado(perfil.resultado_nutricional)}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 