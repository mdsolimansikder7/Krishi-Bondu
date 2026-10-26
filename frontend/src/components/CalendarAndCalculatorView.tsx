import React, { useState } from 'react';
import {
  Calendar,
  CheckSquare,
  Square,
  Plus,
  AlertTriangle,
  Sprout,
  Calculator,
  Scale,
  Coins,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react';
import { BanglaMonthCalendar, FarmingTaskItem } from '@shared/types';
import {
  toBengaliNumber,
  convertLandArea,
  calculateSeedRequirement,
  calculateFertilizerForArea,
  calculateProfitAndLoss,
  CROP_FERTILIZER_RATES,
} from '@shared/utils/calculations';

interface CalendarViewProps {
  months: BanglaMonthCalendar[];
  tasks: FarmingTaskItem[];
  onToggleTask: (id: string) => void;
  onAddTask: (titleBn: string, cropBn: string, dueDateBn: string, monthBn: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  months,
  tasks,
  onToggleTask,
  onAddTask,
}) => {
  // Default to Kartik (cal-7, October-November)
  const [selectedMonth, setSelectedMonth] = useState<BanglaMonthCalendar>(months[6] || months[0]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCrop, setNewTaskCrop] = useState('আমন ধান');
  const [newTaskDate, setNewTaskDate] = useState('২০ কার্তিক ১৪৩৩');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(
      newTaskTitle.trim(),
      newTaskCrop,
      newTaskDate,
      selectedMonth.monthNameBn.split(' ')[0]
    );
    setNewTaskTitle('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Month Selector Grid */}
      <section className="bg-white rounded-2xl p-6 border border-stone-200">
        <div className="pb-4 border-b border-stone-200">
          <h1 className="text-xl sm:text-2xl font-bold text-[#14532D]">
            বাংলা কৃষি ক্যালেন্ডার (১২ মাসের মৌসুমি কাজের তালিকা)
          </h1>
          <p className="text-sm text-stone-600 mt-0.5">
            বাংলা মাস ও কৃষি মৌসুম অনুযায়ী বীজ বপন, চারা রোপণ, সার, সেচ ও ফসল সংগ্রহের সময়সূচি
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 mt-4">
          {months.map((m) => {
            const active = m.id === selectedMonth.id;
            const shortName = m.monthNameBn.split(' ')[0];
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMonth(m)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? 'bg-[#166534] text-white border-[#166534]'
                    : 'bg-[#F5F8F1] text-[#173B2A] border-stone-200 hover:bg-[#DCFCE7]/60'
                }`}
              >
                <div className="text-sm font-bold">{shortName}</div>
                <div className={`text-[11px] mt-0.5 truncate ${active ? 'text-[#DCFCE7]' : 'text-stone-500'}`}>
                  {m.gregorianSpanBn}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected Month Details & Personal Farming Task Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 bg-white rounded-2xl p-6 border border-stone-200 space-y-5">
          <div className="pb-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-[#166534]">{selectedMonth.seasonBn}</span>
              <h2 className="text-xl font-bold text-[#14532D] mt-0.5">{selectedMonth.monthNameBn}</h2>
            </div>
            <Calendar className="w-7 h-7 text-[#166534]" />
          </div>

          <div>
            <h3 className="text-xs font-bold text-stone-500 mb-2">এই মাসের প্রধান ফসলসমূহ</h3>
            <div className="flex flex-wrap gap-2">
              {selectedMonth.keyCropsBn.map((c, idx) => (
                <span
                  key={idx}
                  className="text-xs font-semibold text-[#14532D] bg-[#F5F8F1] px-3 py-1.5 rounded-lg border border-stone-200"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200/80">
              <h3 className="text-sm font-bold text-[#14532D] mb-2">বীজ বপনের সম্ভাব্য সময়</h3>
              <ul className="space-y-1.5 text-xs sm:text-sm text-[#173B2A]">
                {selectedMonth.sowingTasksBn.map((t, i) => (
                  <li key={i}>· {t}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200/80">
              <h3 className="text-sm font-bold text-[#14532D] mb-2">চারা রোপণ ও জমি তৈরি</h3>
              <ul className="space-y-1.5 text-xs sm:text-sm text-[#173B2A]">
                {selectedMonth.plantingTasksBn.map((t, i) => (
                  <li key={i}>· {t}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200/80">
              <h3 className="text-sm font-bold text-[#14532D] mb-2">সার, সেচ ও আগাছা নিয়ন্ত্রণ</h3>
              <ul className="space-y-1.5 text-xs sm:text-sm text-[#173B2A]">
                {selectedMonth.fertilizerAndIrrigationBn.map((t, i) => (
                  <li key={i}>· {t}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#F5F8F1] border border-stone-200/80">
              <h3 className="text-sm font-bold text-[#14532D] mb-2">ফসল সংগ্রহ ও সংরক্ষণ</h3>
              <ul className="space-y-1.5 text-xs sm:text-sm text-[#173B2A]">
                {selectedMonth.harvestingTasksBn.map((t, i) => (
                  <li key={i}>· {t}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-950 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">মৌসুমি কৃষি সতর্কতা: </span>
              {selectedMonth.weatherCautionBn}
            </div>
          </div>
        </section>

        {/* Farmer's Personal Task Checklist & Reminder Builder */}
        <section className="lg:col-span-5 bg-white rounded-2xl p-6 border border-stone-200 space-y-5">
          <div className="pb-4 border-b border-stone-200">
            <h2 className="text-lg font-bold text-[#14532D]">আমার কৃষিকাজের তালিকা ও স্মরণবার্তা</h2>
            <p className="text-xs text-stone-600 mt-0.5">
              নিজের জমির কাজের তারিখ যোগ করুন এবং কাজ শেষ হলে টিক চিহ্ন দিন
            </p>
          </div>

          <form onSubmit={handleCreateTask} className="space-y-3 bg-[#F5F8F1] p-4 rounded-xl border border-stone-200">
            <div>
              <label htmlFor="new-task-title" className="block text-xs font-semibold text-[#173B2A] mb-1">
                নতুন কৃষিকাজের বিবরণ
              </label>
              <input
                id="new-task-title"
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="যেমন: আলু ক্ষেতে প্রথম সেচ ও ইউরিয়া সার প্রয়োগ..."
                className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="new-task-crop" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  ফসল
                </label>
                <input
                  id="new-task-crop"
                  type="text"
                  value={newTaskCrop}
                  onChange={(e) => setNewTaskCrop(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-xs"
                />
              </div>
              <div>
                <label htmlFor="new-task-date" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  সম্ভাব্য তারিখ
                </label>
                <input
                  id="new-task-date"
                  type="text"
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>কাজের তালিকায় যোগ করুন</span>
            </button>
          </form>

          <div className="space-y-2.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                  task.completed
                    ? 'bg-stone-50 border-stone-200 text-stone-400'
                    : 'bg-[#F5F8F1] border-stone-200 text-[#173B2A]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  aria-label={`${task.titleBn} কাজটি সম্পন্ন হিসেবে চিহ্নিত করুন`}
                  className="mt-0.5 text-[#166534] cursor-pointer"
                >
                  {task.completed ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-semibold ${
                      task.completed ? 'line-through text-stone-400' : 'text-[#173B2A]'
                    }`}
                  >
                    {task.titleBn}
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    {task.cropBn} · সময়: {task.dueDateBn} · {task.priority}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export const CalculatorView: React.FC = () => {
  // 10.1 Land Measurement State
  const [landInputVal, setLandInputVal] = useState<number>(33);
  const [landFromUnit, setLandFromUnit] = useState<'shotok' | 'bigha' | 'acre' | 'hectare'>('shotok');
  const [shotokPerBigha, setShotokPerBigha] = useState<number>(33);

  // 10.2 & 10.3 Seed & Fertilizer State
  const [selectedCropKey, setSelectedCropKey] = useState<string>('biri_dhan');
  const [calcAreaShotok, setCalcAreaShotok] = useState<number>(33);
  const [customSeedRateGrams, setCustomSeedRateGrams] = useState<number>(120);

  // 10.4 & 10.5 Cost & Profit/Loss State
  const [seedCost, setSeedCost] = useState<number>(1500);
  const [fertilizerCost, setFertilizerCost] = useState<number>(4200);
  const [laborCost, setLaborCost] = useState<number>(7500);
  const [irrigationCost, setIrrigationCost] = useState<number>(2200);
  const [landPrepCost, setLandPrepCost] = useState<number>(2800);
  const [transportCost, setTransportCost] = useState<number>(1000);
  const [otherCost, setOtherCost] = useState<number>(500);
  const [yieldQty, setYieldQty] = useState<number>(22); // e.g., 22 Maunds per Bigha
  const [sellingPricePerUnit, setSellingPricePerUnit] = useState<number>(1280); // 1280 BDT/Maund

  const landConverted = convertLandArea(landInputVal, landFromUnit, shotokPerBigha);
  const seedResult = calculateSeedRequirement(calcAreaShotok, customSeedRateGrams);
  const fertResult = calculateFertilizerForArea(selectedCropKey, calcAreaShotok);
  const profitResult = calculateProfitAndLoss(
    {
      seedCost,
      fertilizerCost,
      laborCost,
      irrigationCost,
      landPrepCost,
      transportCost,
      otherCost,
    },
    yieldQty,
    sellingPricePerUnit
  );

  return (
    <div className="space-y-6 pb-12">
      <section className="bg-white rounded-2xl p-6 border border-stone-200">
        <h1 className="text-xl sm:text-2xl font-bold text-[#14532D]">
          কৃষি ক্যালকুলেটর — জমি, বীজ, সার ও লাভ-ক্ষতির হিসাব
        </h1>
        <p className="text-sm text-stone-600 mt-0.5">
          বাংলাদেশের আঞ্চলিক বিঘার মাপ অনুযায়ী জমির হিসাব, অনুমোদিত সারের পরিমাণ এবং চাষাবাদের আয়-ব্যয় গণনা করুন
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 10.1 Land Measurement & 10.2/10.3 Seed & Fertilizer Calculator */}
        <div className="lg:col-span-6 space-y-6">
          {/* 10.1 জমির পরিমাপ */}
          <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200">
              <Scale className="w-5 h-5 text-[#166534]" />
              <div>
                <h2 className="text-lg font-bold text-[#14532D]">১. জমির পরিমাপ রূপান্তর</h2>
                <p className="text-xs text-stone-500">শতক, বিঘা, একর, হেক্টর ও কাঠার হিসাব</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="land-val-input" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  জমির পরিমাণ
                </label>
                <input
                  id="land-val-input"
                  type="number"
                  min={0}
                  step="any"
                  value={landInputVal}
                  onChange={(e) => setLandInputVal( parseFloat(e.target.value) || 0 )}
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-bold font-mono-tabular"
                />
              </div>

              <div>
                <label htmlFor="land-unit-select" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  একক নির্বাচন করুন
                </label>
                <select
                  id="land-unit-select"
                  value={landFromUnit}
                  onChange={(e) => setLandFromUnit(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-semibold"
                >
                  <option value="shotok">শতক (ডেসিমেল)</option>
                  <option value="bigha">বিঘা</option>
                  <option value="acre">একর</option>
                  <option value="hectare">হেক্টর</option>
                </select>
              </div>

              <div>
                <label htmlFor="regional-bigha-select" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  স্থানীয় ১ বিঘা = কত শতক?
                </label>
                <select
                  id="regional-bigha-select"
                  value={shotokPerBigha}
                  onChange={(e) => setShotokPerBigha(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs font-semibold"
                >
                  <option value={33}>৩৩ শতক (প্রমিত বিঘা)</option>
                  <option value={30}>৩০ শতক (ময়মনসিংহ অঞ্চল)</option>
                  <option value={40}>৪০ শতক (সিলেট অঞ্চল)</option>
                  <option value={50}>৫০ শতক (বড় বিঘা)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#F5F8F1] border border-stone-200 text-center">
                <div className="text-xs text-stone-500">শতক</div>
                <div className="text-lg font-bold text-[#14532D] font-mono-tabular mt-0.5">
                  {toBengaliNumber(landConverted.shotok)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#F5F8F1] border border-stone-200 text-center">
                <div className="text-xs text-stone-500">বিঘা ({toBengaliNumber(shotokPerBigha)} শতকে)</div>
                <div className="text-lg font-bold text-[#166534] font-mono-tabular mt-0.5">
                  {toBengaliNumber(landConverted.bigha)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#F5F8F1] border border-stone-200 text-center">
                <div className="text-xs text-stone-500">একর</div>
                <div className="text-lg font-bold text-[#173B2A] font-mono-tabular mt-0.5">
                  {toBengaliNumber(landConverted.acre)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#F5F8F1] border border-stone-200 text-center">
                <div className="text-xs text-stone-500">হেক্টর</div>
                <div className="text-lg font-bold text-[#173B2A] font-mono-tabular mt-0.5">
                  {toBengaliNumber(landConverted.hectare)}
                </div>
              </div>
            </div>
          </section>

          {/* 10.2 বীজের হিসাব ও 10.3 সার ও উপকরণের হিসাব */}
          <section className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200">
              <Sprout className="w-5 h-5 text-[#166534]" />
              <div>
                <h2 className="text-lg font-bold text-[#14532D]">২. বীজ ও সারের আনুমানিক হিসাব</h2>
                <p className="text-xs text-stone-500">ফসল ও জমির পরিমাণ (শতক) অনুযায়ী প্রয়োজনীয় উপকরণ</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="fert-crop-select" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  ফসল নির্বাচন করুন
                </label>
                <select
                  id="fert-crop-select"
                  value={selectedCropKey}
                  onChange={(e) => {
                    const key = e.target.value;
                    setSelectedCropKey(key);
                    if (CROP_FERTILIZER_RATES[key]) {
                      setCustomSeedRateGrams(CROP_FERTILIZER_RATES[key].seedGramsPerShotok);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-semibold"
                >
                  {Object.entries(CROP_FERTILIZER_RATES).map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="fert-area-shotok" className="block text-xs font-semibold text-[#173B2A] mb-1">
                  জমির পরিমাণ (শতক)
                </label>
                <input
                  id="fert-area-shotok"
                  type="number"
                  min={1}
                  value={calcAreaShotok}
                  onChange={(e) => setCalcAreaShotok(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-bold font-mono-tabular"
                />
              </div>
            </div>

            {/* Seed Output */}
            <div className="p-4 rounded-xl bg-[#DCFCE7]/40 border border-[#166534]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-[#14532D]">
                  আনুমানিক বীজের প্রয়োজন (প্রতি শতকে {toBengaliNumber(customSeedRateGrams)} গ্রাম হারে)
                </div>
                <div className="text-lg font-bold text-[#166534] font-mono-tabular mt-0.5">
                  মোট বীজ: {toBengaliNumber(seedResult.totalKg)} কেজি ({toBengaliNumber(seedResult.totalGrams)} গ্রাম)
                </div>
              </div>
              <div className="text-xs text-stone-600">
                ১০% অঙ্কুরোদগম নিরাপদ মজুদসহ: <strong className="font-mono-tabular">{toBengaliNumber(seedResult.recommendedBufferKg)} কেজি</strong>
              </div>
            </div>

            {/* Fertilizer Output Table */}
            <div>
              <h3 className="text-xs font-bold text-[#173B2A] mb-2">
                {toBengaliNumber(calcAreaShotok)} শতক জমির জন্য আনুমানিক সারের মাত্রা:
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-[#F5F8F1] border border-stone-200">
                  <div className="text-xs text-stone-500">ইউরিয়া (Urea)</div>
                  <div className="text-base font-bold text-[#14532D] font-mono-tabular mt-0.5">
                    {toBengaliNumber(fertResult.urea)} কেজি
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F8F1] border border-stone-200">
                  <div className="text-xs text-stone-500">টিএসপি (TSP)</div>
                  <div className="text-base font-bold text-[#14532D] font-mono-tabular mt-0.5">
                    {toBengaliNumber(fertResult.tsp)} কেজি
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F8F1] border border-stone-200">
                  <div className="text-xs text-stone-500">এমওপি / পটাশ (MoP)</div>
                  <div className="text-base font-bold text-[#14532D] font-mono-tabular mt-0.5">
                    {toBengaliNumber(fertResult.mop)} কেজি
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F8F1] border border-stone-200">
                  <div className="text-xs text-stone-500">জিপসাম (Gypsum)</div>
                  <div className="text-base font-bold text-[#14532D] font-mono-tabular mt-0.5">
                    {toBengaliNumber(fertResult.gypsum)} কেজি
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F8F1] border border-stone-200">
                  <div className="text-xs text-stone-500">জিংক সালফেট</div>
                  <div className="text-base font-bold text-[#14532D] font-mono-tabular mt-0.5">
                    {toBengaliNumber(fertResult.zinc)} কেজি
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F8F1] border border-stone-200">
                  <div className="text-xs text-stone-500">জৈব সার / গোবর</div>
                  <div className="text-base font-bold text-[#14532D] font-mono-tabular mt-0.5">
                    {toBengaliNumber(fertResult.organicCompost)} কেজি
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-stone-500 flex items-start gap-1.5">
              <Info className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
              <span>
                সার প্রয়োগের হার অঞ্চল, মাটির উর্বরতা পরীক্ষা ও ফসলের জাত অনুযায়ী পরিবর্তিত হতে পারে। এটি সাধারণ নির্দেশক হিসাব, চূড়ান্ত সুপারিশ নয়।
              </span>
            </div>
          </section>
        </div>

        {/* 10.4 উৎপাদন খরচ ও 10.5 লাভ-ক্ষতির হিসাব */}
        <section className="lg:col-span-6 bg-white rounded-2xl p-6 border border-stone-200 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200">
            <Coins className="w-5 h-5 text-[#166534]" />
            <div>
              <h2 className="text-lg font-bold text-[#14532D]">
                ৩. উৎপাদন খরচ ও লাভ-ক্ষতির হিসাব
              </h2>
              <p className="text-xs text-stone-500">
                বীজ, সার, শ্রমিক ও সেচের মোট খরচ এবং ফসল বিক্রির আয় থেকে নিট লাভ বা ক্ষতি গণনা
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="cost-seed" className="block text-xs font-semibold text-[#173B2A] mb-1">
                বীজ বা চারার খরচ (টাকা)
              </label>
              <input
                id="cost-seed"
                type="number"
                min={0}
                value={seedCost}
                onChange={(e) => setSeedCost(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-mono-tabular"
              />
            </div>

            <div>
              <label htmlFor="cost-fert" className="block text-xs font-semibold text-[#173B2A] mb-1">
                সার ও বালাইনাশক খরচ (টাকা)
              </label>
              <input
                id="cost-fert"
                type="number"
                min={0}
                value={fertilizerCost}
                onChange={(e) => setFertilizerCost(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-mono-tabular"
              />
            </div>

            <div>
              <label htmlFor="cost-labor" className="block text-xs font-semibold text-[#173B2A] mb-1">
                শ্রমিক মজুরি (রোপণ, নিড়ানি ও কাটা)
              </label>
              <input
                id="cost-labor"
                type="number"
                min={0}
                value={laborCost}
                onChange={(e) => setLaborCost(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-mono-tabular"
              />
            </div>

            <div>
              <label htmlFor="cost-irrigation" className="block text-xs font-semibold text-[#173B2A] mb-1">
                সেচ খরচ (টাকা)
              </label>
              <input
                id="cost-irrigation"
                type="number"
                min={0}
                value={irrigationCost}
                onChange={(e) => setIrrigationCost(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-mono-tabular"
              />
            </div>

            <div>
              <label htmlFor="cost-landprep" className="block text-xs font-semibold text-[#173B2A] mb-1">
                জমি প্রস্তুত (চাষ ও মই) খরচ
              </label>
              <input
                id="cost-landprep"
                type="number"
                min={0}
                value={landPrepCost}
                onChange={(e) => setLandPrepCost(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-mono-tabular"
              />
            </div>

            <div>
              <label htmlFor="cost-transport" className="block text-xs font-semibold text-[#173B2A] mb-1">
                পরিবহন ও বাজারজাতকরণ খরচ
              </label>
              <input
                id="cost-transport"
                type="number"
                min={0}
                value={transportCost}
                onChange={(e) => setTransportCost(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-mono-tabular"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="cost-other" className="block text-xs font-semibold text-[#173B2A] mb-1">
                অন্যান্য আনুষঙ্গিক খরচ (টাকা)
              </label>
              <input
                id="cost-other"
                type="number"
                min={0}
                value={otherCost}
                onChange={(e) => setOtherCost(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-sm font-mono-tabular"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="rev-qty" className="block text-xs font-semibold text-[#14532D] mb-1">
                উৎপাদিত বা বিক্রি করা ফসলের পরিমাণ (মণ/কেজি)
              </label>
              <input
                id="rev-qty"
                type="number"
                min={0}
                value={yieldQty}
                onChange={(e) => setYieldQty(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-[#DCFCE7]/30 border border-[#166534]/40 text-sm font-bold font-mono-tabular"
              />
            </div>

            <div>
              <label htmlFor="rev-price" className="block text-xs font-semibold text-[#14532D] mb-1">
                প্রতি এককের বিক্রয়মূল্য (টাকা)
              </label>
              <input
                id="rev-price"
                type="number"
                min={0}
                value={sellingPricePerUnit}
                onChange={(e) => setSellingPricePerUnit(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-[#DCFCE7]/30 border border-[#166534]/40 text-sm font-bold font-mono-tabular"
              />
            </div>
          </div>

          {/* Summary Result Card */}
          <div className="p-5 rounded-2xl bg-[#F5F8F1] border border-stone-200 space-y-4">
            <div className="grid grid-cols-2 gap-4 pb-3 border-b border-stone-200">
              <div>
                <div className="text-xs text-stone-500">মোট উৎপাদন খরচ</div>
                <div className="text-xl font-bold text-[#173B2A] font-mono-tabular mt-0.5">
                  ৳ {toBengaliNumber(profitResult.totalExpense)}
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-500">মোট ফসল বিক্রয় (আয়)</div>
                <div className="text-xl font-bold text-[#166534] font-mono-tabular mt-0.5">
                  ৳ {toBengaliNumber(profitResult.totalRevenue)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-stone-600">
                  {profitResult.isProfit
                    ? 'আনুমানিক নিট লাভ (মোট বিক্রয় − মোট খরচ)'
                    : profitResult.isBreakEven
                    ? 'আয় ও ব্যয় সমান (লাভ বা ক্ষতি নেই)'
                    : 'আনুমানিক ক্ষতি (খরচ বিক্রয়ের চেয়ে বেশি)'}
                </div>
                <div
                  className={`text-2xl sm:text-3xl font-bold font-mono-tabular mt-1 flex items-center gap-2 ${
                    profitResult.isProfit ? 'text-[#166534]' : 'text-red-700'
                  }`}
                >
                  {profitResult.isProfit ? (
                    <TrendingUp className="w-6 h-6" />
                  ) : (
                    <TrendingDown className="w-6 h-6" />
                  )}
                  <span>
                    {profitResult.isProfit ? '+' : '-'} ৳{' '}
                    {toBengaliNumber(Math.abs(profitResult.netProfitOrLoss))}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-stone-500">মুনাফার হার</div>
                <div className="text-lg font-bold font-mono-tabular text-[#14532D]">
                  {toBengaliNumber(profitResult.roiPercentage)}%
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
