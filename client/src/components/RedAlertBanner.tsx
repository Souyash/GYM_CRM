import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, ShieldAlert, Smartphone, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { getSocket } from '../services/socket';

export interface ThreatAlert {
  id: string;
  attemptType: string;
  memberName: string;
  reason: string;
  distanceMeters?: number;
  timestamp: string;
}

// Synthesize alert sound with Web Audio API
function playAlertTone() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3); // Drop to A4
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // Audio context may be blocked by browser autoplay policy
  }
}

export const RedAlertBanner: React.FC = () => {
  const [alerts, setAlerts] = useState<ThreatAlert[]>([]);

  useEffect(() => {
    const socket = getSocket();

    const handleThreat = (payload: any) => {
      console.log('[Threat Alert Dropped]', payload);
      playAlertTone();
      const newAlert: ThreatAlert = {
        id: payload.id || Math.random().toString(),
        attemptType: payload.attemptType || payload.type || 'SECURITY_ALERT',
        memberName: payload.memberName || payload.userName || 'Unknown Member',
        reason: payload.reason || payload.failureReason || 'Access unauthorized',
        distanceMeters: payload.distanceMeters,
        timestamp: payload.timestamp ? new Date(payload.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()
      };

      setAlerts((prev) => [newAlert, ...prev.slice(0, 4)]);
    };

    socket.on('alert:failed_access', handleThreat);
    socket.on('alert:multi_device', handleThreat);
    socket.on('alert:threat_detected', handleThreat);

    return () => {
      socket.off('alert:failed_access', handleThreat);
      socket.off('alert:multi_device', handleThreat);
      socket.off('alert:threat_detected', handleThreat);
    };
  }, []);

  if (alerts.length === 0) return null;

  const current = alerts[0];

  const getBadge = (type: string) => {
    switch (type) {
      case 'GPS_GEOFENCE_BREACH':
        return { label: 'LOCATION NOTICE', icon: <MapPin className="w-3.5 h-3.5" />, class: 'badge-alert-coral' };
      case 'MULTI_DEVICE_BLOCKED':
        return { label: 'MULTIPLE VISITS TODAY', icon: <Smartphone className="w-3.5 h-3.5" />, class: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30' };
      case 'EXPIRED_MEMBERSHIP':
        return { label: 'EXPIRED PASS', icon: <Clock className="w-3.5 h-3.5" />, class: 'badge-alert-coral' };
      case 'ANTI_PASSBACK_LOCKED':
        return { label: 'RAPID RE-ENTRY', icon: <ShieldAlert className="w-3.5 h-3.5" />, class: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30' };
      default:
        return { label: 'FRONT DESK NOTICE', icon: <AlertTriangle className="w-3.5 h-3.5" />, class: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30' };
    }
  };

  const badge = getBadge(current.attemptType);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 transition-all duration-300 font-poppins navbar-notch-safe">
      <div className="max-w-4xl mx-auto app-card shadow-2xl rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-2 border-emerald-500/40 relative overflow-hidden">
        <div className="flex items-start gap-3.5 relative z-10">
          <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/30 mt-0.5 md:mt-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${badge.class}`}>
                {badge.icon}
                {badge.label}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
                {current.timestamp}
              </span>
              {alerts.length > 1 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 font-black">
                  +{alerts.length - 1} more
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              {current.memberName}: <span className="font-medium text-slate-600 dark:text-slate-300">{current.reason}</span>
            </p>
            {current.distanceMeters !== undefined && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Location: Member was ~{Math.round(current.distanceMeters)}m from the gym entrance.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center relative z-10">
          <button
            onClick={() => setAlerts((prev) => prev.slice(1))}
            className="btn-primary-green !py-2 !px-3 text-xs flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark Handled
          </button>
          <button
            onClick={() => setAlerts([])}
            className="p-2 rounded-xl bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-dark-700 transition"
            title="Clear notices"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

