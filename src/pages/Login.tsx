import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogIn, Lock, Mail } from 'lucide-react';
import Aurora from '../components/Aurora';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClass } from '../styles/theme';
import '../styles/global.css';

export function Login() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const themeClasses = {
    background: getThemeClass(isDarkMode, 'background'),
    text: getThemeClass(isDarkMode, 'text'),
    textSecondary: getThemeClass(isDarkMode, 'textSecondary'),
    card: `bg-black/30 backdrop-blur-sm border border-white/10`,
    button: getThemeClass(isDarkMode, 'button'),
    buttonSecondary: getThemeClass(isDarkMode, 'buttonSecondary'),
    input: `bg-white/10 border-white/20 text-white placeholder-white/50`,
    label: `text-white`,
    helperText: getThemeClass(isDarkMode, 'helperText'),
    errorText: 'text-red-400'
  };

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(false);
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) throw error;
      navigate('/dashboard');
    } catch (error) {
      setErro('Erro ao fazer login. Verifique suas credenciais.');
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
        'Email de recuperação enviado! Verifique sua caixa de entrada e spam. Clique no link recebido para redefinir sua senha.'
      );
    } catch (error) {
      setErro('Erro ao enviar email de recuperação. Verifique se o email está correto.');
    } finally {
      setRecuperandoSenha(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <Aurora />
      
      <div className={`w-full max-w-md space-y-8 ${themeClasses.card} p-8 rounded-xl relative z-10 mx-4`}>
        <div className="flex flex-col items-center">
          <img
            src="/images/frango.png"
            alt="Ícone Frango"
            className="w-12 h-12 mb-4"
          />
          <img
            src="/images/extermina-frango-logo.png"
            alt="Extermina Frango"
            className="w-64 mb-8"
          />
          <h2 className="text-center text-3xl font-extrabold text-white">
            Entrar na sua conta
          </h2>
          <p className="mt-2 text-center text-white/70">
            Ou{' '}
            <Link to="/cadastro" className="font-medium text-orange-500 hover:text-orange-400">
              crie uma nova conta
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md -space-y-px">
            <div className="mb-4">
              <label htmlFor="email" className={`block text-sm font-medium ${themeClasses.label}`}>
                E-mail
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${themeClasses.input} block w-full px-3 py-2 rounded-md`}
                  placeholder="Digite seu e-mail"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-white/50" />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="senha" className={`block text-sm font-medium ${themeClasses.label}`}>
                Senha
              </label>
              <div className="mt-1 relative">
                <input
                  id="senha"
                  name="senha"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={`${themeClasses.input} block w-full px-3 py-2 rounded-md`}
                  placeholder="Digite sua senha"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-white/50" />
                </div>
              </div>
            </div>
          </div>

          {erro && (
            <div className="rounded-md bg-red-900/50 border border-red-500/50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-400">
                    {erro}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {sucesso && (
            <div className="rounded-md bg-green-900/50 border border-green-500/50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-400">
                    {sucesso}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <button
                type="button"
                onClick={handleRecuperarSenha}
                disabled={recuperandoSenha}
                className="font-medium text-orange-500 hover:text-orange-400"
              >
                {recuperandoSenha ? 'Enviando...' : 'Esqueceu sua senha?'}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-orange-500 group-hover:text-orange-400" />
              </span>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}