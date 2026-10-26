import {
  DivisionEntity,
  DistrictEntity,
  UpazilaEntity,
  AdminRoleType,
} from '../utils/locationAndAdminRules.ts';

export type NavTab =
  | 'home'
  | 'weather'
  | 'market'
  | 'crops'
  | 'diseases'
  | 'calendar'
  | 'calculator'
  | 'marketplace'
  | 'qa'
  | 'my-farm'
  | 'admin';

export type AdminModuleTab =
  | 'dashboard'
  | 'locations'
  | 'users'
  | 'market-prices'
  | 'crops'
  | 'diseases'
  | 'calendar'
  | 'weather-alerts'
  | 'marketplace'
  | 'qa'
  | 'articles'
  | 'reports'
  | 'notifications'
  | 'settings'
  | 'roles-permissions'
  | 'audit-logs';

export type MarketPriceWorkflowStatus =
  | 'Draft'
  | 'Pending Review'
  | 'Approved'
  | 'Published'
  | 'Rejected';

export type MarketplaceModerationStatus =
  | 'Pending'
  | 'Approved'
  | 'Published'
  | 'Rejected'
  | 'Suspended'
  | 'Sold / Expired';

export type PlatformUserRole =
  | 'কৃষক'
  | 'ক্রেতা'
  | 'কৃষি বিশেষজ্ঞ'
  | 'সম্পাদক'
  | 'মডারেটর'
  | 'প্রশাসক';

export interface PlatformUser {
  id: string;
  nameBn: string;
  email: string;
  phoneBn: string;
  roleBn: PlatformUserRole;
  adminRole?: AdminRoleType;
  divisionId: string;
  districtId: string;
  upazilaId: string;
  status: 'সক্রিয়' | 'সীমিত' | 'স্থগিত';
  joinedAtBn: string;
  reportsCount: number;
}

export interface DistrictLocation {
  id: string;
  divisionId?: string;
  nameBn: string;
  divisionBn: string;
  upazilasBn: string[];
  lat: number;
  lon: number;
}

export interface MarketPriceItem {
  id: string;
  cropNameBn: string;
  categoryBn: 'ধান ও শস্য' | 'সবজি' | 'মসলা ও তেলবীজ' | 'ফল ও অর্থকরী';
  marketNameBn: string;
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  divisionBn?: string;
  districtBn: string;
  upazilaBn: string;
  wholesalePrice: number;
  retailPrice: number;
  yesterdayWholesale: number;
  sevenDayHistory: number[];
  unitBn: string;
  updatedAtBn: string;
  recordedAtBn?: string;
  sourceBn: string;
  verified: boolean;
  workflowStatus?: MarketPriceWorkflowStatus;
  createdByBn?: string;
  verifiedByBn?: string;
  publishedByBn?: string;
  visualType:
    | 'paddy'
    | 'rice'
    | 'wheat'
    | 'maize'
    | 'potato'
    | 'onion'
    | 'garlic'
    | 'chili'
    | 'tomato'
    | 'brinjal'
    | 'cauliflower'
    | 'cabbage'
    | 'jute'
    | 'mustard'
    | 'mango';
}

export interface CropGuideItem {
  id: string;
  slug: string;
  nameBn: string;
  scientificName: string;
  categoryBn: 'দানা শস্য' | 'সবজি' | 'তেলবীজ ও মসলা' | 'অর্থকরী ফসল' | 'ফল';
  seasonBn: string;
  soilBn: string;
  climateBn: string;
  durationBn: string;
  sowingTimeBn: string;
  harvestTimeBn: string;
  estimatedYieldBn: string;
  estimatedCostPerBighaBn: string;
  marketDemandBn: string;
  referenceSourceBn: string;
  visualType: string;
  steps: {
    landPrepBn: string;
    seedSelectionBn: string;
    seedTreatmentBn: string;
    sowingPlantingBn: string;
    fertilizerBn: string;
    irrigationBn: string;
    weedControlBn: string;
    pestControlBn: string;
    harvestingStorageBn: string;
  };
}

export interface CropDiseaseItem {
  id: string;
  slug: string;
  nameBn: string;
  categoryBn: 'ধানের রোগ' | 'সবজির রোগ' | 'ফলের রোগ' | 'গম ও ভুট্টার রোগ' | 'ডাল ও তেলবীজের রোগ';
  affectedCropBn: string;
  symptomsBn: string[];
  causeBn: string;
  spreadConditionBn: string;
  preventionBn: string[];
  careAndManagementBn: string[];
  expertAdviceBn: string;
  referenceSourceBn: string;
  severity: 'উচ্চ ঝুঁকি' | 'মাঝারি ঝুঁকি' | 'সতর্কতা';
}

export interface BanglaMonthCalendar {
  id: string;
  monthNameBn: string;
  gregorianSpanBn: string;
  seasonBn: string;
  keyCropsBn: string[];
  sowingTasksBn: string[];
  plantingTasksBn: string[];
  fertilizerAndIrrigationBn: string[];
  harvestingTasksBn: string[];
  weatherCautionBn: string;
}

export interface MarketplaceListing {
  id: string;
  sellerNameBn: string;
  sellerRoleBn: 'যাচাইকৃত কৃষক' | 'স্থানীয় উৎপাদক';
  verifiedSeller: boolean;
  cropNameBn: string;
  categoryBn: string;
  quantity: number;
  unitBn: string;
  pricePerUnit: number;
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  divisionBn?: string;
  districtBn: string;
  upazilaBn: string;
  harvestDateBn: string;
  phoneBn: string;
  descriptionBn: string;
  status: 'approved' | 'pending' | 'reported';
  moderationStatus?: MarketplaceModerationStatus;
  moderationReasonBn?: string;
  moderatedAtBn?: string;
  moderatedByBn?: string;
  createdAtBn: string;
  visualType: string;
}

export interface QuestionAnswerItem {
  id: string;
  titleBn: string;
  detailsBn: string;
  cropBn: string;
  categoryBn: 'রোগ ও পোকা' | 'সার ও মাটি' | 'বীজ ও চাষাবাদ' | 'আবহাওয়া ও সেচ';
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  districtBn: string;
  upazilaBn: string;
  askedByBn: string;
  askedAtBn: string;
  helpfulCount: number;
  answers: {
    id: string;
    expertNameBn: string;
    expertTitleBn: string;
    verifiedExpert: boolean;
    answerTextBn: string;
    answeredAtBn: string;
    referenceArticleBn?: string;
  }[];
}

export interface AgriArticleItem {
  id: string;
  titleBn: string;
  categoryBn: 'চাষাবাদ প্রযুক্তি' | 'সার ও মাটি ব্যবস্থাপনা' | 'রোগ ও বালাই দমন' | 'কৃষি অর্থনীতি ও বাজার';
  summaryBn: string;
  contentBn: string;
  authorBn: string;
  publishedAtBn: string;
  status: 'প্রকাশিত' | 'খসড়া';
}

export interface ReportComplaintItem {
  id: string;
  typeBn: 'বিজ্ঞাপন সংক্রান্ত অভিযোগ' | 'বাজারদর সংশোধনের অনুরোধ' | 'ভুল কৃষি তথ্য রিপোর্ট' | 'ব্যবহারকারী আচরণ';
  targetTitleBn: string;
  targetId: string;
  reportedByBn: string;
  districtBn: string;
  reasonBn: string;
  createdAtBn: string;
  status: 'বিবেচনাধীন' | 'সমাধানকৃত' | 'বাতিল';
  resolutionNoteBn?: string;
}

export interface AuditLogEntry {
  id: string;
  requestId: string;
  adminId: string;
  adminNameBn: string;
  adminRole: AdminRoleType;
  actionBn: string;
  resourceTypeBn: 'অবস্থান' | 'বাজারদর' | 'বিজ্ঞাপন' | 'ব্যবহারকারী' | 'ফসল ও নিবন্ধ' | 'প্রশ্নোত্তর' | 'সেটিংস ও অনুমতি';
  resourceId: string;
  previousValueBn?: string;
  newValueBn?: string;
  reasonBn: string;
  timestampBn: string;
}

export interface FarmerFieldRecord {
  id: string;
  nameBn: string;
  areaShotok: number;
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  districtBn: string;
  upazilaBn: string;
  soilTypeBn: string;
  currentCropBn: string;
  sowingDateBn: string;
  expectedHarvestDateBn: string;
  stageBn: 'জমি প্রস্তুত' | 'চারা রোপণ' | 'অঙ্গজ বৃদ্ধি' | 'ফুল ও ফল ধারণ' | 'সংগ্রহের উপযোগী';
}

export interface FarmerExpenseRecord {
  id: string;
  fieldNameBn: string;
  cropNameBn: string;
  type: 'expense' | 'income';
  categoryBn: 'বীজ' | 'সার' | 'শ্রমিক' | 'সেচ' | 'জমি প্রস্তুত' | 'পরিবহন' | 'ফসল বিক্রয়' | 'অন্যান্য';
  amount: number;
  dateBn: string;
  noteBn: string;
}

export interface FarmingTaskItem {
  id: string;
  titleBn: string;
  cropBn: string;
  dueDateBn: string;
  monthBn: string;
  completed: boolean;
  priority: 'জরুরি' | 'সাধারণ';
}

export interface AppNotification {
  id: string;
  type: 'weather' | 'calendar' | 'market' | 'expert' | 'govt';
  titleBn: string;
  messageBn: string;
  timeBn: string;
  read: boolean;
  targetAudienceBn?: string;
}

export type { DivisionEntity, DistrictEntity, UpazilaEntity, AdminRoleType };
