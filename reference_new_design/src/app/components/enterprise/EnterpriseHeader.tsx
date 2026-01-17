import './EnterpriseHeader.css';

interface EnterpriseHeaderProps {
  modeFilter: 'all' | 'build' | 'execute';
  setModeFilter: (value: 'all' | 'build' | 'execute') => void;
  selectedYear: number | 'all';
  setSelectedYear: (value: number | 'all') => void;
  selectedQuarter: string | 'all';
  setSelectedQuarter: (value: string | 'all') => void;
}

export function EnterpriseHeader({
  modeFilter,
  setModeFilter,
  selectedYear,
  setSelectedYear,
  selectedQuarter,
  setSelectedQuarter
}: EnterpriseHeaderProps) {
  const years = ['all', 2025, 2026, 2027, 2028, 2029] as const;
  const quarters = ['all', 'Q1', 'Q2', 'Q3', 'Q4'] as const;

  return (
    <div className="enterprise-header-container">
      {/* Title and Filters Row */}
      <div className="enterprise-title-row">
        <div className="enterprise-title-content">
          <h1 className="enterprise-title-header">
            Capability Controls Matrix
          </h1>
          <p className="enterprise-title-sub">
            Directional alignment — are we intervening in the right places?
          </p>
        </div>

        {/* Filters next to title */}
        <div className="enterprise-filters-wrapper">
          {/* Mode Filter */}
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as 'all' | 'build' | 'execute')}
            className="enterprise-filter-select"
          >
            <option value="all">All Modes</option>
            <option value="build">Build Mode</option>
            <option value="execute">Execute Mode</option>
          </select>

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="enterprise-filter-select"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year === 'all' ? 'All Years' : year}
              </option>
            ))}
          </select>

          {/* Quarter Filter */}
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="enterprise-filter-select"
          >
            {quarters.map((quarter) => (
              <option key={quarter} value={quarter}>
                {quarter === 'all' ? 'All Quarters' : quarter}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}