import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/global.css';

// Helper para logs condicionais de debug (preserva stack trace)
const debugLog = process.env.NODE_ENV === 'development' 
  ? console.log.bind(console) 
  : () => {};

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const { signIn, signOut, userProfile, getDefaultRouteForRole } = useAuth();
  const isDarkMode = theme === 'dark';
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(false);
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Verificar se há mensagem de redirecionamento
  useEffect(() => {
    const state = location.state as { message?: string; email?: string } | null;
    if (state?.message) {
      setErro(state.message);
      if (state.email) {
        setEmail(state.email);
      }
      // Limpar o state do location
      navigate('/login', { replace: true });
    }
  }, [location.state, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    
    try {
      debugLog('Login: Fazendo login e verificando permissões...');
      
      // Fazer autenticação diretamente - mais simples e confiável
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (authError) {
        console.error('Login: Credenciais inválidas:', authError);
        setErro('Erro ao fazer login. Verifique suas credenciais.');
        return;
      }

      if (authData.user) {
        debugLog('Login: Autenticação bem-sucedida, verificando role...');
        
        // Buscar o role do usuário autenticado
        const { data: profileData, error: profileError } = await supabase
          .from('perfis')
          .select('role')
          .eq('user_id', authData.user.id)
          .single();

        if (!profileError && profileData) {
          const userRole = profileData.role;
          debugLog(`Login: Role detectado: ${userRole}`);
          
          // BLOQUEAR admin e preparador - fazer logout imediato
          if (userRole === 'admin' || userRole === 'preparador') {
            debugLog('Login: Staff user detectado, fazendo logout e bloqueando acesso');
            
            // Fazer logout IMEDIATO antes de mostrar qualquer interface
            await supabase.auth.signOut();
            
            setErro('Admins e preparadores devem usar o Login Staff. Acesse através do link abaixo.');
            
            setTimeout(() => {
              navigate('/staff', { 
                state: { 
                  message: 'Use este login para acessar como admin ou preparador.',
                  email: email 
                } 
              });
            }, 3000);
            return;
          }

          // PERMITIR usuários normais (cliente/usuario)
          if (userRole === 'cliente' || userRole === 'usuario') {
            debugLog('Login: Usuário normal detectado, aguardando AuthContext...');
            
            // Aguardar um pouco para o AuthContext processar a mudança de autenticação
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Verificar role através do userProfile do contexto para redirecionamento
            if (userProfile) {
              const defaultRoute = getDefaultRouteForRole();
              debugLog(`Login: Login bem-sucedido. Role: ${userRole}, redirecionando para ${defaultRoute}`);
              navigate(defaultRoute);
            } else {
              // Se AuthContext não carregou ainda, usar rota padrão baseada no role
              const defaultRoute = '/dashboard';
              debugLog(`Login: AuthContext não carregado, redirecionando para ${defaultRoute}`);
              navigate(defaultRoute);
            }
            return;
          }

          // Role não reconhecido
          debugLog(`Login: Role não reconhecido: ${userRole}`);
          await supabase.auth.signOut();
          setErro('Tipo de usuário não reconhecido. Entre em contato com o suporte.');
        } else {
          // Se não conseguir buscar o perfil, assumir que é usuário novo
          debugLog('Login: Perfil não encontrado, assumindo usuário comum');
          
          // Aguardar AuthContext processar
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          if (userProfile) {
            const defaultRoute = getDefaultRouteForRole();
            navigate(defaultRoute);
          } else {
            navigate('/dashboard');
          }
        }
      }
    } catch (error) {
      console.error('Login: Erro inesperado:', error);
      setErro('Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecuperarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErro('Por favor, informe seu email para recuperar a senha.');
      return;
    }

    setRecuperandoSenha(true);
    setErro('');
    setSucesso('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (error) throw error;
      setSucesso(
        'Email de recuperação enviado! Verifique sua caixa de entrada e spam.'
      );
    } catch (error) {
      setErro('Erro ao enviar email de recuperação. Verifique se o email está correto.');
    } finally {
      setRecuperandoSenha(false);
    }
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
              EXTERMINA
              <br />
              <span className="text-yellow-300">FRANGO</span>
            </h1>
            
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Transforme seu corpo e domine sua mente. Sua jornada fitness começa aqui.
            </p>
            
            <div className="space-y-4 text-white/80">
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                <span>Treinos personalizados</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                <span>Acompanhamento nutricional</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                <span>Resultados comprovados</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Geometric shapes */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-32 left-16 w-24 h-24 bg-yellow-300/20 rounded-full blur-xl"></div>
      </div>
      
      {/* Right Side - Login Form */}
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
              Bem-vindo de volta
            </h2>
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Entre na sua conta para continuar
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
          
          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className={`block text-sm font-semibold mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email
              </label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 transition-all duration-200 text-lg ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:bg-gray-800' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:bg-orange-50'
                  } focus:outline-none`}
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="senha" className={`block text-sm font-semibold mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Senha
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  id="senha"
                  name="senha"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={`w-full pl-12 pr-12 py-4 rounded-xl border-2 transition-all duration-200 text-lg ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:bg-gray-800' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:bg-orange-50'
                  } focus:outline-none`}
                  placeholder="Digite sua senha"
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

            {/* Forgot Password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleRecuperarSenha}
                disabled={recuperandoSenha}
                className="text-sm text-orange-600 hover:text-orange-700 font-semibold transition-colors"
              >
                {recuperandoSenha ? 'Enviando...' : 'Esqueceu sua senha?'}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 transform ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 shadow-lg hover:shadow-xl hover:-translate-y-1'
              } text-white`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
          
          {/* Divider */}
          <div className="my-8 relative">
            <div className={`absolute inset-0 flex items-center`}>
              <div className={`w-full border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-300'
              }`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-4 ${
                isDarkMode ? 'bg-black text-gray-400' : 'bg-gray-50 text-gray-500'
              }`}>
                Não tem uma conta?
              </span>
            </div>
          </div>
          
          {/* Sign Up Link */}
          <Link
            to="/cadastro"
            className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-lg border-2 transition-all duration-200 transform hover:-translate-y-1 ${
              isDarkMode 
                ? 'border-gray-700 text-gray-300 hover:bg-gray-900 hover:border-gray-600' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
            }`}
          >
            Criar conta gratuita
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}