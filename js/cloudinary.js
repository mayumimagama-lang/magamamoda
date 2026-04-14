// ============================================================
// CLOUDINARY — Subida y compresión de imágenes
// ============================================================

const CLOUDINARY_CLOUD = 'dwlymmnsh';        // ← tu cloud name
const CLOUDINARY_PRESET = 'magama_productos'; // ← lo crearemos ahora

const CloudinaryUpload = {

  // Subir imagen y devolver URL
  async subir(file, carpeta) {
    try {
      // Comprimir imagen antes de subir
      const comprimida = await this.comprimir(file, 800, 0.75);
      
      const formData = new FormData();
      formData.append('file', comprimida);
      formData.append('upload_preset', CLOUDINARY_PRESET);
      formData.append('folder', 'magama/' + (carpeta || 'productos'));

      const res = await fetch(
        'https://api.cloudinary.com/v1_1/' + CLOUDINARY_CLOUD + '/image/upload',
        { method: 'POST', body: formData }
      );
      const data = await res.json();

      if (data.secure_url) {
        console.log('✅ Imagen subida a Cloudinary:', data.secure_url);
        return { ok: true, url: data.secure_url, public_id: data.public_id };
      }
      console.warn('⚠️ Error Cloudinary:', data.error);
      return { ok: false };
    } catch(e) {
      console.warn('⚠️ Error subiendo imagen:', e);
      return { ok: false };
    }
  },

  // Comprimir imagen antes de subir
  comprimir(file, maxWidth, calidad) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > maxWidth) { h = h * maxWidth / w; w = maxWidth; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          canvas.toBlob(resolve, 'image/jpeg', calidad);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
};
