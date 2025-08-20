import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { normalizarAltura } from '../../utils/normalizarAltura';
import { 
  User, 
  Brain, 
  Camera, 
  Ruler, 
  Scale, 
  AlertCircle,
  Loader2,
  CheckCircle,
  Calendar,
  Activity
} from 'lucide-react';
import AnaliseCorpoMediaPipe from '../analise-corporal/AnaliseCorpoMediaPipe';

interface ClienteApto {
  user_id: string;
  nome_completo: string;
  sexo: string;
  foto_lateral_url: string;
  foto_abertura_url: string;
  altura: number;
  peso: number;
  data_avaliacao: string;
  tipo_avaliacao: 'masculino' | 'feminino';
}

interface MedidasExtraidas {
  bracos: number;
  antebracos: number;
  cintura: number;
  quadril: number;
  coxas: number;
  panturrilhas: number;
}

export function ClientesAptosCorporal() {
  const [clientesAptos, setClientesAptos] = useState<ClienteApto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteApto | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    buscarClientesAptos();
  }, []);

  const buscarClientesAptos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar perfis com fotos
      const { data: perfisComFotos, error: errorPerfis } = await supabase
        .from('perfis')
        .select('user_id, nome_completo, sexo, foto_lateral_url, foto_abertura_url')
        .not('foto_lateral_url', 'is', null)
        .not('foto_abertura_url', 'is', null);

      if (errorPerfis) throw errorPerfis;

      const userIdsComFotos = perfisComFotos?.map(p => p.user_id) || [];

      // Buscar clientes com formulário masculino
      const { data: clientesMasc, error: errorMasc } = await supabase
        .from('avaliacao_nutricional')
        .select('user_id, altura, peso, created_at')
        .in('user_id', userIdsComFotos)
        .order('created_at', { ascending: false });

      // Buscar clientes com formulário feminino
      const { data: clientesFem, error: errorFem } = await supabase
        .from('avaliacao_nutricional_feminino')
        .select('user_id, altura, peso, created_at')
        .in('user_id', userIdsComFotos)
        .order('created_at', { ascending: false });

      if (errorMasc) throw errorMasc;
      if (errorFem) throw errorFem;

      // Criar map de perfis para acesso rápido
      const perfisMap = new Map(perfisComFotos?.map(p => [p.user_id, p]) || []);

      // Combinar e formatar os dados
      const todosClientes: ClienteApto[] = [];

      if (clientesMasc) {
        clientesMasc.forEach(cliente => {
          const perfil = perfisMap.get(cliente.user_id);
          if (perfil) {
            // Usa a função para normalizar altura para metros
            const alturaEmMetros = normalizarAltura(cliente.altura);
            
            todosClientes.push({
              user_id: cliente.user_id,
              nome_completo: perfil.nome_completo,
              sexo: perfil.sexo,
              foto_lateral_url: perfil.foto_lateral_url,
              foto_abertura_url: perfil.foto_abertura_url,
              altura: alturaEmMetros,
              peso: cliente.peso,
              data_avaliacao: cliente.created_at,
              tipo_avaliacao: 'masculino'
            });
          }
        });
      }

      if (clientesFem) {
        clientesFem.forEach(cliente => {
          const perfil = perfisMap.get(cliente.user_id);
          if (perfil) {
            // Usa a função para normalizar altura para metros
            const alturaEmMetros = normalizarAltura(cliente.altura);
            
            todosClientes.push({
              user_id: cliente.user_id,
              nome_completo: perfil.nome_completo,
              sexo: perfil.sexo,
              foto_lateral_url: perfil.foto_lateral_url,
              foto_abertura_url: perfil.foto_abertura_url,
              altura: alturaEmMetros,
              peso: cliente.peso,
              data_avaliacao: cliente.created_at,
              tipo_avaliacao: 'feminino'
            });
          }
        });
      }

      // Remover duplicatas (caso tenha preenchido ambos os formulários)
      const clientesUnicos = todosClientes.reduce((acc, atual) => {
        const existe = acc.find(c => c.user_id === atual.user_id);
        if (!existe || new Date(atual.data_avaliacao) > new Date(existe.data_avaliacao)) {
          return [...acc.filter(c => c.user_id !== atual.user_id), atual];
        }
        return acc;
      }, [] as ClienteApto[]);

      // Verificar quais já têm análise corporal gerada
      const userIds = clientesUnicos.map(c => c.user_id);
      const { data: analisesExistentes } = await supabase
        .from('medidas_corporais')
        .select('user_id')
        .in('user_id', userIds);

      const idsComAnalise = new Set(analisesExistentes?.map(a => a.user_id) || []);
      const clientesSemAnalise = clientesUnicos.filter(c => !idsComAnalise.has(c.user_id));

      setClientesAptos(clientesSemAnalise);
    } catch (error) {
      console.error('Erro ao buscar clientes aptos:', error);
      setError('Erro ao carregar clientes aptos para análise corporal');
    } finally {
      setLoading(false);
    }
  };

  const handleGerarAnalise = (cliente: ClienteApto) => {
    setClienteSelecionado(cliente);
    setShowModal(true);
  };

  const handleMedidasExtraidas = async (medidas: MedidasExtraidas) => {
    if (!clienteSelecionado) return;

    try {
      setProcessando(clienteSelecionado.user_id);

      // Calcular idade
      const { data: perfil } = await supabase
        .from('perfis')
        .select('data_nascimento')
        .eq('user_id', clienteSelecionado.user_id)
        .single();

      let idade = 30; // Default
      if (perfil?.data_nascimento) {
        const nascimento = new Date(perfil.data_nascimento);
        const hoje = new Date();
        idade = hoje.getFullYear() - nascimento.getFullYear();
      }

      // Calcular IMC
      const imc = clienteSelecionado.peso / (clienteSelecionado.altura * clienteSelecionado.altura);

      // Calcular percentual de gordura (fórmula simples)
      const sexoMultiplicador = clienteSelecionado.sexo === 'masculino' ? 1.20 : 1.00;
      const percentualGordura = (1.2 * imc) + (0.23 * idade) - (10.8 * sexoMultiplicador) - 5.4;

      // Calcular composição corporal
      const massaGorda = (percentualGordura / 100) * clienteSelecionado.peso;
      const massaMagra = clienteSelecionado.peso - massaGorda;

      // Calcular TMB
      const tmb = clienteSelecionado.sexo === 'masculino'
        ? 88.362 + (13.397 * clienteSelecionado.peso) + (4.799 * clienteSelecionado.altura * 100) - (5.677 * idade)
        : 447.593 + (9.247 * clienteSelecionado.peso) + (3.098 * clienteSelecionado.altura * 100) - (4.330 * idade);

      // Calcular índices
      const razaoCinturaQuadril = medidas.cintura / medidas.quadril;
      const razaoCinturaEstatura = medidas.cintura / (clienteSelecionado.altura * 100);
      const indiceConicidade = medidas.cintura / (0.109 * Math.sqrt(clienteSelecionado.peso / clienteSelecionado.altura));
      const shapedScore = (medidas.cintura + medidas.quadril) / 2;

      // Salvar na tabela medidas_corporais
      const { error: insertError } = await supabase
        .from('medidas_corporais')
        .insert({
          user_id: clienteSelecionado.user_id,
          altura_usada: clienteSelecionado.altura,
          peso_usado: clienteSelecionado.peso,
          idade_calculada: idade,
          imc: imc,
          medida_bracos: medidas.bracos,
          medida_antebracos: medidas.antebracos,
          medida_cintura: medidas.cintura,
          medida_quadril: medidas.quadril,
          medida_coxas: medidas.coxas,
          medida_panturrilhas: medidas.panturrilhas,
          percentual_gordura: percentualGordura,
          massa_magra: massaMagra,
          massa_gorda: massaGorda,
          tmb: tmb,
          razao_cintura_quadril: razaoCinturaQuadril,
          razao_cintura_estatura: razaoCinturaEstatura,
          indice_conicidade: indiceConicidade,
          shaped_score: shapedScore,
          calculado_automaticamente: true
        });

      if (insertError) throw insertError;

      // Atualizar lista
      await buscarClientesAptos();
      setShowModal(false);
      setClienteSelecionado(null);
    } catch (error) {
      console.error('Erro ao salvar análise:', error);
      setError('Erro ao salvar análise corporal');
    } finally {
      setProcessando(null);
    }
  };

  const handleError = (errorMsg: string) => {
    console.error('Erro na análise:', errorMsg);
    setError(errorMsg);
    setProcessando(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Carregando clientes aptos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-red-800">Erro ao carregar dados</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (clientesAptos.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">Todos os clientes já foram analisados</h3>
        <p className="text-slate-600">Não há clientes pendentes para análise corporal no momento.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Clientes Aptos para Análise Corporal</h3>
          <p className="text-sm text-slate-600">
            Clientes com fotos e formulário nutricional preenchidos, prontos para gerar análise corporal
          </p>
          <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>{clientesAptos.length} clientes disponíveis</span>
          </div>
        </div>

        {/* Lista de clientes */}
        <div className="grid gap-4">
          {clientesAptos.map((cliente) => (
            <div
              key={cliente.user_id}
              className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Informações do cliente */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{cliente.nome_completo}</h4>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="capitalize">{cliente.sexo}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Avaliação: {formatDate(cliente.data_avaliacao)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dados disponíveis */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-600">Fotos OK</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-slate-600">{(cliente.altura * 100).toFixed(0)} cm</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-slate-600">{cliente.peso.toFixed(1)} kg</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-slate-600">Formulário {cliente.tipo_avaliacao}</span>
                    </div>
                  </div>
                </div>

                {/* Botão de ação */}
                <div className="ml-4">
                  <button
                    onClick={() => handleGerarAnalise(cliente)}
                    disabled={processando === cliente.user_id}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processando === cliente.user_id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        Gerar Análise
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Análise */}
      {showModal && clienteSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">
                Gerando Análise Corporal
              </h3>
              <p className="text-slate-600 mt-1">
                {clienteSelecionado.nome_completo}
              </p>
            </div>

            <div className="p-6">
              <AnaliseCorpoMediaPipe
                fotoLateralUrl={clienteSelecionado.foto_lateral_url}
                fotoAberturaUrl={clienteSelecionado.foto_abertura_url}
                alturaReal={clienteSelecionado.altura}
                peso={clienteSelecionado.peso}
                sexo={clienteSelecionado.sexo === 'masculino' ? 'M' : 'F'}
                onMedidasExtraidas={handleMedidasExtraidas}
                onError={handleError}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}