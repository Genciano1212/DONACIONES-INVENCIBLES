import { GoogleGenAI } from "@google/genai";
import { AppData } from "../types";

// En una aplicación de producción real, esta clave vendría de un proxy backend seguro o process.env.
// Para este output generado, asumimos que process.env.API_KEY está disponible según las instrucciones.
const API_KEY = process.env.API_KEY || ''; 

export const analyzePerformance = async (data: AppData): Promise<string> => {
  if (!API_KEY) {
    return "Falta la API Key. Por favor configura process.env.API_KEY.";
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // Preparar una representación resumida de los datos
  const playerSummaries = Object.values(data.players)
    .filter(p => !p.absent)
    .map(p => {
        const goal = data.goalDaily * 7;
        const percent = (p.weeklyTotal / goal * 100).toFixed(1);
        return `- ${p.name}: Donó ${p.weeklyTotal} (${percent}% de la meta). Reserva Acumulada: ${p.accumulatedExcess}. Total Histórico: ${p.total}.`;
    }).join('\n');

  const prompt = `
    Analiza los siguientes datos de donaciones para un clan del juego 'Pocket Ants'.
    La meta semanal por jugador es de ${data.goalDaily * 7} recursos.
    
    Datos:
    ${playerSummaries}
    
    Por favor, proporciona un informe conciso en formato Markdown en ESPAÑOL:
    1. Identifica los Top 3 MVP (Jugadores Más Valiosos) basados en el rendimiento semanal.
    2. Enumera a los jugadores que están en riesgo (por debajo del 70% de la meta semanal).
    3. Proporciona un resumen breve y alentador para el líder del clan.
    4. Mantén un tono profesional pero divertido, usando metáforas relacionadas con hormigas/insectos cuando sea apropiado.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Error de Gemini API:", error);
    return "Ocurrió un error al comunicarse con la IA. Por favor verifica tu API key y tu conexión.";
  }
};

export const extractDonationDataFromImage = async (base64Image: string): Promise<Record<string, number> | null> => {
  if (!API_KEY) {
    console.error("Falta API Key");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  const base64Data = base64Image.split(',')[1] || base64Image;

  const prompt = `
    Analiza esta captura de pantalla de una lista de donaciones del juego "Pocket Ants".
    Extrae SOLO los nombres de los jugadores y sus cantidades de donación numérica visibles.
    
    Reglas:
    1. Ignora encabezados como "Nombre", "Donación", "Rango".
    2. Si hay sufijos como 'k' o 'm', conviértelos a números completos (ej: 25k -> 25000).
    3. Devuelve la respuesta EXCLUSIVAMENTE en formato JSON válido: {"Jugador1": 1234, "Jugador2": 5678}.
    4. No incluyas markdown, solo el JSON crudo.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Flash es excelente para visión y velocidad
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Error OCR Gemini:", error);
    return null;
  }
};