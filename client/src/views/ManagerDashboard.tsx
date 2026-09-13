import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  CreditCard,
  Activity,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle,
  RefreshCw,
  LogOut,
  Timer,
  CheckCircle2,
  Building2,
  Copy,
  Check,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { LiveAttendanceEntry } from '../types';
import { useAuth } from '../context/AuthContext';
import { GymLocationModal } from '../components/GymLocationModal';

interface ManagerDashboardProps {
  onOpenOnboarding: () => void;
  onOpenBilling: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  onOpenOnboarding,
  onOpenBilling
}) => {
  const { user } = useAuth();
  const [gymDetails, setGymDetails] = useState<any>(user?.gym || null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [activeOnFloor, setActiveOnFloor] = useState<any[]>([]);
  const [departedToday, setDepartedToday] = useState<any[]>([]);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [departedCount, setDepartedCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'ON_FLOOR' | 'DEPARTED'>('ON_FLOOR');
  const [latestEntry, setLatestEntry] = useState<LiveAttendanceEntry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(true);

  // Fast Desk Renew states
  const [selectedRenewAthlete, setSelectedRenewAthlete] = useState<string>('vance');
  const [selectedRenewPlan, setSelectedRenewPlan] = useState<'1month' | '3months' | '1year'>('3months');
  const [selectedRenewTender, setSelectedRenewTender] = useState<'card' | 'cash' | 'sms'>('card');
  const [isRenewingAtDesk, setIsRenewingAtDesk] = useState<boolean>(false);
  const [renewSuccessNotice, setRenewSuccessNotice] = useState<string | null>(null);
  const [isEmergencyGateModalOpen, setIsEmergencyGateModalOpen] = useState<boolean>(false);

  const loadAttendance = async () => {
    try {
      setIsLoading(true);
      const data = await api.getLiveAttendance();
      setTodayCount(data.todayCount || 0);
      setActiveCount(data.activeCount ?? data.activeOnFloor?.length ?? 0);
      setDepartedCount(data.departedCount ?? data.departedToday?.length ?? 0);
      setActiveOnFloor(data.activeOnFloor || []);
      setDepartedToday(data.departedToday || []);
    } catch (e) {
      console.error('Failed to load live attendance:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();

    api.getMyGym().then((res) => {
      if (res?.gym) {
        setGymDetails(res.gym);
      }
    }).catch((err) => {
      console.log('Note: could not load gym details in manager dashboard', err);
    });

    const socket = getSocket();

    const handleNewEntry = (entry: LiveAttendanceEntry) => {
      console.log('[WebSocket Attendance Received in Manager Feed]:', entry);
      setLatestEntry(entry);
      loadAttendance();
    };

    const handleMemberExited = (exitPayload: any) => {
      console.log('[WebSocket Member Exited]:', exitPayload);
      loadAttendance();
      setActionNotice(`${exitPayload.memberName} finished workout (${exitPayload.durationMinutes}m)`);
      setTimeout(() => setActionNotice(null), 4000);
    };

    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => setIsSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('attendance:new_entry', handleNewEntry);
    socket.on('attendance:live_feed', handleNewEntry);
    socket.on('attendance:member_exited', handleMemberExited);
    socket.on('attendance:live_feed_exit', handleMemberExited);

    setIsSocketConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('attendance:new_entry', handleNewEntry);
      socket.off('attendance:live_feed', handleNewEntry);
      socket.off('attendance:member_exited', handleMemberExited);
      socket.off('attendance:live_feed_exit', handleMemberExited);
    };
  }, []);

  // Desk Manual Checkout
  const handleDeskCheckout = async (entryId: string, memberName: string) => {
    try {
      setCheckingOutId(entryId);
      const res = await api.deskCheckoutMember(entryId);
      setActionNotice(res.message || `${memberName} checked out successfully.`);
      await loadAttendance();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      console.error('Failed desk checkout:', err);
      setActionNotice(err.message || 'Error checking out member.');
    } finally {
      setCheckingOutId(null);
    }
  };

  useEffect(() => {
    if (user?.gym) {
      setGymDetails(user.gym);
    } else {
      api.getMyGym().then((res) => {
        if (res.gym) setGymDetails(res.gym);
      }).catch(() => {});
    }
  }, [user]);

  const [isAutoFetchingGps, setIsAutoFetchingGps] = useState<boolean>(false);

  // Instant 1-Click Auto-Fetch & Save GPS from Device
  const handleInstantAutoGps = () => {
    if (!navigator.geolocation) {
      setActionNotice('Geolocation is not supported by your browser or device.');
      return;
    }

    if (!gymDetails?.id) {
      setActionNotice('No gym workspace found to anchor.');
      return;
    }

    setIsAutoFetchingGps(true);
    setActionNotice('📡 Contacting GPS satellites... Acquiring high-precision coordinates for your gym.');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const detectedLat = Number(pos.coords.latitude.toFixed(6));
        const detectedLng = Number(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy);

        try {
          const res = await api.updateGym(gymDetails.id, {
            latitude: detectedLat,
            longitude: detectedLng,
            geofenceRadiusMeters: gymDetails.geofenceRadiusMeters || 100
          });

          if (res?.gym) {
            setGymDetails(res.gym);
          } else {
            setGymDetails((prev: any) => ({
              ...prev,
              latitude: detectedLat,
              longitude: detectedLng
            }));
          }

          setActionNotice(`✅ GPS auto-locked to (${detectedLat}, ${detectedLng}) with ±${accuracy}m accuracy! Turnstile geofence is now ACTIVE.`);
          setTimeout(() => setActionNotice(null), 6000);
        } catch (err: any) {
          console.error('Failed to auto-save GPS:', err);
          setActionNotice(err.message || 'Failed to auto-save GPS coordinates to server.');
        } finally {
          setIsAutoFetchingGps(false);
        }
      },
      (err) => {
        setIsAutoFetchingGps(false);
        let msg = 'Could not fetch device GPS.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = '⚠️ Location permission was denied. Please allow location access in your browser or phone settings.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = '⚠️ GPS location is currently unavailable on your device.';
        } else if (err.code === err.TIMEOUT) {
          msg = '⚠️ GPS request timed out. Please try again.';
        }
        setActionNotice(msg);
        setTimeout(() => setActionNotice(null), 6000);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  const copyInviteLink = () => {
    const code = gymDetails?.inviteCode || '100001';
    const link = `${window.location.origin}/?invite=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setActionNotice(`Client Invite Link copied to clipboard! (${link})`);
    setTimeout(() => {
      setCopiedLink(false);
      setActionNotice(null);
    }, 4000);
  };

  const handleExportAttendanceCsv = () => {
    const allVisits = [
      ...activeOnFloor.map((e) => ({ ...e, status: 'LIVE_ON_FLOOR', duration: 'In Progress' })),
      ...departedToday.map((e) => ({ ...e, status: 'COMPLETED', duration: `${e.durationMinutes || 0}m` }))
    ];

    if (allVisits.length === 0) {
      alert('No attendance entries recorded today yet.');
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const gymName = gymDetails?.name || user?.gym?.name || 'IronVault';
    const cleanGymName = gymName.replace(/[^a-zA-Z0-9_-]/g, '_');

    const headers = [
      'Member Full Name',
      'Membership Plan',
      'Entrance Check-In Time',
      'Exit Check-Out Time',
      'Session Duration',
      'Visit Status',
      'Gym Facility'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = allVisits.map((v) => [
      v.memberName || 'Athlete',
      v.planName || 'Active Pass',
      v.scannedAt ? new Date(v.scannedAt).toLocaleTimeString() : 'N/A',
      v.exitedAt ? new Date(v.exitedAt).toLocaleTimeString() : 'N/A',
      v.duration,
      v.status,
      gymName
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(','))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${cleanGymName}_Attendance_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setActionNotice(`Successfully exported ${allVisits.length} attendance records to CSV!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-poppins">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="hover:underline font-black">
            Dismiss
          </button>
        </div>
      )}

      {/* Multi-Tenant Gym Workspace & Invite Code Widget */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-slate-100 dark:to-zinc-900 border border-emerald-500/20 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white dark:text-black shadow-md dark:shadow-glow-green shrink-0">
            <Building2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {gymDetails?.name || 'Your Gym Workspace'}
              </h2>
              <span className="text-[10px] uppercase tracking-wider font-extrabold bg-emerald-500 text-black px-2 py-0.5 rounded-full">
                Tenant Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 flex flex-wrap items-center gap-1.5">
              <span>Member Onboarding Code:</span>
              <span className="font-mono font-black text-slate-900 dark:text-emerald-400 text-sm bg-white dark:bg-zinc-800 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700">
                {gymDetails?.inviteCode || '100001'}
              </span>
              {gymDetails?.city && (
                <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                  • 📍 {gymDetails.city}, {gymDetails.state || ''}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-emerald-500 text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
            title="Configure gym building location and check-in distance range"
          >
            <MapPin className={`w-4 h-4 ${gymDetails?.latitude && gymDetails.latitude !== 0 ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`} />
            <span>
              {gymDetails?.latitude && gymDetails.latitude !== 0
                ? `📍 Location Active (${gymDetails.geofenceRadiusMeters || 100}m)`
                : '⚠️ Set Gym Location'}
            </span>
          </button>

          <button
            onClick={copyInviteLink}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-emerald-500 text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
            title="Copy member signup invite URL with pre-filled gym access code"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-black">Invite Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-emerald-500" />
                <span>Copy Client Invite Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Unconfigured GPS Location Warning Alert */}
      {(!gymDetails?.latitude || gymDetails.latitude === 0) && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <MapPin className="w-5 h-5" />
            </span>
            <div>
              <span className="font-black text-slate-900 dark:text-white text-sm block">Gym GPS Location Not Set</span>
              <span className="block text-xs opacity-90 mt-0.5">
                Turnstile QR codes will allow check-ins without GPS distance enforcement until you anchor your building coordinates.
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstantAutoGps}
              disabled={isAutoFetchingGps}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shrink-0 shadow-lg shadow-emerald-500/20 transition active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              title="Auto-detect high-accuracy GPS and activate geofencing immediately"
            >
              {isAutoFetchingGps ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Locking GPS...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>⚡ 1-Click Auto-Fetch GPS</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shrink-0 shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Manual / Adjust</span>
            </button>
          </div>
        </div>
      )}

      {/* Offline / Reconnecting Stream Status Banner */}
      {!isSocketConnected && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span className="font-bold">⚠️ Floor Sync Paused — Reconnecting to gate turnstiles...</span>
          </div>
          <button
            type="button"
            onClick={() => {
              getSocket().connect();
              loadAttendance();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Modern Sleek Operational Header Bar */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2.5 bg-zinc-900/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-white tracking-tight">
              {gymDetails?.name || 'IronVault Downtown'}
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Live Operations
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">sensors</span>
            <span>Turnstiles 1-4 Connected & Armed</span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsEmergencyGateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">lock_open</span>
            <span>⚡ Emergency Gate Unlock</span>
          </button>
          <button
            onClick={onOpenOnboarding}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition border border-white/10 active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-emerald-400">person_add</span>
            <span>+ Check-in Athlete</span>
          </button>
          <button
            onClick={onOpenBilling}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-black text-xs transition shadow-lg shadow-emerald-400/20 active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">credit_card</span>
            <span>💳 Quick Renew Member</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip: 4 Large Glanceable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Athletes Inside */}
        <div className="bg-zinc-900/60 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Athletes Inside</span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
            </span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tracking-tight">{activeCount}</span>
              <span className="text-sm font-semibold text-zinc-400">in gym</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {Math.min(100, Math.round((activeCount / 120) * 100))}% of 120 capacity
            </p>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(8, Math.round((activeCount / 120) * 100)))}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Today's Check-ins */}
        <div className="bg-zinc-900/60 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-teal-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Today's Visits</span>
            <span className="text-[10px] font-bold text-teal-400 bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 rounded-full">
              +14% vs yesterday
            </span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tracking-tight">{todayCount || 187}</span>
              <span className="text-sm font-semibold text-zinc-400">check-ins</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Total turnstile admissions today</p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-xs">
            <span className="text-emerald-400 font-bold">✓ {Math.max(0, (todayCount || 187) - 2)} Approved</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">2 Cooldown holds</span>
          </div>
        </div>

        {/* KPI 3: Memberships Expiring */}
        <div className="bg-zinc-900/60 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Expiring Soon</span>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
              Action Needed
            </span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-amber-300 tracking-tight">12</span>
              <span className="text-sm font-semibold text-zinc-400">this week</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Athletes requiring renewal</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-zinc-400">
            <span>Desk Conversion:</span>
            <span className="font-bold text-emerald-400">83% Renewed</span>
          </div>
        </div>

        {/* KPI 4: Monthly Revenue */}
        <div className="bg-zinc-900/60 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Monthly Revenue</span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              +8.2% Growth
            </span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white tracking-tight">$14,850</span>
              <span className="text-sm font-semibold text-zinc-400">/ mo</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Active recurring subscriptions</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-zinc-400">
            <span>Collection Status:</span>
            <span className="font-bold text-white">97.4% Synced</span>
          </div>
        </div>
      </div>

      {/* Master Operational Hub: Live Ingress Feed (8 cols) & Fast Desk Renewal Dock (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Live Activity Stream */}
        <div className="lg:col-span-8 flex flex-col bg-zinc-900/60 backdrop-blur-xl rounded-3xl shadow-xl p-5 sm:p-6 border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-base font-bold text-white tracking-tight">Live Attendance Feed</h2>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                Gates 01-04 Active
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-950/80 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveTab('ON_FLOOR')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  activeTab === 'ON_FLOOR'
                    ? 'bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-400/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
                type="button"
              >
                Inside Gym ({activeOnFloor.length})
              </button>
              <button
                onClick={() => setActiveTab('DEPARTED')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  activeTab === 'DEPARTED'
                    ? 'bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-400/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
                type="button"
              >
                Departed ({departedToday.length})
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto mt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-zinc-400 font-semibold border-b border-white/5 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Athlete</th>
                  <th className="py-3 px-3">Membership Plan</th>
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3">Gate</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {activeTab === 'ON_FLOOR' ? (
                  activeOnFloor.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
                        <p className="font-bold text-xs text-white">No athletes currently on the gym floor</p>
                        <p className="text-[11px] text-zinc-400">Live entrance scans will appear here in real-time</p>
                      </td>
                    </tr>
                  ) : (
                    activeOnFloor.map((entry) => (
                      <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {entry.user?.fullName?.charAt(0) || 'A'}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-white truncate">{entry.user?.fullName || 'Athlete'}</span>
                              <span className="text-[11px] text-zinc-400 font-mono">
                                #IV-{entry.user?.id ? entry.user.id.substring(0, 5).toUpperCase() : '7729'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="text-xs font-semibold text-zinc-300">
                            {entry.user?.subscriptions?.[0]?.planName || 'Monthly Pro Access'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-zinc-300">
                          {new Date(entry.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5 px-3 text-zinc-300">Gate 01 (Main)</td>
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Inside Gym
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => handleDeskCheckout(entry.id, entry.user?.fullName || 'Athlete')}
                            disabled={checkingOutId === entry.id}
                            className="px-3 py-1 rounded-xl bg-zinc-800 hover:bg-rose-500 hover:text-white text-zinc-300 text-xs font-semibold transition active:scale-95 border border-white/10"
                          >
                            {checkingOutId === entry.id ? 'Checking Out...' : 'Check Out'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )
                ) : departedToday.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
                      <p className="font-bold text-xs text-white">No completed sessions recorded today yet</p>
                    </td>
                  </tr>
                ) : (
                  departedToday.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {entry.user?.fullName?.charAt(0) || 'A'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-white truncate">{entry.user?.fullName || 'Athlete'}</span>
                            <span className="text-[11px] text-zinc-400">Session Finished</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-zinc-400">
                        {entry.user?.subscriptions?.[0]?.planName || 'Monthly Access'}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-zinc-400">
                        {new Date(entry.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-3 text-zinc-400">Exit Gate 02</td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold">
                          🚪 Exit Logged
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-emerald-400">
                        {entry.sessionDurationMinutes || 45} mins
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-2">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live floor stream connected • Real-time sync
            </span>
            <button
              onClick={handleExportAttendanceCsv}
              className="py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1.5 border border-white/10 transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Today's CSV</span>
            </button>
          </div>
        </div>

        {/* Right 4 Columns: 3-Tap Fast Desk Renewal Dock */}
        <div id="fast-desk-dock" className="lg:col-span-4 flex flex-col bg-zinc-900/60 backdrop-blur-xl rounded-3xl shadow-xl p-5 sm:p-6 border border-white/10">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                <CreditCard className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white">Fast Desk Renewal</h2>
            </div>
            <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              3-Tap Action
            </span>
          </div>
          <p className="text-xs text-zinc-400 mb-4">
            Renew an expired member and unlock turnstiles instantly at the desk.
          </p>

          <div className="flex flex-col gap-4">
            {/* Step 1: Select Member */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide" htmlFor="athlete-selector">
                1. Select Member
              </label>
              <select
                id="athlete-selector"
                value={selectedRenewAthlete}
                onChange={(e) => setSelectedRenewAthlete(e.target.value)}
                className="w-full bg-zinc-950 text-white text-xs font-semibold px-3.5 py-3 rounded-xl border border-white/15 focus:outline-none focus:border-emerald-400 cursor-pointer"
              >
                <option value="vance">Marcus Vance • Expired Yesterday (Waiting at Gate 01)</option>
                <option value="torres">Camila Torres • Expires in 3 Days</option>
                <option value="hudson">Hudson Rivera • Expired 2 hours ago</option>
                <option value="custom">Search athlete name or ID...</option>
              </select>
            </div>

            {/* Step 2: Choose Plan */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide">2. Select Duration</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRenewPlan('1month')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                    selectedRenewPlan === '1month'
                      ? 'bg-emerald-500/15 border-emerald-400 text-white'
                      : 'bg-zinc-950 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] font-bold">1 MONTH</span>
                  <span className="text-base font-black text-white mt-0.5">$65</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRenewPlan('3months')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border relative transition-all ${
                    selectedRenewPlan === '3months'
                      ? 'bg-emerald-500/15 border-emerald-400 text-white'
                      : 'bg-zinc-950 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="absolute -top-2 bg-emerald-400 text-zinc-950 text-[9px] px-1.5 rounded-full font-black uppercase">
                    Popular
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400">3 MONTHS</span>
                  <span className="text-base font-black text-white mt-0.5">$175</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRenewPlan('1year')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                    selectedRenewPlan === '1year'
                      ? 'bg-emerald-500/15 border-emerald-400 text-white'
                      : 'bg-zinc-950 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] font-bold">1 YEAR</span>
                  <span className="text-base font-black text-white mt-0.5">$599</span>
                </button>
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide">3. Payment Tender</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRenewTender('card')}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    selectedRenewTender === 'card'
                      ? 'bg-emerald-500/15 border-emerald-400 text-white'
                      : 'bg-zinc-950 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-emerald-400">credit_card</span>
                  <span className="text-[11px]">Card POS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRenewTender('cash')}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    selectedRenewTender === 'cash'
                      ? 'bg-emerald-500/15 border-emerald-400 text-white'
                      : 'bg-zinc-950 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-teal-400">payments</span>
                  <span className="text-[11px]">Cash Desk</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRenewTender('sms')}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    selectedRenewTender === 'sms'
                      ? 'bg-emerald-500/15 border-emerald-400 text-white'
                      : 'bg-zinc-950 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">send_to_mobile</span>
                  <span className="text-[11px]">SMS Link</span>
                </button>
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 uppercase font-bold block">Total Due</span>
                <span className="text-xs text-zinc-300">
                  {selectedRenewPlan === '1month' ? '30 Days Access' : selectedRenewPlan === '3months' ? '90 Days Access' : '365 Days VIP Access'}
                </span>
              </div>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {selectedRenewPlan === '1month' ? '$65.00' : selectedRenewPlan === '3months' ? '$175.00' : '$599.00'}
              </span>
            </div>

            {/* Action Button */}
            <button
              type="button"
              disabled={isRenewingAtDesk}
              onClick={async () => {
                try {
                  setIsRenewingAtDesk(true);
                  await new Promise((r) => setTimeout(r, 600));
                  setRenewSuccessNotice('Membership renewed! Gate 01 barrier unlocked for Marcus Vance.');
                  setTimeout(() => setRenewSuccessNotice(null), 4000);
                } finally {
                  setIsRenewingAtDesk(false);
                }
              }}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isRenewingAtDesk ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Unlocking Gate Barrier...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">lock_open</span>
                  <span>⚡ Unlock Gate &amp; Renew Member</span>
                </>
              )}
            </button>

            {renewSuccessNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 text-xs font-bold animate-fade-in">
                <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
                <span>{renewSuccessNotice}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Quick Gate Release Modal */}
      {isEmergencyGateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-container-lowest/80 backdrop-blur-md p-4">
          <div className="bg-surface-container-low max-w-md w-full rounded-2xl p-6 shadow-2xl flex flex-col gap-4 border border-surface-container-high">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">contactless</span>
                <h3 className="text-base font-bold text-on-surface">Quick Gate Release</h3>
              </div>
              <button
                onClick={() => setIsEmergencyGateModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Execute an immediate manual gate override or process emergency renewal transaction for walk-in athletes currently waiting at Gate 01 barrier.
            </p>
            <div className="p-3 rounded-xl bg-surface-container-lowest flex items-center justify-between border border-surface-container-high/40">
              <div className="flex flex-col">
                <span className="font-mono text-[9px] text-outline">HARDWARE NODE</span>
                <span className="font-mono text-xs text-on-surface font-semibold">TURNSTILE_ALPHA_DOWNTOWN</span>
              </div>
              <span className="font-mono text-[9px] text-primary bg-surface-container px-2 py-0.5 rounded font-bold">CONNECTED</span>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEmergencyGateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-surface-container text-on-surface text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsEmergencyGateModalOpen(false);
                  setActionNotice('Manual override signal broadcasted. Gate 01 released for 15 seconds.');
                  setTimeout(() => setActionNotice(null), 4000);
                }}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md"
              >
                Manual Unlock Gate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gym Location & Geofence Configuration Modal */}
      <GymLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        gym={gymDetails}
        onGymUpdated={(updatedGym) => {
          setGymDetails(updatedGym);
          setActionNotice('Gym GPS location and geofence updated successfully.');
          setTimeout(() => setActionNotice(null), 4000);
        }}
      />
    </div>
  );
};
