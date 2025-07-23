import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  user_id: string;
  role: string;
  nome_completo?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
  getDefaultRouteForRole: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Cache localStorage para perfil do usuário
  const PROFILE_CACHE_KEY = 'user_profile_cache';
  const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

  const saveProfileToCache = (profile: UserProfile) => {
    try {
      const cacheData = {
        profile,
        timestamp: Date.now()
      };
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData));
      console.log('AuthContext: Perfil salvo no cache:', profile);
    } catch (error) {
      console.warn('AuthContext: Erro ao salvar perfil no cache:', error);
    }
  };

  const getProfileFromCache = (userId: string): UserProfile | null => {
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      // Verificar se cache expirou ou é de outro usuário
      if (age > CACHE_DURATION || cacheData.profile.user_id !== userId) {
        localStorage.removeItem(PROFILE_CACHE_KEY);
        return null;
      }

      console.log('AuthContext: Perfil recuperado do cache:', cacheData.profile);
      return cacheData.profile;
    } catch (error) {
      console.warn('AuthContext: Erro ao recuperar perfil do cache:', error);
      localStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }
  };

  const clearProfileCache = () => {
    try {
      localStorage.removeItem(PROFILE_CACHE_KEY);
      console.log('AuthContext: Cache do perfil limpo');
    } catch (error) {
      console.warn('AuthContext: Erro ao limpar cache:', error);
    }
  };

  // Função para buscar perfil do usuário com retry
  const fetchUserProfile = async (userId: string, attempt: number = 1): Promise<UserProfile | null> => {
    const maxAttempts = 3;
    const timestamp = new Date().toISOString();
    
    try {
      console.log(`[${timestamp}] AuthContext: Tentativa ${attempt}/${maxAttempts} - Buscando perfil para userId: ${userId}`);
      
      const { data, error } = await supabase
        .from('perfis')
        .select('user_id, role, nome_completo')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.warn(`[${timestamp}] Erro ao buscar perfil do usuário (tentativa ${attempt}):`, error);
        
        // Se é um erro de rede e ainda temos tentativas, retry
        if (attempt < maxAttempts && (error.code === 'PGRST301' || error.message?.includes('timeout'))) {
          const delay = Math.pow(2, attempt - 1) * 1000; // Backoff exponencial: 1s, 2s, 4s
          console.log(`[${timestamp}] Tentando novamente em ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchUserProfile(userId, attempt + 1);
        }
        
        // Retorna perfil padrão se não encontrar após todas as tentativas
        return {
          user_id: userId,
          role: 'usuario'
        };
      }

      console.log(`[${timestamp}] Perfil carregado com sucesso na tentativa ${attempt}:`, data);
      return data;
    } catch (error) {
      console.error(`[${timestamp}] Erro inesperado ao buscar perfil (tentativa ${attempt}):`, error);
      
      // Se ainda temos tentativas e é um erro de rede, retry
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`[${timestamp}] Erro inesperado, tentando novamente em ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchUserProfile(userId, attempt + 1);
      }
      
      return {
        user_id: userId,
        role: 'usuario'
      };
    }
  };

  // Função para atualizar estado do usuário com proteção anti-loop
  const updateUserState = async (newSession: Session | null) => {
    try {
      console.log('AuthContext: Atualizando estado do usuário...', !!newSession?.user);
      
      if (newSession?.user) {
        setUser(newSession.user);
        setSession(newSession);
        setProfileLoading(true);
        
        // Primeiro, tentar recuperar do cache
        const cachedProfile = getProfileFromCache(newSession.user.id);
        if (cachedProfile) {
          setUserProfile(cachedProfile);
          setProfileLoading(false);
          console.log('AuthContext: Usando perfil do cache durante carregamento:', cachedProfile);
        }

        // Buscar perfil do usuário com timeout otimizado
        const profilePromise = fetchUserProfile(newSession.user.id);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao buscar perfil após 8 segundos')), 8000)
        );
        
        try {
          const profile = await Promise.race([profilePromise, timeoutPromise]) as UserProfile | null;
          if (profile) {
            setUserProfile(profile);
            saveProfileToCache(profile);
            console.log('AuthContext: Perfil carregado do banco e salvo no cache:', profile);
          }
        } catch (error) {
          console.warn('AuthContext: Erro ou timeout ao buscar perfil:', error);
          
          // Se tiver cache, manter o cache; senão usar fallback
          if (!cachedProfile) {
            const fallbackProfile = {
              user_id: newSession.user.id,
              role: 'usuario'
            };
            setUserProfile(fallbackProfile);
            console.log('AuthContext: Usando perfil padrão (sem cache disponível):', fallbackProfile);
          } else {
            console.log('AuthContext: Mantendo perfil do cache devido ao timeout');
          }
        } finally {
          setProfileLoading(false);
        }
      } else {
        console.log('AuthContext: Limpando estado do usuário');
        setUser(null);
        setSession(null);
        setUserProfile(null);
        setProfileLoading(false);
        clearProfileCache();
      }
      
      // Garantir que loading seja falso após atualização
      setLoading(false);
    } catch (error) {
      console.error('AuthContext: Erro ao atualizar estado:', error);
      setLoading(false);
      setProfileLoading(false);
    }
  };

  // Configurar listener de autenticação (apenas um) - SEM DEPENDÊNCIAS para evitar loops
  useEffect(() => {
    let isMounted = true;
    let hasInitialized = false; // Flag local para evitar re-inicialização

    // Função para inicializar sessão
    const initializeAuth = async () => {
      if (hasInitialized) {
        console.log('AuthContext: Já inicializado, ignorando...');
        return;
      }

      try {
        console.log('AuthContext: Inicializando autenticação...');
        hasInitialized = true;
        
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthContext: Erro ao obter sessão:', error);
        }

        if (isMounted) {
          await updateUserState(currentSession);
          setLoading(false);
          setIsInitialized(true);
          console.log('AuthContext: Autenticação inicializada', !!currentSession);
        }
      } catch (error) {
        console.error('AuthContext: Erro na inicialização:', error);
        if (isMounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // Configurar listener de mudanças de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('AuthContext: Mudança de estado de auth:', event, !!newSession);
        
        // Só processar mudanças após inicialização completa
        if (isMounted && hasInitialized) {
          // Pequeno delay para evitar condições de corrida
          await new Promise(resolve => setTimeout(resolve, 100));
          await updateUserState(newSession);
        }
      }
    );

    // Inicializar apenas uma vez
    initializeAuth();

    // Cleanup
    return () => {
      isMounted = false;
      subscription.unsubscribe();
      console.log('AuthContext: Cleanup realizado');
    };
  }, []); // REMOVIDA a dependência isInitialized para evitar loop

  // Função de login
  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Iniciando login...');
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('AuthContext: Erro no login:', error);
        setLoading(false);
        return { user: null, error };
      }

      console.log('AuthContext: Login bem-sucedido, aguardando listener...');
      // O listener onAuthStateChange irá atualizar o estado automaticamente
      // Não definir loading=false aqui, deixar para o listener
      return { user: data.user, error: null };
    } catch (error) {
      console.error('AuthContext: Erro inesperado no login:', error);
      setLoading(false);
      return { user: null, error: error as AuthError };
    }
  };

  // Função de logout
  const signOut = async () => {
    try {
      setLoading(true);
      console.log('AuthContext: Fazendo logout...');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthContext: Erro no logout:', error);
      }

      // Limpar estado local imediatamente
      setUser(null);
      setSession(null);
      setUserProfile(null);
      clearProfileCache();

      console.log('AuthContext: Logout concluído');
    } catch (error) {
      console.error('AuthContext: Erro inesperado no logout:', error);
      // Mesmo com erro, limpar estado local
      setUser(null);
      setSession(null);
      setUserProfile(null);
      clearProfileCache();
    } finally {
      setLoading(false);
    }
  };

  // Função para refresh manual da sessão
  const refreshSession = async () => {
    try {
      console.log('AuthContext: Fazendo refresh da sessão...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('AuthContext: Erro no refresh da sessão:', error);
        // Se falhar no refresh, fazer logout
        await signOut();
        return;
      }

      if (data.session) {
        await updateUserState(data.session);
        console.log('AuthContext: Sessão atualizada com sucesso');
      }
    } catch (error) {
      console.error('AuthContext: Erro inesperado no refresh:', error);
      await signOut();
    }
  };

  // Função para verificar se usuário tem determinado role
  const hasRole = (roles: string[]): boolean => {
    if (!userProfile) {
      console.log('AuthContext.hasRole: userProfile não disponível');
      return false;
    }
    const hasAccess = roles.includes(userProfile.role);
    console.log(`AuthContext.hasRole: Verificando role '${userProfile.role}' contra [${roles.join(', ')}] = ${hasAccess}`);
    return hasAccess;
  };

  // Função para obter a rota padrão baseada no role
  const getDefaultRouteForRole = (): string => {
    if (!userProfile) return '/dashboard';
    
    switch (userProfile.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'preparador':
        return '/preparador/dashboard';
      case 'cliente':
      case 'usuario':
      default:
        return '/dashboard';
    }
  };

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    loading,
    profileLoading,
    signIn,
    signOut,
    refreshSession,
    isAuthenticated: !!user,
    hasRole,
    getDefaultRouteForRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}