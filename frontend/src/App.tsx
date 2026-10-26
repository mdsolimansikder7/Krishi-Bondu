import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from './lib/api';
import {
  BANGLADESH_DISTRICTS,
  INITIAL_MARKET_PRICES,
  CROP_GUIDES,
  CROP_DISEASES,
  BANGLA_CALENDAR_MONTHS,
  INITIAL_MARKETPLACE_LISTINGS,
  INITIAL_QUESTIONS,
  INITIAL_FARMER_FIELDS,
  INITIAL_FARMER_EXPENSES,
  INITIAL_FARMING_TASKS,
  INITIAL_NOTIFICATIONS,
} from '@shared/data/bangladeshData';
import {
  INITIAL_DIVISIONS,
  INITIAL_DISTRICTS,
  INITIAL_UPAZILAS,
  INITIAL_PLATFORM_USERS,
  INITIAL_AGRI_ARTICLES,
  INITIAL_REPORTS,
  INITIAL_AUDIT_LOGS,
} from '@shared/data/locationAndAdminData';
import {
  NavTab,
  DistrictLocation,
  DivisionEntity,
  DistrictEntity,
  UpazilaEntity,
  AdminRoleType,
  PlatformUser,
  MarketPriceItem,
  MarketPriceWorkflowStatus,
  CropGuideItem,
  CropDiseaseItem,
  MarketplaceListing,
  MarketplaceModerationStatus,
  QuestionAnswerItem,
  AgriArticleItem,
  ReportComplaintItem,
  AuditLogEntry,
  FarmerFieldRecord,
  FarmerExpenseRecord,
  FarmingTaskItem,
  AppNotification,
} from '@shared/types';
import {
  reconcileCascadingLocation,
  getUpazilasByDistrict,
  AuthAccount,
  canAccessAdminPanel,
} from '@shared/utils/locationAndAdminRules';
import {
  Navigation,
  DESKTOP_MENU_ITEMS,
  MobileBottomNav,
} from './components/Navigation';
import { AuthModal } from './components/AuthModal';
import { HomeView } from './components/HomeView';
import { WeatherView } from './components/WeatherView';
import { MarketView } from './components/MarketView';
import { CropsView, DiseasesView } from './components/CropsAndDiseasesView';
import { CalendarView, CalculatorView } from './components/CalendarAndCalculatorView';
import { MarketplaceView, QAView } from './components/MarketplaceAndQAView';
import { MyFarmView } from './components/MyFarmAndAdminView';
import { AdminPanelSuite } from './components/AdminPanelSuite';
import { authClient } from './lib/auth-client';
import { Sprout, PhoneCall } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // 3-Tier Location Hierarchy State (Division -> District -> Upazila)
  const [divisions, setDivisions] = useState<DivisionEntity[]>(INITIAL_DIVISIONS);
  const [districtEntities, setDistrictEntities] = useState<DistrictEntity[]>(INITIAL_DISTRICTS);
  const [upazilaEntities, setUpazilaEntities] = useState<UpazilaEntity[]>(INITIAL_UPAZILAS);

  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('div-rajshahi');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('dist-bogura');
  const [selectedUpazilaId, setSelectedUpazilaId] = useState<string>(
    () =>
      INITIAL_UPAZILAS.find((u) => u.districtId === 'dist-bogura' && u.nameBn === 'শিবগঞ্জ')?.id ||
      INITIAL_UPAZILAS.find((u) => u.districtId === 'dist-bogura')?.id ||
      'upz-bogura-1'
  );

  const [selectedDistrict, setSelectedDistrict] = useState<DistrictLocation>(() => ({
    ...BANGLADESH_DISTRICTS[1],
    divisionBn: 'রাজশাহী',
  })); // Bogura default
  const [selectedUpazila, setSelectedUpazila] = useState<string>(
    BANGLADESH_DISTRICTS[1].upazilasBn[1]
  ); // Shibganj

  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<AuthAccount | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [currentAdminRole, setCurrentAdminRole] = useState<AdminRoleType>('Super Admin');

  // Weather State
  const [weatherData, setWeatherData] = useState<any | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Domain Data States
  const [marketPrices, setMarketPrices] = useState<MarketPriceItem[]>(INITIAL_MARKET_PRICES);
  const [crops, setCrops] = useState<CropGuideItem[]>(CROP_GUIDES);
  const [selectedCrop, setSelectedCrop] = useState<CropGuideItem>(CROP_GUIDES[0]);
  const [diseases, setDiseases] = useState<CropDiseaseItem[]>(CROP_DISEASES);
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>(
    INITIAL_MARKETPLACE_LISTINGS
  );
  const [questions, setQuestions] = useState<QuestionAnswerItem[]>(INITIAL_QUESTIONS);

  // Admin & Platform States
  const [users, setUsers] = useState<PlatformUser[]>(INITIAL_PLATFORM_USERS);
  const [articles, setArticles] = useState<AgriArticleItem[]>(INITIAL_AGRI_ARTICLES);
  const [reports, setReports] = useState<ReportComplaintItem[]>(INITIAL_REPORTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  // Farmer Personal States
  const [farmerFields, setFarmerFields] = useState<FarmerFieldRecord[]>(INITIAL_FARMER_FIELDS);
  const [farmerExpenses, setFarmerExpenses] = useState<FarmerExpenseRecord[]>(
    INITIAL_FARMER_EXPENSES
  );
  const [farmingTasks, setFarmingTasks] = useState<FarmingTaskItem[]>(INITIAL_FARMING_TASKS);
  const [savedPriceIds, setSavedPriceIds] = useState<string[]>(['mp-1', 'mp-4']);
  const [savedCropIds, setSavedCropIds] = useState<string[]>(['crop-1', 'crop-2']);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  // Fetch Weather from Backend Proxy using Upazila Lat/Lon (Section 6)
  const fetchWeather = useCallback(
    async (customCoords?: { lat: number; lon: number }) => {
      const currentUpz = upazilaEntities.find((u) => u.id === selectedUpazilaId);
      const lat = customCoords?.lat ?? currentUpz?.latitude ?? selectedDistrict.lat;
      const lon = customCoords?.lon ?? currentUpz?.longitude ?? selectedDistrict.lon;
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        const res = await apiFetch(
          `/api/weather?lat=${lat}&lon=${lon}&upazilaId=${selectedUpazilaId}`
        );
        if (!res.ok) throw new Error('আবহাওয়া সার্ভার থেকে তথ্য পাওয়া যায়নি');
        const data = await res.json();
        setWeatherData(data);
      } catch (err: any) {
        setWeatherError(err.message || 'আবহাওয়া তথ্য লোড করতে সমস্যা হয়েছে');
      } finally {
        setWeatherLoading(false);
      }
    },
    [selectedDistrict.lat, selectedDistrict.lon, selectedUpazilaId, upazilaEntities]
  );

  // Refresh locations from backend
  const fetchLocationsData = useCallback(async () => {
    try {
      const res = await apiFetch('/api/locations/all');
      if (res.ok) {
        const data = await res.json();
        if (data.divisions) setDivisions(data.divisions);
        if (data.districts) setDistrictEntities(data.districts);
        if (data.upazilas) setUpazilaEntities(data.upazilas);
      }
    } catch (_e) {
      // Keep local seed data
    }
  }, []);

  // Sync initial data from backend endpoints
  const fetchBackendData = useCallback(async () => {
    try {
      const [mpRes, mktRes, qaRes, admRes] = await Promise.all([
        apiFetch('/api/market-prices?includeAll=true'),
        apiFetch('/api/marketplace/listings?includeAll=true'),
        apiFetch('/api/questions'),
        apiFetch('/api/admin/overview'),
      ]);
      if (mpRes.ok) {
        const mpJson = await mpRes.json();
        if (mpJson.items) setMarketPrices(mpJson.items);
      }
      if (mktRes.ok) {
        const mktJson = await mktRes.json();
        if (mktJson.items) setMarketplaceListings(mktJson.items);
      }
      if (qaRes.ok) {
        const qaJson = await qaRes.json();
        if (qaJson.items) setQuestions(qaJson.items);
      }
      if (admRes.ok) {
        const admJson = await admRes.json();
        if (admJson.users) setUsers(admJson.users);
        if (admJson.articles) setArticles(admJson.articles);
        if (admJson.reports) setReports(admJson.reports);
        if (admJson.auditLogs) setAuditLogs(admJson.auditLogs);
      }
    } catch (_e) {
      // Keep deterministic initial data if offline
    }
  }, []);

  useEffect(() => {
    fetchLocationsData();
    fetchBackendData();
  }, [fetchLocationsData, fetchBackendData]);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/auth/session')
      .then(async (response) => {
        if (response.status === 401) return null;
        if (!response.ok) throw new Error('সেশন যাচাই করা যায়নি।');
        return response.json();
      })
      .then((data) => {
        if (!cancelled && data?.account) {
          setCurrentUser(data.account);
          if (canAccessAdminPanel(data.account) && data.account.adminRole) {
            setCurrentAdminRole(data.account.adminRole);
            setActiveTab('admin');
          }
        }
      })
      .catch((error) => {
        console.error('Unable to restore authentication session:', error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    fetchWeather();
    const timer = setInterval(() => {
      fetchWeather();
    }, 60000); // প্রতি ১ মিনিটে নির্বাচিত অবস্থানের আবহাওয়া হালনাগাদ
    return () => clearInterval(timer);
  }, [fetchWeather]);

  // Reconcile 3-tier cascading location selection (Division -> District -> Upazila)
  const handleSelectHierarchyLocation = (sel: {
    divisionId: string;
    districtId: string;
    upazilaId: string;
  }) => {
    const reconciled = reconcileCascadingLocation(
      divisions,
      districtEntities,
      upazilaEntities,
      sel.divisionId,
      sel.districtId,
      sel.upazilaId
    );
    setSelectedDivisionId(reconciled.divisionId);
    setSelectedDistrictId(reconciled.districtId);
    setSelectedUpazilaId(reconciled.upazilaId);

    const divObj = divisions.find((d) => d.id === reconciled.divisionId);
    const distObj = districtEntities.find((d) => d.id === reconciled.districtId);
    const upzList = getUpazilasByDistrict(upazilaEntities, reconciled.districtId, false);
    const upzObj = reconciled.upazila || upzList[0];

    if (distObj) {
      setSelectedDistrict({
        id: distObj.id,
        divisionId: distObj.divisionId,
        nameBn: distObj.nameBn,
        divisionBn: divObj?.nameBn || 'রাজশাহী',
        upazilasBn: upzList.map((u) => u.nameBn),
        lat: upzObj?.latitude ?? 24.8481,
        lon: upzObj?.longitude ?? 89.373,
      });
    }
    if (upzObj) {
      setSelectedUpazila(upzObj.nameBn);
    }
  };

  const handleSelectDistrict = (district: DistrictLocation, upazila?: string) => {
    setSelectedDistrict(district);
    setSelectedUpazila(upazila || district.upazilasBn[0]);
  };

  const handleRecordAuditLog = (
    entry: Omit<AuditLogEntry, 'id' | 'requestId' | 'timestampBn'>
  ) => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `aud-${Date.now()}`,
      requestId: `req-${Date.now()}`,
      timestampBn: 'এইমাত্র',
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = globalSearch.trim();
    if (!q) return;

    if (q.includes('রোগ') || q.includes('পোকা') || q.includes('ব্লাস্ট') || q.includes('মড়ক')) {
      setActiveTab('diseases');
    } else if (q.includes('দাম') || q.includes('বাজার') || q.includes('হাট')) {
      setActiveTab('market');
    } else if (q.includes('আবহাওয়া') || q.includes('বৃষ্টি')) {
      setActiveTab('weather');
    } else if (q.includes('বিঘা') || q.includes('শতক') || q.includes('হিসাব')) {
      setActiveTab('calculator');
    } else {
      const matchedCrop = crops.find((c) => c.nameBn.includes(q));
      if (matchedCrop) {
        setSelectedCrop(matchedCrop);
        setActiveTab('crops');
      } else {
        setActiveTab('market');
      }
    }
  };

  const handleSpeakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'bn-BD';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAddMarketplaceListing = async (
    newListingData: Omit<
      MarketplaceListing,
      'id' | 'status' | 'createdAtBn' | 'verifiedSeller' | 'sellerRoleBn'
    >
  ) => {
    try {
      const res = await apiFetch('/api/marketplace/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newListingData),
      });
      if (res.ok) {
        const created = await res.json();
        setMarketplaceListings((prev) => [created, ...prev]);
        return;
      }
    } catch (_e) {
      // Fallback local update
    }
    const fallbackItem: MarketplaceListing = {
      ...newListingData,
      id: `mkt-${Date.now()}`,
      sellerRoleBn: 'যাচাইকৃত কৃষক',
      verifiedSeller: true,
      status: 'approved',
      moderationStatus: 'Published',
      createdAtBn: 'এইমাত্র',
    };
    setMarketplaceListings((prev) => [fallbackItem, ...prev]);
  };

  const handleAdminAddMarketPrice = async (entry: any) => {
    try {
      const res = await apiFetch('/api/admin/market-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
      if (res.ok) {
        const created = await res.json();
        setMarketPrices((prev) => [created, ...prev]);
        await fetchBackendData();
        return;
      }
    } catch (_e) {
      // Fallback local state update
    }
    const fallbackPrice: MarketPriceItem = {
      id: `mp-${Date.now()}`,
      cropNameBn: entry.cropNameBn,
      categoryBn: entry.categoryBn,
      marketNameBn: entry.marketNameBn,
      divisionId: entry.divisionId,
      districtId: entry.districtId,
      upazilaId: entry.upazilaId,
      divisionBn: entry.divisionBn,
      districtBn: entry.districtBn,
      upazilaBn: entry.upazilaBn,
      wholesalePrice: Number(entry.wholesalePrice),
      retailPrice: Number(entry.retailPrice),
      yesterdayWholesale: Number(entry.wholesalePrice),
      sevenDayHistory: Array(7).fill(Number(entry.wholesalePrice)),
      unitBn: entry.unitBn,
      updatedAtBn: 'এইমাত্র হালনাগাদকৃত',
      sourceBn: entry.sourceBn,
      verified: entry.workflowStatus === 'Published' || entry.workflowStatus === 'Approved',
      workflowStatus: entry.workflowStatus || 'Published',
      visualType: 'paddy',
    };
    setMarketPrices((prev) => [fallbackPrice, ...prev]);
  };

  const handleUpdateMarketPriceWorkflow = async (
    id: string,
    workflowStatus: MarketPriceWorkflowStatus,
    reasonBn: string
  ) => {
    try {
      const res = await apiFetch(`/api/admin/market-prices/${id}/workflow`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflowStatus, reasonBn }),
      });
      if (res.ok) {
        await fetchBackendData();
        return;
      }
    } catch (_e) {
      // Fallback
    }
    setMarketPrices((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              workflowStatus,
              verified: workflowStatus === 'Published' || workflowStatus === 'Approved',
            }
          : m
      )
    );
  };

  const handleModerateListing = async (
    id: string,
    moderationStatus: MarketplaceModerationStatus,
    reasonBn: string
  ) => {
    try {
      const res = await apiFetch(`/api/admin/marketplace/${id}/moderate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ moderationStatus, reasonBn }),
      });
      if (res.ok) {
        await fetchBackendData();
        return;
      }
    } catch (_e) {
      // Fallback
    }
    setMarketplaceListings((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              moderationStatus,
              status:
                moderationStatus === 'Published' || moderationStatus === 'Approved'
                  ? 'approved'
                  : moderationStatus === 'Rejected' || moderationStatus === 'Suspended'
                  ? 'reported'
                  : 'pending',
            }
          : l
      )
    );
  };

  const handleAnswerQuestion = async (
    questionId: string,
    answerTextBn: string,
    expertNameBn: string
  ) => {
    try {
      const res = await apiFetch(`/api/admin/questions/${questionId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answerTextBn, expertNameBn }),
      });
      if (res.ok) {
        await fetchBackendData();
        return;
      }
    } catch (_e) {
      // Fallback
    }
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: [
                ...q.answers,
                {
                  id: `ans-${Date.now()}`,
                  expertNameBn,
                  expertTitleBn: 'কৃষি বিশেষজ্ঞ (DAE)',
                  verifiedExpert: true,
                  answerTextBn,
                  answeredAtBn: 'এইমাত্র',
                },
              ],
            }
          : q
      )
    );
  };

  const handleUpdateUser = async (
    id: string,
    patch: Partial<PlatformUser>,
    reasonBn: string
  ) => {
    try {
      const res = await apiFetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...patch, reasonBn }),
      });
      if (res.ok) {
        await fetchBackendData();
        return;
      }
    } catch (_e) {
      // Fallback
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  };

  const handleAddArticle = async (article: Omit<AgriArticleItem, 'id' | 'publishedAtBn'>) => {
    try {
      const res = await apiFetch('/api/admin/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(article),
      });
      if (res.ok) {
        await fetchBackendData();
        return;
      }
    } catch (_e) {
      // Fallback
    }
    setArticles((prev) => [
      { ...article, id: `art-${Date.now()}`, publishedAtBn: 'এইমাত্র' },
      ...prev,
    ]);
  };

  const handleResolveReport = async (
    id: string,
    status: ReportComplaintItem['status'],
    resolutionNoteBn: string
  ) => {
    try {
      const res = await apiFetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, resolutionNoteBn }),
      });
      if (res.ok) {
        await fetchBackendData();
        return;
      }
    } catch (_e) {
      // Fallback
    }
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, resolutionNoteBn } : r))
    );
  };

  const savedPricesList = marketPrices.filter((m) => savedPriceIds.includes(m.id));
  const savedCropsList = crops.filter((c) => savedCropIds.includes(c.id));

  const handleLoginSuccess = (account: AuthAccount) => {
    setCurrentUser(account);
    if (canAccessAdminPanel(account) && account.adminRole) {
      setCurrentAdminRole(account.adminRole);
      setActiveTab('admin');
    } else if (activeTab === 'admin') {
      setActiveTab('home');
    }
    fetchBackendData();
  };

  const handleLogout = async () => {
    const { error } = await authClient.signOut();
    if (error) {
      console.error('Unable to sign out:', error);
      return;
    }
    setCurrentUser(null);
    if (activeTab === 'admin') {
      setActiveTab('home');
    }
  };

  const hasAdminAccess = canAccessAdminPanel(currentUser);
  const visibleDesktopMenuItems = hasAdminAccess
    ? DESKTOP_MENU_ITEMS
    : DESKTOP_MENU_ITEMS.filter((item) => item.id !== 'admin');

  // Dedicated Full-Page Admin Panel Suite ONLY when activeTab === 'admin' AND logged in as an authorized admin role
  if (activeTab === 'admin' && hasAdminAccess) {
    return (
      <AdminPanelSuite
        divisions={divisions}
        districts={districtEntities}
        upazilas={upazilaEntities}
        selectedDivisionId={selectedDivisionId}
        selectedDistrictId={selectedDistrictId}
        selectedUpazilaId={selectedUpazilaId}
        onSelectLocation={handleSelectHierarchyLocation}
        onRefreshLocations={async () => {
          await fetchLocationsData();
          await fetchBackendData();
        }}
        users={users}
        onUpdateUser={handleUpdateUser}
        marketPrices={marketPrices}
        onAddMarketPrice={handleAdminAddMarketPrice}
        onUpdateMarketPriceWorkflow={handleUpdateMarketPriceWorkflow}
        crops={crops}
        onAddCrop={(c) => setCrops((prev) => [c, ...prev])}
        diseases={diseases}
        onAddDisease={(d) => setDiseases((prev) => [d, ...prev])}
        calendarMonths={BANGLA_CALENDAR_MONTHS}
        weatherData={weatherData}
        onRefreshWeather={fetchWeather}
        listings={marketplaceListings}
        onModerateListing={handleModerateListing}
        questions={questions}
        onAnswerQuestion={handleAnswerQuestion}
        articles={articles}
        onAddArticle={handleAddArticle}
        reports={reports}
        onResolveReport={handleResolveReport}
        notifications={notifications}
        onSendNotification={(notif) => {
          setNotifications((prev) => [
            {
              ...notif,
              id: `notif-${Date.now()}`,
              timeBn: 'এইমাত্র',
              read: false,
            },
            ...prev,
          ]);
          handleRecordAuditLog({
            adminId: currentUser?.id || 'usr-admin-1',
            adminNameBn: currentUser?.nameBn || 'ড. মাহবুবুর রহমান',
            adminRole: currentAdminRole,
            actionBn: 'নতুন কৃষি নোটিফিকেশন প্রেরণ',
            resourceTypeBn: 'সেটিংস ও অনুমতি',
            resourceId: `notif-${Date.now()}`,
            previousValueBn: '—',
            newValueBn: notif.titleBn,
            reasonBn: 'কৃষকদের জরুরি বার্তা অবহিতকরণ',
          });
        }}
        auditLogs={auditLogs}
        onRecordAuditLog={handleRecordAuditLog}
        currentAdminRole={currentAdminRole}
        onChangeAdminRole={setCurrentAdminRole}
        currentUser={currentUser}
        onLogout={handleLogout}
        onExitAdmin={() => {
          setActiveTab('home');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen w-full min-w-0 flex flex-col bg-[#F5F8F1] text-[#173B2A]">
      {/* Top Header */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'admin' && !hasAdminAccess) {
            setAuthModalMode('signin');
            setAuthModalOpen(true);
            return;
          }
          setActiveTab(tab);
        }}
        districts={BANGLADESH_DISTRICTS}
        selectedDistrict={selectedDistrict}
        selectedUpazila={selectedUpazila}
        onSelectDistrict={handleSelectDistrict}
        divisions={divisions}
        districtEntities={districtEntities}
        upazilaEntities={upazilaEntities}
        selectedDivisionId={selectedDivisionId}
        selectedDistrictId={selectedDistrictId}
        selectedUpazilaId={selectedUpazilaId}
        onSelectHierarchyLocation={handleSelectHierarchyLocation}
        weatherData={weatherData}
        weatherLoading={weatherLoading}
        globalSearch={globalSearch}
        onSearchChange={setGlobalSearch}
        onSearchSubmit={handleGlobalSearchSubmit}
        notifications={notifications}
        onMarkNotificationsRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        currentUser={currentUser}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onSpeakText={handleSpeakText}
      />

      {/* Sign In & Sign Up Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        divisions={divisions}
        districts={districtEntities}
        upazilas={upazilaEntities}
      />

      {/* Main Workspace Container: Sidebar on Desktop + Main Content Viewport */}
      <div className="flex-1 max-w-[1440px] w-full min-w-0 mx-auto px-3 sm:px-6 pt-4 sm:pt-6 pb-20 lg:pb-10 flex gap-4 lg:gap-6 items-start">
        {/* Desktop Left Navigation Sidebar */}
        <aside className="hidden lg:block w-60 shrink-0 sticky top-22 bg-white rounded-2xl p-3.5 border border-stone-200/90">
          <nav aria-label="প্রধান মেনু" className="space-y-1">
            {visibleDesktopMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#166534] text-white'
                      : 'text-[#173B2A] hover:bg-[#DCFCE7]/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.labelBn}</span>
                </button>
              );
            })}
          </nav>

          {/* National Agri Helpline Card */}
          <div className="mt-5 pt-4 border-t border-stone-200 px-2 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#14532D]">
              <PhoneCall className="w-4 h-4 text-[#166534]" />
              <span>কৃষি কল সেন্টার: ১৬১২৩</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              যেকোনো কৃষি, মৎস্য ও প্রাণিসম্পদ বিষয়ে বিনামূল্যে বিশেষজ্ঞের পরামর্শের জন্য কল করুন।
            </p>
          </div>
        </aside>

        {/* Main Active Viewport */}
        <main className="flex-1 min-w-0">
          {activeTab === 'home' && (
            <HomeView
              onNavigate={setActiveTab}
              selectedDistrict={selectedDistrict}
              selectedUpazila={selectedUpazila}
              divisions={divisions}
              districtEntities={districtEntities}
              upazilaEntities={upazilaEntities}
              selectedDivisionId={selectedDivisionId}
              selectedDistrictId={selectedDistrictId}
              selectedUpazilaId={selectedUpazilaId}
              onSelectHierarchyLocation={handleSelectHierarchyLocation}
              weatherData={weatherData}
              marketPrices={marketPrices}
              crops={crops}
              questions={questions}
              onSelectCrop={setSelectedCrop}
            />
          )}

          {activeTab === 'weather' && (
            <WeatherView
              districts={BANGLADESH_DISTRICTS}
              selectedDistrict={selectedDistrict}
              selectedUpazila={selectedUpazila}
              onSelectDistrict={handleSelectDistrict}
              divisions={divisions}
              districtEntities={districtEntities}
              upazilaEntities={upazilaEntities}
              selectedDivisionId={selectedDivisionId}
              selectedDistrictId={selectedDistrictId}
              selectedUpazilaId={selectedUpazilaId}
              onSelectHierarchyLocation={handleSelectHierarchyLocation}
              weatherData={weatherData}
              loading={weatherLoading}
              error={weatherError}
              onRefreshWeather={fetchWeather}
            />
          )}

          {activeTab === 'market' && (
            <MarketView
              marketPrices={marketPrices}
              districts={BANGLADESH_DISTRICTS}
              divisions={divisions}
              districtEntities={districtEntities}
              upazilaEntities={upazilaEntities}
              savedPriceIds={savedPriceIds}
              onToggleSavePrice={(id) =>
                setSavedPriceIds((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                )
              }
            />
          )}

          {activeTab === 'crops' && (
            <CropsView
              crops={crops}
              selectedCrop={selectedCrop}
              onSelectCrop={setSelectedCrop}
              savedCropIds={savedCropIds}
              onToggleSaveCrop={(id) =>
                setSavedCropIds((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                )
              }
              onSpeakText={handleSpeakText}
            />
          )}

          {activeTab === 'diseases' && <DiseasesView diseases={diseases} />}

          {activeTab === 'calendar' && (
            <CalendarView
              months={BANGLA_CALENDAR_MONTHS}
              tasks={farmingTasks}
              onToggleTask={(id) =>
                setFarmingTasks((prev) =>
                  prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
                )
              }
              onAddTask={(titleBn, cropBn, dueDateBn, monthBn) =>
                setFarmingTasks((prev) => [
                  {
                    id: `tsk-${Date.now()}`,
                    titleBn,
                    cropBn,
                    dueDateBn,
                    monthBn,
                    completed: false,
                    priority: 'জরুরি',
                  },
                  ...prev,
                ])
              }
            />
          )}

          {activeTab === 'calculator' && <CalculatorView />}

          {activeTab === 'marketplace' && (
            <MarketplaceView
              listings={marketplaceListings}
              districts={BANGLADESH_DISTRICTS}
              divisions={divisions}
              districtEntities={districtEntities}
              upazilaEntities={upazilaEntities}
              onAddListing={handleAddMarketplaceListing}
              onReportListing={(id) =>
                setMarketplaceListings((prev) =>
                  prev.map((l) => (l.id === id ? { ...l, status: 'reported' } : l))
                )
              }
            />
          )}

          {activeTab === 'qa' && (
            <QAView
              questions={questions}
              districts={BANGLADESH_DISTRICTS}
              divisions={divisions}
              districtEntities={districtEntities}
              upazilaEntities={upazilaEntities}
              onRefreshQuestions={fetchBackendData}
            />
          )}

          {activeTab === 'my-farm' && (
            <MyFarmView
              currentUser={currentUser}
              onOpenAuthModal={(mode) => {
                setAuthModalMode(mode);
                setAuthModalOpen(true);
              }}
              fields={farmerFields}
              onAddField={(fld) =>
                setFarmerFields((prev) => [{ ...fld, id: `fld-${Date.now()}` }, ...prev])
              }
              expenses={farmerExpenses}
              onAddExpense={(exp) =>
                setFarmerExpenses((prev) => [{ ...exp, id: `exp-${Date.now()}` }, ...prev])
              }
              savedPrices={savedPricesList}
              savedCrops={savedCropsList}
              selectedDistrict={selectedDistrict}
              selectedUpazila={selectedUpazila}
            />
          )}
        </main>
      </div>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-stone-200 py-6 px-4 sm:px-6 mb-14 lg:mb-0">
        <div className="max-w-[1440px] min-w-0 mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-stone-600">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <Sprout className="w-4 h-4 text-[#166534]" />
            <span className="font-bold text-[#14532D]">কৃষিবন্ধু — কৃষকের ডিজিটাল সহকারী</span>
            <span>· কৃষকের পাশে, প্রতিদিন</span>
          </div>
          <div>
            তথ্যসূত্র: কৃষি সম্প্রসারণ অধিদপ্তর (DAE), কৃষি বিপণন অধিদপ্তর (DAM), ব্রি (BRRI) ও বারি (BARI)
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
    </div>
  );
}
