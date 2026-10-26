import React, { useState } from 'react';
import {
  Sprout,
  CloudSun,
  TrendingUp,
  BookOpen,
  ShieldAlert,
  Calendar,
  Calculator,
  ShoppingBag,
  MessageSquareText,
  UserCheck,
  Settings,
  Search,
  MapPin,
  Bell,
  Menu,
  X,
  Volume2,
  CheckCircle2,
  LogIn,
  UserPlus,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import {
  NavTab,
  DistrictLocation,
  AppNotification,
  DivisionEntity,
  DistrictEntity,
  UpazilaEntity,
} from '@shared/types';
import { AuthAccount, canAccessAdminPanel } from '@shared/utils/locationAndAdminRules';
import { toBengaliNumber } from '@shared/utils/calculations';
import { CascadingLocationSelector } from './CascadingLocationSelector';

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  districts: DistrictLocation[];
  selectedDistrict: DistrictLocation;
  selectedUpazila: string;
  onSelectDistrict: (district: DistrictLocation, upazila?: string) => void;
  divisions?: DivisionEntity[];
  districtEntities?: DistrictEntity[];
  upazilaEntities?: UpazilaEntity[];
  selectedDivisionId?: string;
  selectedDistrictId?: string;
  selectedUpazilaId?: string;
  onSelectHierarchyLocation?: (sel: {
    divisionId: string;
    districtId: string;
    upazilaId: string;
  }) => void;
  weatherData?: any;
  globalSearch: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  notifications: AppNotification[];
  onMarkNotificationsRead: () => void;
  currentUser: AuthAccount | null;
  onOpenAuthModal: (mode: 'signin' | 'signup') => void;
  onLogout: () => void;
  onSpeakText: (text: string) => void;
}

export const DESKTOP_MENU_ITEMS: {
  id: NavTab;
  labelBn: string;
  icon: React.FC<{ className?: string }>;
  adminOnly?: boolean;
}[] = [
  { id: 'home', labelBn: 'হোম', icon: Sprout },
  { id: 'weather', labelBn: 'আবহাওয়া', icon: CloudSun },
  { id: 'market', labelBn: 'বাজারদর', icon: TrendingUp },
  { id: 'crops', labelBn: 'ফসল ও চাষাবাদ', icon: BookOpen },
  { id: 'diseases', labelBn: 'রোগ ও প্রতিকার', icon: ShieldAlert },
  { id: 'calendar', labelBn: 'কৃষি ক্যালেন্ডার', icon: Calendar },
  { id: 'calculator', labelBn: 'কৃষি ক্যালকুলেটর', icon: Calculator },
  { id: 'marketplace', labelBn: 'ফসল বিক্রি', icon: ShoppingBag },
  { id: 'qa', labelBn: 'কৃষি প্রশ্নোত্তর', icon: MessageSquareText },
  { id: 'my-farm', labelBn: 'আমার কৃষি', icon: UserCheck },
  { id: 'admin', labelBn: 'অ্যাডমিন প্যানেল', icon: Settings, adminOnly: true },
];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  districts,
  selectedDistrict,
  selectedUpazila,
  onSelectDistrict,
  divisions = [],
  districtEntities = [],
  upazilaEntities = [],
  selectedDivisionId = '',
  selectedDistrictId = '',
  selectedUpazilaId = '',
  onSelectHierarchyLocation,
  weatherData,
  globalSearch,
  onSearchChange,
  onSearchSubmit,
  notifications,
  onMarkNotificationsRead,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onSpeakText,
}) => {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasAdminAccess = canAccessAdminPanel(currentUser);
  const visibleMenuItems = DESKTOP_MENU_ITEMS.filter(
    (item) => !item.adminOnly || hasAdminAccess
  );

  const activeUpzObj = upazilaEntities.find((u) => u.id === selectedUpazilaId);

  return (
    <>
      {/* Top Bar: Brand, Location & Search, Notifications & Auth Controls */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200/80">
        <div className="max-w-[1440px] mx-auto px-2.5 sm:px-6 h-16 flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Zone 1: Brand & Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowMobileDrawer(true)}
              aria-label="মোবাইল মেনু খুলুন"
              aria-expanded={showMobileDrawer}
              className="lg:hidden p-2 rounded-lg text-[#173B2A] hover:bg-[#DCFCE7]/60 focus-visible:outline-2 focus-visible:outline-[#166534]"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('home')}
              className="flex items-center gap-2 text-left group focus-visible:outline-2 focus-visible:outline-[#166534] rounded-lg"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#166534] flex items-center justify-center text-white shadow-xs group-hover:bg-[#14532D] transition-colors shrink-0">
                <Sprout className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="hidden sm:inline text-lg sm:text-2xl font-bold tracking-tight text-[#14532D] whitespace-nowrap">
                কৃষিবন্ধু
              </span>
            </button>
          </div>

          {/* Zone 2: Global Search & Cascading Location Selector Trigger */}
          <div className="hidden lg:flex items-center gap-2 flex-1 max-w-xl min-w-0">
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              aria-label="বিভাগ, জেলা বা উপজেলা পরিবর্তন করুন"
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-[#F5F8F1] hover:bg-[#DCFCE7]/70 border border-stone-200 text-xs sm:text-sm font-medium text-[#173B2A] transition-colors shrink-0 cursor-pointer max-w-[13rem]"
            >
              <MapPin className="w-4 h-4 text-[#166534]" />
              <span className="truncate">
                {selectedDistrict.divisionBn} · {selectedDistrict.nameBn} · {selectedUpazila}
              </span>
            </button>

            <form onSubmit={onSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={globalSearch}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ফসল, বাজারদর, রোগবালাই বা প্রশ্ন খুঁজুন..."
                aria-label="ফসল, বাজারদর বা রোগবালাই খুঁজুন"
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F5F8F1] border border-stone-200 text-sm text-[#173B2A] placeholder:text-stone-500 focus:bg-white focus:border-[#166534] focus:outline-none transition-colors"
              />
            </form>
          </div>

          {/* Zone 3: Voice Readout, Notifications & Sign In / Sign Up / User Session */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                onSpeakText(
                  `কৃষিবন্ধু ওয়েবসাইটে স্বাগতম। আপনার বর্তমান নির্বাচিত এলাকা ${selectedDistrict.divisionBn} বিভাগের ${selectedDistrict.nameBn} জেলার ${selectedUpazila} উপজেলা।`
                )
              }
              title="বাংলায় পড়ে শোনান"
              aria-label="পৃষ্ঠার সারসংক্ষেপ বাংলায় পড়ে শোনান"
              className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F5F8F1] hover:bg-[#DCFCE7] text-[#166534] text-xs font-semibold border border-stone-200 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>শুনুন</span>
            </button>

            {/* Mobile Location Trigger */}
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              aria-label="অবস্থান নির্বাচন"
              className="lg:hidden flex items-center gap-1 px-2 py-2 rounded-xl bg-[#F5F8F1] border border-stone-200 text-xs font-semibold text-[#166534] whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{selectedDistrict.nameBn}</span>
            </button>

            {/* Notification Dropdown Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotifDropdown((prev) => !prev);
                  if (!showNotifDropdown) onMarkNotificationsRead();
                }}
                aria-label="নোটিফিকেশন দেখুন"
                className="relative p-2 sm:p-2.5 rounded-xl bg-[#F5F8F1] hover:bg-[#DCFCE7]/60 text-[#173B2A] border border-stone-200 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold bg-[#166534] text-white rounded-md font-mono-tabular">
                    {toBengaliNumber(unreadCount)}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1.25rem))] sm:w-96 bg-white rounded-2xl shadow-lg border border-stone-200 p-3 sm:p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <h3 className="font-bold text-sm text-[#173B2A]">কৃষি বার্তা ও নোটিফিকেশন</h3>
                    <button
                      type="button"
                      onClick={() => setShowNotifDropdown(false)}
                      className="text-xs text-stone-500 hover:text-[#173B2A]"
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                  <div className="divide-y divide-stone-100 max-h-80 overflow-y-auto mt-1">
                    {notifications.map((n) => (
                      <div key={n.id} className="py-3 text-left">
                        <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                          <span className="font-semibold text-[#166534]">{n.titleBn}</span>
                          <span>{n.timeBn}</span>
                        </div>
                        <p className="text-xs text-[#173B2A] leading-relaxed">{n.messageBn}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Auth Controls: Sign In & Sign Up when logged out, Profile + Admin Panel + Logout when logged in */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="hidden sm:flex flex-col text-right px-2">
                  <span className="text-xs font-bold text-[#14532D] leading-tight">
                    {currentUser.nameBn}
                  </span>
                  <span className="text-[11px] font-semibold text-[#166534]">
                    {currentUser.positionTitleBn}
                  </span>
                </div>

                {hasAdminAccess && (
                  <button
                    type="button"
                    onClick={() => onSelectTab('admin')}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span className="hidden xl:inline">অ্যাডমিন প্যানেল</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onLogout}
                  title="লগআউট করুন"
                  className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#F5F8F1] hover:bg-red-50 text-red-700 border border-stone-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">লগআউট</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('signin')}
                  className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4" />
                  <span>লগইন</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('signup')}
                  className="hidden sm:flex px-3.5 py-2 rounded-xl bg-[#F5F8F1] hover:bg-[#DCFCE7] text-[#14532D] border border-stone-200 text-xs sm:text-sm font-bold items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4 text-[#166534]" />
                  <span>নিবন্ধন</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navbar Location Selector Modal (Maintains all 8 Divisions, 64 Districts, and 495+ Upazilas) */}
      {showLocationModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLocationModal(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90dvh] flex flex-col border border-stone-200 shadow-2xl overflow-hidden">
            <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-stone-200 bg-white">
              <div>
                <h2 id="location-modal-title" className="text-sm sm:text-lg font-bold text-[#14532D] leading-relaxed">
                  আপনার বিভাগ, জেলা ও উপজেলা নির্বাচন করুন
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  বাংলাদেশের ৮টি বিভাগ, ৬৪টি জেলা ও সকল উপজেলা থেকে আপনার এলাকা বেছে নিন
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                aria-label="বন্ধ করুন"
                className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* 3-Step Cascading Dropdowns (বিভাগ → জেলা → উপজেলা) */}
              {divisions.length > 0 && onSelectHierarchyLocation ? (
                <CascadingLocationSelector
                  divisions={divisions}
                  districts={districtEntities}
                  upazilas={upazilaEntities}
                  selectedDivisionId={selectedDivisionId}
                  selectedDistrictId={selectedDistrictId}
                  selectedUpazilaId={selectedUpazilaId}
                  onChange={(sel) => {
                    onSelectHierarchyLocation({
                      divisionId: sel.divisionId,
                      districtId: sel.districtId,
                      upazilaId: sel.upazilaId,
                    });
                  }}
                  idPrefix="modal-cascading"
                />
              ) : (
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="modal-district-select"
                      className="block text-sm font-semibold text-[#173B2A] mb-1.5"
                    >
                      জেলা নির্বাচন করুন
                    </label>
                    <select
                      id="modal-district-select"
                      value={selectedDistrict.id}
                      onChange={(e) => {
                        const found = districts.find((d) => d.id === e.target.value);
                        if (found) {
                          onSelectDistrict(found, found.upazilasBn[0]);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-[#F5F8F1] text-sm font-medium text-[#173B2A]"
                    >
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nameBn} ({d.divisionBn})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-stone-100">
                <div className="text-[11px] text-stone-500 font-mono-tabular break-words">
                  স্থানাঙ্ক: {toBengaliNumber(activeUpzObj?.latitude ?? selectedDistrict.lat, 4)}° উ,{' '}
                  {toBengaliNumber(activeUpzObj?.longitude ?? selectedDistrict.lon, 4)}° পূ
                </div>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#166534] text-white text-sm font-semibold hover:bg-[#14532D] transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>অবস্থান সংরক্ষণ করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {showMobileDrawer && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowMobileDrawer(false)} />
          <div className="relative w-72 max-w-[min(85vw,20rem)] bg-white h-full overflow-y-auto p-4 sm:p-5 flex flex-col justify-between z-10">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#166534] flex items-center justify-center text-white">
                    <Sprout className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-lg text-[#14532D]">কৃষিবন্ধু</div>
                    <div className="text-xs text-stone-500">কৃষকের পাশে, প্রতিদিন</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileDrawer(false)}
                  aria-label="মেনু বন্ধ করুন"
                  className="p-2 rounded-lg text-stone-500 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Auth Summary */}
              <div className="mt-3 p-3 rounded-xl bg-[#F5F8F1] border border-stone-200">
                {currentUser ? (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-[#14532D]">{currentUser.nameBn}</div>
                    <div className="text-[11px] text-[#166534] font-semibold">
                      {currentUser.positionTitleBn}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onLogout();
                        setShowMobileDrawer(false);
                      }}
                      className="w-full py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold"
                    >
                      লগআউট করুন
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMobileDrawer(false);
                        onOpenAuthModal('signin');
                      }}
                      className="py-2 rounded-lg bg-[#166534] text-white text-xs font-bold"
                    >
                      লগইন
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMobileDrawer(false);
                        onOpenAuthModal('signup');
                      }}
                      className="py-2 rounded-lg bg-white border border-stone-300 text-[#14532D] text-xs font-bold"
                    >
                      নিবন্ধন
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Search */}
              <form
                onSubmit={(e) => {
                  onSearchSubmit(e);
                  setShowMobileDrawer(false);
                }}
                className="mt-4 relative"
              >
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={globalSearch}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="ফসল বা বাজারদর খুঁজুন..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-200 text-sm"
                />
              </form>

              <nav className="mt-4 space-y-1" aria-label="মোবাইল প্রধান নেভিগেশন">
                {visibleMenuItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(item.id);
                        setShowMobileDrawer(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                        active
                          ? 'bg-[#166534] text-white'
                          : 'text-[#173B2A] hover:bg-[#DCFCE7]/60'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span>{item.labelBn}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-stone-200 text-xs text-stone-600">
              <div>জরুরি কৃষি কল সেন্টার: ১৬১২৩</div>
              <div className="mt-1">জাতীয় তথ্য বাতায়ন: ৩৩৩</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const MobileBottomNav: React.FC<{
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}> = ({ activeTab, onSelectTab }) => {
  const bottomItems: {
    id: NavTab;
    labelBn: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'home', labelBn: 'হোম', icon: Sprout },
    { id: 'weather', labelBn: 'আবহাওয়া', icon: CloudSun },
    { id: 'market', labelBn: 'বাজারদর', icon: TrendingUp },
    { id: 'marketplace', labelBn: 'ফসল বিক্রি', icon: ShoppingBag },
    { id: 'my-farm', labelBn: 'আমার কৃষি', icon: UserCheck },
  ];

  return (
    <nav
      aria-label="মোবাইল নিচের নেভিগেশন"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-stone-200 px-1.5 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] grid grid-cols-5"
    >
      {bottomItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={`min-w-0 flex flex-col items-center justify-center py-1 px-0.5 sm:px-2 rounded-xl text-[10px] sm:text-xs font-semibold transition-colors ${
              isActive ? 'text-[#166534] bg-[#DCFCE7]/50' : 'text-stone-600 hover:text-[#173B2A]'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="w-full text-center leading-tight break-words">{item.labelBn}</span>
          </button>
        );
      })}
    </nav>
  );
};
