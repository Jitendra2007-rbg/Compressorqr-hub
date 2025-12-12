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

// Ensure yt-dlp binary exists (robust check)
const ytDlpBinaryPath = path.join(__dirname, 'yt-dlp'); // or 'yt-dlp.exe' on windows usually found by exec/spawn if in path
// For this robust implementation, we assume yt-dlp is in PATH or current dir.
// We will try to use the local one if exists, otherwise global 'yt-dlp'.
const getYtDlpCommand = () => {
    if (fs.existsSync(path.join(__dirname, 'yt-dlp.exe'))) return path.join(__dirname, 'yt-dlp.exe');
    if (fs.existsSync(path.join(__dirname, 'yt-dlp'))) return path.join(__dirname, 'yt-dlp');
    return 'yt-dlp';
};

app.post('/api/probe', async (req, res) => {
    const { url } = req.body;
    console.log(`[Probe Request] Processing URL: ${url}`);

    if (!url) return res.status(400).json({ error: 'URL required' });

    try {
        const ytDlpCmd = getYtDlpCommand();
        const command = `"${ytDlpCmd}" --dump-json --flat-playlist "${url}"`;

        // Increase buffer for large JSON outputs
        const { stdout } = await execAsync(command, { maxBuffer: 1024 * 1024 * 50 });

        const videoInfo = JSON.parse(stdout.split('\n')[0]);
        console.log(`[Probe Success] Title: ${videoInfo.title}`);

        // Prepare formats
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
            original_url: url, // Crucial for calling /api/stream
            formats
        });
    } catch (err) {
        console.error('[Probe Error]:', err);
        res.status(500).json({ error: err.message || 'Failed to probe video' });
    }
});

app.get('/api/stream', (req, res) => {
    const { originalUrl, title, ext, format_id } = req.query;
    console.log(`[Stream Request] ${title} | ${originalUrl}`);

    if (!originalUrl) return res.status(400).json({ error: 'Original URL required' });

    try {
        // We use spawn to pipe output DIRECTLY to response (Stream).
        // This avoids buffering 100MB+ in memory and avoids "Content-Length" invalid errors.
        const ytDlpCmd = getYtDlpCommand();

        // Args for streaming
        // -o - : output to stdout
        // -f : format
        // --no-part : do not use .part files (not relevant for stdout but good practice)
        const args = [
            '-o', '-',
            '--no-playlist',
            '--no-part', // Write directly
            originalUrl
        ];

        if (format_id) {
            args.unshift(format_id); // value for -f
            args.unshift('-f');
        } else {
            args.unshift('best');
            args.unshift('-f');
        }

        res.header('Content-Disposition', `attachment; filename="${(title || 'video').replace(/[^a-z0-9]/gi, '_')}.${ext || 'mp4'}"`);
        // We do NOT set Content-Length because we are streaming live from another process's stdout
        // and we don't know the final size if ffmpeg merges things, or if it's chunked.

        console.log(`[Stream Spawn] ${ytDlpCmd} ${args.join(' ')}`);

        const child = spawn(ytDlpCmd, args);

        child.stdout.pipe(res);

        child.stderr.on('data', (data) => {
            // Log stderr but don't fail immediately, yt-dlp prints progress to stderr
            const msg = data.toString();
            // Ignore progress bars
            if (!msg.includes('[download]')) {
                console.error(`[yt-dlp stderr] ${msg}`);
            }
        });

        child.on('close', (code) => {
            if (code !== 0) {
                console.error(`[Stream Exit] yt-dlp exited with code ${code}`);
                if (!res.headersSent) res.status(500).send('Stream failed');
            } else {
                console.log('[Stream Complete]');
            }
        });

        // Cleanup if client disconnects
        req.on('close', () => {
            if (child) child.kill();
        });

    } catch (err) {
        console.error('[Stream Setup Error]:', err);
        if (!res.headersSent) res.status(500).json({ error: err.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
