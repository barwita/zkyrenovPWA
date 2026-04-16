// ============================================================
//  ZKY RENOV — Backend Node.js (Nodemailer)
//  Envoie le PDF en pièce jointe par email, GRATUITEMENT
// ============================================================

const express = require('express');
const { createTransport } = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// CONFIGURATION EMAIL — À remplir avec vos informations
// ============================================================
// Option A : Gmail (recommandé pour démarrer)
//   → Activez l'authentification 2FA sur votre compte Gmail
//   → Créez un "Mot de passe d'application" sur myaccount.google.com
//     Sécurité > Connexion à Google > Mots de passe des applications
//   → Collez ce mot de passe de 16 caractères dans EMAIL_PASS
//
// Option B : Autre service SMTP (OVH, Infomaniak, Zoho…)
//   → Changez host, port, secure selon votre fournisseur
// ============================================================
const EMAIL_CONFIG = {
  host: 'smtp.gmail.com',          // Serveur SMTP
  port: 465,                       // 465 (SSL) ou 587 (TLS)
  secure: true,                    // true pour port 465, false pour 587
  auth: {
    user: process.env.EMAIL_USER || 'votre.email@gmail.com',
    pass: process.env.EMAIL_PASS || 'votre_mot_de_passe_application'
  }
};

// Adresse qui REÇOIT les emails (peut être la même que EMAIL_USER)
const DEST_EMAIL = process.env.DEST_EMAIL || 'votre.email@gmail.com';

// ============================================================
// Middleware
// ============================================================
app.use(cors({
  origin: '*', // En production, remplacez par votre domaine exact
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '10mb' })); // Le PDF peut être volumineux

// ============================================================
// Route : envoi email avec pièce jointe PDF
// ============================================================
app.post('/send-email', async (req, res) => {
  const { subject, message, pdfBase64, filename } = req.body;

  // Validation basique
  if (!subject || !pdfBase64 || !filename) {
    return res.status(400).json({ success: false, error: 'Données manquantes' });
  }

  // Extraction du contenu base64 pur (sans le préfixe "data:application/pdf;base64,")
  const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');

  // Création du transporteur Nodemailer
const transporter = createTransport(EMAIL_CONFIG);

  const mailOptions = {
    from: `"ZKY RENOV" <${EMAIL_CONFIG.auth.user}>`,
    to: DEST_EMAIL,
    subject: subject,
    text: message || `Bonjour,\n\nVeuillez trouver ci-joint : ${subject}\n\nCordialement,\nZKY RENOV`,
    html: `<p>${(message || '').replace(/\n/g, '<br>')}</p>`,
    attachments: [
      {
        filename: filename,
        content: base64Data,
        encoding: 'base64',
        contentType: 'application/pdf'
      }
    ]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[OK] Email envoyé : ${info.messageId}`);
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('[ERREUR] Envoi email :', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route de santé (utile pour Render / Railway)
app.get('/', (req, res) => {
  res.json({ status: 'ZKY RENOV API — OK' });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
