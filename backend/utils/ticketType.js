/**
 * 根据票价判断票型（成人/儿童）
 * @param {number} price - 票价
 * @param {number} adultPrice - 成人票价参考
 * @returns {string} - 成人/儿童
 */
function determineTicketType(price, adultPrice) {
  // 票价等于成人票价，为成人票
  if (price === adultPrice) {
    return '成人';
  }
  // 票价低于成人票价，为儿童票
  if (price < adultPrice) {
    return '儿童';
  }
  // 票价高于成人票价（异常情况），默认成人票
  return '成人';
}

module.exports = { determineTicketType };
