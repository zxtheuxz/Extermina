import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AvaliacaoFisica } from './pages/AvaliacaoFisica';
import { AvaliacaoNutricionalFeminina } from './pages/AvaliacaoNutricionalFeminina';
import { AvaliacaoNutricionalMasculina } from './pages/AvaliacaoNutricionalMasculina';
import { Resultados } from './pages/Resultados';
import { Cadastro } from './pages/Cadastro';
import { RedefinirSenha } from './pages/RedefinirSenha';
import { Configuracoes } from './pages/Configuracoes';
import { PrivateRoute } from './components/PrivateRoute';
import { ProtectedFormRoute } from './routes/ProtectedFormRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/global.css';

// Verificar se os componentes estão sendo importados corretamente
console.log('AvaliacaoFisica:', AvaliacaoFisica);
console.log('ProtectedFormRoute:', ProtectedFormRoute);

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app-container">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/avaliacao-fisica" element={<PrivateRoute><AvaliacaoFisica /></PrivateRoute>} />
            <Route path="/avaliacao-nutricional/feminino" element={<ProtectedFormRoute component={AvaliacaoNutricionalFeminina} formType="nutricional" />} />
            <Route path="/avaliacao-nutricional/masculino" element={<ProtectedFormRoute component={AvaliacaoNutricionalMasculina} formType="nutricional" />} />
            <Route path="/resultados" element={<PrivateRoute><Resultados /></PrivateRoute>} />
            <Route path="/configuracoes" element={<PrivateRoute><Configuracoes /></PrivateRoute>} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;