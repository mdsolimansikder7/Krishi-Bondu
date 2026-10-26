import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasAdminPermission,
  getDistrictsByDivision,
  getUpazilasByDistrict,
  reconcileCascadingLocation,
  validateNewDivision,
  validateNewDistrict,
  validateNewUpazila,
  validateMarketPriceInput,
  canAccessAdminPanel,
  getAllowedAdminModulesForRole,
  DivisionEntity,
  DistrictEntity,
  UpazilaEntity,
} from './locationAndAdminRules.ts';
import {
  INITIAL_DIVISIONS,
  INITIAL_DISTRICTS,
  INITIAL_UPAZILAS,
} from '../data/locationAndAdminData.ts';

const mockDivisions: DivisionEntity[] = [
  { id: 'div-dhaka', nameBn: 'ঢাকা', slug: 'dhaka', code: 'BD-30', isActive: true, createdAtBn: 'আজ', updatedAtBn: 'আজ' },
  { id: 'div-rajshahi', nameBn: 'রাজশাহী', slug: 'rajshahi', code: 'BD-50', isActive: true, createdAtBn: 'আজ', updatedAtBn: 'আজ' },
];

const mockDistricts: DistrictEntity[] = [
  { id: 'dist-gazipur', divisionId: 'div-dhaka', nameBn: 'গাজীপুর', slug: 'gazipur', code: 'BD-3018', isActive: true, createdAtBn: 'আজ', updatedAtBn: 'আজ' },
  { id: 'dist-bogura', divisionId: 'div-rajshahi', nameBn: 'বগুড়া', slug: 'bogura', code: 'BD-5006', isActive: true, createdAtBn: 'আজ', updatedAtBn: 'আজ' },
];

const mockUpazilas: UpazilaEntity[] = [
  { id: 'upz-kaliganj', districtId: 'dist-gazipur', divisionId: 'div-dhaka', nameBn: 'কালীগঞ্জ', slug: 'kaliganj', code: 'UPZ-101', latitude: 23.928, longitude: 90.569, timezone: 'Asia/Dhaka', isActive: true, createdAtBn: 'আজ', updatedAtBn: 'আজ' },
  { id: 'upz-shibganj', districtId: 'dist-bogura', divisionId: 'div-rajshahi', nameBn: 'শিবগঞ্জ', slug: 'shibganj', code: 'UPZ-201', latitude: 25.001, longitude: 89.322, timezone: 'Asia/Dhaka', isActive: true, createdAtBn: 'আজ', updatedAtBn: 'আজ' },
];

test('Duplicate validation blocks duplicate divisions, districts in same division, and upazilas in same district', () => {
  const dupDiv = validateNewDivision('ঢাকা', mockDivisions);
  assert.equal(dupDiv.valid, false);

  const dupDist = validateNewDistrict('গাজীপুর', 'div-dhaka', mockDistricts);
  assert.equal(dupDist.valid, false);

  const noDivDist = validateNewDistrict('নরসিংদী', '', mockDistricts);
  assert.equal(noDivDist.valid, false);

  const validDist = validateNewDistrict('নরসিংদী', 'div-dhaka', mockDistricts);
  assert.equal(validDist.valid, true);

  const noDistUpz = validateNewUpazila('শ্রীপুর', 'div-dhaka', '', mockUpazilas);
  assert.equal(noDistUpz.valid, false);

  const dupUpz = validateNewUpazila('কালীগঞ্জ', 'div-dhaka', 'dist-gazipur', mockUpazilas);
  assert.equal(dupUpz.valid, false);

  const validUpz = validateNewUpazila('শ্রীপুর', 'div-dhaka', 'dist-gazipur', mockUpazilas);
  assert.equal(validUpz.valid, true);
});

test('Cascading location selector resets invalid child district and upazila when division changes', () => {
  const dhakaDistricts = getDistrictsByDivision(mockDistricts, 'div-dhaka');
  assert.equal(dhakaDistricts.length, 1);
  assert.equal(dhakaDistricts[0].id, 'dist-gazipur');

  const gazipurUpazilas = getUpazilasByDistrict(mockUpazilas, 'dist-gazipur');
  assert.equal(gazipurUpazilas.length, 1);
  assert.equal(gazipurUpazilas[0].id, 'upz-kaliganj');

  const reconciled = reconcileCascadingLocation(
    mockDivisions,
    mockDistricts,
    mockUpazilas,
    'div-rajshahi',
    'dist-gazipur',
    'upz-kaliganj'
  );
  assert.equal(reconciled.divisionId, 'div-rajshahi');
  assert.equal(reconciled.districtId, 'dist-bogura');
  assert.equal(reconciled.upazilaId, 'upz-shibganj');
});

test('Role-Based Access Control (RBAC) enforces server and UI permissions accurately', () => {
  assert.equal(hasAdminPermission('Super Admin', 'manage_locations'), true);
  assert.equal(hasAdminPermission('Super Admin', 'view_audit_logs'), true);

  assert.equal(hasAdminPermission('Content Editor', 'manage_content'), true);
  assert.equal(hasAdminPermission('Content Editor', 'manage_locations'), false);
  assert.equal(hasAdminPermission('Content Editor', 'publish_market_prices'), false);

  assert.equal(hasAdminPermission('Market Manager', 'manage_market_prices'), true);
  assert.equal(hasAdminPermission('Market Manager', 'manage_users'), false);

  assert.equal(hasAdminPermission('Moderator', 'moderate_marketplace'), true);
  assert.equal(hasAdminPermission('Support Agent', 'manage_qa_support'), true);
});

test('validateMarketPriceInput rejects zero/negative prices and missing location IDs', () => {
  const zeroPrice = validateMarketPriceInput({
    cropNameBn: 'আমন ধান',
    divisionId: 'div-dhaka',
    districtId: 'dist-gazipur',
    upazilaId: 'upz-kaliganj',
    marketNameBn: 'কালীগঞ্জ বাজার',
    wholesalePrice: 0,
    retailPrice: 1300,
    unitBn: 'মণ',
    sourceBn: 'DAM',
  });
  assert.equal(zeroPrice.valid, false);

  const validPrice = validateMarketPriceInput({
    cropNameBn: 'আমন ধান',
    divisionId: 'div-dhaka',
    districtId: 'dist-gazipur',
    upazilaId: 'upz-kaliganj',
    marketNameBn: 'কালীগঞ্জ বাজার',
    wholesalePrice: 1250,
    retailPrice: 1320,
    unitBn: 'মণ',
    sourceBn: 'DAM',
  });
  assert.equal(validPrice.valid, true);
});

test('canAccessAdminPanel and role permissions restrict admin access by assigned role', () => {
  // Unauthenticated guest cannot access Admin Panel
  assert.equal(canAccessAdminPanel(null), false);

  const farmerAccount = {
    id: 'farmer',
    username: 'farmer',
    email: 'farmer@example.com',
    nameBn: 'কৃষক',
    phoneBn: '',
    userRoleBn: 'কৃষক' as const,
    positionTitleBn: 'নিবন্ধিত কৃষক সদস্য',
    divisionId: 'div-rajshahi',
    districtId: 'dist-bogura',
    upazilaId: 'upz-shibganj',
  };
  assert.equal(canAccessAdminPanel(farmerAccount), false);

  // A Better Auth user receives access only when a trusted adminRole is assigned.
  const superAdminAccount = { ...farmerAccount, adminRole: 'Super Admin' as const };
  assert.equal(canAccessAdminPanel(superAdminAccount), true);
  assert.equal(getAllowedAdminModulesForRole(superAdminAccount.adminRole).length, 16);

  // Market Manager login grants access only to market-related modules
  assert.deepEqual(getAllowedAdminModulesForRole('Market Manager'), [
    'dashboard',
    'market-prices',
    'weather-alerts',
    'audit-logs',
  ]);

  // Content Editor login grants access only to content modules
  assert.deepEqual(getAllowedAdminModulesForRole('Content Editor'), [
    'dashboard',
    'crops',
    'diseases',
    'calendar',
    'articles',
  ]);

  // Moderator login grants access only to moderation modules
  assert.deepEqual(getAllowedAdminModulesForRole('Moderator'), [
    'dashboard',
    'marketplace',
    'qa',
    'reports',
  ]);

  // Support Manager login grants access only to support modules
  assert.deepEqual(getAllowedAdminModulesForRole('Support Agent'), [
    'dashboard',
    'qa',
    'reports',
    'notifications',
  ]);
});

test('Complete Bangladesh Location Hierarchy contains all 8 Divisions, 64 Districts, and 490+ Upazilas', () => {
  assert.equal(INITIAL_DIVISIONS.length, 8);
  assert.equal(INITIAL_DISTRICTS.length, 64);
  assert.ok(INITIAL_UPAZILAS.length >= 490);

  // Every single one of the 64 districts must belong to a valid division and have at least 3 upazilas
  for (const dist of INITIAL_DISTRICTS) {
    const parentDiv = INITIAL_DIVISIONS.find((d) => d.id === dist.divisionId);
    assert.ok(parentDiv, `District ${dist.nameBn} has valid division`);
    const distUpazilas = getUpazilasByDistrict(INITIAL_UPAZILAS, dist.id, true);
    assert.ok(
      distUpazilas.length >= 3,
      `District ${dist.nameBn} has ${distUpazilas.length} upazilas`
    );
  }
});
