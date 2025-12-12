import React, { useState } from 'react';
import { Button } from './Button';
import { CONFIG } from '../constants';

interface PasswordPromptProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const PasswordPrompt: React.FC<PasswordPromptProps> = ({ onSuccess, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (password === CONFIG.ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setError('Contraseña incorrecta');
      setPassword('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña de Administrador</label>
        <input 
          type="password" 
          autoFocus
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Ingrese contraseña..."
        />
      </div>
      
      {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Confirmar</Button>
      </div>
    </form>
  );
};