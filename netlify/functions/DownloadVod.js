const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

exports.handler = async (event) => {
  const { vodId, vodUrl, start, end } = JSON.parse(event.body);

  const tempDir = path.join(os.tmpdir(), 'vod-downloads');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const outputFile = path.join(tempDir, `brkk_vod_${vodId}_${start}_${end}.mp4`);

  return new Promise((resolve, reject) => {
    const ffmpegCommand = [
      '-ss', formatTime(start),
      '-i', vodUrl,
      '-t', formatTime(end - start),
      '-c', 'copy',
      '-avoid_negative_ts', 'make_zero',
      '-y',
      outputFile
    ];

    const ffmpeg = spawn('ffmpeg', ffmpegCommand);

    let errorLogs = '';
    ffmpeg.stderr.on('data', (data) => {
      errorLogs += data.toString();
      console.error('ffmpeg stderr:', data.toString());
    });

    ffmpeg.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputFile)) {
        const fileContent = fs.readFileSync(outputFile);
        fs.unlinkSync(outputFile);
        resolve({
          statusCode: 200,
          headers: {
            'Content-Type': 'video/mp4',
            'Content-Disposition': `attachment; filename="brkk_vod_${vodId}_${start}_${end}.mp4"`
          },
          body: fileContent.toString('base64'),
          isBase64Encoded: true
        });
      } else {
        reject({
          statusCode: 500,
          body: JSON.stringify({ error: `Error processing VOD: ${errorLogs}` })
        });
      }
    });

    ffmpeg.on('error', (err) => {
      reject({
        statusCode: 500,
        body: JSON.stringify({ error: `Error executing ffmpeg: ${err.message}` })
      });
    });
  });
};

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

  
