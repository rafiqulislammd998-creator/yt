const ytdl = require('ytdl-core');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  try {
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;

    const formats = ytdl.filterFormats(info.formats, 'videoandaudio')
      .map(format => ({
        quality: format.qualityLabel || 'Audio',
        format: format.container,
        size: format.contentLength ? (format.contentLength / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown',
        itag: format.itag
      }));

    res.json({
      title: videoDetails.title,
      duration: formatDuration(videoDetails.lengthSeconds),
      thumbnail: videoDetails.thumbnails[0].url,
      author: videoDetails.author.name,
      formats: formats
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch video info' });
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