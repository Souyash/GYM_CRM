import React, { useState, useEffect } from 'react';
import { Shield, Lock, Smartphone, Wifi, Sparkles, CheckCircle2 } from 'lucide-react';

interface PreloaderScreenProps {
  statusMessage?: string;
  minDurationMs?: number;
}

const BOOT_STAGES = [
  { text: 'Connecting to IronVault Cloud Engine...', progress: 28 },
  { text: 'Verifying Hardware Turnstile & QR Radar...', progress: 58 },
  { text: 'Enforcing 1-Device Biometric Binding...', progress: 84 },
  { text: 'Vault Synchronized. Launching...', progress: 100 }
];

export const PreloaderScreen: React.FC<PreloaderScreenProps> = ({
  statusMessage,
  minDurationMs = 1000
}) => {
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Step through the boot stages smoothly
    const interval = setInterval(() => {
      setStageIndex((prev) => {
        if (prev < BOOT_STAGES.length - 1) {
          const next = prev + 1;
          setProgress(BOOT_STAGES[next].progress);
          return next;
        } else {
          setIsDone(true);
          clearInterval(interval);
          return prev;
        }
      });
    }, minDurationMs / BOOT_STAGES.length);

    return () => clearInterval(interval);
  }, [minDurationMs]);

  const currentStage = BOOT_STAGES[stageIndex];
  const displayMsg = statusMessage || currentStage.text;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070709] text-white font-poppins selection:bg-emerald-500 selection:text-black overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 text-center">
        {/* Animated Shield Logo & Orbital Rings */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Outer Pulsing Aura */}
          <div className="absolute w-28 h-28 rounded-3xl bg-emerald-500/20 blur-xl animate-ping opacity-30" />

          {/* Rotating Cyber Ring */}
          <div className="absolute w-28 h-28 rounded-full border border-dashed border-emerald-500/40 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="absolute w-24 h-24 rounded-full border border-emerald-500/20" />

          {/* Central Hex / Shield Container */}
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border-2 border-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.35)] flex items-center justify-center">
            <Shield className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]" />

            {/* Micro Indicator Glow */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </div>
          </div>
        </div>

        {/* Brand Typography */}
        <div className="space-y-1.5 mb-7">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white">
              IRON<span className="text-emerald-400">VAULT</span>
            </h1>
          </div>
          <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-emerald-400/80 uppercase">
            Smart Gym CRM & Operating System
          </p>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full space-y-2 mb-6">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isDone ? 'READY' : 'BOOTING'}</span>
            </span>
            <span className="font-bold text-emerald-400">{progress}%</span>
          </div>

          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/80 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Live Status Subtitle */}
        <div className="min-h-[28px] flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-300 font-medium">
          {isDone ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
          )}
          <span className="truncate">{displayMsg}</span>
        </div>

        {/* Bottom Trust Badges */}
        <div className="mt-12 flex items-center justify-center gap-4 text-[10px] text-zinc-500 font-medium tracking-wide">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-zinc-400" />
            256-Bit Hardware Encrypted
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Wifi className="w-3 h-3 text-zinc-400" />
            Live Cloud Sync
          </span>
        </div>
      </div>
    </div>
  );
};
