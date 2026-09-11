import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { getOrCreateDeviceId, setExplicitDeviceId } from '../services/device';
import { joinRoleRoom, joinUserRoom } from '../services/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  deviceId: string;
  isLoading: boolean;
  login: (credentials: any) => Promise<any>;
  register: (payload: any) => Promise<any>;
  registerBusiness: (payload: any) => Promise<any>;
  verifyOtpAndLogin: (payload: { email: string; otp: string; gymCode?: string; gymId?: string }) => Promise<any>;
  sendMemberLoginOtp: (email: string) => Promise<any>;
  loginWithOtp: (payload: { email: string; otp: string }) => Promise<any>;
  scanAndLogin: (payload: any) => Promise<any>;
  quickSwitchUser: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateDeviceId: (newDeviceId: string) => void;
  logoutNotice: string | null;
  clearLogoutNotice: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('ironvault_jwt_token'));
  const [deviceId, setDeviceId] = useState<string>(getOrCreateDeviceId());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);

  const clearLogoutNotice = () => setLogoutNotice(null);

  const refreshProfile = async () => {
    try {
      const storedToken = localStorage.getItem('ironvault_jwt_token');
      if (!storedToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const data = await api.getMe();
      setUser(data.user);
      joinRoleRoom(data.user.role);
      joinUserRoom(data.user.id);
    } catch (err: any) {
      console.warn('Failed to restore session:', err);
      localStorage.removeItem('ironvault_jwt_token');
      setToken(null);
      setUser(null);

      if (err?.data?.code === 'MEMBERSHIP_EXPIRED' || err?.message?.includes('membership has expired')) {
        setLogoutNotice('⚠️ Your membership has expired or repayment is overdue. You have been logged out. Please renew your subscription at the front desk.');
      } else if (err?.data?.code === 'ACCOUNT_DEACTIVATED' || err?.message?.includes('deactivated')) {
        setLogoutNotice('⛔ Your account has been removed from this gym\'s database. Please contact gym administration.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();

    const handleAuthRevoked = (event: Event) => {
      const customEvt = event as CustomEvent;
      const code = customEvt.detail?.code;
      const msg = customEvt.detail?.message;

      localStorage.removeItem('ironvault_jwt_token');
      setToken(null);
      setUser(null);

      if (code === 'MEMBERSHIP_EXPIRED' || msg?.includes('membership has expired')) {
        setLogoutNotice('⚠️ Your membership has expired or repayment is overdue. You have been logged out. Please renew your subscription at the front desk.');
      } else if (code === 'ACCOUNT_DEACTIVATED' || msg?.includes('deactivated')) {
        setLogoutNotice('⛔ Your account has been removed from this gym\'s database. Please contact gym administration.');
      } else if (msg) {
        setLogoutNotice(`Session ended: ${msg}`);
      }
    };

    window.addEventListener('ironvault:auth_revoked', handleAuthRevoked);
    return () => {
      window.removeEventListener('ironvault:auth_revoked', handleAuthRevoked);
    };
  }, []);

  // Periodic session verification for active members to auto-logout on expiration
  useEffect(() => {
    if (!user || user.role !== 'MEMBER') return;

    const interval = setInterval(async () => {
      try {
        await api.getMe();
      } catch (err: any) {
        // Handled automatically via ironvault:auth_revoked or refreshProfile
      }
    }, 60000); // Check once a minute

    return () => clearInterval(interval);
  }, [user]);

  const login = async (credentials: any) => {
    const data = await api.login({
      ...credentials,
      device_id: deviceId
    });

    localStorage.setItem('ironvault_jwt_token', data.token);
    setToken(data.token);
    setUser(data.user);

    joinRoleRoom(data.user.role);
    joinUserRoom(data.user.id);

    return data;
  };

  const register = async (payload: any) => {
    const data = await api.register({
      ...payload,
      device_id: deviceId
    });

    if (data.token && data.user) {
      localStorage.setItem('ironvault_jwt_token', data.token);
      setToken(data.token);
      setUser(data.user);
      joinRoleRoom(data.user.role);
      joinUserRoom(data.user.id);
    }

    return data;
  };

  const registerBusiness = async (payload: any) => {
    const data = await api.registerBusiness({
      ...payload,
      device_id: deviceId
    });

    if (data.token && data.user) {
      localStorage.setItem('ironvault_jwt_token', data.token);
      setToken(data.token);
      setUser(data.user);
      joinRoleRoom(data.user.role);
      joinUserRoom(data.user.id);
    }

    return data;
  };

  const verifyOtpAndLogin = async (payload: { email: string; otp: string; gymCode?: string; gymId?: string }) => {
    const data = await api.verifySignupOtp({
      ...payload,
      device_id: deviceId
    });

    if (data.token && data.user) {
      localStorage.setItem('ironvault_jwt_token', data.token);
      setToken(data.token);
      setUser(data.user);
      joinRoleRoom(data.user.role);
      joinUserRoom(data.user.id);
    }

    return data;
  };

  const sendMemberLoginOtp = async (email: string) => {
    return await api.sendMemberLoginOtp(email);
  };

  const loginWithOtp = async (payload: { email: string; otp: string }) => {
    const data = await api.verifyMemberLoginOtp({
      ...payload,
      device_id: deviceId
    });

    if (data.token && data.user) {
      localStorage.setItem('ironvault_jwt_token', data.token);
      setToken(data.token);
      setUser(data.user);
      joinRoleRoom(data.user.role);
      joinUserRoom(data.user.id);
    }

    return data;
  };

  const scanAndLogin = async (payload: any) => {
    const data = await api.scanAndLogin({
      ...payload,
      device_id: deviceId
    });

    if (data.token && data.user) {
      localStorage.setItem('ironvault_jwt_token', data.token);
      setToken(data.token);
      setUser(data.user);
      joinRoleRoom(data.user.role);
      joinUserRoom(data.user.id);
    }

    return data;
  };

  const quickSwitchUser = async (email: string, password = 'Password@12345') => {
    try {
      setIsLoading(true);
      let pass = password;
      if (email.includes('admin')) pass = 'Admin@12345';
      if (email.includes('manager')) pass = 'Manager@12345';
      if (email.includes('member')) pass = 'Member@12345';

      await login({ email, password: pass });
    } catch (err) {
      console.error('Quick switch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ironvault_jwt_token');
    setToken(null);
    setUser(null);
  };

  const updateDeviceId = (newDeviceId: string) => {
    setExplicitDeviceId(newDeviceId);
    setDeviceId(newDeviceId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        deviceId,
        isLoading,
        login,
        register,
        registerBusiness,
        verifyOtpAndLogin,
        sendMemberLoginOtp,
        loginWithOtp,
        scanAndLogin,
        quickSwitchUser,
        logout,
        refreshProfile,
        updateDeviceId,
        logoutNotice,
        clearLogoutNotice
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

