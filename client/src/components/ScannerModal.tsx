import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  CheckCircle,
  RefreshCw,
  Navigation,
  LogOut,
  LogIn,
  AlertOctagon,
  SwitchCamera
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
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);

  // Status & verification state
  const [verificationState, setVerificationState] = useState<'IDLE' | 'VERIFYING' | 'SUCCESS' | 'DENIED'>('IDLE');
  const [resultMessage, setResultMessage] = useState<string>('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef<boolean>(false);

  useEffect(() => {
    isMountedRef.current = true;
    if (isOpen) {
      setGateMode(initialMode);
      setVerificationState('IDLE');
      setResultMessage('');
      setCameraError(null);

      api.getFacilities().then((data) => {
        if (data.facilities && data.facilities.length > 0) {
          setFacility(data.facilities[0]);
        }
      }).catch(console.error);

      // Auto-start back camera when opened
      const timer = setTimeout(() => {
        startBackCamera('environment');
      }, 300);

      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [isOpen, initialMode]);

  const startBackCamera = async (facing: 'environment' | 'user' = 'environment') => {
    try {
      setIsStartingCamera(true);
      setCameraError(null);

      // Stop existing instance
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch {}
        scannerRef.current = null;
      }

      const container = document.getElementById('qr-reader-container');
      if (!container) {
        setIsStartingCamera(false);
        return;
      }

      const html5QrCode = new Html5Qrcode('qr-reader-container');
      scannerRef.current = html5QrCode;

      // Query cameras to prioritize rear/back lens on mobile phones
      const cameras = await Html5Qrcode.getCameras().catch(() => []);
      let cameraConfig: any = { facingMode: facing };

      if (cameras && cameras.length > 0) {
        if (facing === 'environment') {
          // Look for rear, back, environment, or world cameras
          const rearCam = cameras.find((c) => {
            const label = c.label.toLowerCase();
            return label.includes('back') || label.includes('rear') || label.includes('environment') || label.includes('world');
          }) || cameras[cameras.length - 1]; // On Android and iOS, the rear camera is usually the last enumerated device

          if (rearCam?.id) {
            cameraConfig = rearCam.id;
          }
        } else {
          // Front camera
          const frontCam = cameras.find((c) => {
            const label = c.label.toLowerCase();
            return label.includes('front') || label.includes('user') || label.includes('facetime');
          }) || cameras[0];

          if (frontCam?.id) {
            cameraConfig = frontCam.id;
          }
        }
      }

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrEdgeSize = Math.floor(minEdge * 0.72);
            return { width: qrEdgeSize, height: qrEdgeSize };
          },
          aspectRatio: 1.0
        },
        (decodedText) => {
          handleQrCodeScanned(decodedText);
        },
        () => {}
      );

      if (isMountedRef.current) {
        setCameraActive(true);
        setIsStartingCamera(false);
      }
    } catch (err: any) {
      console.warn('Direct back camera start failed, attempting fallback:', err);
      // Fallback: try standard environment facingMode
      try {
        if (scannerRef.current) {
          await scannerRef.current.start(
            { facingMode: 'environment' },
            { fps: 15, qrbox: { width: 250, height: 250 } },
            (decodedText) => handleQrCodeScanned(decodedText),
            () => {}
          );
          if (isMountedRef.current) {
            setCameraActive(true);
            setIsStartingCamera(false);
          }
          return;
        }
      } catch (fallbackErr: any) {
        console.error('Camera fallback error:', fallbackErr);
        if (isMountedRef.current) {
          setCameraError(
            'Back camera could not be accessed. Please ensure camera permissions are allowed in your browser settings.'
          );
          setCameraActive(false);
          setIsStartingCamera(false);
        }
      }
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

  const toggleCamera = async () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    await stopCamera();
    await startBackCamera(nextFacing);
  };

  // Process and actually verify the scanned QR Code
  const handleQrCodeScanned = async (qrText: string) => {
    try {
      stopCamera();
      setVerificationState('VERIFYING');
      setResultMessage(
        gateMode === 'ENTER'
          ? 'Verifying gate pass with gym turnstile...'
          : 'Verifying exit & logging workout duration...'
      );

      const trimmed = qrText.trim();
      let gymId = trimmed;
      let scannedAction = gateMode;

      try {
        const parsed = JSON.parse(trimmed);
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
        if (trimmed.includes('EXIT')) {
          scannedAction = 'EXIT';
          setGateMode('EXIT');
        }
      }

      // Check if scanned QR is a valid IronVault Gate QR
      const looksLikeValidGate =
        gymId.startsWith('FACILITY_') ||
        (facility && (gymId === facility.id || gymId === facility.staticQrCodeHash || gymId === facility.exitQrCodeHash)) ||
        trimmed.includes('GYM_');

      if (!looksLikeValidGate && !facility) {
        setVerificationState('DENIED');
        setResultMessage(
          'Invalid Gate QR Code. Please point your camera at the official IronVault Gate poster.'
        );
        // Resume camera scan after notice
        setTimeout(() => {
          if (isOpen) {
            setVerificationState('IDLE');
            startBackCamera(cameraFacing);
          }
        }, 2500);
        return;
      }

      const lat = facility?.latitude || 37.774929;
      const lng = facility?.longitude || -122.419416;

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
      setResultMessage(
        err.message || 'Access notice: Scanned QR code was not recognized. Please scan the official gate poster.'
      );

      // Auto-restart camera after 3 seconds so the member can scan again
      setTimeout(() => {
        if (isOpen) {
          setVerificationState('IDLE');
          startBackCamera(cameraFacing);
        }
      }, 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 dark:bg-black/85 backdrop-blur-md animate-fade-in font-poppins">
      <div className="app-card w-full max-w-md overflow-hidden shadow-2xl flex flex-col relative border border-slate-200 dark:border-zinc-800">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                gateMode === 'ENTER'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
              }`}
            >
              {gateMode === 'ENTER' ? <LogIn className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                {gateMode === 'ENTER' ? 'Scan Entrance Turnstile' : 'Scan Exit Turnstile'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Point your back camera at the physical gate poster
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
              onClick={() => {
                setGateMode('ENTER');
                setVerificationState('IDLE');
                setResultMessage('');
              }}
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
              onClick={() => {
                setGateMode('EXIT');
                setVerificationState('IDLE');
                setResultMessage('');
              }}
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

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          {/* Active Status Display */}
          {verificationState === 'VERIFYING' && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-3 animate-fade-in">
              <RefreshCw className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-spin" />
              <div>
                <p className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
                  Verifying Turnstile QR
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{resultMessage}</p>
              </div>
            </div>
          )}

          {verificationState === 'SUCCESS' && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 flex items-start gap-3 animate-fade-in">
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
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 flex items-start gap-3 animate-fade-in">
              <AlertOctagon className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-black text-base text-amber-800 dark:text-amber-300">Verification Notice</p>
                <p className="text-xs text-amber-900 dark:text-amber-100 font-medium">{resultMessage}</p>
              </div>
            </div>
          )}

          {/* Real-time Back Camera Viewfinder */}
          <div className="relative rounded-3xl overflow-hidden bg-black border-2 border-emerald-500/40 aspect-square max-h-72 mx-auto flex items-center justify-center shadow-inner">
            <div id="qr-reader-container" className="w-full h-full"></div>

            {/* Overlaid Animated Scanner Reticle */}
            {cameraActive && verificationState === 'IDLE' && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="w-48 h-48 border-2 border-dashed border-emerald-400/70 rounded-2xl relative flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                  <div className="w-full h-0.5 bg-emerald-400/80 shadow-glow-green animate-pulse" />
                </div>
              </div>
            )}

            {/* Camera Switcher Icon (Flip between Back/Front camera) */}
            {cameraActive && (
              <button
                type="button"
                onClick={toggleCamera}
                title="Switch Camera (Back/Front)"
                className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition active:scale-95 shadow-lg"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}

            {/* Inactive or Error State */}
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-900/95 dark:bg-black/95 text-white space-y-3">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <Camera className="w-8 h-8" />
                </div>
                <p className="text-xs text-slate-300 max-w-xs">
                  {cameraError || (isStartingCamera ? 'Opening back camera...' : 'Starting turnstile scanner...')}
                </p>
                <button
                  onClick={() => startBackCamera(cameraFacing)}
                  disabled={isStartingCamera}
                  className="px-5 py-2.5 rounded-xl btn-primary-green text-xs font-black flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isStartingCamera ? 'Opening Camera...' : 'Open Back Camera'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Location Verification & Instruction */}
          <div className="app-card-subtle p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Turnstile Gate:
              </span>
              <span className="badge-active-green text-[10px]">
                {gateMode === 'ENTER' ? 'Entrance Gate Turnstile' : 'Exit Gate Turnstile'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-zinc-400 text-center pt-1 border-t border-slate-200 dark:border-zinc-800">
              Aim your camera at the physical {gateMode === 'ENTER' ? 'Entrance' : 'Exit'} poster at the gate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
