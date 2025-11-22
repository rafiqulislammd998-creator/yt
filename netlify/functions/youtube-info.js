const ytdl = require('ytdl-core');

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { url } = event.queryStringParameters;
    
    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL is required' })
      };
    }

    // Basic URL validation
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Please enter a valid YouTube URL' })
      };
    }

    // Get video info
    const info = await ytdl.getInfo(url);
    const details = info.videoDetails;

    // Get available formats
    const formats = info.formats
      .filter(format => format.hasVideo || format.hasAudio)
      .slice(0, 8) // Limit to 8 formats
      .map(format => ({
        quality: format.qualityLabel || 'Audio',
        format: format.container,
        size: format.contentLength ? Math.round(format.contentLength / (1024 * 1024)) + ' MB' : 'Unknown',
        itag: format.itag,
        type: format.hasVideo ? 'video' : 'audio'
      }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        title: details.title,
        duration: formatTime(details.lengthSeconds),
        thumbnail: details.thumbnails[0]?.url || '',
        author: details.author?.name || 'Unknown',
        formats: formats
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to get video info',
        details: error.message 
      })
    };
  }
};

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
