const express = require('express');
const { createTransport } = require('nodemailer');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage() }); // stocke en RAM

const EMAIL_CONFIG = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
};

const DEST_EMAIL = process.env.DEST_EMAIL;

app.use(cors());
app.use(express.static(path.join(__dirname)));

// Route email — reçoit le PDF comme fichier multipart
app.post('/send-email', upload.single('pdf'), async (req, res) => {
  const { subject, message, filename } = req.body;
  const pdfBuffer = req.file?.buffer;

  if (!subject || !pdfBuffer || !filename) {
    return res.status(400).json({ success: false, error: 'Données manquantes' });
  }

  const transporter = createTransport(EMAIL_CONFIG);

  const mailOptions = {
    from: `"ZKY RENOV" <${EMAIL_CONFIG.auth.user}>`,
    to: DEST_EMAIL,
    subject: subject,
    text: message,
    attachments: [{
      filename: filename,
      content: pdfBuffer,        // buffer direct, pas de base64
      contentType: 'application/pdf'
    }]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré → http://localhost:${PORT}`);
});
