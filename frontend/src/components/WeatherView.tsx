import React, { useState } from 'react';
import {
  CloudSun,
  Droplets,
  Wind,
  Thermometer,
  MapPin,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Compass,
  Clock,
  Sprout,
} from 'lucide-react';
import {
  DistrictLocation,
  DivisionEntity,
  DistrictEntity,
  UpazilaEntity,
} from '@shared/types';
import { toBengaliNumber } from '@shared/utils/calculations';

interface WeatherViewProps {
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
  weatherData: any;
  loading: boolean;
  error: string | null;
  onRefreshWeather: (customCoords?: { lat: number; lon: number }) => void;
}

export const WeatherView: React.FC<WeatherViewProps> = ({
  selectedDistrict,
  selectedUpazila,
  upazilaEntities = [],
  selectedUpazilaId = '',
  weatherData,
  loading,
  error,
  onRefreshWeather,
}) => {
  const [geoStatus, setGeoStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [geoMessage, setGeoMessage] = useState<string>('');

  const activeUpzObj = upazilaEntities.find((u) => u.id === selectedUpazilaId);
  const displayLat = activeUpzObj?.latitude ?? selectedDistrict.lat;
  const displayLon = activeUpzObj?.longitude ?? selectedDistrict.lon;

  const handleRequestBrowserLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      setGeoMessage(
        'আপনার ব্রাউজারে স্বয়ংক্রিয় লোকেশন সুবিধা নেই। অনুগ্রহ করে নিচের তালিকা থেকে বিভাগ, জেলা ও উপজেলা নির্বাচন করুন।'
      );
      return;
    }

    setGeoStatus('requesting');
    setGeoMessage('আপনার বর্তমান অবস্থানের অনুমতি চাওয়া হচ্ছে...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoStatus('granted');
        setGeoMessage(
          `আপনার বর্তমান স্থানাঙ্ক (${toBengaliNumber(pos.coords.latitude, 2)}° উ, ${toBengaliNumber(
            pos.coords.longitude,
            2
          )}° পূ) অনুযায়ী আবহাওয়া দেখানো হচ্ছে।`
        );
        onRefreshWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        setGeoStatus('denied');
        setGeoMessage(
          'লোকেশন অনুমতি পাওয়া যায়নি। কোনো সমস্যা নেই — নিচের বিভাগ, জেলা ও উপজেলা নির্বাচক থেকে আপনার এলাকা বেছে নিন।'
        );
      },
      { timeout: 8000 }
    );
  };

  const current = weatherData?.current || {
    tempC: 29,
    feelsLikeC: 32,
    humidityPercent: 72,
    windSpeedKmh: 12,
    precipitationMm: 0,
    rainProbPercent: 20,
    conditionBn: 'আংশিক মেঘলা আকাশ',
  };

  const advisory = weatherData?.advisory || {
    severity: 'normal',
    alertTitleBn: 'আবহাওয়া কৃষি কাজের অনুকূলে রয়েছে',
    alertMessageBn: 'সাধারণ পূর্বাভাস অনুযায়ী আজ মাঠে নিয়মিত পরিচর্যা ও সার প্রয়োগ করা যাবে।',
    farmingImpactsBn: [
      'রৌদ্রোজ্জ্বল আবহাওয়া কাটা ধান, গম, ভুট্টা ও সরিষা শুকানোর জন্য অত্যন্ত উপযুক্ত।',
      'মাটির রস পরীক্ষা করে প্রয়োজন অনুযায়ী সকাল বা বিকেলে পরিমিত সেচ দিন।',
    ],
  };

  const hourly: any[] = weatherData?.hourly || [];
  const daily: any[] = weatherData?.daily || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar: Shows Weather Details Title for the Navbar-Selected Location */}
      <section className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#166534]">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>
                নির্বাচিত অবস্থান: {selectedDistrict.divisionBn} বিভাগ · {selectedDistrict.nameBn} জেলা ·{' '}
                {selectedUpazila} উপজেলা
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#14532D]">
              আজকের আবহাওয়া ও ৭ দিনের বিস্তারিত পূর্বাভাস
            </h1>
            <p className="text-xs sm:text-sm text-stone-600">
              সর্বশেষ হালনাগাদ: প্রতি ১ মিনিটে স্বয়ংক্রিয় সিঙ্ক · উৎস:{' '}
              {weatherData?.sourceBn || 'Open-Meteo API'} · স্থানাঙ্ক:{' '}
              <span className="font-mono-tabular font-semibold text-[#14532D]">
                {toBengaliNumber(displayLat, 4)}° উ, {toBengaliNumber(displayLon, 4)}° পূ
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleRequestBrowserLocation}
              disabled={geoStatus === 'requesting'}
              className="px-4 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Compass className="w-4 h-4" />
              <span>
                {geoStatus === 'requesting'
                  ? 'অবস্থান নির্ণয় হচ্ছে...'
                  : 'আমার বর্তমান অবস্থান'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onRefreshWeather({ lat: displayLat, lon: displayLon })}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-[#F5F8F1] hover:bg-[#DCFCE7] text-[#173B2A] border border-stone-200 text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-[#166534] ${loading ? 'animate-spin' : ''}`} />
              <span>হালনাগাদ করুন</span>
            </button>
          </div>
        </div>

        {geoMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-200 text-xs sm:text-sm text-[#173B2A] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#166534] shrink-0" />
            <span>{geoMessage}</span>
          </div>
        )}
      </section>

      {/* Error State with Retry Button */}
      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-red-900">আবহাওয়ার নতুন তথ্য আনতে সমস্যা হয়েছে</h3>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRefreshWeather({ lat: displayLat, lon: displayLon })}
            className="px-4 py-2 rounded-xl bg-red-700 text-white text-xs font-semibold hover:bg-red-800 whitespace-nowrap"
          >
            পুনরায় চেষ্টা করুন
          </button>
        </div>
      )}

      {/* 5.2 Primary Weather Dashboard Card & 5.5 Agri Weather Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-7 bg-gradient-to-br from-[#14532D] to-[#166534] text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/15">
              <div>
                <span className="text-xs text-[#DCFCE7]">
                  {selectedDistrict.divisionBn} বিভাগ · বর্তমান আবহাওয়া
                </span>
                <h2 className="text-2xl font-bold mt-0.5">
                  {selectedDistrict.nameBn} জেলা · {selectedUpazila} উপজেলা
                </h2>
              </div>
              <CloudSun className="w-12 h-12 text-amber-300 shrink-0" />
            </div>

            <div className="py-6 flex flex-wrap items-center justify-between gap-6">
              <div>
                <div className="text-5xl sm:text-6xl font-bold font-mono-tabular">
                  {toBengaliNumber(current.tempC)}°সে
                </div>
                <div className="text-base sm:text-lg font-medium text-[#DCFCE7] mt-2">
                  {current.conditionBn}
                </div>
                <div className="text-xs text-stone-200 mt-1">
                  অনুভূত তাপমাত্রা: {toBengaliNumber(current.feelsLikeC)}° সেলসিয়াস
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-white/10 p-4 rounded-xl border border-white/15 min-w-[240px]">
                <div>
                  <div className="text-xs text-[#DCFCE7] flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5" /> আর্দ্রতা
                  </div>
                  <div className="text-lg font-bold font-mono-tabular mt-0.5">
                    {toBengaliNumber(current.humidityPercent)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#DCFCE7] flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5" /> বাতাসের গতি
                  </div>
                  <div className="text-lg font-bold font-mono-tabular mt-0.5">
                    {toBengaliNumber(current.windSpeedKmh)} কিমি/ঘণ্টা
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#DCFCE7] flex items-center gap-1">
                    <CloudSun className="w-3.5 h-3.5" /> বৃষ্টির সম্ভাবনা
                  </div>
                  <div className="text-lg font-bold font-mono-tabular mt-0.5">
                    {toBengaliNumber(current.rainProbPercent)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#DCFCE7] flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5" /> বৃষ্টিপাত
                  </div>
                  <div className="text-lg font-bold font-mono-tabular mt-0.5">
                    {toBengaliNumber(current.precipitationMm, 1)} মিমি
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/15 flex items-center justify-between text-xs text-[#DCFCE7]">
            <span>
              উপজেলা স্থানাঙ্ক: {toBengaliNumber(displayLat, 4)}° উত্তর,{' '}
              {toBengaliNumber(displayLon, 4)}° পূর্ব
            </span>
            <span>Open-Meteo আবহাওয়া মডেল</span>
          </div>
        </section>

        {/* 5.5 কৃষি আবহাওয়া সতর্কতা ও 5.6 কৃষিকাজে আবহাওয়ার প্রভাব */}
        <section className="lg:col-span-5 bg-white rounded-2xl p-6 border border-stone-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-stone-200">
              {advisory.severity === 'normal' ? (
                <CheckCircle2 className="w-6 h-6 text-[#166534] shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              )}
              <div>
                <h2 className="text-lg font-bold text-[#14532D]">
                  কৃষি আবহাওয়া সতর্কতা ও মাঠের নির্দেশনা
                </h2>
                <p className="text-xs text-stone-500">
                  সাধারণ পূর্বাভাস ও কৃষি বিশেষজ্ঞদের নির্দেশনা অনুযায়ী (সরকারি জরুরি সতর্কতা নয়)
                </p>
              </div>
            </div>

            <div
              className={`mt-4 p-4 rounded-xl border ${
                advisory.severity === 'danger'
                  ? 'bg-red-50 border-red-200 text-red-950'
                  : advisory.severity === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-[#F5F8F1] border-stone-200 text-[#173B2A]'
              }`}
            >
              <div className="font-bold text-sm">{advisory.alertTitleBn}</div>
              <p className="text-xs mt-1 leading-relaxed">{advisory.alertMessageBn}</p>
            </div>

            <div className="mt-4">
              <h3 className="text-xs font-bold text-[#14532D] mb-2.5 flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-[#166534]" />
                <span>আজকের কৃষিকাজে করণীয় (সেচ, সার ও ফসল ব্যবস্থাপনা):</span>
              </h3>
              <ul className="space-y-2 text-xs text-[#173B2A]">
                {(advisory.farmingImpactsBn || []).map((impact: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="font-bold text-[#166534] mt-0.5">·</span>
                    <span>{impact}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500">
            বিশেষ দ্রষ্টব্য: ঘূর্ণিঝড় বা রাষ্ট্রীয় আবহাওয়া সতর্কতার জন্য বাংলাদেশ আবহাওয়া অধিদপ্তরের (BMD) বুলেটিন অনুসরণ করুন।
          </div>
        </section>
      </div>

      {/* 5.3 ঘণ্টাভিত্তিক পূর্বাভাস (Hourly Forecast) */}
      <section className="bg-white rounded-2xl p-6 border border-stone-200">
        <div className="pb-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#14532D]">আগামী ২৪ ঘণ্টার পূর্বাভাস (ঘণ্টাভিত্তিক)</h2>
            <p className="text-xs text-stone-600">
              সেচ দেওয়া, ফসল শুকানো ও বালাইনাশক স্প্রে করার উপযুক্ত সময় পরিকল্পনা করুন
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-4">
          {hourly.map((h, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-[#F5F8F1] border border-stone-200/80 text-center space-y-1.5"
            >
              <div className="text-xs font-semibold text-stone-600 font-mono-tabular">
                {toBengaliNumber(h.hourLabelBn)}
              </div>
              <div className="text-xl font-bold text-[#14532D] font-mono-tabular">
                {toBengaliNumber(h.tempC)}°সে
              </div>
              <div className="text-[11px] text-[#173B2A] truncate">{h.conditionBn}</div>
              <div className="pt-1 border-t border-stone-200/70 text-[11px] text-stone-600 space-y-0.5 font-mono-tabular">
                <div>বৃষ্টি: {toBengaliNumber(h.rainProbPercent)}%</div>
                <div>{toBengaliNumber(h.precipitationMm, 1)} মিমি</div>
                <div>বাতাস: {toBengaliNumber(h.windSpeedKmh)} কিমি</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5.4 সাত দিনের পূর্বাভাস (7-Day Forecast) */}
      <section className="bg-white rounded-2xl p-6 border border-stone-200">
        <div className="pb-4 border-b border-stone-200">
          <h2 className="text-lg font-bold text-[#14532D]">আগামী ৭ দিনের আবহাওয়ার পূর্বাভাস</h2>
          <p className="text-xs text-stone-600">
            বীজ বপন, চারা রোপণ ও ফসল সংগ্রহের সাপ্তাহিক পরিকল্পনা
          </p>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-xs text-stone-500">
                <th className="py-3 font-semibold">বার ও তারিখ</th>
                <th className="py-3 font-semibold">আবহাওয়ার অবস্থা</th>
                <th className="py-3 font-semibold text-right">সর্বোচ্চ / সর্বনিম্ন তাপমাত্রা</th>
                <th className="py-3 font-semibold text-right">বৃষ্টির সম্ভাবনা</th>
                <th className="py-3 font-semibold text-right">সম্ভাব্য বৃষ্টিপাত</th>
                <th className="py-3 font-semibold text-right">বাতাসের গতি</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {daily.map((d, idx) => (
                <tr key={idx} className="hover:bg-[#F5F8F1]/60">
                  <td className="py-3.5 pr-3">
                    <div className="font-bold text-[#173B2A]">{d.dayNameBn}</div>
                    <div className="text-xs text-stone-500 font-mono-tabular">
                      {toBengaliNumber(d.dateISO)}
                    </div>
                  </td>
                  <td className="py-3.5 text-sm font-medium text-[#166534]">{d.conditionBn}</td>
                  <td className="py-3.5 text-right font-mono-tabular font-bold text-[#173B2A]">
                    {toBengaliNumber(d.maxTempC)}° /{' '}
                    <span className="text-stone-500 font-normal">{toBengaliNumber(d.minTempC)}°সে</span>
                  </td>
                  <td className="py-3.5 text-right font-mono-tabular font-semibold text-[#166534]">
                    {toBengaliNumber(d.rainProbPercent)}%
                  </td>
                  <td className="py-3.5 text-right font-mono-tabular text-stone-700">
                    {toBengaliNumber(d.precipitationMm, 1)} মিমি
                  </td>
                  <td className="py-3.5 text-right font-mono-tabular text-stone-700">
                    {toBengaliNumber(d.windSpeedKmh)} কিমি/ঘণ্টা
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
