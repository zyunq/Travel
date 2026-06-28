const fs = require('fs');
const path = require('path');

// 读取 pages.json
const pagesPath = path.join(__dirname, 'src', 'pages.json');
let content;

try {
  content = fs.readFileSync(pagesPath, 'utf8');
  console.log('原始内容:');
  console.log(content);

  // 尝试解析
  const data = JSON.parse(content);
  console.log('\n✅ JSON 格式正确');
} catch (error) {
  console.log('\n❌ JSON 格式错误:', error.message);

  // 查找错误位置
  const match = error.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1]);
    console.log(`\n错误位置: ${pos}`);
    console.log(`上下文: ...${content.substring(Math.max(0, pos - 20), pos + 20)}...`);
    console.log(`错误字符: "${content[pos]}" (ASCII: ${content.charCodeAt(pos)})`);
  }
}
