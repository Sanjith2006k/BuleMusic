import { Router } from "express";

import { createRoom, joinRoom } from "../controllers/room.controller";

const router = Router();

router.post("/create", createRoom);
router.post("/join", joinRoom);

export default router;
