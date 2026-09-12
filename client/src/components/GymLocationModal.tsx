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
  Loader2
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
    }
  }, [gym, isOpen]);

  if (!isOpen) return null;

  // Auto-Detect Current GPS Coordinates using browser/device GPS
  const handleDetectCurrentLocation = () => {
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
      text: 'Acquiring high-accuracy GPS coordinates from your device...'
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const detectedLat = position.coords.latitude.toFixed(6);
        const detectedLng = position.coords.longitude.toFixed(6);
        const accuracy = Math.round(position.coords.accuracy);

        setLat(detectedLat);
        setLng(detectedLng);
        setGpsAccuracy(accuracy);
        setIsDetecting(false);
        setStatusMessage({
          type: 'success',
          text: `GPS locked! Accuracy: ±${accuracy}m. Click 'Save Gym Location' to apply.`
        });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in font-poppins">
      <div className="app-card w-full max-w-lg p-6 sm:p-7 relative max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-3xl">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <MapPin className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Gym Location & Geofence
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Anchor your turnstile QR code to this physical building
            </p>
          </div>
        </div>

        {/* Current Status Pill */}
        <div className={`p-3.5 rounded-2xl border text-xs mb-5 flex items-start gap-2.5 ${
          isLocationConfigured
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
        }`}>
          {isLocationConfigured ? (
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold block">
              {isLocationConfigured
                ? 'Geofence Active & Turnstile Locked'
                : 'Gym Coordinates Not Configured'}
            </span>
            <span className="text-[11px] opacity-90 block mt-0.5">
              {isLocationConfigured
                ? `Members must be physically within ${radius}m of (${lat}, ${lng}) to check in.`
                : 'Turnstile check-ins currently allow scans without GPS restriction. Set your coordinates below to activate anti-fraud geofencing.'}
            </span>
          </div>
        </div>

        {/* Auto-Detect One-Click Button */}
        <div className="mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-emerald-500" />
              <span>Are you currently at your gym?</span>
            </span>
            {gpsAccuracy && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                ±{gpsAccuracy}m accuracy
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleDetectCurrentLocation}
            disabled={isDetecting}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:text-black font-black text-xs transition flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isDetecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Detecting GPS Coordinates...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                <span>📍 Auto-Detect My Current GPS Location</span>
              </>
            )}
          </button>
        </div>

        {/* Manual Coordinates Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                Latitude (e.g. 28.535512)
              </label>
              <input
                type="text"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="28.535512"
                className="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                Longitude (e.g. 77.391024)
              </label>
              <input
                type="text"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="77.391024"
                className="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Geofence Radius Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                Turnstile Geofence Radius
              </label>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
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
              className="w-full accent-emerald-500 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />

            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
              <span>25m (Compact Studio)</span>
              <span>100m (Standard Gym)</span>
              <span>300m+ (Large Facility)</span>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-start gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : statusMessage.type === 'error'
                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
            }`}>
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
              {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
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
