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

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid YouTube URL' })
      };
    }

    // Get video info
    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;

    // Get available formats
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio')
      .map(format => ({
        quality: format.qualityLabel || 'Audio',
        format: format.container,
        size: format.contentLength ? (format.contentLength / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown',
        itag: format.itag,
        hasVideo: format.hasVideo,
        hasAudio: format.hasAudio
      }));

    // Add audio-only formats
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    audioFormats.forEach(format => {
      formats.push({
        quality: 'Audio',
        format: format.container,
        size: format.contentLength ? (format.contentLength / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown',
        itag: format.itag,
        hasVideo: false,
        hasAudio: true
      });
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        title: videoDetails.title,
        duration: formatDuration(videoDetails.lengthSeconds),
        thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url, // Use largest thumbnail
        author: videoDetails.author.name,
        formats: formats
      })
    };

  } catch (error) {
    console.error('Error fetching video info:', error);
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
