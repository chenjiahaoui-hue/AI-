const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/screenshots', express.static(path.join(__dirname, 'data/images')));

const screenshotsJsonPath = path.join(__dirname, 'data/screenshots.json');
const screenshotsDir = path.join(__dirname, 'data/images');

async function initData() {
  await fs.ensureDir(screenshotsDir);
  if (!await fs.pathExists(screenshotsJsonPath)) {
    await fs.writeJson(screenshotsJsonPath, [], { spaces: 2 });
  }
}

app.get('/api/screenshots', async (req, res) => {
  try {
    const data = await fs.readJson(screenshotsJsonPath);
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
});

app.get('/api/screenshots/url', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, message: '缺少url参数' });
    
    const data = await fs.readJson(screenshotsJsonPath);
    const filtered = data.filter(item => item.siteUrl === url)
                         .sort((a, b) => new Date(b.captureTime) - new Date(a.captureTime));
    
    res.json({ success: true, data: filtered });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/screenshots', async (req, res) => {
  try {
    const newItem = req.body;
    if (!newItem.siteName || !newItem.siteUrl || !newItem.imageUrl || !newItem.captureTime) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }

    const data = await fs.readJson(screenshotsJsonPath);
    newItem.id = Date.now();
    data.push(newItem);
    await fs.writeJson(screenshotsJsonPath, data, { spaces: 2 });

    res.json({ success: true, data: newItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

initData().then(() => {
  app.listen(PORT, () => {
    console.log(`服务启动成功，访问地址：http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('初始化失败：', error);
  process.exit(1);
});
