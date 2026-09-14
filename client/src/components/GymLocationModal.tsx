import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Crosshair,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  Sliders,
  Building2,
  Navigation,
  Loader2,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

interface GymLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  gym: any;
  onGymUpdated?: (updatedGym: any) => void;
}

export const GymLocationModal: React.FC<GymLocationModalProps> = ({
  isOpen,
  onClose,
  gym,
  onGymUpdated
}) => {
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [radius, setRadius] = useState<number>(100);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  useEffect(() => {
    if (gym && isOpen) {
      const currentLat = gym.latitude !== undefined && gym.latitude !== 0 ? gym.latitude.toString() : '';
      const currentLng = gym.longitude !== undefined && gym.longitude !== 0 ? gym.longitude.toString() : '';
      const currentRadius = gym.geofenceRadiusMeters ? Number(gym.geofenceRadiusMeters) : 100;

      setLat(currentLat);
      setLng(currentLng);
      setRadius(currentRadius);
      setStatusMessage(null);
      setGpsAccuracy(null);

      // Auto-fetch GPS immediately when modal opens if coordinates are not yet set
      if (!currentLat || !currentLng || currentLat === '0' || currentLng === '0') {
        handleDetectCurrentLocation(false);
      }
    }
  }, [gym, isOpen]);

  if (!isOpen) return null;

  // Auto-Detect Current GPS Coordinates using browser/device GPS
  const handleDetectCurrentLocation = (autoSaveOnLock: boolean = false) => {
    if (!navigator.geolocation) {
      setStatusMessage({
        type: 'error',
        text: 'Geolocation is not supported by your browser or device.'
      });
      return;
    }

    setIsDetecting(true);
    setStatusMessage({
      type: 'info',
      text: autoSaveOnLock
        ? '📡 Contacting GPS satellites... Fetching high-precision coordinates to auto-save.'
        : '📡 Contacting GPS satellites... Acquiring high-precision coordinates.'
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const detectedLat = position.coords.latitude.toFixed(6);
        const detectedLng = position.coords.longitude.toFixed(6);
        const accuracy = Math.round(position.coords.accuracy);

        setLat(detectedLat);
        setLng(detectedLng);
        setGpsAccuracy(accuracy);
        setIsDetecting(false);

        if (autoSaveOnLock) {
          try {
            setIsSaving(true);
            const res = await api.updateGym(gym.id, {
              latitude: parseFloat(detectedLat),
              longitude: parseFloat(detectedLng),
              geofenceRadiusMeters: radius
            });

            setStatusMessage({
              type: 'success',
              text: `✅ GPS locked (±${accuracy}m) & saved! Turnstile geofence is now ACTIVE.`
            });

            if (onGymUpdated && res.gym) {
              onGymUpdated(res.gym);
            }

            setTimeout(() => {
              onClose();
            }, 1200);
          } catch (saveErr: any) {
            setStatusMessage({
              type: 'error',
              text: saveErr.message || 'Failed to auto-save coordinates.'
            });
          } finally {
            setIsSaving(false);
          }
        } else {
          setStatusMessage({
            type: 'success',
            text: `GPS locked! Accuracy: ±${accuracy}m. Click 'Save Gym Location' to apply.`
          });
        }
      },
      (error) => {
        setIsDetecting(false);
        let errorMsg = 'Could not retrieve GPS location.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location permission was denied. Please allow location access in your browser/phone settings, or enter coordinates manually.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Location information is unavailable. Please check your GPS connection or enter coordinates manually.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'GPS location request timed out. Please try again or enter coordinates manually.';
        }
        setStatusMessage({
          type: 'error',
          text: errorMsg
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  // Save coordinates to backend database
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter valid numerical latitude and longitude coordinates.'
      });
      return;
    }

    if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
      setStatusMessage({
        type: 'error',
        text: 'Latitude must be between -90 and 90. Longitude must be between -180 and 180.'
      });
      return;
    }

    try {
      setIsSaving(true);
      setStatusMessage(null);

      const res = await api.updateGym(gym.id, {
        latitude: parsedLat,
        longitude: parsedLng,
        geofenceRadiusMeters: radius
      });

      setStatusMessage({
        type: 'success',
        text: 'Gym location and geofence radius updated successfully!'
      });

      if (onGymUpdated && res.gym) {
        onGymUpdated(res.gym);
      }

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error('Failed to update gym location:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to save gym location to server.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isLocationConfigured = lat !== '' && lng !== '' && lat !== '0' && lng !== '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-['Poppins',sans-serif] font-poppins">
      <div className="bg-[#0e1015] w-full max-w-lg p-6 sm:p-7 relative max-h-[92vh] overflow-y-auto border border-white/10 shadow-2xl rounded-3xl">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center text-[#ccff00] shrink-0">
            <MapPin className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold font-['Syne',sans-serif] uppercase text-white tracking-wide">
              Gym Location & Check-In Area
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              Ensure members must be at the gym building to check in
            </p>
          </div>
        </div>

        {/* Current Status Pill */}
        <div className={`p-4 rounded-2xl border text-xs mb-5 flex items-start gap-3 ${
          isLocationConfigured
            ? 'bg-[#ccff00]/10 border-[#ccff00]/30 text-white'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
        }`}>
          {isLocationConfigured ? (
            <ShieldCheck className="w-4 h-4 text-[#ccff00] shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold block text-white">
              {isLocationConfigured
                ? 'Location Check Active & Secure'
                : 'Gym Location Not Set Yet'}
            </span>
            <span className="text-[11px] text-white/60 block mt-0.5 leading-relaxed">
              {isLocationConfigured
                ? `Members must be physically within ${radius} meters of the gym to check in.`
                : 'Check-ins currently allow scans from anywhere. Save your gym location below to make sure scans only work at the gym doors.'}
            </span>
          </div>
        </div>

        {/* Auto-Detect One-Click Button */}
        <div className="mb-5 p-4 rounded-2xl bg-[#121418] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-[#ccff00]" />
              <span>Are you currently at your gym?</span>
            </span>
            {gpsAccuracy && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ccff00]/20 text-[#ccff00] font-bold">
                ±{gpsAccuracy}m accuracy
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDetectCurrentLocation(true)}
              disabled={isDetecting || isSaving}
              className="py-2.5 px-4 rounded-full bg-[#ccff00] hover:bg-[#b8e600] text-black font-black text-xs transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.25)] active:scale-95 disabled:opacity-50"
              title="Auto-fetch GPS from your phone/computer and immediately save and activate geofence"
            >
              {isDetecting || isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>⚡ Auto-Fetch & Save</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleDetectCurrentLocation(false)}
              disabled={isDetecting || isSaving}
              className="py-2.5 px-4 rounded-full bg-[#121418] border border-white/10 hover:bg-white/10 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Navigation className="w-3.5 h-3.5 text-[#ccff00]" />
              <span>Fetch & Review First</span>
            </button>
          </div>
        </div>

        {/* Manual Coordinates Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-white/70 block mb-1">
                Latitude (e.g. 28.535512)
              </label>
              <input
                type="text"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="28.535512"
                className="w-full bg-[#121418] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#ccff00]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white/70 block mb-1">
                Longitude (e.g. 77.391024)
              </label>
              <input
                type="text"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="77.391024"
                className="w-full bg-[#121418] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#ccff00]"
              />
            </div>
          </div>

          {/* Geofence Radius Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-white/70">
                Check-In Distance Radius
              </label>
              <span className="text-xs font-black text-[#ccff00] font-mono">
                {radius} meters (~{Math.round(radius * 3.28)} ft)
              </span>
            </div>
            
            <input
              type="range"
              min="25"
              max="500"
              step="25"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-[#ccff00] h-2 bg-[#121418] rounded-lg cursor-pointer"
            />

            <div className="flex items-center justify-between text-[10px] text-white/40 mt-1">
              <span>25m (Compact Studio)</span>
              <span>100m (Standard Gym)</span>
              <span>300m+ (Large Facility)</span>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3 rounded-2xl text-xs font-bold flex items-start gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/30'
                : statusMessage.type === 'error'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                : 'bg-sky-500/10 text-sky-300 border border-sky-500/30'
            }`}>
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
              {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-full border border-white/10 text-xs font-bold text-white/70 hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 px-4 rounded-full bg-[#ccff00] hover:bg-[#b8e600] text-black font-black text-xs transition shadow-[0_0_20px_rgba(204,255,0,0.25)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{isSaving ? 'Saving...' : 'Save Gym Location'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

