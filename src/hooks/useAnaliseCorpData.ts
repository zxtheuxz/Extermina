import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// Cache global para evitar múltiplas execuções simultâneas
const dataCache = new Map<string, {
  data: any;
  timestamp: number;
  promise?: Promise<any>;
}>();

const CACHE_DURATION = 30 * 1000; // 30 segundos

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
  foto_lateral_direita_url: string | null;
  foto_abertura_url: string | null;
}

interface AnaliseCorpData {
  dadosCorporais: DadosCorporais | null;
  fotos: FotosAnalise | null;
  loading: boolean;
  error: string | null;
  hasMedidasExistentes: boolean;
}

export const useAnaliseCorpData = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AnaliseCorpData>({
    dadosCorporais: null,
    fotos: null,
    loading: true,
    error: null,
    hasMedidasExistentes: false
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

  const buscarFotos = async (userId: string) => {
    try {
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfis')
        .select('foto_lateral_direita_url, foto_abertura_url')
        .eq('user_id', userId)
        .single();

      if (perfilError) {
        throw new Error(`Erro ao buscar fotos do perfil: ${perfilError.message}`);
      }

      return {
        foto_lateral_direita_url: perfilData?.foto_lateral_direita_url || null,
        foto_abertura_url: perfilData?.foto_abertura_url || null
      };
    } catch (error) {
      console.error('Erro ao buscar fotos:', error);
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

      // Buscar dados corporais, fotos e verificar medidas existentes em paralelo
      const [dadosCorporais, fotos, hasMedidasExistentes] = await Promise.all([
        buscarDadosCorporais(user.id, perfilData.sexo),
        buscarFotos(user.id),
        verificarMedidasExistentes(user.id)
      ]);

      setData({
        dadosCorporais,
        fotos,
        loading: false,
        error: null,
        hasMedidasExistentes
      });

    } catch (error) {
      console.error('Erro ao buscar dados para análise corporal:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  };

  const refetch = () => {
    buscarDadosCompletos();
  };

  useEffect(() => {
    if (!user?.id) {
      setData(prev => ({ ...prev, loading: false, error: 'Usuário não encontrado' }));
      return;
    }

    // Verificar cache primeiro
    const cacheKey = `analise_corp_${user.id}`;
    const cached = dataCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      debugLog(`📦 Usando dados do cache para userId: ${user.id}`);
      setData({
        ...cached.data,
        loading: false
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
    }).catch(() => {
      // Remover do cache em caso de erro
      dataCache.delete(cacheKey);
    });

  }, [user?.id]);

  return {
    ...data,
    refetch
  };
};