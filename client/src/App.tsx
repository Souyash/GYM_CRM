import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { RedAlertBanner } from './components/RedAlertBanner';
import { ScannerModal } from './components/ScannerModal';
import { PrintableFacilityQR } from './components/PrintableFacilityQR';
import { SuperAdminDashboard } from './views/SuperAdminDashboard';
import { DeviceApprovalsView } from './views/DeviceApprovalsView';
import { ManagerDashboard } from './views/ManagerDashboard';
import { DeskBillingModal } from './views/DeskBillingModal';
import { MemberProfile } from './views/MemberProfile';
import { LoginView } from './views/LoginView';
import { AccountCreationModal } from './components/AccountCreationModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { CommunityFeed } from './components/CommunityFeed';
import { LandingPageView } from './views/LandingPageView';
import { HealthIntelligenceView } from './views/HealthIntelligenceView';
import { PreloaderScreen } from './components/PreloaderScreen';
import {
  Users,
  CreditCard,
  QrCode,
  Shield,
  Activity,
  Plus,
  MessageSquare,
  HeartPulse,
  Trash2
} from 'lucide-react';
import { api } from './services/api';

export const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('member_profile');
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [scannerInitialMode, setScannerInitialMode] = useState<'ENTER' | 'EXIT'>('ENTER');
  const [isBillingModalOpen, setIsBillingModalOpen] = useState<boolean>(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [billingMode, setBillingMode] = useState<'ONBOARD' | 'BILL'>('ONBOARD');

  // Public Landing Page & Auth Modal Navigation
  const [showAuthScreen, setShowAuthScreen] = useState<boolean>(false);
  const [authInitialTab, setAuthInitialTab] = useState<'MEMBER_LOGIN' | 'STAFF_LOGIN' | 'SIGNUP' | 'REGISTER_BUSINESS'>('MEMBER_LOGIN');
  const [authSelectedPlan, setAuthSelectedPlan] = useState<string | undefined>(undefined);
  const [viewPublicSiteAsUser, setViewPublicSiteAsUser] = useState<boolean>(false);

  // Member table state for Desk Billing tab
  const [membersList, setMembersList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadMembers = async () => {
    try {
      const data = await api.getMembers(searchQuery);
      setMembersList(data.members || []);
    } catch (e) {
      console.error('Failed to load members:', e);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from this gym's database?\n\nTheir app access will be immediately terminated and all active sessions revoked.`)) {
      return;
    }
    try {
      await api.deleteMember(id);
      await loadMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  useEffect(() => {
    if (user) {
      if (user.role === 'SUPER_ADMIN') {
        setCurrentTab('admin_dashboard');
      } else if (user.role === 'MANAGER' || user.role === 'GYM_OWNER') {
        setCurrentTab('manager_dashboard');
      } else {
        setCurrentTab('member_profile');
      }
    }
  }, [user?.role]);

  useEffect(() => {
    if (currentTab === 'desk_billing') {
      loadMembers();
    }
  }, [currentTab, searchQuery]);

  if (isLoading) {
    return <PreloaderScreen minDurationMs={800} />;
  }

  // 1. Unauthenticated Visitors: Public Landing Page or Sign-In Screen
  if (!user) {
    if (showAuthScreen) {
      return (
        <LoginView
          initialTab={authInitialTab}
          preselectedPlan={authSelectedPlan}
          onBackToWebsite={() => {
            setShowAuthScreen(false);
            setAuthSelectedPlan(undefined);
          }}
        />
      );
    }

    return (
      <LandingPageView
        onOpenAuth={(tab, planName) => {
          setAuthInitialTab(tab || 'MEMBER_LOGIN');
          setAuthSelectedPlan(planName);
          setShowAuthScreen(true);
        }}
      />
    );
  }

  // 2. Authenticated User voluntarily previewing the Public Landing Page
  if (viewPublicSiteAsUser) {
    return (
      <LandingPageView
        isLoggedIn={true}
        onGoToDashboard={() => setViewPublicSiteAsUser(false)}
        onOpenAuth={() => setViewPublicSiteAsUser(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col font-poppins transition-colors duration-200">
      {/* Real-Time WebSocket Red Alert Drop-Down Banner */}
      <RedAlertBanner />

      {/* Main Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenScanner={() => setIsScannerOpen(true)}
        onViewPublicSite={() => setViewPublicSiteAsUser(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Super Admin Tabs */}
        {currentTab === 'admin_dashboard' && <SuperAdminDashboard />}
        {currentTab === 'device_approvals' && <DeviceApprovalsView />}
        {currentTab === 'facility_qr' && <PrintableFacilityQR />}

        {/* Manager Tabs */}
        {currentTab === 'manager_dashboard' && (
          <ManagerDashboard
            onOpenOnboarding={() => {
              setIsAccountModalOpen(true);
            }}
            onOpenBilling={() => {
              setBillingMode('BILL');
              setIsBillingModalOpen(true);
            }}
          />
        )}

        {/* Desk Billing & Member Management Directory */}
        {currentTab === 'desk_billing' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl app-card">
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white">Desk Billing & Member Roster</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage memberships, issue monthly passes, and register new members
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsAccountModalOpen(true);
                  }}
                  className="btn-primary-green flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  New Member Sign-Up
                </button>
                <button
                  onClick={() => {
                    setBillingMode('BILL');
                    setIsBillingModalOpen(true);
                  }}
                  className="btn-secondary-gym flex items-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4" />
                  Renew Pass
                </button>
              </div>
            </div>

            {/* Member Directory Table */}
            <div className="app-card rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 dark:border-dark-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-dark-900/50">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Members ({membersList.length})</h3>
                <input
                  type="text"
                  placeholder="Search members by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 w-full sm:w-72 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-dark-850 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-dark-800">
                    <tr>
                      <th className="py-3 px-4 font-bold">Member</th>
                      <th className="py-3 px-4 font-bold">Contact</th>
                      <th className="py-3 px-4 font-bold">Current Subscription</th>
                      <th className="py-3 px-4 font-bold">Membership ID</th>
                      <th className="py-3 px-4 font-bold">Access Status</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                    {membersList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No members found. Use "New Member Sign-Up" above to register athletes.
                        </td>
                      </tr>
                    ) : (
                      membersList.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-dark-850/50 transition">
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            {m.fullName}
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                            {m.email}
                            {m.phone && <span className="block text-[10px] text-slate-400 dark:text-slate-500">{m.phone}</span>}
                          </td>
                          <td className="py-3 px-4 text-xs whitespace-nowrap">
                            {m.latestSubscription ? (
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white">{m.latestSubscription.planName}</span>
                                <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                                  Valid until: {new Date(m.latestSubscription.endDate).toLocaleDateString()}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">No active pass</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            IV-{m.id.substring(0, 8).toUpperCase()}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                m.isAccessGranted
                                  ? 'badge-active-green'
                                  : 'badge-alert-coral'
                              }`}
                            >
                              {m.isAccessGranted ? 'Active / Granted' : 'Expired / On Hold'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(m.id, m.fullName)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition inline-flex items-center gap-1.5 ml-auto"
                              title="Remove member from gym database"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Community Feed Tab for All Roles */}
        {currentTab === 'community_feed' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="p-6 rounded-3xl app-card border border-slate-200/80 dark:border-zinc-800 bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-500/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                    IronVault Community & Feed
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Official Announcements & Member Buzz
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
                    {user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER'
                      ? 'Publish official gym updates, pin announcements to top, celebrate member PRs, and moderate posts.'
                      : 'Share your PR milestones, ask questions, join fitness challenges, and high-five your gym family.'}
                  </p>
                </div>
              </div>
            </div>

            <CommunityFeed defaultTab="feed" />
          </div>
        )}

        {/* Health Intelligence & Leads Marketing Hub */}
        {currentTab === 'health_intelligence' && (
          <div className="max-w-6xl mx-auto">
            <HealthIntelligenceView />
          </div>
        )}

        {/* Member Profile */}
        {currentTab === 'member_profile' && (
          <MemberProfile
            onOpenScanner={(mode) => {
              setScannerInitialMode(mode || 'ENTER');
              setIsScannerOpen(true);
            }}
          />
        )}
      </main>

      {/* Mobile Sticky Bottom Thumb Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenScanner={() => {
          setScannerInitialMode('ENTER');
          setIsScannerOpen(true);
        }}
      />

      {/* Modals */}
      <ScannerModal
        isOpen={isScannerOpen}
        initialMode={scannerInitialMode}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={() => {
          // Handled in modal
        }}
      />

      <AccountCreationModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSuccess={() => {
          loadMembers();
        }}
      />


      <DeskBillingModal
        isOpen={isBillingModalOpen}
        mode={billingMode}
        onClose={() => setIsBillingModalOpen(false)}
        onSuccess={() => {
          loadMembers();
        }}
      />
    </div>
  );
};

