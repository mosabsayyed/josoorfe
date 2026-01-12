import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  Zap,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Activity,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './ObservabilityDashboard.css';

// API base URL configuration
const VITE_ENV: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : undefined;
const PROCESS_ENV: any = (globalThis as any)?.process?.env;
const RAW_API_BASE =
  (VITE_ENV?.VITE_API_URL as string | undefined) ||
  (VITE_ENV?.VITE_API_BASE as string | undefined) ||
  (PROCESS_ENV?.REACT_APP_API_URL as string | undefined) ||
  (PROCESS_ENV?.REACT_APP_API_BASE as string | undefined) ||
  '';
const API_BASE = RAW_API_BASE ? RAW_API_BASE.replace(/\/+$/g, '') : '';

interface UserSummary {
  user_id: number;
  user_email: string;
  total_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
  avg_latency_ms: number;
  error_count: number;
  first_request: string;
  last_request: string;
}

interface ProviderPerformance {
  provider: string;
  total_requests: number;
  avg_latency_ms: number;
  error_rate: number;
  total_cost_usd: number;
}

interface CostBreakdown {
  provider: string;
  model: string;
  total_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
}

interface RecentRequest {
  request_id: string;
  conversation_id: number;
  user_id: number;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  cost_usd: number;
  error_message: string | null;
  created_at: string;
}

export default function ObservabilityDashboard() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [userSummary, setUserSummary] = useState<UserSummary | null>(null);
  const [providerPerformance, setProviderPerformance] = useState<ProviderPerformance[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  
  // Time range filter
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  const fetchData = useCallback(async () => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const baseUrl = API_BASE || '/api/v1';

      // Fetch all data in parallel
      const [userRes, providersRes, costsRes, recentRes] = await Promise.all([
        fetch(`${baseUrl}/observability/user/summary?days=${timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30}`, { headers }),
        fetch(`${baseUrl}/observability/providers/performance?days=${timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30}`, { headers }),
        fetch(`${baseUrl}/observability/costs/breakdown?days=${timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30}`, { headers }),
        fetch(`${baseUrl}/observability/requests/recent?limit=10`, { headers }),
      ]);

      if (!userRes.ok || !providersRes.ok || !costsRes.ok || !recentRes.ok) {
        throw new Error('Failed to fetch observability data');
      }

      const [userData, providersRaw, costsRaw, recentRaw] = await Promise.all([
        userRes.json(),
        providersRes.json(),
        costsRes.json(),
        recentRes.json(),
      ]);

      // Unwrap API responses that return {providers: [], requests: []} format
      const providersData = providersRaw?.providers || providersRaw || [];
      const recentData = recentRaw?.requests || recentRaw || [];
      
      // costs/breakdown returns object, not array - convert to array for charts
      const costsData = costsRaw?.by_provider 
        ? Object.entries(costsRaw.by_provider).map(([provider, total_cost_usd]) => ({
            provider,
            model: provider,
            total_requests: 0,
            total_input_tokens: 0,
            total_output_tokens: 0,
            total_cost_usd: total_cost_usd as number
          }))
        : [];

      setUserSummary(userData || null);
      setProviderPerformance(Array.isArray(providersData) ? providersData : []);
      setCostBreakdown(Array.isArray(costsData) ? costsData : []);
      setRecentRequests(Array.isArray(recentData) ? recentData : []);
    } catch (err) {
      console.error('Error fetching observability data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [token, timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !userSummary) {
    return (
      <div className="observability-dashboard loading-state">
        <RefreshCw className="loading-icon" />
        <p>Loading observability data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="observability-dashboard error-state">
        <AlertTriangle className="error-icon" />
        <p>{error}</p>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const formatCost = (cost?: number) => {
    if (typeof cost === 'number' && Number.isFinite(cost)) {
      return `$${cost.toFixed(4)}`;
    }
    return '$0.0000';
  };
  const formatLatency = (ms?: number) => {
    if (typeof ms === 'number' && Number.isFinite(ms)) {
      return `${ms.toFixed(0)}ms`;
    }
    if (ms === 0) return '0ms';
    return '–';
  };

  const CHART_COLORS = ['#A855F7', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];

  return (
    <div className="observability-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Observability Dashboard</h1>
          <p className="dashboard-subtitle">LLM Performance & Cost Analytics</p>
        </div>
        <div className="dashboard-controls">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="time-range-selector"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button onClick={fetchData} className="refresh-button" disabled={loading}>
            <RefreshCw className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {userSummary && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon">
              <Zap style={{ color: '#A855F7' }} />
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{userSummary.total_requests}</div>
              <div className="kpi-label">Total Requests</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <Activity style={{ color: '#10B981' }} />
            </div>
            <div className="kpi-content">
              <div className="kpi-value">
                {formatNumber(userSummary.total_input_tokens + userSummary.total_output_tokens)}
              </div>
              <div className="kpi-label">Total Tokens</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <DollarSign style={{ color: '#F59E0B' }} />
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{formatCost(userSummary.total_cost_usd)}</div>
              <div className="kpi-label">Total Cost</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <Clock style={{ color: '#3B82F6' }} />
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{formatLatency(userSummary.avg_latency_ms)}</div>
              <div className="kpi-label">Avg Latency</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              {userSummary.error_count > 0 ? (
                <AlertTriangle style={{ color: '#EF4444' }} />
              ) : (
                <CheckCircle style={{ color: '#10B981' }} />
              )}
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{userSummary.error_count}</div>
              <div className="kpi-label">Errors</div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Provider Performance */}
        <div className="chart-card">
          <h3 className="chart-title">Provider Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={providerPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="provider" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#F9FAFB' }}
              />
              <Legend />
              <Bar dataKey="total_requests" fill="#A855F7" name="Requests" />
              <Bar dataKey="avg_latency_ms" fill="#3B82F6" name="Avg Latency (ms)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Breakdown */}
        <div className="chart-card">
          <h3 className="chart-title">Cost by Provider</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={costBreakdown as any}
                dataKey="total_cost_usd"
                nameKey="provider"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry: any) => `${entry.provider}: ${formatCost(entry.total_cost_usd)}`}
              >
                {costBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                formatter={(value: any) => formatCost(value)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Token Usage */}
        <div className="chart-card full-width">
          <h3 className="chart-title">Token Usage by Model</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="model" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#F9FAFB' }}
                formatter={(value: any) => formatNumber(value)}
              />
              <Legend />
              <Bar dataKey="total_input_tokens" fill="#10B981" name="Input Tokens" stackId="a" />
              <Bar dataKey="total_output_tokens" fill="#F59E0B" name="Output Tokens" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Requests Table */}
      <div className="recent-requests">
        <h3 className="section-title">Recent Requests</h3>
        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Provider</th>
                <th>Model</th>
                <th>Tokens</th>
                <th>Latency</th>
                <th>Cost</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.map((req) => (
                <tr key={req.request_id}>
                  <td>{new Date(req.created_at).toLocaleTimeString()}</td>
                  <td>{req.provider}</td>
                  <td className="model-cell">{req.model}</td>
                  <td>
                    <span className="token-badge input">{formatNumber(req.input_tokens)}</span>
                    <span className="token-badge output">{formatNumber(req.output_tokens)}</span>
                  </td>
                  <td>{formatLatency(req.latency_ms)}</td>
                  <td>{formatCost(req.cost_usd)}</td>
                  <td>
                    {req.error_message ? (
                      <span className="status-badge error">Error</span>
                    ) : (
                      <span className="status-badge success">Success</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
