import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  DollarSign,
  Users,
  Activity,
  MapPin,
  Clock,
  CheckCircle2,
  RefreshCw,
  Filter,
  AlertTriangle,
  Zap,
  Flame,
  UserPlus,
  User,
  CreditCard,
  Building2,
  Search,
  Sparkles,
  LogOut,
  Timer
} from 'lucide-react';
import { api } from '../services/api';
import { Facility } from '../types';
import { getSocket } from '../services/socket';
import { AccountCreationModal } from '../components/AccountCreationModal';

export const SuperAdminDashboard: React.FC = () => {
  const [facility, setFacility] = useState<Facility | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalRevenue, setTotalRevenue] = useState<number>(24850);
  const [members, setMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [activeOnFloor, setActiveOnFloor] = useState<any[]>([]);
  const [departedToday, setDepartedToday] = useState<any[]>([]);
  const [activeFloorTab, setActiveFloorTab] = useState<'ON_FLOOR' | 'DEPARTED'>('ON_FLOOR');
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [facRes, membersRes, attRes, devRes] = await Promise.all([
        api.getFacilities(),
        api.getMembers(),
        api.getLiveAttendance(),
        api.getDeviceRequests('PENDING')
      ]);

      if (facRes.facilities && facRes.facilities.length > 0) {
        setFacility(facRes.facilities[0]);
      }

      if (membersRes.members) {
        setMembers(membersRes.members);
        const calcRevenue = membersRes.members.reduce((acc: number, m: any) => {
          return acc + (m.latestSubscription?.price || 0);
        }, 0);
        if (calcRevenue > 0) setTotalRevenue(calcRevenue + 1200);
      }

      setRecentAttendance(attRes.entries || []);
      setActiveOnFloor(attRes.activeOnFloor || []);
      setDepartedToday(attRes.departedToday || []);
      setPendingRequests(devRes.requests || []);
    } catch (e) {
      console.error('Failed to load Super Admin dashboard:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const socket = getSocket();
    const handleRefresh = () => {
      loadData();
    };

    socket.on('attendance:new_entry', handleRefresh);
    socket.on('attendance:member_exited', handleRefresh);
    socket.on('attendance:live_feed_exit', handleRefresh);
    socket.on('alert:multi_device', handleRefresh);
    socket.on('alert:failed_access', handleRefresh);

    return () => {
      socket.off('attendance:new_entry', handleRefresh);
      socket.off('attendance:member_exited', handleRefresh);
      socket.off('attendance:live_feed_exit', handleRefresh);
      socket.off('alert:multi_device', handleRefresh);
      socket.off('alert:failed_access', handleRefresh);
    };
  }, []);

  const handleDeskCheckout = async (entryId: string, memberName: string) => {
    try {
      setCheckingOutId(entryId);
      const res = await api.deskCheckoutMember(entryId);
      setActionNotice(res.message || `${memberName} checked out successfully.`);
      await loadData();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      console.error('Failed desk checkout:', err);
      setActionNotice(err.message || 'Error checking out member.');
    } finally {
      setCheckingOutId(null);
    }
  };

  const handleApproveVisit = async (id: string) => {
    try {
      await api.approveDeviceRequest(id, 'Approved by Club Owner');
      setActionNotice('Extra visit approved! Member account restored.');
      loadData();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      console.error('Failed to approve request:', err);
    }
  };

  // Filtered members
  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.fullName?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* 1. CLEAN EXECUTIVE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Facility Management
            </h1>
            <span className="badge-active-green text-[10px] py-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {facility?.name || 'IronVault Central Downtown'} • Simplified activity and member administration
          </p>
        </div>

        {/* Primary Action: 1-Click Create Account */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black font-black text-xs transition shadow-md shadow-emerald-500/20 flex items-center gap-2 active:scale-95"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>➕ Create Account</span>
          </button>
        </div>
      </div>

      {/* 2. UNCLUTTERED KPI OVERVIEW (4 High-Impact Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Live on Floor */}
        <div className="app-card p-5 space-y-2 border-2 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">
              Live On Floor
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {activeOnFloor.length}
            </span>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Athletes Inside Now
            </p>
          </div>
        </div>

        {/* Metric 2: Active Passes */}
        <div className="app-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">
              Active Passes
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
              Registered Members
            </p>
          </div>
        </div>

        {/* Metric 3: Today's Scans */}
        <div className="app-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">
              Today's Scans
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {recentAttendance.length}
            </span>
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Arrivals Today
            </p>
          </div>
        </div>

        {/* Metric 4: Monthly Billed Revenue */}
        <div className="app-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">
              Monthly Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              ${totalRevenue.toLocaleString()}
            </span>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Passes & Billing
            </p>
          </div>
        </div>
      </div>

      {/* 3. DUAL COLUMN WORKFLOW: LIVE ATTENDANCE & PENDING REVIEWS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Live Member Activity Stream */}
        <div className="lg:col-span-2 space-y-4">
          <div className="app-card p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveFloorTab('ON_FLOOR')}
                  className={`py-1.5 px-3 rounded-xl font-black text-xs transition flex items-center gap-1.5 ${
                    activeFloorTab === 'ON_FLOOR'
                      ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>🟢 Live On Floor ({activeOnFloor.length})</span>
                </button>

                <button
                  onClick={() => setActiveFloorTab('DEPARTED')}
                  className={`py-1.5 px-3 rounded-xl font-black text-xs transition flex items-center gap-1.5 ${
                    activeFloorTab === 'DEPARTED'
                      ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>🏁 Departed Today ({departedToday.length})</span>
                </button>
              </div>

              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                {recentAttendance.length} total visits today
              </span>
            </div>

            {/* Tab 1: Live on Floor */}
            {activeFloorTab === 'ON_FLOOR' && (
              activeOnFloor.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 dark:text-zinc-500 space-y-2">
                  <Users className="w-8 h-8 mx-auto stroke-1 opacity-60" />
                  <p>No athletes currently on the gym floor.</p>
                  <p className="text-[11px]">When members scan the entrance QR code, they appear here with an elapsed timer.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {activeOnFloor.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          {item.user?.fullName?.charAt(0) || 'M'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {item.user?.fullName || 'Athlete Member'}
                            </span>
                            <span className="badge-active-green text-[9px] py-0 px-1.5">
                              Active Inside
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                            {item.user?.email || 'Passholder'} • Started {new Date(item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                          <Timer className="w-3 h-3 animate-spin-slow" />
                          {item.elapsedMinutes || 1}m
                        </span>

                        <button
                          onClick={() => handleDeskCheckout(item.id, item.user?.fullName || 'Member')}
                          disabled={checkingOutId === item.id}
                          className="py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-zinc-300 hover:text-amber-700 dark:hover:text-amber-300 border border-slate-200 dark:border-zinc-700 font-bold text-[11px] transition flex items-center gap-1 active:scale-95"
                          title="Desk checkout"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>{checkingOutId === item.id ? 'Exiting...' : 'Check Out'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Tab 2: Departed Sessions */}
            {activeFloorTab === 'DEPARTED' && (
              departedToday.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 dark:text-zinc-500 space-y-2">
                  <Clock className="w-8 h-8 mx-auto stroke-1 opacity-60" />
                  <p>No completed sessions recorded yet today.</p>
                  <p className="text-[11px]">When members finish their workouts and scan the exit gate, their session history appears here.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {departedToday.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                          {item.user?.fullName?.charAt(0) || 'M'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {item.user?.fullName || 'Athlete Member'}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                              Completed
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                            {item.exitDeviceId?.includes('DESK') ? 'Desk Checkout' : 'Exit Turnstile'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-black text-slate-800 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg">
                          <Clock className="w-3 h-3 text-emerald-500" />
                          {item.sessionDurationMinutes || 45} mins
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 block mt-0.5">
                          {new Date(item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(item.exitedAt || item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Members Table */}
          <div className="app-card p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Registered Accounts Directory
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Manage members, fitness trainers, and staff credentials
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by name, email, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-64"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 max-h-72 overflow-y-auto">
              {filteredMembers.map((m) => (
                <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs">
                      {m.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {m.fullName}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                        {m.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        m.role === 'SUPER_ADMIN'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : m.role === 'TRAINER'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                          : m.role === 'MANAGER'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {m.role === 'SUPER_ADMIN'
                        ? '👑 Owner'
                        : m.role === 'TRAINER'
                        ? '🏋️ Trainer'
                        : m.role === 'MANAGER'
                        ? '🧑‍💼 Staff'
                        : '🏃 Member'}
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      {m.latestSubscription?.planName || 'Active Pass'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Daily Visit Review Queue & Quick Controls */}
        <div className="space-y-4">
          {/* Visitor Review & Overrides Box */}
          <div className="app-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                Extra Access Approvals
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  pendingRequests.length > 0
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {pendingRequests.length} Pending
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Members requesting an extra workout session today beyond the daily 1-visit policy.
            </p>

            {pendingRequests.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto opacity-70" />
                <p>All clear! Zero pending approval requests.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2 text-xs"
                  >
                    <div>
                      <span className="font-black text-slate-900 dark:text-white block">
                        {req.user?.fullName}
                      </span>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                        {req.adminNotes || 'Attempted 2nd visit today'}
                      </span>
                    </div>

                    <div className="pt-1 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleApproveVisit(req.id)}
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black font-black text-xs transition shadow-sm"
                      >
                        ✓ 1-Click Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="app-card p-5 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              ⚡ Admin Shortcuts
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => setIsAccountModalOpen(true)}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-zinc-800 text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <UserPlus className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      Add New Account
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                      Member, Trainer, or Staff
                    </span>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Account Creation Modal */}
      <AccountCreationModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
};
