// genqr.js
const qrcode = require('qrcode');
const qr = "2@dkmST6sPbOagANLdmHPaMTTWwO8r9m35HvbaC1AVoDejWW/pDWD9diX1mfV7UK5HZpaFCP6PGm8cVh9OtLRhUybsTgmeRVE/gKY=,7MdepMX77ByhBotMwCQ/u8cNRZw+rPacZ5E6tC6HHlQ=,Mz7yU9OFnkKIqNN5WG9C7J6SoWObisT9u0o33mPnJx4=,ZA5MyvwPeMGJjcPH09VIaNTB4V7pb64fhgwj6NJDAfo=,1";

qrcode.toFile('qr.png', qr, { width: 400 })
  .then(() => console.log('Saved qr.png'))
  .catch(console.error);

// Optionally print a data URL to console so you can paste it in your browser:
qrcode.toDataURL(qr).then(url => console.log('DATA-URL:', url));
