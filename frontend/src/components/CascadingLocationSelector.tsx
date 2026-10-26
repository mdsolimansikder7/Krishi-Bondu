import React, { useState, useMemo } from 'react';
import { MapPin, Search, ChevronRight } from 'lucide-react';
import {
  DivisionEntity,
  DistrictEntity,
  UpazilaEntity,
  getDistrictsByDivision,
  getUpazilasByDistrict,
} from '@shared/utils/locationAndAdminRules';

export interface CascadingLocationSelectorProps {
  divisions: DivisionEntity[];
  districts: DistrictEntity[];
  upazilas: UpazilaEntity[];
  selectedDivisionId: string;
  selectedDistrictId: string;
  selectedUpazilaId: string;
  onChange: (selection: {
    divisionId: string;
    districtId: string;
    upazilaId: string;
    division?: DivisionEntity;
    district?: DistrictEntity;
    upazila?: UpazilaEntity;
  }) => void;
  allowAll?: boolean;
  showSearch?: boolean;
  compact?: boolean;
  idPrefix?: string;
}

export const CascadingLocationSelector: React.FC<CascadingLocationSelectorProps> = ({
  divisions,
  districts,
  upazilas,
  selectedDivisionId,
  selectedDistrictId,
  selectedUpazilaId,
  onChange,
  allowAll = false,
  showSearch = true,
  compact = false,
  idPrefix = 'cascading-loc',
}) => {
  const [quickSearch, setQuickSearch] = useState('');

  // Only show active locations to regular selectors
  const activeDivisions = useMemo(
    () => divisions.filter((d) => d.isActive),
    [divisions]
  );

  const availableDistricts = useMemo(
    () => getDistrictsByDivision(districts, selectedDivisionId, false),
    [districts, selectedDivisionId]
  );

  const availableUpazilas = useMemo(
    () => getUpazilasByDistrict(upazilas, selectedDistrictId, false),
    [upazilas, selectedDistrictId]
  );

  // Quick search suggestions across active Upazilas/Districts
  const searchResults = useMemo(() => {
    const q = quickSearch.trim().toLowerCase();
    if (!q) return [];
    const results: {
      division: DivisionEntity;
      district: DistrictEntity;
      upazila: UpazilaEntity;
      labelBn: string;
    }[] = [];

    for (const upz of upazilas) {
      if (!upz.isActive) continue;
      const dist = districts.find((d) => d.id === upz.districtId && d.isActive);
      if (!dist) continue;
      const div = divisions.find((dv) => dv.id === dist.divisionId && dv.isActive);
      if (!div) continue;

      if (
        upz.nameBn.toLowerCase().includes(q) ||
        dist.nameBn.toLowerCase().includes(q) ||
        div.nameBn.toLowerCase().includes(q) ||
        upz.slug.toLowerCase().includes(q) ||
        dist.slug.toLowerCase().includes(q)
      ) {
        results.push({
          division: div,
          district: dist,
          upazila: upz,
          labelBn: `${div.nameBn} → ${dist.nameBn} → ${upz.nameBn}`,
        });
      }
      if (results.length >= 8) break;
    }
    return results;
  }, [quickSearch, divisions, districts, upazilas]);

  const handleDivisionChange = (newDivId: string) => {
    if (!newDivId) {
      onChange({ divisionId: '', districtId: '', upazilaId: '' });
      return;
    }
    const div = activeDivisions.find((d) => d.id === newDivId);
    const nextDistricts = getDistrictsByDivision(districts, newDivId, false);
    const nextDist = allowAll ? undefined : nextDistricts[0];
    const nextUpazilas = nextDist
      ? getUpazilasByDistrict(upazilas, nextDist.id, false)
      : [];
    const nextUpz = allowAll ? undefined : nextUpazilas[0];

    onChange({
      divisionId: newDivId,
      districtId: nextDist ? nextDist.id : '',
      upazilaId: nextUpz ? nextUpz.id : '',
      division: div,
      district: nextDist,
      upazila: nextUpz,
    });
  };

  const handleDistrictChange = (newDistId: string) => {
    const div = activeDivisions.find((d) => d.id === selectedDivisionId);
    if (!newDistId) {
      onChange({
        divisionId: selectedDivisionId,
        districtId: '',
        upazilaId: '',
        division: div,
      });
      return;
    }
    const dist = availableDistricts.find((d) => d.id === newDistId);
    const nextUpazilas = getUpazilasByDistrict(upazilas, newDistId, false);
    const nextUpz = allowAll ? undefined : nextUpazilas[0];

    onChange({
      divisionId: selectedDivisionId,
      districtId: newDistId,
      upazilaId: nextUpz ? nextUpz.id : '',
      division: div,
      district: dist,
      upazila: nextUpz,
    });
  };

  const handleUpazilaChange = (newUpzId: string) => {
    const div = activeDivisions.find((d) => d.id === selectedDivisionId);
    const dist = availableDistricts.find((d) => d.id === selectedDistrictId);
    const upz = availableUpazilas.find((u) => u.id === newUpzId);
    onChange({
      divisionId: selectedDivisionId,
      districtId: selectedDistrictId,
      upazilaId: newUpzId,
      division: div,
      district: dist,
      upazila: upz,
    });
  };

  const selectedDivObj = activeDivisions.find((d) => d.id === selectedDivisionId);
  const selectedDistObj = availableDistricts.find((d) => d.id === selectedDistrictId);
  const selectedUpzObj = availableUpazilas.find((u) => u.id === selectedUpazilaId);

  return (
    <div className="space-y-3">
      {/* Quick Search by Name (Section 5.2) */}
      {showSearch && (
        <div className="relative">
          <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder="বিভাগ, জেলা বা উপজেলার নাম লিখে দ্রুত খুঁজুন (যেমন: কালীগঞ্জ, শিবগঞ্জ, গাজীপুর)..."
            aria-label="অবস্থান অনুসন্ধান করুন"
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs sm:text-sm text-[#173B2A] focus:bg-white focus:border-[#166534] focus:outline-none"
          />
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl border border-stone-200 shadow-lg z-40 max-h-56 overflow-y-auto divide-y divide-stone-100">
              {searchResults.map((res) => (
                <button
                  key={res.upazila.id}
                  type="button"
                  onClick={() => {
                    onChange({
                      divisionId: res.division.id,
                      districtId: res.district.id,
                      upazilaId: res.upazila.id,
                      division: res.division,
                      district: res.district,
                      upazila: res.upazila,
                    });
                    setQuickSearch('');
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-xs sm:text-sm hover:bg-[#DCFCE7]/50 flex items-center justify-between text-[#173B2A] cursor-pointer"
                >
                  <span className="font-semibold">{res.labelBn}</span>
                  <span className="text-[11px] text-[#166534]">নির্বাচন করুন</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3-Step Cascading Dropdowns: বিভাগ → জেলা → উপজেলা */}
      <div
        className={`grid grid-cols-1 ${
          compact ? 'sm:grid-cols-3 gap-2.5' : 'sm:grid-cols-3 gap-3.5'
        }`}
      >
        {/* Step 1: Division */}
        <div>
          <label
            htmlFor={`${idPrefix}-division`}
            className="block text-xs font-semibold text-[#173B2A] mb-1"
          >
            বিভাগ নির্বাচন করুন
          </label>
          <select
            id={`${idPrefix}-division`}
            value={selectedDivisionId}
            onChange={(e) => handleDivisionChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs sm:text-sm font-semibold text-[#173B2A] focus:border-[#166534] focus:outline-none"
          >
            {allowAll && <option value="">সব বিভাগ</option>}
            {activeDivisions.map((div) => (
              <option key={div.id} value={div.id}>
                {div.nameBn} বিভাগ
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: District (Filtered by Division) */}
        <div>
          <label
            htmlFor={`${idPrefix}-district`}
            className="block text-xs font-semibold text-[#173B2A] mb-1"
          >
            জেলা নির্বাচন করুন
          </label>
          <select
            id={`${idPrefix}-district`}
            value={selectedDistrictId}
            disabled={!selectedDivisionId}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs sm:text-sm font-semibold text-[#173B2A] disabled:opacity-50 focus:border-[#166534] focus:outline-none"
          >
            {allowAll && <option value="">সব জেলা</option>}
            {!selectedDivisionId && !allowAll && (
              <option value="">প্রথমে বিভাগ নির্বাচন করুন</option>
            )}
            {availableDistricts.map((dist) => (
              <option key={dist.id} value={dist.id}>
                {dist.nameBn} জেলা
              </option>
            ))}
          </select>
        </div>

        {/* Step 3: Upazila (Filtered by District) */}
        <div>
          <label
            htmlFor={`${idPrefix}-upazila`}
            className="block text-xs font-semibold text-[#173B2A] mb-1"
          >
            উপজেলা নির্বাচন করুন
          </label>
          <select
            id={`${idPrefix}-upazila`}
            value={selectedUpazilaId}
            disabled={!selectedDistrictId}
            onChange={(e) => handleUpazilaChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#F5F8F1] border border-stone-300 text-xs sm:text-sm font-semibold text-[#173B2A] disabled:opacity-50 focus:border-[#166534] focus:outline-none"
          >
            {allowAll && <option value="">সব উপজেলা</option>}
            {!selectedDistrictId && !allowAll && (
              <option value="">প্রথমে জেলা নির্বাচন করুন</option>
            )}
            {availableUpazilas.map((upz) => (
              <option key={upz.id} value={upz.id}>
                {upz.nameBn} উপজেলা
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Breadcrumb Preview of Selected Hierarchy */}
      {!compact && (selectedDivObj || selectedDistObj || selectedUpzObj) && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-600 pt-1">
          <MapPin className="w-3.5 h-3.5 text-[#166534] shrink-0" />
          <span>নির্বাচিত অবস্থান:</span>
          <span className="font-bold text-[#14532D]">
            {selectedDivObj ? `${selectedDivObj.nameBn} বিভাগ` : 'সব বিভাগ'}
          </span>
          {selectedDistObj && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              <span className="font-bold text-[#14532D]">{selectedDistObj.nameBn} জেলা</span>
            </>
          )}
          {selectedUpzObj && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              <span className="font-bold text-[#166534]">{selectedUpzObj.nameBn} উপজেলা</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
