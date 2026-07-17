/**
 * OCR 证件识别路由
 * 通过调用 Python 脚本实现证件识别功能
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

// OCR 服务脚本路径
const OCR_SCRIPT = path.join(__dirname, '../ocr_service.py');
// Python 路径（使用系统 64 位 Python，已安装 paddleocr）
const PYTHON_PATH = 'python3';

/**
 * 调用 Python OCR 服务
 */
function callOCRSpec(command, args) {
  return new Promise((resolve, reject) => {
    const python = spawn(PYTHON_PATH, [OCR_SCRIPT, command, ...args]);

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(output));
        } catch (e) {
          reject(new Error(`JSON 解析错误: ${e.message}`));
        }
      } else {
        reject(new Error(`Python 脚本执行失败: ${errorOutput || output}`));
      }
    });

    python.on('error', (err) => {
      reject(new Error(`无法执行 Python 脚本: ${err.message}`));
    });
  });
}

/**
 * GET /api/ocr/types
 * 获取支持的证件类型
 */
router.get('/types', async (req, res) => {
  try {
    const result = await callOCRSpec('types', []);
    res.json(result);
  } catch (error) {
    console.error('OCR types error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ocr/recognize
 * 识别单张证件图片
 *
 * Body (multipart/form-data):
 * - file: 图片文件
 * - docType: 证件类型 (可选: id_card, hk_macao_pass, passport)
 */
router.post('/recognize', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传图片文件' });
    }

    const imagePath = req.file.path;
    const docType = req.body.docType || null;

    console.log(`[OCR] 开始识别: ${req.file.originalname}, 类型: ${docType || '自动检测'}`);

    const args = [imagePath];
    if (docType) {
      args.push(docType);
    }

    const result = await callOCRSpec('recognize', args);

    // 清理临时文件
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    if (result.success) {
      console.log(`[OCR] 识别成功: ${result.doc_type}, 姓名: ${result.data.name}`);
    } else {
      console.log(`[OCR] 识别失败: ${result.error}`);
    }

    res.json(result);

  } catch (error) {
    console.error('OCR recognize error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ocr/batch
 * 批量识别 ZIP 压缩包中的证件图片
 *
 * Body (multipart/form-data):
 * - file: ZIP 压缩包
 */
router.post('/batch', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传 ZIP 压缩包' });
    }

    const zipPath = req.file.path;

    console.log(`[OCR] 开始批量识别: ${req.file.originalname}`);

    const result = await callOCRSpec('batch', [zipPath]);

    // 清理临时文件
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }

    console.log(`[OCR] 批量识别完成: 成功 ${result.count || 0}, 失败 ${result.failed_count || 0}`);

    res.json(result);

  } catch (error) {
    console.error('OCR batch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ocr/recognize-base64
 * 识别 Base64 编码的图片
 *
 * Body (JSON):
 * - image: Base64 编码的图片数据
 * - docType: 证件类型 (可选)
 */
router.post('/recognize-base64', async (req, res) => {
  try {
    const { image, docType } = req.body;

    if (!image) {
      return res.status(400).json({ error: '请提供 Base64 编码的图片' });
    }

    // 解析 Base64 数据
    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: '无效的 Base64 图片格式' });
    }

    const ext = matches[1];
    const base64Data = matches[2];

    // 保存为临时文件
    const tempPath = path.join(__dirname, '../uploads', `ocr_temp_${Date.now()}.${ext}`);
    fs.writeFileSync(tempPath, Buffer.from(base64Data, 'base64'));

    console.log(`[OCR] 开始识别 Base64 图片`);

    const args = [tempPath];
    if (docType) {
      args.push(docType);
    }

    const result = await callOCRSpec('recognize', args);

    // 清理临时文件
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }

    res.json(result);

  } catch (error) {
    console.error('OCR recognize-base64 error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ocr/export
 * 导出识别结果到 Excel
 *
 * Body (JSON):
 * - results: 识别结果列表
 */
router.post('/export', async (req, res) => {
  try {
    const { results } = req.body;

    if (!results || results.length === 0) {
      return res.status(400).json({ error: '没有可导出的数据' });
    }

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('证件识别结果');

    // 定义表头
    const headers = ['序号', '姓名', '证件类型', '证件号码', '性别', '出生日期', '民族/国籍', '来源文件', '备注'];

    // 样式定义
    ws.columns = headers.map(header => ({
      header,
      key: header,
      width: header === '证件号码' ? 22 : header === '备注' ? 30 : 12
    }));

    // 设置表头样式
    ws.getRow(1).font = { bold: true, size: 12 };
    ws.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCFBF1' }
    };
    ws.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // 证件类型映射
    const typeMap = {
      'id_card': '身份证',
      'hk_macao_pass': '港澳通行证',
      'passport': '护照'
    };

    // 写入数据
    results.forEach((item, idx) => {
      const idNumber = item.id_number || item.passport_number || '';
      const nationOrNationality = item.nation || item.nationality || '';

      // 备注信息
      const notes = [];
      if (item.address) notes.push(`地址: ${item.address}`);
      if (item.valid_until) notes.push(`有效期: ${item.valid_until}`);
      if (item.issue_place) notes.push(`签发地: ${item.issue_place}`);

      ws.addRow([
        idx + 1,
        item.name || item.name_cn || '',
        typeMap[item.doc_type] || item.doc_type || '',
        idNumber,
        item.gender || '',
        item.birth_date || '',
        nationOrNationality,
        item.source_file || '',
        notes.join('; ')
      ]);
    });

    // 设置边框
    ws.eachRow((row, rowNum) => {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // 导出
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('证件识别结果.xlsx')}`);
    res.send(buffer);

  } catch (error) {
    console.error('OCR export error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
