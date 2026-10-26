/**
 * Pure Location Hierarchy (Division -> District -> Upazila), Duplicate Validation,
 * Cascading Reset Rules, CSV Import/Export, Authentication, and Role-Based Access Control (RBAC) logic.
 */

export interface DivisionEntity {
  id: string;
  nameBn: string;
  slug: string;
  code: string;
  isActive: boolean;
  createdAtBn: string;
  updatedAtBn: string;
}

export interface DistrictEntity {
  id: string;
  divisionId: string;
  nameBn: string;
  slug: string;
  code: string;
  isActive: boolean;
  createdAtBn: string;
  updatedAtBn: string;
}

export interface UpazilaEntity {
  id: string;
  districtId: string;
  divisionId: string;
  nameBn: string;
  slug: string;
  code: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isActive: boolean;
  createdAtBn: string;
  updatedAtBn: string;
}

export type AdminRoleType =
  | 'Super Admin'
  | 'Content Editor'
  | 'Market Manager'
  | 'Moderator'
  | 'Support Agent';

export type AdminModuleTabId =
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

export type AdminPermissionAction =
  | 'manage_locations'
  | 'manage_users'
  | 'manage_market_prices'
  | 'publish_market_prices'
  | 'manage_content'
  | 'moderate_marketplace'
  | 'manage_qa_support'
  | 'manage_settings_roles'
  | 'view_audit_logs';

export const ADMIN_ROLE_LABELS_BN: Record<AdminRoleType, string> = {
  'Super Admin': 'সুপার অ্যাডমিন (Super Admin)',
  'Market Manager': 'মার্কেট ম্যানেজার (Market Manager)',
  'Content Editor': 'কনটেন্ট এডিটর (Content Editor)',
  'Moderator': 'মডারেটর (Moderator)',
  'Support Agent': 'সাপোর্ট ম্যানেজার (Support Manager)',
};

export const ADMIN_ROLE_DESCRIPTIONS_BN: Record<AdminRoleType, string> = {
  'Super Admin': 'পূর্ণ নিয়ন্ত্রণ — অবস্থান, বাজারদর, ব্যবহারকারী, সেটিংস ও সব ১৬টি মডিউল পরিচালনা',
  'Market Manager': 'বাজারদর ব্যবস্থাপনা — বাজারদর যোগ, যাচাই, অনুমোদন, প্রকাশ ও আবহাওয়া সতর্কতা পর্যবেক্ষণ',
  'Content Editor': 'কনটেন্ট ব্যবস্থাপনা — ফসল ও চাষাবাদ, রোগ ও প্রতিকার, কৃষি ক্যালেন্ডার ও কৃষি নিবন্ধ প্রকাশ',
  'Moderator': 'মডারেশন — ফসল বিক্রির বিজ্ঞাপন যাচাই, প্রশ্নোত্তর ও অভিযোগ পর্যালোচনা',
  'Support Agent': 'সাপোর্ট ম্যানেজার — কৃষকের প্রশ্নোত্তর, ব্যবহারকারীর অভিযোগ নিষ্পত্তি ও বিজ্ঞপ্তি প্রেরণ',
};

const ROLE_PERMISSIONS: Record<AdminRoleType, AdminPermissionAction[]> = {
  'Super Admin': [
    'manage_locations',
    'manage_users',
    'manage_market_prices',
    'publish_market_prices',
    'manage_content',
    'moderate_marketplace',
    'manage_qa_support',
    'manage_settings_roles',
    'view_audit_logs',
  ],
  'Content Editor': ['manage_content'],
  'Market Manager': ['manage_market_prices', 'publish_market_prices', 'view_audit_logs'],
  'Moderator': ['moderate_marketplace', 'manage_qa_support'],
  'Support Agent': ['manage_qa_support'],
};

const ROLE_ALLOWED_MODULES: Record<AdminRoleType, AdminModuleTabId[]> = {
  'Super Admin': [
    'dashboard',
    'locations',
    'users',
    'market-prices',
    'crops',
    'diseases',
    'calendar',
    'weather-alerts',
    'marketplace',
    'qa',
    'articles',
    'reports',
    'notifications',
    'settings',
    'roles-permissions',
    'audit-logs',
  ],
  'Market Manager': ['dashboard', 'market-prices', 'weather-alerts', 'audit-logs'],
  'Content Editor': ['dashboard', 'crops', 'diseases', 'calendar', 'articles'],
  'Moderator': ['dashboard', 'marketplace', 'qa', 'reports'],
  'Support Agent': ['dashboard', 'qa', 'reports', 'notifications'],
};

export function hasAdminPermission(role: AdminRoleType, action: AdminPermissionAction): boolean {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(action);
}

export function getAllowedAdminModulesForRole(role?: AdminRoleType | null): AdminModuleTabId[] {
  if (!role) return [];
  return ROLE_ALLOWED_MODULES[role] || [];
}

/**
 * Built-in Role Accounts with Dedicated IDs and Passwords
 */
export interface AuthAccount {
  id: string;
  username: string;
  email: string;
  password?: string;
  nameBn: string;
  phoneBn: string;
  userRoleBn: 'কৃষক' | 'ক্রেতা' | 'বিশেষজ্ঞ' | 'প্রশাসক';
  adminRole?: AdminRoleType;
  positionTitleBn: string;
  divisionId: string;
  districtId: string;
  upazilaId: string;
}

export const INITIAL_AUTH_ACCOUNTS: AuthAccount[] = [
  {
    id: 'acc-superadmin',
    username: 'superadmin',
    email: 'superadmin@krishibondhu.bd',
    password: 'SuperAdmin@2026',
    nameBn: 'মোঃ সোলায়মান শিকদার',
    phoneBn: '০১৭১২-৩৪৫৬৭৮',
    userRoleBn: 'প্রশাসক',
    adminRole: 'Super Admin',
    positionTitleBn: 'সুপার অ্যাডমিন (Super Admin)',
    divisionId: 'div-rajshahi',
    districtId: 'dist-bogura',
    upazilaId: 'upz-shibganj',
  },
  {
    id: 'acc-market',
    username: 'marketmanager',
    email: 'market@krishibondhu.bd',
    password: 'Market@2026',
    nameBn: 'কৃষিবিদ শারমিন আক্তার',
    phoneBn: '০১৫৫২-৩৩৪৪৫৫',
    userRoleBn: 'প্রশাসক',
    adminRole: 'Market Manager',
    positionTitleBn: 'মার্কেট ম্যানেজার (Market Manager)',
    divisionId: 'div-rangpur',
    districtId: 'dist-dinajpur',
    upazilaId: 'upz-biral',
  },
  {
    id: 'acc-editor',
    username: 'contenteditor',
    email: 'editor@krishibondhu.bd',
    password: 'Editor@2026',
    nameBn: 'ড. মোঃ মাহবুবুর রহমান',
    phoneBn: '০১৭১৫-২২৩৩৪৪',
    userRoleBn: 'প্রশাসক',
    adminRole: 'Content Editor',
    positionTitleBn: 'কনটেন্ট এডিটর (Content Editor)',
    divisionId: 'div-dhaka',
    districtId: 'dist-gazipur',
    upazilaId: 'upz-kaliganj',
  },
  {
    id: 'acc-moderator',
    username: 'moderator',
    email: 'moderator@krishibondhu.bd',
    password: 'Moderator@2026',
    nameBn: 'মোঃ তানভীর আহমেদ',
    phoneBn: '০১৭৮৮-৫৫৬৬৭৭',
    userRoleBn: 'প্রশাসক',
    adminRole: 'Moderator',
    positionTitleBn: 'মডারেটর (Moderator)',
    divisionId: 'div-chattogram',
    districtId: 'dist-cumilla',
    upazilaId: 'upz-burichang',
  },
  {
    id: 'acc-support',
    username: 'supportmanager',
    email: 'support@krishibondhu.bd',
    password: 'Support@2026',
    nameBn: 'ফারহানা ইয়াসমিন',
    phoneBn: '০১৮৪৪-৭৭৮৮৯৯',
    userRoleBn: 'প্রশাসক',
    adminRole: 'Support Agent',
    positionTitleBn: 'সাপোর্ট ম্যানেজার (Support Manager)',
    divisionId: 'div-dhaka',
    districtId: 'dist-dhaka',
    upazilaId: 'upz-savar',
  },
  {
    id: 'acc-farmer',
    username: 'farmer',
    email: 'farmer@krishibondhu.bd',
    password: 'Farmer@2026',
    nameBn: 'মোঃ রফিকুল ইসলাম',
    phoneBn: '০১৮১৯-৮৭৬৫৪৩',
    userRoleBn: 'কৃষক',
    adminRole: undefined,
    positionTitleBn: 'নিবন্ধিত কৃষক সদস্য',
    divisionId: 'div-rajshahi',
    districtId: 'dist-bogura',
    upazilaId: 'upz-shibganj',
  },
];

export const PUBLIC_DEMO_ACCOUNTS = INITIAL_AUTH_ACCOUNTS.filter(
  (account) => account.userRoleBn !== 'কৃষক'
);

export function canAccessAdminPanel(account: AuthAccount | null | undefined): boolean {
  if (!account || !account.adminRole) return false;
  return getAllowedAdminModulesForRole(account.adminRole).length > 0;
}

/**
 * Cascading selector helper:
 * Returns active districts belonging to a division.
 */
export function getDistrictsByDivision(
  districts: DistrictEntity[],
  divisionId: string,
  includeInactive = false
): DistrictEntity[] {
  if (!divisionId) return [];
  return districts.filter(
    (d) => d.divisionId === divisionId && (includeInactive || d.isActive)
  );
}

/**
 * Returns active upazilas belonging to a district.
 */
export function getUpazilasByDistrict(
  upazilas: UpazilaEntity[],
  districtId: string,
  includeInactive = false
): UpazilaEntity[] {
  if (!districtId) return [];
  return upazilas.filter(
    (u) => u.districtId === districtId && (includeInactive || u.isActive)
  );
}

/**
 * Validates and reconciles cascading selection when division or district changes.
 */
export function reconcileCascadingLocation(
  divisions: DivisionEntity[],
  districts: DistrictEntity[],
  upazilas: UpazilaEntity[],
  selectedDivisionId: string,
  selectedDistrictId: string,
  selectedUpazilaId: string
): {
  divisionId: string;
  districtId: string;
  upazilaId: string;
  upazila?: UpazilaEntity;
} {
  const validDiv =
    divisions.find((d) => d.id === selectedDivisionId && d.isActive) ||
    divisions.find((d) => d.isActive) ||
    divisions[0];

  const divId = validDiv ? validDiv.id : '';
  const validDistricts = getDistrictsByDivision(districts, divId, false);
  const validDist =
    validDistricts.find((d) => d.id === selectedDistrictId) || validDistricts[0];

  const distId = validDist ? validDist.id : '';
  const validUpazilas = getUpazilasByDistrict(upazilas, distId, false);
  const validUpz =
    validUpazilas.find((u) => u.id === selectedUpazilaId) || validUpazilas[0];

  return {
    divisionId: divId,
    districtId: distId,
    upazilaId: validUpz ? validUpz.id : '',
    upazila: validUpz,
  };
}

export interface LocationValidationResult {
  valid: boolean;
  errorBn?: string;
}

export function validateNewDivision(
  nameBn: string,
  existingDivisions: DivisionEntity[]
): LocationValidationResult {
  const trimmed = (nameBn || '').trim();
  if (!trimmed) {
    return { valid: false, errorBn: 'বিভাগের নাম ফাঁকা রাখা যাবে না।' };
  }
  const duplicate = existingDivisions.some(
    (d) => d.nameBn.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) {
    return { valid: false, errorBn: `"${trimmed}" বিভাগ ইতিমধ্যে তালিকায় রয়েছে।` };
  }
  return { valid: true };
}

export function validateNewDistrict(
  nameBn: string,
  divisionId: string,
  existingDistricts: DistrictEntity[]
): LocationValidationResult {
  const trimmed = (nameBn || '').trim();
  if (!divisionId) {
    return { valid: false, errorBn: 'জেলা তৈরির আগে অবশ্যই বিভাগ নির্বাচন করতে হবে।' };
  }
  if (!trimmed) {
    return { valid: false, errorBn: 'জেলার নাম ফাঁকা রাখা যাবে না।' };
  }
  const duplicate = existingDistricts.some(
    (d) =>
      d.divisionId === divisionId &&
      d.nameBn.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) {
    return {
      valid: false,
      errorBn: `নির্বাচিত বিভাগের মধ্যে "${trimmed}" জেলা ইতিমধ্যে রয়েছে। একই বিভাগে একই জেলা পুনরায় তৈরি করা যাবে না।`,
    };
  }
  return { valid: true };
}

export function validateNewUpazila(
  nameBn: string,
  divisionId: string,
  districtId: string,
  existingUpazilas: UpazilaEntity[]
): LocationValidationResult {
  const trimmed = (nameBn || '').trim();
  if (!divisionId) {
    return { valid: false, errorBn: 'উপজেলা তৈরির আগে বিভাগ নির্বাচন করতে হবে।' };
  }
  if (!districtId) {
    return { valid: false, errorBn: 'জেলা নির্বাচনের আগে উপজেলা তৈরি করা যাবে না।' };
  }
  if (!trimmed) {
    return { valid: false, errorBn: 'উপজেলার নাম ফাঁকা রাখা যাবে না।' };
  }
  const duplicate = existingUpazilas.some(
    (u) =>
      u.districtId === districtId &&
      u.nameBn.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) {
    return {
      valid: false,
      errorBn: `নির্বাচিত জেলার মধ্যে "${trimmed}" উপজেলা ইতিমধ্যে রয়েছে। একই জেলায় একই উপজেলা পুনরায় তৈরি করা যাবে না।`,
    };
  }
  return { valid: true };
}

export function validateMarketPriceInput(input: {
  cropNameBn?: string;
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  marketNameBn?: string;
  wholesalePrice?: number;
  retailPrice?: number;
  unitBn?: string;
  sourceBn?: string;
}): LocationValidationResult {
  if (!input.cropNameBn?.trim()) {
    return { valid: false, errorBn: 'ফসলের নাম আবশ্যক।' };
  }
  if (!input.divisionId || !input.districtId || !input.upazilaId) {
    return { valid: false, errorBn: 'বিভাগ, জেলা ও উপজেলা সঠিকভাবে নির্বাচন করতে হবে।' };
  }
  if (!input.marketNameBn?.trim()) {
    return { valid: false, errorBn: 'বাজারের নাম আবশ্যক।' };
  }
  const w = Number(input.wholesalePrice);
  const r = Number(input.retailPrice);
  if (Number.isNaN(w) || w <= 0 || Number.isNaN(r) || r <= 0) {
    return { valid: false, errorBn: 'পাইকারি ও খুচরা দাম অবশ্যই শূন্যের চেয়ে বেশি হতে হবে।' };
  }
  if (!input.unitBn?.trim()) {
    return { valid: false, errorBn: 'পরিমাপের একক স্পষ্ট থাকতে হবে।' };
  }
  if (!input.sourceBn?.trim()) {
    return { valid: false, errorBn: 'তথ্যের উৎস উল্লেখ করা আবশ্যক।' };
  }
  return { valid: true };
}

export function exportLocationsToCSV(
  divisions: DivisionEntity[],
  districts: DistrictEntity[],
  upazilas: UpazilaEntity[]
): string {
  const header = 'id,nameBn,type,parentNameBn,latitude,longitude,status';
  const rows: string[] = [header];

  for (const div of divisions) {
    rows.push(
      `${div.id},"${div.nameBn}",বিভাগ,"বাংলাদেশ",,,${div.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}`
    );
  }
  for (const dist of districts) {
    const parentDiv = divisions.find((d) => d.id === dist.divisionId);
    rows.push(
      `${dist.id},"${dist.nameBn}",জেলা,"${parentDiv ? parentDiv.nameBn + ' বিভাগ' : ''}",,,${
        dist.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'
      }`
    );
  }
  for (const upz of upazilas) {
    const parentDist = districts.find((d) => d.id === upz.districtId);
    rows.push(
      `${upz.id},"${upz.nameBn}",উপজেলা,"${parentDist ? parentDist.nameBn + ' জেলা' : ''}",${
        upz.latitude
      },${upz.longitude},${upz.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}`
    );
  }
  return rows.join('\n');
}
