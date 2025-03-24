// Script para aplicar a migração da tabela avaliacao_nutricional_feminino
// Executar com: node apply_migration.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function aplicarMigracao() {
  try {
    console.log('Iniciando aplicação da migração...');
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'supabase/migrations/20250301000000_add_avaliacao_nutricional_feminino.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar o SQL usando a função rpc do Supabase
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('Erro ao aplicar migração:', error);
      return;
    }
    
    console.log('Migração aplicada com sucesso!');
    console.log('Resultado:', data);
    
  } catch (error) {
    console.error('Erro ao processar migração:', error);
  }
}

aplicarMigracao(); 