const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async (event) => {
  try {
    const { vodId } = JSON.parse(event.body);
    const accessToken = process.env.TWITCH_ACCESS_TOKEN;
    const clientId = process.env.TWITCH_CLIENT_ID;

    // Obter informações do VOD
    const vodInfoResponse = await fetch(`https://api.twitch.tv/helix/videos?id=${vodId}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const vodInfo = await vodInfoResponse.json();

    if (!vodInfo.data || vodInfo.data.length === 0) {
      throw new Error('VOD não encontrado');
    }

    const vodData = vodInfo.data[0];

    // Obter a URL do m3u8
    const m3u8Url = vodData.url;
    const m3u8Response = await fetch(m3u8Url);
    const m3u8Content = await m3u8Response.text();

    // Encontrar a melhor qualidade disponível
    const qualities = m3u8Content.match(/VIDEO="([^"]+)"/g);
    const bestQuality = qualities ? qualities[qualities.length - 1].match(/"([^"]+)"/)[1] : 'chunked';

    // Construir a URL do stream de melhor qualidade
    const streamUrl = m3u8Url.replace('index-dvr.m3u8', `${bestQuality}/index-dvr.m3u8`);

    // Iniciar o download
    const streamResponse = await fetch(streamUrl);
    if (!streamResponse.ok) {
      throw new Error(`HTTP error! status: ${streamResponse.status}`);
    }

    // Preparar o cabeçalho da resposta
    const headers = {
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="vod_${vodId}.mp4"`
    };

    // Retornar o stream
    return {
      statusCode: 200,
      headers: headers,
      body: streamResponse.body,
      isBase64Encoded: false
    };
  } catch (error) {
    console.error('Erro ao processar VOD:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Erro ao processar VOD: ${error.message}` })
    };
  }
};

