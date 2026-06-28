const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/config/config.vue');

// 读取文件的前 100 个字节
const fd = fs.openSync(filePath, 'r');
const buffer = Buffer.alloc(100);
fs.readSync(fd, buffer, 0, 100, 0);
fs.closeSync(fd);

console.log('文件前100字节的十六进制:');
for (let i = 0; i < 100; i++) {
  const byte = buffer[i];
  if (byte === 0) break;

  process.stdout.write(byte.toString(16).padStart(2, '0') + ' ');

  if ((i + 1) % 20 === 0) {
    console.log();
  }
}
console.log('\n');

console.log('文件前100字节的字符:');
for (let i = 0; i < 100; i++) {
  const byte = buffer[i];
  if (byte === 0) break;

  if (byte >= 32 && byte <= 126) {
    process.stdout.write(String.fromCharCode(byte));
  } else if (byte === 10) {
    process.stdout.write('\\n');
  } else if (byte === 13) {
    process.stdout.write('\\r');
  } else if (byte === 9) {
    process.stdout.write('\\t');
  } else {
    process.stdout.write('.');
  }

  if ((i + 1) % 50 === 0) {
    console.log();
  }
}
console.log('\n');

// 检查第 34 个字符（索引 33）
const char33 = buffer[33];
const char33Str = char33 >= 32 && char33 <= 126 ? String.fromCharCode(char33) : `0x${char33.toString(16)}`;
console.log(`第 34 个字符 (位置 33): ${char33Str} (ASCII: ${char33})`);

// 检查是否有 BOM
if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
  console.log('\n⚠️  检测到 UTF-8 BOM (EF BB BF)');
}

// 读取完整文件内容
const content = fs.readFileSync(filePath, 'utf8');

// 查找 Vue 配置块
const configMatch = content.match(/<script\s+config[^>]*>([\s\S]*?)<\/script>/);
if (configMatch) {
  console.log('\n发现 Vue 配置块:');
  console.log(configMatch[0]);

  try {
    JSON.parse(configMatch[1]);
    console.log('✅ 配置块 JSON 格式正确');
  } catch (e) {
    console.log('❌ 配置块 JSON 格式错误:', e.message);
  }
} else {
  console.log('\n未发现 <script config> 配置块');
}

// 检查是否有其他隐藏的 JSON 块
const jsonBlocks = content.match(/\{[\s\S]*?\}/g);
if (jsonBlocks && jsonBlocks.length > 0) {
  console.log('\n发现的 JSON 块:');
  jsonBlocks.forEach((block, index) => {
    if (block.length < 200) {
      console.log(`\nJSON 块 ${index + 1}:`);
      console.log(block);
      try {
        JSON.parse(block);
        console.log('✅ 格式正确');
      } catch (e) {
        console.log('❌ 格式错误:', e.message);
      }
    }
  });
}
