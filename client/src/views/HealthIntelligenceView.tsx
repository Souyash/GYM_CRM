import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartPulse,
  Download,
  UserPlus,
  Search,
  Filter,
  Activity,
  Target,
  Share2,
  AlertTriangle,
  Scale,
  Calendar,
  MapPin,
  CheckCircle2,
  X,
  FileSpreadsheet,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  User,
  Phone,
  Mail,
  Dumbbell,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { HealthIntelligenceSummary, HealthMemberRecord, MemberHealthProfile } from '../types';
import { MemberOnboardingModal } from '../components/MemberOnboardingModal';

export const HealthIntelligenceView: React.FC = () => {
  const [summary, setSummary] = useState<HealthIntelligenceSummary | null>(null);
  const [members, setMembers] = useState<HealthMemberRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('ALL');
  const [selectedReferral, setSelectedReferral] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL');

  // Modals
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [inspectingMember, setInspectingMember] = useState<HealthMemberRecord | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [sumRes, memRes] = await Promise.all([
        api.getHealthSummary(),
        api.getHealthMembers({
          search: searchTerm || undefined,
          goal: selectedGoal !== 'ALL' ? selectedGoal : undefined,
          referralSource: selectedReferral !== 'ALL' ? selectedReferral : undefined,
          condition: selectedCondition !== 'ALL' ? selectedCondition : undefined
        })
      ]);

      setSummary(sumRes.summary || null);
      setMembers(memRes.members || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load health intelligence data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedGoal, selectedReferral, selectedCondition]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await api.downloadHealthCsv();
    } catch (err: any) {
      alert(err.message || 'Could not export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  // Extract condition list for chips
  const parseConditions = (conditionsStr?: string): string[] => {
    if (!conditionsStr) return [];
    try {
      const parsed = JSON.parse(conditionsStr);
      return Array.isArray(parsed) ? parsed : [conditionsStr];
    } catch {
      return [conditionsStr];
    }
  };

  const getBmiBadge = (bmi?: number) => {
    if (!bmi) return null;
    if (bmi < 18.5) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          {bmi} • Underweight
        </span>
      );
    }
    if (bmi < 25) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          {bmi} • Normal
        </span>
      );
    }
    if (bmi < 30) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
          {bmi} • Overweight
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
        {bmi} • Obese
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
              <HeartPulse className="w-6 h-6" />
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Health Intelligence & Lead Hub
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                Marketing Intelligence
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
            Demographic, physiological, and marketing intelligence repository. Analyze lead goals,
            acquisition channels, health conditions, and export high-conversion targeting datasets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold rounded-xl text-xs border border-zinc-700 shadow flex items-center gap-2 transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{isExporting ? 'Exporting...' : 'Export Marketing CSV'}</span>
          </button>

          <button
            onClick={() => setIsOnboardOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold rounded-xl text-xs shadow-lg flex items-center gap-2 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard Member & Health Sheet</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Profiles */}
        <div className="p-4 bg-zinc-900/60 border border-zinc-800/90 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Onboarded Leads</span>
            <User className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {summary?.totalProfiles ?? 0}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            {summary?.onboardingCompletionRate ?? 0}% of all members
          </div>
        </div>

        {/* Top Goal */}
        <div className="p-4 bg-zinc-900/60 border border-zinc-800/90 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Top Fitness Goal</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 truncate">
            {summary?.goalsBreakdown?.[0]?.goal || 'None yet'}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            {summary?.goalsBreakdown?.[0]?.percentage ?? 0}% of total leads
          </div>
        </div>

        {/* Top Acquisition Channel */}
        <div className="p-4 bg-zinc-900/60 border border-zinc-800/90 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Top Lead Source</span>
            <Share2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-lg font-bold text-sky-400 truncate">
            {summary?.referralBreakdown?.[0]?.source || 'None'}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            {summary?.referralBreakdown?.[0]?.percentage ?? 0}% acquisition ROI
          </div>
        </div>

        {/* Avg BMI */}
        <div className="p-4 bg-zinc-900/60 border border-zinc-800/90 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Average BMI</span>
            <Scale className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">
            {summary?.averageBmi ?? 'N/A'}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Avg Age: {summary?.averageAge ?? 'N/A'} yrs
          </div>
        </div>

        {/* Medical / Injury Flags */}
        <div className="p-4 bg-zinc-900/60 border border-zinc-800/90 rounded-2xl col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Medical Alerts</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">
            {summary?.medicalAlertCount ?? 0}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Require specialized trainer care
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Goals Distribution */}
        <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" /> Goal Demand Demographics
            </h3>
            <span className="text-[11px] text-zinc-400">Target campaigns</span>
          </div>

          <div className="space-y-3">
            {summary?.goalsBreakdown && summary.goalsBreakdown.length > 0 ? (
              summary.goalsBreakdown.slice(0, 5).map((g) => (
                <div key={g.goal} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-medium truncate">{g.goal}</span>
                    <span className="text-amber-400 font-bold">{g.percentage}% ({g.count})</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${g.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 py-6 text-center">No goal data recorded yet.</p>
            )}
          </div>
        </div>

        {/* 2. Referral / Lead Sources */}
        <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-sky-400" /> Marketing Acquisition Channels
            </h3>
            <span className="text-[11px] text-zinc-400">Channel ROI</span>
          </div>

          <div className="space-y-3">
            {summary?.referralBreakdown && summary.referralBreakdown.length > 0 ? (
              summary.referralBreakdown.slice(0, 5).map((r) => (
                <div key={r.source} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-medium truncate">{r.source}</span>
                    <span className="text-sky-400 font-bold">{r.percentage}% ({r.count})</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${r.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 py-6 text-center">No referral channels recorded.</p>
            )}
          </div>
        </div>

        {/* 3. Clinical & Health Conditions */}
        <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" /> Top Health Conditions Reported
            </h3>
            <span className="text-[11px] text-zinc-400">Diet & Trainer Niche</span>
          </div>

          <div className="space-y-3">
            {summary?.conditionsBreakdown && summary.conditionsBreakdown.length > 0 ? (
              summary.conditionsBreakdown.slice(0, 5).map((c) => (
                <div key={c.condition} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-medium truncate">{c.condition}</span>
                    <span className="text-rose-400 font-bold">{c.percentage}% ({c.count})</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 py-6 text-center">No conditions reported by members.</p>
            )}
          </div>
        </div>
      </div>

      {/* Filterable Member Records Table */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5">
        {/* Table Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search member name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Goal Filter */}
            <select
              value={selectedGoal}
              onChange={(e) => setSelectedGoal(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Goals</option>
              <option value="Weight Loss & Fat Burn">Weight Loss</option>
              <option value="Muscle Building & Hypertrophy">Muscle Gain</option>
              <option value="Body Transformation">Transformation</option>
              <option value="Stamina & Endurance">Stamina</option>
              <option value="Strength & Power">Strength</option>
              <option value="General Fitness & Health">General Fitness</option>
              <option value="Rehab & Mobility">Rehab & Mobility</option>
            </select>

            {/* Referral Filter */}
            <select
              value={selectedReferral}
              onChange={(e) => setSelectedReferral(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Lead Sources</option>
              <option value="Instagram / Social Media">Instagram / Social</option>
              <option value="Friend / Member Referral">Friend / Referral</option>
              <option value="Walk-in / Direct Visit">Walk-in</option>
              <option value="Google Search / Maps">Google Search</option>
              <option value="Flyer / Outdoor Banner">Flyer / Banner</option>
              <option value="Other">Other</option>
            </select>

            {/* Refresh */}
            <button
              onClick={fetchData}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 transition"
            >
              Apply Filter
            </button>
          </div>
        </div>

        {/* Member Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-semibold bg-zinc-950/40 uppercase tracking-wider">
                <th className="py-3 px-4">Member Lead</th>
                <th className="py-3 px-4">Age / Gender</th>
                <th className="py-3 px-4">Primary Goal</th>
                <th className="py-3 px-4">Body Metrics</th>
                <th className="py-3 px-4">Health Conditions</th>
                <th className="py-3 px-4">Acquisition Channel</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    <div className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
                      <span>Loading Member Health Intelligence Data...</span>
                    </div>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    No member records found matching your filters.
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const p = m.healthProfile;
                  const conditions = parseConditions(p?.healthConditions);

                  return (
                    <tr key={m.userId} className="hover:bg-zinc-800/30 transition">
                      {/* Name & Contact */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-amber-400 text-xs flex-shrink-0">
                            {m.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white hover:text-amber-400 transition cursor-pointer"
                              onClick={() => setInspectingMember(m)}
                            >
                              {m.fullName}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-2">
                              <span>{m.email}</span>
                              {m.phone && (
                                <>
                                  <span>•</span>
                                  <span>{m.phone}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Age & Gender */}
                      <td className="py-3 px-4">
                        <div className="text-zinc-200">
                          {p?.age ? `${p.age} yrs` : '—'}
                        </div>
                        <div className="text-[11px] text-zinc-400">{p?.gender || 'Not specified'}</div>
                      </td>

                      {/* Goal */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-amber-400">
                          {p?.primaryGoal || 'General Fitness'}
                        </div>
                        {p?.targetTimeline && (
                          <div className="text-[10px] text-zinc-400">
                            Timeline: {p.targetTimeline}
                          </div>
                        )}
                      </td>

                      {/* Body Metrics & BMI */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-200 font-medium">
                            {p?.currentWeightKg ? `${p.currentWeightKg} kg` : '—'} / {p?.heightCm ? `${p.heightCm} cm` : '—'}
                          </span>
                        </div>
                        <div className="mt-1">
                          {p?.bmi ? getBmiBadge(p.bmi) : <span className="text-[11px] text-zinc-500">BMI: N/A</span>}
                        </div>
                      </td>

                      {/* Conditions */}
                      <td className="py-3 px-4">
                        {conditions.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {conditions.slice(0, 2).map((c) => (
                              <span
                                key={c}
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20"
                              >
                                {c}
                              </span>
                            ))}
                            {conditions.length > 2 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400">
                                +{conditions.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-500 text-[11px]">None reported</span>
                        )}
                      </td>

                      {/* Referral */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          {p?.referralSource || 'Walk-in'}
                        </span>
                        {p?.referralDetails && (
                          <div className="text-[10px] text-zinc-500 truncate max-w-[130px] mt-0.5">
                            {p.referralDetails}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setInspectingMember(m)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-semibold rounded-lg text-xs border border-zinc-700 transition"
                        >
                          Inspect Sheet
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

      {/* Member Full Sheet Modal Drawer */}
      {inspectingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-sm">
                  {inspectingMember.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {inspectingMember.fullName} — Complete Health Profile
                  </h3>
                  <div className="text-xs text-zinc-400 flex items-center gap-2">
                    <span>{inspectingMember.email}</span>
                    {inspectingMember.phone && (
                      <>
                        <span>•</span>
                        <span>{inspectingMember.phone}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setInspectingMember(null)}
                className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              {/* Communication Address */}
              <div>
                <h4 className="font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Address & Location
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/80">
                  <div>
                    <span className="text-zinc-500 block">House / Flat:</span>
                    <span className="text-zinc-200 font-medium">
                      {inspectingMember.healthProfile?.houseFlatStreet || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Locality / Area:</span>
                    <span className="text-zinc-200 font-medium">
                      {inspectingMember.healthProfile?.localityArea || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">City / State:</span>
                    <span className="text-zinc-200 font-medium">
                      {inspectingMember.healthProfile?.city || '—'}, {inspectingMember.healthProfile?.state || ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">PIN Code:</span>
                    <span className="text-zinc-200 font-medium">
                      {inspectingMember.healthProfile?.pinCode || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Body Measurements & Composition */}
              <div>
                <h4 className="font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5" /> Body Data & Composition
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/80">
                  <div>
                    <span className="text-zinc-500 block">Current Weight:</span>
                    <span className="text-white font-bold text-sm">
                      {inspectingMember.healthProfile?.currentWeightKg ?? '—'} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Height:</span>
                    <span className="text-white font-bold text-sm">
                      {inspectingMember.healthProfile?.heightCm ?? '—'} cm
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Calculated BMI:</span>
                    <span className="text-white font-bold text-sm">
                      {inspectingMember.healthProfile?.bmi ?? '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Body Fat:</span>
                    <span className="text-white font-bold text-sm">
                      {inspectingMember.healthProfile?.bodyFatPercentage ?? '—'}%
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Muscle Mass:</span>
                    <span className="text-zinc-200">
                      {inspectingMember.healthProfile?.muscleMassKg ?? '—'} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Waist:</span>
                    <span className="text-zinc-200">
                      {inspectingMember.healthProfile?.waistCm ?? '—'} cm
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Chest:</span>
                    <span className="text-zinc-200">
                      {inspectingMember.healthProfile?.chestCm ?? '—'} cm
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Hip:</span>
                    <span className="text-zinc-200">
                      {inspectingMember.healthProfile?.hipCm ?? '—'} cm
                    </span>
                  </div>
                </div>
              </div>

              {/* Health Conditions & Medical Checks */}
              <div>
                <h4 className="font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" /> Medical History & Conditions
                </h4>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80 space-y-3">
                  <div>
                    <span className="text-zinc-500 block mb-1">Diagnosed Conditions:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {parseConditions(inspectingMember.healthProfile?.healthConditions).length > 0 ? (
                        parseConditions(inspectingMember.healthProfile?.healthConditions).map((c) => (
                          <span
                            key={c}
                            className="px-2 py-0.5 rounded text-xs bg-rose-500/10 text-rose-300 border border-rose-500/30"
                          >
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-400">None reported</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                    <div>
                      <span className="text-zinc-500 block">Taking Regular Medication?</span>
                      <span className="text-zinc-200 font-medium">
                        {inspectingMember.healthProfile?.isTakingMedication
                          ? `Yes: ${inspectingMember.healthProfile.medicationDetails || 'Details not provided'}`
                          : 'No'}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">Doctor Advised Against Exercise?</span>
                      <span className="text-zinc-200 font-medium">
                        {inspectingMember.healthProfile?.advisedAvoidExercise
                          ? `Yes: ${inspectingMember.healthProfile.avoidExerciseDetails || 'Details not provided'}`
                          : 'No'}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">Past Major Surgeries?</span>
                      <span className="text-zinc-200 font-medium">
                        {inspectingMember.healthProfile?.hasMajorSurgery
                          ? `Yes: ${inspectingMember.healthProfile.surgeryDetails || 'Details not provided'}`
                          : 'No'}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">Prior Gym / Sports Injuries?</span>
                      <span className="text-zinc-200 font-medium">
                        {inspectingMember.healthProfile?.hasGymInjury
                          ? `Yes: ${inspectingMember.healthProfile.injuryDetails || 'Details not provided'}`
                          : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Goals & Marketing Target */}
              <div>
                <h4 className="font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> Fitness Goals & Marketing Referral
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/80">
                  <div>
                    <span className="text-zinc-500 block">Primary Goal:</span>
                    <span className="text-white font-bold">
                      {inspectingMember.healthProfile?.primaryGoal || 'General Fitness'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Target Weight:</span>
                    <span className="text-zinc-200 font-medium">
                      {inspectingMember.healthProfile?.targetWeightKg ? `${inspectingMember.healthProfile.targetWeightKg} kg` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Timeline:</span>
                    <span className="text-zinc-200 font-medium">
                      {inspectingMember.healthProfile?.targetTimeline || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Lead Referral Channel:</span>
                    <span className="text-sky-400 font-semibold">
                      {inspectingMember.healthProfile?.referralSource || 'Walk-in'}
                    </span>
                  </div>
                </div>

                {inspectingMember.healthProfile?.specificGoal && (
                  <div className="mt-2 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800 text-zinc-300">
                    <span className="text-zinc-500 block text-[11px] mb-0.5">Specific Focus Note:</span>
                    {inspectingMember.healthProfile.specificGoal}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-900/40 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setInspectingMember(null)}
                className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Close Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      <MemberOnboardingModal
        isOpen={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        onSuccess={() => {
          setIsOnboardOpen(false);
          fetchData();
        }}
      />
    </div>
  );
};

