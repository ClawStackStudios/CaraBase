import express from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import crypto from 'crypto';
import db from '../db.js';
import { authenticateDataApi, publicApiGuard } from '../middleware/dataAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { requireAuth } from '../middleware/auth.js';

const storageDir = path.join(process.cwd(), 'data', 'storage');
const shareRateLimitMap = new Map<string, { count: number; resetTime: number }>();

const storageOptions = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, storageDir) },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});
const upload = multer({ storage: storageOptions });

const router = express.Router();

// --- Public Access Membrane (ShellProxy) ---
router.get('/v1/file/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM _carabase_storage WHERE id = ?').get(req.params.id) as any;
    if (!row) return res.status(404).json({ error: 'File not found' });
    const filePath = path.join(storageDir, row.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File physically missing' });
    res.setHeader('Content-Type', row.mime_type);
    res.sendFile(filePath);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/v1/share/:share_hash', (req, res) => {
  const { share_hash } = req.params;
  if (!share_hash || !/^[a-f0-9]{64}$/i.test(share_hash)) {
    return res.status(404).end();
  }

  try {
    const row = db.prepare(`
       SELECT s.*, file.filename, file.original_name, file.mime_type, file.size
       FROM _carabase_storage_shares s
       JOIN _carabase_storage file ON s.storage_id = file.id
       WHERE s.share_hash = ?
         AND (s.expires_at IS NULL OR s.expires_at > datetime('now'))
    `).get(share_hash) as any;

    if (!row) return res.status(404).end();

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const rateLimitKey = `${ip}_${share_hash}`;
    const now = Date.now();
    let record = shareRateLimitMap.get(rateLimitKey);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + 60000 };
    }
    if (record.count >= 100) {
      return res.status(429).end();
    }
    record.count++;
    shareRateLimitMap.set(rateLimitKey, record);

    db.prepare(`UPDATE _carabase_storage_shares SET access_count = access_count + 1 WHERE id = ?`).run(row.id);

    const filePath = path.join(storageDir, row.filename);
    if (!fs.existsSync(filePath)) return res.status(404).end();

    const isBrowser = req.headers.accept?.includes('text/html');

    if (isBrowser) {
      const isImage = row.mime_type.startsWith('image/');
      const isVideo = row.mime_type.startsWith('video/');

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CaraBase Share | ${row.original_name}</title>
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
<div class="max-w-4xl w-full bg-slate-900 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-800 overflow-hidden flex flex-col items-center">
 <div class="w-full p-4 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
   <div class="flex items-center gap-3 overflow-hidden pr-4">
     <svg class="w-6 h-6 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
     <div class="text-slate-300 font-mono text-sm truncate">${row.original_name}</div>
   </div>
   <a href="/storage/v1/share/${share_hash}" download="${row.original_name}" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 shrink-0 flex items-center gap-2">
     <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
     <span class="hidden sm:inline">Download</span>
   </a>
 </div>
 <div class="p-4 sm:p-10 w-full flex justify-center items-center bg-slate-950/50 min-h-[400px]">
   ${isImage ? `<img src="/storage/v1/share/${share_hash}" alt="${row.original_name}" class="max-w-full max-h-[65vh] rounded-xl shadow-2xl object-contain border border-slate-800">` :
     isVideo ? `<video controls src="/storage/v1/share/${share_hash}" class="max-w-full max-h-[65vh] rounded-xl shadow-2xl border border-slate-800"></video>` :
     `<div class="text-slate-500 text-center"><svg class="w-20 h-20 mx-auto mb-6 opacity-30 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg><p class="text-2xl font-medium text-slate-300 mb-2">No Preview Available</p><p class="text-sm font-mono text-slate-500">${(row.size / 1024 / 1024).toFixed(2)} MB • ${row.mime_type}</p></div>`
   }
 </div>
 <div class="w-full text-center py-5 border-t border-slate-800 text-slate-600 text-xs tracking-[0.2em] uppercase font-bold bg-slate-900">
   CaraBase <span class="opacity-50 font-normal">Proxy Membrane</span>
 </div>
</div>
</body>
</html>`;
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } else {
      res.setHeader('Content-Type', row.mime_type);
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      res.sendFile(filePath);
    }
  } catch (e: any) {
    console.error('[ShellProxy] Error fetching share:', e);
    res.status(404).end();
  }
});

// --- Data API Storage (SDK/Public) ---
router.post('/v1/upload', publicApiGuard, authenticateDataApi, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const id = uuidv4();
  try {
    db.prepare('INSERT INTO _carabase_storage (id, original_name, filename, mime_type, size) VALUES (?, ?, ?, ?, ?)').run(id, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size);
    res.json({ success: true, id, filename: req.file.filename });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- System API: Internal dashboard management ---
const systemRouter = express.Router();
systemRouter.use(requireAuth);

systemRouter.get('/', requireRole('admin'), (req, res) => {
  try {
    const files = db.prepare('SELECT * FROM _carabase_storage ORDER BY created_at DESC').all();
    res.json(files);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

systemRouter.post('/upload', requireRole('admin'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const id = uuidv4();
  try {
    db.prepare('INSERT INTO _carabase_storage (id, original_name, filename, mime_type, size) VALUES (?, ?, ?, ?, ?)').run(id, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size);
    res.json({ success: true, id, filename: req.file.filename });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

systemRouter.delete('/:id', requireRole('admin'), (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM _carabase_storage WHERE id = ?').get(req.params.id) as any;
    if (row) {
      const filePath = path.join(storageDir, row.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      db.prepare('DELETE FROM _carabase_storage WHERE id = ?').run(req.params.id);
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

systemRouter.get('/shares', requireRole('admin'), (req, res) => {
  try {
    const shares = db.prepare(`
       SELECT s.id, s.storage_id, s.share_hash, s.created_at, s.expires_at, s.access_count,
              file.original_name, file.mime_type, file.size
       FROM _carabase_storage_shares s
       JOIN _carabase_storage file ON s.storage_id = file.id
       ORDER BY s.created_at DESC
    `).all();
    res.json(shares);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

systemRouter.post('/:id/shares', requireRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { expires_at } = req.body;

    const file = db.prepare('SELECT id FROM _carabase_storage WHERE id = ?').get(id);
    if (!file) return res.status(404).json({ error: 'Storage asset not found' });

    const share_id = uuidv4();
    const share_hash = crypto.randomBytes(32).toString('hex');

    db.prepare('INSERT INTO _carabase_storage_shares (id, storage_id, share_hash, expires_at) VALUES (?, ?, ?, ?)').run(share_id, id, share_hash, expires_at || null);

    res.json({ success: true, share_hash, expires_at });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

systemRouter.delete('/shares/:hash', requireRole('admin'), (req, res) => {
  try {
    db.prepare('DELETE FROM _carabase_storage_shares WHERE share_hash = ?').run(req.params.hash);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export { router as storageRouter, systemRouter as storageSystemRouter };
