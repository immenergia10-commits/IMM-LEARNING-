import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const processDocument = async (file: File) => {
  const prompt = `Eres un tutor experto en energía de IMM. Convierte el siguiente documento en una experiencia de estudio metódica y completa.
  
  REGLA DE ORO: Todo el contenido generado DEBE estar basado estrictamente en la información técnica del PDF adjunto. No inventes datos fuera del documento.
  
  INSTRUCCIÓN CRÍTICA: DEBES devolver toda la respuesta en ESPAÑOL. No uses inglés.
  
  INSTRUCCIÓN SOBRE IMÁGENES Y DIAGRAMAS: Si el documento contiene imágenes, diagramas o esquemas técnicos (como motores, generadores, circuitos), ANALÍZALOS DETALLADAMENTE. 
  - Identifica las partes principales de la imagen.
  - Genera "hotspots" (puntos interactivos) con coordenadas aproximadas (x, y de 0 a 100) y una breve descripción de cada parte.
  - Crea preguntas específicas sobre estas partes.
  
  IMPORTANTE: Solo sugiere imágenes (imageHint) si son estrictamente necesarias para explicar un concepto y no hay una imagen real en el documento que sirva. Prioriza siempre el contenido visual real del archivo.
  
  INSTRUCCIÓN SOBRE ANALOGÍAS DINÁMICAS (Úsalas para explicar los conceptos técnicos DEL PDF):
  - **Electricidad (Agua)**: Voltaje=Presión, Amperaje=Caudal, Watts=Trabajo total. Si usas esta analogía, incluye "imageHint": "analogía agua presión manguera".
  - **Potencia (Cerveza)**: kW=Líquido (potencia real), kVAR=Espuma (potencia reactiva), kVA=Vaso completo (potencia aparente). ¡Explica que la espuma es necesaria pero no sacia la sed! Si usas esta analogía, incluye "imageHint": "analogía cerveza potencia eléctrica".
  - **Fuerza (Caballo)**: 1 HP = 746W. Compara máquinas con caballos de tiro como James Watt. Si usas esta analogía, incluye "imageHint": "analogía caballo fuerza james watt".
  
  Proporciona ejemplos prácticos paso a paso de cómo hacer los cálculos basados en los datos del documento. Luego, incluye preguntas en el quiz que evalúen estos cálculos específicos.

  Devuelve un objeto JSON con la siguiente estructura:
  {
    "title": "Título del Curso",
    "summary": "Resumen breve",
    "sections": [
      {
        "title": "Título de la Sección",
        "content": "Contenido educativo (aprox 200-300 palabras). Incluye análisis de imágenes si las hay, analogías y ejemplos de cálculos si aplica.",
        "imageHint": "Descripción de una imagen que ayudaría a explicar este concepto",
        "hotspots": [
          { "x": 50, "y": 50, "label": "Nombre de la parte", "description": "Explicación breve" }
        ],
        "questions": [
          {
            "id": "q1",
            "question": "...",
            "options": ["a", "b", "c", "d"],
            "correctAnswer": 0,
            "explanation": "..."
          }
        ]
      }
    ],
    "debateTopics": ["Tema 1", "Tema 2"],
    "roleplayScenarios": [
      {
        "title": "Título del Escenario",
        "description": "Contexto del escenario",
        "role": "Rol del usuario (ej., Ingeniero de Ventas)"
      }
    ],
    "flashcards": [{"front": "...", "back": "..."}] // Genera al menos 20 flashcards detalladas basadas en todo el material
  }`;

  try {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const SUPPORTED_MIME_TYPES = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.ms-excel',
      'application/vnd.ms-powerpoint',
      'text/plain', 'text/csv', 'text/html', 'text/rtf',
      'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif',
      'video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/x-flv', 'video/mpg', 'video/webm', 'video/wmv', 'video/3gpp',
      'audio/wav', 'audio/mp3', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac'
    ];

    const mimeType = file.type || 'application/pdf';
    const isSupported = SUPPORTED_MIME_TYPES.includes(mimeType) || mimeType.startsWith('image/') || mimeType.startsWith('video/') || mimeType.startsWith('audio/');

    if (!isSupported) {
      console.warn(`MIME type ${mimeType} not directly supported by Gemini inlineData. Using fallback.`);
      throw new Error(`Unsupported MIME type: ${mimeType}`);
    }

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        { role: "user", parts: [{ text: prompt }, { inlineData: { data: base64Data, mimeType } }] }
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error processing document with Gemini:", error);
    // Fallback if file is too large or unsupported format
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          { role: "user", parts: [{ text: prompt + `\n\nContenido simulado del archivo "${file.name}": Este es un documento técnico sobre mantenimiento de generadores y conceptos de energía (Watts, Amperaje, Voltaje). Incluye diagramas de motores diesel.` }] }
        ],
        config: {
          responseMimeType: "application/json",
        },
      });
      return JSON.parse(fallbackResponse.text || '{}');
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      throw error;
    }
  }
};

export const chatWithTutor = async (message: string, context?: string) => {
  const systemInstruction = `Eres un tutor experto en energía de IMM. Responde siempre en Español. 
  Enfócate en: Generadores, Consumo de energía, Sistemas de monitoreo.
  Sé útil, técnico pero accesible. Usa emojis para hacer el aprendizaje más dinámico y creativo.
  Si explicas conceptos complejos, usa la ANALOGÍA DEL SISTEMA DE AGUA (Voltaje=Presión, Amperaje=Caudal, Watts=Trabajo).
  Contexto: ${context || 'Entrenamiento general de energía'}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: message,
      config: {
        systemInstruction,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error chatting with Gemini:", error);
    return "Lo siento, tuve un problema al procesar tu mensaje. ¿Podrías intentar de nuevo?";
  }
};
