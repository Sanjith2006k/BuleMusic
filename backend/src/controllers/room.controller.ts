import { Request, Response } from "express";
import roomService from "../services/room.service";
import { getAdminCredentials } from "../services/admin.service";

export const createRoom = (req: Request, res: Response) => {
  try {
    const { hostName, username, password } = req.body;
    const adminCreds = getAdminCredentials();

    if (username !== adminCreds.username || password !== adminCreds.password) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const room = roomService.createRoom(hostName);

    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const joinRoom = (req: Request, res: Response) => {
  try {
    const { code, name } = req.body;

    const room = roomService.joinRoom(code, name);

    const member = room.members[room.members.length - 1];

    res.json({ room, member });
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
};
