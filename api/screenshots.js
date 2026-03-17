const fs = require('fs-extra');
const path = require('path');

const screenshotsJsonPath = path.join(process.cwd(), 'data', 'screenshots.json');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      await fs.ensureFile(screenshotsJsonPath);
      let data = [];
      try {
        data = await fs.readJson(screenshotsJsonPath);
      } catch (e) {
        data = [];
      }

      const groupedByUrl = {};
      data.forEach(item => {
        if (!groupedByUrl[item.siteUrl]) {
          groupedByUrl[item.siteUrl] = [];
        }
        groupedByUrl[item.siteUrl].push(item);
        groupedByUrl[item.siteUrl].sort((a, b) => new Date(b.captureTime) - new Date(a.captureTime));
      });

      res.json({ success: true, data: groupedByUrl });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      await fs.ensureFile(screenshotsJsonPath);
      let data = [];
      try {
        data = await fs.readJson(screenshotsJsonPath);
      } catch (e) {
        data = [];
      }

      const screenshotData = req.body;
      screenshotData.id = Date.now();
      data.push(screenshotData);

      await fs.writeJson(screenshotsJsonPath, data, { spaces: 2 });

      res.json({ success: true, data: screenshotData });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
    return;
  }

  res.status(405).json({ success: false, message: 'Method not allowed' });
};
