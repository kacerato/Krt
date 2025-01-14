const youtubedl = require('youtube-dl-exec')

exports.handler = async (event) => {
  try {
    const { vodUrl } = JSON.parse(event.body);
    
    const output = await youtubedl(vodUrl, {
      getUrl: true,
      format: 'best'
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ streamUrl: output })
    }
  } catch (error) {
    console.error('Erro ao obter URL do stream:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Falha ao obter URL do stream: ${error.message}` })
    }
  }
}

