const { chromium } = require('playwright');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

// ===================== 这里改你的竞品网站 =====================
const monitorSites = [
  { 
    name: "阿里云百炼", 
    url: "https://bailian.console.aliyun.com/cn-beijing/?spm=5176.29619931.J_ultafFCRIxtI1QdkWHHHD.2.7fbc59fcLQF5yn&tab=model#/model-market",
    description: "阿里云AI模型市场"
  },
  { 
    name: "通义千问", 
    url: "https://chat.qwen.ai/",
    description: "阿里AI对话助手"
  },
  { 
    name: "ChatGPT", 
    url: "https://chatgpt.com/",
    description: "OpenAI对话助手"
  },
  { 
    name: "豆包", 
    url: "https://www.doubao.com/chat/?from_logout=1",
    description: "字节跳动AI助手"
  },
  { 
    name: "Midjourney", 
    url: "https://www.midjourney.com/editor/new",
    description: "AI图像生成"
  },
  { 
    name: "文心一言", 
    url: "https://yiyan.baidu.com/",
    description: "百度AI对话助手"
  },
  { 
    name: "LiblibAI", 
    url: "https://www.liblib.art/ai-tool/image-generator",
    description: "AI图像生成平台"
  },
  { 
    name: "PAI视频生成", 
    url: "https://pai.video/onboard",
    description: "阿里PAI视频生成"
  },
  { 
    name: "可灵AI", 
    url: "https://app.klingai.com/cn/omni/new?ac=1",
    description: "快手AI视频生成"
  },
  { 
    name: "Grok", 
    url: "https://grok.com/",
    description: "xAI对话助手"
  },
  // 要加更多竞品就复制上面的{}，改名字和网址
];
// =============================================================
const viewportSize = { width: 1440, height: 900 };
const API_BASE_URL = process.env.TRAE_URL || 'http://localhost:3000';

async function takeScreenshots() {
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage({
      viewport: viewportSize,
      ignoreHTTPSErrors: true
    });

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const captureTime = now.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).replace(/\//g, '-');

    console.log(`===== 开始截图任务 ${captureTime} =====`);

    for (const site of monitorSites) {
      try {
        console.log(`处理：${site.name}`);
        
        const siteDir = path.join(__dirname, 'data/images', site.name.replace(/\//g, '-'));
        await fs.ensureDir(siteDir);
        const imageFileName = `${today}_${Date.now()}.png`;
        const imagePath = path.join(siteDir, imageFileName);
        const imageUrl = `/screenshots/${site.name.replace(/\//g, '-')}/${imageFileName}`;

        await page.goto(site.url, { 
          waitUntil: 'networkidle', 
          timeout: 30000 
        });
        await page.waitForTimeout(1000);

        await page.screenshot({ 
          path: imagePath, 
          fullPage: true,
          animations: 'disabled'
        });
        console.log(`✅ 截图完成：${imagePath}`);

        const screenshotData = {
          siteName: site.name,
          siteUrl: site.url,
          description: site.description || '',
          imageUrl: imageUrl,
          captureTime: captureTime,
          resolution: `${viewportSize.width}x${viewportSize.height}`
        };

        await axios.post(`${API_BASE_URL}/api/screenshots`, screenshotData);
        console.log(`✅ 数据上传成功：${site.name}`);

      } catch (error) {
        console.error(`❌ 失败 ${site.name}：`, error.message);
        continue;
      }
    }

    console.log(`===== 截图任务完成 =====`);

  } catch (error) {
    console.error(`❌ 截图任务异常：`, error.message);
  } finally {
    if (browser) await browser.close();
  }
}

takeScreenshots().then(() => {
  if (!process.env.TRAE_URL) process.exit(0);
}).catch(error => {
  console.error('截图任务失败：', error);
  if (!process.env.TRAE_URL) process.exit(1);
});
