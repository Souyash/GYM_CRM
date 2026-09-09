import React, { useState, useEffect } from 'react';
import { Printer, ShieldCheck, LogIn, LogOut } from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../services/api';
import { Facility } from '../types';

export const PrintableFacilityQR: React.FC = () => {
  const [facility, setFacility] = useState<Facility | null>(null);
  const [posterType, setPosterType] = useState<'ENTER' | 'EXIT'>('ENTER');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadFacility();
  }, []);

  useEffect(() => {
    if (facility) {
      generateQR(facility, posterType);
    }
  }, [posterType, facility]);

  const generateQR = async (fac: Facility, type: 'ENTER' | 'EXIT') => {
    try {
      const isExit = type === 'EXIT';
      const payload = JSON.stringify({
        type: isExit ? 'GYM_EXIT_GATE' : 'GYM_FACILITY_ACCESS',
        action: isExit ? 'EXIT' : 'ENTER',
        gym_id: isExit ? (fac.exitQrCodeHash || 'FACILITY_IV_APEX_DOWNTOWN_EXIT_2026') : fac.id,
        hash: isExit ? (fac.exitQrCodeHash || 'FACILITY_IV_APEX_DOWNTOWN_EXIT_2026') : fac.staticQrCodeHash,
        facility_name: fac.name
      });

      const url = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'H',
        margin: 3,
        width: 500,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrDataUrl(url);
    } catch (e) {
      console.error('Error generating QR:', e);
    }
  };

  const loadFacility = async () => {
    try {
      setIsLoading(true);
      const data = await api.getFacilities();
      if (data.facilities && data.facilities.length > 0) {
        const fac = data.facilities[0];
        setFacility(fac);
        await generateQR(fac, 'ENTER');
      }
    } catch (e) {
      console.error('Failed to load facility QR:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !facility) {
    return (
      <div className="p-8 text-center text-slate-400 font-poppins">
        Loading Gym Poster QR Codes...
      </div>
    );
  }

  const isExit = posterType === 'EXIT';

  return (
    <div className="space-y-6 font-poppins max-w-3xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl app-card">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Official Gym Turnstile Posters
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Print physical posters for the entrance lobby and exit turnstiles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="btn-primary-green flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print This Poster
          </button>
        </div>
      </div>

      {/* Poster Type Switcher */}
      <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-zinc-800 rounded-2xl">
        <button
          onClick={() => setPosterType('ENTER')}
          className={`py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
            !isExit
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black shadow-md'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>🟢 Entrance Gate Poster</span>
        </button>

        <button
          onClick={() => setPosterType('EXIT')}
          className={`py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
            isExit
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black shadow-md'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LogOut className="w-4 h-4" />
          <span>🏁 Exit Turnstile Poster</span>
        </button>
      </div>

      {/* Printable Poster Preview Area */}
      <div
        id="printable-qr-poster"
        className={`max-w-xl mx-auto bg-white dark:bg-[#0d0d10] text-slate-900 dark:text-white rounded-3xl p-8 sm:p-10 shadow-2xl border-4 ${
          isExit ? 'border-amber-500 dark:border-amber-500' : 'border-emerald-500 dark:border-emerald-500'
        } flex flex-col items-center text-center relative overflow-hidden`}
      >
        {/* Poster Header */}
        <div className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 py-5 px-6 rounded-2xl mb-6 shadow-sm">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 ${
            isExit ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400'
          }`}>
            IRONVAULT FITNESS & HEALTH CLUB
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {facility.name}
          </h1>
          <p className={`text-xs tracking-widest uppercase font-black mt-1 ${isExit ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {isExit ? 'MEMBER EXIT & WORKOUT FINISH' : 'MEMBER ENTRANCE CHECK-IN'}
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-4 space-y-1">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {isExit ? 'SCAN HERE TO CHECK OUT' : 'SCAN HERE TO CHECK IN'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            {isExit
              ? 'Scan with your IronVault app to record workout duration and conclude session.'
              : 'Scan with your IronVault app to verify your active pass and enter the gym.'}
          </p>
        </div>

        {/* The High-Resolution Static QR Code */}
        {qrDataUrl && (
          <div className={`p-4 bg-white rounded-3xl shadow-lg my-3 border-2 ${isExit ? 'border-amber-400' : 'border-emerald-400'}`}>
            <img
              src={qrDataUrl}
              alt="Facility Turnstile QR"
              className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
            />
          </div>
        )}

        {/* Footer info */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 w-full text-center space-y-1">
          <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
            {facility.address}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500">
            Protected by IronVault Geofence Verification • 1 Daily Visit Policy
          </p>
        </div>
      </div>
    </div>
  );
};
