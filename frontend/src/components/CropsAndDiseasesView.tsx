import React, { useState } from 'react';
import { apiFetch } from '../lib/api';
import {
  BookOpen,
  ShieldAlert,
  Search,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Volume2,
  Info,
} from 'lucide-react';
import { CropGuideItem, CropDiseaseItem } from '@shared/types';
import { CropVisualCard } from './CropVisualCard';

interface CropsViewProps {
  crops: CropGuideItem[];
  selectedCrop: CropGuideItem;
  onSelectCrop: (crop: CropGuideItem) => void;
  savedCropIds: string[];
  onToggleSaveCrop: (id: string) => void;
  onSpeakText: (text: string) => void;
}

export const CropsView: React.FC<CropsViewProps> = ({
  crops,
  selectedCrop,
  onSelectCrop,
  savedCropIds,
  onToggleSaveCrop,
  onSpeakText,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('সব ফসল');

  const categories = ['সব ফসল', 'দানা শস্য', 'সবজি', 'তেলবীজ ও মসলা'];

  const filteredCrops = crops.filter((c) => {
    const matchesSearch =
      !searchTerm.trim() ||
      c.nameBn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.seasonBn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'সব ফসল' || c.categoryBn === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const stepItems = [
    { labelBn: '০১. জমি প্রস্তুত', contentBn: selectedCrop.steps.landPrepBn },
    { labelBn: '০২. বীজ নির্বাচন', contentBn: selectedCrop.steps.seedSelectionBn },
    { labelBn: '০৩. বীজ শোধন নির্দেশনা', contentBn: selectedCrop.steps.seedTreatmentBn },
    { labelBn: '০৪. বীজ বপন ও চারা রোপণ', contentBn: selectedCrop.steps.sowingPlantingBn },
    { labelBn: '০৫. সার প্রয়োগ ব্যবস্থাপনা', contentBn: selectedCrop.steps.fertilizerBn },
    { labelBn: '০৬. সেচ ও পানি ব্যবস্থাপনা', contentBn: selectedCrop.steps.irrigationBn },
    { labelBn: '০৭. আগাছা নিয়ন্ত্রণ ও পরিচর্যা', contentBn: selectedCrop.steps.weedControlBn },
    { labelBn: '০৮. রোগ ও পোকামাকড় ব্যবস্থাপনা', contentBn: selectedCrop.steps.pestControlBn },
    { labelBn: '০৯. ফসল সংগ্রহ ও সংরক্ষণ', contentBn: selectedCrop.steps.harvestingStorageBn },
  ];

  const isSaved = savedCropIds.includes(selectedCrop.id);

  return (
    <div className="space-y-6 pb-12">
      <section className="bg-white rounded-2xl p-6 border border-stone-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#14532D]">
              ফসল পরিচিতি ও আধুনিক চাষাবাদ নির্দেশিকা
            </h1>
            <p className="text-sm text-stone-600 mt-0.5">
              জমি প্রস্তুত, বীজ শোধন, সার ও সেচ থেকে শুরু করে ফসল সংগ্রহ ও সংরক্ষণের পূর্ণাঙ্গ ধাপ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-[#166534] text-white'
                    : 'bg-[#F5F8F1] text-[#173B2A] hover:bg-[#DCFCE7]/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 relative max-w-md">
          <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ফসলের নাম খুঁজুন (যেমন: ধান, আলু, সরিষা, পেঁয়াজ)..."
            aria-label="ফসল খুঁজুন"
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F5F8F1] border border-stone-200 text-sm"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List of Crops */}
        <div className="lg:col-span-4 space-y-3">
          {filteredCrops.map((crop) => {
            const active = crop.id === selectedCrop.id;
            return (
              <button
                key={crop.id}
                type="button"
                onClick={() => onSelectCrop(crop)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3.5 cursor-pointer ${
                  active
                    ? 'bg-white border-[#166534] ring-2 ring-[#166534]/15'
                    : 'bg-white border-stone-200 hover:border-[#166534]/60'
                }`}
              >
                <CropVisualCard visualType={crop.visualType} className="w-12 h-12" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-stone-500">
                    {crop.categoryBn} · {crop.durationBn}
                  </div>
                  <h2 className="text-base font-bold text-[#173B2A] truncate mt-0.5">
                    {crop.nameBn}
                  </h2>
                  <p className="text-xs text-[#166534] truncate mt-0.5">{crop.seasonBn}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Detailed Crop Guide (7.1, 7.2, 7.3) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200">
            <div className="flex items-center gap-4">
              <CropVisualCard visualType={selectedCrop.visualType} className="w-16 h-16" />
              <div>
                <div className="text-xs text-stone-500">
                  {selectedCrop.categoryBn} · বৈজ্ঞানিক নাম: {selectedCrop.scientificName}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#14532D] mt-0.5">
                  {selectedCrop.nameBn}
                </h2>
                <div className="text-xs text-[#166534] font-medium mt-1">
                  তথ্যসূত্র: {selectedCrop.referenceSourceBn}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  onSpeakText(
                    `${selectedCrop.nameBn}। উপযুক্ত মৌসুম ${selectedCrop.seasonBn}। উপযুক্ত মাটি ${selectedCrop.soilBn}। জমি প্রস্তুতি: ${selectedCrop.steps.landPrepBn}`
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-[#F5F8F1] hover:bg-[#DCFCE7] text-[#166534] text-xs font-semibold border border-stone-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>শুনুন</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleSaveCrop(selectedCrop.id)}
                className="px-3.5 py-2 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                <span>{isSaved ? 'সংরক্ষিত ফসল' : 'সংরক্ষণ করুন'}</span>
              </button>
            </div>
          </div>

          {/* 7.1 ফসলের পরিচিতি ও ৭.৩ উৎপাদন তথ্য */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div className="p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-200/80">
              <div className="text-xs text-stone-500">উপযুক্ত মৌসুম ও জীবনকাল</div>
              <div className="text-sm font-bold text-[#173B2A] mt-0.5">{selectedCrop.seasonBn}</div>
              <div className="text-xs text-[#166534] mt-0.5">{selectedCrop.durationBn}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-200/80">
              <div className="text-xs text-stone-500">উপযুক্ত মাটি ও আবহাওয়া</div>
              <div className="text-sm font-bold text-[#173B2A] mt-0.5">{selectedCrop.soilBn}</div>
              <div className="text-xs text-stone-600 mt-0.5">{selectedCrop.climateBn}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-200/80">
              <div className="text-xs text-stone-500">বপন ও সংগ্রহের সময়</div>
              <div className="text-xs font-semibold text-[#173B2A] mt-0.5">
                বপন: {selectedCrop.sowingTimeBn}
              </div>
              <div className="text-xs font-semibold text-[#166534] mt-0.5">
                সংগ্রহ: {selectedCrop.harvestTimeBn}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-200/80">
              <div className="text-xs text-stone-500">সম্ভাব্য ফলন (আনুমানিক)</div>
              <div className="text-sm font-bold text-[#14532D] mt-0.5">
                {selectedCrop.estimatedYieldBn}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-200/80">
              <div className="text-xs text-stone-500">সাধারণ চাষাবাদ খরচ (আনুমানিক)</div>
              <div className="text-sm font-bold text-[#173B2A] mt-0.5">
                {selectedCrop.estimatedCostPerBighaBn}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-200/80">
              <div className="text-xs text-stone-500">সম্ভাব্য বাজার চাহিদা</div>
              <div className="text-xs font-semibold text-[#173B2A] mt-0.5">
                {selectedCrop.marketDemandBn}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              বিশেষ দ্রষ্টব্য: ফলন ও খরচের হিসাব অঞ্চল, মাটির উর্বরতা, আবহাওয়া ও ব্যবস্থাপনার ওপর নির্ভরশীল; এগুলোকে নিশ্চয়তা হিসেবে নয় বরং আনুমানিক ধারণা হিসেবে বিবেচনা করুন।
            </span>
          </div>

          {/* 7.2 চাষাবাদের ধাপসমূহ */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#14532D] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#166534]" />
              <span>ধাপে ধাপে চাষাবাদ পদ্ধতি</span>
            </h3>

            <div className="grid grid-cols-1 gap-3.5">
              {stepItems.map((step, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200/80 space-y-1"
                >
                  <h4 className="text-sm font-bold text-[#14532D]">{step.labelBn}</h4>
                  <p className="text-sm text-[#173B2A] leading-relaxed">{step.contentBn}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DiseasesViewProps {
  diseases: CropDiseaseItem[];
}

export const DiseasesView: React.FC<DiseasesViewProps> = ({ diseases }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('সব রোগ');
  const [selectedDisease, setSelectedDisease] = useState<CropDiseaseItem>(diseases[0]);

  // 8.3 Leaf image & symptom diagnosis state
  const [diagCrop, setDiagCrop] = useState('আমন ও বোরো ধান');
  const [diagSymptoms, setDiagSymptoms] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagResult, setDiagResult] = useState<any | null>(null);
  const [diagError, setDiagError] = useState<string | null>(null);

  const categories = [
    'সব রোগ',
    'ধানের রোগ',
    'সবজির রোগ',
    'গম ও ভুট্টার রোগ',
    'ডাল ও তেলবীজের রোগ',
  ];

  const filteredDiseases = diseases.filter(
    (d) => selectedCategory === 'সব রোগ' || d.categoryBn === selectedCategory
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onloadend = () => {
      const resultStr = reader.result as string;
      setImagePreview(resultStr);
      const base64Part = resultStr.split(',')[1] || '';
      setImageBase64(base64Part);
    };
    reader.readAsDataURL(file);
  };

  const handleRunDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagSymptoms.trim() && !imageBase64) {
      setDiagError('অনুগ্রহ করে আক্রান্ত পাতার লক্ষণ লিখুন অথবা একটি ছবি যুক্ত করুন।');
      return;
    }

    setDiagnosing(true);
    setDiagError(null);
    try {
      const res = await apiFetch('/api/diseases/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropNameBn: diagCrop,
          symptomsDescriptionBn: diagSymptoms,
          imageBase64,
          mimeType: imageMime,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'রোগ শনাক্তকরণে সমস্যা হয়েছে');
      }
      setDiagResult(data);
    } catch (err: any) {
      setDiagError(err.message || 'সার্ভারের সাথে সংযোগ করা যায়নি।');
    } finally {
      setDiagnosing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Category Tabs */}
      <section className="bg-white rounded-2xl p-6 border border-stone-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#14532D]">
              ফসলের রোগবালাই, পোকামাকড় ও সমন্বিত প্রতিকার
            </h1>
            <p className="text-sm text-stone-600 mt-0.5">
              রোগের লক্ষণ চিনে প্রতিরোধমূলক ব্যবস্থা নিন এবং বিশেষজ্ঞের পরামর্শ অনুযায়ী পরিচর্যা করুন
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                const first = diseases.find((d) => cat === 'সব রোগ' || d.categoryBn === cat);
                if (first) setSelectedDisease(first);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#166534] text-white'
                  : 'bg-[#F5F8F1] text-[#173B2A] hover:bg-[#DCFCE7]/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* 8.1 & 8.2 Disease Directory & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 space-y-3">
          {filteredDiseases.map((dis) => {
            const active = dis.id === selectedDisease.id;
            return (
              <button
                key={dis.id}
                type="button"
                onClick={() => setSelectedDisease(dis)}
                className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                  active
                    ? 'bg-white border-[#166534] ring-2 ring-[#166534]/15'
                    : 'bg-white border-stone-200 hover:border-[#166534]/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>{dis.categoryBn}</span>
                  <span
                    className={
                      dis.severity === 'উচ্চ ঝুঁকি'
                        ? 'text-red-700 font-semibold'
                        : 'text-amber-700 font-semibold'
                    }
                  >
                    {dis.severity}
                  </span>
                </div>
                <h2 className="text-base font-bold text-[#173B2A] mt-1">{dis.nameBn}</h2>
                <p className="text-xs text-[#166534] mt-1">আক্রান্ত ফসল: {dis.affectedCropBn}</p>
              </button>
            );
          })}
        </div>

        {/* Selected Disease Detail */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 space-y-5">
          <div className="pb-4 border-b border-stone-200">
            <div className="text-xs text-stone-500">
              {selectedDisease.categoryBn} · আক্রান্ত ফসল: {selectedDisease.affectedCropBn} ·{' '}
              <span className="font-semibold text-red-700">{selectedDisease.severity}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#14532D] mt-1">
              {selectedDisease.nameBn}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              তথ্যসূত্র: {selectedDisease.referenceSourceBn}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200/80">
              <div className="text-xs font-bold text-[#14532D]">রোগের সম্ভাব্য কারণ</div>
              <p className="text-xs sm:text-sm text-[#173B2A] mt-1 leading-relaxed">
                {selectedDisease.causeBn}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200/80">
              <div className="text-xs font-bold text-[#14532D]">ছড়িয়ে পড়ার পরিস্থিতি</div>
              <p className="text-xs sm:text-sm text-[#173B2A] mt-1 leading-relaxed">
                {selectedDisease.spreadConditionBn}
              </p>
            </div>
          </div>

          {/* Symptoms */}
          <div className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200/80">
            <h3 className="text-sm font-bold text-[#14532D] mb-2">প্রধান লক্ষণসমূহ</h3>
            <ul className="space-y-1.5 text-sm text-[#173B2A]">
              {selectedDisease.symptomsBn.map((sym, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-bold text-[#166534]">·</span>
                  <span>{sym}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Prevention & Care */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200/80">
              <h3 className="text-sm font-bold text-[#166534] mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>প্রতিরোধের উপায়</span>
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-[#173B2A]">
                {selectedDisease.preventionBn.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="font-bold text-[#166534]">·</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200/80">
              <h3 className="text-sm font-bold text-[#14532D] mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>আক্রান্ত ফসলের পরিচর্যা ও প্রতিকার</span>
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-[#173B2A]">
                {selectedDisease.careAndManagementBn.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="font-bold text-[#166534]">·</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Expert Advice Callout */}
          <div className="p-4 rounded-xl bg-[#DCFCE7]/50 border border-[#166534]/30 text-sm text-[#14532D]">
            <span className="font-bold">বিশেষজ্ঞের পরামর্শ: </span>
            {selectedDisease.expertAdviceBn}
          </div>
        </div>
      </div>

      {/* 8.3 ছবি ও লক্ষণ দিয়ে সম্ভাব্য রোগ শনাক্তকরণ (Leaf Diagnosis Tool) */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200">
        <div className="pb-4 border-b border-stone-200">
          <h2 className="text-lg sm:text-xl font-bold text-[#14532D] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#166534]" />
            <span>ছবি ও লক্ষণ দিয়ে সম্ভাব্য রোগ শনাক্তকরণ</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            আক্রান্ত পাতার ছবি আপলোড করুন অথবা লক্ষণের বিবরণ দিন — সিস্টেম সম্ভাব্য রোগ ও প্রাথমিক করণীয় জানাবে
          </p>
        </div>

        <form onSubmit={handleRunDiagnosis} className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
          <div className="lg:col-span-6 space-y-4">
            <div>
              <label htmlFor="diag-crop-select" className="block text-sm font-semibold text-[#173B2A] mb-1">
                আক্রান্ত ফসল নির্বাচন করুন
              </label>
              <select
                id="diag-crop-select"
                value={diagCrop}
                onChange={(e) => setDiagCrop(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-medium"
              >
                <option value="আমন ও বোরো ধান">আমন ও বোরো ধান</option>
                <option value="আলু ও টমেটো">আলু ও টমেটো</option>
                <option value="বেগুন">বেগুন</option>
                <option value="সরিষা">সরিষা</option>
                <option value="ভুট্টা">ভুট্টা</option>
              </select>
            </div>

            <div>
              <label htmlFor="diag-symptoms-input" className="block text-sm font-semibold text-[#173B2A] mb-1">
                রোগের লক্ষণ সংক্ষেপে লিখুন
              </label>
              <textarea
                id="diag-symptoms-input"
                rows={3}
                value={diagSymptoms}
                onChange={(e) => setDiagSymptoms(e.target.value)}
                placeholder="যেমন: ধানের পাতায় চোখের মতো বাদামি দাগ এবং শীষের গোড়া কালো হয়ে ভেঙে পড়ছে..."
                className="w-full p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm text-[#173B2A]"
              />
            </div>

            <div>
              <label htmlFor="leaf-photo-upload" className="block text-sm font-semibold text-[#173B2A] mb-1">
                আক্রান্ত পাতার ছবি যুক্ত করুন (ঐচ্ছিক)
              </label>
              <div className="flex items-center gap-4">
                <label
                  htmlFor="leaf-photo-upload"
                  className="px-4 py-2.5 rounded-xl bg-[#F5F8F1] hover:bg-[#DCFCE7] border border-stone-300 text-xs font-semibold text-[#173B2A] flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-[#166534]" />
                  <span>ছবি নির্বাচন করুন</span>
                </label>
                <input
                  id="leaf-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="আপলোড করা আক্রান্ত পাতার প্রিভিউ"
                    className="w-12 h-12 rounded-lg object-cover border border-stone-300"
                  />
                )}
              </div>
            </div>

            {diagError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                {diagError}
              </div>
            )}

            <button
              type="submit"
              disabled={diagnosing}
              className="px-5 py-3 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-60"
            >
              {diagnosing ? 'লক্ষণ বিশ্লেষণ করা হচ্ছে...' : 'সম্ভাব্য রোগ যাচাই করুন'}
            </button>
          </div>

          {/* Diagnosis Result Panel */}
          <div className="lg:col-span-6 bg-[#F5F8F1] rounded-2xl p-5 border border-stone-200 flex flex-col justify-between">
            {diagResult ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-[#166534]">প্রাথমিক বিশ্লেষণ ফলাফল</div>
                  <h3 className="text-lg font-bold text-[#14532D] mt-0.5">
                    {diagResult.probableDiseaseBn}
                  </h3>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#173B2A] mb-1">মিলে যাওয়া লক্ষণসমূহ:</h4>
                  <ul className="space-y-1 text-xs text-stone-700">
                    {(diagResult.matchingSymptomsBn || []).map((s: string, idx: number) => (
                      <li key={idx}>· {s}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#166534] mb-1">প্রাথমিক পরিচর্যা ও করণীয়:</h4>
                  <ul className="space-y-1 text-xs text-[#173B2A]">
                    {(diagResult.immediateOrganicStepsBn || []).map((st: string, idx: number) => (
                      <li key={idx}>· {st}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>{diagResult.disclaimerBn}</span>
                </div>
              </div>
            ) : (
              <div className="my-auto text-center py-8 space-y-2">
                <ShieldAlert className="w-10 h-10 text-[#166534] mx-auto opacity-75" />
                <h3 className="text-sm font-bold text-[#173B2A]">
                  লক্ষণ লিখে বা ছবি দিয়ে সম্ভাব্য রোগ মিলিয়ে দেখুন
                </h3>
                <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                  বিশেষ দ্রষ্টব্য: স্বয়ংক্রিয় ফলাফলকে চূড়ান্ত বা নিশ্চিত রোগনির্ণয় বলা যাবে না। যেকোনো কীটনাশক বা রাসায়নিক ব্যবহারের আগে অনুমোদিত নির্দেশনা ও কৃষি বিশেষজ্ঞের পরামর্শ নিন।
                </p>
              </div>
            )}
          </div>
        </form>
      </section>
    </div>
  );
};
