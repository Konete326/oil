import { PosSale } from "../models/posSaleModel.js";
import { Customer } from "../models/customerModel.js";
import { CashTransaction } from "../models/cashModel.js";
import { SystemLog } from "../models/systemLogModel.js";

const adjustCustomerBalance = async (name, amt) => {
  if (name && name !== "Walk-in Customer") {
    await Customer.findOneAndUpdate({ name }, { $inc: { currentBalance: amt } });
  }
};

export const updatePosSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      customerName,
      customerPhone,
      paymentMode,
      cashReceived,
      notes,
      isVasooli,
      vasooliAmount,
      vasooliPaymentMode,
    } = req.body;

    const sale = await PosSale.findById(id);
    if (!sale) {
      res.status(404);
      throw new Error("POS Sale not found");
    }

    const oldName = sale.customerName?.trim();
    const newName = (customerName || sale.customerName)?.trim();
    const oldMode = sale.paymentMode;
    const newMode = paymentMode || sale.paymentMode;

    const wasCredit = (oldMode || "").toLowerCase().includes("credit") || (oldMode || "").toLowerCase().includes("khata");
    const isNowCredit = (newMode || "").toLowerCase().includes("credit") || (newMode || "").toLowerCase().includes("khata");

    if (isVasooli && Number(vasooliAmount) > 0) {
      const vAmt = Number(vasooliAmount);
      const vMode = vasooliPaymentMode || "Cash";

      sale.cashReceived = (Number(sale.cashReceived) || 0) + vAmt;
      if (sale.cashReceived >= sale.grandTotal) sale.paymentMode = vMode;
      await sale.save();

      if (wasCredit) await adjustCustomerBalance(oldName, -vAmt);

      await CashTransaction.create({
        type: "Received",
        partyName: oldName || "Customer Udhar Vasooli",
        amount: vAmt,
        category: "Customer Collection",
        referenceNo: sale.saleNumber,
        paymentMode: vMode,
        transactionDate: new Date(),
        notes: `Udhar Vasooli for ${sale.saleNumber} (${oldName || "Customer"})`,
      });

      await SystemLog.create({
        title: "Udhar Payment Received (Vasooli)",
        message: `Received Rs ${vAmt} via ${vMode} for POS Sale ${sale.saleNumber} (${oldName}).`,
        level: "info",
        source: "backend",
        userName: req.user?.name || "Admin",
        userRole: req.user?.role || "admin",
        metadata: { saleId: sale._id, saleNumber: sale.saleNumber, vasooliAmount: vAmt, paymentMode: vMode },
      });

      return res.status(200).json({ success: true, message: "Payment received and khata updated", data: sale });
    }

    if (wasCredit && !isNowCredit) {
      await adjustCustomerBalance(oldName, -Number(sale.grandTotal));
      await CashTransaction.create({
        type: "Received",
        partyName: newName || oldName,
        amount: Number(sale.grandTotal),
        category: "Customer Collection",
        referenceNo: sale.saleNumber,
        paymentMode: newMode,
        transactionDate: new Date(),
        notes: `Udhar marked as Paid via ${newMode} for bill ${sale.saleNumber}`,
      });
    } else if (!wasCredit && isNowCredit) {
      await adjustCustomerBalance(newName, Number(sale.grandTotal));
    } else if (wasCredit && isNowCredit && oldName !== newName) {
      await adjustCustomerBalance(oldName, -Number(sale.grandTotal));
      await adjustCustomerBalance(newName, Number(sale.grandTotal));
    }

    if (customerName) sale.customerName = customerName.trim();
    if (customerPhone !== undefined) sale.customerPhone = customerPhone.trim();
    if (paymentMode) sale.paymentMode = paymentMode;
    if (cashReceived !== undefined) sale.cashReceived = Number(cashReceived);
    if (notes !== undefined) sale.notes = notes;
    await sale.save();

    await SystemLog.create({
      title: "POS Sale Updated",
      message: `Sale ${sale.saleNumber} updated by ${req.user?.name || "Admin"}. Customer: ${sale.customerName}, Mode: ${sale.paymentMode}.`,
      level: "info",
      source: "backend",
      userName: req.user?.name || "Admin",
      userRole: req.user?.role || "admin",
      metadata: { saleId: sale._id, saleNumber: sale.saleNumber },
    });

    res.status(200).json({ success: true, message: "Sale updated successfully", data: sale });
  } catch (error) {
    next(error);
  }
};
