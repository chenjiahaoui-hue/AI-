const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

const publicDir = path.join(__dirname, 'public');
const screenshotsDir = path.join(__dirname, 'data/images');

console.log('服务器启动中...');
console.log('publicDir:', publicDir);
console.log('Files in public:', require('fs').readdirSync(publicDir));

app.use(express.static(publicDir));
app.use('/screenshots', express.static(screenshotsDir));

app.listen(PORT, () => {
  console.log(`服务启动成功，访问地址：http://localhost:${PORT}`);
});
