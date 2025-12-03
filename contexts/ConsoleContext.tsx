import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { LogEntry } from '../types';

interface ConsoleContextType {
  logs: LogEntry[];
  addLog: (source: LogEntry['source'], level: LogEntry['level'], message: string, details?: string) => void;
  clearLogs: () => void;
  isOpen: boolean;
  toggleConsole: () => void;
}

const ConsoleContext = createContext<ConsoleContextType | undefined>(undefined);

export const ConsoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  const addLog = useCallback((source: LogEntry['source'], level: LogEntry['level'], message: string, details?: string) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      source,
      level,
      message,
      details
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const toggleConsole = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <ConsoleContext.Provider value={{ logs, addLog, clearLogs, isOpen, toggleConsole }}>
      {children}
    </ConsoleContext.Provider>
  );
};

export const useConsole = () => {
  const context = useContext(ConsoleContext);
  if (context === undefined) {
    throw new Error('useConsole must be used within a ConsoleProvider');
  }
  return context;
};