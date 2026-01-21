import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { MetricsSummary } from '../../types/llm';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import '../../styles/MonitoringDashboard.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const MonitoringDashboard: React.FC = () => {
    const [timeRange, setTimeRange] = useState('24h');
    const [summary, setSummary] = useState<MetricsSummary | null>(null);
    const [providerMetrics, setProviderMetrics] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadMetrics();
        const interval = setInterval(loadMetrics, 60000); // 1 min refresh
        return () => clearInterval(interval);
    }, [timeRange]);

    const loadMetrics = async () => {
        setLoading(true);
        try {
            const summaryData = await adminService.getMetricsSummary(timeRange);
            setSummary(summaryData);

            const providerData = await adminService.getProviderMetrics(timeRange);
            setProviderMetrics(providerData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Transform provider metrics for charts
    const getCostData = () => {
        if (!providerMetrics) return [];
        return Object.entries(providerMetrics).map(([key, value]: [string, any]) => ({
            name: key,
            value: value.total_cost || 0
        }));
    };

    const getRequestData = () => {
        if (!providerMetrics) return [];
        return Object.entries(providerMetrics).map(([key, value]: [string, any]) => ({
            name: key,
            queries: value.requests || 0
        }));
    };

    // Mock time series data since API doesn't fully support timeline yet in types
    // In a real app, we'd fetch this from /metrics/tokens/timeline
    const mockTimelineData = [
        { time: '00:00', tokens: 1200 },
        { time: '04:00', tokens: 800 },
        { time: '08:00', tokens: 3500 },
        { time: '12:00', tokens: 5000 },
        { time: '16:00', tokens: 4200 },
        { time: '20:00', tokens: 2800 },
        { time: '23:59', tokens: 1500 },
    ];

    if (loading && !summary) return <div className="loading">Loading dashboard...</div>;

    return (
        <div className="monitoring-container">
            <header className="page-header">
                <div className="header-title">
                    <h1>System Observability</h1>
                    <p>Real-time metrics and performance insights.</p>
                </div>
                <div className="time-selector">
                    {['1h', '24h', '7d', '30d'].map(range => (
                        <button
                            key={range}
                            className={`time-btn ${timeRange === range ? 'active' : ''}`}
                            onClick={() => setTimeRange(range)}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </header>

            {error && <div className="error-banner">{error}</div>}

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-label">Total Requests</div>
                    <div className="kpi-value">{summary?.total_requests.toLocaleString()}</div>
                    <div className="kpi-trend positive">↑ 12% vs last period</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Avg Latency</div>
                    <div className="kpi-value">{summary?.avg_latency_ms.toFixed(0)} ms</div>
                    <div className="kpi-sub">P99: {summary?.p99_latency_ms} ms</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Total Cost</div>
                    <div className="kpi-value">${summary?.total_cost.toFixed(2)}</div>
                    <div className="kpi-trend neutral">On budget</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Error Rate</div>
                    <div className={`kpi-value ${summary?.error_rate! > 0.01 ? 'text-red' : ''}`}>
                        {(summary?.error_rate! * 100).toFixed(2)}%
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                {/* Token Usage Timeline */}
                <div className="chart-card wide">
                    <h3>Token Usage Volume (24h)</h3>
                    <div className="chart-area">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={mockTimelineData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="time" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip />
                                <Area type="monotone" dataKey="tokens" stroke="#3B82F6" fill="#BFDBFE" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cost Distribution */}
                <div className="chart-card">
                    <h3>Cost by Provider</h3>
                    <div className="chart-area">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={getCostData()}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {getCostData().map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Requests by Provider */}
                <div className="chart-card">
                    <h3>Requests Distribution</h3>
                    <div className="chart-area">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={getRequestData()}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip />
                                <Bar dataKey="queries" fill="#10B981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Logs Table (Placeholder for now) */}
            <div className="logs-section">
                <div className="section-header">
                    <h3>Recent Request Logs</h3>
                    <button className="btn btn-secondary btn-sm">View All</button>
                </div>
                <table className="logs-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Request ID</th>
                            <th>Provider</th>
                            <th>Model</th>
                            <th>Tokens</th>
                            <th>Latency</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="text-gray">Just now</td>
                            <td className="font-mono">req_8f7d9a</td>
                            <td>Groq</td>
                            <td>mixtral-8x7b</td>
                            <td>1,240</td>
                            <td>245ms</td>
                            <td><span className="status-dot success"></span> Success</td>
                        </tr>
                        <tr>
                            <td className="text-gray">1 min ago</td>
                            <td className="font-mono">req_1b2c3d</td>
                            <td>OpenRouter</td>
                            <td>gpt-4</td>
                            <td>850</td>
                            <td>1200ms</td>
                            <td><span className="status-dot success"></span> Success</td>
                        </tr>
                        <tr>
                            <td className="text-gray">2 mins ago</td>
                            <td className="font-mono">req_x9y8z7</td>
                            <td>Google AI</td>
                            <td>gemini-pro</td>
                            <td>0</td>
                            <td>5004ms</td>
                            <td><span className="status-dot error"></span> Timeout</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
