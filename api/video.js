const express = require("express");
const router = express.Router();
const ytsr = require("@distube/ytsr");
const ytdl = require("@distube/ytdl-core");

function extractVideoId(input) {
  const urlRegex = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
  const match = input.match(urlRegex);
  if (match) return match[1];
  if (/^[\w-]{11}$/.test(input)) return input;
  return null;
}

// GET /api/video/search?songName=<query>
router.get("/search", async (req, res) => {
  const { songName } = req.query;
  if (!songName) {
    return res.status(400).json({ error: "songName is required", owner: "Rocky" });
  }
  try {
    const results = await ytsr(songName, { limit: 5 });
    const videos = results.items
      .filter((item) => item.type === "video")
      .map((item) => ({
        id: item.id,
        title: item.name,
        url: item.url,
        duration: item.duration,
        thumbnail: item.thumbnail,
        channel: item.author?.name || "Unknown",
        views: item.views
      }));

    if (videos.length === 0) {
      return res.status(404).json({ error: "No results found", owner: "Rocky" });
    }
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message, owner: "Rocky" });
  }
});

// GET /api/video/download?link=<videoID_or_url>&format=mp4
router.get("/download", async (req, res) => {
  const { link, format } = req.query;
  if (!link) {
    return res.status(400).json({ error: "link is required", owner: "Rocky" });
  }

  const videoId = extractVideoId(link) || link;
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    if (!ytdl.validateID(videoId)) {
      return res.status(400).json({ error: "Invalid YouTube video ID or URL", owner: "Rocky" });
    }

    const info = await ytdl.getInfo(videoUrl);
    const title = info.videoDetails.title;
    const thumbnail = info.videoDetails.thumbnails.slice(-1)[0]?.url;
    const duration = info.videoDetails.lengthSeconds;

    let chosenFormat;
    if (format === "mp3" || format === "audio") {
      chosenFormat = ytdl.chooseFormat(info.formats, {
        quality: "highestaudio",
        filter: "audioonly"
      });
    } else {
      chosenFormat = ytdl.chooseFormat(info.formats, {
        quality: "highest",
        filter: (f) => f.container === "mp4" && f.hasAudio && f.hasVideo
      });
      if (!chosenFormat) {
        chosenFormat = ytdl.chooseFormat(info.formats, {
          quality: "highest",
          filter: (f) => f.container === "mp4"
        });
      }
    }

    if (!chosenFormat) {
      return res.status(404).json({ error: "No suitable format found", owner: "Rocky" });
    }

    res.json({
      title,
      thumbnail,
      duration,
      format: chosenFormat.container,
      quality: chosenFormat.qualityLabel || chosenFormat.audioQuality,
      downloadLink: chosenFormat.url,
      owner: "Rocky"
    });
  } catch (err) {
    res.status(500).json({ error: err.message, owner: "Rocky" });
  }
});

module.exports = router;
