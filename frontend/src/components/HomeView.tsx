import React from 'react';
import {
  CloudSun,
  TrendingUp,
  ShieldAlert,
  Calendar,
  Calculator,
  Wallet,
  ShoppingBag,
  MessageSquareText,
  ArrowRight,
  BellRing,
  ExternalLink,
  CheckCircle2,
  Droplets,
  Wind,
} from 'lucide-react';
import {
  NavTab,
  DistrictLocation,
  DivisionEntity,
  DistrictEntity,
  UpazilaEntity,
  MarketPriceItem,
  CropGuideItem,
  QuestionAnswerItem,
} from '@shared/types';
import { toBengaliNumber } from '@shared/utils/calculations';
import { GOVT_AGRI_LINKS } from '@shared/data/bangladeshData';
import { CropVisualCard } from './CropVisualCard';

interface HomeViewProps {
  onNavigate: (tab: NavTab) => void;
  selectedDistrict: DistrictLocation;
  selectedUpazila: string;
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
  weatherData: any;
  marketPrices: MarketPriceItem[];
  crops: CropGuideItem[];
  questions: QuestionAnswerItem[];
  onSelectCrop: (crop: CropGuideItem) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  selectedDistrict,
  selectedUpazila,
  divisions = [],
  districtEntities = [],
  upazilaEntities = [],
  selectedDivisionId = '',
  selectedDistrictId = '',
  selectedUpazilaId = '',
  onSelectHierarchyLocation,
  weatherData,
  marketPrices,
  crops,
  questions,
  onSelectCrop,
}) => {
  const quickCards: {
    id: NavTab;
    titleBn: string;
    descBn: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    {
      id: 'weather',
      titleBn: 'আজকের আবহাওয়া',
      descBn: 'জেলা ও উপজেলা অনুযায়ী তাপমাত্রা ও ৭ দিনের বৃষ্টির পূর্বাভাস',
      icon: CloudSun,
    },
    {
      id: 'market',
      titleBn: 'আজকের বাজারদর',
      descBn: 'বিভিন্ন হাটের পাইকারি ও খুচরা ফসলের যাচাইকৃত দর ও তুলনা',
      icon: TrendingUp,
    },
    {
      id: 'diseases',
      titleBn: 'ফসলের রোগ শনাক্তকরণ',
      descBn: 'আক্রান্ত পাতার লক্ষণ ও ছবি দিয়ে সম্ভাব্য রোগ ও প্রতিকার জানুন',
      icon: ShieldAlert,
    },
    {
      id: 'calendar',
      titleBn: 'কৃষি ক্যালেন্ডার',
      descBn: 'বাংলা ১২ মাস ও মৌসুম অনুযায়ী বপন, সার ও ফসল কাটার সময়সূচি',
      icon: Calendar,
    },
    {
      id: 'calculator',
      titleBn: 'জমির হিসাব',
      descBn: 'শতক, বিঘা, একর ও হেক্টর রূপান্তর এবং বীজ ও সারের পরিমাণ হিসাব',
      icon: Calculator,
    },
    {
      id: 'calculator',
      titleBn: 'আয়-ব্যয়ের হিসাব',
      descBn: 'চাষাবাদের মোট উৎপাদন খরচ, বিক্রয়মূল্য ও লাভ-ক্ষতির হিসাব',
      icon: Wallet,
    },
    {
      id: 'marketplace',
      titleBn: 'ফসল বিক্রি',
      descBn: 'মধ্যস্বত্বভোগী ছাড়াই সরাসরি পাইকারি ক্রেতার কাছে ফসল বিক্রির বিজ্ঞাপন',
      icon: ShoppingBag,
    },
    {
      id: 'qa',
      titleBn: 'কৃষি বিশেষজ্ঞের পরামর্শ',
      descBn: 'ফসলের সমস্যা নিয়ে প্রশ্ন করুন এবং কৃষিবিদদের যাচাইকৃত উত্তর পান',
      icon: MessageSquareText,
    },
  ];

  const currentTemp = weatherData?.current?.tempC ?? 29;
  const conditionBn = weatherData?.current?.conditionBn ?? 'রৌদ্রোজ্জ্বল ও পরিষ্কার আকাশ';
  const rainProb = weatherData?.current?.rainProbPercent ?? 20;
  const windKmh = weatherData?.current?.windSpeedKmh ?? 12;

  return (
    <div className="space-y-8 pb-12">
      {/* 4.2 Hero Section */}
      <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#14532D] via-[#166534] to-[#114224] text-white border border-[#14532D]">
        {/* Decorative Rural Bangladesh Paddy Landscape SVG Backdrop */}
        <svg
          className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
          viewBox="0 0 1200 420"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#166534" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <rect width="1200" height="420" fill="url(#skyGrad)" />
          <circle cx="980" cy="95" r="55" fill="#FDE047" fillOpacity="0.45" />
          <path
            d="M0 310 Q 300 250 600 300 T 1200 280 L 1200 420 L 0 420 Z"
            fill="#86EFAC"
            fillOpacity="0.35"
          />
          <path
            d="M0 350 Q 400 300 800 345 T 1200 330 L 1200 420 L 0 420 Z"
            fill="#DCFCE7"
            fillOpacity="0.25"
          />
        </svg>

        <div className="relative z-10 p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="text-xs sm:text-sm font-medium text-[#DCFCE7] tracking-wide">
              স্লোগান: কৃষকের পাশে, প্রতিদিন · {selectedDistrict.nameBn} ({selectedUpazila})
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-bold leading-tight text-balance">
              আপনার কৃষিকাজের সব সমাধান এক জায়গায়
            </h1>

            <p className="text-base sm:text-lg text-stone-100 max-w-2xl leading-relaxed">
              আবহাওয়া, বাজারদর, ফসলের রোগ ও চাষাবাদের প্রয়োজনীয় তথ্য জানুন সহজ বাংলায়। বাংলাদেশের কৃষকদের জন্য নির্ভরযোগ্য ডিজিটাল সহকারী।
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('weather')}
                className="px-5 py-3 rounded-xl bg-white text-[#14532D] font-bold text-sm sm:text-base hover:bg-[#DCFCE7] transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <CloudSun className="w-5 h-5 text-[#166534]" />
                <span>আজকের আবহাওয়া দেখুন</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('market')}
                className="px-5 py-3 rounded-xl bg-[#DCFCE7]/20 hover:bg-[#DCFCE7]/30 text-white border border-white/30 font-semibold text-sm sm:text-base transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <TrendingUp className="w-5 h-5" />
                <span>বাজারদর জানুন</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('crops')}
                className="px-5 py-3 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/25 font-semibold text-sm sm:text-base transition-colors whitespace-nowrap cursor-pointer"
              >
                ফসলের তথ্য দেখুন
              </button>
            </div>
          </div>

          {/* Live Local Weather Snapshot Card inside Hero */}
          <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/20 text-white">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div>
                <div className="text-xs text-[#DCFCE7]">স্থানীয় আবহাওয়া পূর্বাভাস</div>
                <div className="text-lg font-bold mt-0.5">
                  {selectedDistrict.nameBn} · {selectedUpazila}
                </div>
              </div>
              <CloudSun className="w-10 h-10 text-amber-300 shrink-0" />
            </div>

            <div className="py-4 flex items-baseline justify-between">
              <div>
                <div className="text-4xl font-bold font-mono-tabular">
                  {toBengaliNumber(currentTemp)}°সে
                </div>
                <div className="text-sm text-[#DCFCE7] mt-1">{conditionBn}</div>
              </div>
              <div className="text-right space-y-1 text-xs sm:text-sm text-stone-100">
                <div className="flex items-center justify-end gap-1.5">
                  <Droplets className="w-4 h-4 text-sky-300" />
                  <span>বৃষ্টির সম্ভাবনা: {toBengaliNumber(rainProb)}%</span>
                </div>
                <div className="flex items-center justify-end gap-1.5">
                  <Wind className="w-4 h-4 text-emerald-200" />
                  <span>বাতাস: {toBengaliNumber(windKmh)} কিমি/ঘণ্টা</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs">
              <span className="text-[#DCFCE7]">
                {weatherData?.advisory?.alertTitleBn || 'মাঠের কাজের জন্য অনুকূল আবহাওয়া'}
              </span>
              <button
                type="button"
                onClick={() => onNavigate('weather')}
                className="font-bold underline hover:text-[#DCFCE7] whitespace-nowrap ml-2"
              >
                ৭ দিনের পূর্বাভাস →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4.3 Quick Access Cards (8 Cards) */}
      <section aria-labelledby="quick-access-heading">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="quick-access-heading" className="text-xl sm:text-2xl font-bold text-[#14532D]">
              দ্রুত কৃষিসেবা ও টুলস
            </h2>
            <p className="text-sm text-stone-600">
              আপনার প্রয়োজনীয় সেবাটি বেছে নিন
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <button
                key={`${card.id}-${idx}`}
                type="button"
                onClick={() => onNavigate(card.id)}
                className="group text-left bg-white p-5 rounded-2xl border border-stone-200/90 hover:border-[#166534] transition-all flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] text-[#166534] flex items-center justify-center mb-3.5 group-hover:bg-[#166534] group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#173B2A] group-hover:text-[#166534] transition-colors">
                    {card.titleBn}
                  </h3>
                  <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                    {card.descBn}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-[#166534]">
                  <span>বিস্তারিত দেখুন</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4.4 আজকের কৃষি তথ্য (Important Agri Bulletins & Seasonal Advice) */}
      <section aria-labelledby="today-agri-info-heading" className="bg-white rounded-2xl p-6 border border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <BellRing className="w-6 h-6 text-[#166534]" />
            <div>
              <h2 id="today-agri-info-heading" className="text-lg sm:text-xl font-bold text-[#14532D]">
                আজকের কৃষি তথ্য ও মৌসুমি পরামর্শ
              </h2>
              <p className="text-xs text-stone-600">
                কৃষি সম্প্রসারণ অধিদপ্তর ও গবেষণা প্রতিষ্ঠানের নির্দেশনা অনুযায়ী
              </p>
            </div>
          </div>
          <span className="text-xs text-stone-500">হালনাগাদ: কার্তিক ১৪৩৩ বঙ্গাব্দ</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          <div className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200/80">
            <div className="text-xs font-semibold text-[#166534] mb-1">
              মৌসুমি চাষাবাদের পরামর্শ
            </div>
            <h3 className="text-sm font-bold text-[#173B2A]">
              আমন ধানের শীষ ব্লাস্ট ও কারেন্ট পোকা পর্যবেক্ষণ
            </h3>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              সকালে ঘন কুয়াশা ও দিনে গরম থাকলে আমন ধানে শীষ ব্লাস্ট হতে পারে। জমিতে ২–৩ ইঞ্চি পানি ধরে রাখুন এবং গাছের গোড়া ফাঁক করে আলো-বাতাস চলাচলের ব্যবস্থা করুন।
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200/80">
            <div className="text-xs font-semibold text-amber-800 mb-1">
              রবি মৌসুমের প্রস্তুতি
            </div>
            <h3 className="text-sm font-bold text-[#173B2A]">
              সরিষা, আলু ও গমের প্রত্যয়িত বীজ বপন শুরু
            </h3>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              আমন ধান কাটার পরপরই জমির জো অবস্থায় বারি সরিষা-১৪/১৭ এবং প্রত্যয়িত বীজ আলু রোপণ করুন। সরিষা চাষে জিপসাম ও বোরন সার প্রয়োগে ফলন বাড়ে।
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200/80">
            <div className="text-xs font-semibold text-[#166534] mb-1">
              সরকারি কৃষি সহায়তা ও প্রশিক্ষণ
            </div>
            <h3 className="text-sm font-bold text-[#173B2A]">
              ক্ষুদ্র ও প্রান্তিক কৃষকদের রবি প্রণোদনা কর্মসূচি
            </h3>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              ইউনিয়ন পর্যায়ে উপ-সহকারী কৃষি কর্মকর্তার (SAAO) মাধ্যমে বিনামূল্যে সরিষা, ভুট্টা ও শীতকালীন সবজির বীজ ও সার বিতরণের তালিকা যাচাই চলছে।
            </p>
          </div>
        </div>
      </section>

      {/* 4.5 Local Market Prices & Popular Crops (2-column split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Local Market Prices Snapshot */}
        <section className="lg:col-span-7 bg-white rounded-2xl p-6 border border-stone-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#14532D]">
                  আজকের স্থানীয় বাজারদর
                </h2>
                <p className="text-xs text-stone-600">
                  কৃষি বিপণন অধিদপ্তর (DAM) ও যাচাইকৃত বাজার পর্যবেক্ষকের তথ্য
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('market')}
                className="text-xs sm:text-sm font-bold text-[#166534] hover:underline whitespace-nowrap"
              >
                সব বাজারদর দেখুন →
              </button>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-xs text-stone-500">
                    <th className="py-2.5 font-semibold">ফসল ও বাজার</th>
                    <th className="py-2.5 font-semibold">একক</th>
                    <th className="py-2.5 font-semibold text-right">পাইকারি দর</th>
                    <th className="py-2.5 font-semibold text-right">খুচরা দর</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {marketPrices.slice(0, 5).map((item) => (
                    <tr key={item.id} className="hover:bg-[#F5F8F1]/60">
                      <td className="py-3 pr-2">
                        <div className="font-semibold text-[#173B2A]">{item.cropNameBn}</div>
                        <div className="text-xs text-stone-500">
                          {item.marketNameBn} · {item.districtBn}
                        </div>
                      </td>
                      <td className="py-3 text-xs text-stone-600 whitespace-nowrap">{item.unitBn}</td>
                      <td className="py-3 text-right font-bold text-[#166534] font-mono-tabular whitespace-nowrap">
                        ৳ {toBengaliNumber(item.wholesalePrice)}
                      </td>
                      <td className="py-3 text-right font-semibold text-[#173B2A] font-mono-tabular whitespace-nowrap">
                        ৳ {toBengaliNumber(item.retailPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#166534]" />
              <span>কোনো অনুমানভিত্তিক দাম বাস্তব বাজারদর হিসেবে দেখানো হয় না</span>
            </span>
          </div>
        </section>

        {/* Popular Crops Section */}
        <section className="lg:col-span-5 bg-white rounded-2xl p-6 border border-stone-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#14532D]">
                  জনপ্রিয় ফসল ও চাষাবাদ
                </h2>
                <p className="text-xs text-stone-600">
                  মাটি, সার, সেচ ও ধাপে ধাপে চাষ পদ্ধতি
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('crops')}
                className="text-xs sm:text-sm font-bold text-[#166534] hover:underline whitespace-nowrap"
              >
                সব ফসল →
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {crops.slice(0, 4).map((crop) => (
                <button
                  key={crop.id}
                  type="button"
                  onClick={() => {
                    onSelectCrop(crop);
                    onNavigate('crops');
                  }}
                  className="w-full text-left p-3 rounded-xl bg-[#F5F8F1] hover:bg-[#DCFCE7]/50 border border-stone-200/80 transition-colors flex items-center gap-3.5 cursor-pointer"
                >
                  <CropVisualCard visualType={crop.visualType} className="w-12 h-12" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#173B2A] truncate">{crop.nameBn}</h3>
                    <p className="text-xs text-stone-600 truncate mt-0.5">
                      {crop.seasonBn} · {crop.durationBn}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#166534] shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500">
            উৎস: ব্রি (BRRI), বারি (BARI) ও কৃষি সম্প্রসারণ অধিদপ্তর
          </div>
        </section>
      </div>

      {/* Farmers Q&A and Important Govt Links */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white rounded-2xl p-6 border border-stone-200">
          <div className="flex items-center justify-between pb-4 border-b border-stone-200">
            <div>
              <h2 className="text-lg font-bold text-[#14532D]">কৃষকদের সাম্প্রতিক প্রশ্ন ও বিশেষজ্ঞের উত্তর</h2>
              <p className="text-xs text-stone-600">যাচাইকৃত কৃষি কর্মকর্তাদের পরামর্শ</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('qa')}
              className="text-xs sm:text-sm font-bold text-[#166534] hover:underline whitespace-nowrap"
            >
              প্রশ্ন করুন →
            </button>
          </div>

          <div className="divide-y divide-stone-100 mt-2">
            {questions.slice(0, 2).map((q) => (
              <div key={q.id} className="py-4">
                <div className="text-xs text-stone-500 mb-1">
                  {q.cropBn} · {q.districtBn} ({q.upazilaBn}) · প্রশ্নকারী: {q.askedByBn}
                </div>
                <h3 className="text-sm font-bold text-[#173B2A]">{q.titleBn}</h3>
                {q.answers[0] && (
                  <div className="mt-2 p-3 rounded-xl bg-[#F5F8F1] text-xs text-[#173B2A] leading-relaxed">
                    <span className="font-bold text-[#166534]">{q.answers[0].expertNameBn}: </span>
                    {q.answers[0].answerTextBn}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Government Agri Agency Links */}
        <section className="lg:col-span-5 bg-white rounded-2xl p-6 border border-stone-200">
          <div className="pb-4 border-b border-stone-200">
            <h2 className="text-lg font-bold text-[#14532D]">সরকারি কৃষি সংস্থা ও জরুরি সহায়তা</h2>
            <p className="text-xs text-stone-600">নির্ভরযোগ্য সরকারি তথ্যসূত্র ও কল সেন্টার</p>
          </div>

          <div className="space-y-3 mt-4">
            {GOVT_AGRI_LINKS.map((link) => (
              <a
                key={link.nameBn}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3.5 rounded-xl bg-[#F5F8F1] hover:bg-[#DCFCE7]/50 border border-stone-200/80 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#14532D]">{link.nameBn}</span>
                  <ExternalLink className="w-4 h-4 text-[#166534]" />
                </div>
                <p className="text-xs text-stone-600 mt-1">{link.descBn}</p>
                <div className="text-xs font-semibold text-[#166534] mt-1">{link.phoneBn}</div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
