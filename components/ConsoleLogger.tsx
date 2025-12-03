import React, { useEffect, useRef } from 'react';
import { useConsole } from '../contexts/ConsoleContext';
import { ChevronUp, ChevronDown, Terminal, Trash2, Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

const ConsoleLogger: React.FC = () => {
  const { logs, isOpen, toggleConsole, clearLogs } = useConsole();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  const getIcon = (level: string) => {
    switch (level) {
      case 'INFO': return <Info className="w-3 h-3 text-blue-400" />;
      case 'WARN': return <AlertTriangle className="w-3 h-3 text-yellow-400" />;
      case 'ERROR': return <XCircle className="w-3 h-3 text-red-400" />;
      case 'SUCCESS': return <CheckCircle className="w-3 h-3 text-green-400" />;
      default: return <Terminal className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-[#202124] text-gray-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 z-50 flex flex-col ${isOpen ? 'h-64' : 'h-10'}`}>
      {/* Header Bar */}
      <div 
        className="h-10 flex items-center justify-between px-4 bg-[#202124] border-b border-gray-700 cursor-pointer hover:bg-[#303134] transition-colors"
        onClick={toggleConsole}
      >
        <div className="flex items-center gap-2 font-mono text-sm font-medium text-gray-100">
          <Terminal className="w-4 h-4 text-google-blue-400" />
          <span>System Output Console</span>
          <span className="text-xs text-gray-500 ml-2">({logs.length} events)</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); clearLogs(); }}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-red-300 transition-colors"
            title="Clear Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>

      {/* Logs Area */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto p-2 font-mono text-xs console-scroll bg-[#1e1e1e]">
          {logs.length === 0 ? (
            <div className="text-gray-600 italic p-2">No system events logged yet. Interact with the pipeline...</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="mb-1 flex items-start gap-2 hover:bg-white/5 p-1 rounded border-l-2 border-transparent hover:border-gray-600">
                <span className="text-gray-500 min-w-[80px]">{log.timestamp.toLocaleTimeString()}</span>
                <span className={`font-bold uppercase min-w-[70px] text-[10px] px-1 rounded bg-white/5 text-center tracking-wider
                  ${log.source === 'Gemini' ? 'text-purple-300' : 'text-gray-300'}`}>
                  {log.source}
                </span>
                <div className="mt-0.5">{getIcon(log.level)}</div>
                <div className="flex-1 break-all">
                  <span className={log.level === 'ERROR' ? 'text-red-300' : 'text-gray-300'}>{log.message}</span>
                  {log.details && (
                    <pre className="mt-1 text-[10px] text-gray-500 overflow-x-auto whitespace-pre-wrap pl-2 border-l border-gray-700">
                      {log.details}
                    </pre>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};

export default ConsoleLogger;