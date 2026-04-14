const CLOUDINARY_CLOUD = 'dwiymmnsh';
const CLOUDINARY_PRESET = 'magama';

const CloudinaryUpload = {
  async subir(file, carpeta) {
    try {
      const comprimida = await this.comprimir(file, 800, 0.75);
      const formData = new FormData();
      formData.append('file', comprimida);
      formData.append('upload_preset', CLOUDINARY_PRESET);
      const res = await fetch(
        'https://api.cloudinary.com/v1_1/' + CLOUDINARY_CLOUD + '/image/upload',
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      if (data.secure_url) {
        console.log('✅ Imagen subida:', data.secure_url);
        return { ok: true, url: data.secure_url };
      }
      console.warn('❌ Error:', data);
      return { ok: false };
    } catch(e) {
      return { ok: false };
    }
  },

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
