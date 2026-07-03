import { Router } from "express";
import { getSongs, updateSong } from "../controllers/song.controller";

const router = Router();

router.get("/", getSongs);
router.put("/:id", updateSong);

export default router;
