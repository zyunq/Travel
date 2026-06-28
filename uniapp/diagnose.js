const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════╗');
console.log('║   UniApp 小程序诊断报告               ║');
console.log('╚════════════════════════════════════════╝\n');

// 1. 检查 Node.js 版本
console.log('【环境信息】');
console.log('Node.js 版本:', process.version);
console.log('当前目录:', process.cwd());
console.log('');

// 2. 检查 package.json
console.log('【项目配置】');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('项目名称:', pkg.name);
  console.log('UniApp 版本:', pkg.dependencies['@dcloudio/uni-app'] || '未知');
  console.log('');
} catch (e) {
  console.log('❌ 无法读取 package.json\n');
}

// 3. 检查 pages.json
console.log('【页面配置 pages.json】');
try {
  const pages = JSON.parse(fs.readFileSync('src/pages.json', 'utf8'));
  console.log('✅ JSON 格式正确');
  console.log('页面数量:', pages.pages.length);

  pages.pages.forEach((page, index) => {
    const vuePath = path.join('src', page.path + '.vue');
    const exists = fs.existsSync(vuePath);
    const status = exists ? '✅' : '❌';
    console.log(`${status} 页面 ${index + 1}: ${page.path}`);
    if (!exists) {
      console.log(`   错误: 文件不存在 - ${vuePath}`);
    }
  });
  console.log('');
} catch (e) {
  console.log('❌ JSON 解析错误:', e.message);
  console.log('');
}

// 4. 检查 manifest.json
console.log('【应用配置 manifest.json】');
try {
  JSON.parse(fs.readFileSync('src/manifest.json', 'utf8'));
  console.log('✅ JSON 格式正确\n');
} catch (e) {
  console.log('❌ JSON 解析错误:', e.message + '\n');
}

// 5. 检查各页面文件
console.log('【页面文件检查】');
const checkVueFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // 检查 BOM
    if (content.charCodeAt(0) === 0xFEFF) {
      console.log(`⚠️  ${filePath}: 包含 BOM，建议移除`);
      return false;
    }

    // 检查基本结构
    const hasTemplate = content.includes('<template>');
    const hasScript = content.includes('<script>');
    const hasStyle = content.includes('<style');

    if (!hasTemplate || !hasScript) {
      console.log(`⚠️  ${filePath}: 结构不完整`);
      return false;
    }

    console.log(`✅ ${filePath}: 结构正常`);
    return true;
  } catch (e) {
    console.log(`❌ ${filePath}: ${e.message}`);
    return false;
  }
};

// 检查主要页面
const pages = [
  'src/pages/login/login.vue',
  'src/pages/index/index.vue',
  'src/pages/config/config.vue',
  'src/pages/group/detail.vue'
];

pages.forEach(page => {
  if (fs.existsSync(page)) {
    checkVueFile(page);
  } else {
    console.log(`❌ ${page}: 文件不存在`);
  }
});
console.log('');

// 6. 检查组件
console.log('【组件检查】');
const components = ['src/components/CustomTabbar.vue'];
components.forEach(comp => {
  if (fs.existsSync(comp)) {
    checkVueFile(comp);
  } else {
    console.log(`❌ ${comp}: 文件不存在`);
  }
});
console.log('');

// 7. 给出修复建议
console.log('╔════════════════════════════════════════╗');
console.log('║   修复建议                              ║');
console.log('╚════════════════════════════════════════╝');
console.log('');
console.log('如果遇到编译错误，请尝试以下步骤：');
console.log('');
console.log('1. 清理编译缓存:');
console.log('   - 删除 uniapp/dist 目录');
console.log('   - 删除 uniapp/.vite 目录');
console.log('');
console.log('2. 重新安装依赖:');
console.log('   npm install');
console.log('');
console.log('3. 重新编译:');
console.log('   npm run dev:mp-weixin');
console.log('');
console.log('4. 如果仍然报错，运行修复脚本:');
console.log('   双击运行: fix-uniapp.bat');
console.log('');
