
import React, { useState, useMemo } from 'react';
import { DataSource, SourceStatus } from '../types';
import { Activity, AlertOctagon, CheckCircle2, Clock, Database, Filter, Search, ArrowDown, ArrowUp, Server, Zap } from 'lucide-react';
import { useConsole } from '../contexts/ConsoleContext';

interface MonitoringViewProps {
  sources: DataSource[];
  onResolve: (source: DataSource) => void;
}

const MonitoringView: React.FC<MonitoringViewProps> = ({ sources, onResolve }) => {
  const { addLog } = useConsole();
  const [filter, setFilter] = useState('');

  // --- KPIs Calculation ---
  const kpis = useMemo(() => {
    const total = sources.length;
    const drifting = sources.filter(s => s.status === SourceStatus.DRIFT_DETECTED).length;
    const healthy = sources.filter(s => s.status === SourceStatus.HEALTHY).length;
    const totalPatches = sources.reduce((acc, s) => acc + s.history.length, 0);
    const avgLatency = 42; // Mock average
    
    return { total, drifting, healthy, totalPatches, avgLatency };
  }, [sources]);

  // --- Mock Chart Data Generator ---
  const chartPoints = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      val: 50 + Math.random() * 50,
      time: `${10 + i}:00`
    }));
  }, []);

  // --- Filtering Logic ---
  const filteredSources = sources.filter(s => 
    s.name.toLowerCase().includes(filter.toLowerCase()) || 
    s.id.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 h-full overflow-y-auto">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-google-sans text-gray-800">System Monitoring</h2>
          <p className="text-gray-500 text-sm mt-1">Real-time telemetry and health status of data ingestion pipelines.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Live Telemetry Active
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
              <ArrowUp className="w-3 h-3" /> 12%
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-800">24.5k</div>
          <div className="text-xs text-gray-500">Events per second</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <AlertOctagon className="w-5 h-5" />
            </div>
            {kpis.drifting > 0 && (
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded flex items-center gap-1">
                Action Required
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-gray-800">{kpis.drifting} <span className="text-sm font-normal text-gray-400">/ {kpis.total}</span></div>
          <div className="text-xs text-gray-500">Active Drift Incidents</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-800">{kpis.totalPatches}</div>
          <div className="text-xs text-gray-500">Total Schema Patches Applied</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
              <ArrowDown className="w-3 h-3" /> 4ms
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{kpis.avgLatency}ms</div>
          <div className="text-xs text-gray-500">Avg Pipeline Latency</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Throughput Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            Global Ingestion Volume (24h)
          </h3>
          <div className="h-48 flex items-end justify-between gap-1 pt-4 relative">
             {/* Simple SVG Line Graph simulation using bars for visual density */}
             {chartPoints.map((p, i) => (
               <div key={i} className="w-full bg-blue-50 rounded-t group relative hover:bg-blue-100 transition-colors" style={{ height: `${p.val}%` }}>
                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                   {Math.floor(p.val * 100)} EPS
                 </div>
               </div>
             ))}
             {/* Baseline */}
             <div className="absolute bottom-0 w-full h-px bg-gray-200"></div>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-mono">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>Now</span>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="font-medium text-gray-700 mb-4">Health Distribution</h3>
           <div className="flex items-center justify-center h-32">
              <div className="flex w-full h-4 rounded-full overflow-hidden">
                <div style={{ width: `${(kpis.healthy / kpis.total) * 100}%` }} className="bg-green-500 h-full" title="Healthy"></div>
                <div style={{ width: `${(kpis.drifting / kpis.total) * 100}%` }} className="bg-red-500 h-full" title="Drifting"></div>
              </div>
           </div>
           <div className="space-y-3">
             <div className="flex justify-between items-center text-sm">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-green-500"></div>
                 <span className="text-gray-600">Healthy Sources</span>
               </div>
               <span className="font-mono font-bold">{kpis.healthy}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-500"></div>
                 <span className="text-gray-600">Drift Detected</span>
               </div>
               <span className="font-mono font-bold">{kpis.drifting}</span>
             </div>
           </div>
        </div>
      </div>

      {/* Detailed Data Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
           <h3 className="font-medium text-gray-800">Source Inventory</h3>
           <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Filter sources..." 
                  className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
              <button className="p-1.5 border border-gray-200 rounded-lg bg-white text-gray-500 hover:bg-gray-50">
                <Filter className="w-4 h-4" />
              </button>
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Source Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Throughput (Est)</th>
                <th className="px-6 py-3">Schema Version</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSources.map((source) => (
                <tr key={source.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-800">{source.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{source.id}</div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">
                      {source.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-gray-600">
                    {Math.floor(Math.random() * 2000 + 500)} eps
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    v{1 + source.history.length}.0
                  </td>
                  <td className="px-6 py-3">
                    {source.status === SourceStatus.DRIFT_DETECTED ? (
                      <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-1 rounded-full w-fit text-xs font-bold">
                        <AlertOctagon className="w-3 h-3" /> Critical Drift
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit text-xs font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Healthy
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {source.status === SourceStatus.DRIFT_DETECTED ? (
                      <button 
                        onClick={() => {
                          addLog('Frontend', 'INFO', `Navigating to Resolver from Monitoring for ${source.id}`);
                          onResolve(source);
                        }}
                        className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded font-medium text-xs border border-red-200 transition-colors"
                      >
                        Resolve Issue
                      </button>
                    ) : (
                      <span className="text-gray-300 text-xs">No Actions</span>
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
};

export default MonitoringView;
