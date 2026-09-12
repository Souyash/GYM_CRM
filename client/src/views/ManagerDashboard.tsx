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

      {/* Quick Action Header */}
      <div className="p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-carbon-700/80 bg-white dark:bg-carbon-900 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-volt-500/10 text-volt-400 border border-volt-500/20 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-volt-400 animate-pulse"></span>
            Front Desk Operations
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-carbon-50 tracking-tight">
            Live Attendance & Floor Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-carbon-400 mt-0.5">
            Real-time gym floor headcount, duration timers, and 1-click desk checkout
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5">
          <button
            onClick={onOpenOnboarding}
            className="py-2.5 px-4 rounded-xl bg-volt-500 hover:bg-volt-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-volt-glow active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Member</span>
          </button>
          <button
            onClick={onOpenBilling}
            className="py-2.5 px-4 rounded-xl bg-white dark:bg-carbon-800 hover:bg-slate-100 dark:hover:bg-carbon-750 text-slate-700 dark:text-carbon-200 border border-slate-200 dark:border-carbon-700 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
          >
            <CreditCard className="w-4 h-4 text-volt-400" />
            <span>Renew Pass</span>
          </button>
        </div>
      </div>

      {/* Live Occupancy KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Metric 1: Live on Floor */}
        <div className="p-5 rounded-3xl border-2 border-volt-500/30 dark:border-volt-500/40 bg-white dark:bg-carbon-850 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-carbon-400 uppercase tracking-wider">
              On Gym Floor
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-volt-500/10 text-volt-400 border border-volt-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-volt-400 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-4xl font-mono tabular-nums font-black text-volt-500 dark:text-volt-400 mt-2 tracking-tight">
            {activeCount}
          </p>
          <span className="text-[11px] text-volt-600 dark:text-volt-400 font-bold inline-flex items-center gap-1.5 mt-2">
            <Activity className="w-3.5 h-3.5" /> Checked into facility now
          </span>
        </div>

        {/* Metric 2: Departed Today */}
        <div className="p-5 rounded-3xl border border-slate-200/90 dark:border-carbon-700/80 bg-white dark:bg-carbon-850 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-carbon-400 uppercase tracking-wider">
              Workouts Completed
            </span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-carbon-800 text-slate-700 dark:text-carbon-200">
              <CheckCircle2 className="w-4 h-4 text-volt-400" />
            </div>
          </div>
          <p className="text-4xl font-mono tabular-nums font-black text-slate-900 dark:text-carbon-50 mt-2 tracking-tight">
            {departedCount}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-carbon-400 font-medium inline-flex items-center gap-1 mt-2">
            Checked out today
          </span>
        </div>

        {/* Metric 3: Total Arrivals */}
        <div className="p-5 rounded-3xl border border-slate-200/90 dark:border-carbon-700/80 bg-white dark:bg-carbon-850 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-carbon-400 uppercase tracking-wider">
              Total Arrivals
            </span>
            <p className="text-4xl font-mono tabular-nums font-black text-slate-900 dark:text-carbon-50 mt-2 tracking-tight">
              {todayCount}
            </p>
            <span className="text-[11px] text-slate-400 dark:text-carbon-400 font-medium block mt-2">
              Entrance scans today
            </span>
          </div>
          <button
            onClick={loadAttendance}
            title="Refresh stream"
            className="p-3.5 rounded-2xl bg-slate-100 dark:bg-carbon-800 hover:bg-slate-200 dark:hover:bg-carbon-750 text-slate-700 dark:text-carbon-200 transition active:scale-95 border border-slate-200 dark:border-carbon-700/80 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Latest Check-In Highlight Banner */}
      {latestEntry && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-base shadow-sm">
              {latestEntry.memberName?.charAt(0) || 'M'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black">
                  JUST ENTERED
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  {new Date(latestEntry.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                {latestEntry.memberName}
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                Pass: {latestEntry.planName} • Valid Passholder
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floor Management Stream with Tabs */}
      <div className="app-card overflow-hidden">
        {/* Tab Headers */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ON_FLOOR')}
              className={`py-2 px-3.5 rounded-xl font-black text-xs transition flex items-center gap-2 ${
                activeTab === 'ON_FLOOR'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>🟢 Live On Floor ({activeOnFloor.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('DEPARTED')}
              className={`py-2 px-3.5 rounded-xl font-black text-xs transition flex items-center gap-2 ${
                activeTab === 'DEPARTED'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>🏁 Completed Sessions ({departedToday.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportAttendanceCsv}
              disabled={activeOnFloor.length === 0 && departedToday.length === 0}
              className="py-1 px-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-zinc-700 transition disabled:opacity-40 shadow-sm active:scale-95"
              title="Export today's attendance logs to CSV file"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export Visits (CSV)</span>
            </button>
            <span className="text-xs text-slate-500 dark:text-zinc-400 hidden sm:inline font-medium">
              Auto-refreshed via WebSocket
            </span>
          </div>
        </div>

        {/* Tab 1: Live On Floor List */}
        {activeTab === 'ON_FLOOR' && (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-[520px] overflow-y-auto">
            {activeOnFloor.length === 0 ? (
              <div className="py-14 text-center text-slate-500 dark:text-zinc-400 space-y-2">
                <Users className="w-10 h-10 text-slate-400 dark:text-zinc-600 mx-auto opacity-50" />
                <p className="font-bold text-sm text-slate-700 dark:text-zinc-300">No athletes currently on the floor.</p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 max-w-sm mx-auto">
                  When members check in at the entrance, they will appear here with a live session timer.
                </p>
              </div>
            ) : (
              activeOnFloor.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
                      {entry.user?.fullName?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 dark:text-white text-sm">
                          {entry.user?.fullName || 'Member'}
                        </h4>
                        <span className="badge-active-green text-[9px] py-0 px-1.5">
                          Active Inside
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        <span>{entry.user?.email}</span>
                        <span>•</span>
                        <span className="text-slate-700 dark:text-zinc-300 font-medium">
                          {entry.user?.subscriptions?.[0]?.planName || 'Pro Member'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Elapsed Timer & 1-Click Desk Checkout */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                        <Timer className="w-3.5 h-3.5 animate-spin-slow" />
                        {entry.elapsedMinutes || 1}m inside
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 block mt-0.5">
                        Started {new Date(entry.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeskCheckout(entry.id, entry.user?.fullName || 'Member')}
                      disabled={checkingOutId === entry.id}
                      className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-zinc-300 hover:text-amber-700 dark:hover:text-amber-300 border border-slate-200 dark:border-zinc-700 font-black text-xs transition flex items-center gap-1.5 active:scale-95"
                      title="Check out member if they forgot to scan exit turnstile"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{checkingOutId === entry.id ? 'Exiting...' : 'Desk Check Out'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Departed Sessions List */}
        {activeTab === 'DEPARTED' && (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-[520px] overflow-y-auto">
            {departedToday.length === 0 ? (
              <div className="py-14 text-center text-slate-500 dark:text-zinc-400 space-y-2">
                <CheckCircle className="w-10 h-10 text-slate-400 dark:text-zinc-600 mx-auto opacity-50" />
                <p className="font-bold text-sm text-slate-700 dark:text-zinc-300">No departed sessions logged yet today.</p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 max-w-sm mx-auto">
                  When members check out or are checked out by desk staff, their completed workout summary appears here.
                </p>
              </div>
            ) : (
              departedToday.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm">
                      {entry.user?.fullName?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-sm">
                        {entry.user?.fullName || 'Member'}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Session Completed</span>
                        <span>•</span>
                        <span>{entry.exitDeviceId?.includes('DESK') ? 'Front Desk Checkout' : 'Exit Turnstile Scan'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-black text-slate-800 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">
                      <Clock className="w-3 h-3 text-emerald-500" />
                      {entry.sessionDurationMinutes || 45} mins workout
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
                      {new Date(entry.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(entry.exitedAt || entry.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

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
