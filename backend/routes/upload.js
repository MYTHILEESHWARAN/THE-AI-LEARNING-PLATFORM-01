const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// ─── Multer — memory storage (no disk writes) ─────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed.'));
    }
  }
});

// ─── POST /upload-pdf ─────────────────────────────────────────────────────────
router.post('/upload-pdf', verifyToken, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded.' });
    }

    const data = await pdfParse(req.file.buffer);
    const text = data.text.trim();

    if (!text || text.length < 10) {
      return res.status(422).json({ error: 'Could not extract text from this PDF. It may be image-based or protected.' });
    }

    res.json({
      text,
      pages: data.numpages,
      filename: req.file.originalname,
      charCount: text.length
    });
  } catch (err) {
    console.error('[PDF UPLOAD ERROR]', err.message);
    if (err.message.includes('Only PDF')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to process PDF. Please try a different file.' });
  }
});

module.exports = router;
