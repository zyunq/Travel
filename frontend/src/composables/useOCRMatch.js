/**
 * OCR 匹配逻辑组合式函数
 * 用于证件识别和智能补全功能
 */
import { ref, computed } from 'vue'
import { cleanStr, isSamePerson, isNameSimilar, calculateDiff } from '@/utils/match'

export function useOCRMatch() {
  // 匹配选项
  const matchOptions = ref({
    fuzzyMatch: true,
    overwrite: false
  })

  /**
   * 执行智能补全匹配
   * @param {Array} recognizedList 已识别的列表
   * @param {Array} referenceList 参考名单
   * @returns {Object} 匹配结果 { matched, uncertain, unmatched }
   */
  const doAutoFillMatch = (recognizedList, referenceList) => {
    const matched = []
    const uncertain = []
    const unmatched = []

    // 用于记录已匹配的参考数据
    const usedRef = new Set()

    for (const recognized of recognizedList) {
      let bestMatch = null
      let matchType = ''

      // 清理识别结果中的不可见字符
      const recName = cleanStr(recognized.name)
      const recIdNumber = cleanStr(recognized.id_number)

      // 1. 证件号完全匹配（优先级最高）
      if (recIdNumber) {
        for (let i = 0; i < referenceList.length; i++) {
          if (usedRef.has(i)) continue
          const ref = referenceList[i]
          if (ref.id_number && ref.id_number === recIdNumber) {
            bestMatch = { ref, index: i }
            matchType = '证件号匹配'
            break
          }
        }
      }

      // 2. 姓名完全匹配
      if (!bestMatch && recName) {
        for (let i = 0; i < referenceList.length; i++) {
          if (usedRef.has(i)) continue
          const ref = referenceList[i]
          if (ref.name && ref.name === recName) {
            bestMatch = { ref, index: i }
            matchType = '姓名匹配'
            break
          }
        }
      }

      // 3. 模糊匹配（如果开启）
      if (!bestMatch && matchOptions.value.fuzzyMatch && recName) {
        for (let i = 0; i < referenceList.length; i++) {
          if (usedRef.has(i)) continue
          const ref = referenceList[i]
          if (ref.name && isNameSimilar(recName, ref.name)) {
            bestMatch = { ref, index: i }
            matchType = '姓名相似（需确认）'
            break
          }
        }
      }

      // 处理匹配结果
      if (bestMatch) {
        const diff = calculateDiff(recognized, bestMatch.ref, matchOptions.value.overwrite)
        const hasDiff = Object.keys(diff).length > 0

        if (matchType.includes('需确认')) {
          uncertain.push({
            recognized,
            reference: bestMatch.ref,
            refIndex: bestMatch.index,
            matchType,
            diff,
            hasDiff,
            name: recName || bestMatch.ref.name
          })
        } else {
          matched.push({
            recognized,
            reference: bestMatch.ref,
            refIndex: bestMatch.index,
            matchType,
            diff,
            hasDiff,
            name: recName || bestMatch.ref.name
          })
          usedRef.add(bestMatch.index)
        }
      } else {
        unmatched.push(recognized)
      }
    }

    return { matched, uncertain, unmatched }
  }

  /**
   * 执行名单对比
   * @param {Array} list1 识别名单
   * @param {Array} list2 参考名单
   * @returns {Object} 对比结果 { matched, missing, extra }
   */
  const doCompare = (list1, list2) => {
    const matched = []
    const missing = []
    const extra = []

    // 已匹配的索引
    const matched1 = new Set()
    const matched2 = new Set()

    // 遍历对比
    for (let i = 0; i < list1.length; i++) {
      if (matched1.has(i)) continue

      for (let j = 0; j < list2.length; j++) {
        if (matched2.has(j)) continue

        const result = isSamePerson(list1[i], list2[j])
        if (result.match) {
          matched.push({
            ...list1[i],
            matchType: result.type
          })
          matched1.add(i)
          matched2.add(j)
          break
        }
      }
    }

    // 未匹配的识别名单 = 多余
    for (let i = 0; i < list1.length; i++) {
      if (!matched1.has(i)) {
        extra.push(list1[i])
      }
    }

    // 未匹配的参考名单 = 缺少
    for (let j = 0; j < list2.length; j++) {
      if (!matched2.has(j)) {
        missing.push(list2[j])
      }
    }

    return { matched, missing, extra }
  }

  return {
    matchOptions,
    doAutoFillMatch,
    doCompare
  }
}
