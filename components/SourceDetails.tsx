
import React from 'react';
import { DataSource } from '../types';
import { Activity, Database, ArrowRight, Clock, ShieldCheck, GitCommit, Table, History } from 'lucide-react';

interface SourceDetailsProps {
  source: DataSource;
}

const SourceDetails: React.FC<SourceDetailsProps> = ({ source }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start bg-gray-50">
        <div>
          <h2 className="text-lg font-google-sans font-medium text-gray-800 flex items-center gap-2">
            {source.name}
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase">
              {source.status}
            </span>
          </h2>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Database className="w-3 h-3" /> {source.type}</span>
            <span className="font-mono">{source.id}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Updated: {new Date(source.lastUpdated).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-xs text-blue-600 font-medium mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Throughput
            </div>
            <div className="text-xl font-bold text-blue-800">{(Math.random() * 5000 + 1000).toFixed(0)} <span className="text-xs font-normal opacity-70">eps</span></div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="text-xs text-green-600 font-medium mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Quality Score
            </div>
            <div className="text-xl font-bold text-green-800">99.9<span className="text-xs font-normal opacity-70">%</span></div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
            <div className="text-xs text-purple-600 font-medium mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Avg Latency
            </div>
            <div className="text-xl font-bold text-purple-800">45<span className="text-xs font-normal opacity-70">ms</span></div>
          </div>
        </div>

        {/* Lineage Visualization */}
        <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <GitCommit className="w-4 h-4" /> Data Lineage
            </h3>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto">
                <div className="flex flex-col items-center min-w-[80px]">
                    <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-gray-600">
                        <Activity className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] mt-1 text-gray-500 font-medium">Producer</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <div className="flex flex-col items-center min-w-[80px]">
                    <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
                        <Database className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] mt-1 text-blue-700 font-bold">{source.name}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <div className="flex flex-col items-center min-w-[80px]">
                    <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-gray-600">
                        <Activity className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] mt-1 text-gray-500 font-medium">Dataflow</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <div className="flex flex-col items-center min-w-[80px]">
                    <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center text-green-600 border border-green-200">
                        <Table className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] mt-1 text-green-700 font-medium">BigQuery</span>
                </div>
            </div>
        </div>

        {/* Schema & History Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Schema Table */}
            <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Table className="w-4 h-4" /> Current Schema
                </h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase sticky top-0">
                            <tr>
                                <th className="px-4 py-2 font-medium">Field Name</th>
                                <th className="px-4 py-2 font-medium">Type</th>
                                <th className="px-4 py-2 font-medium">Mode</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {source.schema.map((field) => (
                                <tr key={field.name} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 font-mono text-gray-700">{field.name}</td>
                                    <td className="px-4 py-2 text-blue-600 text-xs font-bold">{field.type}</td>
                                    <td className="px-4 py-2 text-gray-500 text-xs">{field.mode}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Schema Version History */}
            <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <History className="w-4 h-4" /> Version History
                </h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 max-h-64 overflow-y-auto p-4">
                    {source.history && source.history.length > 0 ? (
                         <div className="relative border-l-2 border-blue-200 pl-4 space-y-6">
                            {source.history.map((patch) => (
                                <div key={patch.id} className="relative">
                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-bold text-gray-700">Patch applied</span>
                                        <span className="text-[10px] text-gray-500">{new Date(patch.appliedAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{patch.description}</p>
                                    
                                    <div className="mt-2 bg-white p-2 rounded border border-gray-200">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Fields Added:</p>
                                        {patch.addedFields.map(f => (
                                            <div key={f.name} className="flex items-center gap-2 text-xs font-mono text-green-700">
                                                <span>+ {f.name}</span>
                                                <span className="opacity-50 text-[10px]">({f.type})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                         </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            <History className="w-8 h-8 mb-2 opacity-20" />
                            <span className="text-xs">No schema patches recorded.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SourceDetails;
