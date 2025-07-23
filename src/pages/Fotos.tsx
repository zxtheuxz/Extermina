import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { 
  Image, 
  FileText, 
  CheckCircle, 
  Clock, 
  Download, 
  X, 
  AlertTriangle,
  Camera,
  FileCheck
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useActivityLoggerContext } from '../providers/ActivityLoggerProvider';

interface PerfilFotos {
  nome_completo?: string;
  foto_frente_url?: string;
  foto_costas_url?: string;
  foto_lateral_direita_url?: string;
  foto_lateral_esquerda_url?: string;
}

interface LaudoMedico {
  id: string;
  status: string;
  tipo_documento: string;
  documento_url: string;
  observacoes?: string;
  created_at: string;
  aprovado_em?: string;
}

interface FotoInfo {
  id: string;
  title: string;
  url?: string;
  position: string;
  uploaded: boolean;
}

export function Fotos() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<PerfilFotos | null>(null);
  const [laudos, setLaudos] = useState<LaudoMedico[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const navigate = useNavigate();
  const activityLogger = useActivityLoggerContext();

  // Hook para fechar modal com tecla ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedPhoto) {
        setSelectedPhoto(null);
      }
    };

    if (selectedPhoto) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [selectedPhoto]);

  useEffect(() => {
    async function loadUserPhotos() {
      try {
        setLoading(true);
        
        // Buscar usuário logado
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Buscar dados do perfil com fotos
          const { data: perfilData, error: perfilError } = await supabase
            .from('perfis')
            .select(`
              nome_completo,
              foto_frente_url,
              foto_costas_url,
              foto_lateral_direita_url,
              foto_lateral_esquerda_url
            `)
            .eq('user_id', user.id)
            .single();

          if (perfilError) {
            console.error('Erro ao buscar perfil:', perfilError);
            setError('Erro ao carregar suas fotos. Tente novamente.');
          } else {
            setPerfil(perfilData);
          }

          // Buscar laudos médicos na tabela analises_medicamentos
          const { data: laudosData, error: laudosError } = await supabase
            .from('analises_medicamentos')
            .select(`
              id,
              status,
              tipo_documento,
              documento_url,
              observacoes,
              created_at,
              aprovado_em
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (laudosError) {
            console.error('Erro ao buscar laudos:', laudosError);
          } else {
            setLaudos(laudosData || []);
          }

          // Registrar acesso à página
          try {
            await activityLogger.logPageVisit('Página de Fotos', '/fotos');
          } catch (error) {
            console.error('Erro ao registrar acesso à página de fotos:', error);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar fotos:', error);
        setError('Erro ao verificar sua sessão.');
      } finally {
        setLoading(false);
      }
    }

    loadUserPhotos();
  }, [navigate, activityLogger]);

  // Preparar dados das fotos
  const fotos: FotoInfo[] = [
    {
      id: 'frente',
      title: 'Foto de Frente',
      url: perfil?.foto_frente_url,
      position: 'frente',
      uploaded: !!perfil?.foto_frente_url
    },
    {
      id: 'costas',
      title: 'Foto de Costas',
      url: perfil?.foto_costas_url,
      position: 'costas',
      uploaded: !!perfil?.foto_costas_url
    },
    {
      id: 'lateral_direita',
      title: 'Foto Lateral Direita',
      url: perfil?.foto_lateral_direita_url,
      position: 'lateral_direita',
      uploaded: !!perfil?.foto_lateral_direita_url
    },
    {
      id: 'lateral_esquerda',
      title: 'Foto Lateral Esquerda',
      url: perfil?.foto_lateral_esquerda_url,
      position: 'lateral_esquerda',
      uploaded: !!perfil?.foto_lateral_esquerda_url
    }
  ];

  const fotosEnviadas = fotos.filter(foto => foto.uploaded).length;
  const totalFotos = fotos.length;
  
  // Verificar se não há fotos nem laudos
  const semFotosELaudos = fotosEnviadas === 0 && laudos.length === 0;

  const handleDownloadLaudo = (laudoUrl: string) => {
    if (laudoUrl) {
      window.open(laudoUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className={`flex items-center justify-center min-h-screen ${
          isDarkMode ? 'bg-black' : 'bg-gray-50'
        }`}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
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
      } px-4 py-8 relative`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className={`mb-8 ${semFotosELaudos ? 'blur-sm' : ''}`}>
            <h1 className={`text-4xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Suas Fotos e Laudos
            </h1>
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Acompanhe suas fotos de progresso e documentos médicos
            </p>
          </div>

          {/* Status das Fotos */}
          <div className={`mb-8 p-6 rounded-2xl shadow-lg border ${semFotosELaudos ? 'blur-sm' : ''} ${
            isDarkMode 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Fotos de Progresso
              </h2>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                fotosEnviadas === totalFotos
                  ? isDarkMode 
                    ? 'bg-green-900/30 text-green-400' 
                    : 'bg-green-100 text-green-700'
                  : isDarkMode 
                    ? 'bg-orange-900/30 text-orange-400' 
                    : 'bg-orange-100 text-orange-700'
              }`}>
                {fotosEnviadas}/{totalFotos} fotos enviadas
              </div>
            </div>
            
            <div className={`p-4 rounded-xl mb-6 ${
              isDarkMode 
                ? 'bg-blue-900/20 border border-blue-500/30' 
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center">
                <Camera className={`h-5 w-5 mr-3 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <div>
                  <p className={`text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-blue-200' : 'text-blue-800'
                  }`}>
                    Fotos de Progresso - Não Obrigatórias
                  </p>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-700'
                  }`}>
                    O envio de fotos não é obrigatório. Caso seja necessário, nossa equipe de suporte entrará em contato pelo WhatsApp para solicitar as fotos.
                  </p>
                </div>
              </div>
            </div>

            {/* Grid de Fotos */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {fotos.map((foto) => (
                <div
                  key={foto.id}
                  className={`relative aspect-square rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                    foto.uploaded
                      ? 'border-green-500 cursor-pointer hover:shadow-lg'
                      : isDarkMode 
                        ? 'border-gray-600 border-dashed' 
                        : 'border-gray-300 border-dashed'
                  }`}
                  onClick={() => foto.uploaded && setSelectedPhoto(foto.url!)}
                >
                  {foto.uploaded ? (
                    <>
                      <img
                        src={foto.url}
                        alt={foto.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-6 w-6 text-green-500 bg-white rounded-full" />
                      </div>
                    </>
                  ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center ${
                      isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                    }`}>
                      <Clock className={`h-8 w-8 mb-2 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <p className={`text-xs text-center px-2 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Aguardando foto
                      </p>
                    </div>
                  )}
                  <div className={`absolute bottom-0 left-0 right-0 p-2 ${
                    isDarkMode ? 'bg-black/70' : 'bg-white/90'
                  }`}>
                    <p className={`text-xs font-medium truncate ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {foto.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seção de Laudos */}
          <div className={`mb-8 p-6 rounded-2xl shadow-lg border ${semFotosELaudos ? 'blur-sm' : ''} ${
            isDarkMode 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Laudos Médicos
            </h2>
            
            {laudos.length > 0 ? (
              <div className="space-y-4">
                {laudos.map((laudo) => (
                  <div 
                    key={laudo.id}
                    className={`p-4 rounded-xl border ${
                      laudo.aprovado_em
                        ? isDarkMode 
                          ? 'bg-green-900/20 border-green-500/30' 
                          : 'bg-green-50 border-green-200'
                        : isDarkMode 
                          ? 'bg-yellow-900/20 border-yellow-500/30' 
                          : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileCheck className={`h-8 w-8 mr-4 ${
                          laudo.aprovado_em
                            ? isDarkMode ? 'text-green-400' : 'text-green-600'
                            : isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                        }`} />
                        <div>
                          <h3 className={`font-semibold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {laudo.tipo_documento || 'Laudo Médico'}
                          </h3>
                          <p className={`text-sm ${
                            laudo.aprovado_em
                              ? isDarkMode ? 'text-green-200' : 'text-green-700'
                              : isDarkMode ? 'text-yellow-200' : 'text-yellow-700'
                          }`}>
                            {laudo.aprovado_em 
                              ? 'Aprovado pela equipe médica' 
                              : `Status: ${laudo.status || 'Em análise'}`}
                          </p>
                          {laudo.observacoes && (
                            <p className={`text-xs mt-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {laudo.observacoes}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadLaudo(laudo.documento_url)}
                        className={`p-3 rounded-xl transition-all duration-200 ${
                          isDarkMode 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-6 rounded-xl border-2 border-dashed text-center ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-800/50' 
                  : 'border-gray-300 bg-gray-50'
              }`}>
                <FileText className={`h-12 w-12 mx-auto mb-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <h3 className={`font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Nenhum laudo enviado
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Laudos médicos enviados aparecerão aqui
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Overlay quando não há fotos nem laudos */}
        {semFotosELaudos && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-40 p-4">
            <div className={`max-w-md w-full p-8 rounded-2xl shadow-2xl text-center border ${
              isDarkMode 
                ? 'bg-gray-900 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
              }`}>
                <CheckCircle className={`h-8 w-8 ${
                  isDarkMode ? 'text-green-400' : 'text-green-600'
                }`} />
              </div>
              <h3 className={`text-xl font-bold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Fique tranquilo(a)!
              </h3>
              <p className={`text-sm leading-relaxed ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Caso seja necessário fotos ou documentos, nossa equipe irá te comunicar via WhatsApp.
              </p>
              <div className={`mt-6 p-4 rounded-xl ${
                isDarkMode 
                  ? 'bg-blue-900/20 border border-blue-500/30' 
                  : 'bg-blue-50 border border-blue-200'
              }`}>
                <p className={`text-xs ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  📱 Fique atento às mensagens no WhatsApp
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-6 w-full py-3 px-6 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white transition-all duration-200"
              >
                Ir para Início
              </button>
            </div>
          </div>
        )}

        {/* Modal para visualizar foto */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 cursor-pointer overflow-auto"
            onClick={() => setSelectedPhoto(null)}
          >
            {/* Botão de fechar - fixo no canto superior direito */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhoto(null);
              }}
              className="fixed top-6 right-6 z-20 p-3 bg-black/70 hover:bg-black/90 rounded-full text-white transition-all duration-200 backdrop-blur-sm"
              title="Fechar (ESC)"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Container principal centralizado */}
            <div className="min-h-screen flex items-center justify-center p-6">
              <div className="relative">
                <img
                  src={selectedPhoto}
                  alt="Foto ampliada"
                  className="max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] object-contain rounded-lg shadow-2xl cursor-default"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            
            {/* Dica para fechar - fixo na parte inferior */}
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 text-white/70 text-sm bg-black/70 px-4 py-2 rounded-full backdrop-blur-sm pointer-events-none">
              Clique fora da imagem ou pressione ESC para fechar
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}