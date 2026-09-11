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

  // Active View Tab: 'GYMS' | 'MEMBERS'
  const [activeTab, setActiveTab] = useState<'GYMS' | 'MEMBERS'>('GYMS');

  // Search & Filter States
  const [gymSearch, setGymSearch] = useState<string>('');
  const [memberSearch, setMemberSearch] = useState<string>('');
  const [selectedGymFilter, setSelectedGymFilter] = useState<string>('ALL');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
      setActionNotice(`Gym workspace '${res.gym.name}' created with access code: ${res.gym.inviteCode}`);
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
    setActionNotice(`${label} copied to clipboard!`);
    setTimeout(() => {
      setCopiedKey(null);
      setActionNotice(null);
    }, 3000);
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
      setActionNotice(`Member "${name}" was permanently removed.`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
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
      // Filter by search term
      const matchesSearch =
        !q ||
        (m.fullName || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.phone || '').toLowerCase().includes(q) ||
        (m.gymName || '').toLowerCase().includes(q) ||
        (m.gymInviteCode || '').toLowerCase().includes(q);

      // Filter by Gym
      const matchesGym =
        selectedGymFilter === 'ALL' ||
        m.gymId === selectedGymFilter ||
        m.gymInviteCode === selectedGymFilter;

      // Filter by Status
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

  /**
   * Export All Gyms & Gym Owners to CSV
   */
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
    setActionNotice(`Successfully exported ${filteredGyms.length} gym owners to CSV!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  /**
   * Export All Members Directory to CSV
   */
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
    setActionNotice(`Successfully exported ${filteredMembers.length} members to CSV!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  /**
   * Export Complete Master Archive (Both Gyms & Members)
   */
  const handleExportMasterArchive = () => {
    handleExportGymsCsv();
    setTimeout(() => {
      handleExportMembersCsv();
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 px-2 sm:px-4">
      {/* Toast Notification Banner */}
      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="hover:underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header: Super Admin Command Center */}
      <div className="p-6 sm:p-7 rounded-3xl app-card border border-slate-200/80 dark:border-zinc-800 bg-gradient-to-r from-emerald-500/10 via-zinc-900/10 to-teal-500/5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white dark:text-black shadow-lg flex-shrink-0">
              <ShieldAlert className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Super Admin Management Portal
                </h1>
                <span className="text-[10px] uppercase tracking-wider font-extrabold bg-emerald-500 text-black px-2.5 py-0.5 rounded-full shadow-sm">
                  ROOT LEVEL
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Central multi-tenant SaaS dashboard: Inspect all gym owner accounts, view platform member directories, and export data.
              </p>
            </div>
          </div>

          {/* Action Buttons: Provision & Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenCreateGymModal}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:text-black text-xs font-black transition flex items-center gap-2 shadow-md active:scale-95"
            >
              <Building2 className="w-4 h-4" />
              <span>➕ Create Gym Workspace</span>
            </button>

            <button
              type="button"
              onClick={handleExportMasterArchive}
              className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm active:scale-95"
              title="Download full CSV reports"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export All Data</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition"
              title="Refresh Platform Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Gyms */}
        <div className="app-card p-5 space-y-2 border-2 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">
              Gym Workspaces
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Building2 className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {gyms.length}
            </span>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Active Gym Tenants
            </p>
          </div>
        </div>

        {/* Metric 2: Total Members */}
        <div className="app-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">
              Total Members
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {members.length}
            </span>
            <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              Platform Athletes
            </p>
          </div>
        </div>

        {/* Metric 3: Active Subscriptions */}
        <div className="app-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">
              Active Passes
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {totalActivePasses}
            </span>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
              Currently Valid Passes
            </p>
          </div>
        </div>

        {/* Metric 4: Platform Value */}
        <div className="app-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">
              Platform Recurring Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Activity className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              ${totalMonthlyValue.toLocaleString()}
            </span>
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Cumulative Passes MRR
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('GYMS')}
          className={`py-2.5 px-5 rounded-xl font-black text-xs transition flex items-center gap-2 ${
            activeTab === 'GYMS'
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black shadow-md'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>🏢 Gyms & Owners Details ({filteredGyms.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MEMBERS')}
          className={`py-2.5 px-5 rounded-xl font-black text-xs transition flex items-center gap-2 ${
            activeTab === 'MEMBERS'
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black shadow-md'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>👥 Members Details Directory ({filteredMembers.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ALL GYMS & GYM OWNERS DETAILS                      */}
      {/* ========================================================= */}
      {activeTab === 'GYMS' && (
        <div className="space-y-4 animate-fade-in">
          {/* Section Toolbar */}
          <div className="app-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search gyms, owners, Gmail IDs, 6-digit codes, cities..."
                value={gymSearch}
                onChange={(e) => setGymSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-bold hidden sm:inline">
                Showing {filteredGyms.length} of {gyms.length} gyms
              </span>
              <button
                type="button"
                onClick={handleExportGymsCsv}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:text-black text-xs font-black transition flex items-center gap-2 shadow-sm active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Gyms & Owners (CSV)</span>
              </button>
            </div>
          </div>

          {/* Gyms Table */}
          <div className="app-card rounded-3xl overflow-hidden border border-slate-200 dark:border-zinc-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-900/90 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Gym Workspace</th>
                    <th className="py-3.5 px-4">Access Code</th>
                    <th className="py-3.5 px-4">Gym Owner</th>
                    <th className="py-3.5 px-4">Owner Gmail (Login / OTP)</th>
                    <th className="py-3.5 px-4">Phone Number</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4 text-center">Members</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {filteredGyms.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                        <Building2 className="w-10 h-10 mx-auto stroke-1 opacity-50 mb-2" />
                        <p className="text-sm font-bold text-slate-600 dark:text-zinc-400">No Gym Workspaces Found</p>
                        <p className="text-xs mt-0.5">Try clearing search filters or provision a new gym workspace.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredGyms.map((g) => {
                      const ownerName = g.ownerName || g.owner?.fullName || 'Gym Owner';
                      const ownerEmail = g.ownerEmail || g.owner?.email || g.ownerContactEmail || 'N/A';
                      const ownerPhone = g.ownerPhone || g.owner?.phone || g.ownerContactPhone || 'N/A';
                      const memberCount = g.counts?.totalUsers ?? g._count?.users ?? 0;
                      const inviteUrl = `${window.location.origin}/?invite=${g.inviteCode}`;

                      return (
                        <tr key={g.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition">
                          {/* Gym Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block">
                                  {g.name}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                                  Created {g.createdAt ? new Date(g.createdAt).toLocaleDateString() : 'Recent'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 6-Digit Access Code */}
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleCopyText(g.inviteCode, `code-${g.id}`, 'Access Code')}
                              className="font-mono font-black text-xs bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-lg inline-flex items-center gap-1.5 hover:bg-emerald-500/30 transition"
                              title="Click to copy 6-digit access code"
                            >
                              <span>{g.inviteCode}</span>
                              {copiedKey === `code-${g.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-60" />
                              )}
                            </button>
                          </td>

                          {/* Owner Name */}
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>{ownerName}</span>
                            </div>
                          </td>

                          {/* Owner Gmail */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-slate-800 dark:text-zinc-200 truncate max-w-[200px]">
                                {ownerEmail}
                              </span>
                              {ownerEmail !== 'N/A' && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(ownerEmail, `email-${g.id}`, 'Owner Gmail')}
                                  className="p-1 text-slate-400 hover:text-emerald-500 transition"
                                  title="Copy Owner Gmail"
                                >
                                  {copiedKey === `email-${g.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Owner Phone */}
                          <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-400">
                            {ownerPhone !== 'N/A' ? (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{ownerPhone}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-zinc-600">—</span>
                            )}
                          </td>

                          {/* Location */}
                          <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-400">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span>{g.city || 'City'}, {g.state || 'State'}</span>
                            </div>
                          </td>

                          {/* Members Count */}
                          <td className="py-3.5 px-4 text-center font-black text-slate-900 dark:text-white">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 font-mono">
                              {memberCount}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyText(inviteUrl, `link-${g.id}`, 'Client Invite Link')}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[11px] font-bold text-slate-700 dark:text-zinc-300 transition flex items-center gap-1"
                                title="Copy Client Join Link"
                              >
                                {copiedKey === `link-${g.id}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Link</span>
                                  </>
                                )}
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
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ALL PLATFORM MEMBERS DETAILS                       */}
      {/* ========================================================= */}
      {activeTab === 'MEMBERS' && (
        <div className="space-y-4 animate-fade-in">
          {/* Section Toolbar */}
          <div className="app-card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search members by name, email, phone, or gym name..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Filter by Gym */}
              <select
                value={selectedGymFilter}
                onChange={(e) => setSelectedGymFilter(e.target.value)}
                className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">🏢 All Gyms ({gyms.length})</option>
                {gyms.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.inviteCode})
                  </option>
                ))}
              </select>

              {/* Filter by Status */}
              <select
                value={memberStatusFilter}
                onChange={(e: any) => setMemberStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">🟢 Active Passes Only</option>
                <option value="INACTIVE">⚪ Inactive / Expired</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-bold hidden sm:inline">
                Showing {filteredMembers.length} of {members.length} members
              </span>
              <button
                type="button"
                onClick={handleExportMembersCsv}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:text-black text-xs font-black transition flex items-center gap-2 shadow-sm active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Members (CSV)</span>
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="app-card rounded-3xl overflow-hidden border border-slate-200 dark:border-zinc-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-900/90 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Member Athlete</th>
                    <th className="py-3.5 px-4">Contact Details</th>
                    <th className="py-3.5 px-4">Assigned Gym & Code</th>
                    <th className="py-3.5 px-4">Membership Plan</th>
                    <th className="py-3.5 px-4">Pass Status</th>
                    <th className="py-3.5 px-4">Enrolled Date</th>
                    <th className="py-3.5 px-4">Access Expiry</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                        <Users className="w-10 h-10 mx-auto stroke-1 opacity-50 mb-2" />
                        <p className="text-sm font-bold text-slate-600 dark:text-zinc-400">No Members Found</p>
                        <p className="text-xs mt-0.5">Try adjusting search keywords or gym filters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m) => {
                      const isActive = m.status === 'ACTIVE';
                      const planTitle = m.planName || m.latestSubscription?.planName || 'Monthly Pro Access';
                      const priceVal = m.price || m.latestSubscription?.price || 65;

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition">
                          {/* Member Athlete */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                {m.fullName?.charAt(0) || 'M'}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block">
                                  {m.fullName}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
                                  {m.role || 'MEMBER'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact Details */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs text-slate-800 dark:text-zinc-200">
                                  {m.email}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(m.email, `m-email-${m.id}`, 'Member Email')}
                                  className="p-0.5 text-slate-400 hover:text-emerald-500 transition"
                                  title="Copy Email"
                                >
                                  {copiedKey === `m-email-${m.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              {m.phone && (
                                <p className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{m.phone}</span>
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Assigned Gym & Code */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {m.gymName || 'Unassigned'}
                              </span>
                              {m.gymInviteCode && (
                                <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                                  Code: {m.gymInviteCode}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Membership Plan */}
                          <td className="py-3.5 px-4">
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {planTitle}
                              </span>
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-black">
                                ${priceVal}/mo
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active Pass
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* Enrolled Date */}
                          <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-400">
                            {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A'}
                          </td>

                          {/* Access Expiry */}
                          <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-400 font-mono">
                            {m.endDate ? new Date(m.endDate).toLocaleDateString() : '30-Day Pass'}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyText(m.email, `m-copy-${m.id}`, 'Member Email')}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[11px] font-bold text-slate-700 dark:text-zinc-300 transition inline-flex items-center gap-1"
                                title="Copy Email"
                              >
                                {copiedKey === `m-copy-${m.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span>Copy</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMember(m.id, m.fullName || m.email)}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-[11px] font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 transition inline-flex items-center gap-1"
                                title="Permanently delete member"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
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
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE GYM WORKSPACE & PROVISION OWNER             */}
      {/* ========================================================= */}
      {isCreateGymModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="app-card w-full max-w-lg p-6 sm:p-7 relative max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-zinc-800 shadow-2xl">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsCreateGymModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white dark:text-black shadow-sm">
                <Building2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Create Gym Workspace
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Provision an isolated SaaS gym workspace with unique ID & owner Gmail
                </p>
              </div>
            </div>

            {/* Success State */}
            {createdGymResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-black text-sm">Gym Workspace Successfully Created!</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-300">
                    The gym workspace and owner credentials have been generated and isolated.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-zinc-400 font-sans">Gym Name:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{createdGymResult.gym.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-zinc-400 font-sans">6-Digit Access Code:</span>
                    <span className="font-black text-sm bg-emerald-500 text-black px-2 py-0.5 rounded">
                      {createdGymResult.gym.inviteCode}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-zinc-400 font-sans">Owner Login Gmail:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{createdGymResult.user.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-zinc-400 font-sans">Initial Password:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{createdGymResult.password}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyGymCredentials}
                    className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-slate-800 dark:text-zinc-200 transition flex items-center justify-center gap-1.5"
                  >
                    {copiedGymCreds ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedGymCreds ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateGymModalOpen(false);
                      setCreatedGymResult(null);
                    }}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:text-black font-black text-xs uppercase tracking-wider transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateGymSubmit} className="space-y-4">
                {gymCreationError && (
                  <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>{gymCreationError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Gym Business Name *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. IronVault Apex Downtown"
                      value={gymFormName}
                      onChange={(e) => setGymFormName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        6-Digit Access Code *
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomGymCode}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        🎲 Random
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        maxLength={8}
                        placeholder="100003"
                        value={gymFormCode}
                        onChange={(e) => setGymFormCode(e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Owner Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="Sarah Jenkins"
                        value={gymFormOwnerName}
                        onChange={(e) => setGymFormOwnerName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Owner Gmail ID (For Login & OTP Reset) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="owner.gym@gmail.com"
                      value={gymFormEmail}
                      onChange={(e) => setGymFormEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    Password recovery codes (OTP) will be dispatched directly to this Gmail ID.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        Initial Password *
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        ⚡ Generate
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        minLength={6}
                        placeholder="Min 6 characters"
                        value={gymFormPassword}
                        onChange={(e) => setGymFormPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Owner Phone (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={gymFormPhone}
                        onChange={(e) => setGymFormPhone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Physical Facility Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. 500 Grand Avenue, Suite 100"
                      value={gymFormAddress}
                      onChange={(e) => setGymFormAddress(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. New York"
                      value={gymFormCity}
                      onChange={(e) => setGymFormCity(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NY"
                      value={gymFormState}
                      onChange={(e) => setGymFormState(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingGym}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:text-black font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg active:scale-98 disabled:opacity-50"
                  >
                    {isSubmittingGym ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Provisioning Gym & Owner...</span>
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
