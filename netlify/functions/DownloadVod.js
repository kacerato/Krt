const { createFFmpeg } = require('@ffmpeg/ffmpeg');
const { fetchFile } = require('@ffmpeg/util'); 

exports.handler = async (event) => {
  try {
    const { vodUrl, start, end } = JSON.parse(event.body);
    
    const ffmpeg = createFFmpeg({ log: true });
    await ffmpeg.load();

    const inputData = await fetchFile(vodUrl);
    ffmpeg.FS('writeFile', 'input.mp4', inputData);

    await ffmpeg.run(
      '-ss', formatTime(start),
      '-i', 'input.mp4',
      '-t', formatTime(end - start),
      '-c', 'copy',
      'output.mp4'
    );

    const data = ffmpeg.FS('readFile', 'output.mp4');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="clip_${start}_${end}.mp4"`
      },
      body: Buffer.from(data).toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Erro ao processar vídeo:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Erro ao processar vídeo: ${error.message}` })
    };
  }
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

