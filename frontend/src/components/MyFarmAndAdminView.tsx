import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import {
  UserCheck,
  MapPin,
  Plus,
  Sprout,
  Wallet,
  BookmarkCheck,
  Settings,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  LogIn,
  UserPlus,
} from 'lucide-react';
import {
  FarmerFieldRecord,
  FarmerExpenseRecord,
  MarketPriceItem,
  CropGuideItem,
  MarketplaceListing,
  DistrictLocation,
} from '@shared/types';
import { AuthAccount } from '@shared/utils/locationAndAdminRules';
import { toBengaliNumber } from '@shared/utils/calculations';
import { authClient } from '../lib/auth-client';

interface MyFarmViewProps {
  currentUser: AuthAccount | null;
  onOpenAuthModal: (mode: 'signin' | 'signup') => void;
  fields: FarmerFieldRecord[];
  onAddField: (field: Omit<FarmerFieldRecord, 'id'>) => void;
  expenses: FarmerExpenseRecord[];
  onAddExpense: (exp: Omit<FarmerExpenseRecord, 'id'>) => void;
  savedPrices: MarketPriceItem[];
  savedCrops: CropGuideItem[];
  selectedDistrict: DistrictLocation;
  selectedUpazila: string;
}

export const MyFarmView: React.FC<MyFarmViewProps> = ({
  currentUser,
  onOpenAuthModal,
  fields,
  onAddField,
  expenses,
  onAddExpense,
  savedPrices,
  savedCrops,
  selectedDistrict,
  selectedUpazila,
}) => {
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) return;

    apiFetch('/api/auth/providers')
      .then(async (response) => {
        if (!response.ok) throw new Error('সাইন-ইন provider তথ্য লোড করা যায়নি।');
        const providers: { google: boolean } = await response.json();
        setGoogleEnabled(providers.google);
      })
      .catch((error) => {
        console.error('Unable to load auth providers:', error);
        setGoogleEnabled(false);
      });
  }, [currentUser]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setGoogleLoading(true);
    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: window.location.origin,
      });
      if (result.error) throw new Error(result.error.message);
    } catch (error) {
      console.error('Unable to sign in with Google:', error);
      setAuthError(error instanceof Error ? error.message : 'Google দিয়ে লগইন করা যায়নি।');
      setGoogleLoading(false);
    }
  };

  // Add Field State
  const [fieldName, setFieldName] = useState('');
  const [fieldArea, setFieldArea] = useState<number>(33);
  const [soilType, setSoilType] = useState('দোআঁশ মাটি');
  const [currentCrop, setCurrentCrop] = useState('বারি সরিষা-১৪');
  const [sowingDate, setSowingDate] = useState('১০ কার্তিক ১৪৩৩');
  const [harvestDate, setHarvestDate] = useState('২৫ মাঘ ১৪৩৩');

  // Add Expense/Income State
  const [expType, setExpType] = useState<'expense' | 'income'>('expense');
  const [expCategory, setExpCategory] = useState<FarmerExpenseRecord['categoryBn']>('সার');
  const [expAmount, setExpAmount] = useState<number>(1500);
  const [expNote, setExpNote] = useState('');

  if (!currentUser) {
    return (
      <section className="max-w-2xl mx-auto bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#DCFCE7] text-[#166534] flex items-center justify-center">
          <UserCheck className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#14532D]">আমার কৃষি</h1>
          <p className="mt-2 text-sm text-stone-600">
            আপনার জমি, ফসল ও আয়-ব্যয়ের ব্যক্তিগত তথ্য দেখতে সাইন ইন করুন অথবা নতুন অ্যাকাউন্ট খুলুন।
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-2">
          <button
            type="button"
            onClick={() => onOpenAuthModal('signin')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-sm font-bold"
          >
            <LogIn className="w-4 h-4" />
            সাইন ইন
          </button>
          <button
            type="button"
            onClick={() => onOpenAuthModal('signup')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#F5F8F1] text-[#14532D] border border-stone-300 text-sm font-bold"
          >
            <UserPlus className="w-4 h-4" />
            সাইন আপ
          </button>
        </div>
        {googleEnabled && (
          <button
            type="button"
            disabled={googleLoading}
            onClick={handleGoogleSignIn}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-[#173B2A] border border-stone-300 text-sm font-bold disabled:opacity-60"
          >
            <span className="font-bold text-[#4285F4]">G</span>
            {googleLoading ? 'Google-এ যাচ্ছেন...' : 'Google দিয়ে সাইন ইন'}
          </button>
        )}
        {authError && <p role="alert" className="text-sm text-red-700">{authError}</p>}
      </section>
    );
  }

  const totalAreaShotok = fields.reduce((acc, f) => acc + f.areaShotok, 0);
  const totalExpense = expenses
    .filter((e) => e.type === 'expense')
    .reduce((acc, e) => acc + e.amount, 0);
  const totalIncome = expenses
    .filter((e) => e.type === 'income')
    .reduce((acc, e) => acc + e.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName.trim() || fieldArea <= 0) return;
    onAddField({
      nameBn: fieldName.trim(),
      areaShotok: fieldArea,
      districtBn: selectedDistrict.nameBn,
      upazilaBn: selectedUpazila,
      soilTypeBn: soilType,
      currentCropBn: currentCrop,
      sowingDateBn: sowingDate,
      expectedHarvestDateBn: harvestDate,
      stageBn: 'চারা রোপণ',
    });
    setFieldName('');
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expAmount <= 0) return;
    onAddExpense({
      fieldNameBn: fields[0]?.nameBn || 'প্রধান জমি',
      cropNameBn: fields[0]?.currentCropBn || 'আমন ধান',
      type: expType,
      categoryBn: expType === 'income' ? 'ফসল বিক্রয়' : expCategory,
      amount: expAmount,
      dateBn: 'আজ',
      noteBn: expNote.trim() || `${expCategory} বাবদ এন্ট্রি`,
    });
    setExpNote('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 13. Farmer Profile Summary Banner */}
      <section className="bg-white rounded-2xl p-6 border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#166534] text-white flex items-center justify-center font-bold text-2xl shrink-0">
            {Array.from(currentUser.nameBn)[0] || 'কৃ'}
          </div>
          <div>
            <div className="text-xs font-semibold text-[#166534]">আমার কৃষি ড্যাশবোর্ড (ব্যক্তিগত প্রোফাইল)</div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#14532D] mt-0.5">
              {currentUser.nameBn}
            </h1>
            <div className="text-xs text-stone-600 mt-1">
              ইউজার আইডি: <span className="font-semibold text-[#14532D]">{currentUser.username}</span>
              {currentUser.email && <span> · {currentUser.email}</span>}
            </div>
            <div className="text-xs text-stone-600 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-[#166534]" />
              <span>
                {selectedDistrict.nameBn} জেলা · {selectedUpazila} উপজেলা · ভাষা: বাংলা
              </span>
            </div>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-200 text-center">
            <div className="text-xs text-stone-500">মোট আবাদি জমি</div>
            <div className="text-lg font-bold text-[#14532D] font-mono-tabular mt-0.5">
              {toBengaliNumber(totalAreaShotok)} শতক
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-200 text-center">
            <div className="text-xs text-stone-500">মোট খরচ</div>
            <div className="text-lg font-bold text-[#173B2A] font-mono-tabular mt-0.5">
              ৳ {toBengaliNumber(totalExpense)}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#DCFCE7]/50 border border-[#166534]/30 text-center">
            <div className="text-xs text-[#14532D]">মোট আয় / বিক্রয়</div>
            <div className="text-lg font-bold text-[#166534] font-mono-tabular mt-0.5">
              ৳ {toBengaliNumber(totalIncome)}
            </div>
          </div>
        </div>
      </section>

      {/* আমার জমি ও চলমান ফসল + আমার আয়-ব্যয় */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* আমার জমি ও ফসল */}
        <section className="lg:col-span-6 bg-white rounded-2xl p-6 border border-stone-200 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <h2 className="text-lg font-bold text-[#14532D] flex items-center gap-2">
                <Sprout className="w-5 h-5 text-[#166534]" />
                <span>আমার জমি ও চলমান ফসলের রেকর্ড</span>
              </h2>
              <p className="text-xs text-stone-500">জমির পরিমাণ, মাটির ধরন ও ফসল সংগ্রহের তারিখ</p>
            </div>
          </div>

          <div className="space-y-3">
            {fields.map((f) => (
              <div key={f.id} className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#14532D]">{f.nameBn}</h3>
                  <span className="text-xs font-bold text-[#166534] font-mono-tabular">
                    {toBengaliNumber(f.areaShotok)} শতক ({toBengaliNumber((f.areaShotok / 33).toFixed(1))} বিঘা)
                  </span>
                </div>
                <div className="text-xs text-[#173B2A]">
                  <strong>চাষকৃত ফসল:</strong> {f.currentCropBn} · <strong>মাটি:</strong> {f.soilTypeBn}
                </div>
                <div className="flex flex-wrap items-center justify-between text-xs text-stone-600 pt-2 border-t border-stone-200/70">
                  <span>রোপণ: {f.sowingDateBn}</span>
                  <span>সম্ভাব্য সংগ্রহ: {f.expectedHarvestDateBn}</span>
                  <span className="font-semibold text-[#166534]">ধাপ: {f.stageBn}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Field Form */}
          <form onSubmit={handleCreateField} className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200 space-y-3">
            <h3 className="text-xs font-bold text-[#14532D]">নতুন জমির তথ্য যুক্ত করুন</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="fld-name" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  জমির নাম বা পরিচয়
                </label>
                <input
                  id="fld-name"
                  type="text"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="যেমন: দক্ষিণ বিলের জমি"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-xs"
                />
              </div>
              <div>
                <label htmlFor="fld-area" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  জমির পরিমাণ (শতক)
                </label>
                <input
                  id="fld-area"
                  type="number"
                  min={1}
                  value={fieldArea}
                  onChange={(e) => setFieldArea(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-xs font-mono-tabular"
                />
              </div>
              <div>
                <label htmlFor="fld-crop" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  চাষ করা ফসল
                </label>
                <input
                  id="fld-crop"
                  type="text"
                  value={currentCrop}
                  onChange={(e) => setCurrentCrop(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-xs"
                />
              </div>
              <div>
                <label htmlFor="fld-soil" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  মাটির ধরন
                </label>
                <select
                  id="fld-soil"
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-xs"
                >
                  <option value="দোআঁশ মাটি">দোআঁশ মাটি</option>
                  <option value="পলি দোআঁশ মাটি">পলি দোআঁশ মাটি</option>
                  <option value="বেলে দোআঁশ মাটি">বেলে দোআঁশ মাটি</option>
                  <option value="এঁটেল দোআঁশ মাটি">এঁটেল দোআঁশ মাটি</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন জমি যোগ করুন</span>
            </button>
          </form>
        </section>

        {/* আমার আয়-ব্যয়ের খাতা */}
        <section className="lg:col-span-6 bg-white rounded-2xl p-6 border border-stone-200 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <h2 className="text-lg font-bold text-[#14532D] flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#166534]" />
                <span>আমার আয়-ব্যয়ের হিসাব খাতা</span>
              </h2>
              <p className="text-xs text-stone-500">দৈনিক উপকরণ খরচ, শ্রমিক মজুরি ও ফসল বিক্রির হিসাব</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-stone-500">নিট স্থিতি</div>
              <div
                className={`text-base font-bold font-mono-tabular ${
                  netBalance >= 0 ? 'text-[#166534]' : 'text-red-700'
                }`}
              >
                {netBalance >= 0 ? '+' : '-'} ৳ {toBengaliNumber(Math.abs(netBalance))}
              </div>
            </div>
          </div>

          <form onSubmit={handleCreateExpense} className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200 space-y-3">
            <h3 className="text-xs font-bold text-[#14532D]">নতুন আয় বা ব্যয় লিপিবদ্ধ করুন</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="exp-type" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  হিসাবের ধরন
                </label>
                <select
                  id="exp-type"
                  value={expType}
                  onChange={(e) => setExpType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-xs font-semibold"
                >
                  <option value="expense">খরচ (ব্যয়)</option>
                  <option value="income">ফসল বিক্রয় (আয়)</option>
                </select>
              </div>

              <div>
                <label htmlFor="exp-cat" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  খাত নির্বাচন
                </label>
                <select
                  id="exp-cat"
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-xs font-semibold"
                >
                  <option value="সার">সার ক্রয়</option>
                  <option value="বীজ">বীজ ও চারা</option>
                  <option value="শ্রমিক">শ্রমিক মজুরি</option>
                  <option value="সেচ">সেচ খরচ</option>
                  <option value="জমি প্রস্তুত">জমি প্রস্তুত</option>
                  <option value="ফসল বিক্রয়">ফসল বিক্রয়</option>
                </select>
              </div>

              <div>
                <label htmlFor="exp-amt" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  টাকার পরিমাণ
                </label>
                <input
                  id="exp-amt"
                  type="number"
                  min={1}
                  value={expAmount}
                  onChange={(e) => setExpAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-xs font-mono-tabular"
                />
              </div>
            </div>

            <div>
              <label htmlFor="exp-note" className="block text-xs font-semibold text-[#173B2A] mb-1">
                সংক্ষিপ্ত নোট
              </label>
              <input
                id="exp-note"
                type="text"
                value={expNote}
                onChange={(e) => setExpNote(e.target.value)}
                placeholder="যেমন: ৫০ কেজি টিএসপি ও ইউরিয়া ক্রয়..."
                className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>হিসাব খাতায় যোগ করুন</span>
            </button>
          </form>

          <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
            {expenses.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-stone-500">
                    {item.categoryBn} · {item.fieldNameBn} · {item.dateBn}
                  </div>
                  <div className="text-sm font-semibold text-[#173B2A]">{item.noteBn}</div>
                </div>
                <div
                  className={`text-sm font-bold font-mono-tabular whitespace-nowrap ${
                    item.type === 'income' ? 'text-[#166534]' : 'text-[#173B2A]'
                  }`}
                >
                  {item.type === 'income' ? '+' : '-'} ৳ {toBengaliNumber(item.amount)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* সংরক্ষিত বাজারদর ও প্রিয় ফসল */}
      <section className="bg-white rounded-2xl p-6 border border-stone-200">
        <div className="flex items-center gap-2 pb-4 border-b border-stone-200">
          <BookmarkCheck className="w-5 h-5 text-[#166534]" />
          <h2 className="text-lg font-bold text-[#14532D]">সংরক্ষিত বাজারদর ও প্রিয় ফসল</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <h3 className="text-xs font-bold text-stone-500 mb-2">সংরক্ষিত বাজারদর ({toBengaliNumber(savedPrices.length)})</h3>
            {savedPrices.length === 0 ? (
              <p className="text-xs text-stone-500">কোনো বাজারদর সংরক্ষিত নেই।</p>
            ) : (
              <div className="space-y-2">
                {savedPrices.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-[#F5F8F1] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#173B2A]">{p.cropNameBn}</span> ({p.marketNameBn})
                    </div>
                    <span className="font-bold text-[#166534] font-mono-tabular">
                      পাইকারি ৳{toBengaliNumber(p.wholesalePrice)} / {p.unitBn}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold text-stone-500 mb-2">প্রিয় ফসল নির্দেশিকা ({toBengaliNumber(savedCrops.length)})</h3>
            {savedCrops.length === 0 ? (
              <p className="text-xs text-stone-500">কোনো ফসল সংরক্ষিত নেই।</p>
            ) : (
              <div className="space-y-2">
                {savedCrops.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-[#F5F8F1] flex items-center justify-between text-xs">
                    <span className="font-bold text-[#173B2A]">{c.nameBn}</span>
                    <span className="text-[#166534]">{c.seasonBn}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

interface AdminViewProps {
  marketPrices: MarketPriceItem[];
  listings: MarketplaceListing[];
  districts: DistrictLocation[];
  onAddMarketPrice: (entry: any) => Promise<void>;
  onApproveListing: (id: string) => void;
  onRemoveListing: (id: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  marketPrices,
  listings,
  districts,
  onAddMarketPrice,
  onApproveListing,
  onRemoveListing,
}) => {
  const [cropNameBn, setCropNameBn] = useState('');
  const [categoryBn, setCategoryBn] = useState('ধান ও শস্য');
  const [marketNameBn, setMarketNameBn] = useState('');
  const [districtBn, setDistrictBn] = useState('বগুড়া');
  const [upazilaBn, setUpazilaBn] = useState('শিবগঞ্জ');
  const [wholesalePrice, setWholesalePrice] = useState<number>(1290);
  const [retailPrice, setRetailPrice] = useState<number>(1360);
  const [unitBn, setUnitBn] = useState('মণ (৪০ কেজি)');
  const [sourceBn, setSourceBn] = useState('কৃষি বিপণন অধিদপ্তর (DAM) — যাচাইকৃত প্রতিবেদন');
  const [submitting, setSubmitting] = useState(false);
  const [adminStatusMsg, setAdminStatusMsg] = useState<string | null>(null);

  const handleCreatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropNameBn.trim() || !marketNameBn.trim()) {
      setAdminStatusMsg('অনুগ্রহ করে ফসলের নাম এবং বাজারের নাম লিখুন।');
      return;
    }
    setSubmitting(true);
    await onAddMarketPrice({
      cropNameBn: cropNameBn.trim(),
      categoryBn,
      marketNameBn: marketNameBn.trim(),
      districtBn,
      upazilaBn,
      wholesalePrice,
      retailPrice,
      unitBn,
      sourceBn,
      verified: true,
    });
    setCropNameBn('');
    setMarketNameBn('');
    setSubmitting(false);
    setAdminStatusMsg('নতুন বাজারদর সফলভাবে যাচাইকৃত তালিকায় যুক্ত হয়েছে।');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 17. Admin Dashboard Overview */}
      <section className="bg-white rounded-2xl p-6 border border-stone-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#14532D] flex items-center gap-2">
              <Settings className="w-6 h-6 text-[#166534]" />
              <span>প্রশাসনিক ড্যাশবোর্ড (অ্যাডমিন প্যানেল)</span>
            </h1>
            <p className="text-sm text-stone-600 mt-0.5">
              বাজারদর হালনাগাদ, কৃষি তথ্য ব্যবস্থাপনা, বিজ্ঞাপন মডারেশন ও নিরাপত্তা নিরীক্ষা
            </p>
          </div>
          <span className="text-xs font-semibold text-[#166534] bg-[#DCFCE7] px-3 py-1.5 rounded-lg">
            প্রশাসক অধিবেশন সক্রিয়
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          <div className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200">
            <div className="text-xs text-stone-500">নিবন্ধিত কৃষক ও ব্যবহারকারী</div>
            <div className="text-2xl font-bold text-[#14532D] font-mono-tabular mt-1">১,৪২০</div>
          </div>
          <div className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200">
            <div className="text-xs text-stone-500">যাচাইকৃত বাজারদর এন্ট্রি</div>
            <div className="text-2xl font-bold text-[#166534] font-mono-tabular mt-1">
              {toBengaliNumber(marketPrices.length)}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200">
            <div className="text-xs text-stone-500">সক্রিয় ফসল বিক্রির বিজ্ঞাপন</div>
            <div className="text-2xl font-bold text-[#173B2A] font-mono-tabular mt-1">
              {toBengaliNumber(listings.length)}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200">
            <div className="text-xs text-stone-500">রিপোর্টকৃত বিজ্ঞাপন</div>
            <div className="text-2xl font-bold text-amber-700 font-mono-tabular mt-1">
              {toBengaliNumber(listings.filter((l) => l.status === 'reported').length)}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Market Price Management Form */}
        <section className="lg:col-span-6 bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
          <h2 className="text-lg font-bold text-[#14532D] pb-3 border-b border-stone-200 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#166534]" />
            <span>নতুন যাচাইকৃত বাজারদর যোগ ও হালনাগাদ করুন</span>
          </h2>

          {adminStatusMsg && (
            <div className="p-3 rounded-xl bg-[#DCFCE7] text-[#14532D] text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{adminStatusMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreatePrice} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="adm-crop" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  ফসল বা পণ্যের নাম *
                </label>
                <input
                  id="adm-crop"
                  type="text"
                  value={cropNameBn}
                  onChange={(e) => setCropNameBn(e.target.value)}
                  placeholder="যেমন: বোরো ধান (ব্রি ধান-৮৯)"
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm"
                />
              </div>

              <div>
                <label htmlFor="adm-cat" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  বিভাগ
                </label>
                <select
                  id="adm-cat"
                  value={categoryBn}
                  onChange={(e) => setCategoryBn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-semibold"
                >
                  <option value="ধান ও শস্য">ধান ও শস্য</option>
                  <option value="সবজি">সবজি</option>
                  <option value="মসলা ও তেলবীজ">মসলা ও তেলবীজ</option>
                  <option value="ফল ও অর্থকরী">ফল ও অর্থকরী</option>
                </select>
              </div>

              <div>
                <label htmlFor="adm-market" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  বাজার বা হাটের নাম *
                </label>
                <input
                  id="adm-market"
                  type="text"
                  value={marketNameBn}
                  onChange={(e) => setMarketNameBn(e.target.value)}
                  placeholder="যেমন: মহাস্থান হাট"
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm"
                />
              </div>

              <div>
                <label htmlFor="adm-dist" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  জেলা ও উপজেলা
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    id="adm-dist"
                    value={districtBn}
                    onChange={(e) => setDistrictBn(e.target.value)}
                    className="px-2.5 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs font-semibold"
                  >
                    {districts.map((d) => (
                      <option key={d.id} value={d.nameBn}>
                        {d.nameBn}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    aria-label="উপজেলা"
                    value={upazilaBn}
                    onChange={(e) => setUpazilaBn(e.target.value)}
                    className="px-2.5 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="adm-wholesale" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  পাইকারি মূল্য (টাকা) *
                </label>
                <input
                  id="adm-wholesale"
                  type="number"
                  min={1}
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-mono-tabular"
                />
              </div>

              <div>
                <label htmlFor="adm-retail" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  খুচরা মূল্য (টাকা) *
                </label>
                <input
                  id="adm-retail"
                  type="number"
                  min={1}
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-mono-tabular"
                />
              </div>

              <div>
                <label htmlFor="adm-unit" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  পরিমাপের একক
                </label>
                <input
                  id="adm-unit"
                  type="text"
                  value={unitBn}
                  onChange={(e) => setUnitBn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label htmlFor="adm-source" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  তথ্যের উৎস
                </label>
                <input
                  id="adm-source"
                  type="text"
                  value={sourceBn}
                  onChange={(e) => setSourceBn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-sm font-bold cursor-pointer"
            >
              {submitting ? 'সংরক্ষণ হচ্ছে...' : 'বাজারদর প্রকাশ করুন'}
            </button>
          </form>
        </section>

        {/* Marketplace Moderation & Audit Log */}
        <section className="lg:col-span-6 bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
          <h2 className="text-lg font-bold text-[#14532D] pb-3 border-b border-stone-200 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#166534]" />
            <span>মার্কেটপ্লেস বিজ্ঞাপন মডারেশন</span>
          </h2>

          <div className="space-y-3">
            {listings.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs text-stone-500">
                    {item.sellerNameBn} · {item.districtBn} · অবস্থা:{' '}
                    <span
                      className={
                        item.status === 'reported'
                          ? 'text-red-700 font-bold'
                          : 'text-[#166534] font-bold'
                      }
                    >
                      {item.status === 'reported' ? 'অভিযোগ প্রাপ্ত' : 'যাচাইকৃত ও প্রকাশিত'}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#173B2A] mt-0.5">
                    {item.cropNameBn} — ৳{toBengaliNumber(item.pricePerUnit)} / {item.unitBn}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'reported' && (
                    <button
                      type="button"
                      onClick={() => onApproveListing(item.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#166534] text-white text-xs font-semibold"
                    >
                      অনুমোদন দিন
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveListing(item.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-100 text-red-800 hover:bg-red-200 text-xs font-semibold cursor-pointer"
                  >
                    অপসারণ করুন
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
