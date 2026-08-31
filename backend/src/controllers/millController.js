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
    if (!name || !name.trim()) {
      res.status(400);
      throw new Error("Textile Mill Name is required.");
    }
    const finalCode = (code && code.trim()) ? code.trim().toUpperCase() : `MILL-${Date.now().toString().slice(-4)}`;
    const mill = await Mill.create({
      name: name.trim(),
      code: finalCode,
      zone: zone || "Korangi Industrial Area, Karachi",
      contactPerson: (contactPerson && contactPerson.trim()) ? contactPerson.trim() : "-",
      phone: (phone && phone.trim()) ? phone.trim() : "-",
      ntnNumber: ntnNumber || "",
      contractRatePerLiter: Number(contractRatePerLiter) || 0,
      creditLimit: Number(creditLimit) || 500000,
      address: address || "",
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
