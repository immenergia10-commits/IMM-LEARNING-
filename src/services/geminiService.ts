import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const processDocument = async (file: File) => {
  const prompt = `Eres un tutor experto en energía de IMM. Convierte el siguiente documento en una experiencia de estudio gamificada.
  
  REGLA DE ORO: Todo el contenido generado DEBE estar basado estrictamente en la información técnica del PDF adjunto. No inventes datos fuera del documento.
  
  INSTRUCCIÓN CRÍTICA: DEBES devolver toda la respuesta en ESPAÑOL. No uses inglés.
  
  INSTRUCCIÓN SOBRE IMÁGENES Y DIAGRAMAS: Analiza las imágenes del documento y genera "hotspots" interactivos (x, y de 0 a 100 y etiqueta).
  Solo sugiere "imageHint" si no hay imágenes reales y la analogía lo requiere.
  
  INSTRUCCIÓN SOBRE MICRO-DESAFÍOS: Diseña preguntas de opción múltiple que actúen como micro-desafíos (easy, medium, hard). Haz preguntas capciosas o de deducción rápida. SIEMPRE incluye una explicación ("explanation") que sea UNA SOLA ORACIÓN FIRME DIRECTA para dar feedback instantáneo al estilo Evaluador Senior y corrige el concepto inmediatamente.
  ADEMÁS: Cada sección DEBE INCLUIR AL MENOS UNA O DOS PREGUNTAS DE VERDADERO/FALSO al final de la lista de preguntas. Sus opciones deben ser estrictamente ["Verdadero", "Falso"]. La "explanation" debe corregir el concepto si es falso o reforzar detalladamente si es verdadero.

  INSTRUCCIÓN SOBRE DURACIÓN: Cada módulo/sección debe ser extenso y profundo. El contenido debe tomar entre 20 y 25 minutos de estudio. Al finalizar la lectura de la sección, añade una sugerencia de "Tomar 5 minutos de descanso" en el texto si es una sección densa.

  ANALOGÍAS DINÁMICAS (Usa solo si aplica):
  - Voltaje=Presión, Amperaje=Caudal (Agua)
  - kW=Líquido, kVAR=Espuma (Cerveza)
  - 1 HP = Caballo de fuerza
  
  Devuelve un objeto JSON con la siguiente estructura exacta:
  {
    "title": "Título del Curso",
    "summary": "Resumen breve",
    "sections": [
      {
        "title": "Título de la Sección",
        "content": "Contenido educativo, análisis visual.",
        "imageHint": "Descripción opcional de imagen (solo si no hay imagen en el documento)",
        "hotspots": [{ "x": 50, "y": 50, "label": "Parte", "description": "Detalle de los elementos de texto e imagen" }],
        "questions": [
          {
            "id": "q1",
            "question": "¿Pregunta técnica?",
            "options": ["A", "B", "C", "D"],
            "correctAnswer": 0,
            "explanation": "Una sola oración firme y al grano corrigiendo el concepto. E.g. 'Un error en la fase te costará un equipo fundido, el voltaje es fundamental.'",
            "difficulty": "easy"
          },
          {
            "id": "q2",
            "question": "El voltaje se mide en amperios.",
            "options": ["Verdadero", "Falso"],
            "correctAnswer": 1,
            "explanation": "Falso. El voltaje se mide en voltios, el amperaje mide la corriente.",
            "difficulty": "easy"
          }
        ]
      }
    ],
    "debateTopics": ["Tema 1"],
    "roleplayScenarios": [{"title": "Escenario", "description": "Contexto", "role": "Técnico"}]
  }`;

  try {
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB inline limit
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('FILE_TOO_LARGE');
    }

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
      'text/plain', 'text/csv', 'text/html', 'text/rtf',
      'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif',
      'video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/x-flv', 'video/mpg', 'video/webm', 'video/wmv', 'video/3gpp',
      'audio/wav', 'audio/mp3', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac'
    ];

    const mimeType = file.type || 'application/pdf';
    const isSupported = !!mimeType && (SUPPORTED_MIME_TYPES.includes(mimeType) || mimeType.startsWith('image/') || mimeType.startsWith('video/') || mimeType.startsWith('audio/'));

    if (!isSupported) {
      console.warn(`MIME type ${mimeType} not directly supported by Gemini inlineData. Using fallback simulation for file: ${file.name}`);
      throw new Error(`Unsupported MIME type: ${mimeType}`);
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        { role: "user", parts: [{ text: prompt }, { inlineData: { data: base64Data, mimeType } }] }
      ],
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      },
    });

    const cleanResult = (response.text || '{}').replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanResult);
  } catch (error: any) {
    console.error("Error processing document with Gemini:", error);
    const isTooLarge = error.message === 'FILE_TOO_LARGE';
    
    // Fallback if file is too large or unsupported format
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: [
          { role: "user", parts: [{ text: prompt + `\n\nContexto del archivo "${file.name}": ${isTooLarge ? 'El archivo original excede el tamaño máximo (15MB) para un escaneo profundo en la memoria.' : 'Formato técnico o ilegible.'} Por lo tanto, debes generar un curso MUY profesional, genérico pero útil, asumiendo conceptos base de Maquinaria y Energía que un técnico revisaría al abrir el documento llamado: ${file.name}. Extrae el contexto del título.` }] }
        ],
        config: {
          responseMimeType: "application/json"
        },
      });
      
      const cleanFallbackResult = (fallbackResponse.text || '{}').replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanFallbackResult);
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      throw error;
    }
  }
};

export const chatWithTutor = async (
  message: string, 
  context?: string,
  attachment?: { data: string; mimeType: string }
) => {
  const systemInstruction = `Eres un Tutor e Investigador (CPU-IMM). Responde siempre en Español. 
  PERSONALIDAD: Eres un "Evaluador Senior Firme". Eres estricto y directo. Si el usuario comete errores básicos, adopta un tono firme, recordándole inmediatamente las graves implicaciones en seguridad industrial y eficiencia que ese error tendría en el campo real. No seas condescendiente ni excesivamente amable; provee explicaciones claras pero con rigor técnico incuestionable.
  Enfócate en: Generadores, Consumo de energía, Sistemas de monitoreo, Maquinaria, Normativas.
  Usa la ANALOGÍA DEL SISTEMA DE AGUA (Voltaje=Presión, Amperaje=Caudal, Watts=Trabajo) si es útil para que entiendan la gravedad de un fallo.
  Contexto actual: ${context || 'Evaluación técnica de campo'}`;

  try {
    let contents: any = message;
    // For attachments and complex queries (images), we route to pro with HIGH thinking
    let selectedModel = "gemini-3.1-flash-lite-preview";
    let config: any = { systemInstruction };
    
    if (attachment) {
      selectedModel = "gemini-3.1-pro-preview";
      config = { 
        systemInstruction, 
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } 
      };
      
      contents = [
        {
          role: "user",
          parts: [
            { text: message || "Analiza el archivo adjunto." },
            { inlineData: { data: attachment.data, mimeType: attachment.mimeType } }
          ]
        }
      ];
    } else {
      // Basic text queries: low latency
      selectedModel = "gemini-3.1-flash-lite-preview";
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config,
    });

    return response.text;
  } catch (error) {
    console.error("Error chatting with Gemini:", error);
    return "Lo siento, tuve un problema al procesar tu mensaje. ¿Podrías intentar de nuevo?";
  }
};
