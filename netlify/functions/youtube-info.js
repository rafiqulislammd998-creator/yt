const ytdl = require('ytdl-core');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { url } = event.queryStringParameters;
    
    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL parameter is required' })
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
    const videoDetails = info.videoDetails;

    // Get video formats
    const videoFormats = ytdl.filterFormats(info.formats, 'videoandaudio');
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

    const formats = [
      ...videoFormats.map(format => ({
        quality: format.qualityLabel || 'Unknown',
        format: format.container,
        size: format.contentLength ? (format.contentLength / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown',
        itag: format.itag,
        type: 'video'
      })),
      ...audioFormats.map(format => ({
        quality: 'Audio',
        format: format.container,
        size: format.contentLength ? (format.contentLength / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown',
        itag: format.itag,
        type: 'audio'
      }))
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        title: videoDetails.title,
        duration: formatDuration(videoDetails.lengthSeconds),
        thumbnail: videoDetails.thumbnails[0].url,
        author: videoDetails.author.name,
        formats: formats
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch video information',
        message: error.message 
      })
    };
  }
};

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}