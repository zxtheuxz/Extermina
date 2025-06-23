import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/global.css';

export function RedefinirSenha() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValido, setTokenValido] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Verificar se o usuário está autenticado com um token de recuperação
    const verificarSessao = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        setTokenValido(true);
      } else {
        // Tentar extrair o token da URL (para casos onde o redirecionamento não funcionou perfeitamente)
        const hashFragment = window.location.hash;
        if (hashFragment) {
          const hashParams = new URLSearchParams(hashFragment.substring(1));
          const accessToken = hashParams.get('access_token');
          
          if (accessToken) {
            try {
              // Tentar definir a sessão manualmente
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: '',
              });
              
              if (!error) {
                setTokenValido(true);
              } else {
                setErro('Link de recuperação inválido ou expirado. Solicite um novo link.');
              }
            } catch (error) {
              setErro('Erro ao processar o link de recuperação. Solicite um novo link.');
            }
          } else {
            setErro('Link de recuperação inválido. Solicite um novo link.');
          }
        } else {
          setErro('Nenhum token de recuperação encontrado. Solicite um novo link de recuperação.');
        }
      }
    };

    verificarSessao();
  }, []);

  const handleRedefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    if (novaSenha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setErro('');
    setSucesso('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (error) throw error;
      
      setSucesso('Senha atualizada com sucesso! Redirecionando para o login...');
      
      // Redirecionar para o login após alguns segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setErro('Erro ao redefinir a senha. Tente novamente ou solicite um novo link de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  const solicitarNovoLink = () => {
    navigate('/login');
  };

  return (
    <div className={`min-h-screen flex ${
      isDarkMode 
        ? 'bg-black' 
        : 'bg-white'
    }`}>
      
      {/* Left Side - Hero Section */}
      <div className={`hidden lg:flex lg:w-1/2 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 to-black' 
          : 'bg-gradient-to-br from-orange-500 via-orange-600 to-pink-600'
      } relative overflow-hidden`}>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center px-12 w-full">
          <div className="max-w-md">
            <img
              src="/images/frango.png"
              alt="Extermina Frango"
              className="w-24 h-24 mx-auto mb-8 drop-shadow-2xl"
            />
            
            <h1 className="text-5xl font-black text-white mb-6 leading-tight">
              NOVA
              <br />
              <span className="text-yellow-300">SENHA</span>
            </h1>
            
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Defina uma nova senha segura para continuar sua jornada fitness.
            </p>
            
            <div className="space-y-4 text-white/80">
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                <span>Senha segura e criptografada</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                <span>Acesso protegido aos seus dados</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                <span>Continue de onde parou</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Geometric shapes */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-32 left-16 w-24 h-24 bg-yellow-300/20 rounded-full blur-xl"></div>
      </div>
      
      {/* Right Side - Form */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center p-8 ${
        isDarkMode ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="w-full max-w-md">
          
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-12">
            <img
              src="/images/frango.png"
              alt="Extermina Frango"
              className="w-16 h-16 mx-auto mb-4"
            />
            <h1 className={`text-3xl font-black ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              EXTERMINA <span className="text-orange-500">FRANGO</span>
            </h1>
          </div>
          
          {/* Form Header */}
          <div className="mb-8">
            <h2 className={`text-3xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Redefinir Senha
            </h2>
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {tokenValido ? 'Digite sua nova senha' : 'Link de recuperação necessário'}
            </p>
          </div>
          
          {/* Messages */}
          {erro && (
            <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{erro}</span>
            </div>
          )}

          {sucesso && (
            <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{sucesso}</span>
            </div>
          )}
          
          {tokenValido ? (
            /* Form */
            <form onSubmit={handleRedefinirSenha} className="space-y-6">
              {/* Nova Senha Field */}
              <div>
                <label htmlFor="novaSenha" className={`block text-sm font-semibold mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    id="novaSenha"
                    name="novaSenha"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className={`w-full pl-12 pr-12 py-4 rounded-xl border-2 transition-all duration-200 text-lg ${
                      isDarkMode 
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:bg-gray-800' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:bg-orange-50'
                    } focus:outline-none`}
                    placeholder="Digite sua nova senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
                      isDarkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
                    } transition-colors`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Senha Field */}
              <div>
                <label htmlFor="confirmarSenha" className={`block text-sm font-semibold mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    id="confirmarSenha"
                    name="confirmarSenha"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className={`w-full pl-12 pr-12 py-4 rounded-xl border-2 transition-all duration-200 text-lg ${
                      isDarkMode 
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:bg-gray-800' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:bg-orange-50'
                    } focus:outline-none`}
                    placeholder="Confirme sua nova senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
                      isDarkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
                    } transition-colors`}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
                  loading
                    ? isDarkMode 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      : 'bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                } focus:outline-none focus:ring-4 focus:ring-orange-200`}
              >
                {loading ? 'Atualizando...' : 'Redefinir Senha'}
              </button>
            </form>
          ) : (
            /* Token inválido */
            <div className="space-y-6">
              <button
                onClick={solicitarNovoLink}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    : 'bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                } focus:outline-none focus:ring-4 focus:ring-orange-200`}
              >
                Voltar ao Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 