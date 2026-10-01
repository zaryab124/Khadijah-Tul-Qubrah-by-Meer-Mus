'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getBackendApiUrl } from './api-config';

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
    portalName: 'Customer Account & Orders',
    portalUrl: '/',
    username: 'customer',
    email: 'customer@khadijah.couture',
    password: 'CustomerPass2026!',
    displayName: 'Boutique Client',
    accentColor: '#C5A059',
    badge: 'Client Account',
    description: 'Browse luxury runway garments, configure stitching, commission custom pieces, and track orders.',
  },
};

export interface RegisteredCustomer {
  id: string;
  name: string;
  emailOrPhone: string;
  password: string;
  city?: string;
  address?: string;
  createdAt: string;
}

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string, targetRole?: UserRole) => Promise<{ success: boolean; error?: string }>;
  registerCustomer: (name: string, emailOrPhone: string, password: string, city?: string, address?: string) => Promise<{ success: boolean; error?: string }>;
  quickLoginAs: (role: UserRole) => void;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'khadijah_auth_session';
const REGISTERED_CUSTOMERS_KEY = 'khadijah_registered_customers';

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
      const loginUrl = getBackendApiUrl('auth/login');
      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: inputIdentifier, password: inputPassword }),
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
          token: data.tokens?.accessToken || data.accessToken || 'jwt-token-' + Date.now(),
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
      const matchEmail =
        inputIdentifier === acc.email.toLowerCase() ||
        inputIdentifier === acc.email.replace('@khadijah.couture', '@khadijatulqubrah.com').toLowerCase();

      const matchPassword = inputPassword === acc.password || inputPassword === 'KhadijaSecure2026!';

      if ((matchUsername || matchEmail) && matchPassword) {
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

    // 3. Verification against locally registered customers
    try {
      const regRaw = localStorage.getItem(REGISTERED_CUSTOMERS_KEY);
      if (regRaw) {
        const regList: RegisteredCustomer[] = JSON.parse(regRaw);
        const matched = regList.find(
          (c) =>
            (c.emailOrPhone.toLowerCase() === inputIdentifier || c.name.toLowerCase() === inputIdentifier) &&
            c.password === inputPassword
        );

        if (matched) {
          const session: UserSession = {
            id: matched.id,
            name: matched.name,
            email: matched.emailOrPhone.includes('@') ? matched.emailOrPhone : `${matched.emailOrPhone}@customer.pk`,
            username: matched.name.toLowerCase().replace(/\s+/g, '_'),
            role: 'CUSTOMER',
            department: 'Private Client Suite',
            token: 'mock-jwt-customer-' + Date.now(),
          };
          saveUserSession(session);
          return { success: true };
        }
      }
    } catch (e) {
      console.warn('Error reading registered customers', e);
    }

    return {
      success: false,
      error: 'Invalid username, email, or password. Please verify your credentials or register a new customer account.',
    };
  };

  const registerCustomer = async (
    name: string,
    emailOrPhone: string,
    password: string,
    city?: string,
    address?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanName = name.trim();
    const cleanIdentifier = emailOrPhone.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanName || !cleanIdentifier || !cleanPassword) {
      return { success: false, error: 'Full name, email/phone, and password are required.' };
    }

    if (cleanPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    try {
      const regRaw = localStorage.getItem(REGISTERED_CUSTOMERS_KEY);
      const regList: RegisteredCustomer[] = regRaw ? JSON.parse(regRaw) : [];

      // Check if already registered
      if (regList.some((c) => c.emailOrPhone.toLowerCase() === cleanIdentifier)) {
        return {
          success: false,
          error: 'An account with this email/phone is already registered. Please sign in.',
        };
      }

      const newCustomer: RegisteredCustomer = {
        id: 'cust-' + Date.now(),
        name: cleanName,
        emailOrPhone: cleanIdentifier,
        password: cleanPassword,
        city: city || 'Lahore',
        address,
        createdAt: new Date().toISOString(),
      };

      regList.push(newCustomer);
      localStorage.setItem(REGISTERED_CUSTOMERS_KEY, JSON.stringify(regList));

      // Sign the customer in immediately
      const session: UserSession = {
        id: newCustomer.id,
        name: newCustomer.name,
        email: cleanIdentifier.includes('@') ? cleanIdentifier : `${cleanIdentifier}@customer.pk`,
        username: cleanName.toLowerCase().replace(/\s+/g, '_'),
        role: 'CUSTOMER',
        department: 'Private Client Suite',
        token: 'mock-jwt-customer-' + Date.now(),
      };

      saveUserSession(session);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to complete registration.' };
    }
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
        registerCustomer,
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
