import React from 'react';
import { Player, CalculatedStats } from '../types';
import { COLORS } from '../constants';

interface DonationTableProps {
  players: Player[];
  goalDaily: number;
  weekStart: number;
}

export const DonationTable: React.FC<DonationTableProps> = ({ players, goalDaily, weekStart }) => {
  
  const calculateStats = (player: Player): CalculatedStats => {
    const daysInWeek = 7;
    // Calcular días transcurridos desde el inicio de la semana (min 1, max 7) usualmente.
    const daysSinceWeekStart = Math.max(1, Math.ceil((Date.now() - weekStart) / (24 * 60 * 60 * 1000)));
    
    const weeklyGoal = goalDaily * 7;
    const weeklyDonation = player.weeklyTotal || 0;
    
    // Lógica: Si no han cumplido la meta, toman de su reserva (buffer)
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
    if (p >= 90) return COLORS.GREEN;
    if (p >= 70) return COLORS.YELLOW;
    return COLORS.RED;
  };

  const formatTimeBuffer = (amount: number) => {
    if (amount <= 0) return null;
    const daily = goalDaily || 1;
    const days = Math.floor(amount / daily);
    if (days <= 0) return null;
    return <span className="text-xs text-gray-500 ml-1 font-normal">({days}d)</span>;
  };

  // Ordenar: Mayor Total Donado primero
  const sortedPlayers = [...players].sort((a, b) => b.total - a.total);

  // Totales para el pie de página
  const activePlayers = sortedPlayers.filter(p => !p.absent && !p.isNew);
  const totalWeekly = activePlayers.reduce((acc, p) => acc + calculateStats(p).semanal, 0);
  const totalAccumulated = activePlayers.reduce((acc, p) => acc + p.accumulatedExcess, 0);
  const totalLifetime = activePlayers.reduce((acc, p) => acc + p.total, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-semibold">Nombre</th>
              <th className="px-6 py-3 font-semibold text-center text-gray-600">TENIA</th>
              <th className="px-6 py-3 font-semibold text-center text-blue-600">TIENE</th>
              <th className="px-6 py-3 font-semibold text-center">Semanal</th>
              <th className="px-6 py-3 font-semibold text-center hidden sm:table-cell">Diario Ø</th>
              <th className="px-6 py-3 font-semibold text-center">% Meta</th>
              <th className="px-6 py-3 font-semibold text-center">Reserva</th>
              <th className="px-6 py-3 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedPlayers.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No hay jugadores. Agrega datos manualmente.</td></tr>
            )}
            {sortedPlayers.map((player) => {
              if (player.absent) return null; 
              
              const stats = calculateStats(player);
              
              if (player.isNew) {
                return (
                  <tr key={player.name} className="bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{player.name}</td>
                    <td colSpan={7} className="px-6 py-4 text-center text-emerald-600 font-bold tracking-wide">
                      NUEVO MIEMBRO
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={player.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{player.name}</td>
                  <td className="px-6 py-4 text-center text-gray-500 font-mono text-xs md:text-sm">{formatNumber(player.previous)}</td>
                  <td className="px-6 py-4 text-center text-blue-600 font-mono font-medium text-xs md:text-sm">{formatNumber(player.current)}</td>
                  
                  <td className="px-6 py-4 text-center font-medium">
                     {formatNumber(stats.semanal)}
                  </td>
                  
                  <td className="px-6 py-4 text-center hidden sm:table-cell">
                    {formatNumber(stats.avgDaily)}
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPercentColor(stats.metaPerc)}`}>
                      {stats.metaPerc.toFixed(0)}%
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-center font-medium text-gray-700">
                    {formatNumber(stats.finalPotentialExcess)}
                    {stats.deficitDraw > 0 && (
                        <span className="block text-xs text-rose-500 font-normal">(-{formatNumber(stats.deficitDraw)})</span>
                    )}
                    {formatTimeBuffer(stats.finalPotentialExcess)}
                  </td>
                  
                  <td className="px-6 py-4 text-right font-bold text-gray-800">
                    {formatNumber(player.total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-800 text-white text-xs uppercase font-bold">
            <tr>
               <td className="px-6 py-3">Totales</td>
               <td></td>
               <td></td>
               <td className="px-6 py-3 text-center">{formatNumber(totalWeekly)}</td>
               <td className="hidden sm:table-cell"></td>
               <td></td>
               <td className="px-6 py-3 text-center">{formatNumber(totalAccumulated)}</td>
               <td className="px-6 py-3 text-right">{formatNumber(totalLifetime)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};