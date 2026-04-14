import * as pdfjsLib from 'pdfjs-dist';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractImagesFromPDF(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images: string[] = [];

  // Limit to first 10 pages to avoid performance issues
  const numPages = Math.min(pdf.numPages, 10);

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const operatorList = await page.getOperatorList();
    
    const validTypes = [
      pdfjsLib.OPS.paintImageXObject,
      pdfjsLib.OPS.paintInlineImageXObject,
    ];

    for (let j = 0; j < operatorList.fnArray.length; j++) {
      if (validTypes.includes(operatorList.fnArray[j])) {
        const imageName = operatorList.argsArray[j][0];
        try {
          let image;
          try {
            image = await page.objs.get(imageName);
          } catch (e) {
            image = await page.commonObjs.get(imageName);
          }
          
          if (image && image.data) {
            // Convert to base64
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const imageData = ctx.createImageData(image.width, image.height);
              imageData.data.set(image.data);
              ctx.putImageData(imageData, 0, 0);
              images.push(canvas.toDataURL('image/jpeg', 0.8));
            }
          }
        } catch (e) {
          console.warn('Failed to extract image:', e);
        }
      }
    }
    
    // If no images found in operators, try rendering the page as an image if it's small/important
    // But for now, just extracting embedded images is what the user likely wants.
  }

  return images;
}
