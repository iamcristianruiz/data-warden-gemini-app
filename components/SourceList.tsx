
import React, { useState } from 'react';
import { DataSource, SourceStatus } from '../types';
import { Search, AlertOctagon, CheckCircle2, Database, Cloud, Server, Filter } from 'lucide-react';
import { useConsole } from '../contexts/ConsoleContext';

interface SourceListProps {
  sources: DataSource[];
  onSelectSource: (source: DataSource) => void;
  onResolve: (source: DataSource) => void;
}

type StatusFilter = 'ALL' | 'DRIFT' | 'HEALTHY';
type TypeFilter = 'ALL' | 'PubSub' | 'GCS' | 'CloudSQL';

const SourceList: React.FC<SourceListProps> = ({ sources, onSelectSource, onResolve }) => {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const { addLog } = useConsole();

  const filteredSources = sources.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(filter.toLowerCase()) || 
                          s.id.toLowerCase().includes(filter.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' 
      ? true 
      : statusFilter === 'DRIFT' 
        ? s.status === SourceStatus.DRIFT_DETECTED 
        : s.status === SourceStatus.HEALTHY;

    const matchesType = typeFilter === 'ALL' ? true : s.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleSourceClick = (s: DataSource) => {
    addLog('Frontend', 'INFO', `User selected source ${s.name} for details`);
    onSelectSource(s);
  }

  const handleResolveClick = (e: React.MouseEvent, s: DataSource) => {
    e.stopPropagation();
    addLog('Frontend', 'INFO', `User clicked Resolve for source ${s.name}`);
    onResolve(s);
  }

  const getTypeIcon = (type: string) => {
    switch(type) {
        case 'PubSub': return <Cloud className="w-3 h-3" />;
        case 'GCS': return <Database className="w-3 h-3" />;
        case 'CloudSQL': return <Server className="w-3 h-3" />;
        default: return <Database className="w-3 h-3" />;
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex-shrink-0 bg-white z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-google-sans font-medium text-gray-800">Data Sources</h3>
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold">
            {filteredSources.length}
          </span>
        </div>
        
        <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
                type="text"
                placeholder="Search sources..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col gap-2">
                {/* Status Filter */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <button 
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${statusFilter === 'ALL' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                    >
                    All
                    </button>
                    <button 
                    onClick={() => setStatusFilter('DRIFT')}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border flex items-center gap-1 ${statusFilter === 'DRIFT' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-gray-600 border-gray-200 hover:border-red-200 hover:text-red-600'}`}
                    >
                    <AlertOctagon className="w-3 h-3" /> Critical
                    </button>
                    <button 
                    onClick={() => setStatusFilter('HEALTHY')}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border flex items-center gap-1 ${statusFilter === 'HEALTHY' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-600 border-gray-200 hover:border-green-200 hover:text-green-600'}`}
                    >
                    <CheckCircle2 className="w-3 h-3" /> Healthy
                    </button>
                </div>

                {/* Type Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                    <Filter className="w-3 h-3 text-gray-400 mr-1" />
                    {(['ALL', 'PubSub', 'GCS', 'CloudSQL'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTypeFilter(t)}
                        className={`text-[10px] font-medium px-2 py-1 rounded transition-colors whitespace-nowrap
                            ${typeFilter === t ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-gray-500 hover:bg-gray-50 border border-transparent'}`}
                    >
                        {t === 'ALL' ? 'All Types' : t}
                    </button>
                    ))}
                </div>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filteredSources.map(source => (
          <div 
            key={source.id}
            onClick={() => handleSourceClick(source)}
            className={`p-3 mb-2 rounded-lg cursor-pointer border transition-all group
              ${source.status === SourceStatus.DRIFT_DETECTED 
                ? 'bg-red-50 border-red-100 hover:border-red-300' 
                : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${source.status === SourceStatus.DRIFT_DETECTED ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{source.name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                        {getTypeIcon(source.type)}
                        {source.type}
                    </span>
                    <span>•</span>
                    <span className="truncate">{source.id}</span>
                  </div>
                </div>
              </div>
              
              {source.status === SourceStatus.DRIFT_DETECTED ? (
                <button 
                  onClick={(e) => handleResolveClick(e, source)}
                  className="ml-2 px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-medium rounded-md shadow-sm hover:bg-red-50 flex items-center gap-1 transition-colors flex-shrink-0"
                >
                  <AlertOctagon className="w-3 h-3" />
                  Resolve
                </button>
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
        
        {filteredSources.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm flex flex-col items-center gap-2">
            <Filter className="w-8 h-8 text-gray-300" />
            <p>No sources found matching filters.</p>
            <button 
                onClick={() => {setFilter(''); setStatusFilter('ALL'); setTypeFilter('ALL');}}
                className="text-blue-600 hover:underline text-xs"
            >
                Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SourceList;
