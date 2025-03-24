import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Scale, AlertCircle, CheckCircle, Loader2, ClipboardCheck, ArrowLeft, Heart, User, Sun, Moon } from 'lucide-react';
import { Layout } from '../components/Layout';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClass } from '../styles/theme';
import TrueFocus from '../components/TrueFocus';

export function AvaliacaoNutricionalMasculina() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  // Usando o getThemeClass para obter as classes do tema
  const themeClasses = {
    background: getThemeClass(isDarkMode, 'background'),
    text: getThemeClass(isDarkMode, 'text'),
    textSecondary: getThemeClass(isDarkMode, 'textSecondary'),
    card: `${getThemeClass(isDarkMode, 'cardBg')} border ${getThemeClass(isDarkMode, 'border')} ${getThemeClass(isDarkMode, 'shadow')}`,
    button: getThemeClass(isDarkMode, 'button'),
    buttonSecondary: getThemeClass(isDarkMode, 'buttonSecondary'),
    input: `${getThemeClass(isDarkMode, 'input')} ${
      isDarkMode 
        ? 'bg-gray-800 text-white border-gray-600 focus:border-orange-500' 
        : 'bg-white text-gray-900 border-gray-300 focus:border-orange-500'
    } block w-full rounded-lg px-4 py-2.5 text-sm transition-colors duration-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20`,
    select: getThemeClass(isDarkMode, 'select'),
    label: `${isDarkMode ? 'text-gray-200' : 'text-gray-700'} font-medium`,
    helperText: `${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`,
    radio: `${isDarkMode ? 'text-orange-500 border-gray-600' : 'text-orange-500 border-gray-300'} h-4 w-4 focus:ring-orange-500/20`,
    radioLabel: `${isDarkMode ? 'text-gray-200' : 'text-gray-700'} ml-2 text-sm font-medium`,
    errorText: isDarkMode ? 'text-red-400' : 'text-red-600',
    formSection: `${getThemeClass(isDarkMode, 'cardBg')} p-8 rounded-xl border ${getThemeClass(isDarkMode, 'border')} ${getThemeClass(isDarkMode, 'shadow')}`,
    stepIndicator: {
      active: getThemeClass(isDarkMode, 'button'),
      completed: "bg-green-600 text-white shadow-md",
      inactive: isDarkMode ? "bg-gray-600 text-gray-200" : "bg-gray-200 text-gray-700"
    }
  };

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [perfilData, setPerfilData] = useState<any>(null);
  const [sucesso, setSucesso] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4; // Dividir em 4 etapas
  const [confirmedStep4, setConfirmedStep4] = useState(false);
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formData, setFormData] = useState({
    // Dados pessoais
    data_nascimento: '',
    estado_civil: '',
    tem_filhos: false,
    quantidade_filhos: 0,
    objetivo: '',
    
    // Medidas
    peso: '',
    altura: '',
    peso_habitual: '',
    variacao_peso_6meses: '',
    
    // Histórico de Saúde
    tem_doencas_cronicas: false,
    doencas_cronicas: [] as string[],
    tem_cirurgias: false,
    cirurgias_anteriores: [] as string[],
    intolerancia_alimentar: [] as string[],
    medicamentos: [] as string[],
    historico_familiar_doencas: [] as string[],
    nivel_ansiedade: 0,
    
    // Estilo de Vida
    nivel_atividade: '',
    horas_sono: '',
    horario_acordar: '',
    consumo_alcool: false,
    frequencia_alcool: '',
    fumante: false,
    cigarros_por_dia: 0,
    horas_trabalho: '',
    suplementacao: [] as string[],
    intestino_regular: false,
    frequencia_intestino: '',
    problemas_digestivos: [] as string[],
    
    // Hábitos Alimentares
    ja_fez_dieta: false,
    dificuldades_dieta: [] as string[],
    diario_alimentar: '',
    alimentos_aversao: '',
    alimentos_preferidos: '',
    consumo_refrigerante: false,
    frequencia_refrigerante: '',
    alimentacao_fim_semana: '',
    come_frente_tv: false,
    consumo_agua: '',
    urina_normal: true,
    urina_caracteristicas: [] as string[],
    intestino_diario: false,
    tem_intolerancia: false,
    tem_medicamentos: false,
    tem_historico_familiar: false,
    tem_problemas_digestivos: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    carregarPerfil();
    
    // Aplicar background consistente com o tema
    if (isDarkMode) {
      document.documentElement.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)';
      document.documentElement.style.backgroundColor = '#0f172a';
      document.body.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)';
      document.body.style.backgroundColor = '#0f172a';
    } else {
      document.documentElement.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)';
      document.documentElement.style.backgroundColor = '#f8fafc';
      document.body.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)';
      document.body.style.backgroundColor = '#f8fafc';
    }
  }, [isDarkMode]);

  const carregarPerfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: perfil, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setPerfilData(perfil);
      
      // Verificar se já existe avaliação nutricional
      const { data: avaliacaoExistente, error: avaliacaoError } = await supabase
        .from('avaliacao_nutricional')
        .select('*')
        .eq('user_id', user.id);
        
      console.log('Verificação de avaliação existente - dados:', avaliacaoExistente);
      console.log('Verificação de avaliação existente - erro:', avaliacaoError);
      console.log('Avaliação já existe?', !!(avaliacaoExistente && avaliacaoExistente.length > 0));
      
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : parseFloat(value)
      }));
    } else if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else if (type === 'radio') {
      // Tratamento específico para botões de rádio
      const boolValue = value === 'true';
      
      // Log para debug
      console.log(`Radio button changed: ${name} = ${value} (${boolValue})`);
      
      setFormData(prev => {
        const newState = {
          ...prev,
          [name]: boolValue
        };
        
        // Resetar campos dependentes quando o valor for false
        if (name === 'tem_filhos' && !boolValue) {
          newState.quantidade_filhos = 0;
        }
        if (name === 'tem_intolerancia' && !boolValue) {
          newState.intolerancia_alimentar = [];
        }
        if (name === 'tem_medicamentos' && !boolValue) {
          newState.medicamentos = [];
        }
        if (name === 'tem_historico_familiar' && !boolValue) {
          newState.historico_familiar_doencas = [];
        }
        if (name === 'tem_problemas_digestivos' && !boolValue) {
          newState.problemas_digestivos = [];
        }
        if (name === 'consumo_alcool' && !boolValue) {
          newState.frequencia_alcool = '';
        }
        if (name === 'fumante' && !boolValue) {
          newState.cigarros_por_dia = 0;
        }
        if (name === 'consumo_refrigerante' && !boolValue) {
          newState.frequencia_refrigerante = '';
        }
        
        return newState;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Permitir quebras de linha e preservar espaços
    setFormData(prev => ({
      ...prev,
      [name]: value.split('\n').filter(item => item !== '')
    }));
  };

  const handleAlimentosChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    setErro(null);
    
    try {
      console.log('Iniciando envio do formulário...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Calcula a idade com base na data de nascimento
      const calcularIdade = (dataNascimento: string): number => {
        try {
          const hoje = new Date();
          // Converter DD/MM/YYYY para formato que o Date entende (MM/DD/YYYY ou YYYY-MM-DD)
          const partes = dataNascimento.split('/');
          if (partes.length !== 3) return 0;
          
          const dia = parseInt(partes[0]);
          const mes = parseInt(partes[1]) - 1; // Mês em JS começa em 0
          const ano = parseInt(partes[2]);
          
          const nascimento = new Date(ano, mes, dia);
          
          let idade = hoje.getFullYear() - nascimento.getFullYear();
          const m = hoje.getMonth() - nascimento.getMonth();
          if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
          }
          return idade;
        } catch (error) {
          console.error('Erro ao calcular idade:', error);
          return 0; // Valor padrão em caso de erro
        }
      };

      const idade = calcularIdade(formData.data_nascimento);
      console.log(`Data nascimento: ${formData.data_nascimento}, Idade calculada: ${idade}`);

      // Converter formato da data de DD/MM/YYYY para YYYY-MM-DD (formato ISO esperado pelo PostgreSQL)
      const formatarDataParaIso = (dataString: string): string => {
        if (!dataString) return '';
        const partes = dataString.split('/');
        if (partes.length !== 3) return '';
        return `${partes[2]}-${partes[1]}-${partes[0]}`;
      };
      
      const dataNascimentoFormatada = formatarDataParaIso(formData.data_nascimento);

      // Processa os campos de alimentos e outros dados
      const dadosParaEnviar = {
        user_id: user.id,
        sexo: 'MASCULINO',
        idade: idade,
        data_nascimento: dataNascimentoFormatada, // Usar a data formatada no padrão ISO
        estado_civil: formData.estado_civil,
        tem_filhos: formData.tem_filhos,
        quantidade_filhos: Number(formData.quantidade_filhos),
        objetivo: formData.objetivo,
        
        // Medidas
        peso: Number(formData.peso),
        altura: Number(formData.altura),
        peso_habitual: Number(formData.peso_habitual),
        variacao_peso_6meses: formData.variacao_peso_6meses,
        
        // Histórico de Saúde
        doencas_cronicas: formData.doencas_cronicas,
        cirurgias_anteriores: formData.cirurgias_anteriores,
        intolerancia_alimentar: formData.intolerancia_alimentar,
        medicamentos: formData.medicamentos,
        historico_familiar_doencas: formData.historico_familiar_doencas,
        nivel_ansiedade: Number(formData.nivel_ansiedade),
        
        // Estilo de Vida
        nivel_atividade: formData.nivel_atividade,
        horas_sono: Number(formData.horas_sono),
        horario_acordar: formData.horario_acordar,
        horario_dormir: '22:00',
        consumo_alcool: formData.consumo_alcool,
        frequencia_alcool: formData.frequencia_alcool,
        fumante: formData.fumante,
        cigarros_por_dia: Number(formData.cigarros_por_dia),
        horas_trabalho: Number(formData.horas_trabalho),
        usa_suplementos: formData.suplementacao.length > 0,
        suplementacao: formData.suplementacao,
        
        // Hábitos Alimentares
        intestino_regular: formData.intestino_regular,
        frequencia_intestino: formData.frequencia_intestino,
        problemas_digestivos: formData.problemas_digestivos,
        ja_fez_dieta: formData.ja_fez_dieta,
        dificuldades_dieta: formData.dificuldades_dieta,
        diario_alimentar: formData.diario_alimentar,
        aversao_alimentar: formData.alimentos_aversao.split('\n').filter(item => item.trim() !== ''),
        preferencia_alimentar: formData.alimentos_preferidos.split('\n').filter(item => item.trim() !== ''),
        consumo_refrigerante: formData.consumo_refrigerante,
        frequencia_refrigerante: formData.frequencia_refrigerante,
        alimentacao_fim_semana: formData.alimentacao_fim_semana,
        come_frente_tv: formData.come_frente_tv,
        consumo_agua: Number(formData.consumo_agua),
        urina_normal: formData.urina_normal,
        urina_caracteristicas: formData.urina_caracteristicas,
        intestino_diario: formData.intestino_diario,
        qtd_refeicoes: 5,
        restricao_alimentar: []
      };

      console.log('Dados processados para envio:', dadosParaEnviar);

      const { data, error } = await supabase
        .from('avaliacao_nutricional')
        .insert([dadosParaEnviar])
        .select();

      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw new Error(error.message);
      }

      console.log('Dados salvos com sucesso:', data);
      console.log('ID do registro criado:', data?.[0]?.id);
      console.log('User ID do registro:', data?.[0]?.user_id);
      setSucesso(true);
      
      // Aguarda 2 segundos antes de redirecionar
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Erro detalhado:', error);
      if (error instanceof Error) {
        setErro(error.message);
      } else {
        setErro('Erro ao salvar avaliação nutricional');
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para validar cada etapa
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    
    if (step === 1) {
      // Validação da etapa 1 - Dados Pessoais
      if (!formData.data_nascimento) errors.data_nascimento = "Data de nascimento é obrigatória";
      if (!formData.estado_civil) errors.estado_civil = "Estado civil é obrigatório";
      if (!formData.peso) errors.peso = "Peso é obrigatório";
      if (!formData.altura) errors.altura = "Altura é obrigatória";
      if (!formData.peso_habitual) errors.peso_habitual = "Peso habitual é obrigatório";
      if (!formData.objetivo) errors.objetivo = "Objetivo é obrigatório";
    } 
    else if (step === 2) {
      // Validação da etapa 2 - Histórico de Saúde
      if (formData.tem_doencas_cronicas && formData.doencas_cronicas.length === 0) {
        errors.doencas_cronicas = "Por favor, especifique as doenças crônicas";
      }
      if (formData.tem_cirurgias && formData.cirurgias_anteriores.length === 0) {
        errors.cirurgias_anteriores = "Por favor, especifique as cirurgias";
      }
      if (formData.tem_intolerancia && formData.intolerancia_alimentar.length === 0) {
        errors.intolerancia_alimentar = "Por favor, especifique as intolerâncias";
      }
      if (formData.tem_medicamentos && formData.medicamentos.length === 0) {
        errors.medicamentos = "Por favor, especifique os medicamentos";
      }
      if (formData.tem_historico_familiar && formData.historico_familiar_doencas.length === 0) {
        errors.historico_familiar_doencas = "Por favor, especifique as doenças do histórico familiar";
      }
    }
    else if (step === 3) {
      // Validação da etapa 3 - Estilo de Vida
      if (!formData.nivel_atividade) errors.nivel_atividade = "Nível de atividade é obrigatório";
      if (!formData.horas_sono) errors.horas_sono = "Horas de sono é obrigatório";
      if (!formData.horario_acordar) errors.horario_acordar = "Horário de acordar é obrigatório";
      if (!formData.horas_trabalho) errors.horas_trabalho = "Horas de trabalho é obrigatório";
    }
    else if (step === 4) {
      // Validação da etapa 4 - Hábitos Alimentares
      if (!formData.diario_alimentar) errors.diario_alimentar = "Diário alimentar é obrigatório";
      if (!formData.consumo_agua) errors.consumo_agua = "Consumo de água é obrigatório";
      if (formData.alimentos_aversao === undefined) errors.alimentos_aversao = "Campo obrigatório";
      if (formData.alimentos_preferidos === undefined) errors.alimentos_preferidos = "Campo obrigatório";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Função para avançar etapa
  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      }
    }
  };

  // Função para voltar etapa
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // Função para confirmar última etapa
  const confirmStep4 = () => {
    setConfirmedStep4(true);
    setShowConfirmationMessage(true);
    setTimeout(() => {
      setShowConfirmationMessage(false);
    }, 5000);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    handleSubmit();
  };

  if (!perfilData) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen ${themeClasses.background} px-4 py-8`}>
        <div className="max-w-7xl mx-auto">
          {/* Botão Voltar para Dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex items-center mb-6 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors`}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Dashboard
          </button>

          {sucesso ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn">
              <div className={`${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'} rounded-full p-6 mb-6`}>
                <CheckCircle className={`h-16 w-16 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
              </div>
              <h2 className={`text-2xl md:text-3xl font-bold mb-4 text-center ${themeClasses.text}`}>
                Avaliação Nutricional Enviada com Sucesso!
              </h2>
              <p className={`${themeClasses.textSecondary} text-center max-w-md mb-8 text-lg`}>
                Sua avaliação foi recebida e está sendo analisada por nossos especialistas. 
                Em breve você receberá seu plano nutricional personalizado.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className={`${themeClasses.button} px-6 py-3 rounded-lg font-semibold`}
              >
                Voltar para o Dashboard
              </button>
            </div>
          ) : (
            <>
              <div className="mb-12 flex flex-col items-center justify-center text-center">
                <div className="flex flex-col items-center mb-8">
                  <div className="text-center">
                    <TrueFocus 
                      sentence="Avaliação Nutricional"
                      manualMode={false}
                      blurAmount={5}
                      borderColor="orange"
                      animationDuration={2}
                      pauseBetweenAnimations={1}
                    />
                  </div>
                </div>
                
                {/* Botão de alternância de tema */}
                <button 
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg transition-all duration-300 ease-in-out
                            hover:scale-110 active:scale-95
                            ${isDarkMode 
                              ? 'bg-gray-800 text-orange-400 hover:bg-gray-700' 
                              : 'bg-white text-orange-500 hover:bg-gray-50'}
                            shadow-md hover:shadow-lg
                            border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                  aria-label={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
                >
                  {isDarkMode ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </button>
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                    <span className="block sm:inline">{erro}</span>
                  </div>
                </div>
              )}

              {/* Progress Steps */}
              <div className="flex justify-center space-x-4 md:space-x-8 mb-8">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 
                      ${currentStep === step ? themeClasses.stepIndicator.active : 
                        currentStep > step ? themeClasses.stepIndicator.completed : 
                        themeClasses.stepIndicator.inactive}`}>
                      {step}
                    </div>
                    <span className={`text-sm ${
                      isDarkMode 
                        ? (currentStep >= step ? 'text-gray-200' : 'text-gray-400')
                        : (currentStep >= step ? 'text-gray-800' : 'text-gray-600')
                    }`}>
                      {step === 1 ? 'Dados Pessoais' :
                       step === 2 ? 'Saúde' :
                       step === 3 ? 'Estilo de Vida' :
                       'Hábitos Alimentares'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Form Section */}
              <div className={themeClasses.formSection}>
                <form onSubmit={handleSubmit} className="space-y-8">
                  {loading && (
                    <div className="flex justify-center items-center mb-6">
                      <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
                      <span className="ml-2 text-orange-600">Processando...</span>
                    </div>
                  )}

                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="bg-indigo-600 p-2 rounded-full">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Dados Pessoais</h2>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Data de Nascimento*
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: 15/05/1985
                          </p>
                          <input
                            type="text"
                            name="data_nascimento"
                            value={formData.data_nascimento}
                            onChange={(e) => {
                              const value = e.target.value;
                              let formattedValue = value.replace(/\D/g, '');
                              
                              if (formattedValue.length > 0) {
                                if (formattedValue.length > 2 && formattedValue.length <= 4) {
                                  formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2);
                                } else if (formattedValue.length > 4) {
                                  formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4) + '/' + formattedValue.slice(4, 8);
                                }
                              }
                              
                              setFormData(prev => ({
                                ...prev,
                                data_nascimento: formattedValue
                              }));
                            }}
                            className={themeClasses.input}
                            placeholder="DD/MM/AAAA"
                            maxLength={10}
                            required
                          />
                        </div>

                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Estado Civil*
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: Solteiro, Casado, Divorciado
                          </p>
                          <select
                            id="estado_civil"
                            name="estado_civil"
                            value={formData.estado_civil}
                            onChange={handleChange}
                            className={themeClasses.input}
                            required
                          >
                            <option value="">Selecione</option>
                            <option value="SOLTEIRO">Solteiro(a)</option>
                            <option value="CASADO">Casado(a)</option>
                            <option value="DIVORCIADO">Divorciado(a)</option>
                            <option value="VIUVO">Viúvo(a)</option>
                          </select>
                        </div>

                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Peso Atual (kg)*
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: 75.5
                          </p>
                          <input
                            type="number"
                            name="peso"
                            value={formData.peso}
                            onChange={handleChange}
                            className={themeClasses.input}
                            required
                            step="0.01"
                          />
                        </div>

                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Altura (m)*
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: 1.75
                          </p>
                          <input
                            type="number"
                            name="altura"
                            value={formData.altura}
                            onChange={handleChange}
                            className={themeClasses.input}
                            required
                            step="0.01"
                          />
                        </div>

                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Peso Habitual (kg)*
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: 72.0 (seu peso normal/usual)
                          </p>
                          <input
                            type="number"
                            name="peso_habitual"
                            value={formData.peso_habitual}
                            onChange={handleChange}
                            className={themeClasses.input}
                            required
                            step="0.01"
                          />
                        </div>

                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Variação de Peso nos Últimos 6 Meses
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: Ganhou 5kg ou Perdeu 3kg
                          </p>
                          <input
                            type="text"
                            name="variacao_peso_6meses"
                            value={formData.variacao_peso_6meses}
                            onChange={handleChange}
                            className={themeClasses.input}
                            placeholder="Ex: Ganhou 5kg ou Perdeu 3kg"
                          />
                        </div>

                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Possui filhos?
                          </label>
                          <p className={themeClasses.helperText}>
                            Selecione sim ou não
                          </p>
                          <div className="flex gap-4">
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="tem_filhos"
                                value="true"
                                checked={formData.tem_filhos === true}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Sim</span>
                            </label>
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="tem_filhos"
                                value="false"
                                checked={formData.tem_filhos === false}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Não</span>
                            </label>
                          </div>
                        </div>

                        {formData.tem_filhos && (
                          <div className="space-y-4">
                            <label className={themeClasses.label}>
                              Quantidade de Filhos
                            </label>
                            <p className={themeClasses.helperText}>
                              Ex: 2
                            </p>
                            <input
                              type="number"
                              name="quantidade_filhos"
                              value={formData.quantidade_filhos}
                              onChange={handleChange}
                              className={themeClasses.input}
                              min="0"
                            />
                          </div>
                        )}

                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Objetivo*
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: Perder Peso, Ganhar Massa Muscular
                          </p>
                          <select
                            id="objetivo"
                            name="objetivo"
                            value={formData.objetivo}
                            onChange={handleChange}
                            className={themeClasses.input}
                            required
                          >
                            <option value="">Selecione</option>
                            <option value="PERDER_PESO">Perder Peso</option>
                            <option value="GANHAR_MASSA">Ganhar Massa Muscular</option>
                            </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="bg-indigo-600 p-2 rounded-full">
                          <Heart className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Saúde</h2>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Possui doenças crônicas?*
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: diabetes, hipertensão, colesterol alto
                          </p>
                          <div className="flex gap-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="tem_doencas_cronicas"
                                value="true"
                                checked={formData.tem_doencas_cronicas === true}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Sim</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="tem_doencas_cronicas"
                                value="false"
                                checked={formData.tem_doencas_cronicas === false}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Não</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Já realizou alguma cirurgia?
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: apendicite, vesícula, ortopédica
                          </p>
                          <div className="flex gap-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="tem_cirurgias"
                                value="true"
                                checked={formData.tem_cirurgias === true}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Sim</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="tem_cirurgias"
                                value="false"
                                checked={formData.tem_cirurgias === false}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Não</span>
                            </label>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Possui intolerância alimentar?
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: lactose, glúten, frutos do mar
                          </p>
                          <div className="flex gap-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="tem_intolerancia"
                                value="true"
                                checked={formData.tem_intolerancia === true}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Sim</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="tem_intolerancia"
                                value="false"
                                checked={formData.tem_intolerancia === false}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Não</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Faz uso de medicamentos?
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: anti-hipertensivos, antidepressivos
                          </p>
                          <div className="flex gap-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="tem_medicamentos"
                                value="true"
                                checked={formData.tem_medicamentos === true}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Sim</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="tem_medicamentos"
                                value="false"
                                checked={formData.tem_medicamentos === false}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Não</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Possui histórico familiar de doenças?
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: diabetes, câncer, doenças cardíacas
                          </p>
                          <div className="flex gap-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="tem_historico_familiar"
                                value="true"
                                checked={formData.tem_historico_familiar === true}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Sim</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="tem_historico_familiar"
                                value="false"
                                checked={formData.tem_historico_familiar === false}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Não</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Nível de Ansiedade (0-10)
                          </label>
                          <input
                            type="number"
                            name="nivel_ansiedade"
                            value={formData.nivel_ansiedade}
                            onChange={handleChange}
                            className={themeClasses.input}
                            min="0"
                            max="10"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="bg-indigo-600 p-2 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-white">
                            <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                            <line x1="6" y1="1" x2="6" y2="4"></line>
                            <line x1="10" y1="1" x2="10" y2="4"></line>
                            <line x1="14" y1="1" x2="14" y2="4"></line>
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Estilo de Vida</h2>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Nível de Atividade Física*
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: Sedentário (pouca atividade), Leve (1-3x/semana), Moderado (3-5x/semana), Intenso (6-7x/semana)
                          </p>
                          <select
                            id="nivel_atividade"
                            name="nivel_atividade"
                            value={formData.nivel_atividade}
                            onChange={handleChange}
                            className={themeClasses.input}
                            required
                          >
                            <option value="">Selecione</option>
                            <option value="SEDENTARIO">Sedentário</option>
                            <option value="LEVE">Leve</option>
                            <option value="MODERADO">Moderado</option>
                            <option value="INTENSO">Intenso</option>
                          </select>
                        </div>

                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Horas de Sono*
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: 7 (para 7 horas por noite)
                          </p>
                          <input
                            type="number"
                            name="horas_sono"
                            value={formData.horas_sono}
                            onChange={handleChange}
                            className={themeClasses.input}
                            required
                          />
                        </div>

                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Horário que Costuma Acordar*
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: 06:30
                          </p>
                          <input
                            type="time"
                            name="horario_acordar"
                            value={formData.horario_acordar}
                            onChange={handleChange}
                            className={themeClasses.input}
                            required
                          />
                        </div>

                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Consome bebidas alcoólicas?
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: cerveja, vinho, destilados
                          </p>
                          <div className="flex gap-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="consumo_alcool"
                                value="true"
                                checked={formData.consumo_alcool === true}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Sim</span>
                            </label>
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="consumo_alcool"
                                value="false"
                                checked={formData.consumo_alcool === false}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Não</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            É fumante?
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: cigarros, eletrônicos, charutos
                          </p>
                          <div className="flex gap-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="fumante"
                                value="true"
                                checked={formData.fumante === true}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Sim</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="fumante"
                                value="false"
                                checked={formData.fumante === false}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Não</span>
                            </label>
                          </div>

                          {formData.fumante && (
                            <div className="mt-4">
                              <label htmlFor="cigarros_por_dia" className={themeClasses.label}>
                                Quantos cigarros por dia?
                              </label>
                              <input
                                type="number"
                                id="cigarros_por_dia"
                                name="cigarros_por_dia"
                                value={formData.cigarros_por_dia}
                                onChange={handleChange}
                                className={themeClasses.input} min="0" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <label htmlFor="horas_trabalho" className={themeClasses.label}>
                            Horas de Trabalho por Dia*
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: 8 (para 8 horas por dia)
                          </p>
                          <input
                            type="number"
                            id="horas_trabalho"
                            name="horas_trabalho"
                            value={formData.horas_trabalho}
                            onChange={handleChange}
                            className={`${themeClasses.input} ${formErrors.horas_trabalho ? themeClasses.errorText : ''}`}
                            required
                            min="0"
                            max="24"
                          />
                          {formErrors.horas_trabalho && (
                            <p className={themeClasses.errorText}>{formErrors.horas_trabalho}</p>
                          )}
                        </div>

                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Faz uso de suplementos? Quais?
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: Whey Protein, Vitamina D, Creatina
                          </p>
                          <textarea
                            id="suplementacao"
                            name="suplementacao"
                            value={formData.suplementacao.join('\n')}
                            onChange={handleArrayChange}
                            className={themeClasses.input}
                            rows={3}
                            placeholder="Digite um suplemento por linha"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-300 p-2 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-black">
                            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 1 2-2V2"></path>
                            <path d="M7 2v20"></path>
                            <path d="M21 15V2"></path>
                            <path d="M18 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"></path>
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Hábitos Alimentares</h2>
                      </div>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-4">
                          <label htmlFor="diario_alimentar" className={themeClasses.label}>
                            Diário Alimentar (Descreva suas refeições habituais)*
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: 7h - Café: pão, ovo, café | 12h - Almoço: arroz, feijão, frango, salada | 19h - Jantar: sopa, pão
                          </p>
                          <textarea
                            id="diario_alimentar"
                            name="diario_alimentar"
                            value={formData.diario_alimentar}
                            onChange={handleChange}
                            className={`${themeClasses.input} ${formErrors.diario_alimentar ? themeClasses.errorText : ''}`}
                            rows={6}
                            placeholder="Descreva suas refeições diárias..."
                            required
                          />
                          {formErrors.diario_alimentar && (
                            <p className={themeClasses.errorText}>{formErrors.diario_alimentar}</p>
                          )}
                        </div>

                        <div className="space-y-4">
                          <label htmlFor="alimentos_aversao" className={themeClasses.label}>
                            Alimentos que não gosta ou tem aversão
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: brócolis, fígado, berinjela
                          </p>
                          <textarea
                            id="alimentos_aversao"
                            name="alimentos_aversao"
                            value={formData.alimentos_aversao}
                            onChange={handleAlimentosChange}
                            className={themeClasses.input}
                            rows={3}
                            placeholder="Liste os alimentos..."
                          />
                        </div>

                        <div className="space-y-4">
                          <label htmlFor="alimentos_preferidos" className={themeClasses.label}>
                            Alimentos preferidos
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: frango, batata doce, banana
                          </p>
                          <textarea
                            id="alimentos_preferidos"
                            name="alimentos_preferidos"
                            value={formData.alimentos_preferidos}
                            onChange={handleAlimentosChange}
                            className={themeClasses.input}
                            rows={3}
                            placeholder="Liste os alimentos..."
                          />
                        </div>

                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Consome refrigerante?
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: normal ou zero/diet
                          </p>
                          <div className="flex gap-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="consumo_refrigerante"
                                value="true"
                                checked={formData.consumo_refrigerante === true}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Sim</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="consumo_refrigerante"
                                value="false"
                                checked={formData.consumo_refrigerante === false}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Não</span>
                            </label>
                          </div>

                          {formData.consumo_refrigerante && (
                            <div className="mt-4">
                              <label htmlFor="frequencia_refrigerante" className={themeClasses.label}>
                                Com que frequência consome refrigerante?
                              </label>
                              <p className={themeClasses.helperText}>
                                Ex: Diariamente, Semanalmente, Raramente
                              </p>
                              <select
                                id="frequencia_refrigerante"
                                name="frequencia_refrigerante"
                                value={formData.frequencia_refrigerante}
                                onChange={handleChange}
                                className={themeClasses.input}
                              >
                                <option value="">Selecione</option>
                                <option value="DIARIAMENTE">Diariamente</option>
                                <option value="ALGUMAS_VEZES_SEMANA">Algumas vezes por semana</option>
                                <option value="SEMANALMENTE">Semanalmente</option>
                                <option value="QUINZENALMENTE">Quinzenalmente</option>
                                <option value="MENSALMENTE">Mensalmente</option>
                                <option value="RARAMENTE">Raramente</option>
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <label htmlFor="consumo_agua" className={themeClasses.label}>
                            Consumo de água por dia (litros)*
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: 2 (para 2 litros por dia)
                          </p>
                          <input
                            type="number"
                            id="consumo_agua"
                            name="consumo_agua"
                            value={formData.consumo_agua}
                            onChange={handleChange}
                            className={`${themeClasses.input} ${formErrors.consumo_agua ? themeClasses.errorText : ''}`}
                            required
                          />
                          {formErrors.consumo_agua && (
                            <p className={themeClasses.errorText}>{formErrors.consumo_agua}</p>
                          )}
                        </div>

                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Costuma comer em frente à TV/Celular?
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: Sim (se costuma comer enquanto assiste TV ou usa o celular)
                          </p>
                          <div className="flex gap-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="come_frente_tv"
                                value="true"
                                checked={formData.come_frente_tv === true}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Sim</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="come_frente_tv"
                                value="false"
                                checked={formData.come_frente_tv === false}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Não</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className={themeClasses.label}>
                            Urina normal?
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: Sim, Não
                          </p>
                          <div className="flex gap-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="urina_normal"
                                value="true"
                                checked={formData.urina_normal === true}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Sim</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name="urina_normal"
                                value="false"
                                checked={formData.urina_normal === false}
                                onChange={handleChange}
                                className={themeClasses.radio}
                              />
                              <span className={themeClasses.radioLabel}>Não</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label htmlFor="urina_caracteristicas" className={themeClasses.label}>
                            Descrição das características da urina
                          </label>
                          <p className={themeClasses.helperText}>
                            Ex: Cor, odor, presença de proteínas
                          </p>
                          <textarea
                            id="urina_caracteristicas"
                            name="urina_caracteristicas"
                            value={formData.urina_caracteristicas.join('\n')}
                            onChange={handleArrayChange}
                            className={themeClasses.input}
                            rows={3}
                            placeholder="Digite uma descrição..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className={`${themeClasses.buttonSecondary} px-6 py-2 rounded-lg`}
                      >
                        Voltar
                      </button>
                    )}
                    {currentStep < totalSteps && (
                      <button
                        type="button"
                        onClick={nextStep}
                        className={`${themeClasses.button} px-6 py-2 rounded-lg ml-auto`}
                      >
                        Próximo
                      </button>
                    )}
                    {currentStep === totalSteps && (
                      <>
                        <button
                          type="button"
                          onClick={confirmStep4}
                          className={`${themeClasses.buttonSecondary} px-6 py-2 rounded-lg`}
                        >
                          Revisar
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowConfirmModal(true)}
                          disabled={loading}
                          className={`${themeClasses.button} px-6 py-2 rounded-lg`}
                        >
                          {loading ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Enviando...
                            </span>
                          ) : (
                            'Enviar Formulário'
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>

              {/* Modal de confirmação */}
              {showConfirmModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-orange-500/30">
                    <h3 className="text-lg font-semibold text-white mb-4">Confirmar envio</h3>
                    <p className="text-gray-300 mb-6">
                      Tem certeza que deseja enviar o formulário? Verifique se todas as informações estão corretas.
                    </p>
                    <div className="flex justify-end gap-4">
                      <button
                        onClick={() => setShowConfirmModal(false)}
                        className={`${themeClasses.buttonSecondary} px-6 py-3 rounded-lg`}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleConfirmSubmit}
                        className={`${themeClasses.button} px-6 py-3 rounded-lg`}
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}