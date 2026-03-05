import { useTranslation } from 'react-i18next';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import './CalendarDesk.css';

interface CalendarDeskProps {
  year: string;
  quarter: string;
  availableYears: string[];
  onYearChange: (year: string) => void;
  onQuarterChange: (quarter: string) => void;
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

const QUARTER_MONTHS: Record<string, { en: string[]; ar: string[] }> = {
  Q1: { en: ['January', 'February', 'March'], ar: ['يناير', 'فبراير', 'مارس'] },
  Q2: { en: ['April', 'May', 'June'], ar: ['أبريل', 'مايو', 'يونيو'] },
  Q3: { en: ['July', 'August', 'September'], ar: ['يوليو', 'أغسطس', 'سبتمبر'] },
  Q4: { en: ['October', 'November', 'December'], ar: ['أكتوبر', 'نوفمبر', 'ديسمبر'] },
};

export function CalendarDesk({ year, quarter, availableYears, onYearChange, onQuarterChange }: CalendarDeskProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const yearIdx = availableYears.indexOf(year);

  const handlePrevYear = () => {
    if (yearIdx > 0) onYearChange(availableYears[yearIdx - 1]);
  };
  const handleNextYear = () => {
    if (yearIdx < availableYears.length - 1) onYearChange(availableYears[yearIdx + 1]);
  };

  const months = QUARTER_MONTHS[quarter] || QUARTER_MONTHS.Q1;

  return (
    <div className="calendar-desk">
      {/* Header */}
      <div className="calendar-header">
        <Calendar className="calendar-header-icon" />
        <div>
          <h2 className="calendar-title">{t('josoor.calendar.title')}</h2>
          <p className="calendar-subtitle">{t('josoor.calendar.subtitle')}</p>
        </div>
      </div>

      {/* Year Selector */}
      <div className="calendar-year-section">
        <div className="calendar-year-nav">
          <button
            className="calendar-nav-btn"
            onClick={handlePrevYear}
            disabled={yearIdx <= 0}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="calendar-year-display">{year}</span>
          <button
            className="calendar-nav-btn"
            onClick={handleNextYear}
            disabled={yearIdx >= availableYears.length - 1}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="calendar-year-pills">
          {availableYears.map(y => (
            <button
              key={y}
              className={`calendar-year-pill ${y === year ? 'active' : ''}`}
              onClick={() => onYearChange(y)}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Quarter Selector */}
      <div className="calendar-quarter-section">
        <h3 className="calendar-section-label">{t('josoor.calendar.selectQuarter')}</h3>
        <div className="calendar-quarter-grid">
          {QUARTERS.map(q => {
            const qMonths = QUARTER_MONTHS[q];
            return (
              <button
                key={q}
                className={`calendar-quarter-card ${q === quarter ? 'active' : ''}`}
                onClick={() => onQuarterChange(q)}
              >
                <div className="calendar-quarter-label">{q}</div>
                <div className="calendar-quarter-months">
                  {(isAr ? qMonths.ar : qMonths.en).join(' · ')}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Selection Summary */}
      <div className="calendar-summary">
        <div className="calendar-summary-label">{t('josoor.calendar.activeSelection')}</div>
        <div className="calendar-summary-value">{year} — {quarter}</div>
        <div className="calendar-summary-months">
          {(isAr ? months.ar : months.en).join(', ')}
        </div>
        <p className="calendar-summary-hint">{t('josoor.calendar.hint')}</p>
      </div>
    </div>
  );
}
