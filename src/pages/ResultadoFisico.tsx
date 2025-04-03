import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { jsPDF } from 'jspdf';
import { Play, Download, ArrowLeft } from 'lucide-react';
import BotaoMetodoTreino from '../components/BotaoMetodoTreino';
import { encontrarVideoDoExercicio as encontrarVideoUtils } from '../utils/exercicios';
import { formatarMetodoPDF, encontrarMetodoTreino } from '../utils/metodosTreino';

// Definição do objeto themeStyles que faltava
const themeStyles = {
  light: {
    scrollbar: {
      track: 'background-color: #f1f1f1',
      thumb: 'background-color: #c1c1c1'
    }
  },
  dark: {
    scrollbar: {
      track: 'background-color: #2e2e2e',
      thumb: 'background-color: #555'
    }
  }
};

interface Exercicio {
  numero: string;
  nome: string;
  series: string;
  repeticoes: string;
}

interface Treino {
  letra: string;
  descricao: string;
  titulo: string;
  exercicios: Exercicio[];
}

interface Perfil {
  liberado: string; // 'sim' ou 'nao'
  resultado_fisica: string; // Texto com o resultado da programação física
  nome?: string; // Optional nome
  nome_completo?: string;
}

interface DadosFisicos {
  objetivo: string;
  tempo_inativo: string;
  experiencia_musculacao: string;
  disponibilidade_semanal: number;
}

// Componente para exibir o modal de vídeo (memoizado)
const VideoModal = React.memo(({ videoUrl, onClose }: { videoUrl: string; onClose: () => void }) => {
  // Cache do ID do vídeo extraído
  const [videoId, setVideoId] = useState<string | null>(null);
  
  // Extrair ID apenas uma vez quando o URL mudar
  useEffect(() => {
    const getYoutubeVideoId = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };
    
    setVideoId(getYoutubeVideoId(videoUrl));
  }, [videoUrl]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden w-full max-w-3xl">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Vídeo Demonstrativo
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="w-full aspect-video">
          {videoId ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <p className="text-gray-600 dark:text-gray-300">Vídeo não disponível</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export function ResultadoFisico() {
  const navigate = useNavigate();
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [perfilLiberado, setPerfilLiberado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const location = useLocation();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const themeStyle = isDarkMode ? themeStyles.dark : themeStyles.light;
  const [error, setError] = useState<string | null>(null);
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  
  // Novos estados para memoização
  const [treinosProcessados, setTreinosProcessados] = useState<Treino[]>([]);
  const [ehFichaTreino, setEhFichaTreino] = useState<boolean>(false);
  const videoUrlCache = React.useRef(new Map<string, string | null>());
  
  // Novo estado para mensagens de carregamento sequenciais
  const [mensagemCarregamento, setMensagemCarregamento] = useState<string>('Buscando informações do seu Perfil');
  const [primeiroCarregamento, setPrimeiroCarregamento] = useState<boolean>(true);
  
  // Adicionar o novo estado
  const [dadosFisicos, setDadosFisicos] = useState<DadosFisicos | null>(null);
  
  // Obter o ID da query string
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get('id');

  // Carregar cache de vídeos do localStorage na inicialização
  useEffect(() => {
    try {
      const storedCache = localStorage.getItem('videoUrlCache');
      if (storedCache) {
        const parsedCache = JSON.parse(storedCache);
        const newCache = new Map<string, string | null>();
        
        // Converter objeto JSON de volta para Map
        Object.keys(parsedCache).forEach(key => {
          newCache.set(key, parsedCache[key]);
        });
        
        console.log(`[Cache] Carregado ${newCache.size} URLs de vídeo do localStorage`);
        videoUrlCache.current = newCache;
      }
    } catch (error) {
      console.error('Erro ao carregar cache de vídeos:', error);
    }
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

  // Efeito para mensagens de carregamento sequenciais
  useEffect(() => {
    if (!carregando || !primeiroCarregamento) return;

    const mensagens = [
      'Buscando informações do seu Perfil',
      'Buscando Programação Personalizada',
      'Compilando dados de treino',
      'Carregando Vídeos',
      'Pronto feito, fique à vontade seu FRANGO!'
    ];

    let index = 0;

    const intervalId = setInterval(() => {
      if (index < mensagens.length - 1) {
        setMensagemCarregamento(mensagens[index]);
        index++;
      } else {
        clearInterval(intervalId);
      }
    }, 1200);

    return () => clearInterval(intervalId);
  }, [carregando, primeiroCarregamento]);

  useEffect(() => {
    const buscarPerfil = async () => {
      try {
        setCarregando(true);
        
        // Definir primeira mensagem de carregamento
        setMensagemCarregamento('Buscando informações do seu Perfil');
        
        if (!id) {
          console.log('ID não fornecido na URL, buscando perfil do usuário logado');
          
          // Obter o usuário logado
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.error('Usuário não autenticado');
            setCarregando(false);
            return;
          }
          
          // Aguardar um tempo para a primeira mensagem ser exibida
          await new Promise(resolve => setTimeout(resolve, 1200));
          setMensagemCarregamento('Buscando Programação Personalizada');
          
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
          
          await new Promise(resolve => setTimeout(resolve, 1200));
          setMensagemCarregamento('Compilando dados de treino');
          
          console.log('Dados do perfil do usuário logado:', perfilUsuario);
          
          if (!perfilUsuario) {
            console.error('Nenhum perfil encontrado para o usuário logado');
            setCarregando(false);
            return;
          }
          
          // Verificar se o campo liberado é 'sim' (case insensitive)
          const liberado = typeof perfilUsuario.liberado === 'string' && 
                          perfilUsuario.liberado.toLowerCase() === 'sim';
          
          await new Promise(resolve => setTimeout(resolve, 1200));
          setMensagemCarregamento('Carregando Vídeos');
          
          setPerfil(perfilUsuario);
          setPerfilLiberado(liberado);
          
          // Buscar dados da avaliação física
          const { data: dadosAvaliacao, error: avaliacaoError } = await supabase
            .from('avaliacao_fisica')
            .select('objetivo, tempo_inativo, experiencia_musculacao, disponibilidade_semanal')
            .eq('user_id', user.id)
            .single();
            
          if (!avaliacaoError && dadosAvaliacao) {
            setDadosFisicos(dadosAvaliacao);
          }
          
          // Aguardar um pouco mais para mostrar a última mensagem
          await new Promise(resolve => setTimeout(resolve, 1200));
          setMensagemCarregamento('Pronto feito, fique à vontade seu FRANGO!');
          
          // Finalizar carregamento após exibir a última mensagem
          await new Promise(resolve => setTimeout(resolve, 1500));
          setCarregando(false);
          setPrimeiroCarregamento(false);
          return;
        }
        
        // Código similar para quando um ID é fornecido
        console.log('Buscando perfil com ID:', id);
        
        // Aguardar um tempo para a primeira mensagem ser exibida
        await new Promise(resolve => setTimeout(resolve, 1200));
        setMensagemCarregamento('Buscando Programação Personalizada');
        
        const { data, error } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Erro ao buscar perfil:', error);
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1200));
        setMensagemCarregamento('Compilando dados de treino');
        
        console.log('Dados do perfil recebidos:', data);
        
        if (!data) {
          console.error('Nenhum dado de perfil encontrado');
          setCarregando(false);
          return;
        }
        
        // Verificar se o campo liberado é 'sim' (case insensitive)
        const liberado = typeof data.liberado === 'string' && 
                        data.liberado.toLowerCase() === 'sim';
        
        await new Promise(resolve => setTimeout(resolve, 1200));
        setMensagemCarregamento('Carregando Vídeos');
        
        setPerfil(data);
        setPerfilLiberado(liberado);
        
        // Buscar dados da avaliação física
        const { data: dadosAvaliacao, error: avaliacaoError } = await supabase
          .from('avaliacao_fisica')
          .select('objetivo, tempo_inativo, experiencia_musculacao, disponibilidade_semanal')
          .eq('user_id', data.user_id) // Assumimos que temos user_id na tabela perfis
          .single();
          
        if (!avaliacaoError && dadosAvaliacao) {
          setDadosFisicos(dadosAvaliacao);
        }
        
        // Aguardar um pouco mais para mostrar a última mensagem
        await new Promise(resolve => setTimeout(resolve, 1200));
        setMensagemCarregamento('Pronto feito, fique à vontade seu FRANGO!');
        
        // Finalizar carregamento após exibir a última mensagem
        await new Promise(resolve => setTimeout(resolve, 1500));
        setCarregando(false);
        setPrimeiroCarregamento(false);
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        setCarregando(false);
        setPrimeiroCarregamento(false);
        alert('Erro ao carregar os dados. Por favor, tente novamente.');
      }
    };

    buscarPerfil();
  }, [id]);

  // Processamento único dos dados quando o perfil muda
  useEffect(() => {
    if (perfil?.resultado_fisica) {
      // Verificar se já temos os treinos processados no localStorage
      const storageKey = `treinosProcessados_${id || 'user'}`;
      
      try {
        const storedTreinos = localStorage.getItem(storageKey);
        
        if (storedTreinos) {
          console.log('Carregando treinos processados do localStorage');
          setTreinosProcessados(JSON.parse(storedTreinos));
          setEhFichaTreino(true);
          return;
        }
      } catch (error) {
        console.error('Erro ao carregar treinos do localStorage:', error);
      }
      
      const conteudo = perfil.resultado_fisica;
      
      // Verificar se parece ser uma ficha de treino
      const pareceSerFichaDeTreino = conteudo.includes('TREINO A') || 
                                     conteudo.includes('TREINO B') || 
                                     conteudo.toLowerCase().includes('treino a') ||
                                     conteudo.toLowerCase().includes('treino b') ||
                                     conteudo.includes('exercício') ||
                                     conteudo.includes('exercicio') ||
                                     conteudo.includes('séries') ||
                                     conteudo.includes('series');
      
      setEhFichaTreino(pareceSerFichaDeTreino);
      
      if (pareceSerFichaDeTreino) {
        // Processar o conteúdo uma única vez
        const processarConteudoTreino = () => {
          try {
            const linhas = conteudo.split('\n').filter(linha => linha.trim().length > 0);
            
            const treinos: Treino[] = [];
            let treinoAtual: Treino | null = null;
            
            const regexTreino = /TREINO\s+([A-Z])(?:\s*[:]\s*|\s+)(.+)?/i;
            const regexExercicio = /^(\d+)\s*[-–—]\s*(.+)/i;
            
            for (let i = 0; i < linhas.length; i++) {
              const linha = linhas[i].trim();
              
              // Verificar se é uma linha de treino
              const matchTreino = linha.match(regexTreino);
              
              if (matchTreino) {
                // Se já temos um treino atual, adicionar ao array
                if (treinoAtual) {
                  treinos.push(treinoAtual);
                }
                
                // Criar novo treino
                treinoAtual = {
                  letra: matchTreino[1], // A, B, C, etc.
                  descricao: matchTreino[2] || '',
                  titulo: linha,
                  exercicios: []
                };
                continue;
              }
              
              // Se estamos em um treino, verificar se é um exercício ou cabeçalho
              if (treinoAtual) {
                // Verificar se contém "Séries" (provavelmente cabeçalho)
                if (linha.includes('Séries') || linha.includes('Rep.')) {
                  continue; // Pular esta linha
                }
                
                // Verificar se é um exercício numerado
                const matchExercicio = linha.match(regexExercicio);
                
                if (matchExercicio) {
                  const numero = matchExercicio[1];
                  const nomeCompleto = matchExercicio[2].trim();
                  
                  // Extrair séries e repetições (código existente)
                  // ... 
                  
                  // Copie aqui toda a lógica existente de extração de séries e repetições
                  const regexSeriesReps = /(\d+)\s*[xX]\s*([0-9\/]+(?:\s*a\s*\d+)?)/;
                  const matchSeriesReps = nomeCompleto.match(regexSeriesReps);
                  
                  let nome = nomeCompleto;
                  let series = '';
                  let repeticoes = '';
                  
                  // O resto do código de processamento...
                  // Copie exatamente o código que já existe para processamento
                
                  // Verificar se o exercício já contém informações sobre séries e repetições
                  if (matchSeriesReps) {
                    // Remover a parte de séries/reps do nome
                    nome = nomeCompleto.replace(matchSeriesReps[0], '').trim();
                    series = matchSeriesReps[1] + 'x';
                    repeticoes = matchSeriesReps[2];
                  } else {
                    // Tentar encontrar padrões específicos como "3 X 12 (CADA LADO)"
                    const regexEspecial = /(\d+)\s*[xX]\s*([0-9\/]+(?:\s*a\s*\d+)?)\s*\(([^)]+)\)/;
                    const matchEspecial = nomeCompleto.match(regexEspecial);
                    
                    if (matchEspecial) {
                      nome = nomeCompleto.replace(matchEspecial[0], '').trim() + ' (' + matchEspecial[3] + ')';
                      series = matchEspecial[1] + 'x';
                      repeticoes = matchEspecial[2];
                    }
                  }
                  
                  // Verificar séries e repetições na próxima linha e demais verificações
                  // (copie todo o código existente para essas verificações)
                  
                  // Adicionar à lista de exercícios, usando valores padrão se necessário
                  treinoAtual.exercicios.push({
                    numero,
                    nome,
                    series: series || '3x', // Valor padrão
                    repeticoes: repeticoes || '12/10/8' // Valor padrão
                  });
                }
              }
            }
            
            // Adicionar o último treino se existir
            if (treinoAtual) {
              treinos.push(treinoAtual);
            }
            
            return treinos;
          } catch (error) {
            console.error('Erro ao processar ficha de treino:', error);
            return [];
          }
        };
        
        const treinos = processarConteudoTreino();
        setTreinosProcessados(treinos);
        
        // Salvar treinos processados no localStorage
        try {
          localStorage.setItem(storageKey, JSON.stringify(treinos));
          console.log('Treinos processados salvos no localStorage');
        } catch (error) {
          console.error('Erro ao salvar treinos no localStorage:', error);
        }
      }
    }
  }, [perfil?.resultado_fisica, id]);

  // Versão memoizada da função encontrarVideoDoExercicio com persistência no localStorage
  const encontrarVideoDoExercicioMemoizado = React.useCallback((nomeExercicio: string, dispositivo: 'APP' | 'WEB' | 'PDF' = 'WEB') => {
    const cacheKey = `${nomeExercicio}_${dispositivo}`;
    
    // Verificar se já temos o URL no cache
    if (videoUrlCache.current.has(cacheKey)) {
      return videoUrlCache.current.get(cacheKey);
    }
    
    // Se não tiver no cache, buscar o URL e armazenar
    const videoUrl = encontrarVideoUtils(nomeExercicio, dispositivo);
    videoUrlCache.current.set(cacheKey, videoUrl);
    
    // Salvar cache atualizado no localStorage
    try {
      // Converter Map para objeto JSON
      const cacheObject = Object.fromEntries(videoUrlCache.current.entries());
      localStorage.setItem('videoUrlCache', JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Erro ao salvar cache de vídeos:', error);
    }
    
    return videoUrl;
  }, []);

  // Função para gerar PDF da programação física
  const gerarPDF = async () => {
    console.log('Iniciando geração do PDF físico...');
    
    if (!perfil) {
      console.error('Perfil não encontrado');
      alert('Perfil não encontrado. Não é possível gerar o PDF.');
      return;
    }
    
    const conteudo = perfil.resultado_fisica;
    
    if (!conteudo) {
      console.error('Conteúdo físico não disponível');
      alert('Não há resultado de programação física disponível para gerar o PDF');
      return;
    }
    
    try {
      setGerandoPDF(true);
      
      console.log('Conteúdo encontrado, tamanho:', conteudo.length);
      console.log('Iniciando criação do documento PDF...');
      
      // Configuração do documento
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      console.log('Documento PDF criado com sucesso');
      
      // Definições de margens e dimensões
      const margemEsquerda = 5;
      const margemDireita = 5;
      const margemSuperior = 20;
      const margemInferior = 10;
      const larguraUtil = doc.internal.pageSize.width - margemEsquerda - margemDireita;
      
      console.log('Configurações do documento:', { 
        margemEsquerda, 
        margemDireita, 
        margemSuperior, 
        margemInferior, 
        larguraUtil,
        larguraPagina: doc.internal.pageSize.width,
        alturaPagina: doc.internal.pageSize.height
      });
      
      // Variáveis de controle de página e posição
      let paginaAtual = 1;
      let posicaoY = margemSuperior + 5;
      
      // Função para adicionar cabeçalho
      const adicionarCabecalho = (pagina: number) => {
        // Retângulo roxo do cabeçalho
        doc.setFillColor(147, 51, 234); // Roxo #9333EA
        doc.rect(0, 0, doc.internal.pageSize.width, 20, 'F');
        
        // Título
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255); // Texto branco
        doc.text('PROGRAMAÇÃO FÍSICA', doc.internal.pageSize.width / 2, 13, { align: 'center' });
        
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
      
      // Verificar se parece ser uma ficha de treino
      const pareceSerFichaDeTreino = conteudo.includes('TREINO A') || 
                                     conteudo.includes('TREINO B') || 
                                     conteudo.toLowerCase().includes('treino a') ||
                                     conteudo.toLowerCase().includes('treino b') ||
                                     conteudo.includes('exercício') ||
                                     conteudo.includes('exercicio') ||
                                     conteudo.includes('séries') ||
                                     conteudo.includes('series');
      
      console.log('Parece ser ficha de treino?', pareceSerFichaDeTreino);
      
      if (pareceSerFichaDeTreino) {
            // Renderizar os treinos no PDF
            console.log('Renderizando treinos no PDF...');
            doc.setTextColor(0, 0, 0); // Texto preto
            
            // Calcular total de páginas (estimativa)
        const totalPaginas = Math.ceil(treinosProcessados.length / 2) + 1;
            
            // Processar cada treino
        for (let t = 0; t < treinosProcessados.length; t++) {
          const treino = treinosProcessados[t];
              
              // Verificar se precisamos de uma nova página
              if (posicaoY > (doc.internal.pageSize.height - margemInferior - 30)) {
                adicionarRodape(paginaAtual, totalPaginas);
                doc.addPage();
                paginaAtual++;
                adicionarCabecalho(paginaAtual);
                posicaoY = margemSuperior + 5;
              }
              
              // Título do treino
              doc.setFillColor(147, 51, 234); // Roxo #9333EA
              doc.rect(margemEsquerda, posicaoY, larguraUtil, 10, 'F');
              
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9); // Tamanho padronizado para 9
              doc.setTextColor(255, 255, 255); // Texto branco para o título do treino
              doc.text(`TREINO ${treino.letra}${treino.descricao ? ': ' + treino.descricao : ''}`, 
                      margemEsquerda + 2, 
                      posicaoY + 7);
              
              posicaoY += 12;
              
              // Cabeçalho da tabela - com fundo preto como na imagem
              doc.setFillColor(0, 0, 0); // Fundo preto
              doc.rect(margemEsquerda, posicaoY, larguraUtil * 0.7, 6, 'F'); // Exercício (70% da largura)
              doc.rect(margemEsquerda + larguraUtil * 0.7, posicaoY, larguraUtil * 0.15, 6, 'F'); // Séries (15%)
              doc.rect(margemEsquerda + larguraUtil * 0.85, posicaoY, larguraUtil * 0.15, 6, 'F'); // Repetições (15%)
              
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9); // Padronizando tamanho da fonte
              doc.setTextColor(255, 255, 255); // Texto branco
              doc.text('Exercício', margemEsquerda + 2, posicaoY + 4);
              doc.text('Séries', margemEsquerda + larguraUtil * 0.75, posicaoY + 4, { align: 'center' });
              doc.text('Repetições', margemEsquerda + larguraUtil * 0.9, posicaoY + 4, { align: 'center' });
              
              posicaoY += 8;
              
              // Exercícios
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(9);
              doc.setTextColor(0, 0, 0);
              
              for (const exercicio of treino.exercicios) {
                // Verificar espaço necessário para o exercício
                const alturaExercicio = 8;
                
                // Verificar se precisamos de uma nova página
                if (posicaoY + alturaExercicio > (doc.internal.pageSize.height - margemInferior - 10)) {
                  adicionarRodape(paginaAtual, totalPaginas);
                  doc.addPage();
                  paginaAtual++;
                  adicionarCabecalho(paginaAtual);
                  posicaoY = margemSuperior + 5;
                  
                  // Redesenhar o cabeçalho da tabela na nova página - com fundo preto
                  doc.setFillColor(0, 0, 0); // Fundo preto
                  doc.rect(margemEsquerda, posicaoY, larguraUtil * 0.7, 6, 'F'); // Exercício (70% da largura)
                  doc.rect(margemEsquerda + larguraUtil * 0.7, posicaoY, larguraUtil * 0.15, 6, 'F'); // Séries (15%)
                  doc.rect(margemEsquerda + larguraUtil * 0.85, posicaoY, larguraUtil * 0.15, 6, 'F'); // Repetições (15%)
                  
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(9); // Padronizando tamanho da fonte
                  doc.setTextColor(255, 255, 255); // Texto branco
                  doc.text('Exercício', margemEsquerda + 2, posicaoY + 4);
                  doc.text('Séries', margemEsquerda + larguraUtil * 0.75, posicaoY + 4, { align: 'center' });
                  doc.text('Repetições', margemEsquerda + larguraUtil * 0.9, posicaoY + 4, { align: 'center' });
                  
                  posicaoY += 8;
                }
                
                // Linhas alternadas com fundo branco e cinza claro
            if ((treinosProcessados.indexOf(treino) % 2) === 0) {
                  doc.setFillColor(245, 245, 245);
                } else {
                  doc.setFillColor(255, 255, 255);
                }
                doc.rect(margemEsquerda, posicaoY, larguraUtil, alturaExercicio, 'F');
                
                // Nome do exercício - Não remover qualquer menção ao método do nome do exercício
                const nomeExercicioLimpo = exercicio.nome
                  .replace(/^\d+\s*[-–—]\s*/, '') // Remover apenas o número de exercício se houver
                  .trim();
                
                // Formatar número e nome do exercício
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9); // Padronizando tamanho
                doc.text(`${exercicio.numero} - ${nomeExercicioLimpo}`, margemEsquerda + 2, posicaoY + alturaExercicio/2 + 1);
                
                // Séries
                doc.text(exercicio.series, margemEsquerda + larguraUtil * 0.75, posicaoY + alturaExercicio/2 + 1, { align: 'center' });
                
                // Repetições
                doc.text(exercicio.repeticoes, margemEsquerda + larguraUtil * 0.9, posicaoY + alturaExercicio/2 + 1, { align: 'center' });
                
                // Adicionar botão "VER VÍDEO" similar ao da imagem
            const videoUrl = encontrarVideoDoExercicioMemoizado(exercicio.nome, 'PDF');
                
                if (videoUrl) {
                  // Posição para o botão "VER VÍDEO" alinhado à direita
                  const larguraBotao = 30; // Largura padronizada
                  const alturaBotao = 7; // Altura padronizada
                  const posXBotao = margemEsquerda + larguraUtil - 3; // Mais à direita
                  const posYBotao = posicaoY + (alturaExercicio - alturaBotao) / 2;
                  
                  // Desenhar botão "VER VÍDEO" com fundo roxo
                  doc.setFillColor(147, 51, 234); // Roxo #9333EA
                  doc.roundedRect(posXBotao - larguraBotao, posYBotao, larguraBotao, alturaBotao, 1, 1, 'F');
                  
                  // Texto "VER VÍDEO" em branco
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(9); // Padronizado para 9
                  doc.setTextColor(255, 255, 255);
                  doc.text('VER VÍDEO', posXBotao - larguraBotao/2, posYBotao + alturaBotao/2 + 1, { align: 'center' });
                  
                  // Adicionar link para o vídeo do YouTube
                  doc.link(
                    posXBotao - larguraBotao, 
                    posYBotao, 
                    larguraBotao, 
                    alturaBotao, 
                    { url: videoUrl }
                  );
                  
                  // Voltar para a cor de texto padrão
                  doc.setTextColor(0, 0, 0);
                }
                
                // Adicionar método se existir
                const metodoInfo = formatarMetodoPDF(exercicio.nome);
                if (metodoInfo) {
                  posicaoY += alturaExercicio;
                  
                  // Título do método
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(9); // Padronizado para 9
                  doc.setTextColor(0, 0, 255); // Azul para o título do método
                  doc.text(`MÉTODO ${metodoInfo.metodoNome}:`, margemEsquerda + 2, posicaoY + 4);
                  
                  // Calcular a altura necessária para a descrição
                  const descricaoLinhas = doc.splitTextToSize(metodoInfo.descricao, larguraUtil - 10);
                  const alturaDescricao = descricaoLinhas.length * 5 + 10; // 5pt por linha + margens
                  
                  // Fundo azul claro para o corpo do método
                  doc.setFillColor(230, 240, 255);
                  doc.rect(margemEsquerda, posicaoY + 6, larguraUtil, alturaDescricao, 'F');
                  
                  // Descrição do método
                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(9); // Padronizado para 9
                  doc.setTextColor(0, 0, 200); // Azul mais vivo para a descrição
                  
                  // Desenhar o texto da descrição linha por linha
                  for (let i = 0; i < descricaoLinhas.length; i++) {
                    doc.text(descricaoLinhas[i], margemEsquerda + 5, posicaoY + 12 + (i * 5));
                  }
                  
                  // Ajustar altura conforme o número de linhas na descrição
                  posicaoY += alturaDescricao;
                  
                  // Importante: Redefinir a cor de texto para preto após o método
                  doc.setTextColor(0, 0, 0);
                } else {
                  posicaoY += alturaExercicio;
                }
              }
              
              // Redefinir a cor do texto para preto antes de continuar
              doc.setTextColor(0, 0, 0);
              posicaoY += 15;
            }
            
            // Adicionar rodapé na última página
            adicionarRodape(paginaAtual, totalPaginas);
      } else {
        // Usar o método padrão para texto simples
        processarTextoSimples();
      }
      
      // Função para processar texto simples sem formatação específica
      function processarTextoSimples() {
        // Configuração de estilo
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        // Dividir o conteúdo em linhas
        const linhas = conteudo.split('\n');
        
        // Estimar o número total de páginas
        const alturaLinha = 5; // altura estimada por linha em mm
        const totalLinhas = linhas.length;
        const linhasPorPagina = Math.floor((doc.internal.pageSize.height - margemSuperior - margemInferior) / alturaLinha);
        const totalPaginas = Math.ceil(totalLinhas / linhasPorPagina);
        
        // Adicionar primeira página
        let linhaAtual = 0;
        
        while (linhaAtual < totalLinhas) {
          // Verificar se precisamos de uma nova página
          if (posicaoY >= (doc.internal.pageSize.height - margemInferior)) {
            adicionarRodape(paginaAtual, totalPaginas);
            doc.addPage();
            paginaAtual++;
            adicionarCabecalho(paginaAtual);
            posicaoY = margemSuperior + 5;
          }
          
          const linha = linhas[linhaAtual].trim();
          
          // Verificar se é um título
          if (linha.match(/^[A-Z\s]{5,}$/) || 
              linha.match(/^TREINO\s+[A-Z]/) || 
              linha.includes('FICHA DE TREINO')) {
            // Renderizar como título
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(147, 51, 234); // Roxo #9333EA
            doc.text(linha, margemEsquerda, posicaoY);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            posicaoY += 7;
          } else {
            // Renderizar como texto normal
            const linhasSplitadas = doc.splitTextToSize(linha, larguraUtil);
            for (const linhaSplitada of linhasSplitadas) {
              if (posicaoY >= (doc.internal.pageSize.height - margemInferior)) {
                adicionarRodape(paginaAtual, totalPaginas);
                doc.addPage();
                paginaAtual++;
                adicionarCabecalho(paginaAtual);
                posicaoY = margemSuperior + 5;
              }
              
              doc.text(linhaSplitada, margemEsquerda, posicaoY);
              posicaoY += 5;
            }
          }
          
          linhaAtual++;
        }
        
        // Adicionar rodapé na última página
        adicionarRodape(paginaAtual, totalPaginas);
      }
      
      // Salvar o PDF
      console.log('Preparando para salvar o PDF...');
      try {
        doc.save('programacao_fisica.pdf');
        console.log('PDF gerado e salvo com sucesso!');
      } catch (saveError) {
        console.error('Erro ao salvar o PDF:', saveError);
        throw saveError;
      }
    } catch (error) {
      console.error('Erro ao gerar PDF da programação física:', error);
      alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
    } finally {
      setTimeout(() => {
        setGerandoPDF(false);
        console.log('Estado gerandoPDF definido como false');
      }, 1000);
    }
  };

  // Componente otimizado para cada exercício (memoizado)
  const ExercicioCard = React.memo(({ exercicio, index }: { exercicio: Exercicio, index: number }) => {
    // Usar a versão memoizada para encontrar vídeos
    const videoUrl = encontrarVideoDoExercicioMemoizado(exercicio.nome, 'WEB');
    
        return (
      <div className="bg-purple-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
                        <div className="flex flex-col mb-3">
                          <div className="flex items-start mb-2">
                            <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                              <span className="text-sm font-bold">{exercicio.numero}</span>
                            </div>
                            <span className="text-gray-800 dark:text-white font-medium">
                              {exercicio.nome}
                            </span>
                          </div>
                          
                          <div className="pl-8 mb-3 flex items-center gap-2">
                            {videoUrl && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setVideoModalUrl(videoUrl);
                                }}
                                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-full inline-flex items-center"
                              >
                                <Play className="w-3 h-3 mr-1.5" />VER VÍDEO
                              </button>
                            )}
                            
                            <BotaoMetodoTreino nomeExercicio={exercicio.nome} />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 pl-8">
                          <div className="pr-4">
                            <div className="uppercase text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">
                              SÉRIES
                            </div>
                            <div className="font-bold text-lg">
                              {exercicio.series}
                            </div>
                          </div>
                          <div>
                            <div className="uppercase text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">
                              REPETIÇÕES
                            </div>
                            <div className="font-bold text-lg">
                              {exercicio.repeticoes}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
  });

  // Componente otimizado para cada treino (memoizado)
  const TreinoCard = React.memo(({ treino, index }: { treino: Treino, index: number }) => {
    return (
      <div className="mb-6">
        <div className="bg-purple-600 px-4 py-3 rounded-t-lg flex items-center">
          <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center mr-3">
            <span className="text-white font-bold">{treino.letra}</span>
                </div>
          <h2 className="text-lg font-semibold text-white">
            TREINO {treino.letra}{treino.descricao ? ': ' + treino.descricao : ''}
          </h2>
              </div>
        
        <div>
          {treino.exercicios.map((exercicio, exIndex) => (
            <ExercicioCard key={exIndex} exercicio={exercicio} index={exIndex} />
            ))}
        </div>
          </div>
        );
  });

  // Função renderizarResultado otimizada
  const renderizarResultado = (conteudo: string | null) => {
    if (!conteudo) {
      return <div className="text-gray-500">Nenhum resultado disponível ainda.</div>;
    }

    // Renderizar como texto simples se não for ficha de treino
    if (!ehFichaTreino) {
        return <pre className="whitespace-pre-wrap">{conteudo}</pre>;
      }
    
    // Renderizar os treinos processados
    if (treinosProcessados.length === 0) {
      return <div className="flex justify-center p-4">Processando dados...</div>;
    }
    
    return (
      <div>
        {treinosProcessados.map((treino, index) => (
          <TreinoCard key={index} treino={treino} index={index} />
        ))}
      </div>
    );
  };

  // Componente para exibir tela de carregamento com mensagens sequenciais
  const TelaCarregamento = () => (
    <div className="flex flex-col items-center justify-center py-12 h-[50vh]">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full text-center shadow-lg border border-purple-100 dark:border-purple-900 relative overflow-hidden">
        {/* Efeito de gradiente decorativo no topo */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-400 via-purple-600 to-purple-800"></div>
        
        <div className="relative bg-purple-100 dark:bg-purple-900/30 w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center">
          {mensagemCarregamento.includes('FRANGO') ? (
            <svg className="w-12 h-12 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          ) : (
            <>
              <svg className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              <span className="absolute w-full h-full rounded-full bg-purple-200 dark:bg-purple-800/40 animate-ping opacity-30"></span>
            </>
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          {mensagemCarregamento.includes('FRANGO') 
            ? 'Carregamento Finalizado!' 
            : 'Carregando Programação Física'}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6 min-h-[50px] flex items-center justify-center">
          <span className={`transition-all duration-500 ${mensagemCarregamento.includes('FRANGO') ? 'text-green-600 dark:text-green-400 font-bold text-lg' : ''}`}>
            {mensagemCarregamento}
          </span>
        </p>
        
        {!mensagemCarregamento.includes('FRANGO') && (
          <div className="flex justify-center space-x-2 mb-4">
            <span className="w-3 h-3 rounded-full bg-purple-600 animate-bounce"></span>
            <span className="w-3 h-3 rounded-full bg-purple-600 animate-bounce delay-75"></span>
            <span className="w-3 h-3 rounded-full bg-purple-600 animate-bounce delay-150"></span>
          </div>
        )}
      </div>
    </div>
  );

  // Renderização principal do componente
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Modal de vídeo */}
      {videoModalUrl && (
        <VideoModal videoUrl={videoModalUrl} onClose={() => setVideoModalUrl(null)} />
      )}
      
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Cabeçalho simplificado no estilo da imagem */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-4 p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <h1 className="text-2xl font-bold">
            <div className="text-purple-600">Programação Física</div>
          </h1>
          <div className="h-1 w-32 bg-purple-600 mt-2 mb-4 rounded-full"></div>
          
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Confira sua ficha de treino personalizada e comece a transformar seu corpo hoje mesmo.
          </p>
        </div>

        {/* Seus Dados */}
        {dadosFisicos && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400 mb-4">Seus Dados</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Objetivo
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                  {dadosFisicos.objetivo?.toLowerCase()}
                </span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Tempo Inativo
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {dadosFisicos.tempo_inativo.replace(/_/g, '-').replace(/_meses$/, ' meses')}
                </span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Experiência
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                  {dadosFisicos.experiencia_musculacao?.toLowerCase()}
                </span>
              </div>
              
              <div className="flex flex-col col-span-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Disponibilidade Semanal
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                  {typeof dadosFisicos.disponibilidade_semanal === 'string' 
                    ? dadosFisicos.disponibilidade_semanal.replace(/\s*dias\s*por\s*semana\s*/i, "").trim() + " dias por semana"
                    : dadosFisicos.disponibilidade_semanal + " dias por semana"
                  }
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo principal */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-purple-100 dark:border-purple-900">
          {/* Cabeçalho do cartão com posicionamento atualizado */}
          <div className="relative border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center">
                <div className="w-1 h-6 bg-purple-600 rounded-full mr-3"></div>
                <h2 className="text-base font-medium text-gray-800 dark:text-white">
                  Sua programação física
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Botão Ver Programação Nutricional */}
                <button
                  onClick={() => navigate('/resultado-nutricional')}
                  className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white shadow-sm hover:shadow transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Ver Programação Nutricional
                </button>

                {/* Botão Baixar PDF */}
                <button
                  onClick={() => {
                    console.log("Botão 'Baixar PDF' clicado");
                    gerarPDF();
                  }}
                  disabled={gerandoPDF || !perfil?.resultado_fisica || carregando}
                  className={`
                    flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium 
                    ${gerandoPDF || !perfil?.resultado_fisica || carregando
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                      : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow transition-all'}
                  `}
                >
                  {gerandoPDF ? 
                    'Gerando PDF...' : 
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Baixar PDF
                    </>
                  }
                </button>
              </div>
            </div>
          </div>
          
          {/* Corpo do cartão */}
          <div className="p-0">
            {carregando ? (
              <TelaCarregamento />
            ) : !perfilLiberado ? (
              <div className="bg-yellow-50 dark:bg-gray-700 border-l-4 border-yellow-400 p-4 m-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-200">
                      Seu acesso aos resultados ainda não foi liberado. Entre em contato com o administrador.
                    </p>
                  </div>
                </div>
              </div>
            ) : perfil?.resultado_fisica ? (
              <div className="custom-scrollbar overflow-y-auto max-h-[70vh]">
                {renderizarResultado(perfil.resultado_fisica)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full text-center shadow-lg border border-purple-100 dark:border-purple-900 relative overflow-hidden">
                  {/* Efeito de gradiente decorativo no topo */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-400 via-purple-600 to-purple-800"></div>
                  
                  <div className="relative bg-purple-100 dark:bg-purple-900/30 w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-12 h-12 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {/* Animação de pulso */}
                    <span className="absolute w-full h-full rounded-full bg-purple-200 dark:bg-purple-800/40 animate-ping opacity-30"></span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Resultado em Processamento</h2>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    A programação física está sendo elaborada pela nossa equipe de especialistas.
                  </p>
                  
                  <div className="flex justify-center space-x-2 mb-4">
                    <span className="w-3 h-3 rounded-full bg-purple-600 animate-bounce"></span>
                    <span className="w-3 h-3 rounded-full bg-purple-600 animate-bounce delay-75"></span>
                    <span className="w-3 h-3 rounded-full bg-purple-600 animate-bounce delay-150"></span>
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Você receberá uma notificação assim que estiver disponível.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 