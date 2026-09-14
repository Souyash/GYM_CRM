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
import { MemberRosterView } from './views/MemberRosterView';
import { ZomatoLiveBanner } from './components/ZomatoLiveBanner';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import {
  Users,
  CreditCard,
  QrCode,
  Shield,
  Activity,
  Plus,
  MessageSquare,
  HeartPulse,
  Trash2,
  Download
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

  const handleExportMembersCsv = () => {
    if (!membersList || membersList.length === 0) {
      alert('No members found in this gym to export.');
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const gymName = user?.gym?.name || 'IronVault';
    const cleanGymName = gymName.replace(/[^a-zA-Z0-9_-]/g, '_');

    const headers = [
      'Membership ID',
      'Member Full Name',
      'Email Address',
      'Phone Number',
      'Membership Plan',
      'Access Status',
      'Pass Valid Until',
      'Fee Paid ($)',
      'Gym Business Name',
      'Gym 6-Digit Access Code'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = membersList.map((m) => [
      `IV-${m.id.substring(0, 8).toUpperCase()}`,
      m.fullName,
      m.email,
      m.phone || 'N/A',
      m.latestSubscription?.planName || 'No Active Pass',
      m.isAccessGranted ? 'ACTIVE' : 'EXPIRED',
      m.latestSubscription?.endDate ? new Date(m.latestSubscription.endDate).toLocaleDateString() : 'N/A',
      m.latestSubscription?.price || 0,
      m.gym?.name || user?.gym?.name || 'IronVault Gym',
      m.gym?.inviteCode || user?.gym?.inviteCode || 'N/A'
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(','))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${cleanGymName}_Members_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    <div className="min-h-screen bg-[#050507] text-white flex flex-col font-['Poppins',sans-serif] font-poppins selection:bg-[#ccff00] selection:text-black antialiased transition-colors duration-200">
      {/* Real-Time WebSocket Red Alert Drop-Down Banner */}
      <RedAlertBanner />

      {/* Zomato / Swiggy-Style Floating Dynamic Island Live Activity Banner */}
      <ZomatoLiveBanner
        onNavigateTab={(tab) => setCurrentTab(tab)}
        onOpenScanner={() => {
          setScannerInitialMode('ENTER');
          setIsScannerOpen(true);
        }}
      />

      {/* Main Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenScanner={() => setIsScannerOpen(true)}
        onViewPublicSite={() => setViewPublicSiteAsUser(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-6">
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
          <MemberRosterView
            membersList={membersList}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleExportMembersCsv={handleExportMembersCsv}
            handleDeleteMember={handleDeleteMember}
            onOpenAddMember={() => setIsAccountModalOpen(true)}
            onOpenRenewPass={() => {
              setBillingMode('BILL');
              setIsBillingModalOpen(true);
            }}
          />
        )}

        {/* Community Feed Tab for All Roles */}
        {currentTab === 'community_feed' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="p-6 rounded-3xl bg-[#0e1015] border border-white/10 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 text-xs font-black uppercase tracking-wider mb-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                    PROFITNESS Community &amp; Feed
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-['Syne',sans-serif] font-black text-white uppercase tracking-tight">
                    Official Announcements &amp; Member Buzz
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1">
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

      {/* Zomato-Style Notification Center Modal & Live Activity Drawer */}
      <NotificationCenterModal
        onNavigateTab={(tab) => setCurrentTab(tab)}
        onOpenScanner={() => {
          setScannerInitialMode('ENTER');
          setIsScannerOpen(true);
        }}
      />
    </div>
  );
};

