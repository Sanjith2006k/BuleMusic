import { Router } from "express";
import { updateAdmin, verifyAdmin, uploadSong, deleteSong } from "../controllers/admin.controller";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.put("/update", updateAdmin);
router.post("/verify", verifyAdmin);
router.post("/upload", upload.array("files", 50), uploadSong);
router.delete("/song", deleteSong);

export default router;
