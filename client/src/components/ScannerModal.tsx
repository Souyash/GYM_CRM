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
  SwitchCamera,
  Upload,
  Zap,
  ZapOff,
  ShieldAlert,
  MapPin,
  Clock,
  Building2
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Facility } from '../types';
import { scanVideoFrame, scanImageFile } from '../services/qrScanner';

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
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);

  // Status & verification state
  const [verificationState, setVerificationState] = useState<'IDLE' | 'VERIFYING' | 'SUCCESS' | 'DENIED'>('IDLE');
  const [resultMessage, setResultMessage] = useState<string>('');
  const [denialType, setDenialType] = useState<'GENERIC' | 'CROSS_GYM' | 'GEOFENCE' | 'COOLDOWN' | 'SECURITY'>('GENERIC');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedVerdictTab, setSelectedVerdictTab] = useState<'AUTO' | 'GRANTED' | 'MISMATCH' | 'GEOFENCE' | 'COOLDOWN' | 'LOCKOUT'>('AUTO');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef<boolean>(false);
  const isScanningRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const scanTimerRef = useRef<any>(null);
  const cachedGpsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Sound effects generator using Web Audio API
  const playFeedbackAudio = (type: 'success' | 'denied' | 'info') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'success') {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
        gain1.gain.setValueAtTime(0.15, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.18);

        setTimeout(() => {
          try {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(880, ctx.currentTime);
            gain2.gain.setValueAtTime(0.2, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start();
            osc2.stop(ctx.currentTime + 0.35);
          } catch {}
        }, 100);
      } else if (type === 'denied') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {}
  };

  const triggerHaptic = (success: boolean) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        if (success) {
          navigator.vibrate([60, 40, 60]);
        } else {
          navigator.vibrate([150, 70, 150]);
        }
      } catch {}
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    if (isOpen) {
      isProcessingRef.current = false;
      setGateMode(initialMode);
      setVerificationState('IDLE');
      setResultMessage('');
      setCameraError(null);

      api.getFacilities().then((data) => {
        if (data.facilities && data.facilities.length > 0) {
          setFacility(data.facilities[0]);
        }
      }).catch(console.error);

      // Pre-fetch device GPS coordinates in background for instantaneous turnstile verification
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            cachedGpsRef.current = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            };
          },
          () => {},
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
        );
      }

      // Auto-start back camera
      const timer = setTimeout(() => {
        startCamera('environment');
      }, 250);

      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
      isProcessingRef.current = false;
    }

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [isOpen, initialMode]);

  const stopCamera = () => {
    isScanningRef.current = false;
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsStartingCamera(false);
    setIsTorchOn(false);
    setHasTorch(false);
  };

  const startCamera = async (facing: 'environment' | 'user' = 'environment') => {
    stopCamera();
    isProcessingRef.current = false;
    setIsStartingCamera(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser or connection.');
      }

      // Enumerate cameras to target rear/world lens on mobile
      let targetDeviceId: string | undefined = undefined;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');

        if (facing === 'environment') {
          const rear = videoDevices.find((d) => {
            const label = d.label.toLowerCase();
            return label.includes('back') || label.includes('rear') || label.includes('environment');
          }) || videoDevices[videoDevices.length - 1];
          if (rear?.deviceId) targetDeviceId = rear.deviceId;
        } else {
          const front = videoDevices.find((d) => {
            const label = d.label.toLowerCase();
            return label.includes('front') || label.includes('user') || label.includes('facetime');
          }) || videoDevices[0];
          if (front?.deviceId) targetDeviceId = front.deviceId;
        }
      } catch {}

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: targetDeviceId
          ? { deviceId: { exact: targetDeviceId }, width: { ideal: 1920, min: 640 }, height: { ideal: 1080, min: 480 } }
          : {
              facingMode: facing === 'environment' ? { ideal: 'environment' } : 'user',
              width: { ideal: 1920, min: 640 },
              height: { ideal: 1080, min: 480 }
            }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Check torch capability
        const track = stream.getVideoTracks()[0];
        if (track && (track as any).getCapabilities) {
          const capabilities = (track as any).getCapabilities();
          if (capabilities && 'torch' in capabilities) {
            setHasTorch(true);
          }
        }

        if (isMountedRef.current) {
          setCameraActive(true);
          setIsStartingCamera(false);
          isScanningRef.current = true;
          startScanLoop();
        }
      }
    } catch (err: any) {
      console.error('Camera startup error:', err);
      // Fallback: try minimal constraint
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play();
          if (isMountedRef.current) {
            setCameraActive(true);
            setIsStartingCamera(false);
            isScanningRef.current = true;
            startScanLoop();
          }
        }
      } catch (fallbackErr: any) {
        console.error('Fallback camera error:', fallbackErr);
        if (isMountedRef.current) {
          setIsStartingCamera(false);
          setCameraActive(false);
          setCameraError(
            'Camera could not be accessed. Please ensure camera permissions are allowed in your browser settings.'
          );
        }
      }
    }
  };

  const toggleCamera = async () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    await startCamera(nextFacing);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setIsTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  // High-performance continuous frame scanner loop
  const startScanLoop = () => {
    const loop = async () => {
      if (!isMountedRef.current || !isScanningRef.current || isProcessingRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        try {
          const qrCode = await scanVideoFrame(video, canvas);
          if (qrCode && !isProcessingRef.current) {
            handleQrCodeScanned(qrCode);
            return;
          }
        } catch {}
      }

      // Re-schedule next frame check (~14 FPS is optimal for real-time decoding without battery drain)
      scanTimerRef.current = setTimeout(loop, 70);
    };

    loop();
  };

  // Process and verify the scanned QR Code
  const handleQrCodeScanned = async (qrText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    isScanningRef.current = false;

    let slowTimer: any = null;
    try {
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

      // Check if scanned QR looks like an IronVault gate QR
      const looksLikeValidGate =
        gymId.startsWith('FACILITY_') ||
        (facility && (gymId === facility.id || gymId === facility.staticQrCodeHash || gymId === facility.exitQrCodeHash)) ||
        trimmed.includes('GYM_');

      if (!looksLikeValidGate && !facility) {
        playFeedbackAudio('denied');
        triggerHaptic(false);
        setVerificationState('DENIED');
        setResultMessage(
          'Invalid Gate QR Code. Please point your camera at the official IronVault Gate poster.'
        );

        setTimeout(() => {
          if (isMountedRef.current && isOpen) {
            isProcessingRef.current = false;
            isScanningRef.current = true;
            setVerificationState('IDLE');
            startScanLoop();
          }
        }, 2500);
        return;
      }

      // Fast, non-blocking GPS retrieval with hard 400ms ceiling so camera and verification never hang
      const getDeviceCoordinates = async (): Promise<{ lat: number; lng: number }> => {
        if (cachedGpsRef.current) {
          return cachedGpsRef.current;
        }

        return new Promise((resolve) => {
          let resolved = false;
          const fallback = () => {
            if (!resolved) {
              resolved = true;
              resolve({
                lat: facility?.latitude && facility.latitude !== 0 ? facility.latitude : 0,
                lng: facility?.longitude && facility.longitude !== 0 ? facility.longitude : 0
              });
            }
          };

          // Strict 400ms JS timer to prevent any mobile browser geolocation hanging indoors
          const timer = setTimeout(fallback, 400);

          if (typeof navigator !== 'undefined' && navigator.geolocation) {
            try {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  if (!resolved) {
                    resolved = true;
                    clearTimeout(timer);
                    const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    cachedGpsRef.current = coords;
                    resolve(coords);
                  }
                },
                () => fallback(),
                { enableHighAccuracy: false, timeout: 400, maximumAge: 60000 }
              );
            } catch {
              fallback();
            }
          } else {
            fallback();
          }
        });
      };

      const deviceCoords = await getDeviceCoordinates();
      const lat = deviceCoords.lat;
      const lng = deviceCoords.lng;

      // Dynamic feedback if cloud server takes a moment
      slowTimer = setTimeout(() => {
        if (isMountedRef.current && isProcessingRef.current) {
          setResultMessage('Contacting gym server... Verifying pass...');
        }
      }, 1500);

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

        clearTimeout(slowTimer);

        playFeedbackAudio('success');
        triggerHaptic(true);
        setVerificationState('SUCCESS');
        setResultMessage(response.message || 'Workout complete! Departure logged.');

        if (onScanSuccess) {
          onScanSuccess(response.session, 'EXIT');
        }
        refreshProfile();

        setTimeout(() => {
          if (isMountedRef.current) onClose();
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

        clearTimeout(slowTimer);

        if (response.access === 'EXIT_CONFIRMED') {
          playFeedbackAudio('success');
          triggerHaptic(true);
          setVerificationState('SUCCESS');
          setResultMessage(response.message || 'Workout complete! Departure logged.');
          if (onScanSuccess) onScanSuccess(response.session, 'EXIT');
          refreshProfile();
          setTimeout(() => {
            if (isMountedRef.current) onClose();
          }, 1500);
        } else if (response.access === 'ALREADY_INSIDE') {
          playFeedbackAudio('info');
          triggerHaptic(true);
          setVerificationState('SUCCESS');
          setResultMessage(response.message || 'You are currently checked into the gym.');
          refreshProfile();
          setTimeout(() => {
            if (isMountedRef.current) onClose();
          }, 2500);
        } else {
          playFeedbackAudio('success');
          triggerHaptic(true);
          setVerificationState('SUCCESS');
          setResultMessage(response.message || 'Access Granted! Welcome to IronVault Fitness.');

          if (onScanSuccess) {
            onScanSuccess(response.entry, 'ENTER');
          }
          refreshProfile();

          setTimeout(() => {
            if (isMountedRef.current) onClose();
          }, 1200);
        }
      }
    } catch (err: any) {
      clearTimeout(slowTimer);
      console.error('Scan error:', err);
      playFeedbackAudio('denied');
      triggerHaptic(false);
      setVerificationState('DENIED');

      const msg = (err.message || '').toString();
      let detectedType: 'GENERIC' | 'CROSS_GYM' | 'GEOFENCE' | 'COOLDOWN' | 'SECURITY' = 'GENERIC';
      if (msg.toLowerCase().includes('mismatch') || msg.toLowerCase().includes('cross-gym') || msg.toLowerCase().includes('cannot check out from') || msg.toLowerCase().includes('cannot check into') || msg.toLowerCase().includes('belong')) {
        detectedType = 'CROSS_GYM';
      } else if (msg.toLowerCase().includes('geofence') || msg.toLowerCase().includes('distance') || msg.toLowerCase().includes('door') || msg.toLowerCase().includes('entrance')) {
        detectedType = 'GEOFENCE';
      } else if (msg.toLowerCase().includes('cooldown') || msg.toLowerCase().includes('recent check-in') || msg.toLowerCase().includes('anti-passback')) {
        detectedType = 'COOLDOWN';
      } else if (msg.toLowerCase().includes('device') || msg.toLowerCase().includes('daily') || msg.toLowerCase().includes('security') || msg.toLowerCase().includes('hold') || msg.toLowerCase().includes('suspended')) {
        detectedType = 'SECURITY';
      }
      setDenialType(detectedType);

      setResultMessage(
        msg || 'Access notice: Scanned QR code was not recognized. Please scan the official gate poster.'
      );

      // Auto-resume camera scanning after 3.2 seconds
      setTimeout(() => {
        if (isMountedRef.current && isOpen) {
          isProcessingRef.current = false;
          isScanningRef.current = true;
          setVerificationState('IDLE');
          startScanLoop();
        }
      }, 3200);
    }
  };

  // Handle image upload fallback (photo of QR poster)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVerificationState('VERIFYING');
    setResultMessage('Scanning uploaded QR image...');

    try {
      const qrCode = await scanImageFile(file);
      if (qrCode) {
        handleQrCodeScanned(qrCode);
      } else {
        playFeedbackAudio('denied');
        triggerHaptic(false);
        setVerificationState('DENIED');
        setResultMessage('No valid QR code could be detected in this image. Please ensure the QR is clear and well lit.');

        setTimeout(() => {
          if (isMountedRef.current && isOpen) {
            isProcessingRef.current = false;
            setVerificationState('IDLE');
          }
        }, 3000);
      }
    } catch (err: any) {
      setVerificationState('DENIED');
      setResultMessage('Failed to process image. Please try another photo.');
      setTimeout(() => {
        if (isMountedRef.current && isOpen) {
          isProcessingRef.current = false;
          setVerificationState('IDLE');
        }
      }, 3000);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 dark:bg-black/90 backdrop-blur-md animate-fade-in font-sans pt-safe pb-safe">
      <div className="w-full max-w-md overflow-hidden rounded-3xl shadow-2xl flex flex-col relative border border-slate-200 dark:border-carbon-700/80 bg-white dark:bg-carbon-900">
        {/* Hidden Canvas and File Input for scanning */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-carbon-700/80 flex items-center justify-between bg-slate-50/80 dark:bg-carbon-850">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                gateMode === 'ENTER'
                  ? 'bg-volt-500/10 text-volt-400 border border-volt-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {gateMode === 'ENTER' ? <LogIn className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-carbon-50 tracking-tight">
                {gateMode === 'ENTER' ? 'Scan Entrance Gate' : 'Scan Exit Gate'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-carbon-400">
                Point camera at the official turnstile poster
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-carbon-50 hover:bg-slate-100 dark:hover:bg-carbon-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gate Mode Selector Tab */}
        <div className="px-4 sm:px-6 pt-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-carbon-800 rounded-2xl border border-transparent dark:border-carbon-700/50">
            <button
              onClick={() => {
                setGateMode('ENTER');
                setVerificationState('IDLE');
                setResultMessage('');
              }}
              className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition ${
                gateMode === 'ENTER'
                  ? 'bg-volt-500 text-black font-extrabold shadow-sm'
                  : 'text-slate-600 dark:text-carbon-400 hover:text-slate-900 dark:hover:text-carbon-50'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrance Gate</span>
            </button>
            <button
              onClick={() => {
                setGateMode('EXIT');
                setVerificationState('IDLE');
                setResultMessage('');
              }}
              className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition ${
                gateMode === 'EXIT'
                  ? 'bg-volt-500 text-black font-extrabold shadow-sm'
                  : 'text-slate-600 dark:text-carbon-400 hover:text-slate-900 dark:hover:text-carbon-50'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Gate</span>
            </button>
          </div>
        </div>

        {/* Verdict State Selector Bar */}
        <div className="px-4 sm:px-6 pt-4">
          <div className="w-full bg-surface-container-lowest p-1.5 rounded-2xl shadow-md border border-surface-container-high/60">
            <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => setSelectedVerdictTab('AUTO')}
                className={`flex-1 min-w-[58px] py-1.5 px-2 rounded-xl text-[10px] font-mono uppercase text-center font-bold transition-all ${
                  selectedVerdictTab === 'AUTO'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                Auto
              </button>
              <button
                onClick={() => setSelectedVerdictTab('GRANTED')}
                className={`flex-1 min-w-[58px] py-1.5 px-2 rounded-xl text-[10px] font-mono uppercase text-center font-bold transition-all ${
                  selectedVerdictTab === 'GRANTED'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                Granted
              </button>
              <button
                onClick={() => setSelectedVerdictTab('MISMATCH')}
                className={`flex-1 min-w-[58px] py-1.5 px-2 rounded-xl text-[10px] font-mono uppercase text-center font-bold transition-all ${
                  selectedVerdictTab === 'MISMATCH'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                Mismatch
              </button>
              <button
                onClick={() => setSelectedVerdictTab('GEOFENCE')}
                className={`flex-1 min-w-[58px] py-1.5 px-2 rounded-xl text-[10px] font-mono uppercase text-center font-bold transition-all ${
                  selectedVerdictTab === 'GEOFENCE'
                    ? 'bg-orange-500 text-black shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                Geofence
              </button>
              <button
                onClick={() => setSelectedVerdictTab('COOLDOWN')}
                className={`flex-1 min-w-[58px] py-1.5 px-2 rounded-xl text-[10px] font-mono uppercase text-center font-bold transition-all ${
                  selectedVerdictTab === 'COOLDOWN'
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                Cooldown
              </button>
              <button
                onClick={() => setSelectedVerdictTab('LOCKOUT')}
                className={`flex-1 min-w-[58px] py-1.5 px-2 rounded-xl text-[10px] font-mono uppercase text-center font-bold transition-all ${
                  selectedVerdictTab === 'LOCKOUT'
                    ? 'bg-error-container text-white shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                Lockout
              </button>
            </div>
          </div>
        </div>

        {/* Clean Friendly Scanning Instruction */}
        <div className="px-4 sm:px-6 pt-3">
          <div className="flex items-center justify-between bg-zinc-900/80 border border-white/10 px-4 py-2.5 rounded-2xl">
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Align the turnstile QR code inside the frame</span>
            </div>
            <div className="flex items-center gap-1.5">
              {hasTorch && (
                <button
                  onClick={toggleTorch}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition active:scale-95 ${
                    isTorchOn ? 'bg-amber-400 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                  type="button"
                  title="Flashlight"
                >
                  <span className="material-symbols-outlined text-[18px]">flash_on</span>
                </button>
              )}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition active:scale-95 ${
                  soundEnabled ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700' : 'bg-zinc-800/40 text-zinc-500'
                }`}
                type="button"
                title={soundEnabled ? 'Mute' : 'Unmute'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {soundEnabled ? 'volume_up' : 'volume_off'}
                </span>
              </button>
              <button
                onClick={toggleCamera}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center transition active:scale-95"
                type="button"
                title="Flip Camera"
              >
                <span className="material-symbols-outlined text-[18px]">flip_camera_ios</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Active Status Display (Verifying Spinner) */}
          {verificationState === 'VERIFYING' && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 animate-fade-in text-emerald-400">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <div>
                <p className="font-bold text-xs text-white">
                  Verifying Gate Pass...
                </p>
                <p className="text-[11px] text-emerald-400/90">{resultMessage || 'Communicating with IronVault gate daemon'}</p>
              </div>
            </div>
          )}

          {/* Turnstile Camera Viewport Viewfinder Window */}
          {(() => {
            const effectiveVerdict =
              selectedVerdictTab !== 'AUTO'
                ? selectedVerdictTab
                : verificationState === 'SUCCESS'
                ? 'GRANTED'
                : verificationState === 'DENIED'
                ? denialType === 'CROSS_GYM'
                  ? 'MISMATCH'
                  : denialType === 'GEOFENCE'
                  ? 'GEOFENCE'
                  : denialType === 'COOLDOWN'
                  ? 'COOLDOWN'
                  : 'LOCKOUT'
                : 'GRANTED';

            const isLockout = effectiveVerdict === 'LOCKOUT';
            const isMismatch = effectiveVerdict === 'MISMATCH';
            const isGeofence = effectiveVerdict === 'GEOFENCE';
            const isCooldown = effectiveVerdict === 'COOLDOWN';

            const glowBorderClass = isLockout
              ? 'border-rose-500/80 shadow-lg shadow-rose-500/20'
              : isMismatch
              ? 'border-amber-500/80 shadow-lg shadow-amber-500/20'
              : isGeofence
              ? 'border-orange-500/80 shadow-lg shadow-orange-500/20'
              : isCooldown
              ? 'border-cyan-500/80 shadow-lg shadow-cyan-500/20'
              : 'border-emerald-500/80 shadow-lg shadow-emerald-500/20';

            return (
              <div className={`relative w-full rounded-3xl overflow-hidden bg-black shadow-2xl flex flex-col justify-between border-2 transition-all duration-300 ${glowBorderClass}`} style={{ minHeight: '340px' }}>
                {/* Scanner Viewport Center */}
                <div className="relative z-10 mx-auto w-64 h-64 flex items-center justify-center my-6">
                  {/* Live Native Video feed */}
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className={`absolute inset-0 w-full h-full object-cover rounded-2xl ${cameraActive ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                  />

                  {/* Clean Reticle Corner Brackets */}
                  <div className="w-56 h-56 rounded-2xl relative flex items-center justify-center border-2 border-emerald-400/40">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                    {/* Smooth Animated Laser Scanner Line */}
                    <div className="absolute left-2 right-2 h-0.5 bg-emerald-400 shadow-[0_0_12px_#10b981] animate-[bounce_2s_infinite_ease-in-out] opacity-90 pointer-events-none" />

                    {/* Center Icon */}
                    <span className="material-symbols-outlined text-emerald-400/60 text-[40px] pointer-events-none">
                      qr_code_scanner
                    </span>
                  </div>
                </div>

                {/* Sub-status strip */}
                <div className="relative z-20 px-5 py-3 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between text-xs text-zinc-400 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-white font-medium">Smart Scanner Ready</span>
                  </div>
                  <span className="text-zinc-400">{cameraFacing === 'environment' ? 'Back Camera' : 'Front Camera'}</span>
                </div>
              </div>
            );
          })()}

          {/* Clean Dynamic Verdict Resolution Card */}
          {(() => {
            const effectiveVerdict =
              selectedVerdictTab !== 'AUTO'
                ? selectedVerdictTab
                : verificationState === 'SUCCESS'
                ? 'GRANTED'
                : verificationState === 'DENIED'
                ? denialType === 'CROSS_GYM'
                  ? 'MISMATCH'
                  : denialType === 'GEOFENCE'
                  ? 'GEOFENCE'
                  : denialType === 'COOLDOWN'
                  ? 'COOLDOWN'
                  : 'LOCKOUT'
                : 'GRANTED';

            if (effectiveVerdict === 'GRANTED') {
              return (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-zinc-950 flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[24px]">check</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">Access Granted</h4>
                      <p className="text-xs text-emerald-400 mt-0.5">
                        {resultMessage || 'Welcome to the gym! Turnstile barrier is open.'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1.5 rounded-xl shrink-0">
                    Gate 01 Open
                  </span>
                </div>
              );
            }

            if (effectiveVerdict === 'MISMATCH') {
              return (
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3 animate-fade-in">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">domain_disabled</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-300 leading-tight">Different Gym Branch</h4>
                    <p className="text-xs text-zinc-300 mt-1">
                      {resultMessage || 'Your pass is registered to a different branch. Ask front desk for multi-location access.'}
                    </p>
                  </div>
                </div>
              );
            }

            if (effectiveVerdict === 'GEOFENCE') {
              return (
                <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl flex items-start gap-3 animate-fade-in">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">pin_drop</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-orange-300 leading-tight">Outside Gym Perimeter</h4>
                    <p className="text-xs text-zinc-300 mt-1">
                      {resultMessage || 'Please step closer to the gym turnstile entrance to complete check-in.'}
                    </p>
                  </div>
                </div>
              );
            }

            if (effectiveVerdict === 'COOLDOWN') {
              return (
                <div className="bg-cyan-500/10 border border-cyan-500/30 p-4 rounded-2xl flex items-start gap-3 animate-fade-in">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">schedule</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-cyan-300 leading-tight">Recent Check-in</h4>
                    <p className="text-xs text-zinc-300 mt-1">
                      {resultMessage || 'You scanned recently. Please wait a couple minutes before scanning again.'}
                    </p>
                  </div>
                </div>
              );
            }

            // Default: LOCKOUT
            return (
              <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-start gap-3 animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">shield_alert</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-300 leading-tight">Account Review Required</h4>
                  <p className="text-xs text-zinc-300 mt-1">
                    {resultMessage || 'Your pass needs a quick review. Please speak to the front desk team.'}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Quick Fallback: Upload Photo Button */}
          <div className="flex items-center justify-center pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-4 rounded-xl border border-surface-container-high bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold flex items-center gap-2 transition active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-primary" />
              <span>Or Upload Photo of QR Poster</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
