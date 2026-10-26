import React, { useState, useMemo } from 'react';
import { apiFetch } from '../lib/api';
import {
  Search,
  Phone,
  Flag,
  Plus,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  ThumbsUp,
  Send,
  ShieldCheck,
} from 'lucide-react';
import {
  MarketplaceListing,
  QuestionAnswerItem,
  DistrictLocation,
  DivisionEntity,
  DistrictEntity,
  UpazilaEntity,
} from '@shared/types';
import { toBengaliNumber } from '@shared/utils/calculations';
import { CropVisualCard } from './CropVisualCard';
import { CascadingLocationSelector } from './CascadingLocationSelector';

interface MarketplaceViewProps {
  listings: MarketplaceListing[];
  districts: DistrictLocation[];
  divisions?: DivisionEntity[];
  districtEntities?: DistrictEntity[];
  upazilaEntities?: UpazilaEntity[];
  onAddListing: (
    listing: Omit<
      MarketplaceListing,
      'id' | 'status' | 'createdAtBn' | 'verifiedSeller' | 'sellerRoleBn'
    >
  ) => void;
  onReportListing: (id: string) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  listings,
  districts,
  divisions = [],
  districtEntities = [],
  upazilaEntities = [],
  onAddListing,
  onReportListing,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('সব জেলা');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'qty-desc'>(
    'newest'
  );
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [contactOpenId, setContactOpenId] = useState<string | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);

  // New Listing Form State with 3-tier location
  const [sellerNameBn, setSellerNameBn] = useState('মোঃ সোলায়মান শিকদার');
  const [cropNameBn, setCropNameBn] = useState('');
  const [categoryBn, setCategoryBn] = useState('ধান ও শস্য');
  const [quantity, setQuantity] = useState<number>(40);
  const [unitBn, setUnitBn] = useState('মণ');
  const [pricePerUnit, setPricePerUnit] = useState<number>(1260);
  const [postDivId, setPostDivId] = useState('div-rajshahi');
  const [postDistId, setPostDistId] = useState('dist-bogura');
  const [postUpzId, setPostUpzId] = useState('upz-shibganj');
  const [districtBn, setDistrictBn] = useState('বগুড়া');
  const [upazilaBn, setUpazilaBn] = useState('শিবগঞ্জ');
  const [harvestDateBn] = useState('চলতি সপ্তাহে সংগৃহীত');
  const [phoneBn, setPhoneBn] = useState('০১৭১২-০০১১২২');
  const [descriptionBn, setDescriptionBn] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const filteredAndSortedListings = useMemo(() => {
    const visible = listings.filter((item) => {
      if (
        item.status === 'reported' ||
        item.moderationStatus === 'Rejected' ||
        item.moderationStatus === 'Suspended'
      ) {
        return false;
      }
      const matchesSearch =
        !searchQuery.trim() ||
        item.cropNameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.districtBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.upazilaBn.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDist = districtFilter === 'সব জেলা' || item.districtBn === districtFilter;
      return matchesSearch && matchesDist;
    });

    if (sortBy === 'price-asc') {
      return [...visible].sort((a, b) => a.pricePerUnit - b.pricePerUnit);
    }
    if (sortBy === 'price-desc') {
      return [...visible].sort((a, b) => b.pricePerUnit - a.pricePerUnit);
    }
    if (sortBy === 'qty-desc') {
      return [...visible].sort((a, b) => b.quantity - a.quantity);
    }
    return visible;
  }, [listings, searchQuery, districtFilter, sortBy]);

  const handleSubmitListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropNameBn.trim() || !phoneBn.trim() || quantity <= 0 || pricePerUnit <= 0) {
      setFormError(
        'অনুগ্রহ করে ফসলের নাম, সঠিক পরিমাণ, মূল্য এবং যোগাযোগের নম্বর পূরণ করুন।'
      );
      return;
    }
    setFormError(null);
    onAddListing({
      sellerNameBn,
      cropNameBn: cropNameBn.trim(),
      categoryBn,
      quantity,
      unitBn,
      pricePerUnit,
      divisionId: postDivId,
      districtId: postDistId,
      upazilaId: postUpzId,
      districtBn,
      upazilaBn,
      harvestDateBn,
      phoneBn,
      descriptionBn:
        descriptionBn.trim() ||
        'নিজস্ব খামারে উৎপাদিত মানসম্মত ফসল সরাসরি পাইকারি বা খুচরা বিক্রি হবে।',
      visualType: categoryBn === 'সবজি' ? 'potato' : 'paddy',
    });
    setCropNameBn('');
    setDescriptionBn('');
    setShowPostForm(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Post Ad Action */}
      <section className="bg-white rounded-2xl p-6 border border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#14532D]">
              ফসল বিক্রির মার্কেটপ্লেস — কৃষক ও ক্রেতার সরাসরি সংযোগ
            </h1>
            <p className="text-sm text-stone-600 mt-0.5">
              যাচাইকৃত কৃষকদের কাছ থেকে সরাসরি ন্যায্য দামে ফসল কিনুন অথবা নিজের উৎপাদিত ফসল বিক্রির বিজ্ঞাপন দিন
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowPostForm((prev) => !prev)}
            className="px-5 py-3 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-sm font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{showPostForm ? 'ফর্ম বন্ধ করুন' : 'ফসল বিক্রির বিজ্ঞাপন দিন'}</span>
          </button>
        </div>

        {/* 11.1 কৃষকের বিজ্ঞাপন ফর্ম */}
        {showPostForm && (
          <form
            onSubmit={handleSubmitListing}
            className="mt-5 p-5 rounded-2xl bg-[#F5F8F1] border border-stone-200 space-y-4"
          >
            <h2 className="text-base font-bold text-[#14532D]">
              নতুন ফসল বিক্রির বিজ্ঞাপন যোগ করুন
            </h2>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                {formError}
              </div>
            )}

            {divisions.length > 0 && (
              <CascadingLocationSelector
                divisions={divisions}
                districts={districtEntities}
                upazilas={upazilaEntities}
                selectedDivisionId={postDivId}
                selectedDistrictId={postDistId}
                selectedUpazilaId={postUpzId}
                onChange={(sel) => {
                  setPostDivId(sel.divisionId);
                  setPostDistId(sel.districtId);
                  setPostUpzId(sel.upazilaId);
                  if (sel.district) setDistrictBn(sel.district.nameBn);
                  if (sel.upazila) setUpazilaBn(sel.upazila.nameBn);
                }}
                showSearch={false}
                compact
                idPrefix="mkt-post-loc"
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="mkt-crop-name"
                  className="block text-xs font-semibold text-[#173B2A] mb-1"
                >
                  ফসলের নাম *
                </label>
                <input
                  id="mkt-crop-name"
                  type="text"
                  value={cropNameBn}
                  onChange={(e) => setCropNameBn(e.target.value)}
                  placeholder="যেমন: ব্রি ধান-৪৯ বা ডায়মন্ট আলু"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="mkt-qty"
                  className="block text-xs font-semibold text-[#173B2A] mb-1"
                >
                  পরিমাণ ও একক *
                </label>
                <div className="flex gap-2">
                  <input
                    id="mkt-qty"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-sm font-mono-tabular"
                  />
                  <select
                    aria-label="একক"
                    value={unitBn}
                    onChange={(e) => setUnitBn(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white border border-stone-300 text-sm font-semibold"
                  >
                    <option value="মণ">মণ</option>
                    <option value="কেজি">কেজি</option>
                    <option value="বস্তা">বস্তা</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="mkt-price"
                  className="block text-xs font-semibold text-[#173B2A] mb-1"
                >
                  প্রতি এককের দাম (টাকা) *
                </label>
                <input
                  id="mkt-price"
                  type="number"
                  min={1}
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-sm font-mono-tabular"
                />
              </div>

              <div>
                <label
                  htmlFor="mkt-seller"
                  className="block text-xs font-semibold text-[#173B2A] mb-1"
                >
                  কৃষকের নাম
                </label>
                <input
                  id="mkt-seller"
                  type="text"
                  value={sellerNameBn}
                  onChange={(e) => setSellerNameBn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="mkt-phone"
                  className="block text-xs font-semibold text-[#173B2A] mb-1"
                >
                  যোগাযোগের মোবাইল নম্বর *
                </label>
                <input
                  id="mkt-phone"
                  type="text"
                  value={phoneBn}
                  onChange={(e) => setPhoneBn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="mkt-cat"
                  className="block text-xs font-semibold text-[#173B2A] mb-1"
                >
                  ফসলের বিভাগ
                </label>
                <select
                  id="mkt-cat"
                  value={categoryBn}
                  onChange={(e) => setCategoryBn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-sm font-semibold"
                >
                  <option value="ধান ও শস্য">ধান ও শস্য</option>
                  <option value="সবজি">সবজি</option>
                  <option value="মসলা ও তেলবীজ">মসলা ও তেলবীজ</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="mkt-desc"
                className="block text-xs font-semibold text-[#173B2A] mb-1"
              >
                বিক্রির বিবরণ ও সংগ্রহের সময়
              </label>
              <textarea
                id="mkt-desc"
                rows={2}
                value={descriptionBn}
                onChange={(e) => setDescriptionBn(e.target.value)}
                placeholder="ফসলের মান, আর্দ্রতা, বস্তা বা পরিবহনের সুবিধা সংক্ষেপে লিখুন..."
                className="w-full p-3 rounded-xl bg-white border border-stone-300 text-sm"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPostForm(false)}
                className="px-4 py-2 rounded-xl bg-white border border-stone-300 text-xs font-semibold text-stone-600"
              >
                বাতিল করুন
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#166534] text-white text-xs font-bold hover:bg-[#14532D] cursor-pointer"
              >
                বিজ্ঞাপন প্রকাশ করুন
              </button>
            </div>
          </form>
        )}

        {/* 11.2 ক্রেতার সার্চ ও ফিল্টার */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mt-5">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ফসল, জেলা বা উপজেলার নাম দিয়ে খুঁজুন..."
              aria-label="মার্কেটপ্লেস অনুসন্ধান"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F5F8F1] border border-stone-200 text-sm"
            />
          </div>

          <div className="sm:col-span-4">
            <label htmlFor="mkt-filter-district" className="sr-only">
              জেলা অনুযায়ী ফিল্টার
            </label>
            <select
              id="mkt-filter-district"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F8F1] border border-stone-200 text-sm font-semibold"
            >
              <option value="সব জেলা">সব জেলা</option>
              {districts.map((d) => (
                <option key={d.id} value={d.nameBn}>
                  {d.nameBn} জেলা
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="mkt-sort-select" className="sr-only">
              দাম বা পরিমাণ অনুযায়ী সাজান
            </label>
            <select
              id="mkt-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F8F1] border border-stone-200 text-sm font-semibold"
            >
              <option value="newest">সর্বশেষ বিজ্ঞাপন</option>
              <option value="price-asc">দাম (কম থেকে বেশি)</option>
              <option value="price-desc">দাম (বেশি থেকে কম)</option>
              <option value="qty-desc">পরিমাণ (বেশি থেকে কম)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredAndSortedListings.map((item) => {
          const isSaved = savedIds.includes(item.id);
          const isContactOpen = contactOpenId === item.id;
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-6 border border-stone-200 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <CropVisualCard visualType={item.visualType} className="w-14 h-14" />
                    <div>
                      <div className="text-xs text-stone-500">
                        {item.districtBn} · {item.upazilaBn} · {item.createdAtBn}
                      </div>
                      <h2 className="text-lg font-bold text-[#14532D] mt-0.5">{item.cropNameBn}</h2>
                      <div className="text-xs font-medium text-[#166534] flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          বিক্রেতা: {item.sellerNameBn} ({item.sellerRoleBn})
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSavedIds((prev) =>
                        prev.includes(item.id)
                          ? prev.filter((x) => x !== item.id)
                          : [...prev, item.id]
                      )
                    }
                    aria-label="বিজ্ঞাপন সংরক্ষণ করুন"
                    className="p-2 rounded-xl bg-[#F5F8F1] text-[#166534] hover:bg-[#DCFCE7] cursor-pointer"
                  >
                    {isSaved ? (
                      <BookmarkCheck className="w-4 h-4" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-200/80">
                  <div>
                    <div className="text-xs text-stone-500">বিক্রয়যোগ্য পরিমাণ</div>
                    <div className="text-base font-bold text-[#173B2A] font-mono-tabular mt-0.5">
                      {toBengaliNumber(item.quantity)} {item.unitBn}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-stone-500">প্রতি {item.unitBn} মূল্য</div>
                    <div className="text-lg font-bold text-[#166534] font-mono-tabular mt-0.5">
                      ৳ {toBengaliNumber(item.pricePerUnit)}
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#173B2A] mt-3 leading-relaxed">
                  {item.descriptionBn}
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                {isContactOpen ? (
                  <div className="px-3.5 py-2 rounded-xl bg-[#DCFCE7] text-[#14532D] text-xs sm:text-sm font-bold flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>মোবাইল: {item.phoneBn}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setContactOpenId(item.id)}
                    className="px-4 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    <span>কৃষকের সাথে যোগাযোগ করুন</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onReportListing(item.id)}
                  className="text-xs text-stone-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>অভিযোগ / রিপোর্ট করুন</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 11.3 নিরাপত্তা নির্দেশনা */}
      <section className="bg-white rounded-2xl p-5 border border-stone-200 flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 text-[#166534] shrink-0 mt-0.5" />
        <div className="text-xs text-stone-600 leading-relaxed">
          <strong className="text-[#14532D]">নিরাপদ লেনদেন নির্দেশনা:</strong> ফসল না দেখে বা ওজন যাচাই না করে অগ্রিম মোবাইল ব্যাংকিংয়ের মাধ্যমে টাকা পাঠাবেন না। সন্দেহজনক বা বিভ্রান্তিকর বিজ্ঞাপন দেখলে "অভিযোগ / রিপোর্ট করুন" বোতামে ক্লিক করে প্রশাসনিক পর্যালোচনার জন্য জানান।
        </div>
      </section>
    </div>
  );
};

interface QAViewProps {
  questions: QuestionAnswerItem[];
  districts: DistrictLocation[];
  divisions?: DivisionEntity[];
  districtEntities?: DistrictEntity[];
  upazilaEntities?: UpazilaEntity[];
  onRefreshQuestions: () => void;
}

export const QAView: React.FC<QAViewProps> = ({
  questions,
  divisions = [],
  districtEntities = [],
  upazilaEntities = [],
  onRefreshQuestions,
}) => {
  const [titleBn, setTitleBn] = useState('');
  const [detailsBn, setDetailsBn] = useState('');
  const [cropBn, setCropBn] = useState('আমন ও বোরো ধান');
  const [categoryBn, setCategoryBn] = useState<
    'রোগ ও পোকা' | 'সার ও মাটি' | 'বীজ ও চাষাবাদ' | 'আবহাওয়া ও সেচ'
  >('রোগ ও পোকা');
  const [qaDivId, setQaDivId] = useState('div-rajshahi');
  const [qaDistId, setQaDistId] = useState('dist-bogura');
  const [qaUpzId, setQaUpzId] = useState('upz-shibganj');
  const [districtBn, setDistrictBn] = useState('বগুড়া');
  const [upazilaBn, setUpazilaBn] = useState('শিবগঞ্জ');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleBn.trim() || !detailsBn.trim()) {
      setErrorMsg('অনুগ্রহ করে প্রশ্নের শিরোনাম এবং বিস্তারিত বিবরণ লিখুন।');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleBn: titleBn.trim(),
          detailsBn: detailsBn.trim(),
          cropBn,
          categoryBn,
          divisionId: qaDivId,
          districtId: qaDistId,
          upazilaId: qaUpzId,
          districtBn,
          upazilaBn,
        }),
      });
      if (!res.ok) throw new Error('প্রশ্ন জমা দিতে সমস্যা হয়েছে');
      setTitleBn('');
      setDetailsBn('');
      onRefreshQuestions();
    } catch (err: any) {
      setErrorMsg(err.message || 'প্রশ্ন জমা দেওয়া যায়নি');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <section className="bg-white rounded-2xl p-6 border border-stone-200">
        <h1 className="text-xl sm:text-2xl font-bold text-[#14532D]">
          কৃষি প্রশ্নোত্তর ও বিশেষজ্ঞ পরামর্শ
        </h1>
        <p className="text-sm text-stone-600 mt-0.5">
          ফসলের রোগবালাই, সার বা চাষাবাদ বিষয়ে আপনার প্রশ্ন জমা দিন এবং যাচাইকৃত কৃষি বিশেষজ্ঞদের উত্তর পান
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Submit Question Form */}
        <section className="lg:col-span-5 bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
          <h2 className="text-lg font-bold text-[#14532D] pb-3 border-b border-stone-200">
            নতুন কৃষি প্রশ্ন জমা দিন
          </h2>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAskQuestion} className="space-y-3.5">
            <div>
              <label htmlFor="qa-title" className="block text-xs font-semibold text-[#173B2A] mb-1">
                প্রশ্নের শিরোনাম *
              </label>
              <input
                id="qa-title"
                type="text"
                value={titleBn}
                onChange={(e) => setTitleBn(e.target.value)}
                placeholder="যেমন: আলু গাছের পাতা কুঁকড়ে যাচ্ছে, কী করণীয়?"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm"
              />
            </div>

            {divisions.length > 0 && (
              <CascadingLocationSelector
                divisions={divisions}
                districts={districtEntities}
                upazilas={upazilaEntities}
                selectedDivisionId={qaDivId}
                selectedDistrictId={qaDistId}
                selectedUpazilaId={qaUpzId}
                onChange={(sel) => {
                  setQaDivId(sel.divisionId);
                  setQaDistId(sel.districtId);
                  setQaUpzId(sel.upazilaId);
                  if (sel.district) setDistrictBn(sel.district.nameBn);
                  if (sel.upazila) setUpazilaBn(sel.upazila.nameBn);
                }}
                showSearch={false}
                compact
                idPrefix="qa-form-loc"
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="qa-crop" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  ফসল নির্বাচন
                </label>
                <select
                  id="qa-crop"
                  value={cropBn}
                  onChange={(e) => setCropBn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs font-semibold"
                >
                  <option value="আমন ও বোরো ধান">আমন ও বোরো ধান</option>
                  <option value="আলু">আলু</option>
                  <option value="সরিষা">সরিষা</option>
                  <option value="পেঁয়াজ ও রসুন">পেঁয়াজ ও রসুন</option>
                  <option value="বেগুন ও টমেটো">বেগুন ও টমেটো</option>
                  <option value="ভুট্টা ও গম">ভুট্টা ও গম</option>
                </select>
              </div>

              <div>
                <label htmlFor="qa-cat" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  প্রশ্নের বিভাগ
                </label>
                <select
                  id="qa-cat"
                  value={categoryBn}
                  onChange={(e) => setCategoryBn(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs font-semibold"
                >
                  <option value="রোগ ও পোকা">রোগ ও পোকা</option>
                  <option value="সার ও মাটি">সার ও মাটি</option>
                  <option value="বীজ ও চাষাবাদ">বীজ ও চাষাবাদ</option>
                  <option value="আবহাওয়া ও সেচ">আবহাওয়া ও সেচ</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="qa-details" className="block text-xs font-semibold text-[#173B2A] mb-1">
                বিস্তারিত বিবরণ *
              </label>
              <textarea
                id="qa-details"
                rows={4}
                value={detailsBn}
                onChange={(e) => setDetailsBn(e.target.value)}
                placeholder="গাছের বয়স, কী কী সার বা ওষুধ দিয়েছেন এবং লক্ষণগুলো বিস্তারিত লিখুন..."
                className="w-full p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'প্রশ্ন জমা হচ্ছে...' : 'প্রশ্ন পাঠান'}</span>
            </button>
          </form>
        </section>

        {/* Questions & Verified Expert Answers Feed */}
        <section className="lg:col-span-7 space-y-4">
          {questions.map((q) => {
            const totalHelpful = q.helpfulCount + (helpfulVotes[q.id] || 0);
            return (
              <div key={q.id} className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
                <div>
                  <div className="text-xs text-stone-500">
                    {q.categoryBn} · ফসল: {q.cropBn} · {q.districtBn} ({q.upazilaBn}) · {q.askedAtBn}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#14532D] mt-1">
                    {q.titleBn}
                  </h3>
                  <p className="text-sm text-[#173B2A] mt-1.5 leading-relaxed">{q.detailsBn}</p>
                  <div className="text-xs text-stone-500 mt-2">প্রশ্নকারী কৃষক: {q.askedByBn}</div>
                </div>

                {/* Expert Answers */}
                <div className="space-y-3 pt-3 border-t border-stone-100">
                  {q.answers.map((ans) => (
                    <div
                      key={ans.id}
                      className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200/90 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#166534]">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{ans.expertNameBn}</span>
                        </div>
                        <span className="text-[11px] text-stone-500">{ans.answeredAtBn}</span>
                      </div>
                      <div className="text-[11px] text-stone-600">{ans.expertTitleBn}</div>
                      <p className="text-sm text-[#173B2A] leading-relaxed">{ans.answerTextBn}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-stone-600">
                  <button
                    type="button"
                    onClick={() =>
                      setHelpfulVotes((prev) => ({ ...prev, [q.id]: (prev[q.id] || 0) + 1 }))
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F8F1] hover:bg-[#DCFCE7] text-[#166534] font-semibold cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>সহায়ক উত্তর ({toBengaliNumber(totalHelpful)})</span>
                  </button>
                  <span>রোগ নির্ণয়ে বিশেষজ্ঞের পরামর্শ অগ্রাধিকারপ্রাপ্ত</span>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
};
