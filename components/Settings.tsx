import React, { useState } from 'react';
import { Button } from './Button';
import { CONFIG } from '../constants';

interface SettingsProps {
  currentGoal: number;
  onSave: (newGoal: number) => void;
  onCancel: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ currentGoal, onSave, onCancel }) => {
  const [goal, setGoal] = useState(currentGoal.toString());
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (password !== CONFIG.ADMIN_PASSWORD) {
      setError('Contraseña de administrador incorrecta');
      return;
    }
    const val = parseInt(goal);
    if (isNaN(val) || val < 1000) {
      setError('La meta debe ser al menos 1,000');
      return;
    }
    onSave(val);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Meta Diaria por Jugador</label>
        <input 
          type="number" 
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña de Admin</label>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Requerido para cambiar ajustes"
          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="success" onClick={handleSave}>Guardar Cambios</Button>
      </div>
    </div>
  );
};