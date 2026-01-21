import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { ABTestConfig } from '../../types/llm';
import '../../styles/ABTesting.css';

export const ABTesting: React.FC = () => {
    const [config, setConfig] = useState<ABTestConfig | null>(null);
    const [comparison, setComparison] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [trafficSplit, setTrafficSplit] = useState<Record<string, number>>({});
    const [splitDirty, setSplitDirty] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const configData = await adminService.getABConfig();
            setConfig(configData);
            setTrafficSplit(configData.traffic_split || {});

            const comparisonData = await adminService.getABComparison('24h', 'all');
            setComparison(comparisonData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSplitChange = (provider: string, value: number) => {
        const newSplit = { ...trafficSplit, [provider]: value };
        // Normalize others? complex logic. For now just let them set numbers and validate on backend or ensure sum is 100 on client
        // Let's implement a simple slider between two providers for simplicity if only 2 are active.
        // But the type is Record<string, number>.
        // Let's assume user manually inputs for now or simple slider if 2.

        setTrafficSplit(newSplit);
        setSplitDirty(true);
    };

    const saveSplit = async () => {
        try {
            // Validate sum 100?
            const sum = Object.values(trafficSplit).reduce((a, b) => a + b, 0);
            if (sum !== 100) {
                alert(`Total split must equal 100%. Current: ${sum}%`);
                return;
            }

            await adminService.updateTrafficSplit(trafficSplit);
            setSplitDirty(false);
            alert('Traffic split updated successfully');
            loadData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading && !config) return <div className="loading">Loading...</div>;

    return (
        <div className="ab-testing-container">
            <header className="page-header">
                <h1>A/B Testing & Optimization</h1>
                <p>Compare provider performance and adjust traffic allocation.</p>
            </header>

            {error && <div className="error-banner">{error}</div>}

            <div className="ab-grid">
                {/* Configuration Card */}
                <div className="card config-card">
                    <div className="card-header">
                        <h2>Traffic Allocation</h2>
                        {splitDirty && <button className="btn btn-primary btn-sm" onClick={saveSplit}>Save Changes</button>}
                    </div>
                    <div className="card-body">
                        {!config?.enabled ? (
                            <div className="warning-box">A/B Testing is currently disabled.</div>
                        ) : (
                            <div className="split-controls">
                                {Object.keys(trafficSplit).map(provider => (
                                    <div key={provider} className="split-row">
                                        <label>{provider}</label>
                                        <div className="split-input-group">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={trafficSplit[provider]}
                                                onChange={(e) => handleSplitChange(provider, parseInt(e.target.value))}
                                            />
                                            <span className="split-value">{trafficSplit[provider]}%</span>
                                        </div>
                                    </div>
                                ))}
                                <div className="total-split">
                                    Total: {Object.values(trafficSplit).reduce((a, b) => a + b, 0)}%
                                </div>
                            </div>
                        )}
                        <div className="meta-info">
                            <p><strong>Test Name:</strong> {config?.test_name}</p>
                            <p><strong>Duration:</strong> {config?.test_duration?.start} - {config?.test_duration?.end || 'Ongoing'}</p>
                        </div>
                    </div>
                </div>

                {/* Comparison Card */}
                <div className="card comparison-card">
                    <div className="card-header">
                        <h2>Provider Comparison (Last 24h)</h2>
                    </div>
                    <div className="card-body">
                        {comparison && comparison.comparison ? (
                            <table className="analysis-table">
                                <thead>
                                    <tr>
                                        <th>Provider</th>
                                        <th>Requests</th>
                                        <th>Latency (avg)</th>
                                        <th>Cost</th>
                                        <th>Error Rate</th>
                                        <th>Quality</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(comparison.comparison).map(([provider, metrics]: [string, any]) => (
                                        <tr key={provider} className={provider === config?.primary_provider ? 'primary-row' : ''}>
                                            <td>
                                                {provider}
                                                {provider === config?.primary_provider && <span className="badge badge-primary">Primary</span>}
                                            </td>
                                            <td>{metrics.total_requests}</td>
                                            <td className={metrics.avg_latency_ms < 200 ? 'good' : 'fair'}>{metrics.avg_latency_ms}ms</td>
                                            <td>${metrics.total_cost?.toFixed(3)}</td>
                                            <td className={metrics.error_rate > 0.01 ? 'bad' : 'good'}>{(metrics.error_rate * 100).toFixed(2)}%</td>
                                            <td>{metrics.avg_quality_score || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state">No comparison data available</div>
                        )}

                        {comparison?.recommendation && (
                            <div className="recommendation-box">
                                <strong>💡 Recommendation:</strong> {comparison.recommendation}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
