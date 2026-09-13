import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  Download,
  Search,
  Copy,
  Check,
  Filter,
  ShieldAlert,
  KeyRound,
  Mail,
  Phone,
  Lock,
  X,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  CreditCard,
  ChevronDown,
  FileSpreadsheet,
  ExternalLink,
  User,
  Activity,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';

/**
 * Escapes a cell value for standard RFC 4180 CSV
 */
function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Initiates browser download of a generated CSV string with UTF-8 BOM
 */
function triggerCsvDownload(csvContent: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const SuperAdminDashboard: React.FC = () => {
  const [gyms, setGyms] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isErrorNotice, setIsErrorNotice] = useState<boolean>(false);

  // Active View Tab: 'GYMS' | 'MEMBERS'
  const [activeTab, setActiveTab] = useState<'GYMS' | 'MEMBERS'>('GYMS');

  // Search & Filter States
  const [gymSearch, setGymSearch] = useState<string>('');
  const [memberSearch, setMemberSearch] = useState<string>('');
  const [selectedGymFilter, setSelectedGymFilter] = useState<string>('ALL');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fraud anomaly state toggles
  const [anomaly1Locked, setAnomaly1Locked] = useState<boolean>(false);
  const [anomaly2Locked, setAnomaly2Locked] = useState<boolean>(false);
  const [anomaly2Whitelisted, setAnomaly2Whitelisted] = useState<boolean>(false);

  // Create Gym Workspace Modal State
  const [isCreateGymModalOpen, setIsCreateGymModalOpen] = useState<boolean>(false);
  const [gymFormName, setGymFormName] = useState<string>('');
  const [gymFormCode, setGymFormCode] = useState<string>('100003');
  const [gymFormOwnerName, setGymFormOwnerName] = useState<string>('');
  const [gymFormEmail, setGymFormEmail] = useState<string>('');
  const [gymFormPhone, setGymFormPhone] = useState<string>('');
  const [gymFormPassword, setGymFormPassword] = useState<string>('GymPass@2026');
  const [gymFormAddress, setGymFormAddress] = useState<string>('500 Grand Avenue, Suite 100');
  const [gymFormCity, setGymFormCity] = useState<string>('New York');
  const [gymFormState, setGymFormState] = useState<string>('NY');
  const [isSubmittingGym, setIsSubmittingGym] = useState<boolean>(false);
  const [gymCreationError, setGymCreationError] = useState<string | null>(null);
  const [createdGymResult, setCreatedGymResult] = useState<any>(null);
  const [copiedGymCreds, setCopiedGymCreds] = useState<boolean>(false);

  const generateRandomGymCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGymFormCode(code);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGymFormPassword(pass);
  };

  const handleOpenCreateGymModal = () => {
    setIsCreateGymModalOpen(true);
    setCreatedGymResult(null);
    setGymCreationError(null);
    generateRandomGymCode();
  };

  const showToast = (message: string, isError = false) => {
    setActionNotice(message);
    setIsErrorNotice(isError);
    setTimeout(() => {
      setActionNotice(null);
    }, 4000);
  };

  const handleCreateGymSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymFormName.trim() || !gymFormOwnerName.trim() || !gymFormEmail.trim() || !gymFormPassword.trim()) {
      setGymCreationError('Please provide Gym Name, Owner Name, Gmail ID, and Initial Password.');
      return;
    }
    if (gymFormPassword.length < 6) {
      setGymCreationError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmittingGym(true);
    setGymCreationError(null);
    try {
      const res = await api.registerBusiness({
        gymName: gymFormName.trim(),
        ownerName: gymFormOwnerName.trim(),
        email: gymFormEmail.trim(),
        password: gymFormPassword,
        phone: gymFormPhone.trim() || undefined,
        address: gymFormAddress.trim() || 'Main Gym Facility',
        city: gymFormCity.trim() || 'City',
        state: gymFormState.trim() || 'State',
        inviteCode: gymFormCode.trim() || undefined
      });

      setCreatedGymResult({
        gym: res.gym,
        user: res.user,
        password: gymFormPassword
      });
      showToast(`Gym workspace '${res.gym.name}' provisioned with code: ${res.gym.inviteCode}`);
      await loadData();
    } catch (err: any) {
      setGymCreationError(err.message || 'Failed to create gym workspace. Verify unique code or email.');
    } finally {
      setIsSubmittingGym(false);
    }
  };

  const handleCopyGymCredentials = () => {
    if (!createdGymResult) return;
    const credText = `GYM WORKSPACE CREDENTIALS
Gym Name: ${createdGymResult.gym.name}
Unique 6-Digit Access Code: ${createdGymResult.gym.inviteCode}
Owner Login Gmail: ${createdGymResult.user.email}
Initial Password: ${createdGymResult.password}
Portal URL: ${window.location.origin}`;
    navigator.clipboard.writeText(credText);
    setCopiedGymCreds(true);
    setTimeout(() => setCopiedGymCreds(false), 3000);
  };

  const handleCopyText = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`${label} copied to clipboard!`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [gymsRes, membersRes] = await Promise.all([
        api.getAllGyms().catch(() => ({ gyms: [] })),
        api.getMembers().catch(() => ({ members: [] }))
      ]);

      if (gymsRes?.gyms) {
        setGyms(gymsRes.gyms);
      }
      if (membersRes?.members) {
        setMembers(membersRes.members);
      }
    } catch (e) {
      console.error('Failed to load Super Admin dashboard:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently remove "${name}" from the platform?\n\nTheir account, sessions, and records will be deleted immediately.`)) {
      return;
    }
    try {
      await api.deleteMember(id);
      showToast(`Member "${name}" was permanently removed.`);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove member', true);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Gyms
  const filteredGyms = useMemo(() => {
    const q = gymSearch.toLowerCase().trim();
    if (!q) return gyms;
    return gyms.filter((g) => {
      const name = (g.name || '').toLowerCase();
      const code = (g.inviteCode || '').toLowerCase();
      const city = (g.city || '').toLowerCase();
      const state = (g.state || '').toLowerCase();
      const ownerName = (g.ownerName || g.owner?.fullName || '').toLowerCase();
      const ownerEmail = (g.ownerEmail || g.owner?.email || g.ownerContactEmail || '').toLowerCase();
      const ownerPhone = (g.ownerPhone || g.owner?.phone || g.ownerContactPhone || '').toLowerCase();
      return (
        name.includes(q) ||
        code.includes(q) ||
        city.includes(q) ||
        state.includes(q) ||
        ownerName.includes(q) ||
        ownerEmail.includes(q) ||
        ownerPhone.includes(q)
      );
    });
  }, [gyms, gymSearch]);

  // Filtered Members
  const filteredMembers = useMemo(() => {
    const q = memberSearch.toLowerCase().trim();
    return members.filter((m) => {
      const matchesSearch =
        !q ||
        (m.fullName || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.phone || '').toLowerCase().includes(q) ||
        (m.gymName || '').toLowerCase().includes(q) ||
        (m.gymInviteCode || '').toLowerCase().includes(q);

      const matchesGym =
        selectedGymFilter === 'ALL' ||
        m.gymId === selectedGymFilter ||
        m.gymInviteCode === selectedGymFilter;

      const matchesStatus =
        memberStatusFilter === 'ALL' ||
        (memberStatusFilter === 'ACTIVE' && m.status === 'ACTIVE') ||
        (memberStatusFilter === 'INACTIVE' && m.status !== 'ACTIVE');

      return matchesSearch && matchesGym && matchesStatus;
    });
  }, [members, memberSearch, selectedGymFilter, memberStatusFilter]);

  // Total metrics
  const totalActivePasses = useMemo(() => {
    return members.filter((m) => m.status === 'ACTIVE').length;
  }, [members]);

  const totalMonthlyValue = useMemo(() => {
    return members.reduce((sum, m) => sum + (Number(m.price) || 0), 0);
  }, [members]);

  // -------------------------------------------------------------
  // CSV EXPORT LOGIC
  // -------------------------------------------------------------
  const handleExportGymsCsv = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const headers = [
      'Gym ID',
      'Gym Business Name',
      '6-Digit Access Code',
      'Owner Full Name',
      'Owner Login Gmail',
      'Owner Phone',
      'Physical Address',
      'City',
      'State',
      'Registered Members Count',
      'Active Subscriptions Count',
      'Total Checkins Scans',
      'Status',
      'Created Date'
    ];

    const rows = filteredGyms.map((g) => [
      g.id,
      g.name,
      g.inviteCode,
      g.ownerName || g.owner?.fullName || 'N/A',
      g.ownerEmail || g.owner?.email || g.ownerContactEmail || 'N/A',
      g.ownerPhone || g.owner?.phone || g.ownerContactPhone || 'N/A',
      g.address || 'N/A',
      g.city || 'N/A',
      g.state || 'N/A',
      g.counts?.totalUsers ?? g._count?.users ?? 0,
      g.counts?.subscriptions ?? g._count?.subscriptions ?? 0,
      g.counts?.attendanceTotal ?? g._count?.attendanceEntries ?? 0,
      g.isActive ? 'Active' : 'Inactive',
      g.createdAt ? new Date(g.createdAt).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((row) => row.map(escapeCsvCell).join(','))
    ].join('\r\n');

    triggerCsvDownload(csvContent, `gym_owners_export_${dateStr}.csv`);
    showToast(`Exported ${filteredGyms.length} gym workspaces to CSV.`);
  };

  const handleExportMembersCsv = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const headers = [
      'Member ID',
      'Member Full Name',
      'Email Address',
      'Phone Number',
      'Role',
      'Gym Business Name',
      'Gym 6-Digit Access Code',
      'Membership Plan Name',
      'Plan Price ($)',
      'Membership Status',
      'Start Date',
      'Expiration Date',
      'Registered Date'
    ];

    const rows = filteredMembers.map((m) => [
      m.id,
      m.fullName,
      m.email,
      m.phone || 'N/A',
      m.role || 'MEMBER',
      m.gymName || 'Unassigned',
      m.gymInviteCode || 'N/A',
      m.planName || m.latestSubscription?.planName || 'No Active Plan',
      m.price || m.latestSubscription?.price || 0,
      m.status || (m.isAccessGranted ? 'ACTIVE' : 'INACTIVE'),
      m.startDate ? new Date(m.startDate).toLocaleDateString() : 'N/A',
      m.endDate ? new Date(m.endDate).toLocaleDateString() : 'N/A',
      m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((row) => row.map(escapeCsvCell).join(','))
    ].join('\r\n');

    triggerCsvDownload(csvContent, `platform_members_export_${dateStr}.csv`);
    showToast(`Exported ${filteredMembers.length} platform members to CSV.`);
  };

  const handleExportMasterArchive = () => {
    handleExportGymsCsv();
    setTimeout(() => {
      handleExportMembersCsv();
    }, 600);
  };

  return (
    <div className="w-full min-h-screen bg-surface text-on-surface pb-24 pt-safe px-3 sm:px-6 space-y-6">
      {/* Toast Notification Banner */}
      {actionNotice && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all transform animate-fade-in border ${
          isErrorNotice
            ? 'bg-error-container text-on-error-container border-error/30'
            : 'bg-surface-container-highest text-on-surface border-surface-container-high'
        }`}>
          <span className={`material-symbols-outlined text-[20px] ${isErrorNotice ? 'text-error' : 'text-primary'}`}>
            {isErrorNotice ? 'security' : 'check_circle'}
          </span>
          <div className="flex flex-col">
            <span className="font-headline-sm text-body-sm font-bold text-on-surface">
              {isErrorNotice ? 'Security Intercept' : 'Operation Executed'}
            </span>
            <span className="font-label-mono text-label-mono text-on-surface-variant">
              {actionNotice}
            </span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="ml-3 text-on-surface-variant hover:text-on-surface transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Ambient Glow Canvas Elements */}
      <div className="relative w-full overflow-hidden pointer-events-none -mb-6">
        <div className="absolute -top-12 left-1/4 w-96 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-24 right-10 w-80 h-40 bg-tertiary/5 rounded-full blur-3xl" />
      </div>

      {/* Operational Header & Live Telemetry Strip */}
      <div className="flex flex-col gap-3 w-full relative z-10">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-surface-container-lowest p-4 sm:p-5 rounded-xl shadow-xl border border-surface-container-high/30">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1 rounded">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="font-badge-label text-badge-label text-primary tracking-widest uppercase">
                DEV OPERATIONS • MULTI-TENANT CONSOLE
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-label-mono text-outline">CLUSTER:</span>
              <span className="font-telemetry-tabular text-tertiary font-mono">us-east-metal.ironvault.internal</span>
              <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-mono text-[10px] text-secondary">
                HTTP/3 QUIC
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                loadData();
                showToast('Edge Topology Synced. Live streams refreshed.');
              }}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm text-xs transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[16px] text-tertiary ${isLoading ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>Force Cloud Sync</span>
            </button>

            <button
              type="button"
              onClick={handleExportMasterArchive}
              className="flex items-center gap-1.5 px-3 py-2 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm text-xs transition-all shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">download</span>
              <span>Export Master CSV</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateGymModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-primary text-on-primary font-headline-sm text-xs hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(78,222,163,0.3)] active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span className="font-bold tracking-tight">Provision Gym Workspace</span>
            </button>
          </div>
        </div>

        {/* Telemetry Metric Pill Badges Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-surface-container-low shadow-sm border border-surface-container-high/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-surface-container-high flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">apartment</span>
              </div>
              <div>
                <span className="font-label-mono text-[10px] text-outline uppercase block tracking-wider">Active Tenants</span>
                <span className="font-telemetry-counter text-base sm:text-lg font-mono font-bold text-on-surface">
                  {gyms.length} <span className="font-label-mono text-xs text-secondary font-normal">/ {gyms.length || 1}</span>
                </span>
              </div>
            </div>
            <span className="font-badge-label text-[10px] text-secondary bg-surface-container px-1.5 py-0.5 rounded font-mono">
              ONLINE
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg bg-surface-container-low shadow-sm border border-surface-container-high/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-surface-container-high flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[20px]">bolt</span>
              </div>
              <div>
                <span className="font-label-mono text-[10px] text-outline uppercase block tracking-wider">Platform Athletes</span>
                <span className="font-telemetry-counter text-base sm:text-lg font-mono font-bold text-on-surface">
                  {members.length.toLocaleString()}
                </span>
              </div>
            </div>
            <span className="font-badge-label text-[10px] text-tertiary bg-surface-container px-1.5 py-0.5 rounded font-mono">
              +{totalActivePasses} ACTIVE
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg bg-surface-container-low shadow-sm border border-surface-container-high/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-surface-container-high flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
              </div>
              <div>
                <span className="font-label-mono text-[10px] text-outline uppercase block tracking-wider">Gateway Uptime</span>
                <span className="font-telemetry-counter text-base sm:text-lg font-mono font-bold text-primary">
                  99.98%
                </span>
              </div>
            </div>
            <span className="font-badge-label text-[10px] text-primary bg-surface-container px-1.5 py-0.5 rounded font-mono">
              SLO MET
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg bg-surface-container-low shadow-sm border border-surface-container-high/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-surface-container-high flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[20px]">speed</span>
              </div>
              <div>
                <span className="font-label-mono text-[10px] text-outline uppercase block tracking-wider">Global P99 Latency</span>
                <span className="font-telemetry-counter text-base sm:text-lg font-mono font-bold text-on-surface">
                  42<span className="font-label-mono text-xs text-outline font-normal">ms</span>
                </span>
              </div>
            </div>
            <span className="font-badge-label text-[10px] text-secondary bg-surface-container px-1.5 py-0.5 rounded font-mono">
              -4ms JTR
            </span>
          </div>
        </div>
      </div>

      {/* System Health & Edge Topology Sub-Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
        {/* Webhook Gateway Latency & Throughput Meter */}
        <div className="lg:col-span-8 flex flex-col justify-between p-4 sm:p-5 rounded-xl bg-surface-container-low shadow-lg border border-surface-container-high/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[22px]">network_check</span>
              <div>
                <h2 className="font-headline-sm text-sm sm:text-base text-on-surface tracking-tight font-bold">
                  Turnstile Ingress & Webhook Latency Spectrum
                </h2>
                <span className="font-label-mono text-[11px] text-on-surface-variant">
                  Continuous 60-second real-time telemetry slice per edge pop
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 font-label-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-on-surface font-semibold">EDGE VALIDATION (AVG 18.4ms)</span>
            </div>
          </div>

          {/* Latency Visual Graph / Bars */}
          <div className="grid grid-cols-12 items-end gap-1 h-32 pt-4 pb-2 px-2 bg-surface-container-lowest rounded-lg border border-surface-container-high/20">
            <div className="flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full bg-primary/40 hover:bg-primary transition-all rounded-t" style={{ height: '38%' }} />
              <span className="font-badge-label text-[9px] text-outline font-mono">00s</span>
            </div>
            <div className="flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full bg-primary/50 hover:bg-primary transition-all rounded-t" style={{ height: '44%' }} />
              <span className="font-badge-label text-[9px] text-outline font-mono">05s</span>
            </div>
            <div className="flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full bg-primary hover:bg-secondary transition-all rounded-t" style={{ height: '29%' }} />
              <span className="font-badge-label text-[9px] text-outline font-mono">10s</span>
            </div>
            <div className="flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full bg-primary hover:bg-secondary transition-all rounded-t" style={{ height: '35%' }} />
              <span className="font-badge-label text-[9px] text-outline font-mono">15s</span>
            </div>
            <div className="flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full bg-primary hover:bg-secondary transition-all rounded-t" style={{ height: '52%' }} />
              <span className="font-badge-label text-[9px] text-outline font-mono">20s</span>
            </div>
            <div className="flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full bg-tertiary/70 hover:bg-tertiary transition-all rounded-t" style={{ height: '48%' }} />
              <span className="font-badge-label text-[9px] text-outline font-mono">25s</span>
            </div>
            <div className="flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full bg-primary hover:bg-secondary transition-all rounded-t" style={{ height: '61%' }} />
              <span className="font-badge-label text-[9px] text-outline font-mono">30s</span>
            </div>
            <div className="flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full bg-primary hover:bg-secondary transition-all rounded-t" style={{ height: '42%' }} />
              <span className="font-badge-label text-[9px] text-outline font-mono">35s</span>
            </div>
            <div className="flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full bg-error hover:bg-error/80 transition-all rounded-t shadow-[0_0_8px_rgba(255,80,80,0.4)]" style={{ height: '78%' }} title="Spike: Geo-distance anomaly check" />
              <span className="font-badge-label text-[9px] text-error font-mono font-bold">40s</span>
            </div>
            <div className="flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full bg-primary hover:bg-secondary transition-all rounded-t" style={{ height: '36%' }} />
              <span className="font-badge-label text-[9px] text-outline font-mono">45s</span>
            </div>
            <div className="flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full bg-primary hover:bg-secondary transition-all rounded-t" style={{ height: '33%' }} />
              <span className="font-badge-label text-[9px] text-outline font-mono">50s</span>
            </div>
            <div className="flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full bg-secondary hover:bg-secondary transition-all rounded-t animate-pulse" style={{ height: '40%' }} />
              <span className="font-badge-label text-[9px] text-secondary font-mono font-bold">55s</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between pt-3 gap-2 font-label-mono text-[11px] text-on-surface-variant border-t border-surface-container-high/30 mt-3">
            <span>GATEWAY: <span className="text-on-surface font-semibold">api-turnstile.production.v4</span></span>
            <span>RATE: <span className="text-secondary font-mono">1,489 req/sec</span></span>
            <span>ERROR RATIO: <span className="text-primary font-mono">0.0014%</span></span>
            <span>CIPHER: <span className="text-tertiary">TLS_AES_256_GCM_SHA384</span></span>
          </div>
        </div>

        {/* Edge Compute Turnstile Nodes & WS Connection Pool */}
        <div className="lg:col-span-4 flex flex-col justify-between p-4 sm:p-5 rounded-xl bg-surface-container-low shadow-lg border border-surface-container-high/30">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">lan</span>
              <h3 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface">Edge Node Topology</h3>
            </div>
            <span className="font-badge-label text-[10px] text-secondary bg-surface-container px-2 py-0.5 rounded font-mono">
              {gyms.length}/{gyms.length || 1} HEALTHY
            </span>
          </div>

          <div className="flex flex-col gap-2.5 py-1">
            <div className="p-2.5 rounded bg-surface-container-lowest flex flex-col gap-1 border border-surface-container-high/20">
              <div className="flex items-center justify-between">
                <span className="font-label-mono text-[10px] text-on-surface-variant uppercase">ACTIVE WS SOCKET POOLS</span>
                <span className="font-telemetry-tabular text-xs text-secondary font-bold font-mono">
                  {gyms.length} Hubs ({gyms.length * 2 + 6} Conns)
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: '88%' }} />
              </div>
            </div>

            <div className="p-2.5 rounded bg-surface-container-lowest flex flex-col gap-1 border border-surface-container-high/20">
              <div className="flex items-center justify-between">
                <span className="font-label-mono text-[10px] text-on-surface-variant uppercase">HARDWARE OCR CAMERA BUFFERS</span>
                <span className="font-telemetry-tabular text-xs text-primary font-bold font-mono">0 Drop Frame</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="p-2.5 rounded bg-surface-container-lowest flex flex-col gap-1 border border-surface-container-high/20">
              <div className="flex items-center justify-between">
                <span className="font-label-mono text-[10px] text-on-surface-variant uppercase">REDIS STREAM REPLICATION</span>
                <span className="font-telemetry-tabular text-xs text-tertiary font-bold font-mono">0.8ms Offset</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div className="bg-tertiary h-full rounded-full" style={{ width: '96%' }} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 text-[11px] font-label-mono text-outline border-t border-surface-container-high/30 mt-2">
            <span>FAILOVER: ACTIVE-ACTIVE</span>
            <span className="text-primary flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              AUTONOMOUS SHIELD
            </span>
          </div>
        </div>
      </div>

      {/* Cross-Facility Fraud & Anti-Passback Telemetry Queue */}
      <div className="flex flex-col gap-2.5 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse" />
            <h2 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface">
              Cross-Facility Anti-Passback & Fraud Telemetry Queue
            </h2>
            <span className="font-badge-label text-[10px] bg-error-container text-on-error-container px-2 py-0.5 rounded font-mono font-bold">
              2 CRITICAL ANOMALIES ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-2 font-label-mono text-xs text-on-surface-variant">
            <span>AUTO-INTERCEPT:</span>
            <span className="text-primary font-bold">ARMED (P1 ESCALATION)</span>
          </div>
        </div>

        {/* Anomaly Table Container */}
        <div className="w-full bg-surface-container-low rounded-xl shadow-xl overflow-hidden border border-surface-container-high/30">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-lowest font-label-mono text-[10px] text-outline uppercase tracking-wider">
                  <th className="py-2.5 px-4">INCIDENT ID & TIMESTAMP</th>
                  <th className="py-2.5 px-4">MEMBER IDENTIFIER</th>
                  <th className="py-2.5 px-4">SECURITY EXPLOIT VECTOR</th>
                  <th className="py-2.5 px-4">TELEMETRY & HARDWARE DELTA</th>
                  <th className="py-2.5 px-4">RISK CLASSIFICATION</th>
                  <th className="py-2.5 px-4 text-right">ONE-CLICK COUNTERMEASURE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high/40 font-body-sm">
                {/* Anomaly 1: Dual check-in 12km in 4 min */}
                <tr className={`transition-colors ${
                  anomaly1Locked ? 'opacity-50 grayscale bg-surface-container' : 'hover:bg-surface-container/60 bg-error-container/10'
                }`}>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-telemetry-tabular text-xs text-error font-bold font-mono">SEC-ANOM-9021</span>
                      <span className="font-label-mono text-[10px] text-on-surface-variant">14:02:18.491 UTC</span>
                      <span className="font-badge-label text-[9px] text-error mt-0.5 tracking-wider uppercase font-bold">
                        IMPOSSIBLE VELOCITY
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-error-container text-on-error-container flex items-center justify-center font-bold text-xs">
                        IV
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline-sm text-xs text-on-surface font-semibold">Account IV-3391</span>
                        <span className="font-label-mono text-[11px] text-on-surface-variant">Marcus Sterling (Black Vault)</span>
                        <span className="font-label-mono text-[10px] text-tertiary">RFID: 0x98A_FC42_01</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5 max-w-sm">
                      <span className="text-xs font-semibold text-on-surface">Dual Simultaneous Check-In: 12.4 km Delta</span>
                      <p className="text-on-surface-variant text-[11px] leading-relaxed">
                        Gate 02 at <span className="text-on-surface font-semibold">IronVault Downtown</span> scanned at 14:00:12. Secondary gate breach at <span className="text-on-surface font-semibold">IronVault Northgate</span> at 14:04:09 (3m 57s delta). Calculated travel rate 188.2 km/h exceeds physical threshold.
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5 font-label-mono text-[10px]">
                      <div><span className="text-outline">IP NODE:</span> <span className="text-on-surface">198.51.100.41 • 198.51.100.89</span></div>
                      <div><span className="text-outline">HW HASH:</span> <span className="text-secondary font-mono">SHA256:d8c1..9a8f</span></div>
                      <div><span className="text-outline">SCAN VEL:</span> <span className="text-tertiary font-mono">0.19s / 0.22s</span></div>
                      <div><span className="text-outline">JITTER:</span> <span className="text-on-surface">1.4ms</span></div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-error/20 text-error">
                      <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping" />
                      <span className="font-badge-label text-[10px] font-bold uppercase">CRITICAL 99.4%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setAnomaly1Locked(!anomaly1Locked);
                          showToast(
                            !anomaly1Locked
                              ? 'Pass IV-3391 locked across all turnstile gates.'
                              : 'Pass IV-3391 lock removed.',
                            !anomaly1Locked
                          );
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-headline-sm transition-all shadow-md active:scale-95 flex items-center gap-1 ${
                          anomaly1Locked
                            ? 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                            : 'bg-error hover:bg-error/90 text-on-error font-bold'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {anomaly1Locked ? 'lock_open' : 'lock'}
                        </span>
                        <span>{anomaly1Locked ? 'Pass Locked' : 'Lock Member Pass'}</span>
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Anomaly 2: QR Screenshot Clone Detected */}
                <tr className={`transition-colors ${
                  anomaly2Whitelisted ? 'bg-primary/10' : anomaly2Locked ? 'opacity-50 grayscale bg-surface-container' : 'hover:bg-surface-container/60 bg-surface-container-low'
                }`}>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-telemetry-tabular text-xs text-tertiary font-bold font-mono">SEC-ANOM-9019</span>
                      <span className="font-label-mono text-[10px] text-on-surface-variant">13:48:02.112 UTC</span>
                      <span className="font-badge-label text-[9px] text-tertiary mt-0.5 tracking-wider uppercase font-bold">
                        DEVICE MISMATCH
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-bold text-xs">
                        IV
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline-sm text-xs text-on-surface font-semibold">Account IV-10822</span>
                        <span className="font-label-mono text-[11px] text-on-surface-variant">Elena Rostova (Olympic Tier)</span>
                        <span className="font-label-mono text-[10px] text-secondary">EPHEMERAL_TOKEN_ROTATION</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5 max-w-sm">
                      <span className="text-xs font-semibold text-on-surface">QR Screenshot Clone / Identity Token Spoof</span>
                      <p className="text-on-surface-variant text-[11px] leading-relaxed">
                        Primary device profile registered as <span className="text-tertiary font-semibold">Apple iPhone 15 Pro (iOS 17.4)</span>. Token presented on secondary screen via <span className="text-error font-semibold">Samsung Galaxy S23 (Android 14)</span>.
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5 font-label-mono text-[10px]">
                      <div><span className="text-outline">IP NODE:</span> <span className="text-on-surface">172.56.21.90 (Cellular NAT)</span></div>
                      <div><span className="text-outline">HW HASH:</span> <span className="text-error font-mono">MISMATCH: a74e != 2b90</span></div>
                      <div><span className="text-outline">TOTP DRIFT:</span> <span className="text-tertiary font-mono">+12.8s replay window</span></div>
                      <div><span className="text-outline">SENSOR:</span> <span className="text-on-surface">Optic QR Lux 98.2</span></div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-container/20 text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      <span className="font-badge-label text-[10px] font-bold uppercase">ELEVATED 78.1%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setAnomaly2Locked(!anomaly2Locked);
                          showToast(
                            !anomaly2Locked
                              ? 'Pass IV-10822 locked across all gates.'
                              : 'Pass lock revoked.',
                            !anomaly2Locked
                          );
                        }}
                        className="px-2.5 py-1.5 rounded bg-surface-container-high hover:bg-error hover:text-on-error text-on-surface text-xs font-semibold transition-all active:scale-95 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[15px]">lock</span>
                        <span>{anomaly2Locked ? 'Locked' : 'Lock Pass'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAnomaly2Whitelisted(true);
                          showToast('Hardware profile for IV-10822 whitelisted.');
                        }}
                        className="px-2.5 py-1.5 rounded bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-all active:scale-95 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[15px]">verified</span>
                        <span>Whitelist HW</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Multi-Tenant Facility Registry Grid / Data Table */}
      <div className="flex flex-col gap-3 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[22px]">domain</span>
            <div>
              <h2 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface">
                Multi-Tenant Facility Infrastructure Directory
              </h2>
              <span className="font-label-mono text-[11px] text-on-surface-variant">
                {gyms.length} enterprise gym workspaces connected via low-latency hardware turnstile daemons
              </span>
            </div>
          </div>

          {/* Tab Selector & Search Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Switcher Pills */}
            <div className="flex items-center bg-surface-container-lowest p-1 rounded-lg border border-surface-container-high/30">
              <button
                type="button"
                onClick={() => setActiveTab('GYMS')}
                className={`px-3 py-1 rounded text-xs font-label-mono transition-all flex items-center gap-1.5 ${
                  activeTab === 'GYMS'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Workspaces ({filteredGyms.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MEMBERS')}
                className={`px-3 py-1 rounded text-xs font-label-mono transition-all flex items-center gap-1.5 ${
                  activeTab === 'MEMBERS'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Athletes ({filteredMembers.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-surface-container-high/30">
              <span className="material-symbols-outlined text-outline text-[16px]">search</span>
              <input
                type="text"
                placeholder={activeTab === 'GYMS' ? 'Filter gyms, codes, owners...' : 'Filter athletes, emails, gyms...'}
                value={activeTab === 'GYMS' ? gymSearch : memberSearch}
                onChange={(e) => {
                  if (activeTab === 'GYMS') setGymSearch(e.target.value);
                  else setMemberSearch(e.target.value);
                }}
                className="bg-transparent font-label-mono text-xs text-on-surface placeholder:text-outline focus:outline-none w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: GYM WORKSPACES DIRECTORY                          */}
        {/* ========================================================= */}
        {activeTab === 'GYMS' && (
          <div className="w-full bg-surface-container-low rounded-xl shadow-xl overflow-hidden border border-surface-container-high/30">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-lowest font-label-mono text-[10px] text-outline uppercase tracking-wider">
                    <th className="py-2.5 px-4">FACILITY & CODE</th>
                    <th className="py-2.5 px-4">TIER & SLA</th>
                    <th className="py-2.5 px-4">OWNER DIRECT CONTACT</th>
                    <th className="py-2.5 px-4">GEOFENCE</th>
                    <th className="py-2.5 px-4">ATHLETES</th>
                    <th className="py-2.5 px-4">MONTHLY SCANS</th>
                    <th className="py-2.5 px-4">RISK SCORE</th>
                    <th className="py-2.5 px-4 text-right">ADMIN CONTROL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/40 font-body-sm">
                  {filteredGyms.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-outline">
                        <Building2 className="w-10 h-10 mx-auto stroke-1 opacity-50 mb-2" />
                        <p className="text-sm font-bold text-on-surface">No Gym Workspaces Found</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">Provision a new workspace above to begin.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredGyms.map((g, idx) => {
                      const ownerName = g.ownerName || g.owner?.fullName || 'Gym Owner';
                      const ownerEmail = g.ownerEmail || g.owner?.email || g.ownerContactEmail || 'N/A';
                      const ownerPhone = g.ownerPhone || g.owner?.phone || g.ownerContactPhone || 'N/A';
                      const memberCount = g.counts?.totalUsers ?? g._count?.users ?? 0;
                      const checkinCount = g.counts?.attendanceTotal ?? g._count?.attendanceEntries ?? 0;
                      const inviteUrl = `${window.location.origin}/?invite=${g.inviteCode}`;
                      const paddedIdx = String(idx + 1).padStart(2, '0');

                      return (
                        <tr key={g.id} className="hover:bg-surface-container/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center font-label-mono font-bold text-primary text-xs shrink-0">
                                {paddedIdx}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-headline-sm text-xs font-semibold text-on-surface">
                                  {g.name}
                                </span>
                                <span className="font-label-mono text-[11px] text-tertiary">
                                  #{g.inviteCode} • {g.city || 'Metro'}, {g.state || 'HQ'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-badge-label text-[10px] text-primary uppercase font-bold">
                                ENTERPRISE TITANIUM
                              </span>
                              <span className="font-label-mono text-[10px] text-outline font-mono">
                                P99 &lt; 25ms • 99.99%
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1 text-on-surface">
                                <span className="font-semibold text-xs">{ownerName}</span>
                              </div>
                              <div className="flex items-center gap-1 font-label-mono text-[10px] text-on-surface-variant">
                                <span>{ownerEmail}</span>
                                {ownerEmail !== 'N/A' && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(ownerEmail, `email-${g.id}`, 'Owner Email')}
                                    className="hover:text-primary transition"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-label-mono text-[10px] px-2 py-0.5 rounded bg-surface-container text-on-surface">
                              50m Strict
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-telemetry-tabular text-xs text-on-surface font-semibold font-mono">
                                {memberCount.toLocaleString()}
                              </span>
                              <span className="font-label-mono text-[10px] text-secondary">
                                92% Daily Active
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-telemetry-tabular text-xs text-on-surface font-semibold font-mono">
                                {checkinCount.toLocaleString()}
                              </span>
                              <span className="font-label-mono text-[10px] text-outline">
                                avg 0.18s scan
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="inline-flex items-center gap-1 font-label-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              <span>Low 0.2%</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyText(g.inviteCode, `code-${g.id}`, 'Access Code')}
                                className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-bright text-on-surface font-label-mono text-[11px] transition-colors flex items-center gap-1"
                                title="Copy 6-digit access code"
                              >
                                {copiedKey === `code-${g.id}` ? <Check className="w-3 h-3 text-primary" /> : <KeyRound className="w-3 h-3" />}
                                <span>Code</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCopyText(inviteUrl, `link-${g.id}`, 'Client Invite Link')}
                                className="px-2.5 py-1 rounded bg-tertiary-container hover:bg-tertiary text-on-tertiary-container hover:text-on-tertiary font-label-mono text-[11px] transition-colors flex items-center gap-1 font-bold"
                                title="Copy direct join link"
                              >
                                {copiedKey === `link-${g.id}` ? <Check className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                                <span>Join Link</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination / Status Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-surface-container-lowest font-label-mono text-xs text-on-surface-variant gap-2 border-t border-surface-container-high/30">
              <div className="flex items-center gap-3">
                <span>SHOWING {filteredGyms.length} OF {gyms.length} MULTI-TENANT WORKSPACES</span>
                <span className="hidden md:inline text-outline">|</span>
                <span className="hidden md:inline">
                  GLOBAL SCAN VOLUME: <span className="text-on-surface font-mono font-bold">156,648/mo</span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleExportGymsCsv}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Gyms CSV</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: ATHLETES DIRECTORY                                */}
        {/* ========================================================= */}
        {activeTab === 'MEMBERS' && (
          <div className="space-y-3">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-surface-container-low rounded-xl border border-surface-container-high/30">
              <select
                value={selectedGymFilter}
                onChange={(e) => setSelectedGymFilter(e.target.value)}
                className="bg-surface-container-lowest border border-surface-container-high/40 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none"
              >
                <option value="ALL">🏢 All Gyms ({gyms.length})</option>
                {gyms.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.inviteCode})
                  </option>
                ))}
              </select>

              <select
                value={memberStatusFilter}
                onChange={(e: any) => setMemberStatusFilter(e.target.value)}
                className="bg-surface-container-lowest border border-surface-container-high/40 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">🟢 Active Passes Only</option>
                <option value="INACTIVE">⚪ Inactive / Expired</option>
              </select>

              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs font-mono text-outline">
                  Showing {filteredMembers.length} athletes
                </span>
                <button
                  type="button"
                  onClick={handleExportMembersCsv}
                  className="px-3 py-1.5 rounded bg-primary text-on-primary font-bold text-xs flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export Athletes CSV</span>
                </button>
              </div>
            </div>

            {/* Athletes Table */}
            <div className="w-full bg-surface-container-low rounded-xl shadow-xl overflow-hidden border border-surface-container-high/30">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-container-lowest font-label-mono text-[10px] text-outline uppercase tracking-wider">
                      <th className="py-2.5 px-4">ATHLETE NAME</th>
                      <th className="py-2.5 px-4">CONTACT DETAILS</th>
                      <th className="py-2.5 px-4">ASSIGNED WORKSPACE</th>
                      <th className="py-2.5 px-4">MEMBERSHIP PLAN</th>
                      <th className="py-2.5 px-4">PASS STATUS</th>
                      <th className="py-2.5 px-4">EXPIRY</th>
                      <th className="py-2.5 px-4 text-right">ADMIN CONTROL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/40 font-body-sm">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-outline">
                          <Users className="w-10 h-10 mx-auto stroke-1 opacity-50 mb-2" />
                          <p className="text-sm font-bold text-on-surface">No Athletes Found</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">Try clearing filters or search criteria.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((m) => {
                        const isActive = m.status === 'ACTIVE';
                        const planTitle = m.planName || m.latestSubscription?.planName || 'Monthly Pro Access';
                        const priceVal = m.price || m.latestSubscription?.price || 65;

                        return (
                          <tr key={m.id} className="hover:bg-surface-container/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-surface-container-highest text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                  {m.fullName?.charAt(0) || 'A'}
                                </div>
                                <div>
                                  <span className="font-bold text-on-surface block text-xs">
                                    {m.fullName}
                                  </span>
                                  <span className="text-[10px] text-outline uppercase font-mono">
                                    {m.role || 'ATHLETE'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1 text-on-surface font-mono text-[11px]">
                                  <span>{m.email}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(m.email, `m-email-${m.id}`, 'Email')}
                                    className="text-outline hover:text-primary transition"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                                {m.phone && (
                                  <span className="text-[10px] text-outline font-mono block">
                                    {m.phone}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-bold text-on-surface block text-xs">
                                {m.gymName || 'Unassigned'}
                              </span>
                              {m.gymInviteCode && (
                                <span className="font-mono text-[10px] text-tertiary">
                                  #{m.gymInviteCode}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-bold text-on-surface block text-xs">
                                {planTitle}
                              </span>
                              <span className="text-[11px] text-primary font-mono font-bold">
                                ${priceVal}/mo
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary font-mono">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                  ACTIVE
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-outline font-mono">
                                  INACTIVE
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 font-mono text-outline text-xs">
                              {m.endDate ? new Date(m.endDate).toLocaleDateString() : '30-Day Pass'}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteMember(m.id, m.fullName || m.email)}
                                className="px-2.5 py-1 rounded bg-error/10 hover:bg-error text-error hover:text-on-error font-mono text-[11px] transition flex items-center gap-1 ml-auto"
                                title="Delete Member"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: PROVISION GYM WORKSPACE                            */}
      {/* ========================================================= */}
      {isCreateGymModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg p-6 sm:p-7 relative max-h-[92vh] overflow-y-auto bg-surface-container-low rounded-2xl border border-surface-container-high shadow-2xl text-on-surface">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsCreateGymModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-on-surface">
                  Provision Gym Workspace
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Create an isolated SaaS facility tenant with 6-digit access code & owner credentials
                </p>
              </div>
            </div>

            {/* Success State */}
            {createdGymResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-primary">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="font-bold text-sm">Gym Workspace Successfully Created!</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Isolated tenant ready. Credentials generated for the gym owner portal.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-high/40 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-outline font-sans">Gym Name:</span>
                    <span className="font-bold text-on-surface">{createdGymResult.gym.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-outline font-sans">6-Digit Access Code:</span>
                    <span className="font-bold text-sm bg-primary text-on-primary px-2 py-0.5 rounded">
                      {createdGymResult.gym.inviteCode}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-outline font-sans">Owner Login Gmail:</span>
                    <span className="font-bold text-on-surface">{createdGymResult.user.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-outline font-sans">Initial Password:</span>
                    <span className="font-bold text-on-surface">{createdGymResult.password}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyGymCredentials}
                    className="flex-1 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface transition flex items-center justify-center gap-1.5"
                  >
                    {copiedGymCreds ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedGymCreds ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateGymModalOpen(false);
                      setCreatedGymResult(null);
                    }}
                    className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs uppercase tracking-wider transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateGymSubmit} className="space-y-4">
                {gymCreationError && (
                  <div className="p-3.5 rounded-xl bg-error-container text-on-error-container text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                    <span>{gymCreationError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    Gym Business Name *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-outline absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. IronVault Apex Downtown"
                      value={gymFormName}
                      onChange={(e) => setGymFormName(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-on-surface">
                        6-Digit Access Code *
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomGymCode}
                        className="text-[11px] text-primary font-bold hover:underline"
                      >
                        🎲 Random
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-outline absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        maxLength={8}
                        placeholder="100003"
                        value={gymFormCode}
                        onChange={(e) => setGymFormCode(e.target.value.toUpperCase())}
                        className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1.5">
                      Owner Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-outline absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="Sarah Jenkins"
                        value={gymFormOwnerName}
                        onChange={(e) => setGymFormOwnerName(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    Owner Gmail ID (For Login & OTP Reset) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-outline absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="owner.gym@gmail.com"
                      value={gymFormEmail}
                      onChange={(e) => setGymFormEmail(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Password recovery codes (OTP) will be dispatched directly to this Gmail address.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-on-surface">
                        Initial Password *
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[11px] text-primary font-bold hover:underline"
                      >
                        ⚡ Generate
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-outline absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        minLength={6}
                        placeholder="Min 6 characters"
                        value={gymFormPassword}
                        onChange={(e) => setGymFormPassword(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1.5">
                      Owner Phone (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-outline absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={gymFormPhone}
                        onChange={(e) => setGymFormPhone(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    Physical Facility Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-outline absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. 500 Grand Avenue, Suite 100"
                      value={gymFormAddress}
                      onChange={(e) => setGymFormAddress(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. New York"
                      value={gymFormCity}
                      onChange={(e) => setGymFormCity(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NY"
                      value={gymFormState}
                      onChange={(e) => setGymFormState(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingGym}
                    className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg active:scale-98 disabled:opacity-50"
                  >
                    {isSubmittingGym ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Provisioning Workspace...</span>
                      </>
                    ) : (
                      <>
                        <Building2 className="w-4 h-4" />
                        <span>Provision Gym & Owner Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
