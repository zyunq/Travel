const express = require('express');
const router = express.Router();
const multer = require('multer');
const prisma = require('../prisma/client');
const { parseExcel } = require('../utils/excelParser');
const { determineTicketType } = require('../utils/ticketType');
const { generateTemplate } = require('../utils/templateGenerator');
const { normalizeMemberPrice } = require('../utils/memberPayload');
const { appendGroupNote, appendGroupNotes } = require('../utils/groupNotes');
const { requireAuth } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });
router.use(requireAuth);

async function ownedGroup(groupId, userId) {
  return prisma.group.findFirst({ where: { id: parseInt(groupId), ownerId: userId } });
}

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
  if (!await ownedGroup(groupId, req.user.id)) return res.status(404).json({ error: '行程不存在' });
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
    const group = await ownedGroup(groupId, req.user.id);

    if (!group) {
      return res.status(404).json({ error: '行程不存在' });
    }

    console.log('收到新增成员请求:', req.body);

    const { idType, name, idNumber, date, trainNo, departStation, arriveStation, seatClass, carriage, seatNo, price: inputPrice, orderNo, ticketType: inputTicketType } = req.body;
    const price = normalizeMemberPrice(inputPrice);

    // 优先使用前端传来的票型，否则自动判断
    let ticketType = inputTicketType;
    if (!ticketType) {
      ticketType = determineTicketType(price, group.adultPrice);
    }

    console.log('票型:', ticketType, '前端传入:', inputTicketType);

    const member = await prisma.$transaction(async (tx) => {
      const currentGroup = await tx.group.findFirst({ where: { id: parseInt(groupId), ownerId: req.user.id } });
      if (!currentGroup) {
        throw Object.assign(new Error('行程不存在'), { status: 404 });
      }

      const createdMember = await tx.member.create({
        data: {
          groupId: parseInt(groupId),
          idType: idType || '二代',
          name,
          idNumber,
          date: date || currentGroup.departDate,
          trainNo: trainNo || currentGroup.trainNo || '',
          departStation: departStation || currentGroup.route?.split('-')[0] || '',
          arriveStation: arriveStation || currentGroup.route?.split('-')[1] || '',
          seatClass: seatClass || '二等座',
          carriage: carriage || '',
          seatNo: seatNo || '',
          price,
          orderNo: orderNo || '',
          ticketType,
          status: '正常'
        }
      });

      await tx.group.update({
        where: { id: parseInt(groupId) },
        data: {
          serviceFeeCount: { increment: 1 },
          notes: appendGroupNote(currentGroup.notes, 'add', name, price)
        }
      });

      return createdMember;
    });

    console.log('创建成员成功:', member.id);

    console.log('更新购票张数和备注成功');

    res.json(member);
  } catch (error) {
    console.error('新增成员失败:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

// 批量导入人员
router.post('/groups/:groupId/members/import', upload.single('file'), async (req, res) => {
  const { groupId } = req.params;
  const group = await ownedGroup(groupId, req.user.id);

  if (!req.file) {
    return res.status(400).json({ error: '请上传文件' });
  }

  if (!group) {
    return res.status(404).json({ error: '行程不存在' });
  }

  const result = parseExcel(req.file.path, group.adultPrice);
  const members = result.members;

  const importResult = await prisma.$transaction(async (tx) => {
    const currentGroup = await tx.group.findFirst({ where: { id: parseInt(groupId), ownerId: req.user.id } });
    if (!currentGroup) throw Object.assign(new Error('行程不存在'), { status: 404 });

    const created = await tx.member.createMany({
      data: members.map(m => ({ ...m, groupId: parseInt(groupId) }))
    });
    await tx.group.update({
      where: { id: parseInt(groupId) },
      data: {
        serviceFeeCount: { increment: created.count },
        notes: appendGroupNotes(currentGroup.notes, members.map(m => ({
          action: 'add', name: m.name, price: m.price
        })))
      }
    });
    return created;
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

  const member = await prisma.member.findUnique({ where: { id: parseInt(id) } });
  if (!member || !await ownedGroup(member.groupId, req.user.id)) return res.status(404).json({ error: '乘客不存在' });
  const updated = await prisma.member.update({ where: { id: parseInt(id) }, data: updateData });
  res.json(updated);
});

// 删除人员
router.delete('/members/:id', async (req, res) => {
  const { id } = req.params;
  const member = await prisma.member.findUnique({ where: { id: parseInt(id) } });
  if (!member || !await ownedGroup(member.groupId, req.user.id)) return res.status(404).json({ error: '乘客不存在' });
  await prisma.member.delete({ where: { id: parseInt(id) } });
  res.json({ success: true });
});

// 人员退票
router.put('/members/:id/refund', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({ where: { id: parseInt(id) } });
      if (!member) throw Object.assign(new Error('乘客不存在'), { status: 404 });
      const owned = await tx.group.findFirst({ where: { id: member.groupId, ownerId: req.user.id } });
      if (!owned) throw Object.assign(new Error('乘客不存在'), { status: 404 });
      if (member.status === '退票') return member;

      const group = await tx.group.findUnique({ where: { id: member.groupId } });
      if (!group) throw Object.assign(new Error('行程不存在'), { status: 404 });

      const updatedMember = await tx.member.update({
        where: { id: parseInt(id) },
        data: { status: '退票' }
      });
      await tx.group.update({
        where: { id: member.groupId },
        data: { notes: appendGroupNote(group.notes, 'refund', member.name, member.price) }
      });
      return updatedMember;
    });
    res.json(result);
  } catch (error) {
    if (!error.status || error.status >= 500) console.error('退票失败:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

module.exports = router;
