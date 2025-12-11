import React, { useState, useEffect } from 'react';
import { AppData, Player } from './types';
import { loadData, saveData, exportDataToJson } from './services/storageService';
import { DonationTable } from './components/DonationTable';
import { ManualEntry } from './components/ManualEntry';
import { Settings } from './components/Settings';
import { Modal } from './components/Modal';
import { Button } from './components/Button';
import { AIAnalysis } from './components/AIAnalysis';

// Icons
const EditIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
const SettingsIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const RefreshIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const SaveIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const AIIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [modalMode, setModalMode] = useState<'manual' | 'settings' | 'ai' | null>(null);

  useEffect(() => {
    const loaded = loadData();
    setData(loaded);
  }, []);

  const getWeekStart = (): number => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return monday.getTime();
  };

  const handleStartNewWeek = async (manualData: Record<string, number>) => {
    if (!data) return;

    // 1. Process Logic: Close previous week
    const weeklyGoal = data.goalDaily * 7;
    const updatedPlayers = { ...data.players };

    // First, finalize stats for existing players
    Object.keys(updatedPlayers).forEach(key => {
        const p = updatedPlayers[key];
        if(p.absent) return;

        const donation = p.weeklyTotal || 0;
        if(donation >= weeklyGoal) {
            p.accumulatedExcess += (donation - weeklyGoal);
        } else {
            const deficit = weeklyGoal - donation;
            const deduction = Math.min(deficit, p.accumulatedExcess);
            p.accumulatedExcess -= deduction;
            p.total += deduction; // "Pay" the guild from bank
        }
        p.weeklyTotal = 0; // Reset
    });

    // 2. Process New Data
    Object.keys(updatedPlayers).forEach(key => {
        if (!manualData[key]) {
            updatedPlayers[key].absent = true;
        }
    });

    Object.entries(manualData).forEach(([name, currentAmount]) => {
        if (!updatedPlayers[name]) {
            // New Player
            updatedPlayers[name] = {
                name,
                previous: currentAmount,
                current: currentAmount,
                weeklyTotal: 0,
                accumulatedExcess: 0,
                total: 0,
                lastSeen: Date.now(),
                absent: false,
                isNew: true
            };
        } else {
            // Existing Player
            const p = updatedPlayers[name];
            p.absent = false;
            p.isNew = false;
            
            const diff = currentAmount - p.current;
            if (diff > 0) {
                p.previous = p.current; // Snapshot previous
                p.current = currentAmount;
                p.weeklyTotal += diff;
                p.total += diff;
            } else {
                // Should not happen unless game reset or bad input. 
                // We trust input: if current is lower, maybe they left and came back? 
                // For safety, we just update current.
                p.current = currentAmount;
            }
            p.lastSeen = Date.now();
        }
    });

    const newData: AppData = {
        ...data,
        players: updatedPlayers,
        weekStart: getWeekStart(),
        lastUpdate: Date.now()
    };

    setData(newData);
    saveData(newData);
    setModalMode(null);
  };

  const updateGoal = (newGoal: number) => {
    if (!data) return;
    const newData = { ...data, goalDaily: newGoal };
    setData(newData);
    saveData(newData);
    setModalMode(null);
  };

  const handleResetWeekOnly = () => {
     if(!data) return;
     if(!window.confirm("¿Reiniciar la semana sin ingresar datos? Esto calculará excesos/déficits y establecerá todas las contribuciones semanales a 0.")) return;
     
     const updatedPlayers = { ...data.players };
     const weeklyGoal = data.goalDaily * 7;

     Object.values(updatedPlayers).forEach((p: Player) => {
        if(p.absent) return;
        const donation = p.weeklyTotal;
        if(donation >= weeklyGoal) {
            p.accumulatedExcess += (donation - weeklyGoal);
        } else {
            const deficit = weeklyGoal - donation;
            const deduction = Math.min(deficit, p.accumulatedExcess);
            p.accumulatedExcess -= deduction;
            p.total += deduction;
        }
        p.weeklyTotal = 0;
     });

     const newData = {
         ...data,
         players: updatedPlayers,
         weekStart: getWeekStart(),
         lastUpdate: Date.now()
     };
     setData(newData);
     saveData(newData);
  };

  if (!data) return <div className="min-h-screen flex items-center justify-center text-gray-500">Cargando...</div>;

  return (
    <div className="min-h-screen pb-16 relative">
      {/* Header - Buttons Only */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-center">
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto justify-center">
             <Button variant="primary" icon={<EditIcon />} onClick={() => setModalMode('manual')}>Ingresar Datos</Button>
             <Button variant="secondary" icon={<SettingsIcon />} onClick={() => setModalMode('settings')}>Config</Button>
             <Button variant="secondary" icon={<RefreshIcon />} onClick={handleResetWeekOnly}>Reiniciar</Button>
             <Button variant="secondary" icon={<SaveIcon />} onClick={() => exportDataToJson(data)}>Exportar</Button>
             <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200 focus:ring-purple-500" 
                icon={<AIIcon />} 
                onClick={() => setModalMode('ai')}
             >
                Análisis IA
             </Button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Legend */}
        <div className="flex flex-wrap gap-6 justify-center text-xs font-medium text-gray-600 bg-white p-3 rounded-lg border border-gray-100 shadow-sm w-fit mx-auto">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></div> ≥90% Meta</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></div> 70-89% Meta</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-rose-100 border border-rose-300"></div> &lt;70% Meta</div>
        </div>

        {/* Table */}
        <DonationTable 
            players={Object.values(data.players)} 
            goalDaily={data.goalDaily}
            weekStart={data.weekStart}
        />

        <div className="text-center text-xs text-gray-400">
            Última Actualización: {new Date(data.lastUpdate).toLocaleString()}
        </div>
      </main>

      {/* Watermark */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none z-0">
         <span className="text-lg font-bold text-gray-300 uppercase tracking-widest opacity-60">
           Propiedad del Clan INVENCIBLES
         </span>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={modalMode === 'manual'} 
        onClose={() => setModalMode(null)} 
        title="Ingresar Datos de la Semana"
      >
        <ManualEntry onProcess={handleStartNewWeek} onCancel={() => setModalMode(null)} />
      </Modal>

      <Modal 
        isOpen={modalMode === 'settings'} 
        onClose={() => setModalMode(null)} 
        title="Configuración"
      >
        <Settings 
            currentGoal={data.goalDaily} 
            onSave={updateGoal} 
            onCancel={() => setModalMode(null)} 
        />
      </Modal>

      <Modal 
        isOpen={modalMode === 'ai'} 
        onClose={() => setModalMode(null)} 
        title="Análisis de Rendimiento Gemini"
      >
        <AIAnalysis data={data} onClose={() => setModalMode(null)} />
      </Modal>
    </div>
  );
}

export default App;