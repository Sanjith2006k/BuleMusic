import { Request, Response } from "express";
import { updateAdminCredentials, getAdminCredentials } from "../services/admin.service";

export const updateAdmin = (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const updated = updateAdminCredentials(username, password);
    res.json({ message: "Admin credentials updated", username: updated.username });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const verifyAdmin = (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const current = getAdminCredentials();
    if (username === current.username && password === current.password) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};
