import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login';
import { Cadastro } from '../pages/Cadastro';
import { Dashboard } from '../pages/Dashboard';
import { AvaliacaoNutricionalMasculina } from '../pages/AvaliacaoNutricionalMasculina';
import { AvaliacaoNutricionalFeminina } from '../pages/AvaliacaoNutricionalFeminina';
import { AvaliacaoFisica } from '../pages/AvaliacaoFisica';
import { RedefinirSenha } from '../pages/RedefinirSenha';
import { PrivateRoute } from '../components/PrivateRoute';
import { ProtectedFormRoute } from './ProtectedFormRoute';

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
            <Dashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/configuracoes" 
        element={
          <PrivateRoute>
            <Configuracoes />
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