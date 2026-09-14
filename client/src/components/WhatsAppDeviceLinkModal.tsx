import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Send,
  Wifi,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { api } from '../services/api';

interface WhatsAppDeviceLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DeviceStatus {
  isConnected: boolean;
  status: 'CONNECTED' | 'SCAN_QR' | 'CONNECTING' | 'LOGGED_OUT' | 'DISCONNECTED';
  phone?: string | null;
  pushName?: string | null;
  qrCode?: string | null;
}

export const WhatsAppDeviceLinkModal: React.FC<WhatsAppDeviceLinkModalProps> = ({
  isOpen,
  onClose
}) => {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    isConnected: false,
    status: 'CONNECTING'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testStatus, setTestStatus] = useState<{ type: 'idle' | 'sending' | 'success' | 'error'; message?: string }>({ type: 'idle' });
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await api.getWhatsAppDeviceStatus();
      setDeviceStatus(res);
      if (res.phone && !testPhone) {
        setTestPhone(res.phone.replace(/[^\d]/g, ''));
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp device status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    setIsLoading(true);
    fetchStatus();

    // Poll every 3.5 seconds while modal is open to detect phone QR scan instantly
    pollingRef.current = setInterval(fetchStatus, 3500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen]);

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to unlink this WhatsApp phone? Automated messages will pause until a new phone is linked.')) {
      return;
    }

    setIsDisconnecting(true);
    try {
      await api.disconnectWhatsAppDevice();
      setDeviceStatus({ isConnected: false, status: 'CONNECTING', qrCode: null });
      setTimeout(fetchStatus, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to unlink device');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSendTestPing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) return;

    setTestStatus({ type: 'sending' });
    try {
      const res = await api.sendWhatsAppDeviceTest(testPhone.trim());
      setTestStatus({ type: 'success', message: res.message || 'Test message sent successfully!' });
      setTimeout(() => setTestStatus({ type: 'idle' }), 5000);
    } catch (err: any) {
      setTestStatus({ type: 'error', message: err.message || 'Failed to dispatch test message' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0c0d12] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-[#12141a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white font-['Poppins']">
                  WhatsApp Device Link
                </h3>
                {deviceStatus.isConnected ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    AWAITING SCAN
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Multi-Device automated messaging for bills & OTPs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#ccff00] animate-spin" />
              <p className="text-sm text-neutral-400">Connecting to WhatsApp Socket...</p>
            </div>
          ) : deviceStatus.isConnected ? (
            /* Connected State */
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    Device Linked Successfully
                  </div>
                  <p className="text-xs text-emerald-200/80 leading-relaxed">
                    Your phone is connected as a secure Multi-Device agent. Member enrollment receipts, security OTPs, and expiry reminders are automatically dispatched directly from this number.
                  </p>
                </div>
              </div>

              {/* Linked Device Info Card */}
              <div className="p-4 rounded-2xl bg-[#14161f] border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Linked Phone Number</span>
                  <span className="text-white font-mono font-bold text-sm bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                    {deviceStatus.phone || 'Connected'}
                  </span>
                </div>
                {deviceStatus.pushName && (
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>Sender Name</span>
                    <span className="text-neutral-200 font-medium">{deviceStatus.pushName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Delivery Engine</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> High-Speed WebSockets
                  </span>
                </div>
              </div>

              {/* Test Ping Tool */}
              <div className="p-4 rounded-2xl bg-[#14161f] border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
                  <Send className="w-3.5 h-3.5 text-[#ccff00]" />
                  <span>Send a Test Message</span>
                </div>
                <form onSubmit={handleSendTestPing} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#ccff00]"
                  />
                  <button
                    type="submit"
                    disabled={testStatus.type === 'sending' || !testPhone.trim()}
                    className="px-4 py-2 rounded-xl bg-[#ccff00] text-black text-xs font-bold hover:bg-[#b8e600] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {testStatus.type === 'sending' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Send Ping'
                    )}
                  </button>
                </form>
                {testStatus.message && (
                  <p className={`text-xs ${testStatus.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {testStatus.message}
                  </p>
                )}
              </div>

              {/* Unlink Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="w-full py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {isDisconnecting ? 'Unlinking Device...' : 'Unlink / Switch WhatsApp Phone'}
                </button>
              </div>
            </div>
          ) : (
            /* Unlinked / Scan QR State */
            <div className="space-y-5 animate-fadeIn">
              {/* QR Display Card */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-[#141722] to-[#0d0f17] border border-white/10 text-center space-y-4">
                {deviceStatus.qrCode ? (
                  <div className="relative group">
                    <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-white/10">
                      <img
                        src={deviceStatus.qrCode}
                        alt="WhatsApp QR Code"
                        className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg"
                      />
                    </div>
                    <div className="absolute inset-0 rounded-2xl pointer-events-none border-2 border-emerald-400/40 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin" />
                    <p className="text-xs text-neutral-400">Generating fresh QR code...</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchStatus}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-xs transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh QR
                  </button>
                  <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                    <Wifi className="w-3 h-3 text-emerald-400" /> Auto-syncing
                  </span>
                </div>
              </div>

              {/* Instructions Guide */}
              <div className="p-4 rounded-2xl bg-[#14161f] border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Info className="w-4 h-4 text-[#ccff00]" />
                  <span>How to scan from your phone:</span>
                </div>
                <ol className="text-xs text-neutral-300 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
                  <li>Open <strong className="text-white">WhatsApp</strong> or <strong className="text-white">WhatsApp Business</strong> on your phone.</li>
                  <li>Tap <strong className="text-white">Settings</strong> (iOS) or <strong className="text-white">⋮ More options</strong> (Android).</li>
                  <li>Tap <strong className="text-white">Linked devices</strong> &rarr; <strong className="text-white">Link a device</strong>.</li>
                  <li>Point your camera at the QR code above to link instantly.</li>
                </ol>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-blue-300 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Your phone remains normal. Messages sent by the CRM will appear right in your phone's WhatsApp chat history!</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#0e0f14] flex items-center justify-between text-[11px] text-neutral-500">
          <span>Powered by FIDGIT Multi-Device Engine</span>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

