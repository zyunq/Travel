/**
 * 座位号格式测试工具
 * 用于测试不同格式的座位号是否能被正确解析
 */

const testCases = [
  // 标准格式
  '12A', '8B', '15F',

  // 带前导零
  '08A', '012B', '005C',

  // 带分隔符
  '12-A', '12_A', '12 A',

  // 小写字母
  '12a', '8b', '15f',

  // 带前导零和分隔符
  '08-A', '012_B',

  // 无效格式
  '', ' ', 'A12', '12', 'AB', '12AB', '1A2', 'A1B'
];

const regex = /^0*(\d+)[\s\-_]?([A-Fa-f])$/i;

console.log('座位号格式测试');
console.log('=====================================\n');

testCases.forEach(seatNo => {
  const match = seatNo.match(regex);
  if (match) {
    const row = parseInt(match[1]);
    const col = match[2].toUpperCase();
    console.log(`✓ "${seatNo}" -> ${row}排 ${col}座`);
  } else {
    console.log(`✗ "${seatNo}" -> 无效格式`);
  }
});

console.log('\n=====================================');
console.log('正则表达式: /^0*(\\d+)[\\s\\-_]?([A-Fa-f])$/i');
console.log('\n支持的格式:');
console.log('1. 标准格式: 12A, 8B');
console.log('2. 带前导零: 08A, 012B');
console.log('3. 带分隔符: 12-A, 12_A, 12 A');
console.log('4. 小写字母: 12a, 8b');
console.log('5. 组合格式: 08-A, 012_B');
