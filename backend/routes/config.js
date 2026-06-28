const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');

// 获取费用配置
router.get('/', async (req, res) => {
  let config = await prisma.feeConfig.findUnique({ where: { id: 1 } });
  if (!config) {
    config = await prisma.feeConfig.create({ data: { id: 1 } });
  }
  res.json(config);
});

// 修改费用配置
router.put('/', async (req, res) => {
  const { serviceFee, refundServiceFee, foreignIdVerify, electronicInvoice } = req.body;
  const config = await prisma.feeConfig.upsert({
    where: { id: 1 },
    update: {
      serviceFee,
      refundServiceFee,
      foreignIdVerify,
      electronicInvoice
    },
    create: {
      id: 1,
      serviceFee,
      refundServiceFee,
      foreignIdVerify,
      electronicInvoice
    }
  });
  res.json(config);
});

module.exports = router;
