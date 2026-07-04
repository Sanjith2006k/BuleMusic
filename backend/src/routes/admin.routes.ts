import { Router } from "express";
import { updateAdmin, verifyAdmin, uploadSong } from "../controllers/admin.controller";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.put("/update", updateAdmin);
router.post("/verify", verifyAdmin);
router.post("/upload", upload.single("file"), uploadSong);

export default router;
