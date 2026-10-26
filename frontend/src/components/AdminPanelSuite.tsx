import React, { useState, useMemo } from 'react';
import { apiFetch } from '../lib/api';
import {
  Sprout,
  LayoutDashboard,
  MapPin,
  Users,
  TrendingUp,
  BookOpen,
  ShieldAlert,
  Calendar,
  CloudSun,
  ShoppingBag,
  MessageSquareText,
  FileText,
  Flag,
  Bell,
  Settings,
  ShieldCheck,
  History,
  Search,
  Plus,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Power,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Eye,
  Send,
  RefreshCw,
} from 'lucide-react';
import {
  AdminModuleTab,
  DivisionEntity,
  DistrictEntity,
  UpazilaEntity,
  AdminRoleType,
  PlatformUser,
  MarketPriceItem,
  MarketPriceWorkflowStatus,
  CropGuideItem,
  CropDiseaseItem,
  BanglaMonthCalendar,
  MarketplaceListing,
  MarketplaceModerationStatus,
  QuestionAnswerItem,
  AgriArticleItem,
  ReportComplaintItem,
  AppNotification,
  AuditLogEntry,
} from '@shared/types';
import {
  ADMIN_ROLE_LABELS_BN,
  ADMIN_ROLE_DESCRIPTIONS_BN,
  getAllowedAdminModulesForRole,
  AuthAccount,
  hasAdminPermission,
  getDistrictsByDivision,
  getUpazilasByDistrict,
  validateNewDivision,
  validateNewDistrict,
  validateNewUpazila,
  validateMarketPriceInput,
  exportLocationsToCSV,
} from '@shared/utils/locationAndAdminRules';
import { toBengaliNumber } from '@shared/utils/calculations';
import { CascadingLocationSelector } from './CascadingLocationSelector';

export interface AdminPanelSuiteProps {
  divisions: DivisionEntity[];
  districts: DistrictEntity[];
  upazilas: UpazilaEntity[];
  selectedDivisionId: string;
  selectedDistrictId: string;
  selectedUpazilaId: string;
  onSelectLocation: (sel: {
    divisionId: string;
    districtId: string;
    upazilaId: string;
  }) => void;
  onRefreshLocations: () => Promise<void>;
  users: PlatformUser[];
  onUpdateUser: (id: string, patch: Partial<PlatformUser>, reasonBn: string) => Promise<void>;
  marketPrices: MarketPriceItem[];
  onAddMarketPrice: (entry: any) => Promise<void>;
  onUpdateMarketPriceWorkflow: (
    id: string,
    workflowStatus: MarketPriceWorkflowStatus,
    reasonBn: string
  ) => Promise<void>;
  crops: CropGuideItem[];
  onAddCrop: (crop: CropGuideItem) => void;
  diseases: CropDiseaseItem[];
  onAddDisease: (disease: CropDiseaseItem) => void;
  calendarMonths: BanglaMonthCalendar[];
  weatherData: any;
  onRefreshWeather: (coords?: { lat: number; lon: number }) => void;
  listings: MarketplaceListing[];
  onModerateListing: (
    id: string,
    moderationStatus: MarketplaceModerationStatus,
    reasonBn: string
  ) => Promise<void>;
  questions: QuestionAnswerItem[];
  onAnswerQuestion: (questionId: string, answerTextBn: string, expertNameBn: string) => Promise<void>;
  articles: AgriArticleItem[];
  onAddArticle: (article: Omit<AgriArticleItem, 'id' | 'publishedAtBn'>) => Promise<void>;
  reports: ReportComplaintItem[];
  onResolveReport: (
    id: string,
    status: ReportComplaintItem['status'],
    resolutionNoteBn: string
  ) => Promise<void>;
  notifications: AppNotification[];
  onSendNotification: (notif: Omit<AppNotification, 'id' | 'timeBn' | 'read'>) => void;
  auditLogs: AuditLogEntry[];
  onRecordAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'requestId' | 'timestampBn'>) => void;
  currentAdminRole: AdminRoleType;
  onChangeAdminRole: (role: AdminRoleType) => void;
  currentUser?: AuthAccount | null;
  onLogout?: () => void;
  onExitAdmin: () => void;
}

export const ADMIN_SIDEBAR_MODULES: {
  id: AdminModuleTab;
  numberBn: string;
  labelBn: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'dashboard', numberBn: '১', labelBn: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  { id: 'locations', numberBn: '২', labelBn: 'অবস্থান ব্যবস্থাপনা', icon: MapPin },
  { id: 'users', numberBn: '৩', labelBn: 'ব্যবহারকারী ব্যবস্থাপনা', icon: Users },
  { id: 'market-prices', numberBn: '৪', labelBn: 'বাজারদর ব্যবস্থাপনা', icon: TrendingUp },
  { id: 'crops', numberBn: '৫', labelBn: 'ফসল ও চাষাবাদ', icon: BookOpen },
  { id: 'diseases', numberBn: '৬', labelBn: 'রোগ ও প্রতিকার', icon: ShieldAlert },
  { id: 'calendar', numberBn: '৭', labelBn: 'কৃষি ক্যালেন্ডার', icon: Calendar },
  { id: 'weather-alerts', numberBn: '৮', labelBn: 'আবহাওয়া ও সতর্কতা', icon: CloudSun },
  { id: 'marketplace', numberBn: '৯', labelBn: 'ফসল বিক্রির বিজ্ঞাপন', icon: ShoppingBag },
  { id: 'qa', numberBn: '১০', labelBn: 'কৃষি প্রশ্নোত্তর', icon: MessageSquareText },
  { id: 'articles', numberBn: '১১', labelBn: 'কৃষি নিবন্ধ', icon: FileText },
  { id: 'reports', numberBn: '১২', labelBn: 'রিপোর্ট ও অভিযোগ', icon: Flag },
  { id: 'notifications', numberBn: '১৩', labelBn: 'নোটিফিকেশন', icon: Bell },
  { id: 'settings', numberBn: '১৪', labelBn: 'ওয়েবসাইট সেটিংস', icon: Settings },
  { id: 'roles-permissions', numberBn: '১৫', labelBn: 'অ্যাডমিন ও অনুমতি', icon: ShieldCheck },
  { id: 'audit-logs', numberBn: '১৬', labelBn: 'কার্যক্রমের ইতিহাস', icon: History },
];

export const AdminPanelSuite: React.FC<AdminPanelSuiteProps> = ({
  divisions,
  districts,
  upazilas,
  selectedDivisionId,
  selectedDistrictId,
  selectedUpazilaId,
  onSelectLocation,
  onRefreshLocations,
  users,
  onUpdateUser,
  marketPrices,
  onAddMarketPrice,
  onUpdateMarketPriceWorkflow,
  crops,
  onAddCrop,
  diseases,
  onAddDisease,
  calendarMonths,
  weatherData,
  onRefreshWeather,
  listings,
  onModerateListing,
  questions,
  onAnswerQuestion,
  articles,
  onAddArticle,
  reports,
  onResolveReport,
  notifications,
  onSendNotification,
  auditLogs,
  onRecordAuditLog,
  currentAdminRole,
  onChangeAdminRole,
  currentUser,
  onLogout,
  onExitAdmin,
}) => {
  const [activeModule, setActiveModule] = useState<AdminModuleTab>('dashboard');
  const allowedModuleIds = useMemo(
    () => getAllowedAdminModulesForRole(currentAdminRole),
    [currentAdminRole]
  );
  const allowedModules = useMemo(
    () => ADMIN_SIDEBAR_MODULES.filter((m) => allowedModuleIds.includes(m.id)),
    [allowedModuleIds]
  );

  React.useEffect(() => {
    if (!allowedModuleIds.includes(activeModule)) {
      setActiveModule('dashboard');
    }
  }, [allowedModuleIds, activeModule]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [adminGlobalSearch, setAdminGlobalSearch] = useState('');
  const [showQuickLocPopover, setShowQuickLocPopover] = useState(false);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    messageBn: string;
  } | null>(null);

  // ============================================================================
  // Location Management State (Section 4)
  // ============================================================================
  const [locSearchQuery, setLocSearchQuery] = useState('');
  const [locTypeFilter, setLocTypeFilter] = useState<'all' | 'division' | 'district' | 'upazila'>('all');
  const [locDivFilter, setLocDivFilter] = useState<string>('');
  const [locDistFilter, setLocDistFilter] = useState<string>('');
  const [locStatusFilter, setLocStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Location Add / Edit Modal State
  const [locModalMode, setLocModalMode] = useState<
    null | 'add-division' | 'add-district' | 'add-upazila' | 'edit-item' | 'csv-import'
  >(null);
  const [editingLocItem, setEditingLocItem] = useState<{
    id: string;
    kind: 'division' | 'district' | 'upazila';
  } | null>(null);

  const [formDivId, setFormDivId] = useState(selectedDivisionId || 'div-dhaka');
  const [formDistId, setFormDistId] = useState(selectedDistrictId || 'dist-gazipur');
  const [formNameBn, setFormNameBn] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formLat, setFormLat] = useState<string>('23.9889');
  const [formLon, setFormLon] = useState<string>('90.5694');
  const [formIsActive, setFormIsActive] = useState(true);
  const [csvImportText, setCsvImportText] = useState('');

  // ============================================================================
  // Market Price Form State (Section 7)
  // ============================================================================
  const [mpDivId, setMpDivId] = useState(selectedDivisionId || 'div-rajshahi');
  const [mpDistId, setMpDistId] = useState(selectedDistrictId || 'dist-bogura');
  const [mpUpzId, setMpUpzId] = useState(selectedUpazilaId || 'upz-shibganj');
  const [mpCropName, setMpCropName] = useState('');
  const [mpCategory, setMpCategory] = useState<MarketPriceItem['categoryBn']>('ধান ও শস্য');
  const [mpMarketName, setMpMarketName] = useState('');
  const [mpUnit, setMpUnit] = useState('মণ (৪০ কেজি)');
  const [mpWholesale, setMpWholesale] = useState<number>(1280);
  const [mpRetail, setMpRetail] = useState<number>(1350);
  const [mpSource, setMpSource] = useState('কৃষি বিপণন অধিদপ্তর (DAM) — যাচাইকৃত');
  const [mpWorkflowStatus, setMpWorkflowStatus] = useState<MarketPriceWorkflowStatus>('Published');
  const [mpFilterStatus, setMpFilterStatus] = useState<string>('ALL');

  // ============================================================================
  // Marketplace Moderation State (Section 8)
  // ============================================================================
  const [mktModReason, setMktModReason] = useState<Record<string, string>>({});
  const [inspectSellerListing, setInspectSellerListing] = useState<MarketplaceListing | null>(null);

  // ============================================================================
  // Q&A Expert Answer State
  // ============================================================================
  const [qaDraftAnswers, setQaDraftAnswers] = useState<Record<string, string>>({});

  // ============================================================================
  // Article, Crop, Disease, Notification, Settings States
  // ============================================================================
  const [artTitle, setArtTitle] = useState('');
  const [artCategory, setArtCategory] = useState<AgriArticleItem['categoryBn']>('চাষাবাদ প্রযুক্তি');
  const [artSummary, setArtSummary] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artStatus, setArtStatus] = useState<'প্রকাশিত' | 'খসড়া'>('প্রকাশিত');

  const [newCropName, setNewCropName] = useState('');
  const [newCropScientific, setNewCropScientific] = useState('');
  const [newCropSeason, setNewCropSeason] = useState('রবি ও খরিফ');
  const [newCropSoil, setNewCropSoil] = useState('দোআঁশ ও পলি দোআঁশ মাটি');
  const [newCropYield, setNewCropYield] = useState('বিঘা প্রতি ১৮–২২ মণ');

  const [newDisName, setNewDisName] = useState('');
  const [newDisCrop, setNewDisCrop] = useState('আমন ও বোরো ধান');
  const [newDisSymptom, setNewDisSymptom] = useState('');
  const [newDisPrevention, setNewDisPrevention] = useState('');

  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<AppNotification['type']>('weather');

  const [weatherAlertTitle, setWeatherAlertTitle] = useState('কালবৈশাখী ও শিলাবৃষ্টির বিশেষ কৃষি সতর্কবার্তা');
  const [weatherAlertBody, setWeatherAlertBody] = useState(
    'আগামী ২৪ ঘণ্টায় দমকা হাওয়া ও মাঝারি বৃষ্টির সম্ভাবনা থাকায় পাকা বোরো ধান দ্রুত কর্তন ও নিরাপদ স্থানে সংরক্ষণের পরামর্শ দেওয়া হচ্ছে।'
  );
  const [siteNameSetting, setSiteNameSetting] = useState('কৃষিবন্ধু — কৃষকের ডিজিটাল সহকারী');
  const [helplineSetting, setHelplineSetting] = useState('১৬১২৩ (কৃষি কল সেন্টার)');
  const [weatherCacheMinutes, setWeatherCacheMinutes] = useState<number>(30);

  const showToast = (type: 'success' | 'error', messageBn: string) => {
    setFeedbackBanner({ type, messageBn });
  };

  // ============================================================================
  // Real Computed Dashboard Statistics (Section 3.1: Zero Hardcoded Demo Numbers)
  // ============================================================================
  const dashboardStats = useMemo(() => {
    const totalUsers = users.length;
    const activeFarmers = users.filter(
      (u) => u.roleBn === 'কৃষক' && u.status === 'সক্রিয়'
    ).length;
    const pendingMarketPrices = marketPrices.filter(
      (m) =>
        m.workflowStatus === 'Pending Review' ||
        m.workflowStatus === 'Draft' ||
        !m.verified
    ).length;
    const publishedMarketPrices = marketPrices.filter(
      (m) => m.workflowStatus === 'Published' || m.verified
    ).length;
    const pendingListings = listings.filter(
      (l) => l.moderationStatus === 'Pending' || l.status === 'pending'
    ).length;
    const activeListings = listings.filter(
      (l) =>
        l.moderationStatus === 'Published' ||
        l.moderationStatus === 'Approved' ||
        l.status === 'approved'
    ).length;
    const unansweredQuestions = questions.filter((q) => q.answers.length === 0).length;
    const openReports = reports.filter((r) => r.status === 'বিবেচনাধীন').length;

    return {
      totalUsers,
      activeFarmers,
      pendingMarketPrices,
      publishedMarketPrices,
      pendingListings,
      activeListings,
      unansweredQuestions,
      openReports,
    };
  }, [users, marketPrices, listings, questions, reports]);

  // ============================================================================
  // Real Computed Location Summary & Unified Table Rows (Section 4.3)
  // ============================================================================
  const locationSummary = useMemo(() => {
    const totalDivisions = divisions.length;
    const totalDistricts = districts.length;
    const totalUpazilas = upazilas.length;
    const activeTotal =
      divisions.filter((d) => d.isActive).length +
      districts.filter((d) => d.isActive).length +
      upazilas.filter((u) => u.isActive).length;
    const incompleteUpazilas = upazilas.filter(
      (u) => !u.latitude || !u.longitude || !u.isActive
    ).length;
    return {
      totalDivisions,
      totalDistricts,
      totalUpazilas,
      activeTotal,
      incompleteUpazilas,
    };
  }, [divisions, districts, upazilas]);

  const unifiedLocationRows = useMemo(() => {
    const rows: {
      id: string;
      nameBn: string;
      slug: string;
      code: string;
      kind: 'division' | 'district' | 'upazila';
      typeLabelBn: 'বিভাগ' | 'জেলা' | 'উপজেলা';
      parentNameBn: string;
      divisionId: string;
      districtId: string;
      coordsBn: string;
      latitude?: number;
      longitude?: number;
      isActive: boolean;
    }[] = [];

    for (const div of divisions) {
      rows.push({
        id: div.id,
        nameBn: div.nameBn,
        slug: div.slug,
        code: div.code,
        kind: 'division',
        typeLabelBn: 'বিভাগ',
        parentNameBn: 'বাংলাদেশ',
        divisionId: div.id,
        districtId: '',
        coordsBn: '—',
        isActive: div.isActive,
      });
    }

    for (const dist of districts) {
      const parentDiv = divisions.find((d) => d.id === dist.divisionId);
      rows.push({
        id: dist.id,
        nameBn: dist.nameBn,
        slug: dist.slug,
        code: dist.code,
        kind: 'district',
        typeLabelBn: 'জেলা',
        parentNameBn: parentDiv ? `${parentDiv.nameBn} বিভাগ` : '—',
        divisionId: dist.divisionId,
        districtId: dist.id,
        coordsBn: '—',
        isActive: dist.isActive,
      });
    }

    for (const upz of upazilas) {
      const parentDist = districts.find((d) => d.id === upz.districtId);
      const parentDiv = divisions.find((d) => d.id === upz.divisionId);
      rows.push({
        id: upz.id,
        nameBn: upz.nameBn,
        slug: upz.slug,
        code: upz.code,
        kind: 'upazila',
        typeLabelBn: 'উপজেলা',
        parentNameBn: parentDist
          ? `${parentDist.nameBn} জেলা (${parentDiv?.nameBn || ''})`
          : '—',
        divisionId: upz.divisionId,
        districtId: upz.districtId,
        coordsBn: `${toBengaliNumber(upz.latitude, 4)}° উ, ${toBengaliNumber(
          upz.longitude,
          4
        )}° পূ`,
        latitude: upz.latitude,
        longitude: upz.longitude,
        isActive: upz.isActive,
      });
    }

    return rows.filter((r) => {
      if (locTypeFilter !== 'all' && r.kind !== locTypeFilter) return false;
      if (locDivFilter && r.divisionId !== locDivFilter) return false;
      if (locDistFilter && r.districtId !== locDistFilter) return false;
      if (locStatusFilter === 'active' && !r.isActive) return false;
      if (locStatusFilter === 'inactive' && r.isActive) return false;
      if (locSearchQuery.trim()) {
        const q = locSearchQuery.trim().toLowerCase();
        return (
          r.nameBn.toLowerCase().includes(q) ||
          r.parentNameBn.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [
    divisions,
    districts,
    upazilas,
    locTypeFilter,
    locDivFilter,
    locDistFilter,
    locStatusFilter,
    locSearchQuery,
  ]);

  // ============================================================================
  // Location Handlers (Add / Edit / Toggle Active / CSV Export & Import)
  // ============================================================================
  const openAddLocationModal = (mode: 'add-division' | 'add-district' | 'add-upazila') => {
    if (!hasAdminPermission(currentAdminRole, 'manage_locations')) {
      showToast(
        'error',
        `আপনার বর্তমান ভূমিকা (${ADMIN_ROLE_LABELS_BN[currentAdminRole]}) থেকে অবস্থান পরিবর্তনের অনুমতি নেই।`
      );
      return;
    }
    setEditingLocItem(null);
    setFormNameBn('');
    setFormSlug('');
    setFormCode('');
    setFormIsActive(true);
    setFormDivId(selectedDivisionId || divisions[0]?.id || '');
    const firstDist = getDistrictsByDivision(
      districts,
      selectedDivisionId || divisions[0]?.id || '',
      true
    )[0];
    setFormDistId(selectedDistrictId || firstDist?.id || '');
    setFormLat('23.9889');
    setFormLon('90.5694');
    setLocModalMode(mode);
  };

  const openEditLocationModal = (row: (typeof unifiedLocationRows)[number]) => {
    if (!hasAdminPermission(currentAdminRole, 'manage_locations')) {
      showToast(
        'error',
        `আপনার বর্তমান ভূমিকা (${ADMIN_ROLE_LABELS_BN[currentAdminRole]}) থেকে অবস্থান সম্পাদনার অনুমতি নেই।`
      );
      return;
    }
    setEditingLocItem({ id: row.id, kind: row.kind });
    setFormNameBn(row.nameBn);
    setFormSlug(row.slug);
    setFormCode(row.code);
    setFormDivId(row.divisionId);
    setFormDistId(row.districtId);
    setFormLat(String(row.latitude ?? 23.8103));
    setFormLon(String(row.longitude ?? 90.4125));
    setFormIsActive(row.isActive);
    setLocModalMode('edit-item');
  };

  const handleSaveLocationModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAdminPermission(currentAdminRole, 'manage_locations')) {
      showToast('error', 'অবস্থান পরিবর্তনের অনুমতি নেই।');
      return;
    }

    try {
      if (locModalMode === 'add-division') {
        const check = validateNewDivision(formNameBn, divisions);
        if (!check.valid) {
          showToast('error', check.errorBn || 'বিভাগের তথ্য সঠিক নয়।');
          return;
        }
        const res = await apiFetch('/api/admin/locations/divisions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nameBn: formNameBn.trim(),
            slug: formSlug.trim(),
            code: formCode.trim(),
            isActive: formIsActive,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'বিভাগ তৈরি করা যায়নি');
        await onRefreshLocations();
        showToast('success', `"${formNameBn.trim()}" বিভাগ সফলভাবে সংরক্ষিত হয়েছে।`);
        setLocModalMode(null);
      } else if (locModalMode === 'add-district') {
        const check = validateNewDistrict(formNameBn, formDivId, districts);
        if (!check.valid) {
          showToast('error', check.errorBn || 'জেলার তথ্য সঠিক নয়।');
          return;
        }
        const res = await apiFetch('/api/admin/locations/districts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            divisionId: formDivId,
            nameBn: formNameBn.trim(),
            slug: formSlug.trim(),
            code: formCode.trim(),
            isActive: formIsActive,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'জেলা তৈরি করা যায়নি');
        await onRefreshLocations();
        showToast('success', `"${formNameBn.trim()}" জেলা সফলভাবে সংরক্ষিত হয়েছে।`);
        setLocModalMode(null);
      } else if (locModalMode === 'add-upazila') {
        const check = validateNewUpazila(formNameBn, formDivId, formDistId, upazilas);
        if (!check.valid) {
          showToast('error', check.errorBn || 'উপজেলার তথ্য সঠিক নয়।');
          return;
        }
        const res = await apiFetch('/api/admin/locations/upazilas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            divisionId: formDivId,
            districtId: formDistId,
            nameBn: formNameBn.trim(),
            slug: formSlug.trim(),
            code: formCode.trim(),
            latitude: Number(formLat) || 23.8103,
            longitude: Number(formLon) || 90.4125,
            isActive: formIsActive,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'উপজেলা তৈরি করা যায়নি');
        await onRefreshLocations();
        showToast('success', `"${formNameBn.trim()}" উপজেলা সফলভাবে সংরক্ষিত হয়েছে।`);
        setLocModalMode(null);
      } else if (locModalMode === 'edit-item' && editingLocItem) {
        const endpoint =
          editingLocItem.kind === 'division'
            ? `/api/admin/locations/divisions/${editingLocItem.id}`
            : editingLocItem.kind === 'district'
            ? `/api/admin/locations/districts/${editingLocItem.id}`
            : `/api/admin/locations/upazilas/${editingLocItem.id}`;

        const res = await apiFetch(endpoint, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nameBn: formNameBn.trim(),
            slug: formSlug.trim(),
            code: formCode.trim(),
            divisionId: formDivId,
            districtId: formDistId,
            latitude: Number(formLat),
            longitude: Number(formLon),
            isActive: formIsActive,
            reasonBn: 'অ্যাডমিন প্যানেল থেকে তথ্য ও স্থানাঙ্ক সংশোধন',
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'অবস্থান হালনাগাদ করা যায়নি');
        await onRefreshLocations();
        showToast('success', `"${formNameBn.trim()}" অবস্থান সফলভাবে হালনাগাদ হয়েছে।`);
        setLocModalMode(null);
      }
    } catch (err: any) {
      showToast('error', err.message || 'অবস্থান সংরক্ষণে ত্রুটি ঘটেছে।');
    }
  };

  const handleToggleLocationActive = async (row: (typeof unifiedLocationRows)[number]) => {
    if (!hasAdminPermission(currentAdminRole, 'manage_locations')) {
      showToast(
        'error',
        `আপনার বর্তমান ভূমিকা (${ADMIN_ROLE_LABELS_BN[currentAdminRole]}) থেকে অবস্থান নিষ্ক্রিয়/সক্রিয় করার অনুমতি নেই।`
      );
      return;
    }
    const endpoint =
      row.kind === 'division'
        ? `/api/admin/locations/divisions/${row.id}`
        : row.kind === 'district'
        ? `/api/admin/locations/districts/${row.id}`
        : `/api/admin/locations/upazilas/${row.id}`;

    try {
      const res = await apiFetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !row.isActive,
          reasonBn: !row.isActive ? 'পুনরায় সক্রিয় করা হলো' : 'প্রশাসনিকভাবে নিষ্ক্রিয় করা হলো',
        }),
      });
      if (!res.ok) throw new Error('অবস্থা পরিবর্তন করা যায়নি');
      await onRefreshLocations();
      showToast(
        'success',
        `"${row.nameBn}" ${!row.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে।`
      );
    } catch (err: any) {
      showToast('error', err.message || 'অবস্থা পরিবর্তন করা যায়নি।');
    }
  };

  const handleExportLocationsCSV = () => {
    const csv = exportLocationsToCSV(divisions, districts, upazilas);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'krishibondhu-locations.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('success', 'বাংলাদেশের অবস্থান তালিকা CSV ফরম্যাটে ডাউনলোড হয়েছে।');
  };

  const handleImportCSVSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvImportText.trim()) {
      showToast('error', 'অনুগ্রহ করে CSV লাইন লিখুন (যেমন: কালীগঞ্জ,div-dhaka,dist-gazipur,23.9889,90.5694)');
      return;
    }
    const lines = csvImportText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const items = lines.map((line) => {
      const [nameBn, divisionId, districtId, lat, lon] = line.split(',').map((s) => s.trim());
      return {
        type: 'উপজেলা',
        nameBn,
        divisionId: divisionId || selectedDivisionId,
        districtId: districtId || selectedDistrictId,
        latitude: Number(lat) || 23.9889,
        longitude: Number(lon) || 90.5694,
      };
    });

    try {
      const res = await apiFetch('/api/admin/locations/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'CSV Import ব্যর্থ হয়েছে');
      await onRefreshLocations();
      setCsvImportText('');
      setLocModalMode(null);
      showToast(
        'success',
        `CSV থেকে ${toBengaliNumber(data.importedCount || 0)}টি নতুন অবস্থান যুক্ত হয়েছে।`
      );
    } catch (err: any) {
      showToast('error', err.message || 'CSV Import ব্যর্থ হয়েছে');
    }
  };

  // ============================================================================
  // Market Price Submit Handler (Section 7)
  // ============================================================================
  const handleCreateAdminMarketPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAdminPermission(currentAdminRole, 'manage_market_prices')) {
      showToast(
        'error',
        `আপনার বর্তমান ভূমিকা (${ADMIN_ROLE_LABELS_BN[currentAdminRole]}) থেকে বাজারদর যোগ করার অনুমতি নেই।`
      );
      return;
    }

    const validation = validateMarketPriceInput({
      cropNameBn: mpCropName,
      divisionId: mpDivId,
      districtId: mpDistId,
      upazilaId: mpUpzId,
      marketNameBn: mpMarketName,
      wholesalePrice: mpWholesale,
      retailPrice: mpRetail,
      unitBn: mpUnit,
      sourceBn: mpSource,
    });

    if (!validation.valid) {
      showToast('error', validation.errorBn || 'বাজারদরের তথ্য অসম্পূর্ণ।');
      return;
    }

    const divObj = divisions.find((d) => d.id === mpDivId);
    const distObj = districts.find((d) => d.id === mpDistId);
    const upzObj = upazilas.find((u) => u.id === mpUpzId);

    await onAddMarketPrice({
      cropNameBn: mpCropName.trim(),
      categoryBn: mpCategory,
      marketNameBn: mpMarketName.trim(),
      divisionId: mpDivId,
      districtId: mpDistId,
      upazilaId: mpUpzId,
      divisionBn: divObj?.nameBn || '',
      districtBn: distObj?.nameBn || '',
      upazilaBn: upzObj?.nameBn || '',
      wholesalePrice: mpWholesale,
      retailPrice: mpRetail,
      unitBn: mpUnit.trim(),
      sourceBn: mpSource.trim(),
      workflowStatus: mpWorkflowStatus,
    });

    setMpCropName('');
    setMpMarketName('');
    showToast(
      'success',
      `নতুন বাজারদর (${mpWorkflowStatus}) সফলভাবে সংরক্ষিত হয়েছে।`
    );
  };

  const activeModuleMeta =
    ADMIN_SIDEBAR_MODULES.find((m) => m.id === activeModule) || ADMIN_SIDEBAR_MODULES[0];

  const currentDivObj = divisions.find((d) => d.id === selectedDivisionId);
  const currentDistObj = districts.find((d) => d.id === selectedDistrictId);
  const currentUpzObj = upazilas.find((u) => u.id === selectedUpazilaId);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F8F1] text-[#173B2A]">
      {/* =====================================================================
          2.1 Compact Admin Top Navbar
         ===================================================================== */}
      <header className="sticky top-0 z-30 bg-[#14532D] text-white border-b border-white/10">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Left: Logo + Admin Panel Title + Mobile Sidebar Toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="অ্যাডমিন মেনু খুলুন"
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#166534] border border-white/20 flex items-center justify-center">
                <Sprout className="w-4 h-4 text-[#DCFCE7]" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight">কৃষিবন্ধু</span>
                <span className="ml-2 text-xs text-[#DCFCE7] font-semibold border-l border-white/25 pl-2">
                  Admin Panel
                </span>
              </div>
            </div>
          </div>

          {/* Center: Global Search + Quick Location Selector */}
          <div className="hidden md:flex items-center gap-2.5 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-stone-300 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={adminGlobalSearch}
                onChange={(e) => {
                  setAdminGlobalSearch(e.target.value);
                  const q = e.target.value.trim();
                  if (q.includes('অবস্থান') || q.includes('উপজেলা') || q.includes('জেলা')) {
                    setActiveModule('locations');
                  } else if (q.includes('বাজার') || q.includes('দাম')) {
                    setActiveModule('market-prices');
                  } else if (q.includes('বিজ্ঞাপন')) {
                    setActiveModule('marketplace');
                  } else if (q.includes('লগ') || q.includes('ইতিহাস')) {
                    setActiveModule('audit-logs');
                  }
                }}
                placeholder="অ্যাডমিন প্যানেলে অবস্থান, বাজারদর, ব্যবহারকারী বা লগ খুঁজুন..."
                aria-label="অ্যাডমিন গ্লোবাল সার্চ"
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs text-white placeholder:text-stone-300 focus:bg-white focus:text-[#173B2A] focus:outline-none"
              />
            </div>

            {/* Quick Cascading Location Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowQuickLocPopover((prev) => !prev)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#DCFCE7]" />
                <span>
                  {currentDivObj?.nameBn || 'ঢাকা'} → {currentDistObj?.nameBn || 'গাজীপুর'} →{' '}
                  {currentUpzObj?.nameBn || 'কালীগঞ্জ'}
                </span>
              </button>

              {showQuickLocPopover && (
                <div className="absolute right-0 mt-2 w-[420px] max-w-[92vw] bg-white text-[#173B2A] rounded-2xl shadow-xl border border-stone-200 p-4 z-50">
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-stone-100">
                    <span className="text-xs font-bold text-[#14532D]">
                      দ্রুত অবস্থান নির্বাচন (বিভাগ → জেলা → উপজেলা)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowQuickLocPopover(false)}
                      className="text-xs text-stone-500 hover:text-stone-800"
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                  <CascadingLocationSelector
                    divisions={divisions}
                    districts={districts}
                    upazilas={upazilas}
                    selectedDivisionId={selectedDivisionId}
                    selectedDistrictId={selectedDistrictId}
                    selectedUpazilaId={selectedUpazilaId}
                    onChange={(sel) => {
                      onSelectLocation({
                        divisionId: sel.divisionId,
                        districtId: sel.districtId,
                        upazilaId: sel.upazilaId,
                      });
                    }}
                    compact
                    idPrefix="admin-nav-loc"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right: Notifications, RBAC Role Switcher & Exit/Logout */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifPopover((prev) => !prev)}
                aria-label="অ্যাডমিন নোটিফিকেশন"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 cursor-pointer"
              >
                <Bell className="w-4 h-4" />
              </button>
              {showNotifPopover && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-[#173B2A] rounded-2xl shadow-xl border border-stone-200 p-4 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <span className="text-xs font-bold text-[#14532D]">সিস্টেম নোটিফিকেশন</span>
                    <button
                      type="button"
                      onClick={() => setShowNotifPopover(false)}
                      className="text-xs text-stone-500"
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                  <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto mt-1">
                    {notifications.slice(0, 5).map((n) => (
                      <div key={n.id} className="py-2 text-xs">
                        <div className="font-bold text-[#166534]">{n.titleBn}</div>
                        <div className="text-stone-600 mt-0.5">{n.messageBn}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Logged-in Admin Position Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#166534] border border-white/20 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#DCFCE7] shrink-0" />
              <div className="leading-tight">
                <span className="font-bold text-white">
                  {currentUser?.nameBn || 'অ্যাডমিন'}
                </span>
                <span className="ml-1.5 text-[11px] text-[#DCFCE7] font-semibold">
                  ({currentUser?.positionTitleBn || ADMIN_ROLE_LABELS_BN[currentAdminRole]})
                </span>
              </div>
            </div>

            {/* Admin RBAC Role Switcher (Available when logged in as Super Admin to inspect any role) */}
            {(!currentUser || currentUser.adminRole === 'Super Admin') && (
              <>
                <label htmlFor="admin-rbac-role-select" className="sr-only">
                  অ্যাডমিন ভূমিকা নির্বাচন করুন
                </label>
                <select
                  id="admin-rbac-role-select"
                  value={currentAdminRole}
                  onChange={(e) => onChangeAdminRole(e.target.value as AdminRoleType)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-semibold text-white cursor-pointer focus:outline-none"
                >
                  <option value="Super Admin" className="text-[#173B2A]">সুপার অ্যাডমিন (Super Admin)</option>
                  <option value="Market Manager" className="text-[#173B2A]">মার্কেট ম্যানেজার (Market Manager)</option>
                  <option value="Content Editor" className="text-[#173B2A]">কনটেন্ট এডিটর (Content Editor)</option>
                  <option value="Moderator" className="text-[#173B2A]">মডারেটর (Moderator)</option>
                  <option value="Support Agent" className="text-[#173B2A]">সাপোর্ট ম্যানেজার (Support Manager)</option>
                </select>
              </>
            )}

            {/* Return to Public Website */}
            <button
              type="button"
              onClick={onExitAdmin}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="মূল ওয়েবসাইটে ফিরে যান"
            >
              <span className="hidden sm:inline">মূল সাইট</span>
            </button>

            {/* Logout */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-2.5 py-1.5 rounded-lg bg-red-700/90 hover:bg-red-800 border border-white/15 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="অ্যাডমিন প্যানেল থেকে লগআউট করুন"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">লগআউট</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          Main Layout: 2.2 Sidebar Navigation (16 Modules) + 2.3 Main Workspace
         ===================================================================== */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 py-5 flex gap-6 items-start">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-19 bg-white rounded-2xl p-3 border border-stone-200 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="px-3 py-2.5 border-b border-stone-100 mb-2 bg-[#F5F8F1] rounded-xl">
            <div className="text-[11px] font-semibold text-stone-600">
              অনুমোদিত বিভাগ ({toBengaliNumber(allowedModules.length)}টি মডিউল)
            </div>
            <div className="text-xs font-bold text-[#166534] mt-0.5">
              পদবি: {currentUser?.positionTitleBn || ADMIN_ROLE_LABELS_BN[currentAdminRole]}
            </div>
            <div className="text-[11px] text-stone-600 mt-1 leading-snug">
              {ADMIN_ROLE_DESCRIPTIONS_BN[currentAdminRole]}
            </div>
          </div>
          <nav aria-label="অ্যাডমিন সাইডবার নেভিগেশন" className="space-y-0.5">
            {allowedModules.map((mod) => {
              const Icon = mod.icon;
              const isActive = activeModule === mod.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActiveModule(mod.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#166534] text-white'
                      : 'text-[#173B2A] hover:bg-[#DCFCE7]/60'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {mod.numberBn}. {mod.labelBn}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Drawer Sidebar */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] bg-white h-full overflow-y-auto p-4 z-10">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <span className="font-bold text-sm text-[#14532D]">
                  কৃষিবন্ধু Admin Panel মেনু
                </span>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-label="বন্ধ করুন"
                  className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="mt-3 space-y-1">
                {allowedModules.map((mod) => {
                  const Icon = mod.icon;
                  const isActive = activeModule === mod.id;
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => {
                        setActiveModule(mod.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive
                          ? 'bg-[#166534] text-white'
                          : 'text-[#173B2A] hover:bg-[#DCFCE7]/60'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>
                        {mod.numberBn}. {mod.labelBn}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* 2.3 Main Workspace */}
        <main className="flex-1 min-w-0 space-y-5 pb-12">
          {/* Breadcrumb & Page Header */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <span>অ্যাডমিন প্যানেল</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="font-semibold text-[#166534]">
                  {activeModuleMeta.numberBn}. {activeModuleMeta.labelBn}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#14532D] mt-1">
                {activeModuleMeta.labelBn}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {allowedModuleIds.includes('locations') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveModule('locations');
                    openAddLocationModal('add-upazila');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#F5F8F1] hover:bg-[#DCFCE7] text-[#14532D] border border-stone-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#166534]" />
                  <span>নতুন অবস্থান</span>
                </button>
              )}
              {allowedModuleIds.includes('market-prices') && (
                <button
                  type="button"
                  onClick={() => setActiveModule('market-prices')}
                  className="px-3.5 py-2 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>নতুন বাজারদর</span>
                </button>
              )}
            </div>
          </div>

          {/* Feedback Toast Banner */}
          {feedbackBanner && (
            <div
              role="status"
              className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold ${
                feedbackBanner.type === 'success'
                  ? 'bg-[#DCFCE7] border-[#166534]/30 text-[#14532D]'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedbackBanner.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
                )}
                <span>{feedbackBanner.messageBn}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackBanner(null)}
                className="text-xs underline cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          )}

          {/* =================================================================
              MODULE 1: ড্যাশবোর্ড (Section 3)
             ================================================================= */}
          {activeModule === 'dashboard' && (
            <div className="space-y-6">
              {/* Role-Based Position Access Summary Banner */}
              <section className="bg-white rounded-2xl p-5 border border-[#166534]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#166534]" />
                    <h2 className="text-sm sm:text-base font-bold text-[#14532D]">
                      লগইনকৃত পদবি: {currentUser?.positionTitleBn || ADMIN_ROLE_LABELS_BN[currentAdminRole]}
                    </h2>
                  </div>
                  <p className="text-xs text-stone-600">
                    ব্যবহারকারী: <span className="font-bold text-[#173B2A]">{currentUser?.nameBn || 'ড. মাহবুবুর রহমান'}</span> ({currentUser?.username || 'superadmin'}) — {ADMIN_ROLE_DESCRIPTIONS_BN[currentAdminRole]}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allowedModules.map((mod) => (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => setActiveModule(mod.id)}
                      className="px-2.5 py-1 rounded-lg bg-[#DCFCE7] hover:bg-[#166534] text-[#14532D] hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {mod.numberBn}. {mod.labelBn}
                    </button>
                  ))}
                </div>
              </section>

              {/* 3.1 Real Database Statistics Cards (8 Cards) */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-stone-200">
                  <div className="text-xs text-stone-500">মোট ব্যবহারকারী</div>
                  <div className="text-2xl font-bold text-[#14532D] font-mono-tabular mt-1">
                    {toBengaliNumber(dashboardStats.totalUsers)}
                  </div>
                  <div className="text-[11px] text-[#166534] mt-1">
                    ডেটাবেসের বাস্তব হিসাব অনুযায়ী
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200">
                  <div className="text-xs text-stone-500">সক্রিয় কৃষক</div>
                  <div className="text-2xl font-bold text-[#166534] font-mono-tabular mt-1">
                    {toBengaliNumber(dashboardStats.activeFarmers)}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    যাচাইকৃত কৃষি প্রোফাইল
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200">
                  <div className="text-xs text-stone-500">যাচাইয়ের অপেক্ষায় থাকা বাজারদর</div>
                  <div className="text-2xl font-bold text-amber-700 font-mono-tabular mt-1">
                    {toBengaliNumber(dashboardStats.pendingMarketPrices)}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    Draft / Pending Review এন্ট্রি
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200">
                  <div className="text-xs text-stone-500">প্রকাশিত বাজারদরের এন্ট্রি</div>
                  <div className="text-2xl font-bold text-[#166534] font-mono-tabular mt-1">
                    {toBengaliNumber(dashboardStats.publishedMarketPrices)}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    সাধারণ ওয়েবসাইটে দৃশ্যমান
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200">
                  <div className="text-xs text-stone-500">যাচাইয়ের অপেক্ষায় থাকা বিজ্ঞাপন</div>
                  <div className="text-2xl font-bold text-amber-700 font-mono-tabular mt-1">
                    {toBengaliNumber(dashboardStats.pendingListings)}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    মডারেশন অনুমোদনের অপেক্ষায়
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200">
                  <div className="text-xs text-stone-500">সক্রিয় বিজ্ঞাপন</div>
                  <div className="text-2xl font-bold text-[#14532D] font-mono-tabular mt-1">
                    {toBengaliNumber(dashboardStats.activeListings)}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    মার্কেটপ্লেসে প্রকাশিত বিজ্ঞাপন
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200">
                  <div className="text-xs text-stone-500">উত্তরহীন কৃষি প্রশ্ন</div>
                  <div className="text-2xl font-bold text-amber-700 font-mono-tabular mt-1">
                    {toBengaliNumber(dashboardStats.unansweredQuestions)}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    কৃষি বিশেষজ্ঞের উত্তরের অপেক্ষায়
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200">
                  <div className="text-xs text-stone-500">নতুন অভিযোগ</div>
                  <div className="text-2xl font-bold text-red-700 font-mono-tabular mt-1">
                    {toBengaliNumber(dashboardStats.openReports)}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    বিবেচনাধীন রিপোর্ট ও অভিযোগ
                  </div>
                </div>
              </section>

              {/* 3.2 Quick Actions (6 Required Actions) */}
              <section className="bg-white rounded-2xl p-6 border border-stone-200">
                <h2 className="text-base font-bold text-[#14532D] pb-3 border-b border-stone-100">
                  দ্রুত কার্যক্রম (Quick Actions)
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModule('locations');
                      openAddLocationModal('add-upazila');
                    }}
                    className="p-3.5 rounded-xl bg-[#F5F8F1] hover:bg-[#DCFCE7] border border-stone-200 text-left transition-colors cursor-pointer"
                  >
                    <MapPin className="w-5 h-5 text-[#166534] mb-1.5" />
                    <div className="text-xs font-bold text-[#14532D]">নতুন অবস্থান যোগ করুন</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModule('market-prices')}
                    className="p-3.5 rounded-xl bg-[#F5F8F1] hover:bg-[#DCFCE7] border border-stone-200 text-left transition-colors cursor-pointer"
                  >
                    <TrendingUp className="w-5 h-5 text-[#166534] mb-1.5" />
                    <div className="text-xs font-bold text-[#14532D]">নতুন বাজারদর যোগ করুন</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModule('crops')}
                    className="p-3.5 rounded-xl bg-[#F5F8F1] hover:bg-[#DCFCE7] border border-stone-200 text-left transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-5 h-5 text-[#166534] mb-1.5" />
                    <div className="text-xs font-bold text-[#14532D]">নতুন ফসল যোগ করুন</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModule('diseases')}
                    className="p-3.5 rounded-xl bg-[#F5F8F1] hover:bg-[#DCFCE7] border border-stone-200 text-left transition-colors cursor-pointer"
                  >
                    <ShieldAlert className="w-5 h-5 text-[#166534] mb-1.5" />
                    <div className="text-xs font-bold text-[#14532D]">নতুন রোগের তথ্য যোগ করুন</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModule('articles')}
                    className="p-3.5 rounded-xl bg-[#F5F8F1] hover:bg-[#DCFCE7] border border-stone-200 text-left transition-colors cursor-pointer"
                  >
                    <FileText className="w-5 h-5 text-[#166534] mb-1.5" />
                    <div className="text-xs font-bold text-[#14532D]">নতুন নিবন্ধ প্রকাশ করুন</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModule('notifications')}
                    className="p-3.5 rounded-xl bg-[#F5F8F1] hover:bg-[#DCFCE7] border border-stone-200 text-left transition-colors cursor-pointer"
                  >
                    <Bell className="w-5 h-5 text-[#166534] mb-1.5" />
                    <div className="text-xs font-bold text-[#14532D]">নতুন বিজ্ঞপ্তি পাঠান</div>
                  </button>
                </div>
              </section>

              {/* 3.3 Pending Tasks & 3.4 Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 3.3 Pending Tasks */}
                <section className="lg:col-span-5 bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
                  <h2 className="text-base font-bold text-[#14532D] pb-3 border-b border-stone-100">
                    অগ্রাধিকারভিত্তিক অপেক্ষমাণ কাজ (Pending Tasks)
                  </h2>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-200 flex items-center justify-between">
                      <span>অযাচাইকৃত বাজারদর এন্ট্রি</span>
                      <button
                        type="button"
                        onClick={() => setActiveModule('market-prices')}
                        className="font-bold text-[#166534] hover:underline cursor-pointer"
                      >
                        {toBengaliNumber(dashboardStats.pendingMarketPrices)}টি যাচাই করুন →
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-200 flex items-center justify-between">
                      <span>অনুমোদনের অপেক্ষায় থাকা বিজ্ঞাপন</span>
                      <button
                        type="button"
                        onClick={() => setActiveModule('marketplace')}
                        className="font-bold text-[#166534] hover:underline cursor-pointer"
                      >
                        {toBengaliNumber(dashboardStats.pendingListings)}টি পর্যালোচনা করুন →
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-200 flex items-center justify-between">
                      <span>উত্তরহীন কৃষি প্রশ্ন</span>
                      <button
                        type="button"
                        onClick={() => setActiveModule('qa')}
                        className="font-bold text-[#166534] hover:underline cursor-pointer"
                      >
                        {toBengaliNumber(dashboardStats.unansweredQuestions)}টি উত্তর দিন →
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-200 flex items-center justify-between">
                      <span>সমাধানহীন অভিযোগ ও রিপোর্ট</span>
                      <button
                        type="button"
                        onClick={() => setActiveModule('reports')}
                        className="font-bold text-red-700 hover:underline cursor-pointer"
                      >
                        {toBengaliNumber(dashboardStats.openReports)}টি নিষ্পত্তি করুন →
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-200 flex items-center justify-between">
                      <span>নিষ্ক্রিয় বা অসম্পূর্ণ অবস্থান তথ্য</span>
                      <button
                        type="button"
                        onClick={() => setActiveModule('locations')}
                        className="font-bold text-[#166534] hover:underline cursor-pointer"
                      >
                        {toBengaliNumber(locationSummary.incompleteUpazilas)}টি দেখুন →
                      </button>
                    </div>
                  </div>
                </section>

                {/* 3.4 Recent Activity */}
                <section className="lg:col-span-7 bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <h2 className="text-base font-bold text-[#14532D]">
                      সাম্প্রতিক প্রশাসনিক কার্যক্রম (Recent Activity)
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveModule('audit-logs')}
                      className="text-xs font-bold text-[#166534] hover:underline cursor-pointer"
                    >
                      সব লগ দেখুন →
                    </button>
                  </div>

                  <div className="divide-y divide-stone-100 max-h-80 overflow-y-auto">
                    {auditLogs.slice(0, 6).map((log) => (
                      <div key={log.id} className="py-3 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#14532D]">
                            {log.actionBn} · <span className="text-[#166534]">{log.resourceTypeBn}</span>
                          </span>
                          <span className="text-stone-500">{log.timestampBn}</span>
                        </div>
                        <div className="text-stone-600">
                          পরিবর্তন: {log.previousValueBn || '—'} →{' '}
                          <strong className="text-[#173B2A]">{log.newValueBn || '—'}</strong>
                        </div>
                        <div className="text-[11px] text-stone-500">
                          অ্যাডমিন: {log.adminNameBn} ({log.adminRole}) · কারণ: {log.reasonBn}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* =================================================================
              MODULE 2: অবস্থান ব্যবস্থাপনা — Location Management (Section 4)
             ================================================================= */}
          {activeModule === 'locations' && (
            <div className="space-y-6">
              {/* 4.3.1 Top Summary Cards */}
              <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-stone-200">
                  <div className="text-xs text-stone-500">মোট বিভাগ</div>
                  <div className="text-2xl font-bold text-[#14532D] font-mono-tabular mt-1">
                    {toBengaliNumber(locationSummary.totalDivisions)}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-stone-200">
                  <div className="text-xs text-stone-500">মোট জেলা</div>
                  <div className="text-2xl font-bold text-[#14532D] font-mono-tabular mt-1">
                    {toBengaliNumber(locationSummary.totalDistricts)}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-stone-200">
                  <div className="text-xs text-stone-500">মোট উপজেলা</div>
                  <div className="text-2xl font-bold text-[#166534] font-mono-tabular mt-1">
                    {toBengaliNumber(locationSummary.totalUpazilas)}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-stone-200">
                  <div className="text-xs text-stone-500">সক্রিয় অবস্থানের সংখ্যা</div>
                  <div className="text-2xl font-bold text-[#166534] font-mono-tabular mt-1">
                    {toBengaliNumber(locationSummary.activeTotal)}
                  </div>
                </div>
              </section>

              {/* 4.3.2 & 4.3.3 Search, Filter & Action Buttons */}
              <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200">
                  <div>
                    <h2 className="text-base font-bold text-[#14532D]">
                      বাংলাদেশের প্রশাসনিক কাঠামো (বিভাগ → জেলা → উপজেলা)
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      ব্যবহারকারীর ডেটা যুক্ত থাকলে অবস্থান স্থায়ীভাবে মুছে না ফেলে নিষ্ক্রিয় (Deactivate) করুন
                    </p>
                  </div>

                  {/* 4.3.3 Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openAddLocationModal('add-division')}
                      className="px-3 py-2 rounded-xl bg-[#F5F8F1] hover:bg-[#DCFCE7] text-[#14532D] border border-stone-200 text-xs font-bold cursor-pointer"
                    >
                      + বিভাগ যোগ করুন
                    </button>
                    <button
                      type="button"
                      onClick={() => openAddLocationModal('add-district')}
                      className="px-3 py-2 rounded-xl bg-[#F5F8F1] hover:bg-[#DCFCE7] text-[#14532D] border border-stone-200 text-xs font-bold cursor-pointer"
                    >
                      + জেলা যোগ করুন
                    </button>
                    <button
                      type="button"
                      onClick={() => openAddLocationModal('add-upazila')}
                      className="px-3.5 py-2 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-xs font-bold cursor-pointer"
                    >
                      + উপজেলা যোগ করুন
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocModalMode('csv-import')}
                      className="px-3 py-2 rounded-xl bg-[#F5F8F1] hover:bg-stone-200 text-[#173B2A] border border-stone-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>CSV Import</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportLocationsCSV}
                      className="px-3 py-2 rounded-xl bg-[#F5F8F1] hover:bg-stone-200 text-[#173B2A] border border-stone-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV Export</span>
                    </button>
                  </div>
                </div>

                {/* 4.3.2 Search and Filter Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={locSearchQuery}
                      onChange={(e) => setLocSearchQuery(e.target.value)}
                      placeholder="অবস্থানের নাম লিখে খুঁজুন..."
                      aria-label="অবস্থানের নাম লিখে খুঁজুন"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs"
                    />
                  </div>

                  <div>
                    <select
                      aria-label="অবস্থানের ধরন ফিল্টার"
                      value={locTypeFilter}
                      onChange={(e) => setLocTypeFilter(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs font-semibold"
                    >
                      <option value="all">সব ধরন (বিভাগ, জেলা ও উপজেলা)</option>
                      <option value="division">শুধু বিভাগ</option>
                      <option value="district">শুধু জেলা</option>
                      <option value="upazila">শুধু উপজেলা</option>
                    </select>
                  </div>

                  <div>
                    <select
                      aria-label="বিভাগ অনুযায়ী ফিল্টার"
                      value={locDivFilter}
                      onChange={(e) => {
                        setLocDivFilter(e.target.value);
                        setLocDistFilter('');
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs font-semibold"
                    >
                      <option value="">সব বিভাগ</option>
                      {divisions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nameBn} বিভাগ
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      aria-label="জেলা অনুযায়ী ফিল্টার"
                      value={locDistFilter}
                      onChange={(e) => setLocDistFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs font-semibold"
                    >
                      <option value="">সব জেলা</option>
                      {(locDivFilter
                        ? getDistrictsByDivision(districts, locDivFilter, true)
                        : districts
                      ).map((dist) => (
                        <option key={dist.id} value={dist.id}>
                          {dist.nameBn} জেলা
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      aria-label="সক্রিয় বা নিষ্ক্রিয় ফিল্টার"
                      value={locStatusFilter}
                      onChange={(e) => setLocStatusFilter(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs font-semibold"
                    >
                      <option value="all">সব অবস্থা (সক্রিয় ও নিষ্ক্রিয়)</option>
                      <option value="active">শুধু সক্রিয়</option>
                      <option value="inactive">শুধু নিষ্ক্রিয়</option>
                    </select>
                  </div>
                </div>

                {/* 4.3.4 Location Table */}
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 text-xs">
                        <th className="py-3 pr-3">অবস্থানের নাম</th>
                        <th className="py-3 pr-3">ধরন</th>
                        <th className="py-3 pr-3">অভিভাবক অবস্থান</th>
                        <th className="py-3 pr-3">স্থানাঙ্ক (Latitude / Longitude)</th>
                        <th className="py-3 pr-3">অবস্থা</th>
                        <th className="py-3 text-right">কার্যক্রম</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {unifiedLocationRows.map((row) => (
                        <tr key={row.id} className="hover:bg-[#F5F8F1]/70">
                          <td className="py-3 pr-3">
                            <div className="font-bold text-[#14532D]">{row.nameBn}</div>
                            <div className="text-[11px] text-stone-500 font-mono-tabular">
                              কোড: {row.code} · slug: {row.slug}
                            </div>
                          </td>
                          <td className="py-3 pr-3 font-semibold text-[#173B2A]">
                            {row.typeLabelBn}
                          </td>
                          <td className="py-3 pr-3 text-stone-600">{row.parentNameBn}</td>
                          <td className="py-3 pr-3 font-mono-tabular text-xs text-stone-600">
                            {row.coordsBn}
                          </td>
                          <td className="py-3 pr-3">
                            <span
                              className={`font-bold text-xs ${
                                row.isActive ? 'text-[#166534]' : 'text-red-700'
                              }`}
                            >
                              {row.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditLocationModal(row)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#F5F8F1] hover:bg-[#DCFCE7] text-[#14532D] border border-stone-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>সম্পাদনা</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleLocationActive(row)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                                  row.isActive
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                                    : 'bg-[#DCFCE7] hover:bg-[#166534] hover:text-white text-[#14532D]'
                                }`}
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>{row.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 4.4 Location Add / Edit / CSV Modal */}
              {locModalMode && (
                <div
                  className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                  role="dialog"
                  aria-modal="true"
                >
                  <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90dvh] overflow-y-auto p-4 sm:p-6 border border-stone-200 shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                      <h3 className="text-base font-bold text-[#14532D]">
                        {locModalMode === 'add-division' && 'নতুন বিভাগ যোগ করুন'}
                        {locModalMode === 'add-district' && 'নতুন জেলা যোগ করুন'}
                        {locModalMode === 'add-upazila' && 'নতুন উপজেলা যোগ করুন'}
                        {locModalMode === 'edit-item' && 'অবস্থানের তথ্য সম্পাদনা করুন'}
                        {locModalMode === 'csv-import' && 'CSV ফরম্যাটে অবস্থান Import করুন'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setLocModalMode(null)}
                        className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {locModalMode === 'csv-import' ? (
                      <form onSubmit={handleImportCSVSubmit} className="space-y-3">
                        <p className="text-xs text-stone-600">
                          প্রতি লাইনে কমা দিয়ে লিখুন: <code>উপজেলার নাম,divisionId,districtId,latitude,longitude</code>
                        </p>
                        <textarea
                          rows={4}
                          value={csvImportText}
                          onChange={(e) => setCsvImportText(e.target.value)}
                          placeholder="কাপাসিয়া,div-dhaka,dist-gazipur,24.1031,90.5692"
                          className="w-full p-3 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs font-mono-tabular"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setLocModalMode(null)}
                            className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold"
                          >
                            বাতিল
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-xl bg-[#166534] text-white text-xs font-bold cursor-pointer"
                          >
                            Import সম্পন্ন করুন
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleSaveLocationModal} className="space-y-3.5">
                        {(locModalMode === 'add-district' ||
                          locModalMode === 'add-upazila' ||
                          (locModalMode === 'edit-item' && editingLocItem?.kind !== 'division')) && (
                          <div>
                            <label
                              htmlFor="loc-modal-div"
                              className="block text-xs font-semibold text-[#173B2A] mb-1"
                            >
                              বিভাগ নির্বাচন *
                            </label>
                            <select
                              id="loc-modal-div"
                              value={formDivId}
                              onChange={(e) => {
                                const newDiv = e.target.value;
                                setFormDivId(newDiv);
                                const dList = getDistrictsByDivision(districts, newDiv, true);
                                setFormDistId(dList[0]?.id || '');
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs font-semibold"
                            >
                              {divisions.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.nameBn} বিভাগ
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {(locModalMode === 'add-upazila' ||
                          (locModalMode === 'edit-item' && editingLocItem?.kind === 'upazila')) && (
                          <div>
                            <label
                              htmlFor="loc-modal-dist"
                              className="block text-xs font-semibold text-[#173B2A] mb-1"
                            >
                              জেলা নির্বাচন *
                            </label>
                            <select
                              id="loc-modal-dist"
                              value={formDistId}
                              onChange={(e) => setFormDistId(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs font-semibold"
                            >
                              {getDistrictsByDivision(districts, formDivId, true).map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.nameBn} জেলা
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <label
                            htmlFor="loc-modal-name"
                            className="block text-xs font-semibold text-[#173B2A] mb-1"
                          >
                            অবস্থানের নাম (বাংলা) *
                          </label>
                          <input
                            id="loc-modal-name"
                            type="text"
                            value={formNameBn}
                            onChange={(e) => setFormNameBn(e.target.value)}
                            placeholder="যেমন: কালীগঞ্জ অথবা গাজীপুর"
                            className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor="loc-modal-slug"
                              className="block text-xs font-semibold text-[#173B2A] mb-1"
                            >
                              Slug (ইংরেজি সংক্ষিপ্ত নাম)
                            </label>
                            <input
                              id="loc-modal-slug"
                              type="text"
                              value={formSlug}
                              onChange={(e) => setFormSlug(e.target.value)}
                              placeholder="kaliganj"
                              className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs font-mono-tabular"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="loc-modal-code"
                              className="block text-xs font-semibold text-[#173B2A] mb-1"
                            >
                              প্রশাসনিক কোড
                            </label>
                            <input
                              id="loc-modal-code"
                              type="text"
                              value={formCode}
                              onChange={(e) => setFormCode(e.target.value)}
                              placeholder="303342"
                              className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs font-mono-tabular"
                            />
                          </div>
                        </div>

                        {(locModalMode === 'add-upazila' ||
                          (locModalMode === 'edit-item' && editingLocItem?.kind === 'upazila')) && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label
                                htmlFor="loc-modal-lat"
                                className="block text-xs font-semibold text-[#173B2A] mb-1"
                              >
                                Latitude (অক্ষাংশ)
                              </label>
                              <input
                                id="loc-modal-lat"
                                type="number"
                                step="0.0001"
                                value={formLat}
                                onChange={(e) => setFormLat(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs font-mono-tabular"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="loc-modal-lon"
                                className="block text-xs font-semibold text-[#173B2A] mb-1"
                              >
                                Longitude (দ্রাঘিমাংশ)
                              </label>
                              <input
                                id="loc-modal-lon"
                                type="number"
                                step="0.0001"
                                value={formLon}
                                onChange={(e) => setFormLon(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs font-mono-tabular"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            id="loc-modal-active"
                            type="checkbox"
                            checked={formIsActive}
                            onChange={(e) => setFormIsActive(e.target.checked)}
                            className="w-4 h-4 accent-[#166534]"
                          />
                          <label htmlFor="loc-modal-active" className="text-xs font-semibold">
                            অবস্থানটি সক্রিয় (Active) হিসেবে রাখুন
                          </label>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                          <button
                            type="button"
                            onClick={() => setLocModalMode(null)}
                            className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold"
                          >
                            বাতিল
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-xs font-bold cursor-pointer"
                          >
                            সংরক্ষণ করুন
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              MODULE 3: ব্যবহারকারী ব্যবস্থাপনা (Section 9.1)
             ================================================================= */}
          {activeModule === 'users' && (
            <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div>
                  <h2 className="text-base font-bold text-[#14532D]">
                    নিবন্ধিত কৃষক, ক্রেতা, বিশেষজ্ঞ ও প্রশাসনিক ব্যবহারকারী ({toBengaliNumber(users.length)})
                  </h2>
                  <p className="text-xs text-stone-500">
                    ব্যবহারকারীর ভূমিকা পরিবর্তন, সতর্কবার্তা প্রদান ও অ্যাকাউন্ট স্ট্যাটাস নিয়ন্ত্রণ
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 text-xs">
                      <th className="py-3 pr-3">নাম ও যোগাযোগ</th>
                      <th className="py-3 pr-3">ভূমিকা</th>
                      <th className="py-3 pr-3">অবস্থান (বিভাগ → জেলা → উপজেলা)</th>
                      <th className="py-3 pr-3">অবস্থা</th>
                      <th className="py-3 text-right">প্রশাসনিক পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {users.map((u) => {
                      const div = divisions.find((d) => d.id === u.divisionId);
                      const dist = districts.find((d) => d.id === u.districtId);
                      const upz = upazilas.find((up) => up.id === u.upazilaId);
                      return (
                        <tr key={u.id} className="hover:bg-[#F5F8F1]/60">
                          <td className="py-3 pr-3">
                            <div className="font-bold text-[#14532D]">{u.nameBn}</div>
                            <div className="text-[11px] text-stone-500">
                              {u.phoneBn} · {u.email}
                            </div>
                          </td>
                          <td className="py-3 pr-3 font-semibold text-[#166534]">
                            {u.roleBn}
                            {u.adminRole ? ` (${u.adminRole})` : ''}
                          </td>
                          <td className="py-3 pr-3 text-xs text-stone-600">
                            {div?.nameBn || '—'} → {dist?.nameBn || '—'} → {upz?.nameBn || '—'}
                          </td>
                          <td className="py-3 pr-3">
                            <span
                              className={`font-bold text-xs ${
                                u.status === 'সক্রিয়'
                                  ? 'text-[#166534]'
                                  : u.status === 'সীমিত'
                                  ? 'text-amber-700'
                                  : 'text-red-700'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <select
                                aria-label={`${u.nameBn} এর অবস্থা পরিবর্তন`}
                                value={u.status}
                                onChange={(e) =>
                                  onUpdateUser(
                                    u.id,
                                    { status: e.target.value as PlatformUser['status'] },
                                    'অ্যাডমিন প্যানেল থেকে ব্যবহারকারীর স্ট্যাটাস হালনাগাদ'
                                  )
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-[#F5F8F1] border border-stone-300 text-xs font-semibold"
                              >
                                <option value="সক্রিয়">সক্রিয়</option>
                                <option value="সীমিত">সীমিত</option>
                                <option value="স্থগিত">স্থগিত</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* =================================================================
              MODULE 4: বাজারদর ব্যবস্থাপনা (Section 7)
             ================================================================= */}
          {activeModule === 'market-prices' && (
            <div className="space-y-6">
              {/* 7.1 Add / Submit Market Price with Cascading Location & Workflow */}
              <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
                <h2 className="text-base font-bold text-[#14532D] pb-3 border-b border-stone-200">
                  নতুন বাজারদর যোগ ও যাচাই করুন (Workflow: Draft → Pending Review → Approved → Published)
                </h2>

                <form onSubmit={handleCreateAdminMarketPrice} className="space-y-4">
                  <CascadingLocationSelector
                    divisions={divisions}
                    districts={districts}
                    upazilas={upazilas}
                    selectedDivisionId={mpDivId}
                    selectedDistrictId={mpDistId}
                    selectedUpazilaId={mpUpzId}
                    onChange={(sel) => {
                      setMpDivId(sel.divisionId);
                      setMpDistId(sel.districtId);
                      setMpUpzId(sel.upazilaId);
                    }}
                    showSearch={false}
                    idPrefix="admin-mp-loc"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div>
                      <label htmlFor="mp-crop-name" className="block text-xs font-semibold mb-1">
                        ফসল বা পণ্যের নাম *
                      </label>
                      <input
                        id="mp-crop-name"
                        type="text"
                        value={mpCropName}
                        onChange={(e) => setMpCropName(e.target.value)}
                        placeholder="যেমন: ব্রি ধান-২৮ বা দেশি পেঁয়াজ"
                        className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="mp-market-name" className="block text-xs font-semibold mb-1">
                        বাজার বা হাটের নাম *
                      </label>
                      <input
                        id="mp-market-name"
                        type="text"
                        value={mpMarketName}
                        onChange={(e) => setMpMarketName(e.target.value)}
                        placeholder="যেমন: কালীগঞ্জ বাজার / মহাস্থান হাট"
                        className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="mp-category" className="block text-xs font-semibold mb-1">
                        ফসলের বিভাগ
                      </label>
                      <select
                        id="mp-category"
                        value={mpCategory}
                        onChange={(e) => setMpCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs sm:text-sm font-semibold"
                      >
                        <option value="ধান ও শস্য">ধান ও শস্য</option>
                        <option value="সবজি">সবজি</option>
                        <option value="মসলা ও তেলবীজ">মসলা ও তেলবীজ</option>
                        <option value="ফল ও অর্থকরী">ফল ও অর্থকরী</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="mp-unit" className="block text-xs font-semibold mb-1">
                        পরিমাপের একক *
                      </label>
                      <input
                        id="mp-unit"
                        type="text"
                        value={mpUnit}
                        onChange={(e) => setMpUnit(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="mp-wholesale" className="block text-xs font-semibold mb-1">
                        পাইকারি দাম (টাকা) *
                      </label>
                      <input
                        id="mp-wholesale"
                        type="number"
                        min={1}
                        value={mpWholesale}
                        onChange={(e) => setMpWholesale(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs sm:text-sm font-mono-tabular"
                      />
                    </div>

                    <div>
                      <label htmlFor="mp-retail" className="block text-xs font-semibold mb-1">
                        খুচরা দাম (টাকা) *
                      </label>
                      <input
                        id="mp-retail"
                        type="number"
                        min={1}
                        value={mpRetail}
                        onChange={(e) => setMpRetail(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs sm:text-sm font-mono-tabular"
                      />
                    </div>

                    <div>
                      <label htmlFor="mp-source" className="block text-xs font-semibold mb-1">
                        তথ্যের উৎস *
                      </label>
                      <input
                        id="mp-source"
                        type="text"
                        value={mpSource}
                        onChange={(e) => setMpSource(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="mp-workflow" className="block text-xs font-semibold mb-1">
                        যাচাইয়ের অবস্থা (Workflow)
                      </label>
                      <select
                        id="mp-workflow"
                        value={mpWorkflowStatus}
                        onChange={(e) =>
                          setMpWorkflowStatus(e.target.value as MarketPriceWorkflowStatus)
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs sm:text-sm font-semibold"
                      >
                        <option value="Draft">Draft (খসড়া)</option>
                        <option value="Pending Review">Pending Review (যাচাইয়ের অপেক্ষায়)</option>
                        <option value="Approved">Approved (অনুমোদিত)</option>
                        <option value="Published">Published (প্রকাশিত)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-xs sm:text-sm font-bold cursor-pointer"
                    >
                      বাজারদর এন্ট্রি সংরক্ষণ করুন
                    </button>
                  </div>
                </form>
              </section>

              {/* 7.2 Market Price Workflow Table */}
              <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200">
                  <h2 className="text-base font-bold text-[#14532D]">
                    বাজারদর তালিকা ও প্রকাশনা নিয়ন্ত্রণ ({toBengaliNumber(marketPrices.length)}টি)
                  </h2>
                  <select
                    aria-label="ওয়ার্কফ্লো অবস্থা ফিল্টার"
                    value={mpFilterStatus}
                    onChange={(e) => setMpFilterStatus(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs font-semibold"
                  >
                    <option value="ALL">সব অবস্থা</option>
                    <option value="Published">Published (প্রকাশিত)</option>
                    <option value="Pending Review">Pending Review (যাচাইয়ের অপেক্ষায়)</option>
                    <option value="Approved">Approved (অনুমোদিত)</option>
                    <option value="Draft">Draft (খসড়া)</option>
                    <option value="Rejected">Rejected (বাতিল)</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 text-xs">
                        <th className="py-3 pr-3">ফসল ও বাজার</th>
                        <th className="py-3 pr-3">অবস্থান</th>
                        <th className="py-3 pr-3 text-right">পাইকারি / খুচরা</th>
                        <th className="py-3 pr-3">যাচাইয়ের অবস্থা</th>
                        <th className="py-3 text-right">ওয়ার্কফ্লো পদক্ষেপ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {marketPrices
                        .filter(
                          (m) =>
                            mpFilterStatus === 'ALL' ||
                            (m.workflowStatus || 'Published') === mpFilterStatus
                        )
                        .map((item) => {
                          const wf = item.workflowStatus || (item.verified ? 'Published' : 'Pending Review');
                          return (
                            <tr key={item.id} className="hover:bg-[#F5F8F1]/60">
                              <td className="py-3 pr-3">
                                <div className="font-bold text-[#14532D]">{item.cropNameBn}</div>
                                <div className="text-xs text-stone-500">
                                  {item.marketNameBn} · {item.unitBn}
                                </div>
                              </td>
                              <td className="py-3 pr-3 text-xs text-stone-600">
                                {item.divisionBn ? `${item.divisionBn} → ` : ''}
                                {item.districtBn} → {item.upazilaBn}
                              </td>
                              <td className="py-3 pr-3 text-right font-mono-tabular">
                                <span className="font-bold text-[#166534]">
                                  ৳{toBengaliNumber(item.wholesalePrice)}
                                </span>{' '}
                                / ৳{toBengaliNumber(item.retailPrice)}
                              </td>
                              <td className="py-3 pr-3">
                                <span
                                  className={`font-bold text-xs ${
                                    wf === 'Published'
                                      ? 'text-[#166534]'
                                      : wf === 'Rejected'
                                      ? 'text-red-700'
                                      : 'text-amber-700'
                                  }`}
                                >
                                  {wf}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <select
                                  aria-label={`${item.cropNameBn} এর ওয়ার্কফ্লো পরিবর্তন`}
                                  value={wf}
                                  onChange={(e) =>
                                    onUpdateMarketPriceWorkflow(
                                      item.id,
                                      e.target.value as MarketPriceWorkflowStatus,
                                      'অ্যাডমিন বাজারদর যাচাই ও প্রকাশনা'
                                    )
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-[#F5F8F1] border border-stone-300 text-xs font-semibold"
                                >
                                  <option value="Draft">Draft</option>
                                  <option value="Pending Review">Pending Review</option>
                                  <option value="Approved">Approved</option>
                                  <option value="Published">Published</option>
                                  <option value="Rejected">Rejected</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* =================================================================
              MODULE 5: ফসল ও চাষাবাদ (Section 9.2)
             ================================================================= */}
          {activeModule === 'crops' && (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
                <h2 className="text-base font-bold text-[#14532D] pb-3 border-b border-stone-200">
                  নতুন ফসল ও চাষাবাদ নির্দেশিকা যোগ করুন
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newCropName.trim()) {
                      showToast('error', 'ফসলের নাম লিখুন।');
                      return;
                    }
                    const created: CropGuideItem = {
                      id: `crop-${Date.now()}`,
                      slug: `crop-${Date.now()}`,
                      nameBn: newCropName.trim(),
                      scientificName: newCropScientific.trim() || 'Oryza sativa',
                      categoryBn: 'দানা শস্য',
                      seasonBn: newCropSeason,
                      soilBn: newCropSoil,
                      climateBn: 'উষ্ণ ও আর্দ্র আবহাওয়া',
                      durationBn: '১১০–১৩০ দিন',
                      sowingTimeBn: 'অগ্রহায়ণ – পৌষ',
                      harvestTimeBn: 'চৈত্র – বৈশাখ',
                      estimatedYieldBn: newCropYield,
                      estimatedCostPerBighaBn: '৳ ১২,০০০ – ১৫,০০০',
                      marketDemandBn: 'সারা বছর উচ্চ চাহিদা',
                      referenceSourceBn: 'বাংলাদেশ কৃষি গবেষণা ইনস্টিটিউট (BARI)',
                      visualType: 'paddy',
                      steps: crops[0].steps,
                    };
                    onAddCrop(created);
                    onRecordAuditLog({
                      adminId: 'usr-admin-1',
                      adminNameBn: 'ড. মাহবুবুর রহমান',
                      adminRole: currentAdminRole,
                      actionBn: 'নতুন ফসল নির্দেশিকা সংযোজন',
                      resourceTypeBn: 'ফসল ও নিবন্ধ',
                      resourceId: created.id,
                      previousValueBn: '—',
                      newValueBn: created.nameBn,
                      reasonBn: 'কৃষকদের জন্য নতুন চাষাবাদ নির্দেশিকা প্রকাশ',
                    });
                    setNewCropName('');
                    setNewCropScientific('');
                    showToast('success', `"${created.nameBn}" ফসল নির্দেশিকা যুক্ত হয়েছে।`);
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
                >
                  <input
                    type="text"
                    value={newCropName}
                    onChange={(e) => setNewCropName(e.target.value)}
                    placeholder="ফসলের নাম (যেমন: বারি ছোলা-১১)"
                    className="px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs sm:text-sm"
                  />
                  <input
                    type="text"
                    value={newCropScientific}
                    onChange={(e) => setNewCropScientific(e.target.value)}
                    placeholder="বৈজ্ঞানিক নাম"
                    className="px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs sm:text-sm"
                  />
                  <input
                    type="text"
                    value={newCropSeason}
                    onChange={(e) => setNewCropSeason(e.target.value)}
                    placeholder="মৌসুম"
                    className="px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs sm:text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#166534] text-white text-xs sm:text-sm font-bold cursor-pointer"
                  >
                    + ফসল যোগ করুন
                  </button>
                </form>
              </section>

              <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-3">
                <h3 className="text-base font-bold text-[#14532D]">
                  প্রকাশিত ফসল ও চাষাবাদ নির্দেশিকা ({toBengaliNumber(crops.length)}টি)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {crops.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-sm text-[#14532D]">{c.nameBn}</div>
                        <div className="text-xs text-stone-500">
                          {c.categoryBn} · মৌসুম: {c.seasonBn} · ফলন: {c.estimatedYieldBn}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#166534]">প্রকাশিত</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* =================================================================
              MODULE 6: রোগ ও প্রতিকার (Section 9.3)
             ================================================================= */}
          {activeModule === 'diseases' && (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
                <h2 className="text-base font-bold text-[#14532D] pb-3 border-b border-stone-200">
                  নতুন ফসলের রোগ ও প্রতিকার তথ্য যোগ করুন
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newDisName.trim()) {
                      showToast('error', 'রোগের নাম লিখুন।');
                      return;
                    }
                    const created: CropDiseaseItem = {
                      id: `dis-${Date.now()}`,
                      slug: `dis-${Date.now()}`,
                      nameBn: newDisName.trim(),
                      categoryBn: 'ধানের রোগ',
                      affectedCropBn: newDisCrop,
                      symptomsBn: [newDisSymptom.trim() || 'পাতায় বাদামি দাগ ও ঝলসানো লক্ষণ'],
                      causeBn: 'ছত্রাকজনিত সংক্রমণ',
                      spreadConditionBn: 'অতিরিক্ত আর্দ্রতা ও মেঘলা আবহাওয়া',
                      preventionBn: [
                        newDisPrevention.trim() || 'রোগমুক্ত প্রত্যয়িত বীজ ব্যবহার ও সুষম সার প্রয়োগ',
                      ],
                      careAndManagementBn: ['আক্রান্ত জমি থেকে পানি নিষ্কাশন ও কৃষি কর্মকর্তার পরামর্শ গ্রহণ'],
                      expertAdviceBn: 'লক্ষণ দেখা মাত্র স্থানীয় উপ-সহকারী কৃষি কর্মকর্তার পরামর্শ নিন।',
                      referenceSourceBn: 'ব্রি ও বারি উদ্ভিদ রোগতত্ত্ব বিভাগ',
                      severity: 'মাঝারি ঝুঁকি',
                    };
                    onAddDisease(created);
                    setNewDisName('');
                    setNewDisSymptom('');
                    setNewDisPrevention('');
                    showToast('success', `"${created.nameBn}" রোগের তথ্য সংরক্ষিত হয়েছে।`);
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
                >
                  <input
                    type="text"
                    value={newDisName}
                    onChange={(e) => setNewDisName(e.target.value)}
                    placeholder="রোগের নাম (যেমন: ধানের খোলপোড়া রোগ)"
                    className="px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs sm:text-sm"
                  />
                  <input
                    type="text"
                    value={newDisCrop}
                    onChange={(e) => setNewDisCrop(e.target.value)}
                    placeholder="আক্রান্ত ফসল"
                    className="px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs sm:text-sm"
                  />
                  <input
                    type="text"
                    value={newDisSymptom}
                    onChange={(e) => setNewDisSymptom(e.target.value)}
                    placeholder="প্রধান লক্ষণ"
                    className="px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs sm:text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#166534] text-white text-xs sm:text-sm font-bold cursor-pointer"
                  >
                    + রোগের তথ্য সংরক্ষণ করুন
                  </button>
                </form>
              </section>

              <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-3">
                <h3 className="text-base font-bold text-[#14532D]">
                  তালিকাভুক্ত ফসলের রোগ ও প্রতিকার ({toBengaliNumber(diseases.length)}টি)
                </h3>
                <div className="space-y-2.5">
                  {diseases.map((d) => (
                    <div
                      key={d.id}
                      className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-sm text-[#14532D]">{d.nameBn}</div>
                        <div className="text-xs text-stone-600">
                          ফসল: {d.affectedCropBn} · ঝুঁকি: {d.severity}
                        </div>
                      </div>
                      <span className="text-xs text-[#166534] font-semibold">যাচাইকৃত</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* =================================================================
              MODULE 7: কৃষি ক্যালেন্ডার (Section 9.4)
             ================================================================= */}
          {activeModule === 'calendar' && (
            <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
              <h2 className="text-base font-bold text-[#14532D] pb-3 border-b border-stone-200">
                বাংলা ১২ মাসের কৃষি ক্যালেন্ডার ও মৌসুমি কাজের তালিকা ({toBengaliNumber(calendarMonths.length)} মাস)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {calendarMonths.map((m) => (
                  <div key={m.id} className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-[#14532D]">{m.monthNameBn}</span>
                      <span className="text-xs text-[#166534] font-semibold">{m.seasonBn}</span>
                    </div>
                    <div className="text-xs text-stone-500">{m.gregorianSpanBn}</div>
                    <div className="text-xs text-[#173B2A] pt-1">
                      <strong>প্রধান ফসল:</strong> {m.keyCropsBn.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* =================================================================
              MODULE 8: আবহাওয়া ও সতর্কতা (Section 6)
             ================================================================= */}
          {activeModule === 'weather-alerts' && (
            <div className="space-y-6">
              {/* 6.3 Admin Weather Settings & Upazila Coordinates Verification */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-stone-200">
                  <div className="text-xs text-stone-500">Weather API Status</div>
                  <div className="text-lg font-bold text-[#166534] mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>সক্রিয় (Open-Meteo Live)</span>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-stone-200">
                  <div className="text-xs text-stone-500">সর্বশেষ সফল API Request</div>
                  <div className="text-sm font-bold text-[#14532D] mt-1">
                    আজ · {currentUpzObj?.nameBn || 'কালীগঞ্জ'} উপজেলা
                  </div>
                  <div className="text-[11px] text-stone-500 font-mono-tabular">
                    স্থানাঙ্ক: {toBengaliNumber(currentUpzObj?.latitude ?? 23.9889, 4)}° উ,{' '}
                    {toBengaliNumber(currentUpzObj?.longitude ?? 90.5694, 4)}° পূ
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-stone-200">
                  <div className="text-xs text-stone-500">Cache Status</div>
                  <div className="text-sm font-bold text-[#14532D] mt-1">
                    TTL: {toBengaliNumber(weatherCacheMinutes)} মিনিট (সক্রিয়)
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-stone-200">
                  <div className="text-xs text-stone-500">API Error Logs</div>
                  <div className="text-sm font-bold text-[#166534] mt-1">
                    ০টি ত্রুটি (Fallback সক্রিয়)
                  </div>
                </div>
              </section>

              {/* Upazila Weather Coordinate Tester */}
              <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200">
                  <div>
                    <h2 className="text-base font-bold text-[#14532D]">
                      উপজেলাভিত্তিক আবহাওয়া স্থানাঙ্ক যাচাই (Upazila Lat/Lon Weather Test)
                    </h2>
                    <p className="text-xs text-stone-500">
                      বিভাগ → জেলা → উপজেলা নির্বাচন করলে সেই উপজেলার নির্দিষ্ট স্থানাঙ্ক থেকে আবহাওয়া আনা হবে
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onRefreshWeather(
                        currentUpzObj
                          ? { lat: currentUpzObj.latitude, lon: currentUpzObj.longitude }
                          : undefined
                      )
                    }
                    className="px-4 py-2 rounded-xl bg-[#166534] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>এই উপজেলার আবহাওয়া রিফ্রেশ করুন</span>
                  </button>
                </div>

                <CascadingLocationSelector
                  divisions={divisions}
                  districts={districts}
                  upazilas={upazilas}
                  selectedDivisionId={selectedDivisionId}
                  selectedDistrictId={selectedDistrictId}
                  selectedUpazilaId={selectedUpazilaId}
                  onChange={(sel) => {
                    onSelectLocation({
                      divisionId: sel.divisionId,
                      districtId: sel.districtId,
                      upazilaId: sel.upazilaId,
                    });
                    if (sel.upazila) {
                      onRefreshWeather({
                        lat: sel.upazila.latitude,
                        lon: sel.upazila.longitude,
                      });
                    }
                  }}
                  idPrefix="admin-weather-loc"
                />

                {currentUpzObj && (
                  <div className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="font-bold text-[#14532D]">
                        নির্বাচিত উপজেলা: {currentUpzObj.nameBn}
                      </span>{' '}
                      · Latitude: {toBengaliNumber(currentUpzObj.latitude, 4)} · Longitude:{' '}
                      {toBengaliNumber(currentUpzObj.longitude, 4)}
                    </div>
                    <div className="font-bold text-[#166534]">
                      বর্তমান তাপমাত্রা: {toBengaliNumber(weatherData?.current?.tempC ?? 29)}°সে ·{' '}
                      {weatherData?.current?.conditionBn || 'আংশিক মেঘলা'}
                    </div>
                  </div>
                )}
              </section>

              {/* Weather Alert Broadcast */}
              <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
                <h2 className="text-base font-bold text-[#14532D] pb-3 border-b border-stone-200">
                  কৃষি আবহাওয়া সতর্কতা প্রকাশ করুন (Weather Alert Management)
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onSendNotification({
                      type: 'weather',
                      titleBn: weatherAlertTitle,
                      messageBn: weatherAlertBody,
                    });
                    showToast('success', 'আবহাওয়া সতর্কবার্তা সব কৃষকের নোটিফিকেশনে পাঠানো হয়েছে।');
                  }}
                  className="space-y-3"
                >
                  <input
                    type="text"
                    value={weatherAlertTitle}
                    onChange={(e) => setWeatherAlertTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-semibold"
                  />
                  <textarea
                    rows={3}
                    value={weatherAlertBody}
                    onChange={(e) => setWeatherAlertBody(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#166534] text-white text-xs font-bold cursor-pointer"
                  >
                    আবহাওয়া সতর্কবার্তা সম্প্রচার করুন
                  </button>
                </form>
              </section>
            </div>
          )}

          {/* =================================================================
              MODULE 9: ফসল বিক্রির বিজ্ঞাপন মডারেশন (Section 8)
             ================================================================= */}
          {activeModule === 'marketplace' && (
            <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
              <div className="pb-3 border-b border-stone-200">
                <h2 className="text-base font-bold text-[#14532D]">
                  ফসল বিক্রির বিজ্ঞাপন মডারেশন (Pending / Approved / Published / Rejected / Suspended / Sold)
                </h2>
                <p className="text-xs text-stone-500">
                  কৃষকের বিজ্ঞাপন যাচাই, অনুমোদন, স্থগিত বা বিক্রেতার তথ্য পর্যালোচনা করুন
                </p>
              </div>

              <div className="space-y-3">
                {listings.map((item) => {
                  const modStatus =
                    item.moderationStatus ||
                    (item.status === 'approved'
                      ? 'Published'
                      : item.status === 'reported'
                      ? 'Suspended'
                      : 'Pending');
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-xs text-stone-500">
                            বিক্রেতা: <strong>{item.sellerNameBn}</strong> · {item.districtBn} (
                            {item.upazilaBn}) · মোবাইল: {item.phoneBn}
                          </div>
                          <div className="text-sm font-bold text-[#14532D] mt-0.5">
                            {item.cropNameBn} — পরিমাণ: {toBengaliNumber(item.quantity)}{' '}
                            {item.unitBn} · দর: ৳{toBengaliNumber(item.pricePerUnit)} / {item.unitBn}
                          </div>
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            modStatus === 'Published' || modStatus === 'Approved'
                              ? 'text-[#166534]'
                              : modStatus === 'Rejected' || modStatus === 'Suspended'
                              ? 'text-red-700'
                              : 'text-amber-700'
                          }`}
                        >
                          অবস্থা: {modStatus}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200/70">
                        <input
                          type="text"
                          value={mktModReason[item.id] || ''}
                          onChange={(e) =>
                            setMktModReason((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          placeholder="মডারেশন নোট বা কারণ লিখুন..."
                          className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-xs"
                        />

                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onModerateListing(
                                item.id,
                                'Published',
                                mktModReason[item.id] || 'যাচাইকৃত বিজ্ঞাপন অনুমোদন ও প্রকাশ'
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-[#166534] text-white text-xs font-semibold cursor-pointer"
                          >
                            অনুমোদন (Publish)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onModerateListing(
                                item.id,
                                'Suspended',
                                mktModReason[item.id] || 'তথ্য অস্পষ্ট থাকায় সাময়িক স্থগিত'
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-semibold cursor-pointer"
                          >
                            স্থগিত (Suspend)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onModerateListing(
                                item.id,
                                'Rejected',
                                mktModReason[item.id] || 'নীতিমালা লঙ্ঘনের কারণে বাতিল'
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-red-100 text-red-800 text-xs font-semibold cursor-pointer"
                          >
                            বাতিল (Reject)
                          </button>
                          <button
                            type="button"
                            onClick={() => setInspectSellerListing(item)}
                            className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>বিক্রেতার তথ্য</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {inspectSellerListing && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                      <h3 className="font-bold text-base text-[#14532D]">বিক্রেতার বিস্তারিত তথ্য</h3>
                      <button
                        type="button"
                        onClick={() => setInspectSellerListing(null)}
                        className="text-xs text-stone-500"
                      >
                        বন্ধ করুন
                      </button>
                    </div>
                    <div className="text-xs space-y-1.5 text-[#173B2A]">
                      <div>
                        <strong>বিক্রেতার নাম:</strong> {inspectSellerListing.sellerNameBn}
                      </div>
                      <div>
                        <strong>ভূমিকা:</strong> {inspectSellerListing.sellerRoleBn}
                      </div>
                      <div>
                        <strong>মোবাইল নম্বর:</strong> {inspectSellerListing.phoneBn}
                      </div>
                      <div>
                        <strong>অবস্থান:</strong> {inspectSellerListing.districtBn} জেলা,{' '}
                        {inspectSellerListing.upazilaBn} উপজেলা
                      </div>
                      <div>
                        <strong>ফসলের বিবরণ:</strong> {inspectSellerListing.descriptionBn}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* =================================================================
              MODULE 10: কৃষি প্রশ্নোত্তর (Section 9.5)
             ================================================================= */}
          {activeModule === 'qa' && (
            <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
              <h2 className="text-base font-bold text-[#14532D] pb-3 border-b border-stone-200">
                কৃষকদের প্রশ্ন ও কৃষি বিশেষজ্ঞের উত্তর প্রদান ({toBengaliNumber(questions.length)}টি প্রশ্ন)
              </h2>
              <div className="space-y-4">
                {questions.map((q) => (
                  <div key={q.id} className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200 space-y-3">
                    <div>
                      <div className="text-xs text-stone-500">
                        {q.categoryBn} · ফসল: {q.cropBn} · {q.districtBn} ({q.upazilaBn}) · প্রশ্নকারী:{' '}
                        {q.askedByBn}
                      </div>
                      <h3 className="font-bold text-sm text-[#14532D] mt-0.5">{q.titleBn}</h3>
                      <p className="text-xs text-[#173B2A] mt-1">{q.detailsBn}</p>
                    </div>

                    {q.answers.length > 0 && (
                      <div className="space-y-2 pl-3 border-l-2 border-[#166534]">
                        {q.answers.map((a) => (
                          <div key={a.id} className="text-xs">
                            <span className="font-bold text-[#166534]">{a.expertNameBn}: </span>
                            <span>{a.answerTextBn}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={qaDraftAnswers[q.id] || ''}
                        onChange={(e) =>
                          setQaDraftAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        placeholder="বিশেষজ্ঞের পরামর্শ বা উত্তর লিখুন..."
                        className="flex-1 px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const txt = (qaDraftAnswers[q.id] || '').trim();
                          if (!txt) {
                            showToast('error', 'উত্তরের বিস্তারিত লিখুন।');
                            return;
                          }
                          await onAnswerQuestion(
                            q.id,
                            txt,
                            'ড. মাহবুবুর রহমান (প্রধান কৃষি বিশেষজ্ঞ)'
                          );
                          setQaDraftAnswers((prev) => ({ ...prev, [q.id]: '' }));
                          showToast('success', 'প্রশ্নের বিশেষজ্ঞ উত্তর প্রকাশিত হয়েছে।');
                        }}
                        className="px-4 py-2 rounded-xl bg-[#166534] text-white text-xs font-bold cursor-pointer"
                      >
                        উত্তর প্রকাশ করুন
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* =================================================================
              MODULE 11: কৃষি নিবন্ধ (Section 9.6)
             ================================================================= */}
          {activeModule === 'articles' && (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
                <h2 className="text-base font-bold text-[#14532D] pb-3 border-b border-stone-200">
                  নতুন কৃষি নিবন্ধ ও পরামর্শ প্রকাশ করুন
                </h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!artTitle.trim() || !artContent.trim()) {
                      showToast('error', 'নিবন্ধের শিরোনাম ও মূল বিষয়বস্তু পূরণ করুন।');
                      return;
                    }
                    await onAddArticle({
                      titleBn: artTitle.trim(),
                      categoryBn: artCategory,
                      summaryBn: artSummary.trim() || artContent.slice(0, 100),
                      contentBn: artContent.trim(),
                      authorBn: 'ড. মাহবুবুর রহমান, কৃষি বিশেষজ্ঞ',
                      status: artStatus,
                    });
                    setArtTitle('');
                    setArtSummary('');
                    setArtContent('');
                    showToast('success', 'নতুন কৃষি নিবন্ধ সফলভাবে সংরক্ষিত হয়েছে।');
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={artTitle}
                      onChange={(e) => setArtTitle(e.target.value)}
                      placeholder="নিবন্ধের শিরোনাম *"
                      className="sm:col-span-2 px-3.5 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm"
                    />
                    <select
                      aria-label="নিবন্ধের বিভাগ"
                      value={artCategory}
                      onChange={(e) => setArtCategory(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs font-semibold"
                    >
                      <option value="চাষাবাদ প্রযুক্তি">চাষাবাদ প্রযুক্তি</option>
                      <option value="সার ও মাটি ব্যবস্থাপনা">সার ও মাটি ব্যবস্থাপনা</option>
                      <option value="রোগ ও বালাই দমন">রোগ ও বালাই দমন</option>
                      <option value="কৃষি অর্থনীতি ও বাজার">কৃষি অর্থনীতি ও বাজার</option>
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    value={artContent}
                    onChange={(e) => setArtContent(e.target.value)}
                    placeholder="নিবন্ধের বিস্তারিত নির্দেশনা লিখুন..."
                    className="w-full p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm"
                  />
                  <div className="flex items-center justify-between">
                    <select
                      aria-label="প্রকাশনার অবস্থা"
                      value={artStatus}
                      onChange={(e) => setArtStatus(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs font-semibold"
                    >
                      <option value="প্রকাশিত">প্রকাশিত</option>
                      <option value="খসড়া">খসড়া (Draft)</option>
                    </select>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#166534] text-white text-xs font-bold cursor-pointer"
                    >
                      নিবন্ধ প্রকাশ করুন
                    </button>
                  </div>
                </form>
              </section>

              <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-3">
                <h3 className="text-base font-bold text-[#14532D]">
                  প্রকাশিত ও খসড়া নিবন্ধের তালিকা ({toBengaliNumber(articles.length)}টি)
                </h3>
                <div className="space-y-3">
                  {articles.map((art) => (
                    <div
                      key={art.id}
                      className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs text-stone-500">
                          {art.categoryBn} · লেখক: {art.authorBn} · {art.publishedAtBn}
                        </div>
                        <div className="font-bold text-sm text-[#14532D] mt-0.5">{art.titleBn}</div>
                        <p className="text-xs text-stone-600 mt-1">{art.summaryBn}</p>
                      </div>
                      <span className="text-xs font-bold text-[#166534] shrink-0">{art.status}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* =================================================================
              MODULE 12: রিপোর্ট ও অভিযোগ (Section 9.7)
             ================================================================= */}
          {activeModule === 'reports' && (
            <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
              <h2 className="text-base font-bold text-[#14532D] pb-3 border-b border-stone-200">
                ব্যবহারকারীদের রিপোর্ট ও অভিযোগ ব্যবস্থাপনা ({toBengaliNumber(reports.length)}টি)
              </h2>
              <div className="space-y-3">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs text-stone-500">
                        {rep.typeBn} · জেলা: {rep.districtBn} · রিপোর্টকারী: {rep.reportedByBn} ·{' '}
                        {rep.createdAtBn}
                      </div>
                      <div className="font-bold text-sm text-[#14532D] mt-0.5">
                        {rep.targetTitleBn}
                      </div>
                      <div className="text-xs text-[#173B2A] mt-1">অভিযোগ: {rep.reasonBn}</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-bold ${
                          rep.status === 'সমাধানকৃত' ? 'text-[#166534]' : 'text-amber-700'
                        }`}
                      >
                        {rep.status}
                      </span>
                      {rep.status === 'বিবেচনাধীন' && (
                        <button
                          type="button"
                          onClick={() => {
                            onResolveReport(
                              rep.id,
                              'সমাধানকৃত',
                              'অ্যাডমিন প্যানেল থেকে যাচাইপূর্বক সমাধান করা হয়েছে'
                            );
                            showToast('success', 'অভিযোগটি সমাধানকৃত হিসেবে চিহ্নিত হয়েছে।');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#166534] text-white text-xs font-semibold cursor-pointer"
                        >
                          সমাধান করুন
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* =================================================================
              MODULE 13: নোটিফিকেশন (Section 9.8)
             ================================================================= */}
          {activeModule === 'notifications' && (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
                <h2 className="text-base font-bold text-[#14532D] pb-3 border-b border-stone-200">
                  কৃষক ও ব্যবহারকারীদের কাছে নতুন বিজ্ঞপ্তি পাঠান
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!notifTitle.trim() || !notifMessage.trim()) {
                      showToast('error', 'বিজ্ঞপ্তির শিরোনাম ও বার্তা লিখুন।');
                      return;
                    }
                    onSendNotification({
                      type: notifType,
                      titleBn: notifTitle.trim(),
                      messageBn: notifMessage.trim(),
                    });
                    setNotifTitle('');
                    setNotifMessage('');
                    showToast('success', 'বিজ্ঞপ্তি সফলভাবে সব ব্যবহারকারীর কাছে পাঠানো হয়েছে।');
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      placeholder="বিজ্ঞপ্তির শিরোনাম *"
                      className="sm:col-span-2 px-3.5 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm"
                    />
                    <select
                      aria-label="বিজ্ঞপ্তির ধরন"
                      value={notifType}
                      onChange={(e) => setNotifType(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs font-semibold"
                    >
                      <option value="weather">আবহাওয়া সতর্কতা</option>
                      <option value="market">বাজারদর আপডেট</option>
                      <option value="calendar">মৌসুমি কৃষি কাজ</option>
                      <option value="govt">সরকারি কৃষি বার্তা</option>
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="বিজ্ঞপ্তির বিস্তারিত বার্তা লিখুন..."
                    className="w-full p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#166534] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>বিজ্ঞপ্তি পাঠান</span>
                  </button>
                </form>
              </section>
            </div>
          )}

          {/* =================================================================
              MODULE 14: ওয়েবসাইট সেটিংস (Section 9.9)
             ================================================================= */}
          {activeModule === 'settings' && (
            <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
              <h2 className="text-base font-bold text-[#14532D] pb-3 border-b border-stone-200">
                ওয়েবসাইট সেটিংস ও সিস্টেম কনফিগারেশন
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onRecordAuditLog({
                    adminId: 'usr-admin-1',
                    adminNameBn: 'ড. মাহবুবুর রহমান',
                    adminRole: currentAdminRole,
                    actionBn: 'ওয়েবসাইট সেটিংস হালনাগাদ',
                    resourceTypeBn: 'সেটিংস ও অনুমতি',
                    resourceId: 'site-settings',
                    previousValueBn: 'পূর্ববর্তী কনফিগারেশন',
                    newValueBn: `${siteNameSetting} (Cache: ${weatherCacheMinutes}m)`,
                    reasonBn: 'প্রশাসনিক কনফিগারেশন সংরক্ষণ',
                  });
                  showToast('success', 'ওয়েবসাইট সেটিংস সফলভাবে সংরক্ষিত হয়েছে।');
                }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div>
                  <label htmlFor="set-site-name" className="block text-xs font-semibold mb-1">
                    প্ল্যাটফর্মের শিরোনাম
                  </label>
                  <input
                    id="set-site-name"
                    type="text"
                    value={siteNameSetting}
                    onChange={(e) => setSiteNameSetting(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="set-helpline" className="block text-xs font-semibold mb-1">
                    জাতীয় কৃষি হেল্পলাইন নম্বর
                  </label>
                  <input
                    id="set-helpline"
                    type="text"
                    value={helplineSetting}
                    onChange={(e) => setHelplineSetting(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="set-cache" className="block text-xs font-semibold mb-1">
                    আবহাওয়া ক্যাশ মেয়াদ (মিনিট)
                  </label>
                  <input
                    id="set-cache"
                    type="number"
                    min={5}
                    max={120}
                    value={weatherCacheMinutes}
                    onChange={(e) => setWeatherCacheMinutes(Number(e.target.value) || 30)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-mono-tabular"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#166534] text-white text-xs font-bold cursor-pointer"
                  >
                    সেটিংস সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* =================================================================
              MODULE 15: অ্যাডমিন ও অনুমতি — RBAC (Section 10)
             ================================================================= */}
          {activeModule === 'roles-permissions' && (
            <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
              <div className="pb-3 border-b border-stone-200">
                <h2 className="text-base font-bold text-[#14532D]">
                  ভূমিকাভিত্তিক অনুমতি ব্যবস্থাপনা (Role-Based Access Control — RBAC)
                </h2>
                <p className="text-xs text-stone-500">
                  সব অ্যাডমিন সব কাজ করতে পারবে না; সার্ভার এবং ইন্টারফেস উভয় স্তরেই অনুমতি যাচাই করা হয়
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 text-xs">
                      <th className="py-3 pr-3">অ্যাডমিন ভূমিকা (Role)</th>
                      <th className="py-3 pr-3">অনুমোদিত দায়িত্ব ও ক্ষমতা</th>
                      <th className="py-3 text-right">পরীক্ষামূলক সক্রিয়করণ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    <tr>
                      <td className="py-3 pr-3 font-bold text-[#14532D]">Super Admin</td>
                      <td className="py-3 pr-3 text-stone-600">
                        সব কিছু পরিচালনা করতে পারবেন (অবস্থান, বাজারদর, ব্যবহারকারী, সেটিংস ও অডিট লগ)
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onChangeAdminRole('Super Admin')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                            currentAdminRole === 'Super Admin'
                              ? 'bg-[#166534] text-white'
                              : 'bg-[#F5F8F1] text-[#173B2A]'
                          }`}
                        >
                          {currentAdminRole === 'Super Admin' ? 'সক্রিয়' : 'নির্বাচন করুন'}
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-3 font-bold text-[#14532D]">Content Editor</td>
                      <td className="py-3 pr-3 text-stone-600">
                        ফসল, রোগবালাই, ক্যালেন্ডার ও কৃষি নিবন্ধ পরিচালনা করতে পারবেন
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onChangeAdminRole('Content Editor')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                            currentAdminRole === 'Content Editor'
                              ? 'bg-[#166534] text-white'
                              : 'bg-[#F5F8F1] text-[#173B2A]'
                          }`}
                        >
                          {currentAdminRole === 'Content Editor' ? 'সক্রিয়' : 'নির্বাচন করুন'}
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-3 font-bold text-[#14532D]">Market Manager</td>
                      <td className="py-3 pr-3 text-stone-600">
                        বাজারদর যোগ, যাচাই ও প্রকাশ করতে পারবেন
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onChangeAdminRole('Market Manager')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                            currentAdminRole === 'Market Manager'
                              ? 'bg-[#166534] text-white'
                              : 'bg-[#F5F8F1] text-[#173B2A]'
                          }`}
                        >
                          {currentAdminRole === 'Market Manager' ? 'সক্রিয়' : 'নির্বাচন করুন'}
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-3 font-bold text-[#14532D]">Moderator</td>
                      <td className="py-3 pr-3 text-stone-600">
                        বিজ্ঞাপন, প্রশ্নোত্তর ও রিপোর্ট যাচাই করতে পারবেন
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onChangeAdminRole('Moderator')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                            currentAdminRole === 'Moderator'
                              ? 'bg-[#166534] text-white'
                              : 'bg-[#F5F8F1] text-[#173B2A]'
                          }`}
                        >
                          {currentAdminRole === 'Moderator' ? 'সক্রিয়' : 'নির্বাচন করুন'}
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-3 font-bold text-[#14532D]">Support Agent</td>
                      <td className="py-3 pr-3 text-stone-600">
                        ব্যবহারকারীর অভিযোগ ও সহায়তা পরিচালনা করতে পারবেন
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onChangeAdminRole('Support Agent')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                            currentAdminRole === 'Support Agent'
                              ? 'bg-[#166534] text-white'
                              : 'bg-[#F5F8F1] text-[#173B2A]'
                          }`}
                        >
                          {currentAdminRole === 'Support Agent' ? 'সক্রিয়' : 'নির্বাচন করুন'}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* =================================================================
              MODULE 16: কার্যক্রমের ইতিহাস — Audit Logs (Section 11)
             ================================================================= */}
          {activeModule === 'audit-logs' && (
            <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
              <div className="pb-3 border-b border-stone-200">
                <h2 className="text-base font-bold text-[#14532D]">
                  অপরিবর্তনীয় কার্যক্রমের ইতিহাস (Immutable Audit Logs — {toBengaliNumber(auditLogs.length)}টি রেকর্ড)
                </h2>
                <p className="text-xs text-stone-500">
                  কোন অ্যাডমিন, কখন, কী পরিবর্তন করেছেন, আগের মান কী ছিল, নতুন মান কী হয়েছে এবং পরিবর্তনের কারণ
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500">
                      <th className="py-3 pr-3">সময় ও Request ID</th>
                      <th className="py-3 pr-3">অ্যাডমিন ও ভূমিকা</th>
                      <th className="py-3 pr-3">কার্যক্রম ও বিভাগ</th>
                      <th className="py-3 pr-3">আগের মান → নতুন মান</th>
                      <th className="py-3">কারণ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F5F8F1]/60">
                        <td className="py-3 pr-3 font-mono-tabular text-stone-600">
                          <div>{log.timestampBn}</div>
                          <div className="text-[10px] text-stone-400">{log.requestId}</div>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="font-bold text-[#14532D]">{log.adminNameBn}</div>
                          <div className="text-[11px] text-[#166534]">{log.adminRole}</div>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="font-bold text-[#173B2A]">{log.actionBn}</div>
                          <div className="text-[11px] text-stone-500">{log.resourceTypeBn}</div>
                        </td>
                        <td className="py-3 pr-3">
                          <span className="text-stone-500">{log.previousValueBn || '—'}</span>
                          <span className="mx-1.5 text-stone-400">→</span>
                          <span className="font-bold text-[#166534]">{log.newValueBn || '—'}</span>
                        </td>
                        <td className="py-3 text-stone-600">{log.reasonBn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
