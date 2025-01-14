const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { Parser } = require('m3u8-parser');

exports.handler = async (event) => {
  try {
    const { vodId } = JSON.parse(event.body);
    const accessToken = process.env.TWITCH_ACCESS_TOKEN;
    const clientId = process.env.TWITCH_CLIENT_ID;

    // Obter o token de acesso para o VOD
    const tokenResponse = await fetch(`https://api.twitch.tv/helix/videos?id=${vodId}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.data || tokenData.data.length === 0) {
      throw new Error('VOD não encontrado');
    }

    const vodToken = tokenData.data[0].stream_id;

    // Obter a playlist m3u8
    const playlistUrl = `https://usher.ttvnw.net/vod/${vodId}.m3u8?allow_source=true&player=twitchweb&playlist_include_framerate=true&nauth=${vodToken}`;
    const playlistResponse = await fetch(playlistUrl);
    const playlistContent = await playlistResponse.text();

    // Analisar a playlist
    const parser = new Parser();
    parser.push(playlistContent);
    parser.end();

    const playlists = parser.manifest.playlists;
    if (playlists && playlists.length > 0) {
      // Escolher a melhor qualidade disponível
      const bestQuality = playlists.reduce((prev, current) => 
        (prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH) ? prev : current
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ streamUrl: bestQuality.uri })
      };
    } else {
      throw new Error('Nenhuma stream disponível');
    }
  } catch (error) {
    console.error('Erro ao obter URL do stream:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Falha ao obter URL do stream: ${error.message}` })
    };
  }
};

