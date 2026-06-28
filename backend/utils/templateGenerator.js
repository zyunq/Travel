const xlsx = require('xlsx');
const path = require('path');

/**
 * 生成导入模板 Excel
 * @returns {Buffer} - Excel 文件 Buffer
 */
function generateTemplate() {
  const workbook = xlsx.utils.book_new();

  const headers = ['序号', '证件', '姓名', '证件号码', '日期', '车次', '发站', '到站', '席别', '车厢', '座号', '票价', '订单号'];

  const exampleData = [
    [1, '二代', '张三', '440107199001010001', '2024-06-20', 'G123', '北京南', '上海虹桥', '二等座', '05', '12A', 553.0, 'E9W5538965'],
    [2, '外护', 'JOHN SMITH', 'A12345678', '2024-06-20', 'G123', '北京南', '上海虹桥', '二等座', '05', '12B', 553.0, 'E9W5538965'],
  ];

  const data = [headers, ...exampleData];
  const sheet = xlsx.utils.aoa_to_sheet(data);

  // 设置列宽
  sheet['!cols'] = [
    { wch: 6 },   // 序号
    { wch: 8 },   // 证件
    { wch: 15 },  // 姓名
    { wch: 20 },  // 证件号码
    { wch: 12 },  // 日期
    { wch: 10 },  // 车次
    { wch: 10 },  // 发站
    { wch: 10 },  // 到站
    { wch: 8 },   // 席别
    { wch: 6 },   // 车厢
    { wch: 6 },   // 座号
    { wch: 8 },   // 票价
    { wch: 15 },  // 订单号
  ];

  xlsx.utils.book_append_sheet(workbook, sheet, '人员导入模板');

  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = { generateTemplate };
