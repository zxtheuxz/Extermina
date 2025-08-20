import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Eye, Undo2, Copy, Check, AlertCircle, FileStack, Search, Dumbbell, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Mapeamento de IDs para nomes descritivos
const NIVEL_MAP: Record<number, string> = {
  1: 'Iniciante',
  2: 'Intermediário', 
  3: 'Avançado',
  4: 'Expert',
  5: 'Atleta',
  6: 'Profissional'
};

const FREQUENCIA_MAP: Record<number, string> = {
  1: '3x por semana',
  2: '4x por semana',
  3: '5x por semana'
};

interface AvaliacaoFisica {
  id: string;
  avaliacao_id: string;
  user_id: string;
  status: string;
  resultado_original: string;
  resultado_editado?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  usuario: {
    id: string;
    nome_completo: string;
    email: string;
    telefone?: string;
    data_nascimento?: string;
  };
}

interface EditorResultadoFisicoProps {
  avaliacao: AvaliacaoFisica;
  isOpen: boolean;
  onClose: () => void;
  onSave: (avaliacaoId: string, novoResultado: string) => Promise<void>;
}

export function EditorResultadoFisico({ 
  avaliacao, 
  isOpen, 
  onClose, 
  onSave 
}: EditorResultadoFisicoProps) {
  const [conteudo, setConteudo] = useState('');
  const [conteudoOriginal, setConteudoOriginal] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [searchTemplate, setSearchTemplate] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  useEffect(() => {
    if (avaliacao) {
      loadResultadoFisica();
      loadTemplates();
    }
  }, [avaliacao]);

  const loadResultadoFisica = async () => {
    try {
      setLoading(true);
      // Buscar o resultado_fisica da tabela perfis
      const { data, error } = await supabase
        .from('perfis')
        .select('resultado_fisica')
        .eq('user_id', avaliacao.user_id)
        .single();

      if (error) {
        console.error('Erro ao buscar resultado física:', error);
        return;
      }

      const resultado = data.resultado_fisica || '';
      setConteudo(resultado);
      setConteudoOriginal(resultado);
    } catch (error) {
      console.error('Erro ao carregar resultado:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates_treinos')
        .select('*')
        .order('nivel_id', { ascending: true })
        .order('frequencia_id', { ascending: true });

      if (error) {
        console.error('Erro ao carregar templates:', error);
        return;
      }

      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Salvar o resultado_fisica na tabela perfis com data de edição
      const { error: perfilError } = await supabase
        .from('perfis')
        .update({ 
          resultado_fisica: conteudo,
          resultado_fisica_editado_em: new Date().toISOString()
        })
        .eq('user_id', avaliacao.user_id);

      if (perfilError) {
        console.error('Erro ao salvar resultado física:', perfilError);
        alert('Erro ao salvar o resultado. Tente novamente.');
        return;
      }

      // Chamar a função original para atualizar o status se necessário
      await onSave(avaliacao.id, conteudo);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(conteudo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetToOriginal = async () => {
    // Recarregar o resultado original da tabela perfis
    await loadResultadoFisica();
  };

  const applyTemplate = (template: any, genero: 'masculino' | 'feminino') => {
    const conteudoTemplate = genero === 'masculino' 
      ? template.conteudo_masculino 
      : template.conteudo_feminino;
    
    setConteudo(conteudoTemplate);
    setShowTemplateSelector(false);
    setSearchTemplate('');
  };

  const filteredTemplates = templates.filter(template => {
    const nivel = NIVEL_MAP[template.nivel_id] || `Nível ${template.nivel_id}`;
    const freq = FREQUENCIA_MAP[template.frequencia_id] || `${template.frequencia_id}x semana`;
    const searchText = `${nivel} ${freq}`.toLowerCase();
    return searchText.includes(searchTemplate.toLowerCase());
  });

  const insertTemplate = (template: string) => {
    const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = conteudo.substring(0, start) + template + conteudo.substring(end);
      setConteudo(newContent);
      
      // Reposicionar cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + template.length, start + template.length);
      }, 0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Editor de Resultado Físico</h2>
            <p className="text-sm text-gray-600 mt-1">
              Cliente: <span className="font-medium">{avaliacao.usuario.nome_completo}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  showPreview 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Editar' : 'Visualizar'}
              </button>
              
              <div className="h-6 w-px bg-gray-300 mx-1" />
              
              <button
                onClick={resetToOriginal}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Undo2 className="w-4 h-4" />
                Restaurar Original
              </button>
              
              <button
                onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FileStack className="w-4 h-4" />
                Usar Template
              </button>
              
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {conteudo.length} caracteres
              </span>
            </div>
          </div>

          {/* Templates rápidos */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-600">Templates:</span>
            <button
              onClick={() => insertTemplate('\n\n**OBSERVAÇÕES IMPORTANTES:**\n- ')}
              className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Observações
            </button>
            <button
              onClick={() => insertTemplate('\n\n**RECOMENDAÇÕES ADICIONAIS:**\n- ')}
              className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Recomendações
            </button>
            <button
              onClick={() => insertTemplate('\n\n**ATENÇÃO:** ')}
              className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Atenção
            </button>
            <button
              onClick={() => insertTemplate('\n\n**PROGRESSÃO SUGERIDA:**\n1. ')}
              className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Progressão
            </button>
          </div>

          {/* Template Selector Modal */}
          {showTemplateSelector && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileStack className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Templates de Treino</h3>
                        <p className="text-sm text-gray-600">Escolha um template para aplicar</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowTemplateSelector(false);
                        setSearchTemplate('');
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="mt-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nível ou frequência..."
                        value={searchTemplate}
                        onChange={(e) => setSearchTemplate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Templates Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTemplates.map((template) => {
                      const nivel = NIVEL_MAP[template.nivel_id] || `Nível ${template.nivel_id}`;
                      const freq = FREQUENCIA_MAP[template.frequencia_id] || `${template.frequencia_id}x semana`;
                      
                      return (
                        <div
                          key={template.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all bg-white"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Dumbbell className="w-5 h-5 text-blue-600" />
                                {nivel}
                              </h4>
                              <p className="text-sm text-gray-600">{freq}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => applyTemplate(template, 'masculino')}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                              >
                                <Users className="w-4 h-4" />
                                Aplicar Masculino
                              </button>
                              <button
                                onClick={() => applyTemplate(template, 'feminino')}
                                className="flex-1 px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                              >
                                <Users className="w-4 h-4" />
                                Aplicar Feminino
                              </button>
                            </div>
                            
                            {/* Preview Toggle */}
                            <button
                              onClick={() => setSelectedTemplate(template.id === selectedTemplate?.id ? null : template)}
                              className="w-full px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              {template.id === selectedTemplate?.id ? 'Ocultar' : 'Ver'} Preview
                            </button>
                          </div>
                          
                          {/* Preview Content */}
                          {selectedTemplate?.id === template.id && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <div className="space-y-3">
                                <div>
                                  <h5 className="text-xs font-semibold text-gray-700 mb-1">Preview Masculino:</h5>
                                  <p className="text-xs text-gray-600 line-clamp-3">
                                    {template.conteudo_masculino.substring(0, 200)}...
                                  </p>
                                </div>
                                <div>
                                  <h5 className="text-xs font-semibold text-gray-700 mb-1">Preview Feminino:</h5>
                                  <p className="text-xs text-gray-600 line-clamp-3">
                                    {template.conteudo_feminino.substring(0, 200)}...
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {filteredTemplates.length === 0 && (
                    <div className="text-center py-12">
                      <FileStack className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhum template encontrado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
            </div>
          ) : showPreview ? (
            <div className="h-full overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none">
                <div 
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: conteudo
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/\n/g, '<br>')
                  }}
                />
              </div>
            </div>
          ) : (
            <textarea
              id="editor-textarea"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              className="w-full h-full p-6 resize-none focus:outline-none font-mono text-sm text-gray-800"
              placeholder="Digite ou edite o resultado da avaliação física..."
              style={{ minHeight: '400px' }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Editando resultado da avaliação física
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || conteudo === conteudoOriginal}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}