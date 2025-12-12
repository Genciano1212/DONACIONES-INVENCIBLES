import React from 'react';

export const HelpGuide: React.FC = () => {
  const items = [
    {
      title: "TENIA",
      desc: "Valor inicial lunes. Base del cálculo.",
      color: "text-gray-500"
    },
    {
      title: "TIENE",
      desc: "Valor actual visible en el juego.",
      color: "text-blue-600"
    },
    {
      title: "SEMANAL",
      desc: "Real de esta semana (Tiene - Tenía).",
      color: "text-emerald-700"
    },
    {
      title: "DIARIO",
      desc: "Promedio diario actual.",
      color: "text-gray-600"
    },
    {
      title: "% META",
      desc: "% Cumplido. Verde ≥90%, Rojo <70%.",
      color: "text-purple-600"
    },
    {
      title: "RESERVA",
      desc: "Exceso acumulado (Banco). Cubre faltas.",
      color: "text-gray-700"
    },
    {
      title: "TOTAL",
      desc: "Histórico total rastreado.",
      color: "text-purple-700"
    }
  ];

  return (
    <div className="space-y-2">
      <div className="bg-blue-50 p-2 rounded border border-blue-100 text-[10px] sm:text-xs text-blue-800">
        <p className="leading-tight">
          <strong>Sistema:</strong> Calcula donaciones semanales y gestiona automáticamente un "Banco" con los excesos para cubrir semanas bajas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {items.map((item, idx) => (
          <div key={idx} className="bg-white p-2 rounded border border-gray-200 shadow-sm flex flex-col justify-center">
            <h4 className={`font-bold text-[10px] uppercase ${item.color}`}>{item.title}</h4>
            <p className="text-gray-500 text-[10px] leading-tight mt-0.5">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};