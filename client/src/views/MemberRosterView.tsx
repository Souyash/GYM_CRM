import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  CreditCard,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Shield,
  Building2,
  Calendar,
  Phone,
  Mail,
  Filter,
  DollarSign
} from 'lucide-react';

interface MemberRosterViewProps {
  membersList: any[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleExportMembersCsv: () => void;
  handleDeleteMember: (id: string, name: string) => void;
  onOpenAddMember: () => void;
  onOpenRenewPass: () => void;
}

export const MemberRosterView: React.FC<MemberRosterViewProps> = ({
  membersList,
  searchQuery,
  setSearchQuery,
  handleExportMembersCsv,
  handleDeleteMember,
  onOpenAddMember,
  onOpenRenewPass
}) => {
  // Subpart Filter: 'ALL' | 'ACTIVE' | 'EXPIRED'
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');

  // Computed KPIs
  const totalCount = membersList.length;
  const activeCount = useMemo(
    () => membersList.filter((m) => m.isAccessGranted).length,
    [membersList]
  );
  const expiredCount = totalCount - activeCount;
  const activeRevenueEstimate = useMemo(() => {
    return membersList.reduce((acc, m) => {
      if (m.isAccessGranted && m.latestSubscription?.price) {
        return acc + Number(m.latestSubscription.price);
      }
      return acc;
    }, 0);
  }, [membersList]);

  // Filtered members by tab
  const displayedMembers = useMemo(() => {
    return membersList.filter((m) => {
      if (filterTab === 'ACTIVE') return m.isAccessGranted;
      if (filterTab === 'EXPIRED') return !m.isAccessGranted;
      return true;
    });
  }, [membersList, filterTab]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-poppins">
      
      {/* ========================================================================= */}
      {/* SUBPART 1: HEADER & FAST ACTIONS                                          */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl app-card bg-gradient-to-r from-white via-white to-emerald-50/40 dark:from-[#0d0d10] dark:via-[#09090b] dark:to-emerald-950/20 border border-slate-200/80 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Desk Billing & Member Roster
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Issue zero-hardware turnstile passes, register athletes, and monitor memberships
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={onOpenAddMember}
            className="btn-primary-green flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Member Sign-Up</span>
          </button>
          <button
            type="button"
            onClick={onOpenRenewPass}
            className="btn-secondary-gym flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs border border-slate-200 dark:border-zinc-700 active:scale-95"
          >
            <CreditCard className="w-4 h-4" />
            <span>Renew Pass</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBPART 2: KPI SUMMARY CARDS                                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Members */}
        <div className="p-4 rounded-2xl bg-white dark:bg-carbon-900 border border-slate-200/80 dark:border-carbon-800 shadow-sm transition hover:border-slate-300 dark:hover:border-carbon-700">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-carbon-400 block">
            Total Athletes
          </span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
              {totalCount}
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-carbon-800 text-slate-600 dark:text-carbon-300 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Active Passes */}
        <div className="p-4 rounded-2xl bg-white dark:bg-carbon-900 border border-volt-500/30 dark:border-volt-500/25 shadow-sm transition hover:border-volt-500/50">
          <span className="text-[10px] uppercase font-bold tracking-wider text-volt-600 dark:text-volt-400 block">
            Active Turnstile Access
          </span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-volt-600 dark:text-volt-400">
              {activeCount}
            </span>
            <div className="w-9 h-9 rounded-xl bg-volt-500/10 text-volt-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Expired / Due */}
        <div className="p-4 rounded-2xl bg-white dark:bg-carbon-900 border border-rose-500/30 dark:border-rose-500/25 shadow-sm transition hover:border-rose-500/50">
          <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400 block">
            Expired / Renewal Due
          </span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-rose-600 dark:text-rose-400">
              {expiredCount}
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Monthly Estimate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-carbon-900 border border-slate-200/80 dark:border-carbon-800 shadow-sm transition hover:border-slate-300 dark:hover:border-carbon-700">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-carbon-400 block">
            Active MRR Run-Rate
          </span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
              ${activeRevenueEstimate.toLocaleString()}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBPART 3: SEGMENTED FILTER & SEARCH TOOLBAR                             */}
      {/* ========================================================================= */}
      <div className="app-card rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 dark:border-carbon-800 dark:bg-carbon-900">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-carbon-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-carbon-950/60">
          
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-carbon-800 rounded-2xl self-start">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filterTab === 'ALL'
                  ? 'bg-white dark:bg-carbon-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-carbon-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>All Athletes</span>
              <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded bg-slate-100 dark:bg-carbon-800 font-bold">
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filterTab === 'ACTIVE'
                  ? 'bg-volt-500 text-black shadow-sm font-black'
                  : 'text-slate-600 dark:text-carbon-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Active Passes</span>
              <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded bg-volt-600/20 text-volt-950 dark:text-black font-black">
                {activeCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('EXPIRED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filterTab === 'EXPIRED'
                  ? 'bg-rose-500 text-white shadow-sm font-black'
                  : 'text-slate-600 dark:text-carbon-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Expired</span>
              <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded bg-rose-600/20 text-rose-900 dark:text-rose-100 font-bold">
                {expiredCount}
              </span>
            </button>
          </div>

          {/* Search & CSV Export */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-carbon-400" />
              <input
                type="text"
                placeholder="Search athlete, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white dark:bg-carbon-800 border border-slate-200 dark:border-carbon-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-carbon-400 w-full focus:outline-none focus:border-volt-500 shadow-sm transition"
              />
            </div>

            <button
              type="button"
              onClick={handleExportMembersCsv}
              disabled={membersList.length === 0}
              className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-carbon-800 dark:hover:bg-carbon-700 text-slate-700 dark:text-carbon-200 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-carbon-700 transition disabled:opacity-40 whitespace-nowrap shadow-sm active:scale-95"
              title="Export gym members roster to CSV file"
            >
              <Download className="w-3.5 h-3.5 text-volt-600 dark:text-volt-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUBPART 4: RESPONSIVE MEMBER DIRECTORY (Cards on Mobile, Table on Desktop) */}
        {/* ========================================================================= */}
        
        {/* A. Mobile Cards View (< md screens) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-carbon-800">
          {displayedMembers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-carbon-400">
              No athletes found in this filter category.
            </div>
          ) : (
            displayedMembers.map((m) => (
              <div key={m.id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-carbon-850/40 transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-black text-sm text-slate-900 dark:text-white block">
                      {m.fullName}
                    </span>
                    <span className="font-mono tabular-nums text-[11px] text-slate-400 dark:text-carbon-400">
                      IV-{m.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono tracking-wider ${
                      m.isAccessGranted
                        ? 'bg-volt-500/15 text-volt-600 dark:text-volt-400 border border-volt-500/30'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {m.isAccessGranted ? 'Active Access' : 'Expired'}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-600 dark:text-carbon-300">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-carbon-400">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{m.email}</span>
                  </div>
                  {m.phone && (
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-carbon-400 font-mono tabular-nums">
                      <Phone className="w-3 h-3" />
                      <span>{m.phone}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-carbon-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-carbon-400 block uppercase font-bold tracking-wider">Pass Plan</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {m.latestSubscription?.planName || 'No Active Pass'}
                    </span>
                    {m.latestSubscription?.endDate && (
                      <span className="text-[10px] text-slate-400 dark:text-carbon-400 block font-mono tabular-nums">
                        Until {new Date(m.latestSubscription.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteMember(m.id, m.fullName)}
                    className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition active:scale-95"
                    title="Remove Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* B. Desktop Table View (>= md screens) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 dark:bg-carbon-950/80 text-slate-500 dark:text-carbon-400 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-carbon-800 font-bold">
              <tr>
                <th className="py-3.5 px-4">Athlete</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Membership Plan</th>
                <th className="py-3.5 px-4">Membership ID</th>
                <th className="py-3.5 px-4">Access Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-carbon-800">
              {displayedMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 dark:text-carbon-400 font-medium">
                    No athletes found matching your search or filter.
                  </td>
                </tr>
              ) : (
                displayedMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-carbon-850/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-carbon-800 text-slate-700 dark:text-carbon-200 font-black text-xs flex items-center justify-center">
                          {m.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="block font-bold text-slate-900 dark:text-white">{m.fullName}</span>
                          <span className="block text-[10px] text-slate-400 dark:text-carbon-400">
                            {m.gym?.name || 'IronVault Member'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-carbon-300 text-xs whitespace-nowrap">
                      <div>{m.email}</div>
                      {m.phone && (
                        <div className="text-[10px] text-slate-400 dark:text-carbon-400 font-mono tabular-nums">{m.phone}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                      {m.latestSubscription ? (
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {m.latestSubscription.planName}
                          </span>
                          <span className="block text-[10px] text-slate-500 dark:text-carbon-400 font-mono tabular-nums">
                            Valid until: {new Date(m.latestSubscription.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-carbon-500">No active pass</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-[11px] text-slate-600 dark:text-carbon-300 whitespace-nowrap font-bold">
                      IV-{m.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase font-mono tracking-wider ${
                          m.isAccessGranted
                            ? 'bg-volt-500/15 text-volt-600 dark:text-volt-400 border border-volt-500/30'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {m.isAccessGranted ? 'Active Access' : 'Expired / On Hold'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(m.id, m.fullName)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition inline-flex items-center gap-1.5 ml-auto active:scale-95"
                        title="Remove member from gym database"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
