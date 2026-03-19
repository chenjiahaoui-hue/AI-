const { chromium } = require('playwright');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const monitorSites = [
  { 
    name: "阿里云百炼", 
    urls: [
      "https://bailian.console.aliyun.com/cn-beijing?tab=model#/model-market",
      "https://bailian.console.aliyun.com/cn-beijing?tab=model#/efm/model_experience_center/text",
      "https://bailian.console.aliyun.com/cn-beijing?tab=model#/efm/model_experience_center/voice",
      "https://bailian.console.aliyun.com/cn-beijing?tab=model#/efm/model_experience_center/vision",
      "https://bailian.console.aliyun.com/cn-beijing?tab=model#/efm/model_experience_center/multimodal",
      "https://bailian.console.aliyun.com/cn-beijing?tab=model#/efm/model_data",
      "https://bailian.console.aliyun.com/cn-beijing?tab=model#/efm/model_manager",
      "https://bailian.console.aliyun.com/cn-beijing?tab=app#/app-market/suggest",
      "https://bailian.console.aliyun.com/cn-beijing?tab=coding-plan#/efm/index",
      "https://bailian.console.aliyun.com/cn-beijing?tab=doc#/doc",
      "https://bailian.console.aliyun.com/cn-beijing?tab=doc#/doc/?type=model&url=2840915",
      "https://bailian.console.aliyun.com/cn-beijing?tab=doc#/doc/?type=model&url=2840914",
      "https://bailian.console.aliyun.com/cn-beijing?tab=doc#/doc/?type=model&url=2840182",
      "https://bailian.console.aliyun.com/cn-beijing?tab=api#/api",
      "https://bailian.console.aliyun.com/cn-beijing?tab=api#/api/?type=model&url=2803795",
      "https://bailian.console.aliyun.com/cn-beijing?tab=app#/mcp-market",
      "https://bailian.console.aliyun.com/cn-beijing?tab=app#/plugin-market",
      "https://bailian.console.aliyun.com/cn-beijing?tab=home#/home",
    ],
    description: "阿里云AI模型市场"
  },
];

const viewportSize = { width: 1440, height: 900 };
const API_BASE_URL = process.env.TRAE_URL || 'http://localhost:3000';

async function takeScreenshots() {
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ]
    });
    
    const context = await browser.newContext({
      viewport: viewportSize,
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const captureTime = now.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).replace(/\//g, '-');

    console.log(`===== 开始截图任务 ${captureTime} =====`);
    console.log('请在浏览器中手动登录阿里云百炼...');
    console.log('登录完成后，按回车键继续...');

    for (const site of monitorSites) {
      console.log(`\n处理：${site.name}`);
      
      const siteDir = path.join(__dirname, 'data/images', site.name.replace(/\//g, '-'));
      await fs.ensureDir(siteDir);

      for (let urlIndex = 0; urlIndex < site.urls.length; urlIndex++) {
        const url = site.urls[urlIndex];
        try {
          console.log(`  页面 ${urlIndex + 1}/${site.urls.length}：${url}`);
          
          const imageFileName = `${today}_${Date.now()}_page${urlIndex + 1}.png`;
          const imagePath = path.join(siteDir, imageFileName);
          const imageUrl = `/screenshots/${site.name.replace(/\//g, '-')}/${imageFileName}`;

          try {
            await page.goto(url, { 
              waitUntil: 'domcontentloaded', 
              timeout: 60000 
            });
          } catch (e) {
            console.log(`    等待超时，继续截图...`);
          }

          await page.waitForTimeout(3000);

          await page.screenshot({ 
            path: imagePath, 
            fullPage: false,
            animations: 'disabled'
          });
          console.log(`    ✅ 截图完成：${imagePath}`);

          const screenshotData = {
            siteName: site.name,
            siteUrl: url,
            description: site.description || '',
            imageUrl: imageUrl,
            captureTime: captureTime,
            resolution: `${viewportSize.width}x${viewportSize.height}`
          };

          await axios.post(`${API_BASE_URL}/api/screenshots`, screenshotData);
          console.log(`    ✅ 数据上传成功`);

        } catch (error) {
          console.error(`    ❌ 失败：`, error.message);
          continue;
        }
      }
    }

    console.log(`\n===== 截图任务完成 =====`);
    console.log('按 Ctrl+C 关闭浏览器...');

    await new Promise(() => {});

  } catch (error) {
    console.error(`❌ 截图任务异常：`, error);
  } finally {
    if (browser) await browser.close();
  }
}

takeScreenshots();
