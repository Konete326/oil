import { Mill } from "../models/millModel.js";

export const getMills = async (req, res, next) => {
  try {
    const mills = await Mill.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: mills.length, data: mills });
  } catch (error) {
    next(error);
  }
};

export const createMill = async (req, res, next) => {
  try {
    const { name, code, zone, contactPerson, phone, ntnNumber, contractRatePerLiter, creditLimit, address } = req.body;
    if (!name || !code || !contactPerson || !phone || contractRatePerLiter === undefined) {
      res.status(400);
      throw new Error("Mill Name, Code, Contact Person, Phone, and Contract Rate are required.");
    }
    const mill = await Mill.create({
      name,
      code: code.toUpperCase(),
      zone: zone || "Korangi Industrial Area",
      contactPerson,
      phone,
      ntnNumber,
      contractRatePerLiter: Number(contractRatePerLiter),
      creditLimit: Number(creditLimit) || 500000,
      address,
    });
    res.status(201).json({ success: true, data: mill });
  } catch (error) {
    next(error);
  }
};

export const updateMill = async (req, res, next) => {
  try {
    const mill = await Mill.findById(req.params.id);
    if (!mill) {
      res.status(404);
      throw new Error("Textile Mill profile not found");
    }
    Object.assign(mill, req.body);
    await mill.save();
    res.status(200).json({ success: true, data: mill });
  } catch (error) {
    next(error);
  }
};

export const deleteMill = async (req, res, next) => {
  try {
    const mill = await Mill.findById(req.params.id);
    if (!mill) {
      res.status(404);
      throw new Error("Textile Mill profile not found");
    }
    await mill.deleteOne();
    res.status(200).json({ success: true, message: "Textile Mill profile deleted" });
  } catch (error) {
    next(error);
  }
};
