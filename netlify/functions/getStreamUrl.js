const { spawn } = require('child_process');

exports.handler = async (event) => {
  const { vodUrl } = JSON.parse(event.body);

  return new Promise((resolve, reject) => {
    const youtubeDl = spawn('youtube-dl', ['-g', '-f', 'best', vodUrl]);
    let streamUrl = '';
    let errorOutput = '';

    youtubeDl.stdout.on('data', (data) => {
      streamUrl += data.toString();
    });

    youtubeDl.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('youtube-dl stderr:', data.toString());
    });

    youtubeDl.on('close', (code) => {
      if (code === 0 && streamUrl) {
        resolve({
          statusCode: 200,
          body: JSON.stringify({ streamUrl: streamUrl.trim() })
        });
      } else {
        reject({
          statusCode: 500,
          body: JSON.stringify({ error: `Failed to get stream URL: ${errorOutput}` })
        });
      }
    });
  });
};

      
