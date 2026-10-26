/**
 * Pure agricultural calculations, Bengali numeral formatting, and weather advisory logic.
 * Decoupled from UI for unit testing and reuse.
 */

export const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/**
 * Converts English numerals in a number or string to Bengali numerals.
 */
export function toBengaliNumber(val: number | string, decimals?: number): string {
  if (val === null || val === undefined || val === '') return '০';
  let str: string;
  if (typeof val === 'number') {
    if (Number.isNaN(val)) return '০';
    str = decimals !== undefined ? val.toFixed(decimals) : val.toString();
  } else {
    str = val;
  }
  return str.replace(/[0-9]/g, (d) => BENGALI_DIGITS[parseInt(d, 10)]);
}

/**
 * Land Measurement Conversion
 * Standard Bangladesh units:
 * 1 Acre (একর) = 100 Shotok / Decimal (শতক)
 * 1 Hectare (হেক্টর) = 247.105 Shotok (শতক) = 2.47105 Acre
 * Local Bigha (বিঘা) varies by region:
 * - প্রমিত বিঘা (Standard): 33 শতক (33 Shotok)
 * - উত্তরবঙ্গ / রাজশাহী / রংপুর (Northern): 33 শতক
 * - কুষ্টিয়া / যশোর / খুলনা (South-West): 33 শতক (বা কিছু এলাকায় 50 শতক বড় বিঘা)
 * - ময়মনসিংহ / সিলেট (Greater Mymensingh/Sylhet): 30 শতক বা 40 শতক (কানি/কেদার)
 * We let the user pass `shotokPerBigha` (default 33).
 */
export interface LandConversionResult {
  shotok: number;
  bigha: number;
  acre: number;
  hectare: number;
  katha: number; // 1 Shotok ≈ 0.605 Katha (1 Bigha of 33 shotok = 20 Katha -> 1 Katha = 1.65 Shotok)
}

export function convertLandArea(
  value: number,
  fromUnit: 'shotok' | 'bigha' | 'acre' | 'hectare',
  shotokPerBigha: number = 33
): LandConversionResult {
  const safeVal = Math.max(0, Number(value) || 0);
  const safeBighaRate = shotokPerBigha > 0 ? shotokPerBigha : 33;

  let totalShotok = 0;
  switch (fromUnit) {
    case 'shotok':
      totalShotok = safeVal;
      break;
    case 'bigha':
      totalShotok = safeVal * safeBighaRate;
      break;
    case 'acre':
      totalShotok = safeVal * 100;
      break;
    case 'hectare':
      totalShotok = safeVal * 247.105;
      break;
  }

  return {
    shotok: Number(totalShotok.toFixed(2)),
    bigha: Number((totalShotok / safeBighaRate).toFixed(2)),
    acre: Number((totalShotok / 100).toFixed(3)),
    hectare: Number((totalShotok / 247.105).toFixed(3)),
    katha: Number((totalShotok / 1.65).toFixed(2)),
  };
}

/**
 * Seed Calculation
 * Given land area in Shotok and seed rate per Shotok (in grams or kg), returns total seed needed in kg.
 */
export interface SeedCalculationResult {
  totalKg: number;
  totalGrams: number;
  recommendedBufferKg: number; // +10% germination safety buffer
}

export function calculateSeedRequirement(
  areaInShotok: number,
  seedRateGramsPerShotok: number
): SeedCalculationResult {
  const safeArea = Math.max(0, Number(areaInShotok) || 0);
  const safeRate = Math.max(0, Number(seedRateGramsPerShotok) || 0);
  const totalGrams = safeArea * safeRate;
  const totalKg = totalGrams / 1000;
  const recommendedBufferKg = totalKg * 1.1;

  return {
    totalKg: Number(totalKg.toFixed(2)),
    totalGrams: Math.round(totalGrams),
    recommendedBufferKg: Number(recommendedBufferKg.toFixed(2)),
  };
}

/**
 * Fertilizer Recommendation Calculator (BARC / DAE general indicative rates per Shotok in kg)
 */
export interface FertilizerDosePerShotok {
  urea: number;
  tsp: number;
  mop: number;
  gypsum: number;
  zinc: number;
  organicCompost: number;
}

export const CROP_FERTILIZER_RATES: Record<string, { nameBn: string; ratesPerShotokKg: FertilizerDosePerShotok; seedGramsPerShotok: number }> = {
  biri_dhan: {
    nameBn: 'আমন / বোরো ধান (উফশী)',
    seedGramsPerShotok: 120, // ~12 kg per acre (100 shotok)
    ratesPerShotokKg: {
      urea: 0.85,
      tsp: 0.40,
      mop: 0.45,
      gypsum: 0.25,
      zinc: 0.04,
      organicCompost: 20,
    },
  },
  wheat: {
    nameBn: 'গম (বারি গম)',
    seedGramsPerShotok: 480, // ~48 kg per acre
    ratesPerShotokKg: {
      urea: 0.90,
      tsp: 0.60,
      mop: 0.50,
      gypsum: 0.40,
      zinc: 0.03,
      organicCompost: 25,
    },
  },
  maize: {
    nameBn: 'হাইব্রিড ভুট্টা',
    seedGramsPerShotok: 85, // ~8.5 kg per acre
    ratesPerShotokKg: {
      urea: 2.10,
      tsp: 1.00,
      mop: 0.80,
      gypsum: 0.60,
      zinc: 0.05,
      organicCompost: 30,
    },
  },
  potato: {
    nameBn: 'আলু (ডায়মন্ট / কার্ডিনাল)',
    seedGramsPerShotok: 6000, // ~600 kg tuber per acre
    ratesPerShotokKg: {
      urea: 1.30,
      tsp: 0.90,
      mop: 1.10,
      gypsum: 0.50,
      zinc: 0.04,
      organicCompost: 40,
    },
  },
  mustard: {
    nameBn: 'সরিষা (বারি সরিষা-১৪/১৭)',
    seedGramsPerShotok: 30, // ~3 kg per acre
    ratesPerShotokKg: {
      urea: 1.00,
      tsp: 0.70,
      mop: 0.40,
      gypsum: 0.60,
      zinc: 0.03,
      organicCompost: 20,
    },
  },
  onion: {
    nameBn: 'পেঁয়াজ (বারি পেঁয়াজ)',
    seedGramsPerShotok: 25, // ~2.5 kg seed per acre
    ratesPerShotokKg: {
      urea: 1.10,
      tsp: 0.80,
      mop: 0.60,
      gypsum: 0.45,
      zinc: 0.03,
      organicCompost: 35,
    },
  },
  brinjal_tomato: {
    nameBn: 'বেগুন ও টমেটো (সবজি)',
    seedGramsPerShotok: 2, // ~200g per acre
    ratesPerShotokKg: {
      urea: 1.20,
      tsp: 0.85,
      mop: 0.70,
      gypsum: 0.35,
      zinc: 0.04,
      organicCompost: 40,
    },
  },
};

export function calculateFertilizerForArea(
  cropKey: string,
  areaInShotok: number
): FertilizerDosePerShotok {
  const safeArea = Math.max(0, Number(areaInShotok) || 0);
  const crop = CROP_FERTILIZER_RATES[cropKey] || CROP_FERTILIZER_RATES.biri_dhan;
  const r = crop.ratesPerShotokKg;

  return {
    urea: Number((r.urea * safeArea).toFixed(2)),
    tsp: Number((r.tsp * safeArea).toFixed(2)),
    mop: Number((r.mop * safeArea).toFixed(2)),
    gypsum: Number((r.gypsum * safeArea).toFixed(2)),
    zinc: Number((r.zinc * safeArea).toFixed(2)),
    organicCompost: Number((r.organicCompost * safeArea).toFixed(1)),
  };
}

/**
 * Production Cost & Profit/Loss Calculation
 * Formula from specification 10.5:
 * মোট খরচ = সব খরচের যোগফল
 * মোট বিক্রয় = বিক্রি করা ফসলের পরিমাণ × প্রতি এককের বিক্রয়মূল্য
 * আনুমানিক লাভ = মোট বিক্রয় − মোট খরচ
 */
export interface ExpenseBreakdownInput {
  seedCost: number;
  fertilizerCost: number;
  laborCost: number;
  irrigationCost: number;
  landPrepCost: number;
  transportCost: number;
  otherCost: number;
}

export interface ProfitLossResult {
  totalExpense: number;
  totalRevenue: number;
  netProfitOrLoss: number;
  isProfit: boolean;
  isBreakEven: boolean;
  roiPercentage: number;
}

export function calculateProfitAndLoss(
  expenses: ExpenseBreakdownInput,
  yieldQuantity: number,
  pricePerUnit: number
): ProfitLossResult {
  const totalExpense =
    (Number(expenses.seedCost) || 0) +
    (Number(expenses.fertilizerCost) || 0) +
    (Number(expenses.laborCost) || 0) +
    (Number(expenses.irrigationCost) || 0) +
    (Number(expenses.landPrepCost) || 0) +
    (Number(expenses.transportCost) || 0) +
    (Number(expenses.otherCost) || 0);

  const safeQty = Math.max(0, Number(yieldQuantity) || 0);
  const safePrice = Math.max(0, Number(pricePerUnit) || 0);
  const totalRevenue = safeQty * safePrice;
  const netProfitOrLoss = totalRevenue - totalExpense;
  const isBreakEven = netProfitOrLoss === 0;
  const isProfit = netProfitOrLoss > 0;
  const roiPercentage =
    totalExpense > 0 ? Number(((netProfitOrLoss / totalExpense) * 100).toFixed(1)) : 0;

  return {
    totalExpense: Math.round(totalExpense),
    totalRevenue: Math.round(totalRevenue),
    netProfitOrLoss: Math.round(netProfitOrLoss),
    isProfit,
    isBreakEven,
    roiPercentage,
  };
}

/**
 * Weather Code to Bengali Description & Agricultural Advisory
 * Follows Open-Meteo WMO Weather interpretation codes (WW)
 */
export interface WeatherAdvisory {
  conditionBn: string;
  severity: 'normal' | 'warning' | 'danger';
  alertTitleBn: string;
  alertMessageBn: string;
  farmingImpactsBn: string[];
}

export function getWeatherAdvisory(
  wmoCode: number,
  tempC: number,
  rainProbPercent: number,
  precipitationMm: number,
  windSpeedKmh: number
): WeatherAdvisory {
  let conditionBn = 'পরিষ্কার আকাশ';
  if (wmoCode === 0) conditionBn = 'পরিষ্কার রৌদ্রোজ্জ্বল আকাশ';
  else if (wmoCode === 1 || wmoCode === 2) conditionBn = 'আংশিক মেঘলা আকাশ';
  else if (wmoCode === 3) conditionBn = 'মেঘলা আকাশ';
  else if (wmoCode === 45 || wmoCode === 48) conditionBn = 'কুয়াশাচ্ছন্ন আবহাওয়া';
  else if (wmoCode >= 51 && wmoCode <= 57) conditionBn = 'গুঁড়ি গুঁড়ি বৃষ্টি';
  else if (wmoCode >= 61 && wmoCode <= 65) conditionBn = 'হালকা থেকে মাঝারি বৃষ্টিপাত';
  else if (wmoCode >= 66 && wmoCode <= 82) conditionBn = 'ভারী বৃষ্টিপাত';
  else if (wmoCode >= 95) conditionBn = 'বজ্রসহ ঝড়-বৃষ্টি';

  const impacts: string[] = [];
  let severity: 'normal' | 'warning' | 'danger' = 'normal';
  let alertTitleBn = 'আবহাওয়া কৃষি কাজের অনুকূলে রয়েছে';
  let alertMessageBn = 'সাধারণ পূর্বাভাস অনুযায়ী আজ মাঠে নিয়মিত পরিচর্যা, আগাছা দমন ও সার প্রয়োগ করা যাবে।';

  // High rain / thunderstorm check
  if (wmoCode >= 95 || windSpeedKmh >= 40) {
    severity = 'danger';
    alertTitleBn = 'ঝড় ও বজ্রপাতের সম্ভাবনা — সতর্কতা (পূর্বাভাসভিত্তিক)';
    alertMessageBn = 'খোলা মাঠে অবস্থান করবেন না। পাকা ধান বা ফসল দ্রুত নিরাপদ স্থানে তুলে রাখুন এবং সবজি ক্ষেতে খুঁটি মজবুত করুন।';
    impacts.push('বৃষ্টির আগে পাকা ফসল দ্রুত কেটে মাড়াই ও ঢেকে রাখার ব্যবস্থা করুন।');
    impacts.push('জমিতে অতিরিক্ত পানি জমে জলাবদ্ধতা যেন না হয় সেজন্য নিষ্কাশন নালা পরিষ্কার রাখুন।');
    impacts.push('ঝড়ো বাতাসে কলা, পেঁপে ও লতাজাতীয় সবজির মাচা শক্ত করে বেঁধে দিন।');
  } else if (rainProbPercent >= 65 || precipitationMm >= 10 || (wmoCode >= 61 && wmoCode <= 82)) {
    severity = 'warning';
    alertTitleBn = 'বৃষ্টির সম্ভাবনা রয়েছে — সেচ ও সার প্রয়োগে সতর্কতা';
    alertMessageBn = 'আগামী কয়েক ঘণ্টায় বৃষ্টির সম্ভাবনা থাকায় জমিতে নতুন করে সেচ দেওয়া বা ইউরিয়া সার ও কীটনাশক স্প্রে করা থেকে বিরত থাকুন।';
    impacts.push('আজ জমিতে সেচ দেওয়ার প্রয়োজন নেই; প্রাকৃতিক বৃষ্টির পানিই যথেষ্ট হবে।');
    impacts.push('বৃষ্টির আগে জমিতে সার বা বালাইনাশক প্রয়োগ করলে তা ধুয়ে নষ্ট হতে পারে।');
    impacts.push('কাটা ধান বা শস্য খোলা উঠানে শুকাতে দিলে পলিথিন বা ত্রিপল কাছে রাখুন।');
  } else if (tempC >= 36) {
    severity = 'warning';
    alertTitleBn = 'অতিরিক্ত গরম ও তাপপ্রবাহের সম্ভাবনা';
    alertMessageBn = 'তাপমাত্রা বেশি থাকায় জমির আর্দ্রতা দ্রুত কমে যেতে পারে। ফসলের গোড়ায় পর্যাপ্ত রস ধরে রাখতে বিকেলে হালকা সেচ দিন।';
    impacts.push('বোরো ধান বা সবজি ক্ষেতে ২-৩ ইঞ্চি পানি ধরে রাখার ব্যবস্থা করুন।');
    impacts.push('দুপুরের তীব্র রোদে মাঠে কাজ না করে সকাল ও বিকেলের শীতল সময়ে কাজ করুন।');
    impacts.push('ফল ও সবজির চারায় মালচিং (খড় বা কচুরিপানা দিয়ে গোড়া ঢাকা) ব্যবহার করুন।');
  } else {
    impacts.push('রৌদ্রোজ্জ্বল আবহাওয়া কাটা ধান, গম, ভুট্টা ও সরিষা শুকানোর জন্য অত্যন্ত উপযুক্ত।');
    impacts.push('মাটির রস পরীক্ষা করে প্রয়োজন অনুযায়ী সকাল বা বিকেলে পরিমিত সেচ দিন।');
    impacts.push('বাতাসের গতি কম থাকায় ছত্রাকনাশক বা অনুমোদিত জৈব বালাইনাশক স্প্রে করার উপযুক্ত সময়।');
  }

  return {
    conditionBn,
    severity,
    alertTitleBn,
    alertMessageBn,
    farmingImpactsBn: impacts,
  };
}
