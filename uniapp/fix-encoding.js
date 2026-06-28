const fs = require('fs');
const path = require('path');

// 检查文件是否有 BOM
function checkBOM(filePath) {
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(3);
  fs.readSync(fd, buffer, 0, 3, 0);
  fs.closeSync(fd);

  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    console.log(`⚠️  ${filePath} 包含 UTF-8 BOM，正在移除...`);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/^\uFEFF/, '');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${filePath} BOM 已移除`);
    return true;
  }
  return false;
}

// 检查所有相关文件
const files = [
  'src/pages.json',
  'src/manifest.json',
  'src/pages/config/config.vue',
  'src/pages/index/index.vue',
  'src/pages/login/login.vue',
  'src/pages/group/detail.vue',
  'src/components/CustomTabbar.vue'
];

let fixed = false;
files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    if (checkBOM(fullPath)) {
      fixed = true;
    }
  }
});

if (!fixed) {
  console.log('✅ 所有文件都没有 BOM 问题');

  // 尝试解析 JSON 文件
  console.log('\n正在验证 JSON 格式...');
  ['src/pages.json', 'src/manifest.json'].forEach(file => {
    try {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      JSON.parse(content);
      console.log(`✅ ${file} JSON 格式正确`);
    } catch (error) {
      console.log(`❌ ${file} JSON 格式错误:`, error.message);
    }
  });
}
