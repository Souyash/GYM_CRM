import React, { useState } from 'react';
import {
  Shield,
  Lock,
  HeartPulse,
  CreditCard,
  Eye,
  UserCheck,
  Mail,
  X,
  Printer,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<string>('overview');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(`privacy-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="bg-[#0e1015] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-[#121418]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ccff00]/15 border border-[#ccff00]/30 flex items-center justify-center text-[#ccff00]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Unbounded',sans-serif] font-black text-lg text-white uppercase tracking-tight">
                  FID<span className="text-[#ccff00]">GIT</span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#ccff00]/20 text-[#ccff00] border border-[#ccff00]/30">
                  Legal Compliance
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Privacy Policy &amp; Health Data Protection Standards • Last Updated: September 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
              title="Print or Save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Jump Ribbon */}
        <div className="px-6 py-2.5 bg-[#050507]/90 border-b border-white/5 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 mr-1">
            Sections:
          </span>
          {[
            { id: 'overview', label: '1. Overview' },
            { id: 'data-collected', label: '2. Data Collected' },
            { id: 'health-data', label: '3. Health & Biometrics' },
            { id: 'usage', label: '4. Usage & Automation' },
            { id: 'sharing', label: '5. Sharing & Processors' },
            { id: 'security', label: '6. Security & Storage' },
            { id: 'rights', label: '7. Your Rights' },
            { id: 'contact', label: '8. Contact' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition shrink-0 ${
                activeSection === item.id
                  ? 'bg-[#ccff00] text-black font-black'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Scrollable Document Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 text-zinc-300 text-sm leading-relaxed font-['Outfit',sans-serif]">
          {/* Section 1 */}
          <div id="privacy-overview" className="space-y-3 scroll-mt-28">
            <h2 className="text-xl font-['Unbounded',sans-serif] font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span className="text-[#ccff00]">01.</span> Overview &amp; Roles
            </h2>
            <p>
              Welcome to <strong className="text-white">FIDGIT</strong>. FIDGIT is a gym Customer Relationship Management (CRM), fitness management, and biometric tracking platform built for gym owners, personal trainers, and gym members.
            </p>
            <p>
              This Privacy Policy explains how <strong className="text-white">FIDGIT</strong> (our legal name) collects, uses, protects, and discloses personal information when you use our web platform, mobile applications, member portal, turnstile check-in kiosks, and automated notification services (including WhatsApp, SMS, and email).
            </p>
            <div className="p-4 rounded-2xl bg-[#121418] border border-white/5 space-y-2">
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider text-[#ccff00]">
                Controller vs. Processor Roles
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-zinc-300">
                <li>
                  <strong className="text-white">Gym Owners &amp; Facilities (Data Controllers):</strong> Your gym determines what member information is collected for enrollment, fitness programming, admission KYC, and facility floor rules.
                </li>
                <li>
                  <strong className="text-white">FIDGIT (Data Processor):</strong> FIDGIT processes gym member information on behalf of the gym under our SaaS service agreement. For direct account management, security logs, and platform operations, FIDGIT acts as a Controller.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2 */}
          <div id="privacy-data-collected" className="space-y-3 scroll-mt-28">
            <h2 className="text-xl font-['Unbounded',sans-serif] font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span className="text-[#ccff00]">02.</span> Information We Collect
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-[#121418] border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <UserCheck className="w-4 h-4 text-[#ccff00]" />
                  <span>Personal Identification</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Full legal names, email addresses, phone/WhatsApp numbers, residential addresses (street, locality, city, state, postal code), dates of birth, emergency contact names, and relationship details.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#121418] border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <CreditCard className="w-4 h-4 text-[#ccff00]" />
                  <span>Billing &amp; Financial</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Membership subscription tiers, transaction receipts, invoice numbers, digital bill PDFs, and payment timestamps. Full credit card numbers are handled directly by PCI-DSS compliant payment gateways (e.g., Stripe, PayPal, Razorpay) and are never stored on FIDGIT servers.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#121418] border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Lock className="w-4 h-4 text-[#ccff00]" />
                  <span>Turnstile &amp; Access Logs</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Dynamic QR scan events, entry and exit timestamps, gym facility check-ins, workout duration counters, and pass validation results.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#121418] border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Eye className="w-4 h-4 text-[#ccff00]" />
                  <span>Usage &amp; Technical Metadata</span>
                </div>
                <p className="text-xs text-zinc-400">
                  IP addresses, browser configurations, operating systems, session authentication tokens, crash diagnostics, and platform interaction logs.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div id="privacy-health-data" className="space-y-3 scroll-mt-28">
            <h2 className="text-xl font-['Unbounded',sans-serif] font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span className="text-[#ccff00]">03.</span> Health, Biometrics &amp; Fitness Data
            </h2>
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <HeartPulse className="w-5 h-5 shrink-0" />
                <span>Special Protections for Sensitive Wellness Data</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300">
                To enable customized workout plans, safety protocols, and health tracking, members may optionally provide, or gym trainers may record, the following health metrics:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-zinc-300">
                <li><strong className="text-white">Physical Measurements:</strong> Height, body weight, Body Mass Index (BMI), body fat percentage, muscle mass, chest, waist, and hip circumferences.</li>
                <li><strong className="text-white">Fitness Goals:</strong> Primary athletic targets (fat loss, strength, recomposition), target weight, and target timeline.</li>
                <li><strong className="text-white">Medical &amp; Physical Disclosures:</strong> Health advisories, prior gym injuries, major surgeries, cardiovascular advisories, or medications disclosed for gym floor safety.</li>
              </ul>
              <p className="text-xs text-zinc-400">
                FIDGIT processes this health information strictly with your explicit consent or as requested by your gym for personalized training and liability waiver documentation. You may revoke consent or request deletion of this data at any time.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div id="privacy-usage" className="space-y-3 scroll-mt-28">
            <h2 className="text-xl font-['Unbounded',sans-serif] font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span className="text-[#ccff00]">04.</span> How We Use Your Data
            </h2>
            <ul className="space-y-2 text-zinc-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#ccff00] shrink-0 mt-1" />
                <span><strong>Platform Operations:</strong> Facilitating member account logins, gym turnstile QR verification, class scheduling, and member roster management.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#ccff00] shrink-0 mt-1" />
                <span><strong>Automated Invoices &amp; PDF Bills:</strong> Generating official, stamped membership invoices and dispatching PDF bills directly to members via WhatsApp or email upon joining or pass renewal.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#ccff00] shrink-0 mt-1" />
                <span><strong>Renewal &amp; Expiry Alerts:</strong> Sending automated renewal reminders <strong>5 days prior to membership expiration</strong> so members avoid sudden turnstile access lockouts.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#ccff00] shrink-0 mt-1" />
                <span><strong>1-Click Health &amp; KYC Sharing:</strong> Enabling gym managers to compile and deliver member health profiles and official admission KYC PDFs directly to the member upon request.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#ccff00] shrink-0 mt-1" />
                <span><strong>System Security &amp; Fraud Prevention:</strong> Protecting member accounts with OTP verification, detecting suspicious access, and ensuring network integrity.</span>
              </li>
            </ul>
          </div>

          {/* Section 5 */}
          <div id="privacy-sharing" className="space-y-3 scroll-mt-28">
            <h2 className="text-xl font-['Unbounded',sans-serif] font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span className="text-[#ccff00]">05.</span> Data Sharing &amp; Third Parties
            </h2>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-semibold">
              🔒 We DO NOT sell, rent, or trade your personal or health data to advertisers or third-party data brokers.
            </div>
            <p>We share information solely with essential service providers necessary to provide FIDGIT services:</p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-zinc-300">
              <li><strong>Your Gym Facility:</strong> Owners, authorized managers, and assigned personal trainers have access to member profiles, billing records, and check-in logs.</li>
              <li><strong>Payment Processors:</strong> Payment gateways (e.g., Stripe, PayPal, Razorpay) for secure payment transactions under PCI-DSS compliance.</li>
              <li><strong>Messaging Providers:</strong> Official notification infrastructure (e.g., WhatsApp Business API, Twilio, Brevo, Resend) for delivering OTPs, bills, and alerts.</li>
              <li><strong>Cloud Hosting &amp; Databases:</strong> Cloud infrastructure (e.g., AWS, Render, Vercel, SQLite storage) under strict data protection agreements.</li>
              <li><strong>Legal Authorities:</strong> When strictly required by applicable law, court order, or governmental regulation.</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div id="privacy-security" className="space-y-3 scroll-mt-28">
            <h2 className="text-xl font-['Unbounded',sans-serif] font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span className="text-[#ccff00]">06.</span> Data Security &amp; Storage
            </h2>
            <p>
              We implement industry-grade technical and organizational safeguards to protect your personal information:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="p-3.5 rounded-xl bg-[#121418] border border-white/5">
                <span className="text-[#ccff00] font-bold block mb-1">TLS 1.3 Encryption</span>
                All communication between your device and FIDGIT servers is encrypted in transit using modern SSL/TLS.
              </div>
              <div className="p-3.5 rounded-xl bg-[#121418] border border-white/5">
                <span className="text-[#ccff00] font-bold block mb-1">Encrypted Backups</span>
                Databases and snapshot archives are secured with AES-256 encryption at rest with automated recovery.
              </div>
              <div className="p-3.5 rounded-xl bg-[#121418] border border-white/5">
                <span className="text-[#ccff00] font-bold block mb-1">Role-Based Access</span>
                Strict RBAC isolation ensures staff only see information necessary for their specific role.
              </div>
            </div>
          </div>

          {/* Section 7 */}
          <div id="privacy-rights" className="space-y-3 scroll-mt-28">
            <h2 className="text-xl font-['Unbounded',sans-serif] font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span className="text-[#ccff00]">07.</span> Your Legal Privacy Rights
            </h2>
            <p>
              Under applicable privacy laws (including GDPR and CCPA/CPRA), you have the right to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-zinc-300">
              <li><strong>Access:</strong> Request a complete copy of the personal and health data FIDGIT holds about you.</li>
              <li><strong>Correction:</strong> Update or rectify incomplete or inaccurate personal or biometric information.</li>
              <li><strong>Deletion (“Right to Be Forgotten”):</strong> Request erasure of your personal data when no longer needed for legal or contractual purposes.</li>
              <li><strong>Data Portability:</strong> Export your profile, workout logs, and attendance records in a structured, machine-readable format.</li>
              <li><strong>Withdraw Consent:</strong> Revoke consent for processing voluntary health and biometric questionnaires at any time.</li>
            </ul>
            <p className="text-xs text-zinc-400">
              To exercise any of these rights, contact your gym administrator or email our privacy team directly at <span className="text-[#ccff00] font-mono">privacy@fidgit.com</span>.
            </p>
          </div>

          {/* Section 8 */}
          <div id="privacy-contact" className="space-y-3 scroll-mt-28">
            <h2 className="text-xl font-['Unbounded',sans-serif] font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span className="text-[#ccff00]">08.</span> Contact &amp; Legal Entity
            </h2>
            <div className="p-5 rounded-2xl bg-[#121418] border border-white/5 space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Legal Entity Name</p>
                <p className="text-base font-['Unbounded',sans-serif] font-black text-white">FIDGIT</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5 text-xs">
                <div>
                  <span className="text-zinc-500 font-bold block mb-0.5">Privacy Inquiries</span>
                  <a href="mailto:privacy@fidgit.com" className="text-[#ccff00] hover:underline font-mono">
                    privacy@fidgit.com
                  </a>
                </div>
                <div>
                  <span className="text-zinc-500 font-bold block mb-0.5">Data Protection Officer</span>
                  <a href="mailto:dpo@fidgit.com" className="text-[#ccff00] hover:underline font-mono">
                    dpo@fidgit.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#121418]/80 backdrop-blur-md flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            By using FIDGIT, you acknowledge and agree to this Privacy Policy.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#ccff00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider transition active:scale-95 shadow-[0_0_15px_rgba(204,255,0,0.25)]"
          >
            I Understand &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};

