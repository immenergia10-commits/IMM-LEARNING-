import * as pdfjsLib from 'pdfjs-dist';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export async function extractImagesFromPDF(file: File): Promise<string[]> {
  const images: string[] = [];
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Render the first 3 pages as images instead of digging into complex internal PDF image objects
    // This provides excellent contextual thumbnails for Gemini without crashing on color spaces.
    const numPages = Math.min(pdf.numPages, 3);

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
        
        images.push(canvas.toDataURL('image/jpeg', 0.8));
    }
  } catch (err) {
    console.warn("PDF render extraction issue:", err);
  }

  return images;
}
