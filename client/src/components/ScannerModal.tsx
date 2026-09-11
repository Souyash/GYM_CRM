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
  ZapOff
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

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef<boolean>(false);
  const isScanningRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const scanTimerRef = useRef<any>(null);

  // Sound effects generator using Web Audio API
  const playFeedbackAudio = (type: 'success' | 'denied' | 'info') => {
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
      console.error('Scan error:', err);
      playFeedbackAudio('denied');
      triggerHaptic(false);
      setVerificationState('DENIED');
      setResultMessage(
        err.message || 'Access notice: Scanned QR code was not recognized. Please scan the official gate poster.'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 dark:bg-black/85 backdrop-blur-md animate-fade-in font-poppins pt-safe pb-safe">
      <div className="app-card w-full max-w-md overflow-hidden shadow-2xl flex flex-col relative border border-slate-200 dark:border-zinc-800">
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

          {/* Real-time Back Camera Viewfinder with Native Video Stream */}
          <div className="relative rounded-3xl overflow-hidden bg-black border-2 border-emerald-500/40 aspect-square max-h-72 mx-auto flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className={`w-full h-full object-cover ${cameraActive ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            />

            {/* Overlaid Animated Scanner Reticle */}
            {cameraActive && verificationState === 'IDLE' && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="w-48 h-48 border-2 border-dashed border-emerald-400/80 rounded-2xl relative flex items-center justify-center shadow-2xl">
                  {/* Glowing corner brackets */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-sm" />

                  {/* Pulsing horizontal laser beam */}
                  <div className="w-full h-0.5 bg-emerald-400/90 shadow-glow-green animate-pulse" />
                </div>
              </div>
            )}

            {/* Controls Bar (Camera Switch, Torch, Upload) */}
            {cameraActive && (
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    title={isTorchOn ? 'Turn Off Flashlight' : 'Turn On Flashlight'}
                    className={`p-2 rounded-xl backdrop-blur-md border transition active:scale-95 shadow-lg ${
                      isTorchOn
                        ? 'bg-amber-500 text-black border-amber-300'
                        : 'bg-black/60 hover:bg-black/80 text-white border-white/20'
                    }`}
                  >
                    {isTorchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleCamera}
                  title="Switch Camera (Back/Front)"
                  className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition active:scale-95 shadow-lg"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              </div>
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
                  onClick={() => startCamera(cameraFacing)}
                  disabled={isStartingCamera}
                  className="px-5 py-2.5 rounded-xl btn-primary-green text-xs font-black flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isStartingCamera ? 'Opening Camera...' : 'Open Back Camera'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Fallback: Upload Photo Button */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-2 px-4 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-2 transition"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Or Upload Photo of QR Poster</span>
            </button>
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
