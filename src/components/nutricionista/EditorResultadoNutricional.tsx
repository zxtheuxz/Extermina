import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Eye, Undo2, Copy, Check, ChefHat, Salad } from 'lucide-react';

interface AvaliacaoNutricional {
  id: string;
  avaliacao_id: string;
  user_id: string;
  tipo_avaliacao: 'masculino' | 'feminino';
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

interface EditorResultadoNutricionalProps {
  avaliacao: AvaliacaoNutricional;
  isOpen: boolean;
  onClose: () => void;
  onSave: (avaliacaoId: string, novoResultado: string) => Promise<void>;
}

export function EditorResultadoNutricional({ 
  avaliacao, 
  isOpen, 
  onClose, 
  onSave 
}: EditorResultadoNutricionalProps) {
  const [conteudo, setConteudo] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (avaliacao) {
      setConteudo(avaliacao.resultado_editado || avaliacao.resultado_original || '');
    }
  }, [avaliacao]);

  const handleSave = async () => {
    setSaving(true);
    try {
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

  const resetToOriginal = () => {
    setConteudo(avaliacao.resultado_original || '');
  };

  const insertTemplate = (template: string) => {
    const textarea = document.getElementById('editor-textarea-nutricional') as HTMLTextAreaElement;
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

  const getTipoIcon = () => {
    return avaliacao.tipo_avaliacao === 'masculino' ? 
      <ChefHat className="w-5 h-5" /> : 
      <Salad className="w-5 h-5" />;
  };

  const getTipoColor = () => {
    return avaliacao.tipo_avaliacao === 'masculino' ? 'from-blue-600 to-indigo-700' : 'from-pink-600 to-rose-700';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 bg-gradient-to-r ${getTipoColor()} rounded-xl flex items-center justify-center text-white`}>
              {getTipoIcon()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Editor de Resultado Nutricional</h2>
              <p className="text-sm text-gray-600 mt-1">
                Cliente: <span className="font-medium">{avaliacao.usuario.nome_completo}</span> - 
                <span className="ml-1 capitalize">{avaliacao.tipo_avaliacao}</span>
              </p>
            </div>
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
                    ? 'bg-amber-100 text-amber-700 border border-amber-200' 
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

          {/* Templates rápidos específicos para nutrição */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Templates:</span>
            <button
              onClick={() => insertTemplate('\n\n**ORIENTAÇÕES NUTRICIONAIS:**\n- ')}
              className="px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
            >
              Orientações
            </button>
            <button
              onClick={() => insertTemplate('\n\n**SUPLEMENTAÇÃO RECOMENDADA:**\n- ')}
              className="px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
            >
              Suplementação
            </button>
            <button
              onClick={() => insertTemplate('\n\n**RESTRIÇÕES ALIMENTARES:**\n- ')}
              className="px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
            >
              Restrições
            </button>
            <button
              onClick={() => insertTemplate('\n\n**HIDRATAÇÃO:**\n- Consumir pelo menos 35ml/kg de peso corporal por dia\n- ')}
              className="px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
            >
              Hidratação
            </button>
            <button
              onClick={() => insertTemplate('\n\n**CRONOGRAMA DE REFEIÇÕES:**\n- **Café da manhã:** \n- **Lanche:** \n- **Almoço:** \n- **Lanche:** \n- **Jantar:** \n- **Ceia:** ')}
              className="px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
            >
              Cronograma
            </button>
            <button
              onClick={() => insertTemplate('\n\n**IMPORTANTE:** ')}
              className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            >
              Importante
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {showPreview ? (
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
              id="editor-textarea-nutricional"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              className="w-full h-full p-6 resize-none focus:outline-none font-mono text-sm text-gray-800"
              placeholder="Digite ou edite o resultado da avaliação nutricional..."
              style={{ minHeight: '400px' }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {avaliacao.resultado_editado && (
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Última edição: {new Date(avaliacao.updated_at).toLocaleString('pt-BR')}
                </span>
              )}
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
                disabled={saving || conteudo === (avaliacao.resultado_editado || avaliacao.resultado_original)}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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