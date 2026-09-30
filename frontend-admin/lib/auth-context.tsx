'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DESIGNER' | 'PRODUCTION' | 'AGENT' | 'CUSTOMER';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  department: string;
  token: string;
  avatar?: string;
}

export interface DemoAccount {
  role: UserRole;
  department: string;
  portalName: string;
  portalUrl: string;
  username: string;
  email: string;
  password: string;
  displayName: string;
  accentColor: string;
  badge: string;
  description: string;
}

export const DEMO_ACCOUNTS: Record<string, DemoAccount> = {
  ADMIN: {
    role: 'ADMIN',
    department: 'Executive Suite',
    portalName: 'Owner & Admin Control Center',
    portalUrl: '/admin',
    username: 'admin',
    email: 'admin@khadijah.couture',
    password: 'AdminPassword2026!',
    displayName: 'Meer & Mus (Owner)',
    accentColor: '#C5A059',
    badge: '👑 Executive Clearance',
    description: 'Full oversight: Financial KPIs, garment launch, campaign ads, RBAC, and audit logs.',
  },
  DESIGNER: {
    role: 'DESIGNER',
    department: 'Haute Couture Studio',
    portalName: 'Designer Atelier & Quotation Studio',
    portalUrl: '/designer',
    username: 'designer',
    email: 'designer@khadijah.couture',
    password: 'DesignerPass2026!',
    displayName: 'Master Couturier Zainab',
    accentColor: '#E0A96D',
    badge: '✂️ Haute Designer',
    description: 'Manage custom design requests, inspect swatches, and formulate multi-version quotations (V1, V2).',
  },
  PRODUCTION: {
    role: 'PRODUCTION',
    department: 'Atelier Workshop Floor',
    portalName: 'Production Floor & Quality Check (QC)',
    portalUrl: '/production',
    username: 'production',
    email: 'production@khadijah.couture',
    password: 'ProductionPass2026!',
    displayName: 'Ustad Tariq (Master Craftsman)',
    accentColor: '#10B981',
    badge: '🧵 Production Master',
    description: 'Track cutting, zardozi embroidery, bespoke tailoring, and issue Quality Check approvals.',
  },
  AGENT: {
    role: 'AGENT',
    department: 'VIP Concierge & CRM',
    portalName: 'Fashion CRM & Client Concierge',
    portalUrl: '/agent',
    username: 'agent',
    email: 'agent@khadijah.couture',
    password: 'AgentPass2026!',
    displayName: 'Amina Al-Mansoor (VIP Concierge)',
    accentColor: '#38BDF8',
    badge: '🎧 Client Concierge',
    description: 'Omnichannel lead pipeline, WhatsApp follow-ups, client consultations, and sales conversion.',
  },
  CUSTOMER: {
    role: 'CUSTOMER',
    department: 'Private Client Suite',
    portalName: 'Customer Atelier & Orders',
    portalUrl: '/',
    username: 'customer',
    email: 'customer@khadijah.couture',
    password: 'CustomerPass2026!',
    displayName: 'Princess Sara Al-Qasimi',
    accentColor: '#C5A059',
    badge: '💎 VIP Patron',
    description: 'Browse luxury runway garments, watch campaign video deals, commission custom pieces, and track orders.',
  },
};

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string, targetRole?: UserRole) => Promise<{ success: boolean; error?: string }>;
  quickLoginAs: (role: UserRole) => void;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'khadijah_auth_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load persisted session on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse auth session', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveUserSession = (session: UserSession | null) => {
    setUser(session);
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      localStorage.setItem('token', session.token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('token');
    }
  };

  const login = async (
    usernameOrEmail: string,
    password: string,
    targetRole?: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    const inputIdentifier = usernameOrEmail.trim().toLowerCase();
    const inputPassword = password.trim();

    // 1. First attempt backend API login if available
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inputIdentifier, password: inputPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        const session: UserSession = {
          id: data.user?.id || 'usr-' + Date.now(),
          name: data.user?.name || data.user?.firstName + ' ' + (data.user?.lastName || ''),
          email: data.user?.email || inputIdentifier,
          username: inputIdentifier.split('@')[0],
          role: (data.user?.role || targetRole || 'CUSTOMER') as UserRole,
          department: DEMO_ACCOUNTS[data.user?.role]?.department || 'General Staff',
          token: data.accessToken || 'jwt-token-' + Date.now(),
        };

        if (targetRole && session.role !== targetRole && session.role !== 'SUPER_ADMIN') {
          return {
            success: false,
            error: `Your credentials are valid for role [${session.role}], but this portal requires [${targetRole}] access.`,
          };
        }

        saveUserSession(session);
        return { success: true };
      }
    } catch {
      // Backend may be offline or DB not seeded, proceed to local verify
    }

    // 2. Local verification against designated credentials
    for (const key of Object.keys(DEMO_ACCOUNTS)) {
      const acc = DEMO_ACCOUNTS[key];
      const matchUsername = inputIdentifier === acc.username.toLowerCase();
      const matchEmail = inputIdentifier === acc.email.toLowerCase();

      if ((matchUsername || matchEmail) && inputPassword === acc.password) {
        if (targetRole && acc.role !== targetRole && acc.role !== 'SUPER_ADMIN') {
          return {
            success: false,
            error: `These credentials belong to [${acc.badge}], but this portal requires [${DEMO_ACCOUNTS[targetRole]?.badge || targetRole}] clearance.`,
          };
        }

        const session: UserSession = {
          id: 'usr-' + acc.role.toLowerCase() + '-001',
          name: acc.displayName,
          email: acc.email,
          username: acc.username,
          role: acc.role,
          department: acc.department,
          token: 'mock-jwt-' + acc.role.toLowerCase() + '-token',
        };

        saveUserSession(session);
        return { success: true };
      }
    }

    return {
      success: false,
      error: 'Invalid username or password. Please verify your credentials.',
    };
  };

  const quickLoginAs = (role: UserRole) => {
    const acc = DEMO_ACCOUNTS[role];
    if (!acc) return;
    const session: UserSession = {
      id: 'usr-' + acc.role.toLowerCase() + '-001',
      name: acc.displayName,
      email: acc.email,
      username: acc.username,
      role: acc.role,
      department: acc.department,
      token: 'mock-jwt-' + acc.role.toLowerCase() + '-token',
    };
    saveUserSession(session);
  };

  const logout = () => {
    saveUserSession(null);
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        quickLoginAs,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
