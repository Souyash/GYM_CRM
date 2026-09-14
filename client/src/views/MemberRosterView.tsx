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
    <div className="space-y-6 max-w-6xl mx-auto font-['Poppins',sans-serif] font-poppins">
      
      {/* ========================================================================= */}
      {/* SUBPART 1: HEADER & FAST ACTIONS                                          */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[#0e1015] border border-white/10 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold font-['Poppins',sans-serif] uppercase text-white tracking-wide">
                Desk Billing & Member Roster
              </h1>
              <p className="text-xs text-white/50 mt-0.5">
                Issue turnstile passes, register athletes, and monitor memberships
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={onOpenAddMember}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-5 rounded-full bg-[#ccff00] hover:bg-[#b8e600] text-black font-black text-xs tracking-wide shadow-[0_0_20px_rgba(204,255,0,0.25)] transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Member Sign-Up</span>
          </button>
          <button
            type="button"
            onClick={onOpenRenewPass}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-5 rounded-full bg-[#121418] hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition active:scale-95"
          >
            <CreditCard className="w-4 h-4 text-[#ccff00]" />
            <span>Renew Pass</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBPART 2: KPI SUMMARY CARDS                                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Members */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0e1015] border border-white/10 shadow-lg hover:border-white/20 transition">
          <span className="text-[10px] uppercase font-black tracking-widest text-white/40 font-['Poppins',sans-serif] block">
            Total Athletes
          </span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black font-['Poppins',sans-serif] text-white">
              {totalCount}
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#121418] text-white/70 border border-white/5 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Active Passes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0e1015] border border-[#ccff00]/30 shadow-lg hover:border-[#ccff00]/50 transition">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#ccff00] font-['Poppins',sans-serif] block">
            Active Access
          </span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black font-['Poppins',sans-serif] text-[#ccff00]">
              {activeCount}
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Expired / Due */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0e1015] border border-rose-500/30 shadow-lg hover:border-rose-500/50 transition">
          <span className="text-[10px] uppercase font-black tracking-widest text-rose-400 font-['Poppins',sans-serif] block">
            Expired / Due
          </span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black font-['Poppins',sans-serif] text-rose-400">
              {expiredCount}
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Monthly Estimate */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0e1015] border border-white/10 shadow-lg hover:border-white/20 transition">
          <span className="text-[10px] uppercase font-black tracking-widest text-white/40 font-['Poppins',sans-serif] block">
            Active MRR Run-Rate
          </span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black font-['Poppins',sans-serif] text-white">
              ${activeRevenueEstimate.toLocaleString()}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBPART 3: SEGMENTED FILTER & SEARCH TOOLBAR                             */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-[#0e1015] border border-white/10 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0e1015]">
          
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[#121418] border border-white/5 rounded-full self-start">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 ${
                filterTab === 'ALL'
                  ? 'bg-[#ccff00] text-black font-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span>All Athletes</span>
              <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded-full font-bold ${
                filterTab === 'ALL' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/80'
              }`}>
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('ACTIVE')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 ${
                filterTab === 'ACTIVE'
                  ? 'bg-[#ccff00] text-black font-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span>Active Passes</span>
              <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded-full font-bold ${
                filterTab === 'ACTIVE' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/80'
              }`}>
                {activeCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('EXPIRED')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 ${
                filterTab === 'EXPIRED'
                  ? 'bg-rose-500 text-white font-black shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span>Expired</span>
              <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded-full font-bold ${
                filterTab === 'EXPIRED' ? 'bg-black/20 text-white' : 'bg-white/10 text-white/80'
              }`}>
                {expiredCount}
              </span>
            </button>
          </div>

          {/* Search & CSV Export */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search athlete, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#121418] border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/40 w-full focus:outline-none focus:border-[#ccff00] transition"
              />
            </div>

            <button
              type="button"
              onClick={handleExportMembersCsv}
              disabled={membersList.length === 0}
              className="py-2 px-4 rounded-full bg-[#121418] hover:bg-white/10 text-white font-bold text-xs flex items-center gap-1.5 border border-white/10 transition disabled:opacity-40 whitespace-nowrap shadow-sm active:scale-95"
              title="Export gym members roster to CSV file"
            >
              <Download className="w-3.5 h-3.5 text-[#ccff00]" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUBPART 4: RESPONSIVE MEMBER DIRECTORY (Cards on Mobile, Table on Desktop) */}
        {/* ========================================================================= */}
        
        {/* A. Mobile Cards View (< md screens) */}
        <div className="md:hidden divide-y divide-white/10 bg-[#0e1015]">
          {displayedMembers.length === 0 ? (
            <div className="p-8 text-center text-xs text-white/40">
              No athletes found in this filter category.
            </div>
          ) : (
            displayedMembers.map((m) => (
              <div key={m.id} className="p-4 space-y-3 hover:bg-white/[0.02] transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-sm text-white block">
                      {m.fullName}
                    </span>
                    <span className="font-mono tabular-nums text-[11px] text-white/40">
                      IV-{m.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono tracking-wider ${
                      m.isAccessGranted
                        ? 'bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {m.isAccessGranted ? 'Active Access' : 'Expired'}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-white/70">
                  <div className="flex items-center gap-1.5 text-white/50">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{m.email}</span>
                  </div>
                  {m.phone && (
                    <div className="flex items-center gap-1.5 text-white/50 font-mono tabular-nums">
                      <Phone className="w-3 h-3" />
                      <span>{m.phone}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-white/40 block uppercase font-bold tracking-wider">Pass Plan</span>
                    <span className="font-bold text-white">
                      {m.latestSubscription?.planName || 'No Active Pass'}
                    </span>
                    {m.latestSubscription?.endDate && (
                      <span className="text-[10px] text-white/40 block font-mono tabular-nums">
                        Until {new Date(m.latestSubscription.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteMember(m.id, m.fullName)}
                    className="p-2 rounded-full text-rose-400 hover:bg-rose-500/10 transition active:scale-95"
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
        <div className="hidden md:block overflow-x-auto bg-[#0e1015]">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#121418] text-white/50 uppercase text-[10px] tracking-wider border-b border-white/10 font-bold font-['Poppins',sans-serif]">
              <tr>
                <th className="py-3.5 px-4">Athlete</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Membership Plan</th>
                <th className="py-3.5 px-4">Membership ID</th>
                <th className="py-3.5 px-4">Access Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayedMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-white/40 font-medium">
                    No athletes found matching your search or filter.
                  </td>
                </tr>
              ) : (
                displayedMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#121418] text-[#ccff00] border border-white/10 font-black text-xs flex items-center justify-center">
                          {m.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="block font-bold text-white">{m.fullName}</span>
                          <span className="block text-[10px] text-white/40">
                            {m.gym?.name || 'Fidgit Member'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-white/70 text-xs whitespace-nowrap">
                      <div>{m.email}</div>
                      {m.phone && (
                        <div className="text-[10px] text-white/40 font-mono tabular-nums">{m.phone}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                      {m.latestSubscription ? (
                        <div>
                          <span className="font-bold text-white">
                            {m.latestSubscription.planName}
                          </span>
                          <span className="block text-[10px] text-white/40 font-mono tabular-nums">
                            Valid until: {new Date(m.latestSubscription.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-white/30">No active pass</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-[11px] text-white/60 whitespace-nowrap font-bold">
                      IV-{m.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase font-mono tracking-wider ${
                          m.isAccessGranted
                            ? 'bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {m.isAccessGranted ? 'Active Access' : 'Expired / On Hold'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(m.id, m.fullName)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-full text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition inline-flex items-center gap-1.5 ml-auto active:scale-95"
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
