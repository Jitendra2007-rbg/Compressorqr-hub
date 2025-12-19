import express from 'express';
import cors from 'cors';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import stream from 'stream';

const execAsync = promisify(exec);
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists (keeping this just in case, though mostly unused now)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Old multer disk storage removed in favor of memory storage for Supabase
app.use(cors({ origin: '*' }));

app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve static files from the React build (dist folder)
app.use(express.static(path.join(__dirname, 'dist')));

// Determine yt-dlp path based on environment
const getYtDlpCommand = () => {
    if (process.env.RENDER) return './yt-dlp';
    if (fs.existsSync(path.join(__dirname, 'yt-dlp.exe'))) return path.join(__dirname, 'yt-dlp.exe');
    return 'yt-dlp';
};

// ---- PROBE: get title + formats ----
// Configure Supabase (Hardcoded credentials from utils/supabaseClient.ts for consistency)
import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://rsgjfcojabqkohonxyky.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzZ2pmY29qYWJxa29ob254eWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MTYwMzEsImV4cCI6MjA4MTA5MjAzMX0.IzuxoVNOR61laITvOuOBPpsAqWC6ZdnUQX3thSZ5AdE';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Handle Instagram Fallback (Direct extraction for Reels)
async function handleInstagramFallback(url, res) {
    try {
        console.log('[Instagram Fallback] Attempting direct extraction...');
        const ytDlpCmd = getYtDlpCommand();
        // Use best quality matching video+audio
        const command = `"${ytDlpCmd}" --dump-json --no-warnings "${url}"`;

        const { stdout } = await execAsync(command, { maxBuffer: 1024 * 1024 * 50 });
        const videoInfo = JSON.parse(stdout);

        console.log(`[Instagram Fallback] Success: ${videoInfo.title}`);

        return res.json({
            title: videoInfo.title || 'Instagram Reel',
            thumbnail: videoInfo.thumbnail,
            duration: videoInfo.duration,
            original_url: url,
            formats: [{
                format_id: 'best',
                ext: 'mp4',
                resolution: 'High Quality',
                size: 'Stream',
                note: 'Direct Stream',
                is_video_only: false,
                is_audio_only: false
            }]
        });
    } catch (err) {
        console.error('[Instagram Fallback] Failed:', err.message);
        return res.status(500).json({ error: 'Failed to extract Instagram Reel. Make sure it is public.' });
    }
}

// ---- PROBE: get title + formats ----
app.post('/api/probe', async (req, res) => {
    const { url } = req.body;
    console.log(`[Probe Request] Processing URL: ${url}`);

    if (!url) return res.status(400).json({ error: 'URL required' });

    try {
        const ytDlpCmd = getYtDlpCommand();

        // Fallback for Instagram Reels (direct extraction)
        if (url.includes('instagram.com/reel')) {
            return handleInstagramFallback(url, res);
        }

        // yt-dlp with production flags
        const command = [
            ytDlpCmd,
            '--dump-json',
            '--no-warnings',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            '--referer', url,
            '--cookies-from-browser', 'chrome',  // fallback if cookies.txt exists
            url
        ];

        // Using spawn for better argument handling than exec
        const child = spawn(command[0], command.slice(1));

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => stdout += data);
        child.stderr.on('data', (data) => stderr += data);

        child.on('close', (code) => {
            if (code !== 0) {
                console.error('yt-dlp stderr:', stderr);

                const loginPhrases = [
                    'Sign in to confirm you’re not a bot',
                    'sign in required',
                    'login required',
                    'private video',
                    'this video is private'
                ];

                const isProtected = loginPhrases.some(p => stderr.toLowerCase().includes(p.toLowerCase()));

                if (isProtected) {
                    return res.status(403).json({
                        error: 'This video is protected (private/login required). Only public links supported.'
                    });
                }

                return res.status(500).json({ error: 'Failed to fetch video info.' });
            }

            try {
                const videoInfo = JSON.parse(stdout);

                const formats = (videoInfo.formats || [])
                    .filter(f => f.vcodec !== 'none' || f.acodec !== 'none')
                    .sort((a, b) => (b.filesize || 0) - (a.filesize || 0))
                    .slice(0, 20)
                    .map(f => ({
                        format_id: f.format_id,
                        ext: f.ext,
                        resolution: f.resolution || (f.height ? `${f.height}p` : 'audio only'),
                        size: f.filesize ? `${(f.filesize / 1024 / 1024).toFixed(2)}MB` : 'Stream',
                        note: f.format_note,
                        is_video_only: f.acodec === 'none' && f.vcodec !== 'none',
                        is_audio_only: f.vcodec === 'none' && f.acodec !== 'none'
                    }));

                res.json({
                    title: videoInfo.title,
                    thumbnail: videoInfo.thumbnail,
                    duration: videoInfo.duration,
                    original_url: url,
                    formats
                });
            } catch (err) {
                console.error('JSON Parse Error:', err);
                res.status(500).json({ error: 'Failed to pars video metadata.' });
            }
        });

    } catch (err) {
        console.error('Probe Error:', err);
        res.status(500).json({ error: 'Internal server error during probe.' });
    }
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
            if (!msg.includes('[download]') && !msg.includes('[ExtractAudio]')) {
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

// ---- FILE UPLOAD & SHARE ----
// Use memory storage for Supabase upload
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(req.file.originalname);

        // Upload to Supabase
        const { data, error } = await supabase.storage
            .from('user-files')
            .upload(uniqueId, req.file.buffer, {
                contentType: req.file.mimetype
            });

        if (error) throw error;

        // Construct download URL
        // const downloadUrl = `${req.protocol}://${req.get('host')}/share/${uniqueId}`;
        const downloadUrl = `https://compressorqr-hub.onrender.com/share/${uniqueId}`;

        res.json({
            id: uniqueId,
            downloadUrl: downloadUrl
        });
    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

app.get('/share/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Method 1: Supabase Storage (recommended)
        const { data, error } = await supabase.storage
            .from('user-files')  // your bucket name
            .download(`${id}`);  // filename = id

        if (error || !data) {
            return res.status(404).send('File not found');
        }

        // Set headers for download
        res.set({
            'Content-Type': data.type || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${id}"`,
            'Cache-Control': 'public, max-age=3600'
        });

        // Stream file - data is a Blob/File object from Supabase JS client
        // Need to convert to Node stream
        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const readStream = new stream.PassThrough();
        readStream.end(buffer);
        readStream.pipe(res);

    } catch (err) {
        console.error('Share Error:', err);
        res.status(404).send('File not found or expired');
    }
});

// Catch-all route to serve the React app (Client-side routing support)
// This must be AFTER API routes
// Catch-all route to serve the React app (Client-side routing support)
// This must be AFTER API routes
app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
