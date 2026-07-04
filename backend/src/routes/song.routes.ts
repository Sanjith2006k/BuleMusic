import { Router } from "express";
import { getSongs, updateSong, refreshSongs } from "../controllers/song.controller";

const router = Router();

router.get("/", getSongs);
router.post("/refresh", refreshSongs);
router.put("/:id", updateSong);

export default router;
