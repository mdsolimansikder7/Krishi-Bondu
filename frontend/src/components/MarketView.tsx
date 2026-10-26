import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Search,
  Bookmark,
  BookmarkCheck,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  Scale,
  Info,
} from 'lucide-react';
import {
  MarketPriceItem,
  DistrictLocation,
  DivisionEntity,
  DistrictEntity,
  UpazilaEntity,
} from '@shared/types';
import { toBengaliNumber } from '@shared/utils/calculations';
import { CropVisualCard } from './CropVisualCard';
import { CascadingLocationSelector } from './CascadingLocationSelector';

interface MarketViewProps {
  marketPrices: MarketPriceItem[];
  districts: DistrictLocation[];
  divisions?: DivisionEntity[];
  districtEntities?: DistrictEntity[];
  upazilaEntities?: UpazilaEntity[];
  savedPriceIds: string[];
  onToggleSavePrice: (id: string) => void;
}

export const MarketView: React.FC<MarketViewProps> = ({
  marketPrices,
  divisions = [],
  districtEntities = [],
  upazilaEntities = [],
  savedPriceIds,
  onToggleSavePrice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('সব বিভাগ');
  const [filterDivId, setFilterDivId] = useState<string>('');
  const [filterDistId, setFilterDistId] = useState<string>('');
  const [filterUpzId, setFilterUpzId] = useState<string>('');
  const [compareCropName, setCompareCropName] = useState<string>('আলু (ডায়মন্ট / কার্ডিনাল)');

  const categories = ['সব বিভাগ', 'ধান ও শস্য', 'সবজি', 'মসলা ও তেলবীজ', 'ফল ও অর্থকরী'];

  const filteredPrices = useMemo(() => {
    const selectedDivObj = divisions.find((d) => d.id === filterDivId);
    const selectedDistObj = districtEntities.find((d) => d.id === filterDistId);
    const selectedUpzObj = upazilaEntities.find((u) => u.id === filterUpzId);

    return marketPrices.filter((item) => {
      // Only show published or verified prices in public view
      if (
        item.workflowStatus &&
        item.workflowStatus !== 'Published' &&
        item.workflowStatus !== 'Approved'
      ) {
        return false;
      }

      const matchesSearch =
        !searchQuery.trim() ||
        item.cropNameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.marketNameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.districtBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.upazilaBn.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat =
        selectedCategory === 'সব বিভাগ' || item.categoryBn === selectedCategory;

      const matchesDiv =
        !filterDivId ||
        item.divisionId === filterDivId ||
        (selectedDivObj && item.divisionBn === selectedDivObj.nameBn);

      const matchesDist =
        !filterDistId ||
        item.districtId === filterDistId ||
        (selectedDistObj && item.districtBn === selectedDistObj.nameBn);

      const matchesUpz =
        !filterUpzId ||
        item.upazilaId === filterUpzId ||
        (selectedUpzObj && item.upazilaBn === selectedUpzObj.nameBn);

      return matchesSearch && matchesCat && matchesDiv && matchesDist && matchesUpz;
    });
  }, [
    marketPrices,
    searchQuery,
    selectedCategory,
    filterDivId,
    filterDistId,
    filterUpzId,
    divisions,
    districtEntities,
    upazilaEntities,
  ]);

  const uniqueCropNames = useMemo(() => {
    return Array.from(new Set(marketPrices.map((m) => m.cropNameBn)));
  }, [marketPrices]);

  const comparisonItems = useMemo(() => {
    return marketPrices.filter((m) => m.cropNameBn === compareCropName);
  }, [marketPrices, compareCropName]);

  const dayLabelsBn = [
    '৬ দিন আগে',
    '৫ দিন আগে',
    '৪ দিন আগে',
    '৩ দিন আগে',
    '২ দিন আগে',
    'গতকাল',
    'আজ',
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Filter Bar */}
      <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#14532D]">
              ফসলের দৈনিক বাজারদর ও মূল্য তুলনা
            </h1>
            <p className="text-sm text-stone-600 mt-0.5">
              বিভাগ, জেলা, উপজেলা, বাজার ও ফসল অনুযায়ী যাচাইকৃত পাইকারি ও খুচরা দর
            </p>
          </div>
          <div className="text-xs text-stone-600 bg-[#F5F8F1] px-3.5 py-2 rounded-xl border border-stone-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
            <span>যাচাইকৃত উৎস ছাড়া অনুমানভিত্তিক দাম দেখানো হয় না</span>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
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

        {/* 7.3 Cascading Location Filter (বিভাগ → জেলা → উপজেলা) */}
        {divisions.length > 0 && (
          <div className="pt-2">
            <CascadingLocationSelector
              divisions={divisions}
              districts={districtEntities}
              upazilas={upazilaEntities}
              selectedDivisionId={filterDivId}
              selectedDistrictId={filterDistId}
              selectedUpazilaId={filterUpzId}
              onChange={(sel) => {
                setFilterDivId(sel.divisionId);
                setFilterDistId(sel.districtId);
                setFilterUpzId(sel.upazilaId);
              }}
              allowAll
              showSearch={false}
              compact
              idPrefix="market-filter-loc"
            />
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ফসলের নাম (যেমন: ধান, আলু, পেঁয়াজ, সরিষা) বা বাজারের নাম লিখুন..."
            aria-label="বাজারদর অনুসন্ধান"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F5F8F1] border border-stone-200 text-sm text-[#173B2A] focus:bg-white focus:border-[#166534] focus:outline-none"
          />
        </div>
      </section>

      {/* 6.2 Market Price Cards / Data Table */}
      <section className="bg-white rounded-2xl p-6 border border-stone-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <h2 className="text-lg font-bold text-[#14532D]">
            বাজারদরের তালিকা ({toBengaliNumber(filteredPrices.length)}টি ফলাফল)
          </h2>
          <span className="text-xs text-stone-500">একক ও উৎসসহ সর্বশেষ হালনাগাদকৃত মূল্য</span>
        </div>

        {filteredPrices.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-base font-semibold text-[#173B2A]">
              আপনার নির্বাচিত ফিল্টারে কোনো বাজারদর পাওয়া যায়নি।
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('সব বিভাগ');
                setFilterDivId('');
                setFilterDistId('');
                setFilterUpzId('');
              }}
              className="px-4 py-2 rounded-xl bg-[#166534] text-white text-xs font-semibold cursor-pointer"
            >
              সব ফিল্টার মুছে ফেলুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {filteredPrices.map((item) => {
              const diff = item.wholesalePrice - item.yesterdayWholesale;
              const isSaved = savedPriceIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-[#F5F8F1] border border-stone-200/90 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <CropVisualCard visualType={item.visualType} className="w-12 h-12" />
                        <div>
                          <div className="text-xs text-stone-500">
                            {item.categoryBn} · {item.districtBn} ({item.upazilaBn})
                          </div>
                          <h3 className="text-base font-bold text-[#173B2A] mt-0.5">
                            {item.cropNameBn}
                          </h3>
                          <div className="text-xs font-medium text-[#166534] mt-0.5">
                            বাজার: {item.marketNameBn} · একক: {item.unitBn}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleSavePrice(item.id)}
                        aria-label={`${item.cropNameBn} বাজারদর সংরক্ষণ করুন`}
                        className="p-2 rounded-xl bg-white border border-stone-200 text-[#166534] hover:bg-[#DCFCE7] transition-colors cursor-pointer"
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-4 h-4 fill-current" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Price Grid */}
                    <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-stone-200/70">
                      <div className="bg-white p-3 rounded-xl border border-stone-200/60">
                        <div className="text-[11px] text-stone-500">পাইকারি মূল্য</div>
                        <div className="text-lg font-bold text-[#166534] font-mono-tabular mt-0.5">
                          ৳ {toBengaliNumber(item.wholesalePrice)}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-stone-200/60">
                        <div className="text-[11px] text-stone-500">খুচরা মূল্য</div>
                        <div className="text-lg font-bold text-[#173B2A] font-mono-tabular mt-0.5">
                          ৳ {toBengaliNumber(item.retailPrice)}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-stone-200/60">
                        <div className="text-[11px] text-stone-500">গতকালের তুলনায়</div>
                        <div className="text-sm font-bold font-mono-tabular mt-1 flex items-center gap-1">
                          {diff > 0 ? (
                            <span className="text-amber-700 flex items-center">
                              <ArrowUpRight className="w-4 h-4" /> +৳{toBengaliNumber(diff)}
                            </span>
                          ) : diff < 0 ? (
                            <span className="text-[#166534] flex items-center">
                              <ArrowDownRight className="w-4 h-4" /> -৳
                              {toBengaliNumber(Math.abs(diff))}
                            </span>
                          ) : (
                            <span className="text-stone-600 flex items-center">
                              <Minus className="w-3.5 h-3.5 mr-0.5" /> অপরিবর্তিত
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Footer */}
                  <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-600">
                    <span>উৎস: {item.sourceBn}</span>
                    <span>
                      {item.verified ? 'যাচাইকৃত তথ্য' : 'পর্যালোচনাধীন'} · {item.updatedAtBn}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 6.3 বাজারদরের তুলনা ও গত ৭ দিনের মূল্য পরিবর্তন চার্ট */}
      <section className="bg-white rounded-2xl p-6 border border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-[#166534]" />
            <div>
              <h2 className="text-lg font-bold text-[#14532D]">
                বিভিন্ন বাজারের দাম তুলনা ও গত ৭ দিনের মূল্য প্রবণতা
              </h2>
              <p className="text-xs text-stone-600">
                পাইকারি ও খুচরা দামের পার্থক্য এবং সাপ্তাহিক ওঠানামা দেখুন
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="compare-crop-select" className="sr-only">
              তুলনার জন্য ফসল নির্বাচন করুন
            </label>
            <select
              id="compare-crop-select"
              value={compareCropName}
              onChange={(e) => setCompareCropName(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-semibold text-[#173B2A]"
            >
              {uniqueCropNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
          {/* Market Comparison Table */}
          <div className="lg:col-span-6 space-y-3">
            <h3 className="text-sm font-bold text-[#173B2A]">
              একই পণ্যের বাজারভিত্তিক তুলনা ({compareCropName})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-xs text-stone-500">
                    <th className="py-2">বাজার ও জেলা</th>
                    <th className="py-2 text-right">পাইকারি</th>
                    <th className="py-2 text-right">খুচরা</th>
                    <th className="py-2 text-right">পার্থক্য</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {comparisonItems.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2.5">
                        <div className="font-semibold text-[#173B2A]">{c.marketNameBn}</div>
                        <div className="text-xs text-stone-500">{c.districtBn}</div>
                      </td>
                      <td className="py-2.5 text-right font-mono-tabular font-bold text-[#166534]">
                        ৳ {toBengaliNumber(c.wholesalePrice)}
                      </td>
                      <td className="py-2.5 text-right font-mono-tabular font-semibold">
                        ৳ {toBengaliNumber(c.retailPrice)}
                      </td>
                      <td className="py-2.5 text-right font-mono-tabular text-xs text-stone-600">
                        ৳ {toBengaliNumber(c.retailPrice - c.wholesalePrice)} ({c.unitBn})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 7-Day Price Trend Bar Visualization */}
          <div className="lg:col-span-6 bg-[#F5F8F1] p-5 rounded-xl border border-stone-200/80">
            {comparisonItems[0] && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#173B2A]">
                      গত ৭ দিনের পাইকারি মূল্য চার্ট ({comparisonItems[0].marketNameBn})
                    </h3>
                    <p className="text-xs text-stone-500">একক: প্রতি {comparisonItems[0].unitBn}</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-[#166534]" />
                </div>

                <div className="grid grid-cols-7 gap-2 items-end h-36 pt-6 pb-2">
                  {comparisonItems[0].sevenDayHistory.map((val, idx) => {
                    const maxVal = Math.max(...comparisonItems[0].sevenDayHistory, 1);
                    const minVal = Math.min(...comparisonItems[0].sevenDayHistory) * 0.85;
                    const heightPct = Math.max(
                      25,
                      Math.min(
                        100,
                        Math.round(((val - minVal) / (maxVal - minVal || 1)) * 80 + 20)
                      )
                    );
                    return (
                      <div key={idx} className="min-w-0 flex flex-col items-center h-full justify-end">
                        <span className="text-[11px] font-bold text-[#14532D] font-mono-tabular mb-1">
                          ৳{toBengaliNumber(val)}
                        </span>
                        <div
                          className={`w-full rounded-t-lg transition-all ${
                            idx === 6 ? 'bg-[#166534]' : 'bg-[#166534]/45'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[10px] text-stone-600 mt-1.5 text-center leading-tight">
                          {dayLabelsBn[idx]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2 text-xs text-stone-500">
          <Info className="w-4 h-4 text-[#166534] shrink-0" />
          <span>
            কৃষি বিপণন অধিদপ্তর (DAM) এবং স্থানীয় আড়ত সমিতি থেকে সংগৃহীত তথ্যের ভিত্তিতে প্রতিদিন সকালে বাজারদর হালনাগাদ করা হয়।
          </span>
        </div>
      </section>
    </div>
  );
};
