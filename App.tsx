
import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Activity, ShieldAlert, Book, Zap, Server, RefreshCw } from 'lucide-react';
import { ConsoleProvider, useConsole } from './contexts/ConsoleContext';
import PipelineMap from './components/PipelineMap';
import SourceList from './components/SourceList';
import DriftResolver from './components/DriftResolver';
import Documentation from './components/Documentation';
import ConsoleLogger from './components/ConsoleLogger';
import SourceDetails from './components/SourceDetails';
import MonitoringView from './components/MonitoringView';
import { StorageService } from './services/storageService';
import { DataSource, AppView, SourceStatus, SchemaPatch } from './types';
import { detectDriftWithGemini } from './services/geminiService';

const MainContent: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [sources, setSources] = useState<DataSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const { addLog } = useConsole();

  // Load initial data from local storage
  useEffect(() => {
    const loadedData = StorageService.loadSources();
    setSources(loadedData);
    addLog('System', 'INFO', 'GCP Data Drift Warden initialized.');
    addLog('Backend', 'INFO', `Loaded state for ${loadedData.length} data sources from local storage.`);
  }, []);

  // Helper to update sources state and persist to storage
  const updateSources = useCallback((newSources: DataSource[]) => {
    setSources(newSources);
    StorageService.saveSources(newSources);
  }, []);

  const handleUpdateSource = (id: string, updates: Partial<DataSource>) => {
    const newSources = sources.map(s => s.id === id ? { ...s, ...updates } : s);
    updateSources(newSources);
    
    // If the currently selected source is being updated, ensure it reflects immediately
    if (selectedSource && selectedSource.id === id) {
      setSelectedSource(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleResolveDrift = (id: string) => {
    let updatedSource: DataSource | undefined;

    const newSources = sources.map(s => {
      if (s.id === id && s.driftDetails) {
        const addedFields = s.driftDetails.unexpectedFields;
        
        // Create a history entry
        const newPatch: SchemaPatch = {
          id: `patch-${Date.now().toString(36)}`,
          appliedAt: new Date().toISOString(),
          description: 'Auto-resolution via Dataform (Gemini)',
          addedFields: addedFields
        };

        updatedSource = {
          ...s,
          status: SourceStatus.HEALTHY,
          // Apply the schema changes
          schema: [...s.schema, ...addedFields],
          // Add to history
          history: [newPatch, ...s.history],
          // Clear drift details
          driftDetails: undefined 
        };
        return updatedSource;
      }
      return s;
    });
    
    updateSources(newSources);
    
    // Update the selected source view if it matches
    if (updatedSource) {
      setSelectedSource(updatedSource);
    } else {
      setSelectedSource(null);
    }

    setView(AppView.DASHBOARD);
    addLog('System', 'SUCCESS', `Source ${id} schema updated and status reset to HEALTHY.`);
  };

  const handleResetDemo = () => {
    if (window.confirm("Reset all demo data to initial state?")) {
       const resetData = StorageService.resetStorage();
       setSources(resetData);
       setSelectedSource(null);
       setView(AppView.DASHBOARD);
       addLog('System', 'WARN', 'Demo environment reset to factory settings.');
    }
  };

  const simulateDriftEvent = async () => {
    if (isSimulating) return;
    setIsSimulating(true);

    try {
      addLog('Backend', 'WARN', 'Injecting chaotic payload into ingestion pipeline...');
      
      // 1. Select a target source
      const healthyIndices = sources
        .map((s, i) => s.status === SourceStatus.HEALTHY ? i : -1)
        .filter(i => i !== -1);
      
      if (healthyIndices.length === 0) {
        addLog('System', 'INFO', 'No healthy sources available to drift.');
        return;
      }

      const randomIdx = healthyIndices[Math.floor(Math.random() * healthyIndices.length)];
      const targetSource = sources[randomIdx];
      const newFieldName = `feature_flag_${Math.floor(Math.random() * 1000)}`;
      
      const chaoticPayload = JSON.stringify({
        event_id: `evt_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user_data: { segment: "beta" },
        [newFieldName]: true // The new field causing drift
      });

      // 2. Simulate Dataflow Failure
      await new Promise(r => setTimeout(r, 800));
      addLog('Dataflow', 'ERROR', `Schema validation failed for ${targetSource.name}.`, `Payload contained unexpected field: ${newFieldName}`);
      addLog('Dataflow', 'INFO', `Routing failed message to Dead Letter Queue (topic: ${targetSource.name}-dlq)`);

      // 3. Simulate Gemini Detection Trigger
      await new Promise(r => setTimeout(r, 1000));
      addLog('System', 'INFO', `DLQ Trigger: Invoking Gemini to analyze schema drift...`);
      
      // 4. Call Gemini Service for Detection
      const report = await detectDriftWithGemini(targetSource.schema, chaoticPayload);
      addLog('Gemini', 'WARN', `Drift Analysis Complete for ${targetSource.id}`, report.substring(0, 100) + "...");

      // 5. Update State
      const updatedSource: DataSource = {
        ...targetSource,
        status: SourceStatus.DRIFT_DETECTED,
        driftDetails: {
          detectedAt: new Date().toISOString(),
          unexpectedFields: [{ name: newFieldName, type: 'BOOLEAN', mode: 'NULLABLE' }],
          missingFields: [],
          samplePayload: chaoticPayload,
          detectionReport: report
        }
      };

      const newSources = [...sources];
      newSources[randomIdx] = updatedSource;
      
      updateSources(newSources);
      addLog('System', 'ERROR', `Alert Raised: Drift confirmed on ${targetSource.name}. Manual resolution required.`);

    } catch (e) {
      addLog('System', 'ERROR', 'Simulation failed', String(e));
    } finally {
      setIsSimulating(false);
    }
  };

  // Navigation items
  const navItems = [
    { id: AppView.DASHBOARD, label: 'Overview', icon: LayoutDashboard },
    { id: AppView.MONITORING, label: 'Monitoring', icon: Activity },
    { id: AppView.DOCS, label: 'Documentation', icon: Book },
  ];

  return (
    <div className="flex h-screen bg-[#f8f9fa] text-gray-800 font-roboto overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
        <div className="p-6 flex items-center gap-2 border-b border-gray-100">
          <div className="bg-[#4285F4] p-2 rounded-lg text-white">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-google-sans font-bold text-gray-800 text-lg leading-none">Data Warden</h1>
            <span className="text-[10px] text-gray-500 tracking-wider font-medium">POWERED BY GEMINI</span>
          </div>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setView(item.id); setSelectedSource(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                ${view === item.id 
                  ? 'bg-blue-50 text-[#1967D2]' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Improved System Status Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-3 h-3" />
            System Status
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
               <span className="text-gray-600">Pipelines</span>
               <span className="font-mono font-medium">{sources.length} Active</span>
            </div>
            <div className="flex items-center justify-between text-sm">
               <span className="text-gray-600">Event Rate</span>
               <span className="font-mono font-medium">12k/s</span>
            </div>
            <div className="flex items-center gap-2 text-xs bg-green-100 text-green-700 px-2 py-1.5 rounded border border-green-200 mt-2 font-medium">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              All Systems Operational
            </div>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Toolbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
          <h2 className="font-google-sans font-medium text-xl text-gray-700">
            {view === AppView.DASHBOARD && 'Pipeline Overview'}
            {view === AppView.MONITORING && 'System Monitoring'}
            {view === AppView.DOCS && 'Technical Documentation'}
            {view === AppView.RESOLVER && 'Drift Resolution'}
          </h2>
          <div className="flex items-center gap-4">
             <button 
              onClick={handleResetDemo}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Reset Demo Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              onClick={simulateDriftEvent}
              disabled={isSimulating}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-all border flex items-center gap-2
                ${isSimulating 
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                  : 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200'}`}
            >
               <Zap className={`w-4 h-4 ${isSimulating ? 'animate-pulse' : ''}`} />
               {isSimulating ? 'Drift Detected...' : 'Simulate Chaos'}
            </button>
            <div className="h-8 w-8 rounded-full bg-[#4285F4] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              A
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto p-8 pb-24">
          {view === AppView.DASHBOARD && (
            <div className="space-y-6 h-full flex flex-col">
              <div className="flex-shrink-0">
                 <PipelineMap onSimulateDrift={simulateDriftEvent} />
              </div>
              
              {/* Dynamic height container: Viewport - Headers - PipelineMap - ConsoleBuffer */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)] min-h-[400px]">
                <div className="lg:col-span-1 h-full overflow-hidden">
                   <SourceList 
                      sources={sources} 
                      onSelectSource={(s) => setSelectedSource(s)}
                      onResolve={(s) => {
                        setSelectedSource(s);
                        setView(AppView.RESOLVER);
                      }}
                   />
                </div>
                <div className="lg:col-span-2 h-full overflow-hidden">
                  {selectedSource ? (
                    <SourceDetails source={selectedSource} />
                  ) : (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col justify-center items-center text-gray-400">
                      <div className="bg-gray-50 p-4 rounded-full mb-4">
                         <ShieldAlert className="w-12 h-12 text-gray-300" />
                      </div>
                      <p className="font-medium text-gray-500">Select a Data Source</p>
                      <p className="text-sm mt-2 max-w-xs text-center">View lineage details, throughput metrics, and schema definitions.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {view === AppView.MONITORING && (
             <div className="h-full">
               <MonitoringView 
                 sources={sources}
                 onResolve={(s) => {
                   setSelectedSource(s);
                   setView(AppView.RESOLVER);
                 }}
               />
             </div>
          )}

          {view === AppView.RESOLVER && selectedSource && (
            <div className="h-[calc(100vh-140px)]">
              <DriftResolver 
                source={selectedSource}
                onResolve={handleResolveDrift}
                onUpdateSource={handleUpdateSource}
                onCancel={() => setView(AppView.DASHBOARD)}
              />
            </div>
          )}
          
          {view === AppView.RESOLVER && !selectedSource && (
             <div className="text-center mt-20">
               <p className="text-gray-500">Please select a drifting source from the Dashboard or Sources list.</p>
               <button onClick={() => setView(AppView.DASHBOARD)} className="mt-4 text-blue-600 hover:underline">Back to Dashboard</button>
             </div>
          )}

          {view === AppView.DOCS && <Documentation />}
        </main>
      
        {/* Floating Console */}
        <ConsoleLogger />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ConsoleProvider>
      <MainContent />
    </ConsoleProvider>
  );
};

export default App;
