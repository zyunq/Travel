/**
 * 人员匹配工具函数
 * 用于名单对比和智能补全
 */

/**
 * 过滤不可见字符（零宽字符等）
 * @param {string} s 原始字符串
 * @returns {string} 清理后的字符串
 */
export const cleanStr = (s) => {
  if (!s || s === 'null' || s === 'undefined' || s === 'NaN') return ''
  // 移除零宽字符和其他不可见字符
  return String(s).replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, '').trim()
}

/**
 * 判断两个人是否为同一人
 * @param {Object} p1 人员1
 * @param {Object} p2 人员2
 * @returns {Object} { match: boolean, type: string }
 */
export const isSamePerson = (p1, p2) => {
  const name1 = cleanStr(p1.name)
  const name2 = cleanStr(p2.name)
  const id1 = cleanStr(p1.id_number)
  const id2 = cleanStr(p2.id_number)

  // 完全匹配：姓名 + 证件号
  if (name1 && name2 && id1 && id2) {
    if (name1 === name2 && id1 === id2) {
      return { match: true, type: '完全匹配' }
    }
  }

  // 证件号匹配（两边都有证件号且相同）
  if (id1 && id2 && id1 === id2) {
    return { match: true, type: '证件号匹配' }
  }

  // 姓名匹配 + 证件号前6位匹配
  if (name1 && name2 && id1 && id2 && id1.length >= 6 && id2.length >= 6) {
    if (name1 === name2 && id1.substring(0, 6) === id2.substring(0, 6)) {
      return { match: true, type: '姓名+证件号前缀匹配' }
    }
  }

  // 仅姓名匹配（两边都有姓名且相同，且至少有一方没有证件号）
  if (name1 && name2 && name1 === name2) {
    if (!id1 && !id2) {
      return { match: true, type: '仅姓名匹配' }
    }
    if (!id1 || !id2) {
      return { match: true, type: '姓名匹配' }
    }
  }

  return { match: false, type: '' }
}

/**
 * 判断两个名字是否相似（模糊匹配）
 * @param {string} name1 姓名1
 * @param {string} name2 姓名2
 * @returns {boolean}
 */
export const isNameSimilar = (name1, name2) => {
  if (!name1 || !name2) return false

  const n1 = cleanStr(name1)
  const n2 = cleanStr(name2)

  // 完全相同
  if (n1 === n2) return true

  // 包含关系
  if (n1.includes(n2) || n2.includes(n1)) return true

  // 差一个字
  if (Math.abs(n1.length - n2.length) <= 1) {
    let diff = 0
    const shorter = n1.length < n2.length ? n1 : n2
    const longer = n1.length >= n2.length ? n1 : n2
    for (let i = 0; i < shorter.length; i++) {
      if (shorter[i] !== longer[i]) diff++
    }
    if (n1.length !== n2.length) diff++
    if (diff <= 1) return true
  }

  return false
}

/**
 * 计算两个人员信息的差异
 * @param {Object} recognized 识别结果
 * @param {Object} reference 参考数据
 * @param {boolean} overwrite 是否覆盖已有数据
 * @returns {Object} 差异对象
 */
export const calculateDiff = (recognized, reference, overwrite = false) => {
  const diff = {}
  const fields = ['name', 'id_number', 'gender', 'birth_date', 'nation']

  for (const field of fields) {
    const oldVal = cleanStr(recognized[field])
    const newVal = cleanStr(reference[field])

    // 只补全空字段（默认不覆盖）
    if (!oldVal && newVal) {
      diff[field] = { old: oldVal, new: newVal }
    }
    // 如果开启覆盖模式，有新值就补全
    if (overwrite && newVal) {
      diff[field] = { old: oldVal, new: newVal }
    }
  }

  return diff
}

/**
 * 从对象中查找第一个非空值（遍历多个可能的键名）
 * @param {Object} obj 对象
 * @param {Array} possibleKeys 可能的键名数组
 * @returns {string}
 */
export const findFieldValue = (obj, possibleKeys) => {
  for (const key of possibleKeys) {
    const value = obj[key]
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return cleanStr(value)
    }
  }
  return ''
}

/**
 * 提取人员信息（从 Excel 数据）
 * @param {Array} data Excel 解析的数据
 * @returns {Array} 人员列表
 */
export const extractPersonInfo = (data) => {
  const nameKeys = ['姓名', 'name', 'Name', '姓名 ', ' 姓名', '游客姓名', '旅客姓名', '乘客姓名']
  const idKeys = ['证件号码', '证件号', '身份证号', 'id_number', 'idNumber', '护照号码', 'passport_number', '证件号 ', ' 证件号码', '身份证号码', '护照号', '通行证号码', '通行证号']

  return data.map(row => {
    const name = findFieldValue(row, nameKeys)
    const idNumber = findFieldValue(row, idKeys)
    const gender = cleanStr(row['性别'] || row['gender'] || '')
    const notes = cleanStr(row['备注'] || row['说明'] || '')

    return {
      name,
      id_number: idNumber.toUpperCase(),
      gender,
      notes
    }
  }).filter(p => p.name || p.id_number)
}

export default {
  cleanStr,
  isSamePerson,
  isNameSimilar,
  calculateDiff,
  findFieldValue,
  extractPersonInfo
}
