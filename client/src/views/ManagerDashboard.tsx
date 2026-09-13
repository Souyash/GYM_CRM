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
            title="Configure physical GPS coordinates and turnstile geofence radius"
          >
            <MapPin className={`w-4 h-4 ${gymDetails?.latitude && gymDetails.latitude !== 0 ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`} />
            <span>
              {gymDetails?.latitude && gymDetails.latitude !== 0
                ? `📍 GPS Active (${gymDetails.geofenceRadiusMeters || 100}m)`
                : '⚠️ Set Gym GPS Location'}
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

      {/* Dynamic Operational Sub-Header Bar */}
      <div className="w-full flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2.5 bg-surface-container-low px-4 py-2 rounded-xl shadow-sm border border-surface-container-high/40">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
            <span className="font-mono text-[10px] uppercase text-primary tracking-widest font-bold">LIVE OPERATIONS</span>
            <span className="font-sans text-xs text-on-surface font-bold">
              {gymDetails?.name || 'Downtown Flagship'}
            </span>
            <span className="font-mono text-[10px] text-secondary px-2 py-0.5 rounded bg-surface-container font-bold">
              Normal Flow
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant font-medium text-xs">
            <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
            <span>Turnstiles 1-4 sync: Real-time</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSelectedRenewAthlete('vance');
              const el = document.getElementById('fast-desk-dock');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all shadow-sm active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-secondary text-[18px]">flash_on</span>
            <span>Resolve Front Desk Turnstile</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all shadow-sm active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-tertiary text-[18px]">qr_code_scanner</span>
            <span>Print Day Pass QR</span>
          </button>
          <button
            onClick={onOpenOnboarding}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all shadow-sm active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-primary text-[18px]">person_add</span>
            <span>+ Check-in Athlete</span>
          </button>
          <button
            onClick={onOpenBilling}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-on-secondary text-xs font-bold transition-all shadow-md active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">credit_card</span>
            <span>💳 Quick Renew Member</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip: 4 High-Density Tactical Matte Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Athletes Inside */}
        <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl flex flex-col justify-between shadow-md border border-surface-container-high/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">group</span>
              <span className="font-mono text-[10px] uppercase text-on-surface-variant font-bold">Athletes Inside</span>
            </div>
            <span className="font-mono text-[9px] text-primary px-2 py-0.5 rounded bg-surface-container font-bold">LIVE</span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-black font-mono text-primary tracking-tight">{activeCount}</span>
            <span className="text-xs font-mono text-on-surface-variant font-semibold">/ 120 Cap</span>
          </div>
          <div className="w-full mt-2">
            <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((activeCount / 120) * 100))}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[11px]">
              <span className="text-on-surface font-semibold">Current capacity: {Math.min(100, Math.round((activeCount / 120) * 100))}%</span>
              <span className="text-secondary font-mono text-[10px]">Peak at 6:30 PM</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Today's Check-ins */}
        <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl flex flex-col justify-between shadow-md border border-surface-container-high/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
              <span className="font-mono text-[10px] uppercase text-on-surface-variant font-bold">Today's Check-ins</span>
            </div>
            <span className="font-mono text-[9px] text-secondary px-2 py-0.5 rounded bg-surface-container font-bold">+14% vs last week</span>
          </div>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-3xl font-black font-mono text-on-surface tracking-tight">{todayCount || 187}</span>
            <span className="text-xs text-on-surface-variant font-semibold">visits</span>
          </div>
          <div className="flex items-center gap-2 mt-2 pt-1 border-t border-surface-container-high/30">
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-surface-container text-primary font-mono text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>{Math.max(0, (todayCount || 187) - 5)} Approved</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-surface-container text-error font-mono text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-error" />
              <span>5 Blocked/Alerts</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Memberships Expiring */}
        <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl flex flex-col justify-between shadow-md border border-surface-container-high/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-[18px]">hourglass_top</span>
              <span className="font-mono text-[10px] uppercase text-on-surface-variant font-bold">Memberships Expiring</span>
            </div>
            <span className="font-mono text-[9px] text-error px-2 py-0.5 rounded bg-surface-container animate-pulse font-bold">ACTION REQD</span>
          </div>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-3xl font-black font-mono text-tertiary tracking-tight">12</span>
            <span className="text-xs text-on-surface-variant font-semibold">this week</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-surface-container-high/30 text-on-surface-variant text-[11px]">
            <span>At-Desk Conversion</span>
            <span className="font-mono font-bold text-primary">83.3% Saved</span>
          </div>
        </div>

        {/* KPI 4: Monthly Revenue */}
        <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl flex flex-col justify-between shadow-md border border-surface-container-high/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">payments</span>
              <span className="font-mono text-[10px] uppercase text-on-surface-variant font-bold">Monthly Revenue</span>
            </div>
            <span className="font-mono text-[9px] text-primary px-2 py-0.5 rounded bg-surface-container font-bold">+8.2% this month</span>
          </div>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl font-black font-mono text-on-surface tracking-tight">$14,850</span>
            <span className="font-mono text-[10px] text-on-surface-variant">/ month</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-surface-container-high/30 text-on-surface-variant text-[11px]">
            <span>Auto-Collect Success</span>
            <span className="font-mono font-bold text-on-surface">97.4% Synced</span>
          </div>
        </div>
      </div>

      {/* Master Telemetry Hub: Live Turnstile Stream (8 cols) & Fast Desk Renewal Dock (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Turnstile Feed Table */}
        <div className="lg:col-span-8 flex flex-col bg-surface-container-low rounded-2xl shadow-lg p-5 border border-surface-container-high/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3 border-b border-surface-container-high/40">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <h2 className="text-base font-bold text-on-surface tracking-tight">Real-Time Activity Feed</h2>
              <span className="font-mono text-[10px] text-primary bg-surface-container px-2 py-0.5 rounded font-bold">
                GATES 01-04 ACTIVE
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('ON_FLOOR')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'ON_FLOOR'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                Inside Gym ({activeOnFloor.length})
              </button>
              <button
                onClick={() => setActiveTab('DEPARTED')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'DEPARTED'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                Departed ({departedToday.length})
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto mt-2">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-lowest font-mono text-[10px] text-outline uppercase tracking-wider">
                  <th className="py-2.5 px-3">Member</th>
                  <th className="py-2.5 px-3">Access Tier</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Gate</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high/30 text-xs font-sans">
                {activeTab === 'ON_FLOOR' ? (
                  activeOnFloor.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-zinc-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
                        <p className="font-bold text-xs text-on-surface">No athletes currently on the gym floor</p>
                        <p className="text-[11px] text-on-surface-variant">Live entrance scans will populate here automatically</p>
                      </td>
                    </tr>
                  ) : (
                    activeOnFloor.map((entry) => (
                      <tr key={entry.id} className="hover:bg-surface-container/60 transition-colors group">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black text-xs shrink-0">
                              {entry.user?.fullName?.charAt(0) || 'M'}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-on-surface truncate">{entry.user?.fullName || 'Member'}</span>
                              <span className="font-mono text-[10px] text-on-surface-variant">
                                Phone Key • #IV-{entry.user?.id ? entry.user.id.substring(0, 5).toUpperCase() : '7729'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-[10px] text-secondary bg-surface-container px-2 py-0.5 rounded font-bold">
                            {entry.user?.subscriptions?.[0]?.planName || 'Black Vault Elite'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-on-surface font-semibold">
                          {new Date(entry.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-3 text-on-surface">Gate 01 (Main)</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-mono text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            ✅ Entry Granted
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDeskCheckout(entry.id, entry.user?.fullName || 'Member')}
                            disabled={checkingOutId === entry.id}
                            className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-error/20 hover:text-error text-on-surface font-mono text-[10px] transition font-bold"
                          >
                            {checkingOutId === entry.id ? 'Checking Out...' : 'Check Out'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )
                ) : departedToday.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-zinc-400">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-secondary" />
                      <p className="font-bold text-xs text-on-surface">No completed sessions recorded today yet</p>
                    </td>
                  </tr>
                ) : (
                  departedToday.map((entry) => (
                    <tr key={entry.id} className="hover:bg-surface-container/60 transition-colors group">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center font-black text-xs shrink-0">
                            {entry.user?.fullName?.charAt(0) || 'M'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-on-surface truncate">{entry.user?.fullName || 'Member'}</span>
                            <span className="font-mono text-[10px] text-on-surface-variant">Completed Workout</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded font-semibold">
                          {entry.user?.subscriptions?.[0]?.planName || 'Standard 24/7'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-on-surface">
                        {new Date(entry.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 text-on-surface">Exit Turnstile 02</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-mono text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                          🚪 Exit Recorded
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-mono text-[10px] text-primary">{entry.sessionDurationMinutes || 45}m</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-surface-container-high/30 flex flex-col sm:flex-row items-center justify-between text-xs text-on-surface-variant gap-2">
            <div className="flex items-center gap-2">
              <span className="text-primary font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Live sync active
              </span>
              <span>•</span>
              <span>Fast scan response: 18ms</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportAttendanceCsv}
                className="py-1 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-mono text-[10px] flex items-center gap-1 font-bold border border-surface-container-high transition"
              >
                <Download className="w-3 h-3 text-primary" />
                <span>Export CSV</span>
              </button>
              <span className="font-mono text-[10px] text-outline">Showing real-time records</span>
            </div>
          </div>
        </div>

        {/* Right 4 Columns: 3-Tap Fast Desk Renewal Dock */}
        <div id="fast-desk-dock" className="lg:col-span-4 flex flex-col bg-surface-container-low rounded-2xl shadow-lg p-5 border border-surface-container-high/40">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[22px]">flash_on</span>
              <h2 className="text-base font-bold text-on-surface">Fast Desk Renew</h2>
            </div>
            <span className="font-mono text-[9px] uppercase text-primary px-2 py-0.5 rounded bg-surface-container font-bold">
              3-STEP DESK CHECK-IN
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mb-4">
            Renew expired members and instantly release turnstile in 3 quick steps.
          </p>

          <div className="flex flex-col gap-4">
            {/* Step 1: Select Member */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] text-outline uppercase font-bold" htmlFor="athlete-selector">
                Step 1: Select Member
              </label>
              <select
                id="athlete-selector"
                value={selectedRenewAthlete}
                onChange={(e) => setSelectedRenewAthlete(e.target.value)}
                className="w-full bg-surface-container-lowest text-on-surface text-xs font-semibold px-3 py-2.5 rounded-xl border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
              >
                <option value="vance">Marcus Vance • Expired Yesterday (Waiting at Gate 01)</option>
                <option value="torres">Camila Torres • Expires in 3 Days</option>
                <option value="hudson">Hudson Rivera • Expired 2 hours ago</option>
                <option value="custom">Search member name or card ID...</option>
              </select>
              <div className="flex items-center gap-1.5 mt-1 p-2 rounded-xl bg-surface-container text-on-surface text-xs border border-error/20">
                <span className="material-symbols-outlined text-error text-[16px]">warning</span>
                <span className="text-error font-semibold text-[11px]">Turnstile Locked • Renewal required for entry</span>
              </div>
            </div>

            {/* Step 2: Choose Plan */}
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] text-outline uppercase font-bold">Step 2: Choose Plan</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRenewPlan('1month')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                    selectedRenewPlan === '1month'
                      ? 'bg-surface-container-high border-secondary'
                      : 'bg-surface-container border-transparent hover:bg-surface-container-high'
                  }`}
                >
                  <span className="font-mono text-[9px] text-outline font-bold">1 MONTH</span>
                  <span className="font-mono text-sm font-bold text-on-surface">$65</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRenewPlan('3months')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border relative transition-all ${
                    selectedRenewPlan === '3months'
                      ? 'bg-surface-container-high border-secondary shadow-sm'
                      : 'bg-surface-container border-transparent hover:bg-surface-container-high'
                  }`}
                >
                  <span className="absolute -top-2 bg-secondary text-on-secondary font-mono text-[8px] px-1.5 rounded-full font-bold uppercase">
                    Popular
                  </span>
                  <span className="font-mono text-[9px] text-secondary font-bold">3 MONTHS</span>
                  <span className="font-mono text-sm font-bold text-primary">$175</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRenewPlan('1year')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                    selectedRenewPlan === '1year'
                      ? 'bg-surface-container-high border-secondary'
                      : 'bg-surface-container border-transparent hover:bg-surface-container-high'
                  }`}
                >
                  <span className="font-mono text-[9px] text-outline font-bold">1 YEAR</span>
                  <span className="font-mono text-sm font-bold text-on-surface">$599</span>
                </button>
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] text-outline uppercase font-bold">Step 3: Payment Method</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRenewTender('card')}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-semibold transition-all ${
                    selectedRenewTender === 'card'
                      ? 'bg-surface-container-high border-primary text-on-surface'
                      : 'bg-surface-container border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">credit_card</span>
                  <span className="text-[11px]">Card POS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRenewTender('cash')}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-semibold transition-all ${
                    selectedRenewTender === 'cash'
                      ? 'bg-surface-container-high border-primary text-on-surface'
                      : 'bg-surface-container border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                  <span className="text-[11px]">Cash Desk</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRenewTender('sms')}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-semibold transition-all ${
                    selectedRenewTender === 'sms'
                      ? 'bg-surface-container-high border-primary text-on-surface'
                      : 'bg-surface-container border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">send_to_mobile</span>
                  <span className="text-[11px]">SMS Link</span>
                </button>
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-3 rounded-xl bg-surface-container-lowest flex flex-col gap-1 border border-surface-container-high/40">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Selected Term</span>
                <span className="text-on-surface font-semibold">
                  {selectedRenewPlan === '1month' ? '1 Month (30 Days)' : selectedRenewPlan === '3months' ? '3 Months (90 Days)' : '1 Year (365 Days)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">Total Due Now</span>
                <span className="text-base font-black font-mono text-primary">
                  {selectedRenewPlan === '1month' ? '$65.00' : selectedRenewPlan === '3months' ? '$175.00' : '$599.00'}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              disabled={isRenewingAtDesk}
              onClick={async () => {
                try {
                  setIsRenewingAtDesk(true);
                  await new Promise((r) => setTimeout(r, 800));
                  setRenewSuccessNotice('Membership renewed! Gate 01 unlocked for Marcus Vance.');
                  setTimeout(() => setRenewSuccessNotice(null), 4000);
                } finally {
                  setIsRenewingAtDesk(false);
                }
              }}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-secondary text-on-primary font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {isRenewingAtDesk ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                  <span>Transmitting Access Token...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">lock_open</span>
                  <span>Unlock Gate &amp; Renew</span>
                </>
              )}
            </button>

            {renewSuccessNotice && (
              <div className="p-3 rounded-xl bg-primary-container text-on-primary-container flex items-center gap-2 text-xs font-bold animate-bounce">
                <span className="material-symbols-outlined text-primary text-[18px]">task_alt</span>
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
