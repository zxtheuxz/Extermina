import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock } from 'lucide-react';
import Aurora from '../components/Aurora';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClass } from '../styles/theme';
import '../styles/global.css';

export function RedefinirSenha() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const themeClasses = {
    background: getThemeClass(isDarkMode, 'background'),
    text: getThemeClass(isDarkMode, 'text'),
    textSecondary: getThemeClass(isDarkMode, 'textSecondary'),
    card: `${getThemeClass(isDarkMode, 'cardBg')} border ${getThemeClass(isDarkMode, 'border')} ${getThemeClass(isDarkMode, 'shadow')}`,
    button: getThemeClass(isDarkMode, 'button'),
    buttonSecondary: getThemeClass(isDarkMode, 'buttonSecondary'),
    input: getThemeClass(isDarkMode, 'input'),
    label: getThemeClass(isDarkMode, 'label'),
    helperText: getThemeClass(isDarkMode, 'helperText'),
    errorText: isDarkMode ? 'text-red-400' : 'text-red-600'
  };

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValido, setTokenValido] = useState(false);

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

  const solicitarNovoLink = async () => {
    navigate('/login');
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${themeClasses.background}`}>
      <Aurora />
      
      <div className={`max-w-md w-full space-y-8 ${themeClasses.card} p-8 rounded-xl relative z-10`}>
        <div>
          <h2 className={`text-center text-3xl font-extrabold ${themeClasses.text}`}>
            Redefinir Senha
          </h2>
          <p className={`mt-2 text-center ${themeClasses.textSecondary}`}>
            Digite sua nova senha
          </p>
        </div>

        {tokenValido ? (
          <form className="mt-8 space-y-6" onSubmit={handleRedefinirSenha}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="mb-4">
                <label htmlFor="novaSenha" className={`block text-sm font-medium ${themeClasses.label}`}>
                  Nova Senha
                </label>
                <div className="mt-1 relative">
                  <input
                    id="novaSenha"
                    name="novaSenha"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className={`${themeClasses.input} block w-full px-3 py-2 rounded-md`}
                    placeholder="Digite sua nova senha"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="confirmarSenha" className={`block text-sm font-medium ${themeClasses.label}`}>
                  Confirmar Nova Senha
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmarSenha"
                    name="confirmarSenha"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className={`${themeClasses.input} block w-full px-3 py-2 rounded-md`}
                    placeholder="Confirme sua nova senha"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {erro && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${themeClasses.errorText}`}>
                      {erro}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {sucesso && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      {sucesso}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`${themeClasses.button} group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2`}
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-white" />
                </span>
                {loading ? 'Atualizando...' : 'Redefinir Senha'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            <div className={`text-center ${themeClasses.text}`}>
              {erro}
            </div>
            <button
              onClick={solicitarNovoLink}
              className={`${themeClasses.button} w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              Solicitar Novo Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 