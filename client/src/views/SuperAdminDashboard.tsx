import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  Download,
  Search,
  Copy,
  Check,
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
  ExternalLink,
  User,
  Activity,
  Trash2,
  Shield,
  Zap,
  Globe,
  Radio,
  FileSpreadsheet
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
    <div className="w-full min-h-screen bg-[#050507] text-white pb-28 pt-safe px-4 sm:px-6 lg:px-8 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification Banner */}
      {actionNotice && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-all backdrop-blur-xl border ${
          isErrorNotice
            ? 'bg-rose-950/90 text-rose-200 border-rose-500/30'
            : 'bg-[#0e1015] text-white border-[#ccff00]/30 shadow-[0_0_25px_rgba(204,255,0,0.15)]'
        }`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            isErrorNotice ? 'bg-rose-500/20 text-rose-400' : 'bg-[#ccff00]/20 text-[#ccff00]'
          }`}>
            {isErrorNotice ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">
              {isErrorNotice ? 'Security Intercept' : 'Operation Success'}
            </span>
            <span className="text-xs text-white/70">
              {actionNotice}
            </span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="ml-3 text-white/40 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Ambient Glow */}
      <div className="relative w-full overflow-hidden pointer-events-none -mb-6">
        <div className="absolute -top-16 left-1/3 w-[500px] h-36 bg-[#ccff00]/5 rounded-full blur-3xl" />
        <div className="absolute top-12 right-12 w-96 h-40 bg-[#ccff00]/5 rounded-full blur-3xl" />
      </div>

      {/* Sleek Linear Header */}
      <div className="flex flex-col gap-4 w-full relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0e1015] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20 flex items-center justify-center font-bold shadow-lg shadow-[#ccff00]/10 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className="text-xl sm:text-2xl font-extrabold font-['Syne',sans-serif] uppercase text-white tracking-wide">
                  Gym System Fleet Control
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 text-[10px] font-black uppercase font-mono tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse" />
                  All Active Gyms
                </span>
              </div>
              <p className="text-xs text-white/50">
                Manage all gym locations, check-in gates, and member pass accounts
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                loadData();
                showToast('Data refreshed.');
              }}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#121418] hover:bg-white/10 text-white text-xs font-bold border border-white/10 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#ccff00] ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>

            <button
              type="button"
              onClick={handleExportMasterArchive}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#121418] hover:bg-white/10 text-white text-xs font-bold border border-white/10 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-[#ccff00]" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateGymModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ccff00] hover:bg-[#b8e600] text-black font-black text-xs tracking-wide transition-all shadow-[0_0_20px_rgba(204,255,0,0.25)] active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Provision Gym Workspace</span>
            </button>
          </div>
        </div>

        {/* 4 Glanceable KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
          <div className="bg-[#0e1015] p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest font-['Syne',sans-serif]">Active Gyms</span>
              <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-['Syne',sans-serif] text-white">
              {gyms.length}
            </div>
            <div className="text-[11px] text-white/50 mt-1.5 flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-[#ccff00]" />
              <span>100% online across regions</span>
            </div>
          </div>

          <div className="bg-[#0e1015] p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest font-['Syne',sans-serif]">Total Athletes</span>
              <span className="px-2 py-0.5 rounded-full bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 text-[10px] font-black font-mono">
                +{totalActivePasses} Active
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-['Syne',sans-serif] text-white">
              {members.length.toLocaleString()}
            </div>
            <div className="text-[11px] text-white/50 mt-1.5 flex items-center gap-1.5">
              <Users className="w-3 h-3 text-[#ccff00]" />
              <span>Platform-wide memberships</span>
            </div>
          </div>

          <div className="bg-[#0e1015] p-4 sm:p-5 rounded-2xl border border-[#ccff00]/30 hover:border-[#ccff00]/50 transition-all shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-[#ccff00] uppercase tracking-widest font-['Syne',sans-serif]">Gateway Uptime</span>
              <span className="px-2 py-0.5 rounded-full bg-[#ccff00]/20 text-[#ccff00] text-[10px] font-black font-mono uppercase tracking-wider">
                Operational
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-['Syne',sans-serif] text-[#ccff00]">
              99.98%
            </div>
            <div className="text-[11px] text-white/50 mt-1.5 flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[#ccff00]" />
              <span>Zero unplanned downtime</span>
            </div>
          </div>

          <div className="bg-[#0e1015] p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest font-['Syne',sans-serif]">Turnstile Speed</span>
              <span className="px-2 py-0.5 rounded-full bg-[#121418] text-white/70 border border-white/10 text-[10px] font-mono font-bold">
                P99
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-['Syne',sans-serif] text-white">
              18<span className="text-sm font-normal text-white/40 ml-0.5">ms</span>
            </div>
            <div className="text-[11px] text-white/50 mt-1.5 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-[#ccff00]" />
              <span>Sub-second gate verification</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Traffic & Infrastructure Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
        {/* Sleek Latency Visualizer */}
        <div className="lg:col-span-8 bg-zinc-900/60 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Turnstile Validation Response Times
              </h2>
              <span className="text-xs text-zinc-400">
                Real-time edge verification latency over the last 60 seconds
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-zinc-300 font-medium">Average 18.4ms</span>
            </div>
          </div>

          {/* Clean Latency Chart Bars */}
          <div className="grid grid-cols-12 items-end gap-1.5 h-28 pt-4 pb-2 px-3 bg-zinc-950/70 rounded-2xl border border-white/5">
            {[
              { h: '38%', s: '00s' },
              { h: '44%', s: '05s' },
              { h: '29%', s: '10s' },
              { h: '35%', s: '15s' },
              { h: '52%', s: '20s' },
              { h: '48%', s: '25s' },
              { h: '61%', s: '30s' },
              { h: '42%', s: '35s' },
              { h: '70%', s: '40s', alert: true },
              { h: '36%', s: '45s' },
              { h: '33%', s: '50s' },
              { h: '40%', s: '55s', pulse: true }
            ].map((bar, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                <div
                  className={`w-full rounded-md transition-all duration-300 ${
                    bar.alert
                      ? 'bg-amber-400/80 group-hover:bg-amber-300'
                      : bar.pulse
                      ? 'bg-emerald-400 group-hover:bg-emerald-300 animate-pulse'
                      : 'bg-emerald-500/40 group-hover:bg-emerald-400'
                  }`}
                  style={{ height: bar.h }}
                />
                <span className="text-[9px] text-zinc-500 font-mono">{bar.s}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between pt-3 gap-2 text-xs text-zinc-400 border-t border-white/5 mt-3">
            <span>Edge Cluster: <span className="text-zinc-200 font-medium">AWS us-east & Cloudflare Workers</span></span>
            <span>Throughput: <span className="text-emerald-400 font-mono font-medium">1,489 scans/sec</span></span>
            <span>Error Rate: <span className="text-emerald-400 font-mono font-medium">0.001%</span></span>
          </div>
        </div>

        {/* Edge Node Topology */}
        <div className="lg:col-span-4 bg-zinc-900/60 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              Connected Gateways
            </h3>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20">
              {gyms.length}/{gyms.length || 1} Healthy
            </span>
          </div>

          <div className="space-y-2.5 py-1">
            <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">WebSocket Turnstile Relay</span>
                <span className="text-emerald-400 font-bold font-mono">Active</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: '96%' }} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Biometric OCR Camera Stream</span>
                <span className="text-emerald-400 font-bold font-mono">0 Drop Frames</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Autonomous Gate Shield</span>
                <span className="text-teal-400 font-bold font-mono">Armed</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-teal-400 h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 text-xs text-zinc-400 border-t border-white/5 mt-2">
            <span>Failover Mode: Active-Active</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Multi-Region Synced
            </span>
          </div>
        </div>
      </div>

      {/* Security Alerts: Anti-Passback & Pass Fraud Protection */}
      <div className="bg-zinc-900/60 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Pass Protection & Shared Pass Alerts
              </h2>
              <p className="text-xs text-zinc-400">
                Automatic alerts when a pass is scanned twice or shared across different locations
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-semibold self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            2 Active Alerts
          </span>
        </div>

        {/* Security Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Incident 1 */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            anomaly1Locked
              ? 'bg-zinc-950/40 border-white/5 opacity-60'
              : 'bg-zinc-950/80 border-rose-500/30'
          }`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="text-[10px] font-mono text-rose-400 font-semibold uppercase tracking-wider">
                  Alert #SEC-9021 • 14:02 UTC
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  Simultaneous Check-In at Two Branches
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                HIGH RISK
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              Member <strong className="text-white">Marcus Sterling</strong> checked in at <strong className="text-white">Downtown Branch</strong> and then at <strong className="text-white">Northgate Branch (12.4 km away)</strong> within 3 minutes 57 seconds. Pass is likely being shared with another person.
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <span className="text-xs text-zinc-500 font-mono">Gate 02 Alert</span>
              <button
                type="button"
                onClick={() => {
                  setAnomaly1Locked(!anomaly1Locked);
                  showToast(!anomaly1Locked ? 'Pass locked across all gym locations.' : 'Lock removed.');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                  anomaly1Locked
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/25'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{anomaly1Locked ? 'Pass Locked' : 'Lock Pass at All Gates'}</span>
              </button>
            </div>
          </div>

          {/* Incident 2 */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            anomaly2Whitelisted
              ? 'bg-emerald-950/20 border-emerald-500/30'
              : anomaly2Locked
              ? 'bg-zinc-950/40 border-white/5 opacity-60'
              : 'bg-zinc-950/80 border-amber-500/30'
          }`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-semibold uppercase tracking-wider">
                  Alert #SEC-9019 • 13:48 UTC
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  Unregistered Phone / Screenshot Used
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                ELEVATED
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              Member <strong className="text-white">Elena Rostova</strong>'s pass was scanned from a Samsung Galaxy S23 while their verified phone is an iPhone 15 Pro. The QR code displayed an expired pass code.
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-white/5 gap-2">
              <span className="text-xs text-zinc-500 font-mono">Turnstile Gate 01</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAnomaly2Locked(!anomaly2Locked);
                    showToast(!anomaly2Locked ? 'Pass locked for review.' : 'Lock revoked.');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center gap-1 ${
                    anomaly2Locked ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-800 hover:bg-rose-500 text-zinc-200 hover:text-white'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{anomaly2Locked ? 'Locked' : 'Lock'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAnomaly2Whitelisted(true);
                    showToast('Device verified & whitelisted.');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-black text-xs font-bold transition active:scale-95 flex items-center gap-1 border border-emerald-500/30"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Whitelist Device</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Tenant Facility Registry Grid / Data Table */}
      <div className="bg-[#0e1015] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold font-['Syne',sans-serif] uppercase text-white tracking-wide flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-[#ccff00]" />
              <span>Multi-Tenant Gym Fleet Directory</span>
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              Manage enterprise gym instances, owner accounts, and athlete records
            </p>
          </div>

          {/* Tab Selector & Search Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Switcher Pills */}
            <div className="flex items-center bg-[#121418] p-1 rounded-full border border-white/5">
              <button
                type="button"
                onClick={() => setActiveTab('GYMS')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'GYMS'
                    ? 'bg-[#ccff00] text-black font-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Gyms ({filteredGyms.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MEMBERS')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'MEMBERS'
                    ? 'bg-[#ccff00] text-black font-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Athletes ({filteredMembers.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2.5 bg-[#121418] px-4 py-2 rounded-full border border-white/10">
              <Search className="w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder={activeTab === 'GYMS' ? 'Search gym, code, owner...' : 'Search athlete, email, phone...'}
                value={activeTab === 'GYMS' ? gymSearch : memberSearch}
                onChange={(e) => {
                  if (activeTab === 'GYMS') setGymSearch(e.target.value);
                  else setMemberSearch(e.target.value);
                }}
                className="bg-transparent text-xs text-white placeholder:text-white/40 focus:outline-none w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* VIEW 1: GYM WORKSPACES DIRECTORY */}
        {activeTab === 'GYMS' && (
          <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0e1015]">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#121418] text-white/50 uppercase tracking-wider text-[10px] font-bold font-['Syne',sans-serif] border-b border-white/10">
                    <th className="py-3.5 px-4">Gym Facility</th>
                    <th className="py-3.5 px-4">Access Code</th>
                    <th className="py-3.5 px-4">Owner Contact</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4 text-center">Athletes</th>
                    <th className="py-3.5 px-4 text-center">Total Scans</th>
                    <th className="py-3.5 px-4 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredGyms.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-500">
                        <Building2 className="w-10 h-10 mx-auto stroke-1 opacity-50 mb-2" />
                        <p className="text-sm font-bold text-zinc-300">No Gym Workspaces Found</p>
                        <p className="text-xs text-zinc-500 mt-0.5">Provision a new workspace above to begin.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredGyms.map((g, idx) => {
                      const ownerName = g.ownerName || g.owner?.fullName || 'Gym Owner';
                      const ownerEmail = g.ownerEmail || g.owner?.email || g.ownerContactEmail || 'N/A';
                      const memberCount = g.counts?.totalUsers ?? g._count?.users ?? 0;
                      const checkinCount = g.counts?.attendanceTotal ?? g._count?.attendanceEntries ?? 0;
                      const inviteUrl = `${window.location.origin}/?invite=${g.inviteCode}`;

                      return (
                        <tr key={g.id} className="hover:bg-white/[0.03] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-white/10 flex items-center justify-center font-bold text-emerald-400 text-xs shrink-0">
                                {String(idx + 1).padStart(2, '0')}
                              </div>
                              <div>
                                <span className="font-bold text-sm text-white block">
                                  {g.name}
                                </span>
                                <span className="text-[11px] text-zinc-400">
                                  Enterprise Workspace
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold text-xs">
                              #{g.inviteCode}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div>
                              <span className="font-semibold text-xs text-white block">{ownerName}</span>
                              <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] mt-0.5">
                                <span>{ownerEmail}</span>
                                {ownerEmail !== 'N/A' && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(ownerEmail, `email-${g.id}`, 'Owner Email')}
                                    className="hover:text-emerald-400 transition"
                                    title="Copy Email"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-zinc-300">
                              <span className="block font-medium">{g.city || 'Metro'}, {g.state || 'HQ'}</span>
                              <span className="text-[11px] text-zinc-500">{g.address || 'Standard Perimeter'}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="font-black text-sm text-white font-mono">
                              {memberCount.toLocaleString()}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold text-xs text-zinc-300 font-mono">
                              {checkinCount.toLocaleString()}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopyText(g.inviteCode, `code-${g.id}`, 'Access Code')}
                                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all active:scale-95 flex items-center gap-1"
                                title="Copy 6-digit access code"
                              >
                                {copiedKey === `code-${g.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <KeyRound className="w-3.5 h-3.5" />}
                                <span>Code</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCopyText(inviteUrl, `link-${g.id}`, 'Join Link')}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-black text-xs font-bold transition-all active:scale-95 flex items-center gap-1 border border-emerald-500/30"
                                title="Copy direct athlete join link"
                              >
                                {copiedKey === `link-${g.id}` ? <Check className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
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

            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-zinc-900/40 text-xs text-zinc-400 gap-2 border-t border-white/5">
              <span>Showing {filteredGyms.length} of {gyms.length} gym workspaces</span>
              <button
                type="button"
                onClick={handleExportGymsCsv}
                className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Gyms CSV</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: ATHLETES DIRECTORY */}
        {activeTab === 'MEMBERS' && (
          <div className="space-y-3">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-zinc-950/70 rounded-2xl border border-white/10">
              <select
                value={selectedGymFilter}
                onChange={(e) => setSelectedGymFilter(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="ALL">🏢 All Gyms ({gyms.length})</option>
                {gyms.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} (#{g.inviteCode})
                  </option>
                ))}
              </select>

              <select
                value={memberStatusFilter}
                onChange={(e: any) => setMemberStatusFilter(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">🟢 Active Passes Only</option>
                <option value="INACTIVE">⚪ Inactive / Expired</option>
              </select>

              <div className="ml-auto flex items-center gap-3">
                <span className="text-xs text-zinc-500 font-mono">
                  {filteredMembers.length} athletes
                </span>
                <button
                  type="button"
                  onClick={handleExportMembersCsv}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Athletes Table */}
            <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/50">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900/80 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold border-b border-white/10">
                      <th className="py-3.5 px-4">Athlete</th>
                      <th className="py-3.5 px-4">Contact</th>
                      <th className="py-3.5 px-4">Gym Facility</th>
                      <th className="py-3.5 px-4">Plan & Rate</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Valid Until</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-zinc-500">
                          <Users className="w-10 h-10 mx-auto stroke-1 opacity-50 mb-2" />
                          <p className="text-sm font-bold text-zinc-300">No Athletes Found</p>
                          <p className="text-xs text-zinc-500 mt-0.5">Try clearing filters or search query.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((m) => {
                        const isActive = m.status === 'ACTIVE';
                        const planTitle = m.planName || m.latestSubscription?.planName || 'Monthly Pro Access';
                        const priceVal = m.price || m.latestSubscription?.price || 65;

                        return (
                          <tr key={m.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                                  {m.fullName?.charAt(0) || 'A'}
                                </div>
                                <div>
                                  <span className="font-bold text-white block text-xs">
                                    {m.fullName}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 uppercase font-mono">
                                    {m.role || 'ATHLETE'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-zinc-300 text-xs">
                                  <span>{m.email}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(m.email, `m-email-${m.id}`, 'Email')}
                                    className="text-zinc-500 hover:text-emerald-400 transition"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                                {m.phone && (
                                  <span className="text-[11px] text-zinc-500 font-mono block">
                                    {m.phone}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="font-bold text-white block text-xs">
                                {m.gymName || 'Unassigned'}
                              </span>
                              {m.gymInviteCode && (
                                <span className="font-mono text-[10px] text-emerald-400">
                                  #{m.gymInviteCode}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-white block text-xs">
                                {planTitle}
                              </span>
                              <span className="text-[11px] text-emerald-400 font-mono font-bold">
                                ${priceVal}/mo
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  ACTIVE
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                                  INACTIVE
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 font-mono text-zinc-400 text-xs">
                              {m.endDate ? new Date(m.endDate).toLocaleDateString() : '30-Day Pass'}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteMember(m.id, m.fullName || m.email)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-xs font-semibold transition-all active:scale-95 flex items-center gap-1 ml-auto"
                                title="Delete Member"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODAL: PROVISION GYM WORKSPACE */}
      {isCreateGymModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg p-6 sm:p-7 relative max-h-[92vh] overflow-y-auto bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl text-white">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsCreateGymModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-black flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Provision Gym Workspace
                </h3>
                <p className="text-xs text-zinc-400">
                  Generate isolated gym tenant, unique 6-digit access code & credentials
                </p>
              </div>
            </div>

            {/* Success State */}
            {createdGymResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-sm">Gym Workspace Successfully Provisioned!</span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    Tenant created. Copy the access credentials below for the gym owner.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-sans">Gym Name:</span>
                    <span className="font-bold text-white">{createdGymResult.gym.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-sans">6-Digit Access Code:</span>
                    <span className="font-bold text-sm bg-emerald-500 text-black px-2.5 py-0.5 rounded-lg">
                      {createdGymResult.gym.inviteCode}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-sans">Owner Login Gmail:</span>
                    <span className="font-bold text-white">{createdGymResult.user.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-sans">Initial Password:</span>
                    <span className="font-bold text-white">{createdGymResult.password}</span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyGymCredentials}
                    className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition flex items-center justify-center gap-2"
                  >
                    {copiedGymCreds ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedGymCreds ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateGymModalOpen(false);
                      setCreatedGymResult(null);
                    }}
                    className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateGymSubmit} className="space-y-4">
                {gymCreationError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{gymCreationError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Gym Business Name *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. IronVault Apex Downtown"
                      value={gymFormName}
                      onChange={(e) => setGymFormName(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-zinc-300">
                        6-Digit Access Code *
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomGymCode}
                        className="text-[11px] text-emerald-400 font-semibold hover:underline"
                      >
                        🎲 Random
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        maxLength={8}
                        placeholder="100003"
                        value={gymFormCode}
                        onChange={(e) => setGymFormCode(e.target.value.toUpperCase())}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Owner Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="Sarah Jenkins"
                        value={gymFormOwnerName}
                        onChange={(e) => setGymFormOwnerName(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Owner Gmail ID (For Login & OTP Reset) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="owner.gym@gmail.com"
                      value={gymFormEmail}
                      onChange={(e) => setGymFormEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Password recovery codes (OTP) will be dispatched directly to this Gmail address.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-zinc-300">
                        Initial Password *
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[11px] text-emerald-400 font-semibold hover:underline"
                      >
                        ⚡ Generate
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        minLength={6}
                        placeholder="Min 6 characters"
                        value={gymFormPassword}
                        onChange={(e) => setGymFormPassword(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Owner Phone (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={gymFormPhone}
                        onChange={(e) => setGymFormPhone(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Physical Facility Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. 500 Grand Avenue, Suite 100"
                      value={gymFormAddress}
                      onChange={(e) => setGymFormAddress(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. New York"
                      value={gymFormCity}
                      onChange={(e) => setGymFormCity(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NY"
                      value={gymFormState}
                      onChange={(e) => setGymFormState(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingGym}
                    className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-98 disabled:opacity-50"
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
