import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../store/AuthContext';

interface Props {
    children: ReactNode;
    roles?: string[];
    membershipRoles?: string[];
}

export default function ProtectedRoute({ children, roles, membershipRoles }: Props) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (roles && !roles.includes(user.globalRole)) {
        // Redirect based on role
        const roleRoutes: Record<string, string> = {
            ADMIN: '/admin',
            AGENCY_STAFF: '/staff',
            COMPANY_USER: '/client',
        };
        return <Navigate to={roleRoutes[user.globalRole] || '/'} replace />;
    }

    if (membershipRoles && user.membershipRole && !membershipRoles.includes(user.membershipRole)) {
        return <Navigate to="/client" replace />;
    }

    return <>{children}</>;
}
