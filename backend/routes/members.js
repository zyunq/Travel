const express = require('express');
const router = express.Router();
const multer = require('multer');
const prisma = require('../prisma/client');
const { parseExcel } = require('../utils/excelParser');
const { determineTicketType } = require('../utils/ticketType');
const { generateTemplate } = require('../utils/templateGenerator');

const upload = multer({ dest: 'uploads/' });

// 下载导入模板
router.get('/template', (req, res) => {
  const buffer = generateTemplate();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=import_template.xlsx');
  res.send(buffer);
});

// 获取人员列表
router.get('/groups/:groupId/members', async (req, res) => {
  const { groupId } = req.params;
  const members = await prisma.member.findMany({
    where: { groupId: parseInt(groupId) },
    orderBy: { id: 'asc' }
  });
  res.json(members);
});

// 新增人员
router.post('/groups/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await prisma.group.findUnique({ where: { id: parseInt(groupId) } });

    console.log('收到新增成员请求:', req.body);

    const { idType, name, idNumber, date, trainNo, departStation, arriveStation, seatClass, carriage, seatNo, price, orderNo, ticketType: inputTicketType } = req.body;

    // 优先使用前端传来的票型，否则自动判断
    let ticketType = inputTicketType;
    if (!ticketType) {
      ticketType = determineTicketType(idType, idNumber, price, group.adultPrice);
    }

    console.log('票型:', ticketType, '前端传入:', inputTicketType);

    const member = await prisma.member.create({
      data: {
        groupId: parseInt(groupId),
        idType: idType || '二代',
        name,
        idNumber,
        date: date || group.departDate,
        trainNo: trainNo || group.trainNo || '',
        departStation: departStation || group.route?.split('-')[0] || '',
        arriveStation: arriveStation || group.route?.split('-')[1] || '',
        seatClass: seatClass || '二等座',
        carriage: carriage || '',
        seatNo: seatNo || '',
        price: price || 0,
        orderNo: orderNo || '',
        ticketType,
        status: '正常'
      }
    });

    console.log('创建成员成功:', member.id);

    // 购票张数 +1
    await prisma.group.update({
      where: { id: parseInt(groupId) },
      data: { serviceFeeCount: { increment: 1 } }
    });

    console.log('更新购票张数成功');

    res.json(member);
  } catch (error) {
    console.error('新增成员失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 批量导入人员
router.post('/groups/:groupId/members/import', upload.single('file'), async (req, res) => {
  const { groupId } = req.params;
  const group = await prisma.group.findUnique({ where: { id: parseInt(groupId) } });

  if (!req.file) {
    return res.status(400).json({ error: '请上传文件' });
  }

  const result = parseExcel(req.file.path, group.adultPrice);
  const members = result.members;

  const importResult = await prisma.member.createMany({
    data: members.map(m => ({
      ...m,
      groupId: parseInt(groupId)
    }))
  });

  // 购票张数增加
  await prisma.group.update({
    where: { id: parseInt(groupId) },
    data: { serviceFeeCount: { increment: importResult.count } }
  });

  res.json({ imported: importResult.count });
});

// 编辑人员
router.put('/members/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = {};

  const allowedFields = ['idType', 'name', 'idNumber', 'date', 'trainNo', 'departStation', 'arriveStation', 'seatClass', 'carriage', 'seatNo', 'price', 'orderNo', 'ticketType'];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  const member = await prisma.member.update({
    where: { id: parseInt(id) },
    data: updateData
  });
  res.json(member);
});

// 删除人员
router.delete('/members/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.member.delete({ where: { id: parseInt(id) } });
  res.json({ success: true });
});

// 人员退票
router.put('/members/:id/refund', async (req, res) => {
  const { id } = req.params;
  const member = await prisma.member.update({
    where: { id: parseInt(id) },
    data: { status: '退票' }
  });
  res.json(member);
});

module.exports = router;
