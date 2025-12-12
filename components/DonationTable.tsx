import React, { useState, useEffect } from 'react';
import { Player, CalculatedStats } from '../types';

interface DonationTableProps {
  players: Player[];
  goalDaily: number;
  weekStart: number;
}

const glossary: Record<string, string> = {
    name: "Nombre del jugador.",
    tenia: "Donación al inicio de la semana (Lunes). Punto de partida.",
    tiene: "Donación actual visible en el juego.",
    semanal: "Lo donado realmente esta semana (Tiene - Tenía).",
    diario: "Promedio de donación por día transcurrido.",
    meta: "Porcentaje completado de la meta semanal.",
    reserva: "Exceso acumulado (Banco). Cubre semanas malas.",
    total: "Total histórico rastreado por la app."
};

export const DonationTable: React.FC<DonationTableProps> = ({ players, goalDaily, weekStart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Cerrar tooltip al hacer clic en cualquier parte
  useEffect(() => {
    const handleClickOutside = () => setActiveTooltip(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleHeaderClick = (e: React.MouseEvent, key: string) => {
    e.stopPropagation(); // Evitar que el listener global lo cierre inmediatamente
    setActiveTooltip(activeTooltip === key ? null : key);
  };
  
  const calculateStats = (player: Player): CalculatedStats => {
    const daysSinceWeekStart = Math.max(1, Math.ceil((Date.now() - weekStart) / (24 * 60 * 60 * 1000)));
    
    const weeklyGoal = goalDaily * 7;
    const weeklyDonation = player.weeklyTotal || 0;
    
    let deficitDraw = 0;
    if (weeklyDonation < weeklyGoal) {
        const deficit = weeklyGoal - weeklyDonation;
        deficitDraw = Math.min(deficit, player.accumulatedExcess || 0);
    }

    const effectiveSemanal = weeklyDonation + deficitDraw;
    const avgDaily = effectiveSemanal / daysSinceWeekStart;
    const avgDailyPerc = (avgDaily / goalDaily) * 100;
    const metaPerc = (effectiveSemanal / weeklyGoal) * 100;

    const totalPerc = (player.total || 0) > 0 ? 100 : 0; 

    const currentWeeklyExcess = Math.max(0, weeklyDonation - weeklyGoal);
    const finalPotentialExcess = (player.accumulatedExcess || 0) - deficitDraw + currentWeeklyExcess;

    return {
        semanal: effectiveSemanal,
        avgDaily,
        avgDailyPerc,
        metaPerc,
        totalPerc,
        weeklyGoal,
        deficitDraw,
        finalPotentialExcess
    };
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString('es-ES');
  };

  const getPercentColor = (p: number) => {
    if (p >= 90) return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    if (p >= 70) return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    return 'bg-rose-100 text-rose-800 border border-rose-300';
  };

  const formatTimeBuffer = (amount: number) => {
    if (amount <= 0) return null;
    const daily = goalDaily || 1;
    const days = Math.floor(amount / daily);
    if (days <= 0) return null;
    return <span className="text-[9px] md:text-sm text-gray-400 ml-0.5 font-bold">({days}d)</span>;
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  // Ordenar: primero activos por total, al final los que se van
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
      if (a.isLeaving && !b.isLeaving) return 1;
      if (!a.isLeaving && b.isLeaving) return -1;
      return b.total - a.total;
  });

  const allActivePlayers = players.filter(p => !p.absent && !p.isNew);
  const totalWeekly = allActivePlayers.reduce((acc, p) => acc + calculateStats(p).semanal, 0);
  const totalAccumulated = allActivePlayers.reduce((acc, p) => acc + p.accumulatedExcess, 0);
  const totalLifetime = allActivePlayers.reduce((acc, p) => acc + p.total, 0);

  // Helper para renderizar tooltip
  const renderTooltip = (key: string) => {
      if (activeTooltip !== key) return null;
      return (
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-40 md:w-56 bg-slate-800 text-white text-[10px] md:text-xs font-medium p-2 md:p-3 rounded-lg shadow-xl z-50 normal-case tracking-normal leading-relaxed text-center pointer-events-none animate-in fade-in zoom-in-95 duration-150">
             {glossary[key]}
             <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
          </div>
      );
  };

  // Clase común para headers. 
  // NOTA: Eliminado 'relative' para evitar conflicto con 'sticky'. Sticky ya crea contexto para tooltips.
  const thBase = "cursor-help group select-none";
  
  // Ajuste de sticky top para compensar el header fijo de la App (aprox 57px mobile, 60px desktop)
  const stickyTop = "top-[57px] md:top-[60px]";
  const stickyHeaderClass = `sticky ${stickyTop} bg-slate-100 z-40`;

  return (
    <div className="space-y-2 md:space-y-4">
      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          className="block w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm shadow-sm"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg md:rounded-2xl shadow-lg border border-gray-300">
        <div className="">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 border-b-2 md:border-b-4 border-slate-400 text-slate-700">
              <tr>
                {/* NOMBRE - Sticky Left + Sticky Top - z-50 (FIXED from z-45) para asegurar que tape las celdas del body (z-10) */}
                <th className={`sticky left-0 ${stickyTop} z-50 bg-slate-100 px-1 py-2 md:px-6 md:py-4 font-bold text-[9px] md:text-base uppercase border-r border-slate-400 shadow-[1px_0_3px_-1px_rgba(0,0,0,0.1)] w-[70px] md:w-auto text-left ${thBase}`}
                    onClick={(e) => handleHeaderClick(e, 'name')}>
                  NOMBRE
                  {renderTooltip('name')}
                </th>

                {/* TENIA (Hidden Mobile) */}
                <th className={`hidden sm:table-cell ${stickyHeaderClass} px-2 py-2 md:px-4 md:py-4 font-bold text-[9px] md:text-base uppercase text-center text-slate-500 border-r border-slate-400 whitespace-nowrap ${thBase}`}
                    onClick={(e) => handleHeaderClick(e, 'tenia')}>
                    TENIA
                    {renderTooltip('tenia')}
                </th>

                {/* TIENE (Hidden Mobile) */}
                <th className={`hidden sm:table-cell ${stickyHeaderClass} px-2 py-2 md:px-4 md:py-4 font-bold text-[9px] md:text-base uppercase text-center text-blue-700 border-r border-slate-400 bg-blue-50 whitespace-nowrap ${thBase}`}
                    onClick={(e) => handleHeaderClick(e, 'tiene')}>
                    TIENE
                    {renderTooltip('tiene')}
                </th>
                
                {/* SEMANAL */}
                <th className={`${stickyHeaderClass} px-1 py-2 md:px-4 md:py-4 font-bold text-[9px] md:text-base uppercase text-center border-r border-slate-400 whitespace-nowrap ${thBase}`}
                    onClick={(e) => handleHeaderClick(e, 'semanal')}>
                    SEMANAL
                    {renderTooltip('semanal')}
                </th>
                
                {/* DIARIO (Hidden Mobile) */}
                <th className={`hidden md:table-cell ${stickyHeaderClass} px-2 py-2 md:px-4 md:py-4 font-bold text-[9px] md:text-base uppercase text-center border-r border-slate-400 whitespace-nowrap ${thBase}`}
                    onClick={(e) => handleHeaderClick(e, 'diario')}>
                    DIARIO
                    {renderTooltip('diario')}
                </th>
                
                {/* % META */}
                <th className={`${stickyHeaderClass} px-1 py-2 md:px-4 md:py-4 font-bold text-[9px] md:text-base uppercase text-center border-r border-slate-400 whitespace-nowrap ${thBase}`}
                    onClick={(e) => handleHeaderClick(e, 'meta')}>
                    %
                    {renderTooltip('meta')}
                </th>
                
                {/* RESERVA */}
                <th className={`${stickyHeaderClass} px-1 py-2 md:px-4 md:py-4 font-bold text-[9px] md:text-base uppercase text-center border-r border-slate-400 whitespace-nowrap ${thBase}`}
                    onClick={(e) => handleHeaderClick(e, 'reserva')}>
                    RESERVA
                    {renderTooltip('reserva')}
                </th>
                
                {/* TOTAL */}
                <th className={`${stickyHeaderClass} px-1 py-2 md:px-6 md:py-4 font-bold text-[9px] md:text-base uppercase text-right whitespace-nowrap ${thBase}`}
                    onClick={(e) => handleHeaderClick(e, 'total')}>
                    TOTAL
                     {renderTooltip('total')}
                </th>
              </tr>
            </thead>
            {/* Darker Dividers: divide-slate-400 */}
            <tbody className="divide-y divide-slate-400">
              {sortedPlayers.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-6 text-xs md:text-xl text-gray-400 font-bold">
                    {searchTerm ? 'No encontrado' : 'Sin datos'}
                  </td></tr>
              )}
              {sortedPlayers.map((player) => {
                // Modificado: Mostramos si no está ausente, O si está ausente pero se está yendo (isLeaving)
                if (player.absent && !player.isLeaving) return null; 
                
                const stats = calculateStats(player);
                const isNew = player.isNew;
                const isLeaving = player.isLeaving;
                
                let rowBg = "bg-white";
                let rowHover = "hover:bg-blue-50";
                let stickyBg = "bg-white group-hover:bg-blue-50";
                
                // Darker border: border-slate-400
                let borderClass = "border-slate-400";
                let nameTextClass = "text-indigo-900";

                if (isNew) {
                    rowBg = "bg-emerald-50";
                    rowHover = "";
                    stickyBg = "bg-emerald-50";
                    borderClass = "border-emerald-300";
                    nameTextClass = "text-emerald-900";
                } else if (isLeaving) {
                    rowBg = "bg-rose-50";
                    rowHover = "";
                    stickyBg = "bg-rose-50";
                    borderClass = "border-rose-300";
                    nameTextClass = "text-rose-900";
                }

                return (
                  <tr key={player.name} className={`group transition-colors ${rowBg} ${rowHover} ${isNew ? 'border-b border-emerald-300' : ''}`}>
                    {/* Sticky Nombre - z-10 es suficiente para el body, el header lo tapa con z-50 */}
                    <td className={`sticky left-0 z-10 px-1 py-1.5 md:px-6 md:py-5 border-r ${borderClass} ${stickyBg} shadow-[1px_0_3px_-1px_rgba(0,0,0,0.1)]`}>
                      <div className={`font-bold text-[11px] md:text-lg truncate max-w-[85px] md:max-w-none leading-tight ${nameTextClass}`}>
                        {player.name}
                      </div>
                      {isNew && <div className="text-[8px] md:text-xs text-emerald-600 font-black tracking-tighter leading-none">NUEVO</div>}
                      {isLeaving && <div className="text-[8px] md:text-xs text-rose-600 font-black tracking-tighter leading-none">YA NO PERTENECE</div>}
                    </td>
                    
                    {/* Tenia/Tiene Hidden Mobile */}
                    <td className={`hidden sm:table-cell px-2 py-2 md:px-4 md:py-5 text-center text-gray-400 font-mono text-xs md:text-lg border-r ${borderClass}`}>
                      {isLeaving ? '-' : formatNumber(player.previous)}
                    </td>
                    <td className={`hidden sm:table-cell px-2 py-2 md:px-4 md:py-5 text-center text-blue-600 font-mono font-bold text-xs md:text-xl border-r ${isNew ? 'border-emerald-300' : 'border-blue-200'}`}>
                      {isLeaving ? '-' : formatNumber(player.current)}
                    </td>
                    
                    {/* Semanal */}
                    <td className={`px-1 py-1.5 md:px-4 md:py-5 text-center font-bold text-[11px] md:text-xl text-emerald-700 border-r ${borderClass}`}>
                       {isLeaving ? '-' : formatNumber(stats.semanal)}
                    </td>
                    
                    {/* Diario Hidden Mobile */}
                    <td className={`hidden md:table-cell px-2 py-2 md:px-4 md:py-5 text-center text-gray-600 font-medium text-xs md:text-lg border-r ${borderClass}`}>
                      {isLeaving ? '-' : formatNumber(stats.avgDaily)}
                    </td>
                    
                    {/* % Meta */}
                    <td className={`px-1 py-1.5 md:px-4 md:py-5 text-center border-r ${borderClass}`}>
                      {isLeaving ? (
                         <span className="text-gray-300">-</span>
                      ) : (
                        <span className={`inline-flex items-center px-1.5 py-0.5 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-sm font-bold ${getPercentColor(stats.metaPerc)}`}>
                            {stats.metaPerc.toFixed(0)}%
                        </span>
                      )}
                    </td>
                    
                    {/* Reserva / Banco */}
                    <td className={`px-1 py-1.5 md:px-4 md:py-5 text-center font-bold text-[11px] md:text-lg text-gray-700 border-r ${borderClass}`}>
                      {isLeaving ? (
                          <span className="text-gray-400 text-xs italic">Inactivo</span>
                      ) : (
                        <div className="flex flex-col items-center leading-none">
                            <span>{formatNumber(stats.finalPotentialExcess)}</span>
                            {stats.deficitDraw > 0 && (
                                <span className="text-[9px] md:text-sm text-rose-600 font-bold">-{formatNumber(stats.deficitDraw)}</span>
                            )}
                            {formatTimeBuffer(stats.finalPotentialExcess)}
                        </div>
                      )}
                    </td>
                    
                    {/* Total */}
                    <td className="px-1 py-1.5 md:px-6 md:py-5 text-right font-extrabold text-[11px] md:text-xl text-purple-700">
                      {formatNumber(player.total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-800 text-white text-[10px] md:text-sm uppercase font-bold border-t-2 md:border-t-4 border-slate-600 relative z-20">
              <tr>
                 {/* Footer sticky left to match body */}
                 <td className="sticky left-0 bg-slate-800 px-1 py-2 md:px-6 md:py-5 text-[10px] md:text-base shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">TOT</td>
                 <td className="hidden sm:table-cell border-r border-slate-600"></td>
                 <td className="hidden sm:table-cell border-r border-slate-600"></td>
                 <td className="px-1 py-2 md:px-4 md:py-5 text-center text-[10px] md:text-xl text-emerald-300 border-r border-slate-600">{formatNumber(totalWeekly)}</td>
                 <td className="hidden md:table-cell border-r border-slate-600"></td>
                 <td className="border-r border-slate-600"></td>
                 <td className="px-1 py-2 md:px-4 md:py-5 text-center text-[10px] md:text-xl border-r border-slate-600">{formatNumber(totalAccumulated)}</td>
                 <td className="px-1 py-2 md:px-6 md:py-5 text-right text-[10px] md:text-2xl text-purple-300">{formatNumber(totalLifetime)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};