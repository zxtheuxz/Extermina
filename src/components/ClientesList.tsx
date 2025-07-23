import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Search, Filter, Eye, Edit, MoreVertical, UserCheck, UserX, CheckCircle, XCircle, Clock, Mail, Phone, AlertTriangle, Activity, Utensils, FileText } from 'lucide-react';
import { ClienteDetailModal } from './ClienteDetailModal';
import { ClienteActionsMenu } from './ClienteActionsMenu';

interface Cliente {
  id: string;
  user_id: string;
  nome_completo: string;
  telefone: string;
  sexo: string;
  role: string;
  liberado: string;
  laudo_aprovado: string;
  created_at: string;
  email?: string;
}

interface ClientesListProps {
  onClienteSelect?: (cliente: Cliente) => void;
}

export function ClientesList({ onClienteSelect }: ClientesListProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'TODOS' | 'cliente' | 'preparador' | 'admin'>('TODOS');
  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'sim' | 'nao'>('TODOS');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadClientes();
  }, [filterRole, filterStatus]);

  const loadClientes = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('perfis')
        .select(`
          id,
          user_id,
          nome_completo,
          telefone,
          sexo,
          role,
          liberado,
          laudo_aprovado,
          created_at
        `);

      if (filterRole !== 'TODOS') {
        query = query.eq('role', filterRole);
      }

      if (filterStatus !== 'TODOS') {
        query = query.eq('liberado', filterStatus);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar clientes:', error);
        return;
      }

      // Buscar emails dos usuários usando RPC (com tratamento de erro melhorado)
      if (data) {
        const clientesComEmail = await Promise.all(
          data.map(async (cliente) => {
            try {
              const { data: userData, error } = await supabase.rpc('get_user_info', {
                user_uuid: cliente.user_id
              });
              
              if (error) {
                console.warn('Erro RPC get_user_info para', cliente.nome_completo, ':', error);
                return {
                  ...cliente,
                  email: 'N/A'
                };
              }
              
              return {
                ...cliente,
                email: userData?.[0]?.email || 'N/A'
              };
            } catch (error) {
              console.warn('Erro ao buscar email para', cliente.nome_completo, ':', error);
              return {
                ...cliente,
                email: 'N/A'
              };
            }
          })
        );

        setClientes(clientesComEmail);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateClienteStatus = async (clienteId: string, novoStatus: 'sim' | 'nao') => {
    setUpdatingStatus(clienteId);
    setMessage(null);
    
    try {
      const { error } = await supabase
        .from('perfis')
        .update({ liberado: novoStatus })
        .eq('id', clienteId);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        setMessage({ 
          type: 'error', 
          text: `Erro ao ${novoStatus === 'sim' ? 'liberar' : 'bloquear'} acesso: ${error.message}` 
        });
        return;
      }

      setMessage({ 
        type: 'success', 
        text: `Usuário ${novoStatus === 'sim' ? 'liberado' : 'bloqueado'} com sucesso!` 
      });
      
      await loadClientes();
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      setMessage({ 
        type: 'error', 
        text: 'Erro inesperado ao atualizar status do usuário' 
      });
    } finally {
      setUpdatingStatus(null);
      // Limpar mensagem após 3 segundos
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const updateClienteRole = async (clienteId: string, novaRole: 'cliente' | 'preparador' | 'admin') => {
    try {
      const { error } = await supabase
        .from('perfis')
        .update({ role: novaRole })
        .eq('id', clienteId);

      if (error) {
        console.error('Erro ao atualizar role:', error);
        return;
      }

      await loadClientes();
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
    }
  };

  const handleViewDetails = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setModalOpen(true);
    if (onClienteSelect) {
      onClienteSelect(cliente);
    }
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone?.includes(searchTerm) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'preparador':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cliente':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'sim' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getLaudoColor = (laudo: string) => {
    switch (laudo) {
      case 'aprovado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejeitado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Gerenciamento de Usuários
            </h3>
            <p className="text-sm text-slate-600">
              {filteredClientes.length} usuários encontrados
            </p>
          </div>
          
          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, telefone ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as typeof filterRole)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="TODOS">Todas as Roles</option>
              <option value="cliente">Cliente</option>
              <option value="preparador">Preparador</option>
              <option value="admin">Admin</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="sim">Liberado</option>
              <option value="nao">Bloqueado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mensagem de Feedback */}
      {message && (
        <div className={`mx-6 mt-4 p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Lista de Clientes */}
      <div className="p-6">
        {filteredClientes.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h4>
            <p className="text-gray-600">
              Tente ajustar os filtros ou termos de busca.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[900px] lg:min-w-0">
              <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px] lg:w-auto">
                    Usuário
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[180px] lg:w-auto">
                    Contato
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[110px] lg:w-auto">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[110px] lg:w-auto">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px] lg:w-auto">
                    Laudo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px] lg:w-auto">
                    Cadastro
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px] lg:w-auto">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            cliente.role === 'admin' ? 'bg-purple-100' :
                            cliente.role === 'preparador' ? 'bg-blue-100' : 'bg-green-100'
                          }`}>
                            <Users className={`w-5 h-5 ${
                              cliente.role === 'admin' ? 'text-purple-600' :
                              cliente.role === 'preparador' ? 'text-blue-600' : 'text-green-600'
                            }`} />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {cliente.nome_completo}
                            {cliente.liberado === 'nao' && (
                              <AlertTriangle className="w-4 h-4 text-red-500" title="Conta bloqueada" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {cliente.sexo || 'Não informado'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {cliente.telefone || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {cliente.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <select
                        value={cliente.role}
                        onChange={(e) => updateClienteRole(cliente.id, e.target.value as 'cliente' | 'preparador' | 'admin')}
                        className={`text-xs font-medium rounded-md border px-2 py-1 ${getRoleColor(cliente.role)}`}
                      >
                        <option value="cliente">Cliente</option>
                        <option value="preparador">Preparador</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => updateClienteStatus(cliente.id, cliente.liberado === 'sim' ? 'nao' : 'sim')}
                        disabled={updatingStatus === cliente.id}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(cliente.liberado)} disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {updatingStatus === cliente.id ? (
                          <>
                            <div className="w-3 h-3 animate-spin rounded-full border border-current border-t-transparent"></div>
                            Atualizando...
                          </>
                        ) : cliente.liberado === 'sim' ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Liberado
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Bloqueado
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getLaudoColor(cliente.laudo_aprovado || 'N/A')}`}>
                        {cliente.laudo_aprovado === 'aprovado' && <CheckCircle className="w-3 h-3" />}
                        {cliente.laudo_aprovado === 'pendente' && <Clock className="w-3 h-3" />}
                        {cliente.laudo_aprovado === 'rejeitado' && <XCircle className="w-3 h-3" />}
                        {cliente.laudo_aprovado || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(cliente.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {/* Status Indicators */}
                        <div className="flex items-center gap-1 mr-2">
                          {/* Indicador de Formulários - você pode adicionar lógica para verificar se tem avaliações */}
                          <div className="flex items-center gap-1" title="Status dos formulários">
                            <Activity className="w-3 h-3 text-gray-400" />
                            <Utensils className="w-3 h-3 text-gray-400" />
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleViewDetails(cliente)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Ver detalhes completos"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <ClienteActionsMenu
                          cliente={cliente}
                          onViewDetails={handleViewDetails}
                          onToggleStatus={updateClienteStatus}
                          onSuccess={loadClientes}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      <ClienteDetailModal
        cliente={selectedCliente}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedCliente(null);
        }}
      />
    </div>
  );
}