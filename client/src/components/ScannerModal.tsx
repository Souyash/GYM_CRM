import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  CheckCircle,
  RefreshCw,
  Clock,
  Sparkles,
  Navigation,
  LogOut,
  LogIn,
  AlertOctagon,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Facility } from '../types';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (entry: any, action: 'ENTER' | 'EXIT') => void;
  memberIdentifier?: string;
  initialMode?: 'ENTER' | 'EXIT';
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  memberIdentifier,
  initialMode = 'ENTER'
}) => {
  const { user, deviceId, refreshProfile, scanAndLogin } = useAuth();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [gateMode, setGateMode] = useState<'ENTER' | 'EXIT'>(initialMode);
  const [scannerViewMode, setScannerViewMode] = useState<'CAMERA' | 'QR_CODE'>('CAMERA');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // GPS state
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsMode, setGpsMode] = useState<'AT_GYM' | 'OUTSIDE_GEOFENCE' | 'HARDWARE'>('AT_GYM');

  // Status & verification state
  const [verificationState, setVerificationState] = useState<'IDLE' | 'VERIFYING' | 'SUCCESS' | 'DENIED'>('IDLE');
  const [resultMessage, setResultMessage] = useState<string>('');
  const [resultDetails, setResultDetails] = useState<any>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGateMode(initialMode);
      api.getFacilities().then((data) => {
        if (data.facilities && data.facilities.length > 0) {
          setFacility(data.facilities[0]);
        }
      }).catch(console.error);

      // Default mock GPS coordinates near gym (e.g. 10 meters away)
      setGpsLocation({ lat: 37.774929, lng: -122.419416 });
      setVerificationState('IDLE');
      setResultMessage('');
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, initialMode]);

  // Handle GPS hardware query
  const queryHardwareGPS = () => {
    if (!navigator.geolocation) {
      setCameraError('GPS Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setGpsMode('HARDWARE');
      },
      (err) => {
        console.warn('GPS Error:', err.message);
        setCameraError(`GPS Error: ${err.message}. Using gym verified location.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch {}
      }

      const html5QrCode = new Html5Qrcode('qr-reader-container');
      scannerRef.current = html5QrCode;

      let cameraConfig: any = { facingMode: 'user' };
      try {
        const cameras = await Html5Qrcode.getCameras().catch(() => []);
        if (cameras && cameras.length > 0) {
          const preferred =
            cameras.find((c) => c.label.toLowerCase().includes('facetime') || c.label.toLowerCase().includes('front')) ||
            cameras[0];
          if (preferred?.id) {
            cameraConfig = preferred.id;
          }
        }
      } catch {
        cameraConfig = { facingMode: 'user' };
      }

      await html5QrCode.start(
        cameraConfig,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleQrCodeScanned(decodedText);
        },
        () => {}
      );
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setCameraError('Camera access unavailable. Please use the 1-Click Fast Check button below.');
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  // Process the QR Code
  const handleQrCodeScanned = async (qrText: string) => {
    try {
      stopCamera();
      setVerificationState('VERIFYING');
      setResultMessage(gateMode === 'ENTER' ? 'Verifying pass & entrance gate...' : 'Verifying exit & logging workout duration...');

      let gymId = qrText;
      let scannedAction = gateMode;

      try {
        const parsed = JSON.parse(qrText);
        if (parsed.gym_id) gymId = parsed.gym_id;
        else if (parsed.hash) gymId = parsed.hash;
        if (
          parsed.type === 'GYM_EXIT_GATE' ||
          parsed.action === 'EXIT' ||
          (typeof parsed.gym_id === 'string' && parsed.gym_id.includes('EXIT')) ||
          (typeof parsed.hash === 'string' && parsed.hash.includes('EXIT'))
        ) {
          scannedAction = 'EXIT';
          setGateMode('EXIT');
        }
      } catch (e) {
        if (qrText.includes('EXIT')) {
          scannedAction = 'EXIT';
          setGateMode('EXIT');
        }
      }

      let lat = gpsLocation?.lat || 37.774929;
      let lng = gpsLocation?.lng || -122.419416;

      if (facility) {
        lat = facility.latitude;
        lng = facility.longitude;
      }

      let response: any;

      if (scannedAction === 'EXIT') {
        // Exit Flow
        if (!user && memberIdentifier) {
          response = await scanAndLogin({
            identifier: memberIdentifier,
            gym_id: gymId,
            latitude: lat,
            longitude: lng,
            action: 'EXIT'
          });
        } else {
          response = await api.exitGymSession({
            gym_id: gymId,
            latitude: lat,
            longitude: lng,
            device_id: deviceId
          });
        }

        setVerificationState('SUCCESS');
        setResultMessage(response.message || 'Workout complete! Departure logged.');
        setResultDetails(response.session);

        if (onScanSuccess) {
          onScanSuccess(response.session, 'EXIT');
        }
        refreshProfile();

        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        // Entrance Flow
        if (!user && memberIdentifier) {
          response = await scanAndLogin({
            identifier: memberIdentifier,
            gym_id: gymId,
            latitude: lat,
            longitude: lng,
            action: 'ENTER'
          });
        } else {
          response = await api.scanEntry({
            gym_id: gymId,
            latitude: lat,
            longitude: lng,
            device_id: deviceId,
            action: 'ENTER'
          });
        }

        setVerificationState('SUCCESS');
        setResultMessage(response.message || 'Access Granted! Welcome to IronVault Fitness.');
        setResultDetails(response.entry);

        if (onScanSuccess) {
          onScanSuccess(response.entry, 'ENTER');
        }
        refreshProfile();

        if (response.access === 'GRANTED' || !user) {
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setVerificationState('DENIED');
      setResultMessage(err.message || 'Access notice: Please check with front desk.');
      setResultDetails(err.data || null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in font-poppins">
      <div className="app-card w-full max-w-lg overflow-hidden shadow-2xl flex flex-col relative">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${gateMode === 'ENTER' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'}`}>
              {gateMode === 'ENTER' ? <LogIn className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                {gateMode === 'ENTER' ? 'Gym Entrance Check-In' : 'Gym Exit & Workout Finish'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {gateMode === 'ENTER' ? 'Scan the entrance poster to start session' : 'Scan the exit turnstile to conclude workout'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gate Mode Selector Tab */}
        <div className="px-4 sm:px-6 pt-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-zinc-800 rounded-2xl">
            <button
              onClick={() => { setGateMode('ENTER'); setVerificationState('IDLE'); setResultMessage(''); }}
              className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition ${
                gateMode === 'ENTER'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>🟢 Entrance Gate</span>
            </button>
            <button
              onClick={() => { setGateMode('EXIT'); setVerificationState('IDLE'); setResultMessage(''); }}
              className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition ${
                gateMode === 'EXIT'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>🏁 Exit Gate</span>
            </button>
          </div>
        </div>

        {/* Method Toggle: Camera vs Show QR Poster */}
        <div className="px-4 sm:px-6 pt-2 flex items-center justify-center gap-2">
          <button
            onClick={() => {
              setScannerViewMode('CAMERA');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              scannerViewMode === 'CAMERA'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan with Camera</span>
          </button>
          <span className="text-slate-300 dark:text-zinc-700">•</span>
          <button
            onClick={() => {
              stopCamera();
              setScannerViewMode('QR_CODE');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              scannerViewMode === 'QR_CODE'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Display QR Code on Screen</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          {/* Active Status Display */}
          {verificationState === 'VERIFYING' && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-spin" />
              <div>
                <p className="font-bold text-sm text-emerald-800 dark:text-emerald-300">Processing Turnstile</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{resultMessage}</p>
              </div>
            </div>
          )}

          {verificationState === 'SUCCESS' && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-black text-base text-emerald-800 dark:text-emerald-300">
                  {gateMode === 'ENTER' ? 'Check-In Confirmed!' : 'Workout Complete & Checked Out!'}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-200">{resultMessage}</p>
              </div>
            </div>
          )}

          {verificationState === 'DENIED' && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 flex items-start gap-3">
              <AlertOctagon className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-black text-base text-amber-800 dark:text-amber-300">Notice</p>
                <p className="text-xs text-amber-900 dark:text-amber-100 font-medium">{resultMessage}</p>
              </div>
            </div>
          )}

          {/* EITHER: CAMERA SCANNER OR QR DISPLAY */}
          {scannerViewMode === 'CAMERA' ? (
            /* HTML5 QR Camera Container */
            <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-dashed border-slate-300 dark:border-zinc-700 aspect-square max-h-56 mx-auto flex items-center justify-center">
              <div id="qr-reader-container" className="w-full h-full"></div>

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-900/95 dark:bg-black/95 text-white space-y-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
                    <Camera className="w-8 h-8" />
                  </div>
                  <p className="text-xs text-slate-300 max-w-xs">
                    {cameraError || `Allow camera access to scan physical ${gateMode === 'ENTER' ? 'entrance' : 'exit'} QR poster`}
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-5 py-2.5 rounded-xl btn-primary-green text-xs font-black"
                  >
                    <Camera className="w-4 h-4" />
                    Open Camera Scanner
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* QR Code Display on Screen */
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-emerald-500/30 flex flex-col items-center text-center space-y-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <img
                  src={gateMode === 'ENTER' ? '/entrance_qr.png' : '/exit_qr.png'}
                  alt={`${gateMode} Gate QR Code`}
                  className="w-44 h-44 object-contain rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-black text-slate-900 dark:text-white">
                  Physical {gateMode === 'ENTER' ? 'Entrance' : 'Exit'} Gate QR
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 max-w-xs">
                  Scan this code with your phone camera, or open it on another device to test scanning with your webcam.
                </p>
              </div>

              <a
                href={gateMode === 'ENTER' ? '/entrance_qr.png' : '/exit_qr.png'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open QR in New Tab / Phone Browser
              </a>
            </div>
          )}

          {/* Location Confirmation */}
          <div className="app-card-subtle p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Location Status
              </span>
              <span className="badge-active-green text-[10px]">
                At {facility?.name ? facility.name.split(' ')[0] : 'Gym'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 pt-1 border-t border-slate-200 dark:border-zinc-800">
              <span>GPS Gate Geofence:</span>
              <button
                onClick={queryHardwareGPS}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
              >
                Refresh Coordinates
              </button>
            </div>
          </div>

          {/* 1-Click Fast Trigger Action Button for Single-Screen Testing */}
          {facility && (
            <div className="space-y-2 pt-1">
              {memberIdentifier && (
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-bold text-center text-slate-700 dark:text-zinc-300">
                  Checking as: <span className="text-emerald-600 dark:text-emerald-400 font-mono">{memberIdentifier}</span>
                </div>
              )}

              {gateMode === 'ENTER' ? (
                <button
                  onClick={() => handleQrCodeScanned(facility.staticQrCodeHash || facility.id)}
                  disabled={verificationState === 'VERIFYING'}
                  className="w-full py-3.5 rounded-xl btn-primary-green text-sm uppercase tracking-wide flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>⚡ Scan Entrance Turnstile QR (1-Click Test)</span>
                </button>
              ) : (
                <button
                  onClick={() => handleQrCodeScanned(facility.exitQrCodeHash || 'FACILITY_IV_APEX_DOWNTOWN_EXIT_2026')}
                  disabled={verificationState === 'VERIFYING'}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition active:scale-98 shadow-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span>🏁 Scan Exit Turnstile QR (1-Click Test)</span>
                </button>
              )}

              <p className="text-[11px] text-center text-slate-500 dark:text-zinc-400">
                Simulates scanning the {gateMode === 'ENTER' ? 'Entrance' : 'Exit'} Turnstile at {facility.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
