import React, { useState, useEffect } from 'react';
import { AppData, Player } from './types';
import { loadData, saveData, exportDataToJson } from './services/storageService';
import { DonationTable } from './components/DonationTable';
import { ManualEntry } from './components/ManualEntry';
import { Settings } from './components/Settings';
import { Modal } from './components/Modal';
import { Button } from './components/Button';
import { HelpGuide } from './components/HelpGuide';
import { PasswordPrompt } from './components/PasswordPrompt';

// Icons
const EditIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
const SettingsIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const RefreshIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const SaveIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const HelpIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [modalMode, setModalMode] = useState<'manual' | 'settings' | 'help' | 'auth' | null>(null);
  const [pendingAction, setPendingAction] = useState<'manual' | 'reset' | null>(null);

  useEffect(() => {
    const loaded = loadData();
    setData(loaded);
  }, []);

  // Guardar datos automáticamente cada vez que cambian
  useEffect(() => {
    if (data) {
      saveData(data);
    }
  }, [data]);

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

    const weeklyGoal = data.goalDaily * 7;
    const updatedPlayers = { ...data.players };

    // 0. Resetear estado "isLeaving" de la actualización anterior
    // Si alguien estaba "saliendo" la vez pasada, ahora ya está oficialmente fuera (oculto)
    Object.values(updatedPlayers).forEach((p: Player) => {
        if (p.isLeaving) {
            p.isLeaving = false;
        }
    });

    // 1. Process Logic (Calcular metas y bancos para jugadores existentes)
    Object.keys(updatedPlayers).forEach(key => {
        const p = updatedPlayers[key];
        // Solo procesamos finanzas si no está ausente
        if(p.absent) return;

        const donation = p.weeklyTotal || 0;
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

    // 2. Detectar jugadores que faltan en la nueva lista (Salieron del clan)
    Object.keys(updatedPlayers).forEach(key => {
        if (!manualData[key]) {
            // Si el jugador estaba activo (no absent) y ahora no está en la lista:
            if (!updatedPlayers[key].absent) {
                updatedPlayers[key].absent = true;
                updatedPlayers[key].isLeaving = true; // Flag para mostrar mensaje "Ya no pertenece" esta vez
            }
        }
    });

    // 3. Procesar datos manuales (Actualizar existentes y crear nuevos)
    Object.entries(manualData).forEach(([name, currentAmount]) => {
        if (!updatedPlayers[name]) {
            // NUEVO JUGADOR
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
            // JUGADOR EXISTENTE
            const p = updatedPlayers[name];
            p.absent = false;
            p.isNew = false;
            p.isLeaving = false; // Confirmamos que sigue aquí
            
            const diff = currentAmount - p.current;
            if (diff > 0) {
                p.previous = p.current;
                p.current = currentAmount;
                p.weeklyTotal += diff;
                p.total += diff;
            } else {
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
    // saveData se llama automáticamente por el useEffect
    setModalMode(null);
  };

  const updateGoal = (newGoal: number) => {
    if (!data) return;
    const newData = { ...data, goalDaily: newGoal };
    setData(newData);
    // saveData se llama automáticamente por el useEffect
    setModalMode(null);
  };

  const handleResetWeekOnly = () => {
     if(!data) return;
     if(!window.confirm("¿Reiniciar la semana sin ingresar datos?")) return;
     
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
     // saveData se llama automáticamente por el useEffect
  };

  // Manejadores de autenticación
  const initiateAction = (action: 'manual' | 'reset') => {
      setPendingAction(action);
      setModalMode('auth');
  };

  const handleAuthSuccess = () => {
      setModalMode(null); // Cerrar modal de auth
      if (pendingAction === 'manual') {
          // Pequeño timeout para permitir transición de modales
          setTimeout(() => setModalMode('manual'), 100);
      } else if (pendingAction === 'reset') {
          handleResetWeekOnly();
      }
      setPendingAction(null);
  };

  if (!data) return <div className="min-h-screen flex items-center justify-center text-gray-500">Cargando...</div>;

  return (
    <div className="min-h-screen pb-20 relative bg-slate-50">
      {/* Header Compacto Fixed */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 py-2 relative flex justify-between items-center">
            
            {/* Main Controls - Ajustado para móvil */}
            <div className="flex items-center gap-1 md:gap-3 flex-1 overflow-x-auto no-scrollbar">
                <Button variant="primary" icon={<EditIcon />} onClick={() => setModalMode('manual')} className="px-2 md:px-5">
                    <span className="hidden sm:inline">Ingresar</span>
                </Button>
                <Button variant="secondary" icon={<SettingsIcon />} onClick={() => setModalMode('settings')} className="px-2 md:px-5">
                    <span className="hidden sm:inline">Config</span>
                </Button>
                <Button variant="secondary" icon={<RefreshIcon />} onClick={() => initiateAction('reset')} className="px-2 md:px-5">
                    <span className="hidden sm:inline">Reiniciar</span>
                </Button>
                <Button variant="secondary" icon={<SaveIcon />} onClick={() => exportDataToJson(data)} className="px-2 md:px-5">
                    <span className="hidden sm:inline">Exportar</span>
                </Button>
            </div>

            {/* Help Button - Siempre visible pero discreto */}
            <button 
                onClick={() => setModalMode('help')}
                className="text-gray-400 hover:text-blue-600 transition-colors p-2 ml-1"
                title="Glosario"
            >
                <HelpIcon />
            </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-1 md:px-4 lg:px-8 pt-20 pb-8 space-y-3 md:space-y-6">
        
        {/* Legend - Super Compact */}
        <div className="flex gap-3 justify-center text-[10px] md:text-sm font-semibold text-gray-700 bg-white py-1 px-3 rounded-full border border-gray-200 shadow-sm w-fit mx-auto">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"></div>≥90%</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div>70-89%</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-400"></div>&lt;70%</div>
        </div>

        {/* Table */}
        <DonationTable 
            players={Object.values(data.players)} 
            goalDaily={data.goalDaily}
            weekStart={data.weekStart}
        />

        <div className="text-center text-[10px] md:text-xs text-gray-400">
            {new Date(data.lastUpdate).toLocaleString()}
        </div>
      </main>

      {/* Watermark */}
      <div className="fixed bottom-2 left-0 right-0 flex justify-center pointer-events-none z-0">
         <span className="text-sm md:text-xl font-black text-slate-200 uppercase tracking-[0.2em]">
           INVENCIBLES
         </span>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={modalMode === 'manual'} 
        onClose={() => setModalMode(null)} 
        title="Ingresar Datos"
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
        isOpen={modalMode === 'help'} 
        onClose={() => setModalMode(null)} 
        title="Glosario"
      >
        <HelpGuide />
      </Modal>

      <Modal
        isOpen={modalMode === 'auth'}
        onClose={() => setModalMode(null)}
        title="Autorización Requerida"
      >
        <PasswordPrompt 
            onSuccess={handleAuthSuccess} 
            onCancel={() => setModalMode(null)} 
        />
      </Modal>
    </div>
  );
}

export default App;