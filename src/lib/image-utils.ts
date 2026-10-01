/**
 * Client-side utility to convert and compress any image (JPEG, PNG, HEIC, etc.)
 * into WebP format before uploading to Supabase Storage.
 *
 * Benefits:
 * - Reduces image size by 70-90% (e.g. 5MB photo -> ~150KB WebP)
 * - Saves Supabase Storage space & bandwidth
 * - Faster loading on mobile & desktop CRM
 */
export async function convertToWebP(
  file: File,
  quality = 0.8,
  maxWidth = 1920,
  maxHeight = 1920
): Promise<File> {
  // If not an image, return original file
  if (!file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calculate aspect ratio scaling if dimensions exceed maxWidth/maxHeight
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      // Draw image onto canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Export canvas as image/webp blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          const fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
          const webpFile = new File([blob], fileName, {
            type: "image/webp",
            lastModified: Date.now(),
          });

          resolve(webpFile);
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
