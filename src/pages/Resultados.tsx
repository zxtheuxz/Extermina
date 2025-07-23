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
import { formatarMetodoPDF, encontrarMetodoTreino } from '../utils/metodosTreino';

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
      
      // Definições de margens e dimensões
      const margemEsquerda = 15;
      const margemDireita = 15;
      const margemSuperior = 25;
      const margemInferior = 20;
      const larguraUtil = doc.internal.pageSize.width - margemEsquerda - margemDireita;
      let posicaoY = margemSuperior;
      let paginaAtual = 1;
      
      // Função para adicionar cabeçalho em cada página
      const adicionarCabecalho = (pagina: number) => {
        // Cabeçalho roxo
        doc.setFillColor(124, 58, 237); // purple-600
        doc.rect(0, 0, doc.internal.pageSize.width, 20, 'F');
        
        // Título
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('PROGRAMAÇÃO FÍSICA', doc.internal.pageSize.width / 2, 12, { align: 'center' });
        
        // Linha divisória
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margemEsquerda, 22, doc.internal.pageSize.width - margemDireita, 22);
      };
      
      // Função para adicionar rodapé
      const adicionarRodape = (pagina: number, total: number) => {
        const rodapeY = doc.internal.pageSize.height - 15;
        
        // Linha divisória
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margemEsquerda, rodapeY - 5, doc.internal.pageSize.width - margemDireita, rodapeY - 5);
        
        // Informações do rodapé
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        
        // Nome do aluno à esquerda
        doc.text(perfil.nome_completo || 'Aluno', margemEsquerda, rodapeY);
        
        // Página no centro
        doc.text(`Página ${pagina} de ${total}`, doc.internal.pageSize.width / 2, rodapeY, { align: 'center' });
        
        // Data à direita
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        doc.text(dataAtual, doc.internal.pageSize.width - margemDireita, rodapeY, { align: 'right' });
      };
      
      // Verificar se é uma ficha de treino
      const pareceSerFichaDeTreino = conteudo.includes('TREINO A') || 
                                     conteudo.includes('TREINO B') || 
                                     conteudo.toLowerCase().includes('treino a') ||
                                     conteudo.toLowerCase().includes('treino b') ||
                                     conteudo.includes('exercício') ||
                                     conteudo.includes('exercicio') ||
                                     conteudo.includes('séries') ||
                                     conteudo.includes('series');
      
      if (pareceSerFichaDeTreino) {
        // Processar como ficha de treino
        const linhas = conteudo.split('\n').filter(linha => linha.trim().length > 0);
        const treinos: Treino[] = [];
        let treinoAtual: Treino | null = null;
        
        const regexTreino = /TREINO\s+([A-Z])(?:\s*[:]\s*|\s+)(.+)?/i;
        const regexExercicio = /^(\d+)\s*[-–—]\s*(.+)/i;
        
        // Processar linhas para extrair treinos
        for (const linha of linhas) {
          const matchTreino = linha.trim().match(regexTreino);
          
          if (matchTreino) {
            if (treinoAtual) {
              treinos.push(treinoAtual);
            }
            
            treinoAtual = {
              letra: matchTreino[1],
              descricao: matchTreino[2] || '',
              titulo: linha.trim(),
              exercicios: []
            };
          } else if (treinoAtual) {
            const matchExercicio = linha.trim().match(regexExercicio);
            
            if (matchExercicio) {
              const numero = matchExercicio[1];
              const nomeCompleto = matchExercicio[2].trim();
              
              // Extrair séries e repetições
              const regexSeriesReps = /(\d+)\s*[xX]\s*([0-9\/]+(?:\s*a\s*\d+)?)/;
              const matchSeriesReps = nomeCompleto.match(regexSeriesReps);
              
              let nome = nomeCompleto;
              let series = '3x';
              let repeticoes = '12/10/8';
              
              if (matchSeriesReps) {
                nome = nomeCompleto.replace(matchSeriesReps[0], '').trim();
                series = matchSeriesReps[1] + 'x';
                repeticoes = matchSeriesReps[2];
              }
              
              treinoAtual.exercicios.push({
                numero,
                nome,
                series,
                repeticoes
              });
            }
          }
        }
        
        if (treinoAtual) {
          treinos.push(treinoAtual);
        }
        
        // Estimar número de páginas
        const totalPaginas = Math.max(Math.ceil(treinos.length * 0.5), 1);
        
        // Adicionar primeira página
        adicionarCabecalho(paginaAtual);
        posicaoY = margemSuperior + 5;
        
        // Renderizar cada treino
        for (const treino of treinos) {
          // Verificar espaço para o título do treino
          if (posicaoY + 20 > (doc.internal.pageSize.height - margemInferior - 10)) {
            adicionarRodape(paginaAtual, totalPaginas);
            doc.addPage();
            paginaAtual++;
            adicionarCabecalho(paginaAtual);
            posicaoY = margemSuperior + 5;
          }
          
          // Título do treino
          doc.setFillColor(124, 58, 237); // purple-600
          doc.rect(margemEsquerda, posicaoY, larguraUtil, 10, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.text(treino.titulo, margemEsquerda + 5, posicaoY + 7);
          
          posicaoY += 15;
          
          // Cabeçalho da tabela
          doc.setFillColor(0, 0, 0);
          doc.rect(margemEsquerda, posicaoY, larguraUtil * 0.7, 6, 'F');
          doc.rect(margemEsquerda + larguraUtil * 0.7, posicaoY, larguraUtil * 0.15, 6, 'F');
          doc.rect(margemEsquerda + larguraUtil * 0.85, posicaoY, larguraUtil * 0.15, 6, 'F');
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(255, 255, 255);
          doc.text('Exercício', margemEsquerda + 2, posicaoY + 4);
          doc.text('Séries', margemEsquerda + larguraUtil * 0.75, posicaoY + 4, { align: 'center' });
          doc.text('Repetições', margemEsquerda + larguraUtil * 0.9, posicaoY + 4, { align: 'center' });
          
          posicaoY += 8;
          
          // Exercícios
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          
          for (let i = 0; i < treino.exercicios.length; i++) {
            const exercicio = treino.exercicios[i];
            const alturaExercicio = 8;
            
            // Verificar se precisamos de uma nova página
            if (posicaoY + alturaExercicio > (doc.internal.pageSize.height - margemInferior - 10)) {
              adicionarRodape(paginaAtual, totalPaginas);
              doc.addPage();
              paginaAtual++;
              adicionarCabecalho(paginaAtual);
              posicaoY = margemSuperior + 5;
              
              // Redesenhar cabeçalho da tabela
              doc.setFillColor(0, 0, 0);
              doc.rect(margemEsquerda, posicaoY, larguraUtil * 0.7, 6, 'F');
              doc.rect(margemEsquerda + larguraUtil * 0.7, posicaoY, larguraUtil * 0.15, 6, 'F');
              doc.rect(margemEsquerda + larguraUtil * 0.85, posicaoY, larguraUtil * 0.15, 6, 'F');
              
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9);
              doc.setTextColor(255, 255, 255);
              doc.text('Exercício', margemEsquerda + 2, posicaoY + 4);
              doc.text('Séries', margemEsquerda + larguraUtil * 0.75, posicaoY + 4, { align: 'center' });
              doc.text('Repetições', margemEsquerda + larguraUtil * 0.9, posicaoY + 4, { align: 'center' });
              
              posicaoY += 8;
            }
            
            // Linhas alternadas
            if (i % 2 === 0) {
              doc.setFillColor(245, 245, 245);
            } else {
              doc.setFillColor(255, 255, 255);
            }
            doc.rect(margemEsquerda, posicaoY, larguraUtil, alturaExercicio, 'F');
            
            // Dados do exercício
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            doc.text(`${exercicio.numero} - ${exercicio.nome}`, margemEsquerda + 2, posicaoY + alturaExercicio/2 + 1);
            doc.text(exercicio.series, margemEsquerda + larguraUtil * 0.75, posicaoY + alturaExercicio/2 + 1, { align: 'center' });
            doc.text(exercicio.repeticoes, margemEsquerda + larguraUtil * 0.9, posicaoY + alturaExercicio/2 + 1, { align: 'center' });
            
            // Adicionar botão de vídeo se existir
            const videoUrl = encontrarVideoDoExercicio(exercicio.nome);
            if (videoUrl) {
              const larguraBotao = 30;
              const alturaBotao = 7;
              const posXBotao = margemEsquerda + larguraUtil - 3;
              const posYBotao = posicaoY + (alturaExercicio - alturaBotao) / 2;
              
              doc.setFillColor(147, 51, 234); // purple-600
              doc.roundedRect(posXBotao - larguraBotao, posYBotao, larguraBotao, alturaBotao, 1, 1, 'F');
              
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9);
              doc.setTextColor(255, 255, 255);
              doc.text('VER VÍDEO', posXBotao - larguraBotao/2, posYBotao + alturaBotao/2 + 1, { align: 'center' });
              
              doc.link(posXBotao - larguraBotao, posYBotao, larguraBotao, alturaBotao, { url: videoUrl });
              
              doc.setTextColor(0, 0, 0);
            }
            
            // Adicionar método se existir
            const metodoInfo = formatarMetodoPDF(exercicio.nome);
            if (metodoInfo) {
              posicaoY += alturaExercicio;
              
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9);
              doc.setTextColor(0, 0, 255);
              doc.text(`MÉTODO ${metodoInfo.metodoNome}:`, margemEsquerda + 2, posicaoY + 4);
              
              const descricaoLinhas = doc.splitTextToSize(metodoInfo.descricao, larguraUtil - 10);
              const alturaDescricao = descricaoLinhas.length * 5 + 10;
              
              doc.setFillColor(230, 240, 255);
              doc.rect(margemEsquerda, posicaoY + 6, larguraUtil, alturaDescricao, 'F');
              
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(9);
              doc.setTextColor(0, 0, 200);
              
              for (let j = 0; j < descricaoLinhas.length; j++) {
                doc.text(descricaoLinhas[j], margemEsquerda + 5, posicaoY + 12 + (j * 5));
              }
              
              posicaoY += alturaDescricao;
              doc.setTextColor(0, 0, 0);
            } else {
              posicaoY += alturaExercicio;
            }
          }
          
          posicaoY += 15;
        }
        
        adicionarRodape(paginaAtual, totalPaginas);
      } else {
        // Processar como texto simples
        const totalPaginas = 1;
        adicionarCabecalho(paginaAtual);
        posicaoY = margemSuperior + 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        const linhas = doc.splitTextToSize(conteudo, larguraUtil);
        
        for (const linha of linhas) {
          if (posicaoY >= (doc.internal.pageSize.height - margemInferior)) {
            adicionarRodape(paginaAtual, totalPaginas);
            doc.addPage();
            paginaAtual++;
            adicionarCabecalho(paginaAtual);
            posicaoY = margemSuperior + 5;
          }
          
          doc.text(linha, margemEsquerda, posicaoY);
          posicaoY += 5;
        }
        
        adicionarRodape(paginaAtual, totalPaginas);
      }

      // Salvar o PDF
      doc.save('programacao_fisica.pdf');
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
  
  // Função para gerar PDF nutricional com formato profissional
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
    
    // Variáveis de controle de página e posição
    let paginaAtual = 1;
    let posicaoY = margemSuperior + 5;
    
    // Função para adicionar cabeçalho
    const adicionarCabecalho = (pagina: number) => {
      // Retângulo laranja do cabeçalho
      doc.setFillColor(236, 72, 21); // Laranja vivo
      doc.rect(0, 0, doc.internal.pageSize.width, 20, 'F');
      
      // Título
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255); // Texto branco
      doc.text('RESULTADO DA AVALIAÇÃO NUTRICIONAL', doc.internal.pageSize.width / 2, 13, { align: 'center' });
      
      // Data e nome do cliente
      const dataAtual = new Date().toLocaleDateString('pt-BR');
      const nomeCliente = perfil?.nome_completo || perfil?.nome || 'Usuário';
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0); // Texto preto
      doc.text(`Cliente: ${nomeCliente}`, margemEsquerda, 28);
      doc.text(`Data: ${dataAtual}`, doc.internal.pageSize.width - margemDireita, 28, { align: 'right' });
    };
    
    // Função para adicionar rodapé
    const adicionarRodape = (pagina: number, totalPaginas: number) => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Página ${pagina} de ${totalPaginas}`, 
        doc.internal.pageSize.width / 2, 
        doc.internal.pageSize.height - 10, 
        { align: 'center' }
      );
    };
    
    // Adicionar primeira página
    adicionarCabecalho(paginaAtual);
    
    // Verificar se o conteúdo parece ser um planejamento alimentar
    const pareceSerPlanejamentoAlimentar = conteudo.includes('Planejamento alimentar') || 
                                     conteudo.includes('Café da manhã') ||
                                     conteudo.includes('Almoço') ||
                                     conteudo.includes('Jantar') ||
                                     conteudo.includes('kcal') ||
                                     conteudo.includes('Colação') ||
                                     conteudo.includes('Ceia');
                                      
    if (pareceSerPlanejamentoAlimentar) {
      try {
        // Dividir o conteúdo em linhas
        const linhas = conteudo.split('\n').filter((linha: string) => linha.trim().length > 0);
        
        // Array para armazenar as refeições
        const refeicoes: any[] = [];
        let refeicaoAtual: any = null;
        let tituloGeral = '';
        let listaDeCompras: string[] = [];
        let emListaDeCompras = false;
        
        // Expressões regulares para identificar refeições
        const regexRefeicao = /^(Café da manhã|Colação|Almoço|Lanche da Tarde|Lanche da Tarde Substituto|Jantar|Ceia)\s*$/i;
        const regexObservacoes = /^Observações:(.+)/i;
        const regexSubstituicoes = /^• Opções de substituição para (.+):$/i;
        const regexAlimento = /^([^•].+)$/i;
        const regexTitulo = /^Planejam[e|n]to Alimentar\s+(.+)/i;
        const regexListaCompras = /^Lista de compras\s*$/i;
        
        // Variáveis para controle
        let emObservacoes = false;
        let emSubstituicoes = false;
        let alimentoAtual = '';
        let substituicoes: string[] = [];
        
        // Processar cada linha
        for (let i = 0; i < linhas.length; i++) {
          const linha = linhas[i].trim();
          
          // Verificar se é uma linha com o tipo/calorias do plano
          if (linha.includes('kcal') && (linha.includes('Emagrecimento') || linha.includes('Ganho'))) {
            console.log('[gerarPDF] Encontrada linha de calorias/objetivo:', linha);
            
            // Verificar e corrigir duplicações no título
            if (linha.toLowerCase().includes('planejamento alimentar planejamento alimentar') || 
                linha.toLowerCase().includes('planejamento alimentar planejamneto alimentar')) {
              console.log('[gerarPDF] Detectada duplicação no título:', linha);
              tituloGeral = linha.replace(/planejam[e|n]to\s+alimentar\s+planejam[e|n]to\s+alimentar/i, 'Planejamento Alimentar');
            } else {
              tituloGeral = linha;
            }
            continue;
          }
          
          // Verificar se é o título geral
          const matchTitulo = linha.match(regexTitulo);
          if (matchTitulo) {
            console.log('[gerarPDF] Encontrado título:', linha);
            if (!tituloGeral) {
              // Verificar e corrigir duplicações no título
              if (linha.toLowerCase().includes('planejamento alimentar planejamento alimentar') || 
                  linha.toLowerCase().includes('planejamento alimentar planejamneto alimentar')) {
                console.log('[gerarPDF] Detectada duplicação no título:', linha);
                tituloGeral = linha.replace(/planejam[e|n]to\s+alimentar\s+planejam[e|n]to\s+alimentar/i, 'Planejamento Alimentar');
              } else {
                tituloGeral = linha;
              }
            }
            continue;
          }
          
          // Verificar se é o início da lista de compras
          const matchListaCompras = linha.match(regexListaCompras);
          if (matchListaCompras || (linha.includes('Lista de compras') && !emSubstituicoes)) {
            emListaDeCompras = true;
            emObservacoes = false;
            emSubstituicoes = false;
            
            // Se estávamos em uma refeição, adicioná-la antes
            if (refeicaoAtual) {
              refeicoes.push(refeicaoAtual);
              refeicaoAtual = null;
            }
            continue;
          }
          
          // Se estamos na lista de compras, adicionar item
          if (emListaDeCompras) {
            // Ignorar linhas que parecem títulos de refeição ou outras seções
            if (!linha.match(regexRefeicao) && !linha.match(regexTitulo) && 
                !linha.includes('Planejamento alimentar') && !linha.startsWith('•')) {
              listaDeCompras.push(linha);
            }
            continue;
          }
          
          // Verificar se é um nome de refeição
          const matchRefeicao = linha.match(regexRefeicao);
          if (matchRefeicao) {
            // Se já temos uma refeição atual, adicionar ao array
            if (refeicaoAtual) {
              refeicoes.push(refeicaoAtual);
            }
            
            // Criar nova refeição
            refeicaoAtual = {
              nome: matchRefeicao[1],
              alimentos: [],
              observacoes: '',
            };
            
            emObservacoes = false;
            emSubstituicoes = false;
            continue;
          }
          
          // Verificar se estamos em uma refeição
          if (refeicaoAtual) {
            // Verificar se é o início de observações
            const matchObservacoes = linha.match(regexObservacoes);
            if (matchObservacoes) {
              emObservacoes = true;
              refeicaoAtual.observacoes = matchObservacoes[1].trim();
              continue;
            }
            
            // Se estamos em observações, adicionar à observação atual
            if (emObservacoes) {
              refeicaoAtual.observacoes += ' ' + linha;
              continue;
            }
            
            // Verificar se é o início de substituições
            const matchSubstituicoes = linha.match(regexSubstituicoes);
            if (matchSubstituicoes) {
              emSubstituicoes = true;
              alimentoAtual = matchSubstituicoes[1].trim();
              substituicoes = [];
              continue;
            }
            
            // Se estamos em substituições
            if (emSubstituicoes) {
              if (linha.startsWith('•')) {
                // Nova substituição, salvar as anteriores
                if (substituicoes.length > 0) {
                  // Encontrar o alimento correspondente
                  const alimentoIndex = refeicaoAtual.alimentos.findIndex(
                    (alimento: any) => alimento.nome === alimentoAtual
                  );
                  
                  if (alimentoIndex !== -1) {
                    refeicaoAtual.alimentos[alimentoIndex].substituicoes = substituicoes;
                  }
                  
                  // Reiniciar para a nova substituição
                  const novoMatchSubstituicoes = linha.match(/^• Opções de substituição para (.+):$/i);
                  if (novoMatchSubstituicoes) {
                    alimentoAtual = novoMatchSubstituicoes[1].trim();
                    substituicoes = [];
                  }
                }
              } else {
                // Adicionar à lista de substituições
                substituicoes.push(linha);
                
                // Verificar se estamos no final da lista de substituições
                if (i + 1 === linhas.length || 
                    linhas[i + 1].match(regexRefeicao) || 
                    linhas[i + 1].match(regexObservacoes) ||
                    linhas[i + 1].match(regexListaCompras) ||
                    linhas[i + 1].startsWith('•')) {
                  // Encontrar o alimento correspondente
                  const alimentoIndex = refeicaoAtual.alimentos.findIndex(
                    (alimento: any) => alimento.nome === alimentoAtual
                  );
                  
                  if (alimentoIndex !== -1) {
                    refeicaoAtual.alimentos[alimentoIndex].substituicoes = substituicoes;
                  }
                  
                  // Fim das substituições
                  if (i + 1 < linhas.length && !linhas[i + 1].startsWith('•')) {
                    emSubstituicoes = false;
                  }
                }
              }
              continue;
            }
            
            // Se não estamos em observações nem substituições, deve ser um alimento
            const matchAlimento = linha.match(regexAlimento);
            if (matchAlimento && !linha.startsWith('•') && !linha.includes('Lista de compras')) {
              // Extrair nome e porção
              const partes = linha.split('\n');
              const nome = partes[0].trim();
              const porcao = i + 1 < linhas.length ? linhas[i + 1].trim() : '';
              
              // Pular a linha da porção se necessário
              if (porcao && !porcao.startsWith('•') && !porcao.match(regexRefeicao) && !porcao.match(regexObservacoes)) {
                i++;
              }
              
              // Adicionar à lista de alimentos
              refeicaoAtual.alimentos.push({
                nome,
                porcao: porcao || '',
                substituicoes: []
              });
            }
          }
        }
        
        // Adicionar a última refeição
        if (refeicaoAtual) {
          refeicoes.push(refeicaoAtual);
        }
        
        // Extrair informações do título para destacar o tipo de dieta
        let tipoDieta = "";
        let objetivoDieta = "";
        let caloriasTexto = "";
        
        if (tituloGeral) {
          // Verificar se contém informações sobre calorias
          const matchCalorias = tituloGeral.match(/(\d+)\s*kcal/i);
          if (matchCalorias) {
            caloriasTexto = matchCalorias[1] + " kcal";
          }
          
          // Verificar se contém informações sobre emagrecimento ou ganho
          if (tituloGeral.toLowerCase().includes("emagrecimento")) {
            objetivoDieta = "Emagrecimento";
          } else if (tituloGeral.toLowerCase().includes("ganho")) {
            objetivoDieta = "Ganho Muscular";
          }
        }
        
        // Adicionar o título do planejamento alimentar logo após o cabeçalho
        doc.setFillColor(236, 72, 21); // Laranja
        doc.rect(margemEsquerda, posicaoY, larguraUtil, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255); // Branco
        doc.text('Planejamento Alimentar', doc.internal.pageSize.width / 2, posicaoY + 6, { align: 'center' });
        posicaoY += 15;
        
        // Adicionar informações de calorias e objetivo em destaque
        if (caloriasTexto || objetivoDieta) {
          let infoText = '';
          if (caloriasTexto) infoText += caloriasTexto;
          if (caloriasTexto && objetivoDieta) infoText += ' - ';
          if (objetivoDieta) infoText += objetivoDieta;
          
          doc.setFillColor(245, 245, 245); // Cinza claro
          doc.rect(margemEsquerda, posicaoY, larguraUtil, 8, 'F');
          doc.setFontSize(10);
          doc.setTextColor(236, 72, 21); // Laranja
          doc.setFont('helvetica', 'bold');
          doc.text(infoText, doc.internal.pageSize.width / 2, posicaoY + 5, { align: 'center' });
          posicaoY += 13;
        }
        
        // Renderizar cada refeição como uma tabela
        for (const refeicao of refeicoes) {
          // Verificar se precisa de nova página
          const alturaEstimadaRefeicao = 15 + (refeicao.alimentos.length * 15);
          if (posicaoY + alturaEstimadaRefeicao > doc.internal.pageSize.height - margemInferior - 20) {
            adicionarRodape(paginaAtual, paginaAtual + 1);
            doc.addPage();
            paginaAtual++;
            adicionarCabecalho(paginaAtual);
            posicaoY = margemSuperior + 5;
          }
          
          // Título da refeição
          doc.setFillColor(236, 72, 21); // Laranja vivo
          doc.rect(margemEsquerda, posicaoY, larguraUtil, 8, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(255, 255, 255);
          doc.text(refeicao.nome, doc.internal.pageSize.width / 2, posicaoY + 5.5, { align: 'center' });
          posicaoY += 12;
          
          // Cabeçalho da tabela
          doc.setFillColor(245, 130, 32); // Laranja mais claro
          doc.rect(margemEsquerda, posicaoY, larguraUtil / 2, 7, 'F');
          doc.rect(margemEsquerda + larguraUtil / 2, posicaoY, larguraUtil / 2, 7, 'F');
          
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.text('Alimento', margemEsquerda + 5, posicaoY + 5);
          doc.text('Porção', margemEsquerda + larguraUtil / 2 + 5, posicaoY + 5);
          posicaoY += 7;
          
          // Conteúdo da tabela
          for (let i = 0; i < refeicao.alimentos.length; i++) {
            const alimento = refeicao.alimentos[i];
            const ehPar = i % 2 === 0;
            
            // Fundo da linha
            doc.setFillColor(ehPar ? 255 : 240, ehPar ? 255 : 240, ehPar ? 255 : 240);
            doc.rect(margemEsquerda, posicaoY, larguraUtil, 7, 'F');
            
            // Texto da linha
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.text(alimento.nome, margemEsquerda + 5, posicaoY + 5);
            doc.text(alimento.porcao, margemEsquerda + larguraUtil / 2 + 5, posicaoY + 5);
            posicaoY += 7;
            
            // Adicionar substituições se existirem
            if (alimento.substituicoes && alimento.substituicoes.length > 0) {
              // Fundo para substituições
              doc.setFillColor(255, 240, 220); // Laranja bem claro
              
              // Calcular a altura total necessária para exibir todas as substituições
              let alturaTotal = 8; // Altura para o título
              
              // Pré-calcular as linhas de texto para cada substituição
              const todasAsLinhas = [];
              for (const substituicao of alimento.substituicoes) {
                const linhasSubst = doc.splitTextToSize('• ' + substituicao, larguraUtil - 10);
                todasAsLinhas.push(linhasSubst);
                alturaTotal += linhasSubst.length * 5;
              }
              
              alturaTotal += 2; // Espaçamento final
              
              // Desenhar o retângulo de fundo com a altura correta
              doc.rect(margemEsquerda, posicaoY, larguraUtil, alturaTotal, 'F');
              
              // Título das substituições
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(236, 72, 21); // Cor laranja para o título
              doc.text('Opções de Substituição:', margemEsquerda + 5, posicaoY + 5);
              posicaoY += 8;
              
              // Listar cada substituição
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(0, 0, 0);
              
              for (let j = 0; j < alimento.substituicoes.length; j++) {
                doc.setFontSize(9);
                // Usar as linhas pré-calculadas
                const linhasSubst = todasAsLinhas[j];
                doc.text(linhasSubst, margemEsquerda + 7, posicaoY);
                posicaoY += linhasSubst.length * 5;
              }
              
              posicaoY += 2;
            }
          }
          
          // Adicionar observações se existirem
          if (refeicao.observacoes) {
            doc.setFillColor(240, 240, 240);
            doc.rect(margemEsquerda, posicaoY, larguraUtil, 7, 'F');
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            doc.text('Observações: ', margemEsquerda + 5, posicaoY + 5);
            
            const obsTexto = refeicao.observacoes;
            doc.setFont('helvetica', 'normal');
            const obsWidth = doc.getTextWidth('Observações: ');
            const linhasObs = doc.splitTextToSize(obsTexto, larguraUtil - obsWidth - 10);
            
            if (linhasObs.length > 1) {
              // Se tiver múltiplas linhas, adicionar em linhas separadas
              posicaoY += 7;
              doc.text(linhasObs, margemEsquerda + 5, posicaoY);
              posicaoY += linhasObs.length * 5;
            } else {
              // Se for uma única linha, adicionar na mesma linha
              doc.text(obsTexto, margemEsquerda + 5 + obsWidth, posicaoY + 5);
              posicaoY += 7;
            }
          }
          
          posicaoY += 10; // Espaço após cada refeição
        }
        
        // Adicionar Lista de Compras se existir
        if (listaDeCompras.length > 0) {
          // Verificar se precisa de nova página
          const alturaEstimadaLista = 15 + Math.ceil(listaDeCompras.length / 2) * 7;
          if (posicaoY + alturaEstimadaLista > doc.internal.pageSize.height - margemInferior - 20) {
            adicionarRodape(paginaAtual, paginaAtual + 1);
            doc.addPage();
            paginaAtual++;
            adicionarCabecalho(paginaAtual);
            posicaoY = margemSuperior + 5;
          }
          
          // Título da lista de compras
          doc.setFillColor(236, 72, 21); // Laranja vivo
          doc.rect(margemEsquerda, posicaoY, larguraUtil, 8, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(255, 255, 255);
          doc.text('Lista de Compras', doc.internal.pageSize.width / 2, posicaoY + 5.5, { align: 'center' });
          posicaoY += 12;
          
          // Calcular quantos itens por coluna
          const itensTotal = listaDeCompras.length;
          const itensPorColuna = Math.ceil(itensTotal / 2);
          const larguraColuna = larguraUtil / 2 - 5;
          
          // Desenhar itens em duas colunas
          for (let i = 0; i < itensPorColuna; i++) {
            const itemEsquerda = listaDeCompras[i];
            const itemDireita = i + itensPorColuna < itensTotal ? listaDeCompras[i + itensPorColuna] : null;
            
            // Verificar se precisa de nova página
            if (posicaoY + 7 > doc.internal.pageSize.height - margemInferior - 20) {
              adicionarRodape(paginaAtual, paginaAtual + 1);
              doc.addPage();
              paginaAtual++;
              adicionarCabecalho(paginaAtual);
              posicaoY = margemSuperior + 5;
            }
            
            // Fundo colorido alternado
            const ehPar = i % 2 === 0;
            if (ehPar) {
              doc.setFillColor(245, 245, 245);
              doc.rect(margemEsquerda, posicaoY, larguraUtil, 7, 'F');
            }
            
            // Texto dos itens
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            
            // Item da esquerda
            doc.text('• ' + itemEsquerda, margemEsquerda + 5, posicaoY + 5);
            
            // Item da direita (se existir)
            if (itemDireita) {
              doc.text('• ' + itemDireita, margemEsquerda + larguraUtil / 2 + 5, posicaoY + 5);
            }
            
            posicaoY += 7;
          }
        }
        
      } catch (error) {
        console.error('[gerarPDF] Erro ao processar planejamento alimentar:', error);
        console.log('[gerarPDF] Fallback para processamento como texto simples');
        processarTextoSimples(conteudo);
      }
    } else {
      // Processar como texto simples se não for um planejamento alimentar
      processarTextoSimples(conteudo);
    }
    
    function processarTextoSimples(texto: string) {
      console.log('[gerarPDF] Processando como texto simples');
      const paragrafos = texto.split('\n');
      
      for (let i = 0; i < paragrafos.length; i++) {
        const paragrafo = paragrafos[i].trim();
        
        // Pular linhas em branco
        if (paragrafo === '') {
          posicaoY += 3;
          continue;
        }
        
        // Dividir o texto em linhas para caber na largura da página
        const linhasTexto = doc.splitTextToSize(paragrafo, larguraUtil);
        const alturaTexto = linhasTexto.length * 5;
        
        // Verificar se precisa de nova página
        if (posicaoY + alturaTexto > doc.internal.pageSize.height - margemInferior - 20) {
          adicionarRodape(paginaAtual, paginaAtual + 1);
          doc.addPage();
          paginaAtual++;
          adicionarCabecalho(paginaAtual);
          posicaoY = margemSuperior + 5;
        }
        
        // Verificar se é um título (todo em maiúsculas)
        const ehTitulo = paragrafo === paragrafo.toUpperCase() && paragrafo.length > 3 && paragrafo.length < 50;
        
        if (ehTitulo) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
        }
        
        doc.text(linhasTexto, margemEsquerda, posicaoY);
        posicaoY += alturaTexto + (ehTitulo ? 5 : 3);
      }
    }
    
    // Adicionar rodapé na última página
    adicionarRodape(paginaAtual, paginaAtual);
    
    // Salvar o PDF
    const nomeArquivoCliente = perfil?.nome_completo || perfil?.nome || 'usuario';
    const nomeArquivo = `resultado_nutricional_${nomeArquivoCliente.replace(/\s+/g, '_').toLowerCase()}.pdf`;
    
    console.log('[gerarPDF] Salvando PDF como:', nomeArquivo);
    doc.save(nomeArquivo);
    
    console.log('[gerarPDF] PDF gerado com sucesso!');
    alert('PDF da avaliação nutricional gerado com sucesso!');
  } catch (error) {
    console.error('[gerarPDF] Erro ao gerar PDF:', error);
    
    if (error instanceof Error) {
      console.error('[gerarPDF] Detalhes:', error.message);
      console.error('[gerarPDF] Stack:', error.stack);
    }
    
    alert('Erro ao gerar o PDF da avaliação nutricional. Tente novamente.');
  } finally {
    // Resetar o estado de geração
    console.log('[gerarPDF] Finalizando, resetando estado...');
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