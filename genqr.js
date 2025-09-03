// genqr.js
const qrcode = require('qrcode');
const qr = "2@TSZRwU4psIt7iCy1PEca/AGK1fRlISrCnFPnfhmZ9HCCzl2Fquu1ayOeB+nMkm5awy+Ifzp4cSXVeJCt+Dfdc+sPNPgw1EevwmY=,QCe/5tyuZieilY3QuFzhF8BFTU07OMus2tfNNcgA9A4=,YKxfDrE7Jc/QF6N+71HmD2BjZQOqQp+i928yix/Aix0=,U4PmotldgjlNBsW7awzCp71SpeiyYLqmoqv/mpSfO5M=,1";

qrcode.toFile('current-qr.png', qr, { width: 400 })
  .then(() => console.log('Saved current-qr.png'))
  .catch(console.error);

// Optionally print a data URL to console so you can paste it in your browser:
qrcode.toDataURL(qr).then(url => console.log('DATA-URL:', url));
