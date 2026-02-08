import React, { useEffect, useRef, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsMore from 'highcharts/highcharts-more';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsBullet from 'highcharts/modules/bullet';
import { Artifact } from '../../../types/api';

// Initialize modules safely
const initHighchartsModule = (module: any) => {
  try {
    if (typeof module === 'function') {
      module(Highcharts);
    } else if (typeof module?.default === 'function') {
      module.default(Highcharts);
    }
  } catch (err) {
    console.warn('Failed to initialize Highcharts module', err);
  }
};

if (typeof Highcharts === 'object') {
  initHighchartsModule(HighchartsMore);
  initHighchartsModule(HighchartsExporting);
  initHighchartsModule(HighchartsBullet);
}

interface StrategyReportChartRendererProps {
  artifact: Artifact;
  width?: string;
  height?: string;
}

/**
 * Custom Chart Renderer for Strategy Report Charts
 * Uses Highcharts with bullet chart support for LLM-generated visualizations
 */
export const StrategyReportChartRenderer: React.FC<StrategyReportChartRendererProps> = ({
  artifact,
  width = '100%',
  height = '380px'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Highcharts.Chart | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      setError(null);

      // Handle table artifacts
      if (artifact.artifact_type === 'TABLE') {
        const { columns = [], rows = [] } = artifact.content;

        if (columns.length === 0 || rows.length === 0) {
          setError('No table data available');
          return;
        }

        const tableHtml = `
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="border-bottom: 2px solid var(--component-text-accent);">
                ${columns.map(h => `<th style="padding: 12px; text-align: left; color: var(--component-text-primary); font-weight: 600;">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map((row, i) => `
                <tr style="border-bottom: 1px solid var(--component-panel-border); background: ${i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'};">
                  ${Array.isArray(row) ? row.map(cell => `<td style="padding: 12px; color: var(--component-text-secondary);">${cell}</td>`).join('') : `<td style="padding: 12px; color: var(--component-text-secondary);">${row}</td>`}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

        containerRef.current.innerHTML = tableHtml;
        return;
      }

      // Handle chart artifacts
      const { content } = artifact;
      if (!content) {
        setError('Invalid chart configuration');
        return;
      }

      // Validate artifact type
      if (artifact.artifact_type !== 'CHART') {
        console.warn('[StrategyReportChartRenderer] Unexpected artifact type:', artifact.artifact_type);
        setError(`Cannot render artifact type: ${artifact.artifact_type}`);
        return;
      }

      // Validate required chart properties (using type guard)
      const hasValidSeries = 'series' in content && Array.isArray(content.series);
      if (!hasValidSeries) {
        console.warn('[StrategyReportChartRenderer] Invalid chart: missing series data', content);
        setError('Invalid chart: missing series data');
        return;
      }

      // Debug logging
      console.log('[StrategyReportChartRenderer] Rendering chart:', {
        type: artifact.artifact_type,
        title: artifact.title,
        hasContent: !!content,
        seriesCount: hasValidSeries ? content.series.length : 0,
        chartType: ('chart' in content && content.chart?.type) || 'column'
      });

      // Destroy previous chart
      if (chartRef.current) {
        try {
          chartRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying previous chart:', e);
        }
        chartRef.current = null;
      }

      // Build Highcharts config
      const config: Highcharts.Options = {
        chart: {
          type: content.chart?.type || 'column',
          backgroundColor: 'transparent',
          style: { fontFamily: 'inherit' },
          height: 360,
          margin: [40, 20, 40, 60]
        },
        title: content.title ? {
          text: content.title.text,
          style: {
            color: 'var(--component-text-primary)',
            fontSize: '16px',
            fontWeight: '600'
          }
        } : undefined,
        subtitle: content.subtitle ? {
          text: content.subtitle.text,
          style: {
            color: 'var(--component-text-secondary)',
            fontSize: '13px'
          }
        } : undefined,
        xAxis: {
          categories: content.xAxis?.categories || [],
          title: content.xAxis?.title ? {
            text: content.xAxis.title.text,
            style: {
              color: 'var(--component-text-secondary)',
              fontSize: '12px'
            }
          } : undefined,
          min: content.xAxis?.min,
          max: content.xAxis?.max,
          labels: {
            style: {
              color: 'var(--component-text-secondary)',
              fontSize: '12px'
            }
          },
          lineColor: 'var(--component-panel-border)',
          tickColor: 'var(--component-panel-border)'
        } as any,
        yAxis: {
          title: content.yAxis?.title ? {
            text: content.yAxis.title.text,
            style: {
              color: 'var(--component-text-secondary)',
              fontSize: '12px'
            }
          } : undefined,
          labels: {
            style: {
              color: 'var(--component-text-secondary)',
              fontSize: '12px'
            }
          },
          min: content.yAxis?.min,
          max: content.yAxis?.max,
          gridLineColor: 'rgba(107, 114, 128, 0.1)'
        } as any,
        legend: {
          enabled: content.legend?.enabled !== false,
          itemStyle: {
            color: 'var(--component-text-secondary)',
            fontSize: '12px'
          }
        },
        tooltip: {
          enabled: content.tooltip?.enabled !== false,
          backgroundColor: 'var(--component-bg-secondary)',
          borderColor: 'var(--component-panel-border)',
          style: {
            color: 'var(--component-text-primary)'
          },
          headerFormat: '<strong style="color: var(--component-text-accent);">{point.key}</strong><br/>',
          pointFormat: '<span style="color: {point.color};">●</span> {series.name}: <strong>{point.y}</strong><br/>'
        },
        series: content.series?.map((s, index) => {
          const chartType = content.chart?.type || 'column';
          const baseConfig = {
            name: s.name,
            data: s.data,
            color: s.color || getSeriesColor(index),
            type: chartType
          };

          // For scatter charts, add larger visible markers
          if (chartType === 'scatter') {
            return {
              ...baseConfig,
              marker: {
                radius: 8, // Larger dots
                symbol: 'circle',
                lineWidth: 2,
                lineColor: '#ffffff'
              }
            };
          }

          return baseConfig;
        }) || [],
        credits: { enabled: false },
        exporting: { enabled: false },
        accessibility: { enabled: false }
      };

      // Create chart
      chartRef.current = Highcharts.chart(containerRef.current, config);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[StrategyReportChartRenderer] Error:', err);
      setError(`Failed to render chart: ${message}`);
    }
  }, [artifact]);

  if (error) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#ef4444',
          fontSize: '13px',
          padding: '16px'
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        minHeight: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px'
      }}
    />
  );
};

/**
 * Get color for series based on design system palette
 */
function getSeriesColor(index: number): string {
  // Vision 2030 brand colors from site theme
  const colors = [
    'var(--component-text-accent)', // Gold - primary accent (Saudi gold)
    '#10b981', // Green - success/growth
    '#3b82f6', // Blue - water/infrastructure
    '#f59e0b', // Amber - energy/construction
    '#8b5cf6', // Purple - innovation/tech
    '#ec4899', // Pink - tourism/culture
    '#06b6d4', // Cyan - digital transformation
    '#ef4444'  // Red - urgent/risk
  ];
  return colors[index % colors.length];
}

export default StrategyReportChartRenderer;
