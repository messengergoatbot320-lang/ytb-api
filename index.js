const express = require("express");
const app = express();
const videoRouter = require("./api/video");

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "YTB API",
    owner: "Rocky",
    version: "1.7.0",
    endpoints: {
      search: "/api/video/search?songName=<name>",
      download: "/api/video/download?link=<videoID_or_url>&format=mp4"
    },
    status: "✅ Running"
  });
});

app.use("/api/video", videoRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found", owner: "Rocky" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`YTB API by Rocky running on port ${PORT}`);
});
