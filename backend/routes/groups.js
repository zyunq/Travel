const express = require('express');
const router = express.Router();
const multer = require('multer');
const prisma = require('../prisma/client');
const { parseExcel } = require('../utils/excelParser');

const upload = multer({ dest: 'uploads/' });

// 获取旅游团列表
router.get('/', async (req, res) => {
  const groups = await prisma.group.findMany({
    orderBy: [{ category: 'asc' }, { groupName: 'asc' }, { tripType: 'asc' }],
    include: {
      _count: { select: { members: true } }
    }
  });
  res.json(groups);
});

// 获取所有分类
router.get('/categories', async (req, res) => {
  const groups = await prisma.group.findMany({
    select: { category: true },
    distinct: ['category']
  });
  res.json(groups.filter(g => g.category).map(g => g.category));
});

// 合并团到分类
router.post('/merge', async (req, res) => {
  const { category, groupNames } = req.body;

  if (!category || !groupNames || groupNames.length === 0) {
    return res.status(400).json({ error: '请填写分类名称并选择团' });
  }

  const result = await prisma.group.updateMany({
    where: {
      groupName: { in: groupNames }
    },
    data: { category }
  });

  res.json({ success: true, count: result.count });
});

// 删除分类（必须在 /:id 之前）
router.delete('/category/:category', async (req, res) => {
  const { category } = req.params;

  const result = await prisma.group.updateMany({
    where: { category },
    data: { category: null }
  });

  res.json({ success: true, count: result.count });
});

// 获取所有团名
router.get('/group-names', async (req, res) => {
  const groups = await prisma.group.findMany({
    select: { groupName: true },
    distinct: ['groupName']
  });
  res.json(groups.map(g => g.groupName));
});

// 按团名获取所有行程 - 必须在 /:id 之前
router.get('/by-name/:groupName', async (req, res) => {
  const { groupName } = req.params;
  const trips = await prisma.group.findMany({
    where: { groupName },
    orderBy: { tripType: 'asc' },
    include: { members: true }
  });

  if (trips.length === 0) {
    return res.status(404).json({ error: '团不存在' });
  }

  const config = await prisma.feeConfig.findUnique({ where: { id: 1 } });

  const tripsWithSummary = trips.map(trip => {
    const adultCount = trip.members.filter(m => m.ticketType === '成人' && m.status === '正常').length;
    const childCount = trip.members.filter(m => m.ticketType === '儿童' && m.status === '正常').length;
    const refundCount = trip.members.filter(m => m.status === '退票').length;

    // 购票服务费人数：使用累计值（只增不减）
    const serviceFeeCount = trip.serviceFeeCount || trip.members.length;

    const ticketTotal = adultCount * trip.adultPrice + childCount * trip.childPrice;
    const serviceFee = serviceFeeCount * (config?.serviceFee || 10);
    const refundFee = refundCount * (config?.refundServiceFee || 20);
    const verifyFee = trip.verifyCount * (config?.foreignIdVerify || 8);
    const total = ticketTotal + serviceFee + refundFee + verifyFee;

    return {
      ...trip,
      summary: { adultCount, childCount, refundCount, serviceFeeCount, ticketTotal, serviceFee, refundFee, verifyFee, total }
    };
  });

  // 合并总计
  const totalSummary = {
    adultCount: tripsWithSummary.reduce((sum, t) => sum + t.summary.adultCount, 0),
    childCount: tripsWithSummary.reduce((sum, t) => sum + t.summary.childCount, 0),
    ticketTotal: tripsWithSummary.reduce((sum, t) => sum + t.summary.ticketTotal, 0),
    serviceFee: tripsWithSummary.reduce((sum, t) => sum + t.summary.serviceFee, 0),
    refundFee: tripsWithSummary.reduce((sum, t) => sum + t.summary.refundFee, 0),
    verifyFee: tripsWithSummary.reduce((sum, t) => sum + t.summary.verifyFee, 0),
    total: tripsWithSummary.reduce((sum, t) => sum + t.summary.total, 0)
  };

  res.json({ groupName, trips: tripsWithSummary, totalSummary, config: config || {} });
});

// 获取团详情（含费用汇总）
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const group = await prisma.group.findUnique({
    where: { id: parseInt(id) },
    include: { members: true }
  });

  if (!group) {
    return res.status(404).json({ error: '团不存在' });
  }

  const adultCount = group.members.filter(m => m.ticketType === '成人' && m.status === '正常').length;
  const childCount = group.members.filter(m => m.ticketType === '儿童' && m.status === '正常').length;
  const refundCount = group.members.filter(m => m.status === '退票').length;

  // 购票服务费人数：使用累计值（只增不减），如果为空则用当前成员数
  const serviceFeeCount = (group.serviceFeeCount != null && group.serviceFeeCount > 0)
    ? group.serviceFeeCount
    : group.members.length;

  const config = await prisma.feeConfig.findUnique({ where: { id: 1 } });

  const ticketTotal = adultCount * group.adultPrice + childCount * group.childPrice;
  const serviceFee = serviceFeeCount * (config?.serviceFee || 10);
  const refundFee = refundCount * (config?.refundServiceFee || 20);
  const verifyFee = group.verifyCount * (config?.foreignIdVerify || 8);
  const total = ticketTotal + serviceFee + refundFee + verifyFee;

  res.json({
    ...group,
    summary: { adultCount, childCount, refundCount, serviceFeeCount, ticketTotal, serviceFee, refundFee, verifyFee, total },
    config
  });
});

// 编辑旅游团
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, groupName, tripType, departDate, trainNo, route, adultPrice, childPrice, verifyCount } = req.body;
  const group = await prisma.group.update({
    where: { id: parseInt(id) },
    data: { name, groupName, tripType, departDate, trainNo, route, adultPrice, childPrice, verifyCount }
  });
  res.json(group);
});

// 删除旅游团
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.group.delete({ where: { id: parseInt(id) } });
  res.json({ success: true });
});

// 复制团信息
router.get('/:id/copy', async (req, res) => {
  const { id } = req.params;
  const group = await prisma.group.findUnique({
    where: { id: parseInt(id) },
    include: { members: true }
  });

  if (!group) {
    return res.status(404).json({ error: '团不存在' });
  }

  const adultCount = group.members.filter(m => m.ticketType === '成人' && m.status === '正常').length;
  const childCount = group.members.filter(m => m.ticketType === '儿童' && m.status === '正常').length;
  const refundCount = group.members.filter(m => m.status === '退票').length;

  // 购票服务费人数：使用累计值（只增不减）
  const serviceFeeCount = group.serviceFeeCount || group.members.length;

  const config = await prisma.feeConfig.findUnique({ where: { id: 1 } });

  const ticketTotal = adultCount * group.adultPrice + childCount * group.childPrice;
  const serviceFee = serviceFeeCount * (config?.serviceFee || 10);
  const refundFee = refundCount * (config?.refundServiceFee || 20);
  const verifyFee = group.verifyCount * (config?.foreignIdVerify || 8);
  const total = ticketTotal + serviceFee + refundFee + verifyFee;

  const text = `团名：${group.name}
车次：${group.trainNo}
行程：${group.route}
出发日期：${group.departDate}

成人票：${adultCount}张 × ${group.adultPrice}元 = ${adultCount * group.adultPrice}元
儿童票：${childCount}张 × ${group.childPrice}元 = ${childCount * group.childPrice}元
────────────────────
票价小计：${ticketTotal}元
购票服务费：${serviceFeeCount}张 × ${config?.serviceFee || 10}元 = ${serviceFee}元
退票服务费：${refundCount}张 × ${config?.refundServiceFee || 20}元 = ${refundFee}元
核验费：${group.verifyCount}次 × ${config?.foreignIdVerify || 8}元 = ${verifyFee}元
────────────────────
共计：${total}元`;

  res.json({ text });
});

// 导入 Excel 并自动创建旅游团
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' });
    }

    const { groupName, tripType } = req.body;

    if (!groupName) {
      return res.status(400).json({ error: '请填写团名' });
    }

    // 第一次解析：只提取票价数据，不判断票型（adultPrice传0）
    const tempResult = parseExcel(req.file.path, 0);
    const tempMembers = tempResult.members;

    if (tempMembers.length === 0) {
      return res.status(400).json({ error: 'Excel 文件中没有有效数据' });
    }

    const firstMember = tempMembers[0];
    const trainNo = firstMember.trainNo || '';
    const route = `${firstMember.departStation || ''}-${firstMember.arriveStation || ''}`;
    const dates = tempResult.dates;
    const departDate = dates[0] || '';

    // 找出最高票价作为成人票价，最低票价作为儿童票价
    const prices = tempMembers.map(m => m.price).filter(p => p > 0);
    const adultPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const childPrice = prices.length > 0 ? Math.min(...prices) : 0;

    console.log(`识别成人票价: ${adultPrice}, 儿童票价: ${childPrice}`);

    // 第二次解析：用正确的成人票价判断票型
    const result = parseExcel(req.file.path, adultPrice);
    const members = result.members;

    const group = await prisma.group.create({
      data: {
        name: groupName,
        groupName,
        tripType: tripType || '去程',
        departDate,
        trainNo,
        route,
        adultPrice,
        childPrice,
        verifyCount: 0,
        serviceFeeCount: members.length,  // 初始购票张数
        members: { create: members }
      },
      include: { members: true }
    });

    res.json({
      groupId: group.id,
      groupName: group.groupName,
      memberCount: group.members.length,
      adultPrice,
      childPrice,
      departDate
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 导出座位表 Excel - 使用Python工具
router.get('/:id/seats', async (req, res) => {
  const { id } = req.params;
  const group = await prisma.group.findUnique({
    where: { id: parseInt(id) },
    include: { members: true }
  });

  if (!group) {
    return res.status(404).json({ error: '团不存在' });
  }

  console.log(`\n========================================`);
  console.log(`开始导出座位表 (Python专业版): 团ID=${id}, 团名=${group.name}`);
  console.log(`总人数: ${group.members.length}`);

  try {
    const ExcelJS = require('exceljs');
    const { spawn } = require('child_process');
    const path = require('path');
    const fs = require('fs');

    // 创建临时Excel文件用于Python处理
    const tempInputPath = path.join(__dirname, '../uploads', `temp_input_${id}.xlsx`);
    const tempOutputPath = path.join(__dirname, '../uploads', `temp_output_${id}.xlsx`);

    // 写入临时输入文件
    const tempWb = new ExcelJS.Workbook();
    const tempWs = tempWb.addWorksheet('Sheet1');

    // 写入表头
    const headers = ['序号', '证件', '姓名', '证件号码', '日期', '车次', '发站', '到站', '席别', '车厢', '座号', '票价', '订单号'];
    tempWs.addRow(headers);

    // 写入数据
    group.members.forEach((member, idx) => {
      tempWs.addRow([
        idx + 1,
        member.idType,
        member.name,
        member.idNumber,
        member.date,
        member.trainNo,
        member.departStation,
        member.arriveStation,
        member.seatClass,
        member.carriage,
        member.seatNo,
        member.price,
        member.orderNo
      ]);
    });

    await tempWb.xlsx.writeFile(tempInputPath);

    // 调用Python脚本
    const pythonScript = path.join(__dirname, '../../tools/generate_seat_excel.py');

    if (!fs.existsSync(pythonScript)) {
      throw new Error('Python脚本不存在: ' + pythonScript);
    }

    const result = await new Promise((resolve, reject) => {
      const python = spawn('python3', [pythonScript, tempInputPath, tempOutputPath]);

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
          resolve(output);
        } else {
          reject(new Error(`Python脚本执行失败: ${errorOutput || output}`));
        }
      });

      python.on('error', (err) => {
        reject(new Error(`无法执行Python脚本: ${err.message}`));
      });
    });

    console.log('Python输出:', result);

    // 读取生成的文件并发送给客户端
    if (!fs.existsSync(tempOutputPath)) {
      throw new Error('Python脚本未生成输出文件');
    }

    const fileBuffer = fs.readFileSync(tempOutputPath);

    // 清理临时文件
    fs.unlinkSync(tempInputPath);
    fs.unlinkSync(tempOutputPath);

    // 文件名
    const routeParts = (group.route || '').split('-');
    const startStation = routeParts[0] || '';
    const endStation = routeParts[1] || '';
    const groupName = group.groupName || group.name || '未知';
    const fileName = `${groupName}团 ${startStation}-${endStation} 座位表.xlsx`;

    console.log(`\n✓ 导出完成: ${fileName}`);
    console.log(`========================================\n`);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.send(fileBuffer);

  } catch (error) {
    console.error('导出失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
