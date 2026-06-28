<script>
export default {
  onLaunch: function() {
    console.log('App Launch')
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  }
}
</script>

<style>
/* 全局样式 */
page {
  background-color: #f0fdfa;
  font-family: -apple-system, Helvetica, sans-serif;
}

/* 颜色变量 */
:root {
  --primary: #0d9488;
  --primary-light: #14b8a6;
  --primary-dark: #0f766e;
  --bg-soft: #f0fdfa;
  --card-bg: #ffffff;
  --text-primary: #374151;
  --text-secondary: #6b7280;
  --shadow-soft: 0 8px 32px rgba(13, 148, 136, 0.08);
}

/* 通用卡片样式 */
.card {
  background: #ffffff;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(13, 148, 136, 0.08);
  margin-bottom: 16px;
}

/* 通用按钮样式 */
.btn-primary {
  background: #0d9488;
  color: #ffffff;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 14px;
  border: none;
}

.btn-primary:active {
  background: #0f766e;
}
</style>
