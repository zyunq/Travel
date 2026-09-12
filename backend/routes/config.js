const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// 获取费用配置
router.get('/', async (req, res) => {
  let config = await prisma.feeConfig.findUnique({ where: { userId: req.user.id } });
  if (!config) {
    config = await prisma.feeConfig.create({ data: { userId: req.user.id } });
  }
  res.json(config);
});

// 修改费用配置
router.put('/', async (req, res) => {
  const { serviceFee, refundServiceFee, foreignIdVerify, electronicInvoice } = req.body;
  const config = await prisma.feeConfig.upsert({
    where: { userId: req.user.id },
    update: {
      serviceFee,
      refundServiceFee,
      foreignIdVerify,
      electronicInvoice
    },
    create: {
      userId: req.user.id,
      serviceFee,
      refundServiceFee,
      foreignIdVerify,
      electronicInvoice
    }
  });
  res.json(config);
});

module.exports = router;
