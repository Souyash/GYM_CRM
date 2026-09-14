import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Check,
  CheckCheck,
  Copy,
  ExternalLink,
  ShieldCheck,
  Receipt,
  Clock,
  Sparkles,
  Send
} from 'lucide-react';

interface WhatsAppDeliveryPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientPhone?: string;
  recipientName?: string;
  messageType?: 'WELCOME_BILL' | 'EXPIRY_REMINDER' | 'RENEWAL_RECEIPT' | 'OTP';
  customContent?: string;
  invoiceData?: {
    invoiceNumber?: string;
    planName?: string;
    price?: number;
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
    gymName?: string;
  };
}

export const WhatsAppDeliveryPreviewModal: React.FC<WhatsAppDeliveryPreviewModalProps> = ({
  isOpen,
  onClose,
  recipientPhone = '+919876543210',
  recipientName = 'Member',
  messageType = 'WELCOME_BILL',
  customContent,
  invoiceData
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const defaultInvoiceNumber = invoiceData?.invoiceNumber || 'INV-2026-92841';
  const defaultPlan = invoiceData?.planName || 'Monthly Pro Access';
  const defaultPrice = invoiceData?.price !== undefined ? invoiceData.price : 65.0;
  const defaultGym = invoiceData?.gymName || 'FIDGIT Fitness & Gym';
  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const futureStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const getPreviewText = (): string => {
    if (customContent) return customContent;

    if (messageType === 'WELCOME_BILL') {
      return `🎉 *WELCOME TO ${defaultGym.toUpperCase()}!*
_Powered by FIDGIT Smart Gym OS_

Hi *${recipientName}*, your gym membership account has been verified and activated! Here are your official enrollment details and invoice:

📋 *MEMBERSHIP SUMMARY*
• Member Name: *${recipientName}*
• Gym Facility: *${defaultGym}*
• Access Pass ID: *#PASS-ACTIVE*
• Active Plan: *${defaultPlan}* (30 Days)
• Status: *ACTIVE* 🟢
• Validity: *${todayStr}* to *${invoiceData?.endDate || futureStr}*

🧾 *DIGITAL TAX INVOICE & RECEIPT*
• Invoice #: *${defaultInvoiceNumber}*
• Date: *${todayStr}*
• Amount Paid: *₹${defaultPrice.toFixed(2)}*
• Mode of Payment: *${invoiceData?.paymentMethod || 'CASH'}*
• Entrance QR Turnstile: *UNLOCKED & ACTIVE* ⚡

📱 *HOW TO ENTER THE GYM:*
1. Open the FIDGIT mobile app on your smartphone.
2. Tap *Scanner* and scan the QR code located at the entrance gate.
3. Access is verified in under 1 second!

Keep this receipt for your records. Have a powerful workout today! 💪`;
    }

    if (messageType === 'EXPIRY_REMINDER') {
      return `⚠️ *${defaultGym.toUpperCase()} • MEMBERSHIP NOTICE (3 DAYS LEFT)*

Hi *${recipientName}*, your *${defaultPlan}* pass will expire in *3 days* on *${invoiceData?.endDate || futureStr}*.

Avoid interruption to your entrance turnstile access by renewing early at the front desk or via your member app.

_Note: Once renewal payment is processed, all expiry alerts are automatically turned off._

_FIDGIT Automated Membership Alert_`;
    }

    if (messageType === 'RENEWAL_RECEIPT') {
      return `✅ *PAYMENT CONFIRMED • RENEWAL RECEIPT*
*${defaultGym.toUpperCase()}*

Hi *${recipientName}*, your payment has been successfully recorded!

🧾 *OFFICIAL RECEIPT DETAILS*
• Invoice #: *${defaultInvoiceNumber}*
• Plan Renewed: *${defaultPlan}*
• Amount Paid: *₹${defaultPrice.toFixed(2)}*
• Payment Mode: *${invoiceData?.paymentMethod || 'CASH'}*
• New Expiration Date: *${invoiceData?.endDate || futureStr}*
• Entrance Status: *ACTIVE & UNLOCKED* 🟢

🔔 *NOTIFICATION STATUS:*
Your membership expiry reminders have been *TURNED OFF*. Your entrance QR pass is valid and fully active.

Thank you for training with us! 💪`;
    }

    return `🏋️ *${defaultGym.toUpperCase()} • SECURITY OTP*
Hi *${recipientName}*, your 6-digit WhatsApp verification code is:

👉 *749215* 👈

Use this code to verify your phone number and activate your gym pass. This code expires in 10 minutes.`;
  };

  const previewText = getPreviewText();

  const handleCopy = () => {
    navigator.clipboard.writeText(previewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsAppWeb = () => {
    const cleanPhone = recipientPhone.replace(/[^\d]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(previewText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Top Header - WhatsApp Styled */}
        <div className="bg-[#075e54] px-5 py-4 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white font-black text-sm">
              {recipientName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm leading-tight text-white">{recipientName}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 inline" />
              </div>
              <p className="text-[11px] text-emerald-100/90 leading-tight">
                {recipientPhone} • <span className="text-emerald-300 font-semibold">WhatsApp Business</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Strip */}
        <div className="bg-[#128c7e]/20 border-b border-emerald-500/20 px-4 py-2 flex items-center justify-between text-[11px] text-emerald-300">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Direct WhatsApp Delivery Confirmation
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 font-bold tracking-wider text-[10px] text-emerald-200">
            ACTIVE DISPATCH
          </span>
        </div>

        {/* WhatsApp Chat Body */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-3"
          style={{
            backgroundColor: '#0b141a',
            backgroundImage: `radial-gradient(#1f2c34 1px, transparent 1px)`,
            backgroundSize: '16px 16px'
          }}
        >
          {/* Security Notice Pill */}
          <div className="flex justify-center">
            <span className="text-[10px] bg-[#182229] text-zinc-400 px-3 py-1 rounded-lg shadow-sm border border-zinc-800 text-center max-w-[85%]">
              🔒 Messages are end-to-end encrypted with FIDGIT WhatsApp Cloud Gateway.
            </span>
          </div>

          {/* Chat Bubble */}
          <div className="flex justify-start">
            <div className="bg-[#202c33] text-zinc-100 rounded-2xl rounded-tl-sm p-3.5 max-w-[92%] shadow-lg border border-zinc-700/50 relative text-[13px] leading-relaxed whitespace-pre-wrap font-sans select-text">
              {previewText}

              {/* Timestamp and Double Checkmark */}
              <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-zinc-400">
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-900 p-4 border-t border-zinc-800 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border border-zinc-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied to Clipboard' : 'Copy Message'}
            </button>
            <button
              onClick={handleOpenWhatsAppWeb}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-900/30"
            >
              <ExternalLink className="w-4 h-4" />
              Open in WhatsApp
            </button>
          </div>
          <p className="text-center text-[10px] text-zinc-500">
            Auto-dispatched via FIDGIT WhatsApp Cloud API with zero-config Sandbox fallback.
          </p>
        </div>
      </div>
    </div>
  );
};

