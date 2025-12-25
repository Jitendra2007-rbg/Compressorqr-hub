import express from 'express';
import cors from 'cors';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import ffmpegPath from 'ffmpeg-static';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const execAsync = promisify(exec);

// File storage directory (create if missing)
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Configure multer storage (Local Disk)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Create unique ID: timestamp-random-originalExt
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});
const upload = multer({ storage: storage });

app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve static files from the React build (dist folder)
app.use(express.static(path.join(__dirname, 'dist')));

// Determine yt-dlp path based on environment
const getYtDlpCommand = () => {
    if (process.env.RENDER) return './yt-dlp';
    if (fs.existsSync(path.join(__dirname, 'yt-dlp.exe'))) return path.join(__dirname, 'yt-dlp.exe');
    return 'yt-dlp'; // System fallback
};

// ---- PROBE: get title + formats ----
app.post('/api/probe', async (req, res) => {
    const { url } = req.body;

    if (!url) return res.status(400).json({ error: 'URL required' });

    const ytDlpCmd = getYtDlpCommand();
    const command = [
        ytDlpCmd,
        '--dump-json',
        '--no-warnings',
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        '--referer', url.includes('youtube.com') ? 'https://www.youtube.com' : url,
        url
    ];

    // Using child_process.spawn as requested
    const proc = spawn(command[0], command.slice(1), { cwd: process.cwd() });

    let output = '';
    proc.stdout.on('data', (data) => output += data);
    proc.stderr.on('data', (data) => output += data);

    proc.on('close', (code) => {
        if (code === 0) {
            try {
                const info = JSON.parse(output);
                res.json({
                    title: info.title,
                    thumbnail: info.thumbnail,
                    duration: info.duration,
                    original_url: url,
                    formats: (info.formats || []).slice(0, 20).map(f => ({
                        id: f.format_id,
                        format_id: f.format_id,
                        ext: f.ext,
                        quality: f.height || 'audio',
                        resolution: f.resolution || (f.height ? `${f.height}p` : 'audio only'),
                        size: f.filesize ? `${(f.filesize / 1024 / 1024).toFixed(2)}MB` : (f.filesize_approx ? `~${(f.filesize_approx / 1024 / 1024).toFixed(2)}MB` : 'Stream'),
                        url: f.url,
                        note: f.format_note,
                        is_video_only: f.acodec === 'none' && f.vcodec !== 'none',
                        is_audio_only: f.vcodec === 'none' && f.acodec !== 'none'
                    }))
                });
            } catch (err) {
                console.error('Probe JSON Parse Error:', err);
                res.status(400).json({ error: 'Invalid video data' });
            }
        } else {
            res.status(400).json({ error: 'Private/protected video. Only public links work.' });
        }
    });
});

// ---- STREAM: Download Video or Audio ----
app.get('/api/stream', (req, res) => {
    const { originalUrl, title, type } = req.query; // type: 'video' | 'audio'
    console.log(`[Stream Request] ${title} | ${originalUrl} | Type: ${type}`);

    if (!originalUrl) return res.status(400).json({ error: 'Original URL required' });

    try {
        const ytDlpCmd = getYtDlpCommand();
        const safeTitle = (title || 'download').replace(/[^a-z0-9]/gi, '_');

        let args = [];
        let contentType = '';
        let filename = '';

        if (type === 'audio') {
            args = [
                '--ffmpeg-location', ffmpegPath,
                '-f', 'bestaudio',
                '--extract-audio',
                '--audio-format', 'mp3',
                '--audio-quality', '0',
                '-o', '-',
                '--no-playlist',
                '--no-part',
                originalUrl
            ];
            contentType = 'audio/mpeg';
            filename = `${safeTitle}.mp3`;
        } else {
            args = [
                '--ffmpeg-location', ffmpegPath,
                '-f', 'bestvideo[height<=720]+bestaudio/best[height<=720]',
                '--merge-output-format', 'mp4',
                '-o', '-',
                '--no-playlist',
                '--no-part',
                originalUrl
            ];
            contentType = 'video/mp4';
            filename = `${safeTitle}.mp4`;
        }

        res.header('Content-Type', contentType);
        res.header('Content-Disposition', `attachment; filename="${filename}"`);

        console.log(`[Stream Spawn] ${ytDlpCmd} ${args.join(' ')}`);

        const child = spawn(ytDlpCmd, args);

        child.stdout.pipe(res);

        child.stderr.on('data', (data) => {
            const msg = data.toString();
            // Suppress common ffmpeg/yt-dlp info logs from stderr
            if (!msg.includes('[download]') && !msg.includes('[ExtractAudio]') && !msg.includes('[info]')) {
                console.error(`[yt-dlp stderr] ${msg}`);
            }
        });

        child.on('close', (code) => {
            if (code !== 0) {
                console.error(`[Stream Exit] yt-dlp exited with code ${code}`);
                if (!res.headersSent) res.end();
            } else {
                console.log('[Stream Complete]');
            }
        });

        req.on('close', () => {
            if (child) child.kill();
        });

    } catch (err) {
        console.error('[Stream Setup Error]:', err);
        if (!res.headersSent) res.status(500).json({ error: err.message });
    }
});

// ---- FILE UPLOAD ----
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Construct download URL using backend logic or just return ID
    const downloadUrl = `${req.protocol}://${req.get('host')}/share/${req.file.filename}`;

    res.json({
        id: req.file.filename,
        downloadUrl: downloadUrl
    });
});

// ---- SHARE ROUTE (Smart Fix) ----
app.get('/share/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send(`
      <h1>File Not Found</h1>
      <p>This file has expired or was deleted.</p>
      <a href="/">← Back to CompressorQR</a>
    `);
    }

    const isPreview = req.query.preview === 'true';

    if (isPreview) {
        res.sendFile(filePath);
    } else {
        res.download(filePath, (err) => {
            if (err && !res.headersSent) res.status(404).send('File not found');
        });
    }
});


// Catch-all route to serve the React app
app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
