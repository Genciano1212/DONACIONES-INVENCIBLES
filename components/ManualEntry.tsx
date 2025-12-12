import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { extractDonationDataFromImage } from '../services/geminiService';
import { PasswordPrompt } from './PasswordPrompt';

interface ManualEntryProps {
  onProcess: (data: Record<string, number>) => void;
  onCancel: () => void;
}

export const ManualEntry: React.FC<ManualEntryProps> = ({ onProcess, onCancel }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingData, setPendingData] = useState<Record<string, number> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    setError('');
    const lines = text.split('\n');
    const data: Record<string, number> = {};
    let count = 0;

    for (const line of lines) {
      if (!line.trim()) continue;
      // Handle comma or tab separated
      const parts = line.includes(',') ? line.split(',') : line.split('\t');
      
      if (parts.length < 2) {
          // Attempt space separation if last part is number
          const spaceParts = line.trim().split(/\s+/);
          const last = spaceParts.pop();
          const name = spaceParts.join(' ');
          if(last && !isNaN(Number(last)) && name) {
             data[name] = Number(last);
             count++;
             continue;
          }
          continue; 
      }

      const name = parts[0].trim();
      // Remove non-numeric chars except digits
      const valueStr = parts[parts.length - 1].replace(/[^0-9]/g, '');
      const value = parseInt(valueStr);

      if (name && !isNaN(value)) {
        data[name] = value;
        count++;
      }
    }

    if (count === 0) {
      setError('No se encontraron datos válidos. Formato: Nombre, Cantidad');
      return;
    }

    // Almacenar datos y pedir contraseña
    setPendingData(data);
    setShowAuth(true);
  };

  const handleAuthSuccess = () => {
    if (pendingData) {
        onProcess(pendingData);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingImg(true);
    setError('');

    try {
      // Convert FileList to Array to map over it
      const fileArray = Array.from(files) as File[];
      
      // Create promises for reading and processing each file
      const processPromises = fileArray.map(file => {
        return new Promise<Record<string, number> | null>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async () => {
            const base64 = reader.result as string;
            try {
              const result = await extractDonationDataFromImage(base64);
              resolve(result);
            } catch (err) {
              console.error(`Error processing file ${file.name}`, err);
              resolve(null);
            }
          };
          reader.onerror = () => resolve(null);
        });
      });

      // Wait for all images to be processed
      const results = await Promise.all(processPromises);

      // Combine results
      const combinedData: Record<string, number> = {};
      let successCount = 0;

      results.forEach(result => {
        if (result) {
          Object.assign(combinedData, result);
          successCount++;
        }
      });

      if (successCount > 0) {
        // Convert JSON back to text format for the textarea
        const formattedText = Object.entries(combinedData)
          .map(([name, amount]) => `${name}, ${amount}`)
          .join('\n');
        
        setText((prev) => {
          const separator = prev.trim() ? '\n' : '';
          return prev + separator + formattedText;
        });
      } else {
        setError('No se pudieron extraer datos de las imágenes seleccionadas.');
      }

    } catch (err) {
      console.error(err);
      setError('Error general al procesar las imágenes.');
    } finally {
      setIsProcessingImg(false);
      // Reset input so same files can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (showAuth) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 py-4">
         <div className="text-center mb-4">
            <div className="mx-auto w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h3 className="font-bold text-gray-800">Autenticación Requerida</h3>
            <p className="text-sm text-gray-500">Confirma para procesar los datos ingresados.</p>
         </div>
         <PasswordPrompt 
            onSuccess={handleAuthSuccess} 
            onCancel={() => setShowAuth(false)} 
         />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 text-sm mb-2">Instrucciones</h4>
        <p className="text-sm text-blue-600 mb-2">
          Opción A: Sube una o varias capturas de pantalla del juego.
          <br/>
          Opción B: Pega los datos manualmente (<code>Nombre, Donación</code>).
        </p>
      </div>

      <div>
        <input 
          type="file" 
          ref={fileInputRef}
          accept="image/*" 
          multiple
          className="hidden" 
          onChange={handleFileUpload}
        />
        <Button 
          type="button" 
          variant="secondary" 
          className="w-full mb-2 border-dashed border-2 border-gray-300 hover:border-blue-400"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessingImg}
        >
          {isProcessingImg ? (
             <span className="flex items-center gap-2">
               <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               Procesando imágenes con IA...
             </span>
          ) : (
             <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Subir Capturas / Usar Cámara
             </span>
          )}
        </Button>
      </div>
      
      <textarea
        className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
        placeholder={`Jugador1, 25000\nJugador2, 18500\n...`}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      
      {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={isProcessingImg}>Procesar Datos</Button>
      </div>
    </div>
  );
};