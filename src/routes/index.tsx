import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login';
import { Cadastro } from '../pages/Cadastro';
import { Dashboard } from '../pages/Dashboard';
import { AvaliacaoNutricionalMasculina } from '../pages/AvaliacaoNutricionalMasculina';
import { AvaliacaoNutricionalFeminina } from '../pages/AvaliacaoNutricionalFeminina';
import { AvaliacaoFisica } from '../pages/AvaliacaoFisica';
import { RedefinirSenha } from '../pages/RedefinirSenha';
import { Resultados } from '../pages/Resultados';
import { ResultadoFisico } from '../pages/ResultadoFisico';
import { PrivateRoute } from '../components/PrivateRoute';
import { ProtectedFormRoute } from './ProtectedFormRoute';
import { MaintenancePage } from '../pages/MaintenancePage';
import { Layout } from '../components/Layout';

// Componente temporário para configurações
const Configuracoes = () => <div>Página de Configurações</div>;

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
      
      <Route 
        path="/" 
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/configuracoes" 
        element={
          <PrivateRoute>
            <Layout>
              <Configuracoes />
            </Layout>
          </PrivateRoute>
        } 
      />
      
      {/* Rota para a página de fotos em manutenção */}
      <Route 
        path="/fotos" 
        element={
          <PrivateRoute>
            <Layout>
              <MaintenancePage />
            </Layout>
          </PrivateRoute>
        } 
      />
      
      {/* Rotas para resultados */}
      <Route 
        path="/resultados" 
        element={
          <PrivateRoute>
            <Layout>
              <Resultados />
            </Layout>
          </PrivateRoute>
        } 
      />
      
      <Route 
        path="/resultado-fisico" 
        element={
          <PrivateRoute>
            <Layout>
              <ResultadoFisico />
            </Layout>
          </PrivateRoute>
        } 
      />
      
      {/* Rotas protegidas para formulários */}
      <Route 
        path="/avaliacao-fisica" 
        element={
          <ProtectedFormRoute component={AvaliacaoFisica} formType="fisica" />
        } 
      />
      <Route 
        path="/avaliacao-nutricional/feminino" 
        element={
          <ProtectedFormRoute component={AvaliacaoNutricionalFeminina} formType="nutricional" />
        } 
      />
      <Route 
        path="/avaliacao-nutricional/masculino" 
        element={
          <ProtectedFormRoute component={AvaliacaoNutricionalMasculina} formType="nutricional" />
        } 
      />
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
} 