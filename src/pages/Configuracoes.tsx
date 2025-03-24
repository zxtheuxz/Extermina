import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Lock, Save } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClass } from '../styles/theme';
import '../styles/global.css';

export function Configuracoes() {
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

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
  
  // Estados para alteração de senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Carregar dados do usuário
  useEffect(() => {
    async function getUser() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, []);

  // Função para alterar senha
  const alterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (novaSenha !== confirmarSenha) {
      setMensagem({ 
        texto: 'As senhas não coincidem.', 
        tipo: 'erro' 
      });
      return;
    }
    
    setSalvando(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });
      
      if (error) throw error;
      
      setMensagem({ 
        texto: 'Senha alterada com sucesso!', 
        tipo: 'sucesso' 
      });
      
      // Limpar campos
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => setMensagem({ texto: '', tipo: '' }), 3000);
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setMensagem({ 
        texto: 'Erro ao alterar senha. Verifique sua senha atual e tente novamente.', 
        tipo: 'erro' 
      });
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${themeClasses.background}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className={`p-8 ${themeClasses.background} min-h-screen`}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className={`text-3xl font-bold ${themeClasses.text}`}>Configurações</h1>
            <p className={`${themeClasses.textSecondary}`}>Altere sua senha de acesso</p>
          </div>
          
          {mensagem.texto && (
            <div className={`mb-6 p-4 rounded-lg ${
              mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {mensagem.texto}
            </div>
          )}
          
          <div className={`${themeClasses.card} p-8 rounded-xl`}>
            <form onSubmit={alterarSenha} className="space-y-6">
              <div>
                <label htmlFor="senhaAtual" className={`block text-sm font-medium ${themeClasses.label}`}>
                  Senha Atual
                </label>
                <div className="mt-1 relative">
                  <input
                    id="senhaAtual"
                    name="senhaAtual"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    className={`${themeClasses.input} block w-full px-3 py-2 rounded-md`}
                    placeholder="Digite sua senha atual"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
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

              <div>
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

              <div>
                <button
                  type="submit"
                  disabled={salvando}
                  className={`${themeClasses.button} group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2`}
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <Save className="h-5 w-5 text-white" />
                  </span>
                  {salvando ? 'Salvando...' : 'Salvar Nova Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
} 