const ytdl = require('ytdl-core');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { url, itag } = event.queryStringParameters;
    
    if (!url || !itag) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL and itag parameters are required' })
      };
    }

    if (!ytdl.validateURL(url)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid YouTube URL' })
      };
    }

    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { quality: itag });

    if (!format) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Requested format not available' })
      };
    }

    // Return the direct download URL
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        downloadUrl: format.url,
        title: info.videoDetails.title,
        quality: format.qualityLabel || 'Audio',
        format: format.container,
        filename: `${info.videoDetails.title}.${format.container}`
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Download failed',
        message: error.message 
      })
    };
  }
};