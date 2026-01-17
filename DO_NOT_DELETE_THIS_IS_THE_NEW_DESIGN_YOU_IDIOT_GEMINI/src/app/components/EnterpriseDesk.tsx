import { useState, useMemo, useEffect } from 'react';
import { capabilityMatrix, type L3Capability } from '../data/capabilityData';
import type { OverlayType } from '../utils/enterpriseOverlayUtils';
import { EnterpriseHeader } from './enterprise/EnterpriseHeader';
import { OverlayControls } from './enterprise/OverlayControls';
import { DynamicInsightPanel } from './enterprise/DynamicInsightPanel';
import { CapabilityMatrix } from './enterprise/CapabilityMatrix';
import { CapabilityTooltip } from './enterprise/CapabilityTooltip';

import './EnterpriseDesk.css';

interface TooltipData {
  l3: L3Capability;
  x: number;
  y: number;
}

export function EnterpriseDesk() {
  // State management
  const [selectedOverlay, setSelectedOverlay] = useState<OverlayType>('none');
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedQuarter, setSelectedQuarter] = useState<string | 'all'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'build' | 'execute'>('all');

  // API Data State
  const [matrixData, setMatrixData] = useState<L1Capability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { getStrategicInitiatives } = await import('@/services/enterpriseService');
        const data = await getStrategicInitiatives(selectedYear === 'all' ? 0 : selectedYear);
        if (data && data.nodes) {
          // setMatrixData(transform(data));
          console.log("Enterprise Data:", data);
        } else {
          setError("No enterprise data found");
        }
      } catch (e) {
        console.error("Failed to fetch enterprise data", e);
        setError("Failed to connect to backend");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedYear]);

  // Check if L3 should be dimmed based on filters
  const isL3Dimmed = (l3: L3Capability): boolean => {
    const matchesYear = selectedYear === 'all' || l3.year === selectedYear;
    const matchesQuarter = selectedQuarter === 'all' || l3.quarter === selectedQuarter;
    const matchesModeFilter =
      modeFilter === 'all' ||
      (modeFilter === 'build' && l3.mode === 'build') ||
      (modeFilter === 'execute' && l3.mode === 'execute');

    return !(matchesYear && matchesQuarter && matchesModeFilter);
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
    capabilityMatrix.forEach(l1 => {
      l1.l2.forEach(l2 => {
        l2.l3.forEach(l3 => {
          if (!isL3Dimmed(l3)) {
            l3List.push(l3);
          }
        });
      });
    });
    return l3List;
  }, [selectedYear, selectedQuarter, modeFilter]);

  return (
    <div className="enterprise-desk-container">
      {/* Sticky Header */}
      <div className="enterprise-header-wrapper">
        {/* Page Title + Filters Row */}
        <EnterpriseHeader
          modeFilter={modeFilter}
          setModeFilter={setModeFilter}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedQuarter={selectedQuarter}
          setSelectedQuarter={setSelectedQuarter}
        />

        {/* Single Row: Overlay Buttons + Insight Panel */}
        <div className="enterprise-controls-row">
          {/* Left: Compact Overlay Buttons */}
          <OverlayControls
            selectedOverlay={selectedOverlay}
            onToggleOverlay={toggleOverlay}
          />

          {/* Right: Dynamic Insight Panel (Reserved Space) */}
          <DynamicInsightPanel
            selectedOverlay={selectedOverlay}
            allL3s={allL3s}
          />
        </div>
      </div>

      {/* Capability Matrix - Guarded */}
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

      {/* Tooltip */}
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
