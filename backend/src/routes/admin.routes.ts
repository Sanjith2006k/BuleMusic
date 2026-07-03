import { Router } from "express";
import { updateAdmin, verifyAdmin } from "../controllers/admin.controller";

const router = Router();

router.put("/update", updateAdmin);
router.post("/verify", verifyAdmin);

export default router;
