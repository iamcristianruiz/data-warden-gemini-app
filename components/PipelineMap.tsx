import React from 'react';
import { Database, Cloud, Server, ArrowRight, AlertTriangle, Bot, FileCode, Layers } from 'lucide-react';
import { useConsole } from '../contexts/ConsoleContext';

const PipelineMap: React.FC<{ onSimulateDrift: () => void }> = ({ onSimulateDrift }) => {
  const { addLog } = useConsole();

  const handleNodeClick = (nodeName: string) => {
    addLog('Frontend', 'INFO', `User inspected node: ${nodeName}`);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-google-sans font-medium text-gray-800 mb-6 flex items-center gap-2">
        <Layers className="w-5 h-5 text-[#4285F4]" />
        Pipeline Architecture & Health
      </h3>
      
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 overflow-x-auto py-8 px-4">
        
        {/* Sources */}
        <div 
          className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border border-gray-200 min-w-[120px] cursor-pointer hover:shadow-md transition-all"
          onClick={() => handleNodeClick('Data Sources')}
        >
          <div className="relative">
            <Server className="w-10 h-10 text-gray-600" />
            <span className="absolute -top-2 -right-2 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></span>
          </div>
          <span className="mt-3 text-sm font-medium text-gray-700">30+ Sources</span>
          <span className="text-xs text-gray-500">(Pub/Sub, GCS)</span>
        </div>

        <ArrowRight className="text-gray-300 w-6 h-6 flex-shrink-0" />

        {/* Dataflow */}
        <div 
          className="flex flex-col items-center p-4 bg-[#E8F0FE] rounded-lg border border-blue-100 min-w-[120px] cursor-pointer hover:shadow-md transition-all relative group"
          onClick={() => {
            handleNodeClick('Cloud Dataflow');
            onSimulateDrift();
          }}
        >
          <div className="absolute -top-3 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            Click to Test Drift
          </div>
          <Cloud className="w-10 h-10 text-[#4285F4]" />
          <span className="mt-3 text-sm font-medium text-blue-800">Dataflow</span>
          <span className="text-xs text-blue-600">Schema Validation</span>
        </div>

        <div className="h-px w-8 bg-gray-300 md:hidden"></div>
        <div className="flex flex-col gap-1 items-center">
             <span className="text-[10px] font-mono text-red-500 font-bold animate-pulse">Drift Detected?</span>
             <ArrowRight className="text-red-400 w-6 h-6 rotate-90 md:rotate-0" />
        </div>

        {/* Drift/Gemini Handler */}
        <div 
          className="flex flex-col items-center p-4 bg-[#FEF7E0] rounded-lg border border-yellow-100 min-w-[140px] cursor-pointer hover:shadow-md transition-all"
          onClick={() => handleNodeClick('Gemini Agent')}
        >
          <Bot className="w-10 h-10 text-[#FBBC04]" />
          <span className="mt-3 text-sm font-medium text-yellow-800">Gemini Agent</span>
          <span className="text-xs text-yellow-600">Analysis & Fixes</span>
        </div>

        <ArrowRight className="text-gray-300 w-6 h-6 flex-shrink-0" />

        {/* Dataform */}
        <div 
          className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border border-gray-200 min-w-[120px] cursor-pointer hover:shadow-md transition-all"
          onClick={() => handleNodeClick('Dataform')}
        >
          <FileCode className="w-10 h-10 text-gray-600" />
          <span className="mt-3 text-sm font-medium text-gray-700">Dataform</span>
          <span className="text-xs text-gray-500">Transformation SQL</span>
        </div>

        <ArrowRight className="text-gray-300 w-6 h-6 flex-shrink-0" />

        {/* BigQuery */}
        <div 
          className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border border-gray-200 min-w-[120px] cursor-pointer hover:shadow-md transition-all"
          onClick={() => handleNodeClick('BigQuery')}
        >
          <Database className="w-10 h-10 text-[#34A853]" />
          <span className="mt-3 text-sm font-medium text-gray-700">BigQuery</span>
          <span className="text-xs text-gray-500">Analytics Ready</span>
        </div>

      </div>
      <div className="mt-4 bg-blue-50 p-3 rounded text-xs text-blue-700 border-l-4 border-blue-500">
        <strong>Tip:</strong> This interactive map shows the flow of data. In this demo, clicking "Dataflow" simulates a burst of schema changes to test the system.
      </div>
    </div>
  );
};

export default PipelineMap;