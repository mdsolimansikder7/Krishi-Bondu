import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toBengaliNumber,
  convertLandArea,
  calculateSeedRequirement,
  calculateFertilizerForArea,
  calculateProfitAndLoss,
  getWeatherAdvisory,
} from './calculations.ts';

test('toBengaliNumber converts English digits to Bengali digits accurately', () => {
  assert.equal(toBengaliNumber(12345), '১২৩৪৫');
  assert.equal(toBengaliNumber(33.5, 1), '৩৩.৫');
  assert.equal(toBengaliNumber(0), '০');
});

test('convertLandArea converts Acre, Bigha, Hectare, and Shotok accurately', () => {
  // 1 Acre = 100 Shotok
  const fromAcre = convertLandArea(1, 'acre', 33);
  assert.equal(fromAcre.shotok, 100);
  assert.equal(fromAcre.bigha, 3.03);

  // 1 Bigha (standard 33 shotok)
  const fromBigha = convertLandArea(2, 'bigha', 33);
  assert.equal(fromBigha.shotok, 66);
  assert.equal(fromBigha.acre, 0.66);

  // Regional Bigha (e.g. 50 shotok)
  const regionalBigha = convertLandArea(1, 'bigha', 50);
  assert.equal(regionalBigha.shotok, 50);
  assert.equal(regionalBigha.acre, 0.5);
});

test('calculateSeedRequirement calculates seed and 10% safety buffer', () => {
  const res = calculateSeedRequirement(100, 120); // 100 shotok * 120g = 12,000g = 12kg
  assert.equal(res.totalGrams, 12000);
  assert.equal(res.totalKg, 12);
  assert.equal(res.recommendedBufferKg, 13.2);
});

test('calculateFertilizerForArea scales BARC/DAE doses by Shotok', () => {
  const res = calculateFertilizerForArea('biri_dhan', 33); // 1 standard Bigha (33 shotok)
  assert.equal(res.urea, 28.05); // 0.85 * 33
  assert.equal(res.tsp, 13.2);   // 0.40 * 33
});

test('calculateProfitAndLoss computes total cost, revenue, and net profit/loss accurately', () => {
  const profitCase = calculateProfitAndLoss(
    {
      seedCost: 1500,
      fertilizerCost: 4000,
      laborCost: 8000,
      irrigationCost: 2500,
      landPrepCost: 3000,
      transportCost: 1000,
      otherCost: 500,
    },
    60, // 60 Maunds
    1200 // 1200 BDT per Maund -> 72,000 BDT revenue
  );

  assert.equal(profitCase.totalExpense, 20500);
  assert.equal(profitCase.totalRevenue, 72000);
  assert.equal(profitCase.netProfitOrLoss, 51500);
  assert.equal(profitCase.isProfit, true);

  const lossCase = calculateProfitAndLoss(
    {
      seedCost: 5000,
      fertilizerCost: 5000,
      laborCost: 10000,
      irrigationCost: 2000,
      landPrepCost: 3000,
      transportCost: 1000,
      otherCost: 0,
    },
    20,
    1000 // 20,000 revenue vs 26,000 expense
  );

  assert.equal(lossCase.totalExpense, 26000);
  assert.equal(lossCase.totalRevenue, 20000);
  assert.equal(lossCase.netProfitOrLoss, -6000);
  assert.equal(lossCase.isProfit, false);
});

test('getWeatherAdvisory generates appropriate Bengali agricultural guidance', () => {
  const heavyRain = getWeatherAdvisory(65, 29, 85, 18, 25);
  assert.equal(heavyRain.severity, 'warning');
  assert.ok(heavyRain.alertTitleBn.includes('বৃষ্টি'));

  const storm = getWeatherAdvisory(95, 28, 90, 35, 50);
  assert.equal(storm.severity, 'danger');

  const clearDay = getWeatherAdvisory(0, 30, 10, 0, 12);
  assert.equal(clearDay.severity, 'normal');
});
