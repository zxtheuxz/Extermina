import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { dataCache } from '../utils/cacheUtils';

// Cache no sessionStorage para persistir entre navegações
const getSessionCache = (key: string) => {
  try {
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    const now = Date.now();
    
    // Verificar se ainda é válido (5 minutos)
    if (now - parsed.timestamp < CACHE_DURATION) {
      return parsed.data;
    }
    
    // Limpar cache expirado
    sessionStorage.removeItem(key);
    return null;
  } catch (error) {
    console.error('Erro ao ler cache da sessão:', error);
    return null;
  }
};

const setSessionCache = (key: string, data: any) => {
  try {
    sessionStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Erro ao salvar cache na sessão:', error);
  }
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Helper para logs condicionais de debug (preserva stack trace)
const debugLog = process.env.NODE_ENV === 'development' 
  ? console.log.bind(console) 
  : () => {};

interface DadosCorporais {
  altura: number;
  peso: number;
  idade: number;
  sexo: 'M' | 'F';
}

interface FotosAnalise {
  foto_lateral_url: string | null;
  foto_abertura_url: string | null;
}

interface AnaliseCorpData {
  dadosCorporais: DadosCorporais | null;
  fotos: FotosAnalise | null;
  loading: boolean;
  error: string | null;
  hasMedidasExistentes: boolean;
  liberado: boolean;
}

export const useAnaliseCorpData = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AnaliseCorpData>({
    dadosCorporais: null,
    fotos: null,
    loading: true,
    error: null,
    hasMedidasExistentes: false,
    liberado: false
  });

  const calcularIdade = (dataNascimento: string): number => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  };

  const buscarDadosCorporais = async (userId: string, sexo: string) => {
    try {
      // Mapear sexo para o formato correto e escolher tabela
      const sexoNormalizado = sexo.toLowerCase();
      const isMasculino = sexoNormalizado === 'masculino' || sexoNormalizado === 'm' || sexoNormalizado === 'male';
      const tabelaAvaliacao = isMasculino ? 'avaliacao_nutricional' : 'avaliacao_nutricional_feminino';
      
      debugLog(`🔍 Debug: sexo original="${sexo}", normalizado="${sexoNormalizado}", isMasculino=${isMasculino}, tabela="${tabelaAvaliacao}"`);
      
      const { data: avaliacaoData, error: avaliacaoError } = await supabase
        .from(tabelaAvaliacao)
        .select('altura, peso, idade, data_nascimento')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (avaliacaoError) {
        throw new Error(`Erro ao buscar dados da avaliação nutricional: ${avaliacaoError.message}`);
      }

      if (!avaliacaoData || avaliacaoData.length === 0) {
        throw new Error('Dados de avaliação nutricional não encontrados');
      }

      const primeiroItem = avaliacaoData[0];
      
      // Usar idade direta se disponível, senão calcular da data de nascimento
      let idade: number;
      if (primeiroItem.idade && Number(primeiroItem.idade) > 0) {
        idade = Number(primeiroItem.idade);
      } else if (primeiroItem.data_nascimento) {
        idade = calcularIdade(primeiroItem.data_nascimento);
      } else {
        throw new Error('Idade não disponível nos dados de avaliação');
      }

      // Converter sexo para formato padrão
      const sexoPadrao = isMasculino ? 'M' : 'F';
      
      debugLog(`✅ Dados encontrados: altura=${primeiroItem.altura}, peso=${primeiroItem.peso}, idade=${idade}, sexo=${sexoPadrao}`);
      
      return {
        altura: Number(primeiroItem.altura),
        peso: Number(primeiroItem.peso),
        idade,
        sexo: sexoPadrao
      };
    } catch (error) {
      console.error('Erro ao buscar dados corporais:', error);
      throw error;
    }
  };

  const buscarFotosELiberacao = async (userId: string) => {
    try {
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfis')
        .select('foto_lateral_url, foto_abertura_url, liberado')
        .eq('user_id', userId)
        .single();

      if (perfilError) {
        throw new Error(`Erro ao buscar dados do perfil: ${perfilError.message}`);
      }

      const fotosResult = {
        fotos: {
          foto_lateral_url: perfilData?.foto_lateral_url || null,
          foto_abertura_url: perfilData?.foto_abertura_url || null
        },
        liberado: perfilData?.liberado?.toLowerCase() === 'sim'
      };
      
      debugLog(`📸 Debug fotos para userId: ${userId}`, {
        foto_lateral_url: fotosResult.fotos.foto_lateral_url,
        foto_abertura_url: fotosResult.fotos.foto_abertura_url,
        liberado: fotosResult.liberado,
        perfilData
      });
      
      return fotosResult;
    } catch (error) {
      console.error('Erro ao buscar fotos e liberação:', error);
      throw error;
    }
  };

  const verificarMedidasExistentes = async (userId: string) => {
    try {
      const { data: medidasData, error: medidasError } = await supabase
        .from('medidas_corporais')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (medidasError) {
        console.error('Erro ao verificar medidas existentes:', medidasError);
        return false;
      }

      return medidasData && medidasData.length > 0;
    } catch (error) {
      console.error('Erro ao verificar medidas existentes:', error);
      return false;
    }
  };

  const buscarDadosCompletos = async () => {
    if (!user?.id) {
      setData(prev => ({ ...prev, loading: false, error: 'Usuário não autenticado' }));
      return;
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Primeiro buscar o sexo do perfil
      debugLog(`🔍 Buscando perfil para user_id: ${user.id}`);
      
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfis')
        .select('sexo')
        .eq('user_id', user.id)
        .single();

      if (perfilError || !perfilData?.sexo) {
        console.error('❌ Erro ao buscar perfil:', perfilError);
        throw new Error('Perfil não encontrado ou sexo não definido');
      }
      
      debugLog(`✅ Perfil encontrado - sexo: "${perfilData.sexo}"`);

      // Buscar dados INDEPENDENTEMENTE - não usar Promise.all que falha se uma falhar
      let dadosCorporais = null;
      let fotos = null;
      let liberado = false;
      let hasMedidasExistentes = false;
      let errorMsg = null;

      // 1. Buscar dados corporais (pode falhar se não preenchido - OK)
      try {
        dadosCorporais = await buscarDadosCorporais(user.id, perfilData.sexo);
        debugLog(`✅ Dados corporais encontrados`);
      } catch (error) {
        debugLog(`ℹ️ Dados corporais não encontrados (esperado se não preenchido):`, error.message);
        // Não definir como erro global - é esperado quando não preenchido
      }

      // 2. Buscar fotos e liberação (deve sempre funcionar)
      try {
        const fotosResult = await buscarFotosELiberacao(user.id);
        fotos = fotosResult.fotos;
        liberado = fotosResult.liberado;
        debugLog(`✅ Fotos e liberação buscadas`);
      } catch (error) {
        console.error(`❌ Erro ao buscar fotos/liberação:`, error);
        errorMsg = `Erro ao buscar dados do perfil: ${error.message}`;
      }

      // 3. Verificar medidas existentes (deve sempre funcionar)
      try {
        hasMedidasExistentes = await verificarMedidasExistentes(user.id);
        debugLog(`✅ Verificação de medidas concluída: ${hasMedidasExistentes}`);
      } catch (error) {
        console.error(`❌ Erro ao verificar medidas existentes:`, error);
        // Não crítico, deixar como false
      }

      const newData = {
        dadosCorporais,
        fotos,
        loading: false,
        error: errorMsg, // Só mostrar erro se for técnico
        hasMedidasExistentes,
        liberado
      };
      
      debugLog(`📊 Dados finais:`, {
        temDadosCorporais: !!dadosCorporais,
        temFotos: !!(fotos?.foto_lateral_url && fotos?.foto_abertura_url),
        liberado,
        hasMedidasExistentes,
        error: errorMsg
      });
      
      setData(newData);
      
      // Salvar no cache
      const cacheKey = `analise_corp_${user.id}`;
      dataCache.set(cacheKey, {
        data: newData,
        timestamp: Date.now()
      });
      setSessionCache(cacheKey, newData);

    } catch (error) {
      console.error('Erro técnico ao buscar dados para análise corporal:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro técnico desconhecido'
      }));
    }
  };

  const refetch = () => {
    // Limpar cache antes de buscar dados novos
    const cacheKey = `analise_corp_${user?.id}`;
    dataCache.delete(cacheKey);
    sessionStorage.removeItem(cacheKey);
    
    buscarDadosCompletos();
  };

  // Função para limpar cache específico (útil quando dados são atualizados em outras páginas)
  const clearCache = () => {
    if (user?.id) {
      const cacheKey = `analise_corp_${user.id}`;
      dataCache.delete(cacheKey);
      sessionStorage.removeItem(cacheKey);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setData(prev => ({ ...prev, loading: false, error: 'Usuário não encontrado' }));
      return;
    }

    // Verificar cache primeiro
    const cacheKey = `analise_corp_${user.id}`;
    const cached = dataCache.get(cacheKey);
    const sessionCached = getSessionCache(cacheKey);
    const now = Date.now();

    // Tentar cache em memória primeiro
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      debugLog(`📦 Usando dados do cache em memória para userId: ${user.id}`);
      setData({
        ...cached.data,
        loading: false
      });
      return;
    }
    
    // Tentar cache da sessão
    if (sessionCached) {
      debugLog(`💾 Usando dados do cache de sessão para userId: ${user.id}`);
      setData({
        ...sessionCached,
        loading: false
      });
      // Atualizar cache em memória
      dataCache.set(cacheKey, {
        data: sessionCached,
        timestamp: now
      });
      return;
    }

    // Se há uma promessa em execução, aguardar ela
    if (cached?.promise) {
      debugLog(`⏳ Aguardando carregamento em progresso para userId: ${user.id}`);
      cached.promise.then((result) => {
        setData({
          ...result,
          loading: false
        });
      }).catch((error) => {
        setData(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message || 'Erro ao carregar dados' 
        }));
      });
      return;
    }

    // Criar nova promessa e adicionar ao cache
    const loadPromise = (async () => {
      await buscarDadosCompletos();
      return data;
    })();
    
    dataCache.set(cacheKey, {
      data: null,
      timestamp: now,
      promise: loadPromise
    });

    loadPromise.then((result) => {
      // Atualizar cache com resultado
      dataCache.set(cacheKey, {
        data: result,
        timestamp: now
      });
      // Salvar no sessionStorage também
      setSessionCache(cacheKey, result);
    }).catch(() => {
      // Remover do cache em caso de erro
      dataCache.delete(cacheKey);
      sessionStorage.removeItem(cacheKey);
    });

  }, [user?.id]);

  return {
    ...data,
    refetch,
    clearCache
  };
};