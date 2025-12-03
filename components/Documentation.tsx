
import React, { useState } from 'react';
import { DOCS_CONTENT } from '../constants';
import { BookOpen, ChevronRight, Code2, Database, Layers, Cpu, Bot, Terminal } from 'lucide-react';

const Documentation: React.FC = () => {
  const [activeSection, setActiveSection] = useState<keyof typeof DOCS_CONTENT>('INGESTION');

  const SECTIONS = [
    {
      title: 'Architecture Guide',
      icon: <BookOpen className="w-5 h-5 text-[#4285F4]" />,
      items: [
        { id: 'INGESTION', label: 'Ingestion Layer', icon: <Layers className="w-4 h-4"/> },
        { id: 'STORAGE', label: 'Storage Layer', icon: <Database className="w-4 h-4"/> },
        { id: 'TRANSFORMATION', label: 'Transformation Layer', icon: <Code2 className="w-4 h-4"/> },
      ]
    },
    {
      title: 'Advanced Patterns',
      icon: <Cpu className="w-5 h-5 text-[#A142F4]" />,
      items: [
        { id: 'BATCH_BQML', label: 'Batch & BQML', icon: <Bot className="w-4 h-4"/> }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Sidebar Nav */}
      <div className="col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-fit">
        
        {SECTIONS.map((section, idx) => (
          <div key={section.title} className={idx > 0 ? 'mt-6 pt-6 border-t border-gray-100' : ''}>
            <h3 className="text-lg font-google-sans font-medium text-gray-800 mb-4 flex items-center gap-2 px-2">
              {section.icon}
              {section.title}
            </h3>
            <nav className="space-y-2">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as keyof typeof DOCS_CONTENT)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between group
                    ${activeSection === item.id 
                      ? 'bg-blue-50 text-[#1967D2] shadow-sm border border-blue-100' 
                      : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={activeSection === item.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}>
                      {item.icon}
                    </span>
                    {item.label}
                  </div>
                  {activeSection === item.id && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </nav>
          </div>
        ))}
        
        <div className="mt-8 px-4 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-3 flex items-center gap-2">
            <Terminal className="w-3 h-3" /> External Resources
          </p>
          <a href="https://cloud.google.com/bigquery/docs" target="_blank" rel="noreferrer" className="block text-sm text-gray-600 hover:text-blue-600 hover:underline mb-2">BigQuery Docs ↗</a>
          <a href="https://cloud.google.com/dataflow/docs" target="_blank" rel="noreferrer" className="block text-sm text-gray-600 hover:text-blue-600 hover:underline mb-2">Dataflow Docs ↗</a>
          <a href="https://cloud.google.com/dataform/docs" target="_blank" rel="noreferrer" className="block text-sm text-gray-600 hover:text-blue-600 hover:underline">Dataform Docs ↗</a>
        </div>
      </div>

      {/* Content */}
      <div className="col-span-9 bg-white rounded-xl shadow-sm border border-gray-100 p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          <div 
            className="prose prose-blue max-w-none"
            dangerouslySetInnerHTML={{ __html: DOCS_CONTENT[activeSection] }} 
          />
        </div>
      </div>
    </div>
  );
};

export default Documentation;
