
import React, { useState, useEffect } from 'react';
import { DataSource } from '../types';
import { useConsole } from '../contexts/ConsoleContext';
import { analyzeDriftWithGemini } from '../services/geminiService';
import { Bot, Play, ArrowRightLeft, Loader2, Sparkles, FileCode, GitBranch, Terminal, CheckCircle, Server } from 'lucide-react';

interface DriftResolverProps {
  source: DataSource;
  onResolve: (id: string) => void;
  onUpdateSource: (id: string, updates: Partial<DataSource>) => void;
  onCancel: () => void;
}

// Robust Markdown Parser for Gemini Output
const parseMarkdown = (text: string) => {
  if (!text) return '';
  
  const lines = text.split('\n');
  let html = '';
  let inList = false;

  lines.forEach(line => {
    let processedLine = line.trim();
    
    // Handle Headers
    if (processedLine.startsWith('### ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h3 class="font-bold text-sm mt-3 mb-1 text-purple-900">${processedLine.substring(4)}</h3>`;
      return;
    }

    // Handle Bold
    processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-purple-950">$1</strong>');
    // Handle Italic
    processedLine = processedLine.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    // Handle Code (Inline)
    processedLine = processedLine.replace(/`([^`]+)`/g, '<code class="bg-white/50 text-purple-800 px-1 py-0.5 rounded font-mono text-xs border border-purple-100">$1</code>');

    // Handle Lists
    if (processedLine.startsWith('- ')) {
      if (!inList) {
        html += '<ul class="list-disc pl-4 space-y-1 mb-2 text-purple-900/90">';
        inList = true;
      }
      html += `<li>${processedLine.substring(2)}</li>`;
    } else if (processedLine.length > 0) {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      html += `<p class="mb-2 text-purple-900 leading-relaxed">${processedLine}</p>`;
    } else {
      // Empty line - close list if open
      if (inList) {
        html += '</ul>';
        inList = false;
      }
    }
  });

  if (inList) html += '</ul>';
  return html;
};

// Helper to extract SQLX block from markdown
const extractSqlx = (text: string): { analysis: string; code: string } => {
  const codeRegex = /```(?:sqlx|sql)?\n([\s\S]*?)\n```/;
  const match = text.match(codeRegex);
  
  if (match) {
    const code = match[1];
    // Remove the code block from the analysis text to avoid duplication
    const analysis = text.replace(codeRegex, '').trim();
    return { analysis, code };
  }
  
  return { analysis: text, code: '-- No SQLX code block generated' };
};

const DriftResolver: React.FC<DriftResolverProps> = ({ source, onResolve, onUpdateSource, onCancel }) => {
  const { addLog } = useConsole();
  
  // State
  const [parsedContent, setParsedContent] = useState<{ analysis: string; code: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'git' | 'compile' | 'deploy' | 'done'>('idle');

  // Restore state if this source has already been analyzed and saved to storage
  useEffect(() => {
    if (source.driftDetails?.solutionAnalysis && source.driftDetails?.solutionCode) {
      setParsedContent({
        analysis: source.driftDetails.solutionAnalysis,
        code: source.driftDetails.solutionCode
      });
      // We only force step 2 if we haven't manually navigated yet (implied by parsedContent being null initially)
      if (parsedContent === null) {
         setStep(2);
      }
    }
  }, [source]);

  const handleAnalyze = async () => {
    if (!source.driftDetails) return;
    
    setIsAnalyzing(true);
    addLog('Gemini', 'INFO', `Starting analysis for source: ${source.id}...`);
    addLog('Backend', 'INFO', `Sending payload sample to Gemini`, source.driftDetails.samplePayload.substring(0, 50) + '...');

    try {
      const result = await analyzeDriftWithGemini(source);
      const parsed = extractSqlx(result);
      
      setParsedContent(parsed);
      setStep(2);
      
      // PERSIST THE RESULT TO PARENT/STORAGE
      onUpdateSource(source.id, {
        driftDetails: {
          ...source.driftDetails,
          solutionAnalysis: parsed.analysis,
          solutionCode: parsed.code
        }
      });

      addLog('Gemini', 'SUCCESS', 'Drift analysis complete. Proposed SQLX changes saved to storage.');
    } catch (err) {
      addLog('Gemini', 'ERROR', 'Failed to analyze drift', String(err));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const simulatePatchExecution = async () => {
    setExecutionStatus('git');
    
    // Step 1: Git
    addLog('System', 'INFO', `Initializing automated schema patch for ${source.id}`);
    await new Promise(r => setTimeout(r, 800));
    addLog('Backend', 'INFO', `Git: Created branch 'fix/schema-drift-${Date.now().toString().substr(-4)}'`);
    addLog('Backend', 'INFO', `Git: Committed file '${source.id}.sqlx'`);
    
    // Step 2: Dataform Compile
    setExecutionStatus('compile');
    await new Promise(r => setTimeout(r, 1000));
    addLog('Dataform', 'INFO', `Compiling project...`);
    addLog('Dataform', 'SUCCESS', `Compilation successful. Validated new schema fields.`);
    
    // Step 3: BigQuery Deploy
    setExecutionStatus('deploy');
    await new Promise(r => setTimeout(r, 1200));
    addLog('BigQuery', 'INFO', `Job Submitted: ALTER TABLE ${source.id} ADD COLUMNS...`);
    addLog('BigQuery', 'SUCCESS', `Schema evolution applied. Table is now writable.`);
    
    setExecutionStatus('done');
    await new Promise(r => setTimeout(r, 500));
    
    onResolve(source.id);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-xl font-google-sans font-medium text-gray-800 flex items-center gap-2">
            Drift Resolution Console
            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded border border-red-200">Critical</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">Source: <span className="font-mono">{source.name}</span></p>
        </div>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">Close</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        
        {/* Step 1: Review the problem */}
        <div className={`mb-8 transition-all duration-500 ${step !== 1 ? 'hidden' : 'opacity-100'}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
            <h3 className="font-medium text-gray-800">Diagnostic Data</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              {/* Current Schema */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Expected Schema</h4>
                <ul className="space-y-1 text-sm font-mono text-gray-600 max-h-48 overflow-y-auto">
                  {source.schema.map(f => (
                    <li key={f.name} className="flex justify-between">
                      <span>{f.name}</span>
                      <span className="text-gray-400">{f.type}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Gemini Detection Report */}
              {source.driftDetails?.detectionReport && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 relative overflow-hidden shadow-sm">
                  <Sparkles className="w-16 h-16 text-purple-200 absolute -right-4 -top-4 opacity-50" />
                  <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-3 flex items-center gap-2 relative z-10">
                    <Bot className="w-3 h-3" /> 
                    Initial Gemini Assessment
                  </h4>
                  <div 
                    className="text-sm relative z-10"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(source.driftDetails.detectionReport) }} 
                  />
                </div>
              )}
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-100 h-full">
              <h4 className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <ArrowRightLeft className="w-3 h-3" /> 
                Detected Drift Details
              </h4>
              {source.driftDetails ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">New Unexpected Fields:</p>
                    <ul className="space-y-1 text-sm font-mono text-red-700">
                      {source.driftDetails.unexpectedFields.map(f => (
                        <li key={f.name} className="flex justify-between bg-white/50 px-2 py-1 rounded">
                          <span className="font-bold">+ {f.name}</span>
                          <span className="opacity-70">{f.type}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Sample Payload (Fragment):</p>
                    <pre className="text-[10px] bg-white p-2 rounded border border-red-100 overflow-x-auto whitespace-pre-wrap font-mono">
                      {source.driftDetails.samplePayload}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No specific details available.</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            {parsedContent ? (
               <div className="flex items-center gap-3">
                 <button 
                   onClick={() => setStep(2)}
                   className="bg-[#34A853] hover:bg-[#2D8E46] text-white px-6 py-2 rounded-lg shadow-sm flex items-center gap-2 font-medium transition-colors"
                 >
                   <FileCode className="w-4 h-4" />
                   View Generated Solution
                 </button>
                 <button 
                   onClick={handleAnalyze}
                   disabled={isAnalyzing}
                   className="text-sm text-blue-600 hover:underline px-3 py-2 rounded hover:bg-blue-50 transition-colors"
                 >
                    {isAnalyzing ? 'Regenerating...' : 'Regenerate Analysis'}
                 </button>
               </div>
            ) : (
               <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="bg-[#4285F4] hover:bg-[#3367D6] text-white px-6 py-2 rounded-lg shadow-sm flex items-center gap-2 font-medium transition-colors disabled:opacity-70"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                {isAnalyzing ? 'Gemini is generating patch...' : 'Generate Dataform Patch'}
              </button>
            )}

            {!parsedContent && (
              <div className="text-xs text-gray-500">
                Context window includes schema, payload, and lineage graph.
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Review Solution & Execute */}
        {step === 2 && parsedContent && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
             <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                   <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
                   <h3 className="font-medium text-gray-800">Gemini Recommendation Engine</h3>
                </div>
                <button 
                   onClick={() => setStep(1)}
                   className="text-xs text-blue-600 hover:underline"
                   disabled={executionStatus !== 'idle'}
                >
                  Back to Diagnostics
                </button>
             </div>

             <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
               {/* Left Col: Reasoning */}
               <div className="flex flex-col gap-4 overflow-y-auto pr-2">
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-5 shadow-sm">
                    <h4 className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-2">
                       <Bot className="w-4 h-4" /> AI Analysis
                    </h4>
                    <div 
                      className="text-sm text-gray-700"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(parsedContent.analysis) }}
                    />
                  </div>

                  {/* Execution Control */}
                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                     <h4 className="text-sm font-bold text-gray-800 mb-4">Deployment Pipeline</h4>
                     
                     <div className="space-y-4">
                        {/* Git Step */}
                        <div className={`flex items-center gap-3 ${executionStatus === 'idle' ? 'opacity-50' : 'opacity-100'}`}>
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${executionStatus === 'git' ? 'bg-blue-100 text-blue-600 animate-pulse' : executionStatus === 'idle' ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-600'}`}>
                              {executionStatus === 'git' ? <Loader2 className="w-4 h-4 animate-spin"/> : executionStatus === 'idle' ? <GitBranch className="w-4 h-4" /> : <CheckCircle className="w-4 h-4"/>}
                           </div>
                           <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Version Control</p>
                              <p className="text-xs text-gray-500">Create branch & commit .sqlx</p>
                           </div>
                        </div>

                        {/* Dataform Step */}
                         <div className={`flex items-center gap-3 ${['idle', 'git'].includes(executionStatus) ? 'opacity-50' : 'opacity-100'}`}>
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${executionStatus === 'compile' ? 'bg-blue-100 text-blue-600 animate-pulse' : ['idle', 'git'].includes(executionStatus) ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-600'}`}>
                              {executionStatus === 'compile' ? <Loader2 className="w-4 h-4 animate-spin"/> : ['idle', 'git'].includes(executionStatus) ? <FileCode className="w-4 h-4" /> : <CheckCircle className="w-4 h-4"/>}
                           </div>
                           <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Dataform Compilation</p>
                              <p className="text-xs text-gray-500">Validate SQLX & Dependency Graph</p>
                           </div>
                        </div>

                        {/* BigQuery Step */}
                        <div className={`flex items-center gap-3 ${executionStatus === 'done' || executionStatus === 'deploy' ? 'opacity-100' : 'opacity-50'}`}>
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${executionStatus === 'deploy' ? 'bg-blue-100 text-blue-600 animate-pulse' : executionStatus === 'done' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                              {executionStatus === 'deploy' ? <Loader2 className="w-4 h-4 animate-spin"/> : executionStatus === 'done' ? <CheckCircle className="w-4 h-4"/> : <Server className="w-4 h-4" />}
                           </div>
                           <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">BigQuery Deployment</p>
                              <p className="text-xs text-gray-500">Execute ALTER TABLE operations</p>
                           </div>
                        </div>
                     </div>

                     <div className="mt-6">
                       <button 
                         onClick={simulatePatchExecution}
                         disabled={executionStatus !== 'idle'}
                         className={`w-full py-3 rounded-lg shadow-sm flex items-center justify-center gap-2 font-bold text-sm transition-all
                           ${executionStatus === 'idle' 
                             ? 'bg-[#34A853] hover:bg-[#2D8E46] text-white hover:shadow-md' 
                             : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                       >
                         {executionStatus === 'idle' ? (
                           <>
                             <Play className="w-4 h-4 fill-current" />
                             Execute Schema Patch
                           </>
                         ) : (
                           <>Processing Pipeline...</>
                         )}
                       </button>
                     </div>
                  </div>
               </div>

               {/* Right Col: Code Preview */}
               <div className="flex flex-col h-full overflow-hidden bg-[#282c34] rounded-lg border border-gray-700 shadow-lg">
                 <div className="flex items-center justify-between px-4 py-2 bg-[#21252b] border-b border-gray-700">
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                       <FileCode className="w-3 h-3" />
                       {source.id}.sqlx
                    </div>
                    <div className="flex gap-1.5">
                       <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                    </div>
                 </div>
                 <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                    <pre className="font-mono text-sm text-[#abb2bf] leading-relaxed whitespace-pre">
                       {parsedContent.code}
                    </pre>
                 </div>
                 <div className="px-4 py-2 bg-[#21252b] border-t border-gray-700 text-[10px] text-gray-500 flex justify-between">
                    <span>Generated by Gemini 2.5 Flash</span>
                    <span>Read-Only Preview</span>
                 </div>
               </div>
             </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default DriftResolver;
