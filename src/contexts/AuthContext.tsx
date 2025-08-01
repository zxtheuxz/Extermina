import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
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

// Cache de perfil em sessionStorage (mais adequado para dados de sessão)
const PROFILE_CACHE_KEY = 'user_profile_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos


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

  const saveProfileToCache = (profile: UserProfile) => {
    try {
      const cacheData = {
        profile,
        timestamp: Date.now()
      };
      sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('AuthContext: Erro ao salvar perfil no cache:', error);
    }
  };

  const getProfileFromCache = (userId: string): UserProfile | null => {
    try {
      const cached = sessionStorage.getItem(PROFILE_CACHE_KEY);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      // Verificar se cache expirou ou é de outro usuário
      if (age > CACHE_DURATION || cacheData.profile.user_id !== userId) {
        sessionStorage.removeItem(PROFILE_CACHE_KEY);
        return null;
      }

      return cacheData.profile;
    } catch (error) {
      console.warn('AuthContext: Erro ao recuperar perfil do cache:', error);
      sessionStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }
  };

  const clearProfileCache = () => {
    try {
      sessionStorage.removeItem(PROFILE_CACHE_KEY);
    } catch (error) {
      console.warn('AuthContext: Erro ao limpar cache:', error);
    }
  };

  // Função simples para buscar perfil com timeout
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    // Criar timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout na busca de perfil'));
      }, 5000);
    });
    
    // Criar busca promise
    const fetchPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('perfis')
          .select('user_id, role, nome_completo')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.warn('Erro ao buscar perfil:', error);
          // Retorna perfil padrão se não encontrar
          return {
            user_id: userId,
            role: 'usuario'
          };
        }

        return data;
      } catch (error) {
        console.error('Erro inesperado ao buscar perfil:', error);
        throw error;
      }
    })();
    
    // Race entre busca e timeout
    try {
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      console.error('AuthContext: Falha na busca de perfil:', error);
      return {
        user_id: userId,
        role: 'usuario'
      };
    }
  };

  // Função otimizada para atualizar estado
  const updateUserState = async (newSession: Session | null) => {
    try {
      if (newSession?.user) {
        setUser(newSession.user);
        setSession(newSession);
        
        // Buscar perfil com cache
        const cachedProfile = getProfileFromCache(newSession.user.id);
        if (cachedProfile) {
          setUserProfile(cachedProfile);
          setLoading(false);
          // Atualizar cache em background sem bloquear
          fetchUserProfile(newSession.user.id).then(profile => {
            if (profile) {
              setUserProfile(profile);
              saveProfileToCache(profile);
            }
          }).catch(() => {});
        } else {
          setProfileLoading(true);
          const profile = await fetchUserProfile(newSession.user.id);
          if (profile) {
            setUserProfile(profile);
            saveProfileToCache(profile);
          }
          setProfileLoading(false);
        }
      } else {
        setUser(null);
        setSession(null);
        setUserProfile(null);
        clearProfileCache();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('AuthContext: Erro ao atualizar estado:', error);
      setLoading(false);
      setProfileLoading(false);
    }
  };

  // Configurar listener de autenticação simplificado
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (isMounted) {
          await updateUserState(currentSession);
        }
      } catch (error) {
        console.error('Erro ao inicializar auth:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Configurar listener de mudanças de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (isMounted) {
          await updateUserState(newSession);
        }
      }
    );

    // Inicializar
    initializeAuth();

    // Cleanup
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Sem dependências para evitar loops

  // Função de login
  const signIn = async (email: string, password: string) => {
    try {
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

      // O listener onAuthStateChange irá atualizar o estado automaticamente
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
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthContext: Erro no logout:', error);
      }

      // Limpar estado local imediatamente
      setUser(null);
      setSession(null);
      setUserProfile(null);
      clearProfileCache();
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
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('AuthContext: Erro no refresh da sessão:', error);
        await signOut();
        return;
      }

      if (data.session) {
        await updateUserState(data.session);
      }
    } catch (error) {
      console.error('AuthContext: Erro inesperado no refresh:', error);
      await signOut();
    }
  };

  // Função para verificar se usuário tem determinado role
  const hasRole = (roles: string[]): boolean => {
    if (!userProfile) return false;
    return roles.includes(userProfile.role);
  };

  // Função para obter a rota padrão baseada no role
  const getDefaultRouteForRole = (): string => {
    if (!userProfile) return '/dashboard';
    
    switch (userProfile.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'preparador':
        return '/preparador/dashboard';
      case 'nutricionista':
        return '/nutricionista/dashboard';
      case 'cliente':
      case 'usuario':
      default:
        return '/dashboard';
    }
  };


  // Memoizar value para evitar re-renders desnecessários
  const value: AuthContextType = useMemo(() => ({
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
  }), [user, session, userProfile, loading, profileLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}