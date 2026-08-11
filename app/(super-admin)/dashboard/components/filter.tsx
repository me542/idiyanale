'use client';

import React, { useEffect, useState } from 'react';
import { getInstitutions } from '../../../../services/integration/institution/get-all-insti'; // adjust path to wherever you place get-insti.ts

interface FilterProps {
  onFilterChange?: (filters: {
    institution: string;
    ticketType: string;
  }) => void;
}

const Filter: React.FC<FilterProps> = ({ onFilterChange }) => {
  const [institution, setInstitution] = useState('ALL');
  const [ticketType, setTicketType] = useState('ALL');

  const [institutions, setInstitutions] = useState<string[]>(['ALL']);
  const [isLoadingInstitutions, setIsLoadingInstitutions] = useState(true);
  const [institutionsError, setInstitutionsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInstitutions() {
      setIsLoadingInstitutions(true);
      setInstitutionsError(null);
      try {
        const rows = await getInstitutions();
        if (cancelled) return;
        setInstitutions(['ALL', ...rows.map((r) => r.institution_name)]);
      } catch (err) {
        if (cancelled) return;
        setInstitutionsError(
          err instanceof Error ? err.message : 'Failed to load institutions.'
        );
        setInstitutions(['ALL']); // fall back to just ALL so the dropdown still works
      } finally {
        if (!cancelled) setIsLoadingInstitutions(false);
      }
    }

    loadInstitutions();
    return () => {
      cancelled = true;
    };
  }, []);

  const ticketTypes = [
    'ALL',
    'Service Request',
    'Changed Request',
    'Incident Report',
    'Problem Report',
  ];

  const handleInstitutionChange = (value: string) => {
    setInstitution(value);
    onFilterChange?.({ institution: value, ticketType });
  };

  const handleTicketTypeChange = (value: string) => {
    setTicketType(value);
    onFilterChange?.({ institution, ticketType: value });
  };

  const handleClear = () => {
    // reset to default ALL
    setInstitution('ALL');
    setTicketType('ALL');
    onFilterChange?.({ institution: 'ALL', ticketType: 'ALL' });
  };

  

  return (
    <div className="flex justify-start gap-4 mb-6">
      {/* Institution Filter */}
      <div className="flex items-center gap-3 border border-slate-200 rounded-xl bg-white px-4 py-3 shadow-md min-w-[16rem] w-fit shrink-0">
        <span className="text-sm font-semibold tracking-wide text-slate-700 whitespace-nowrap">
          INSTITUTION :
        </span>
        <select
          value={institution}
          onChange={(e) => handleInstitutionChange(e.target.value)}
          disabled={isLoadingInstitutions}
          className="border-b border-slate-200 bg-transparent py-1 text-sm text-slate-600 outline-none disabled:opacity-60"
        >
          <option value="" disabled hidden>
            {isLoadingInstitutions ? 'Loading...' : ''}
          </option>
          {institutions.map((inst) => (
            <option key={inst} value={inst}>
              {inst}
            </option>
          ))}
        </select>
      </div>

      {/* Ticket Type Filter */}
      <div className="flex items-center gap-3 border border-slate-200 rounded-xl bg-white px-4 py-3 shadow-md min-w-[16rem] w-fit shrink-0">
        <span className="text-sm font-semibold tracking-wide text-slate-700 whitespace-nowrap">
          TICKET TYPE :
        </span>
        <select
          value={ticketType}
          onChange={(e) => handleTicketTypeChange(e.target.value)}
          className="border-b border-slate-200 bg-transparent py-1 text-sm text-slate-600 outline-none"
        >
          <option value="" disabled hidden></option>
          {ticketTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {institutionsError && (
        <span className="self-center text-xs font-medium text-red-500">
          {institutionsError}
        </span>
      )}
      <button
        type="button"
        onClick={handleClear}
        className="ml-2 self-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
      >
        Clear
      </button>
    </div>
  );
};

export default Filter;