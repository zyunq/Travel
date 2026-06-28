const xlsx = require('xlsx');
const { determineTicketType } = require('./ticketType');

/**
 * 解析 Excel 文件并返回人员数据
 * @param {string} filePath - Excel 文件路径
 * @param {number} adultPrice - 成人票价参考（传0或负数时只提取数据不判断票型）
 * @returns {Object} - { members, dates } 人员数据和日期列表
 */
function parseExcel(filePath, adultPrice) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  const allMembers = data.map(row => {
    const price = parseFloat(row['票价']) || 0;

    return {
      idType: row['证件'] || '',
      name: row['姓名'] || '',
      idNumber: row['证件号码'] || '',
      date: row['日期'] || '',
      trainNo: row['车次'] || '',
      departStation: row['发站'] || '',
      arriveStation: row['到站'] || '',
      seatClass: row['席别'] || '',
      carriage: String(row['车厢'] || ''),
      seatNo: String(row['座号'] || ''),
      price: price,
      orderNo: row['订单号'] || '',
      // 只有adultPrice > 0时才判断票型
      ticketType: adultPrice > 0 ? determineTicketType(price, adultPrice) : '成人',
      status: '正常'
    };
  });

  // 过滤掉票价为空或0的乘客
  const members = allMembers.filter(m => m.price > 0);

  // 提取所有不同的日期
  const dates = [...new Set(members.map(m => m.date).filter(d => d))].sort();

  return { members, dates };
}

module.exports = { parseExcel };
