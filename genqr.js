// genqr.js
const qrcode = require('qrcode');
const qr = "snnK6jGj3aRHfapxIiGgTmHedfDzCOeSkTwF261ejsxtqaB2iwNfOszT25DOjDFgOOs40ChsklToBh/yVnOetbnl+ku4n4Bz598=,aC3jmLWn69UGap4ZoI+SLutW91j69cmm8s6kuL6JIjM=,/hgIF/LyahgdcyHnZ0bwB+voRrgbpmRAbWqd/bTtiks=,665P/9kbCEpNeROVTTu0xpQASJsY0q/QO4w9zuCTQT0=,1";

qrcode.toFile('qr.png', qr, { width: 400 })
  .then(() => console.log('Saved qr.png'))
  .catch(console.error);

// Optionally print a data URL to console so you can paste it in your browser:
qrcode.toDataURL(qr).then(url => console.log('DATA-URL:', url));
