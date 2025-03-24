import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserPlus, CheckCircle, Lock, Mail, User, Phone, Loader2, Check, X } from 'lucide-react';
import Aurora from '../components/Aurora';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClass } from '../styles/theme';
import '../styles/global.css';

export function Cadastro() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const themeClasses = {
    background: 'bg-gradient-to-br from-gray-900 to-black',
    text: 'text-white',
    textSecondary: 'text-white/70',
    card: 'bg-black/30 backdrop-blur-sm border border-white/10',
    button: 'bg-orange-600 hover:bg-orange-700 text-white',
    input: 'bg-white/10 border-white/20 text-white placeholder-white/50',
    label: 'text-white',
    select: 'bg-white/10 border-white/20 text-white',
    errorText: 'text-red-400'
  };

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    email: '',
    telefone: '',
    sexo: '',
    senha: '',
    confirmarSenha: '',
  });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [telefoneStatus, setTelefoneStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [telefoneMessage, setTelefoneMessage] = useState('');
  const telefoneTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'telefone') {
      const telefoneValue = value.replace(/\D/g, '').slice(0, 11);
      setFormData({ ...formData, telefone: telefoneValue });
      verificarTelefoneRealTime(telefoneValue);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const verificarTelefoneRealTime = async (telefone: string) => {
    if (telefoneTimeoutRef.current) {
      clearTimeout(telefoneTimeoutRef.current);
    }

    if (!telefone || telefone.length < 10) {
      setTelefoneStatus('idle');
      setTelefoneMessage('');
      return;
    }

    if (telefone.length >= 10 && telefone.length <= 11) {
      setTelefoneStatus('checking');
      
      telefoneTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('==================== INÍCIO DA VERIFICAÇÃO ====================');
          console.log('Iniciando verificação para telefone:', telefone);
          
          // VERIFICAÇÃO ADICIONAL: Listar todos os telefones na tabela de perfis para debug
          console.log('LISTANDO TODOS OS TELEFONES NA TABELA PERFIS...');
          const { data: todosPerfis, error: todosPerfilError } = await supabase
            .from('perfis')
            .select('telefone, id, nome_completo');
          
          if (todosPerfilError) {
            console.error('Erro ao listar todos os perfis:', todosPerfilError);
          } else {
            console.log('Todos os telefones cadastrados em perfis:', todosPerfis);
            console.log('Total de perfis cadastrados:', todosPerfis ? todosPerfis.length : 0);
            
            // Verificação manual para debug
            if (todosPerfis && todosPerfis.length > 0) {
              const perfilEncontradoManualmente = todosPerfis.find(
                perfil => perfil.telefone === telefone
              );
              
              if (perfilEncontradoManualmente) {
                console.log('PERFIL ENCONTRADO MANUALMENTE:', perfilEncontradoManualmente);
              } else {
                console.log('PERFIL NÃO ENCONTRADO MANUALMENTE');
              }
            }
          }
          
          // PRIMEIRA VERIFICAÇÃO: Verificar se o telefone existe na tabela de compras
          console.log('VERIFICANDO NA TABELA COMPRAS...');
          const { data: compraDados, error: compraError } = await supabase
            .from('compras')
            .select('*')
            .eq('telefone', telefone);

          if (compraError) {
            console.error('Erro ao verificar compras:', compraError);
            throw compraError;
          }

          console.log('Resultado da consulta na tabela compras:', compraDados);
          console.log('Quantidade de registros encontrados em compras:', compraDados ? compraDados.length : 0);

          // Verifica se o telefone foi encontrado na tabela de compras
          if (!compraDados || compraDados.length === 0) {
            console.log('TELEFONE NÃO ENCONTRADO NA BASE DE COMPRADORES:', telefone);
            setTelefoneStatus('invalid');
            setTelefoneMessage('Telefone não encontrado na base de compradores.');
            console.log('==================== FIM DA VERIFICAÇÃO (TELEFONE NÃO ENCONTRADO) ====================');
            return;
          }
          
          // SEGUNDA VERIFICAÇÃO: Verificar se o telefone já está cadastrado em algum perfil
          // Usando verificação manual com os dados já obtidos
          let telefoneJaCadastrado = false;
          let perfilExistente = null;
          
          if (todosPerfis && todosPerfis.length > 0) {
            perfilExistente = todosPerfis.find(
              perfil => perfil.telefone === telefone
            );
            
            if (perfilExistente) {
              telefoneJaCadastrado = true;
            }
          }
          
          console.log('Verificação manual - Telefone já cadastrado:', telefoneJaCadastrado);
          console.log('Verificação manual - Perfil encontrado:', perfilExistente);
          
          if (telefoneJaCadastrado) {
            console.log('TELEFONE JÁ CADASTRADO EM OUTRO PERFIL:', telefone);
            console.log('Perfil encontrado:', JSON.stringify(perfilExistente));
            setTelefoneStatus('invalid');
            setTelefoneMessage('Este telefone já está cadastrado em outra conta.');
            console.log('==================== FIM DA VERIFICAÇÃO (TELEFONE JÁ CADASTRADO) ====================');
            return;
          }

          // Se chegou aqui, o telefone está na base de compras e não está cadastrado em nenhum perfil
          console.log('TELEFONE VÁLIDO:', telefone);
          console.log('Dados da compra:', JSON.stringify(compraDados));
          setTelefoneStatus('valid');
          setTelefoneMessage('Telefone válido!');
          console.log('==================== FIM DA VERIFICAÇÃO (TELEFONE VÁLIDO) ====================');
        } catch (error) {
          console.error('Erro na verificação do telefone:', error);
          setTelefoneStatus('invalid');
          setTelefoneMessage('Erro ao verificar telefone. Tente novamente.');
          console.log('==================== FIM DA VERIFICAÇÃO (ERRO) ====================');
        }
      }, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    
    try {
      console.log('==================== INÍCIO DO CADASTRO ====================');
      if (formData.senha !== formData.confirmarSenha) {
        throw new Error('As senhas não coincidem');
      }

      if (formData.telefone.length < 10 || formData.telefone.length > 11) {
        throw new Error('O telefone deve ter 10 ou 11 dígitos (DDD + número)');
      }

      // VERIFICAÇÃO ADICIONAL: Listar todos os telefones na tabela de perfis para debug
      console.log('LISTANDO TODOS OS TELEFONES NA TABELA PERFIS (SUBMIT)...');
      const { data: todosPerfis, error: todosPerfilError } = await supabase
        .from('perfis')
        .select('telefone, id, nome_completo');
      
      if (todosPerfilError) {
        console.error('Erro ao listar todos os perfis:', todosPerfilError);
      } else {
        console.log('Todos os telefones cadastrados em perfis:', todosPerfis);
        console.log('Total de perfis cadastrados:', todosPerfis ? todosPerfis.length : 0);
        
        // Verificação manual para debug
        if (todosPerfis && todosPerfis.length > 0) {
          const perfilEncontradoManualmente = todosPerfis.find(
            perfil => perfil.telefone === formData.telefone
          );
          
          if (perfilEncontradoManualmente) {
            console.log('PERFIL ENCONTRADO MANUALMENTE (SUBMIT):', perfilEncontradoManualmente);
          } else {
            console.log('PERFIL NÃO ENCONTRADO MANUALMENTE (SUBMIT)');
          }
        }
      }

      // PRIMEIRA VERIFICAÇÃO: Verificar se o telefone existe na tabela de compras
      console.log('VERIFICANDO NA TABELA COMPRAS (SUBMIT)...');
      console.log('Telefone a verificar:', formData.telefone);
      const { data: compraDados, error: compraError } = await supabase
        .from('compras')
        .select('*')
        .eq('telefone', formData.telefone);
      
      console.log('Resultado da consulta na tabela compras:', compraDados);
      console.log('Quantidade de registros encontrados em compras:', compraDados ? compraDados.length : 0);
      
      if (compraError) {
        console.error('Erro ao verificar compras:', compraError);
        throw new Error('Erro ao verificar telefone na base de compradores.');
      }
      
      if (!compraDados || compraDados.length === 0) {
        console.log('TELEFONE NÃO ENCONTRADO NA BASE DE COMPRADORES (SUBMIT)');
        throw new Error('Telefone não encontrado na base de compradores.');
      }
      
      // SEGUNDA VERIFICAÇÃO: Verificar se o telefone já está cadastrado em algum perfil
      // Usando verificação manual com os dados já obtidos
      let telefoneJaCadastrado = false;
      let perfilExistente = null;
      
      if (todosPerfis && todosPerfis.length > 0) {
        perfilExistente = todosPerfis.find(
          perfil => perfil.telefone === formData.telefone
        );
        
        if (perfilExistente) {
          telefoneJaCadastrado = true;
        }
      }
      
      console.log('Verificação manual - Telefone já cadastrado (SUBMIT):', telefoneJaCadastrado);
      console.log('Verificação manual - Perfil encontrado (SUBMIT):', perfilExistente);
      
      if (telefoneJaCadastrado) {
        console.log('TELEFONE JÁ CADASTRADO EM OUTRO PERFIL (SUBMIT):', formData.telefone);
        console.log('Perfil encontrado (SUBMIT):', JSON.stringify(perfilExistente));
        throw new Error('Este telefone já está cadastrado em outra conta.');
      }

      console.log('TELEFONE VÁLIDO (SUBMIT):', formData.telefone);
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error('Erro ao criar usuário');

      const { error: profileError } = await supabase
        .from('perfis')
        .insert([
          {
            user_id: signUpData.user.id,
            nome_completo: formData.nomeCompleto,
            telefone: formData.telefone,
            sexo: formData.sexo,
          },
        ])
        .single();

      if (profileError) {
        await supabase.auth.admin.deleteUser(signUpData.user.id);
        throw profileError;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      if (error instanceof Error) {
        setErro(error.message);
      } else {
        setErro('Erro ao criar conta. Por favor, tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
              Cadastro realizado com sucesso!
            </h2>
            <p className="mt-2 text-center text-white/70">
              Sua conta foi criada. Você já pode fazer login.
            </p>
            <button
              onClick={() => navigate('/login')}
              className={`${themeClasses.button} w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              Ir para o Login
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            Criar nova conta
          </h2>
          <p className="mt-2 text-center text-white/70">
            Ou{' '}
            <Link to="/login" className="font-medium text-orange-500 hover:text-orange-400">
              faça login em sua conta existente
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md -space-y-px">
            <div className="mb-4">
              <label htmlFor="nomeCompleto" className={`block text-sm font-medium ${themeClasses.label}`}>
                Nome Completo
              </label>
              <div className="mt-1 relative">
                <input
                  id="nomeCompleto"
                  name="nomeCompleto"
                  type="text"
                  required
                  value={formData.nomeCompleto}
                  onChange={handleChange}
                  className={`${themeClasses.input} block w-full px-3 py-2 rounded-md`}
                  placeholder="Ex: João da Silva"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-white/50" />
                </div>
              </div>
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
                  className={`${themeClasses.input} block w-full px-3 py-2 rounded-md`}
                  placeholder="Ex: joao.silva@email.com"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-white/50" />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="telefone" className={`block text-sm font-medium ${themeClasses.label}`}>
                Telefone (DDD + Número)
              </label>
              <div className="mt-1 relative">
                <input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  required
                  value={formData.telefone}
                  onChange={handleChange}
                  className={`${themeClasses.input} block w-full px-3 py-2 rounded-md`}
                  placeholder="Ex: 11999999999"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {telefoneStatus === 'checking' ? (
                    <Loader2 className="h-5 w-5 text-white/50 animate-spin" />
                  ) : telefoneStatus === 'valid' ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : telefoneStatus === 'invalid' ? (
                    <X className="h-5 w-5 text-red-500" />
                  ) : (
                    <Phone className="h-5 w-5 text-white/50" />
                  )}
                </div>
              </div>
              <p className="mt-1 text-sm text-white/50">Digite apenas números: DDD + número (10 ou 11 dígitos)</p>
              {telefoneMessage && (
                <p className={`mt-2 text-sm flex items-center gap-2 ${telefoneStatus === 'valid' ? 'text-green-400' : themeClasses.errorText}`}>
                  {telefoneStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin" />}
                  {telefoneStatus === 'valid' && <Check className="h-4 w-4" />}
                  {telefoneStatus === 'invalid' && <X className="h-4 w-4" />}
                  {telefoneMessage}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="sexo" className={`block text-sm font-medium ${themeClasses.label}`}>
                Sexo
              </label>
              <div className="mt-1 relative">
                <select
                  id="sexo"
                  name="sexo"
                  required
                  value={formData.sexo}
                  onChange={handleChange}
                  className={`${themeClasses.input} block w-full px-3 py-2 rounded-md appearance-none`}
                >
                  <option value="" disabled className="bg-gray-900 text-white">Selecione seu sexo</option>
                  <option value="masculino" className="bg-gray-900 text-white">Masculino</option>
                  <option value="feminino" className="bg-gray-900 text-white">Feminino</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-white/50" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
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
                  autoComplete="new-password"
                  required
                  value={formData.senha}
                  onChange={handleChange}
                  className={`${themeClasses.input} block w-full px-3 py-2 rounded-md`}
                  placeholder="Mínimo 6 caracteres"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-white/50" />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="confirmarSenha" className={`block text-sm font-medium ${themeClasses.label}`}>
                Confirmar Senha
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmarSenha"
                  name="confirmarSenha"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  className={`${themeClasses.input} block w-full px-3 py-2 rounded-md`}
                  placeholder="Digite a senha novamente"
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

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <UserPlus className="h-5 w-5 text-orange-500 group-hover:text-orange-400" />
            </span>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  );
}