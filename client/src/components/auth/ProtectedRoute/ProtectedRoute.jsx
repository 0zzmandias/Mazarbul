import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

const ProtectedRoute = () => {
    const { currentUser, loading } = useAuth();

    // Enquanto verifica o token, exibe um loading simples alinhado com o tema escuro
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-neutral-400">
            Carregando...
            </div>
        );
    }

    // Se não houver usuário logado, redireciona para o login
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Se estiver autenticado, renderiza as rotas filhas
    return <Outlet />;
};

export default ProtectedRoute;
