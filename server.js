import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YTDlpWrap from 'yt-dlp-wrap';

// In some ESM transpilation cases, default might be double wrapped or not.
// But usually 'import YTDlpWrap from ...' works for default exports in ESM.
// If it fails, we can check the type.


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ensure yt-dlp binary exists
const ytDlpBinaryPath = path.join(__dirname, 'yt-dlp');
const ytDlpWrap = new YTDlpWrap();

// Function to download yt-dlp if not present
const ensureYtDlp = async () => {
    // Check for both unix and windows style binary names just in case
    if (!fs.existsSync(ytDlpBinaryPath) && !fs.existsSync(ytDlpBinaryPath + '.exe')) {
        console.log('Downloading yt-dlp binary...');
        await ytDlpWrap.downloadBinary(ytDlpBinaryPath);
        console.log('Downloaded yt-dlp binary');
    }
};

// Probe endpoint
app.post('/api/probe', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        await ensureYtDlp();
        console.log(`Probing URL: ${url}`);

        // exec command needs correct path escaping
        const command = `"${ytDlpBinaryPath}" --dump-json --flat-playlist "${url}"`;

        exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                console.error('Error probing:', stderr);
                return res.status(500).json({ error: 'Failed to probe video', details: stderr });
            }

            try {
                const info = JSON.parse(stdout);
                let formats = info.formats || [];

                const processedFormats = formats
                    .filter(f => f.protocol === 'https' || f.protocol === 'http')
                    .map(f => ({
                        format_id: f.format_id,
                        ext: f.ext,
                        resolution: f.resolution || (f.width && f.height ? `${f.width}x${f.height}` : 'audio only'),
                        filesize: f.filesize ? (f.filesize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A',
                        note: f.format_note,
                        vcodec: f.vcodec,
                        acodec: f.acodec,
                        url: f.url
                    }))
                    .reverse();

                res.json({
                    title: info.title,
                    thumbnail: info.thumbnail,
                    duration: info.duration,
                    formats: processedFormats,
                    original_url: url
                });
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse video info' });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Stream endpoint
app.get('/api/stream', async (req, res) => {
    const { url, title, ext } = req.query;
    if (!url) return res.status(400).send('URL is required');

    try {
        // await ensureYtDlp(); // Not strictly needed for direct piping but good practice

        const videoUrl = url;
        const filename = `${title || 'video'}.${ext || 'mp4'}`.replace(/[^a-z0-9.]/gi, '_');

        res.header('Content-Disposition', `attachment; filename="${filename}"`);

        const response = await fetch(videoUrl);
        if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);

        // In Node 18+ (which allows fetch), we can use Readable.fromWeb
        // Explicitly importing Readable to be safe
        const { Readable } = await import('stream');

        // @ts-ignore
        const body = Readable.fromWeb(response.body);
        body.pipe(res);

    } catch (err) {
        console.error('Stream error:', err);
        // Only send error if headers haven't been sent
        if (!res.headersSent) {
            res.status(500).send('Error streaming video');
        }
    }
});

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await ensureYtDlp();
});
