'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'ADMIN' | 'PRODUCTION' | 'SALES';

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  roleName: string;
  roleDescription: string;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const ROLE_INFO: Record<UserRole, { name: string; description: string }> = {
  ADMIN: {
    name: 'Administrador',
    description: 'Acceso total al sistema, finanzas y configuración',
  },
  PRODUCTION: {
    name: 'Producción / Cervecero',
    description: 'Gestión de materias primas, recetas y fermentación de lotes',
  },
  SALES: {
    name: 'Ventas / Despachos',
    description: 'Gestión de producto terminado, clientes y envíos',
  },
};

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('ADMIN');

  useEffect(() => {
    const saved = localStorage.getItem('gylden_user_role') as UserRole;
    if (saved && ROLE_INFO[saved]) {
      setRoleState(saved);
    }
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('gylden_user_role', newRole);
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        roleName: ROLE_INFO[role].name,
        roleDescription: ROLE_INFO[role].description,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
