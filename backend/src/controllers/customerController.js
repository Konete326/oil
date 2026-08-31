import { Customer } from "../models/customerModel.js";
import { connectDB } from "../config/db.js";

export const getCustomers = async (req, res, next) => {
  try {
    await connectDB();
    const { search, customerType, status, page = 1, limit = 20 } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ];
    }
    if (customerType) query.customerType = customerType;
    if (status) query.status = status;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, customers] = await Promise.all([
      Customer.countDocuments(query),
      Customer.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    await connectDB();
    const { name, phone, email, address, city, customerType, creditLimit, openingBalance, currentBalance, notes } = req.body;
    if (!name || !name.trim()) {
      res.status(400);
      throw new Error("Customer name is required.");
    }
    const existing = await Customer.findOne({ name: name.trim() });
    if (existing) {
      res.status(400);
      throw new Error("A customer with this name already exists.");
    }
    const initialBalance = currentBalance !== undefined ? currentBalance : openingBalance;
    const customer = await Customer.create({
      name: name.trim(),
      phone: phone || "",
      email: email || "",
      address: address || "",
      city: city || "",
      customerType: customerType || "Retail",
      creditLimit: Number(creditLimit) || 0,
      currentBalance: Number(initialBalance) || 0,
      notes: notes || "",
    });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { name, phone, email, address, city, customerType, creditLimit, currentBalance, status, notes } = req.body;
    const customer = await Customer.findById(id);
    if (!customer) {
      res.status(404);
      throw new Error("Customer not found.");
    }
    if (name && name.trim() !== customer.name) {
      const existing = await Customer.findOne({ name: name.trim() });
      if (existing) {
        res.status(400);
        throw new Error("A customer with this name already exists.");
      }
      customer.name = name.trim();
    }
    if (phone !== undefined) customer.phone = phone;
    if (email !== undefined) customer.email = email;
    if (address !== undefined) customer.address = address;
    if (city !== undefined) customer.city = city;
    if (customerType !== undefined) customer.customerType = customerType;
    if (creditLimit !== undefined) customer.creditLimit = Number(creditLimit);
    if (currentBalance !== undefined) customer.currentBalance = Number(currentBalance);
    if (status !== undefined) customer.status = status;
    if (notes !== undefined) customer.notes = notes;

    await customer.save();
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    await connectDB();
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) {
      res.status(404);
      throw new Error("Customer not found.");
    }
    await Customer.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Customer deleted successfully." });
  } catch (error) {
    next(error);
  }
};
