import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function PreparadorRoute({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPreparador, setIsPreparador] = useState(false);

  useEffect(() => {
    checkPreparadorAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkPreparadorAccess();
      } else {
        setIsAuthenticated(false);
        setIsPreparador(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkPreparadorAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthenticated(false);
        setIsPreparador(false);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Verificar se o usuário tem role de preparador
      const { data: perfil, error } = await supabase
        .from('perfis')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Erro ao verificar role do usuário:', error);
        setIsPreparador(false);
      } else {
        setIsPreparador(perfil?.role === 'preparador');
      }
    } catch (error) {
      console.error('Erro ao verificar acesso preparador:', error);
      setIsAuthenticated(false);
      setIsPreparador(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!isPreparador) {
    // Redirecionar usuários não-preparador para seu dashboard apropriado
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}