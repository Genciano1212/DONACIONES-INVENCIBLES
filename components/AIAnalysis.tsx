import React, { useEffect, useState } from 'react';
import { AppData } from '../types';
import { analyzePerformance } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface AIAnalysisProps {
  data: AppData;
  onClose: () => void;
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ data, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      const result = await analyzePerformance(data);
      setReport(result);
      setLoading(false);
    };
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
       {loading ? (
         <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 text-sm">Gemini está analizando el rendimiento del clan...</p>
         </div>
       ) : (
         <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-y-auto max-h-[60vh]">
            <div className="whitespace-pre-wrap font-sans text-gray-800">
                {report}
            </div>
         </div>
       )}
       <div className="flex justify-end">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-sm font-medium">Cerrar Informe</button>
       </div>
    </div>
  );
};