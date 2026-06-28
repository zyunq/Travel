const fs = require('fs');
const path = require('path');

console.log('=== 验证 uniapp 配置文件 ===\n');

// 1. 验证 pages.json
try {
  const pagesPath = path.join(__dirname, 'src/pages.json');
  const pagesContent = fs.readFileSync(pagesPath, 'utf8');
  const pages = JSON.parse(pagesContent);
  console.log('✅ pages.json 格式正确');
  console.log('页面列表:', pages.pages.map(p => p.path).join(', '));

  // 检查页面文件是否存在
  console.log('\n=== 检查页面文件是否存在 ===');
  pages.pages.forEach(page => {
    const vuePath = path.join(__dirname, 'src', page.path + '.vue');
    if (fs.existsSync(vuePath)) {
      console.log(`✅ ${page.path}.vue 存在`);
    } else {
      console.log(`❌ ${page.path}.vue 不存在`);
    }
  });
} catch (e) {
  console.log('❌ pages.json 格式错误:', e.message);
}

// 2. 验证 manifest.json
try {
  const manifestPath = path.join(__dirname, 'src/manifest.json');
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  JSON.parse(manifestContent);
  console.log('\n✅ manifest.json 格式正确');
} catch (e) {
  console.log('\n❌ manifest.json 格式错误:', e.message);
}

// 3. 创建最小化的测试配置页面
console.log('\n=== 创建测试用的 config.vue ===');
const testVue = `<template>
  <view class="container">
    <text>配置页面</text>
  </view>
</template>

<script>
export default {
  data() {
    return {}
  }
}
</script>

<style>
.container {
  padding: 20px;
}
</style>
`;

const configVuePath = path.join(__dirname, 'src/pages/config/config.vue');
const backupPath = path.join(__dirname, 'src/pages/config/config.vue.backup');

// 备份原文件
if (fs.existsSync(configVuePath)) {
  fs.copyFileSync(configVuePath, backupPath);
  console.log('✅ 已备份原 config.vue');
}

// 写入新文件
fs.writeFileSync(configVuePath, testVue, 'utf8');
console.log('✅ 已创建简化的 config.vue');
console.log('\n请重新运行: npm run dev:mp-weixin');
