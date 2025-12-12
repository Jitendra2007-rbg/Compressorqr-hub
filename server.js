import express from 'express';
import cors from 'cors';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
app.post('/api/probe', async (req, res) => {
    const { url } = req.body;
    console.log(`[Probe Request] Processing URL: ${url}`);

    if (!url) return res.status(400).json({ error: 'URL required' });

    try {
        const ytDlpCmd = getYtDlpCommand();
        const command = `"${ytDlpCmd}" --dump-json --flat-playlist "${url}"`;

        const { stdout } = await execAsync(command, { maxBuffer: 1024 * 1024 * 50 });
        const videoInfo = JSON.parse(stdout.split('\n')[0]);
        console.log(`[Probe Success] Title: ${videoInfo.title}`);

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
        const msg = String(err.stderr || err.message || '');
        console.error('[Probe Error]:', msg);

        // ✅ detect login / bot / protected content cases
        if (
            msg.includes('login required') ||
            msg.includes('Sign in to confirm') ||
            msg.includes('sign in required') ||
            msg.includes('requested content is not available') ||
            msg.includes('Private video')
        ) {
            return res.status(403).json({
                error: 'This video/reel is protected (login/age/region/private). Only public links are supported.'
            });
        }

        res.status(500).json({ error: 'Failed to find video info. Please check the link.' });
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

// Catch-all route to serve the React app (Client-side routing support)
// This must be AFTER API routes
// Catch-all route to serve the React app (Client-side routing support)
// This must be AFTER API routes
app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
