import { useState, useMemo, useEffect } from 'react';
import type { L1Capability, L3Capability } from '../../types/enterprise';
import type { OverlayType } from '../../utils/enterpriseOverlayUtils';
import { getCapabilityMatrix } from '../../services/enterpriseService';
import { EnterpriseHeader } from './enterprise/EnterpriseHeader';
import { OverlayControls } from './enterprise/OverlayControls';
import { DynamicInsightPanel } from './enterprise/DynamicInsightPanel';
import { DynamicInsightTitle } from './enterprise/DynamicInsightTitle';
import { CapabilityMatrix } from './enterprise/CapabilityMatrix';
import { CapabilityTooltip } from './enterprise/CapabilityTooltip';

import './enterprise/EnterpriseDesk.css';

interface TooltipData {
  l3: L3Capability;
  x: number;
  y: number;
}

interface EnterpriseDeskProps {
  year?: string;
  quarter?: string;
}

export function EnterpriseDesk({ year = '2025', quarter = 'Q1' }: EnterpriseDeskProps) {
  // Filter state (single source of truth)
  const [selectedOverlay, setSelectedOverlay] = useState<OverlayType>('none');
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [modeFilter, setModeFilter] = useState<'all' | 'build' | 'execute'>('all');

  // Convert global year/quarter to service format
  // Backend expects: year as number, quarter as integer (1, 2, 3, 4)
  const selectedYear: number | 'all' = parseInt(year);
  const selectedQuarter: number | 'all' = parseInt(quarter.replace('Q', '')); // "Q4" → 4

  // Data fetching state
  const [matrixData, setMatrixData] = useState<L1Capability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch capability matrix from Neo4j
  useEffect(() => {
    let isCancelled = false;

    async function fetchMatrix() {
      setIsLoading(true);
      setError(null);

      console.log('[EnterpriseDesk] 🚀 Fetching matrix at', new Date().toISOString(), { selectedYear, selectedQuarter });

      try {
        const data = await getCapabilityMatrix(selectedYear, selectedQuarter);

        if (isCancelled) {
          console.log('[EnterpriseDesk] ⚠️ Request cancelled, ignoring results');
          return;
        }

        console.log('[EnterpriseDesk] ✅ Received data:', {
          l1Count: data.length,
          totalL3: data.reduce((sum, l1) => sum + l1.l2.reduce((s, l2) => s + l2.l3.length, 0), 0)
        });
        setMatrixData(data);
      } catch (err) {
        if (!isCancelled) {
          console.error('[EnterpriseDesk] ❌ Failed to fetch capability matrix:', err);
          setError(err instanceof Error ? err.message : 'Failed to load capabilities');
          setMatrixData([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchMatrix();

    return () => {
      isCancelled = true;
      console.log('[EnterpriseDesk] 🛑 Cleanup: Cancelling previous request');
    };
  }, [selectedYear, selectedQuarter]);

  // Check if L3 should be dimmed based on filters
  // NOTE: Year/quarter filtering is done server-side during matrix building
  // Only mode filter applies here (build vs execute)
  const isL3Dimmed = (l3: L3Capability): boolean => {
    const matchesModeFilter =
      modeFilter === 'all' ||
      (modeFilter === 'build' && l3.mode === 'build') ||
      (modeFilter === 'execute' && l3.mode === 'execute');

    return !matchesModeFilter; // Dim if doesn't match mode filter
  };

  // Toggle overlay selection (single overlay only)
  const toggleOverlay = (overlay: OverlayType) => {
    if (overlay === 'none') {
      setSelectedOverlay('none');
      return;
    }

    if (selectedOverlay === overlay) {
      setSelectedOverlay('none');
    } else {
      setSelectedOverlay(overlay);
    }
  };

  // Tooltip handlers
  const handleL3Hover = (l3: L3Capability, event: React.MouseEvent) => {
    setTooltip({
      l3,
      x: event.clientX,
      y: event.clientY
    });
  };

  const handleL3Leave = () => {
    setTooltip(null);
  };

  // Get all L3s (respecting filters) for insight panel
  const allL3s = useMemo(() => {
    const l3List: L3Capability[] = [];
    matrixData.forEach(l1 => {
      l1.l2.forEach(l2 => {
        l2.l3.forEach(l3 => {
          if (!isL3Dimmed(l3)) {
            l3List.push(l3);
          }
        });
      });
    });
    return l3List;
  }, [selectedYear, selectedQuarter, modeFilter, matrixData]);

  return (
    <div className="enterprise-desk-container">
      {/* Sticky Header */}
      <div className="enterprise-header-wrapper">
        {/* Title Row: Split into 2 columns matching blocks below */}
        <div className="enterprise-title-row">
          <h1 className="enterprise-main-title">Capability Controls Signals</h1>
          <div className="enterprise-insights-title-section">
            <DynamicInsightTitle selectedOverlay={selectedOverlay} />
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value as 'all' | 'build' | 'execute')}
              className="insight-mode-filter"
            >
              <option value="all">All Modes</option>
              <option value="build">Build</option>
              <option value="execute">Execute</option>
            </select>
          </div>
        </div>

        {/* Single Row: Overlay Buttons Block + Insights Panel Block */}
        <div className="enterprise-controls-row">
          {/* Left Block: All 6 Overlay Buttons */}
          <div className="overlay-buttons-block">
            <button
              onClick={() => toggleOverlay('none')}
              className={`overlay-btn ${selectedOverlay === 'none' ? 'overlay-btn-active' : 'overlay-btn-inactive'}`}
            >
              Status Only
            </button>
            <button
              onClick={() => toggleOverlay('risk-exposure')}
              className={`overlay-btn ${selectedOverlay === 'risk-exposure' ? 'overlay-btn-active' : 'overlay-btn-inactive'}`}
            >
              ⚠️ Risk Exposure
            </button>
            <button
              onClick={() => toggleOverlay('external-pressure')}
              className={`overlay-btn ${selectedOverlay === 'external-pressure' ? 'overlay-btn-active' : 'overlay-btn-inactive'}`}
            >
              🎯 External Pressure
            </button>
            <button
              onClick={() => toggleOverlay('footprint-stress')}
              className={`overlay-btn ${selectedOverlay === 'footprint-stress' ? 'overlay-btn-active' : 'overlay-btn-inactive'}`}
            >
              ⚖️ Footprint Stress
            </button>
            <button
              onClick={() => toggleOverlay('change-saturation')}
              className={`overlay-btn ${selectedOverlay === 'change-saturation' ? 'overlay-btn-active' : 'overlay-btn-inactive'}`}
            >
              ⚡ Change Saturation
            </button>
            <button
              onClick={() => toggleOverlay('trend-warning')}
              className={`overlay-btn ${selectedOverlay === 'trend-warning' ? 'overlay-btn-active' : 'overlay-btn-inactive'}`}
            >
              📉 Trend Warning
            </button>
          </div>

          {/* Right Block: Insights Panel */}
          <DynamicInsightPanel
            selectedOverlay={selectedOverlay}
            allL3s={allL3s}
          />
        </div>
      </div>

      {/* Scrollable Matrix Wrapper */}
      <div className="enterprise-matrix-wrapper">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-slate-400">Loading Enterprise Data...</div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center text-red-500">Error: {error}</div>
        ) : (
          <CapabilityMatrix
            capabilityMatrix={matrixData}
            selectedOverlay={selectedOverlay}
            isL3Dimmed={isL3Dimmed}
            onL3Hover={handleL3Hover}
            onL3Leave={handleL3Leave}
          />
        )}
      </div>

      {/* Tooltip - Fixed positioning to prevent edge cutoff */}
      {tooltip && (
        <CapabilityTooltip
          l3={tooltip.l3}
          x={tooltip.x}
          y={tooltip.y}
          selectedOverlay={selectedOverlay}
        />
      )}
    </div>
  );
}
