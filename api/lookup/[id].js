const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers to allow cross-origin requests from any domain
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight (OPTIONS) requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { id } = req.query;
  if (!id) {
    res.status(400).json({ error: 'No ID provided.' });
    return;
  }

  if (!process.env.BOT_TOKEN) {
    console.error("BOT_TOKEN is missing in environment variables.");
    res.status(500).json({ error: "Internal server error: BOT_TOKEN missing" });
    return;
  }

  try {
    const response = await axios.get(`https://discord.com/api/v10/users/${id}`, {
      headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error from Discord API:", error.response?.data || error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
