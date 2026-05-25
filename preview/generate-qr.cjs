/**
 * Génère le QR code MBOA en PNG et SVG dans /preview.
 * URL cible : serveur Vite local exposé sur le LAN.
 */
const QRCode = require('qrcode');
const fs = require('node:fs');
const path = require('node:path');

const URL_TARGET = process.argv[2] || 'http://192.168.33.107:5173/';
const OUT_DIR = path.resolve(__dirname);

const options = {
  width: 480,
  margin: 2,
  errorCorrectionLevel: 'H',
  color: { dark: '#1E3A8A', light: '#FFFFFF' },
};

(async () => {
  try {
    await QRCode.toFile(path.join(OUT_DIR, 'qr.png'), URL_TARGET, options);
    const svgString = await QRCode.toString(URL_TARGET, { ...options, type: 'svg' });
    fs.writeFileSync(path.join(OUT_DIR, 'qr.svg'), svgString, 'utf8');
    console.log('OK · qr.png + qr.svg generes pour ' + URL_TARGET);
  } catch (err) {
    console.error('ERREUR :', err.message);
    process.exit(1);
  }
})();
