import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log("PrivateRoute montado - verificando autenticação");
    
    // Garantir que o fundo seja claro com gradiente
    document.documentElement.style.background = 'linear-gradient(135deg, #f5f7ff 0%, #e0e6ff 100%)';
    document.documentElement.style.backgroundColor = '#f5f7ff';
    document.body.style.background = 'linear-gradient(135deg, #f5f7ff 0%, #e0e6ff 100%)';
    document.body.style.backgroundColor = '#f5f7ff';
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Mudança de estado de autenticação:", !!session);
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      console.log("Verificando sessão do usuário...");
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Sessão verificada:", !!session);
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      setIsAuthenticated(false);
    } finally {
      console.log("Finalizando verificação de autenticação");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    console.log("PrivateRoute em carregamento");
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f5f7ff 0%, #e0e6ff 100%)'}}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("Usuário não autenticado, redirecionando para login");
    return <Navigate to="/login" />;
  }

  console.log("Usuário autenticado, renderizando conteúdo protegido");
  return <>{children}</>;
} 