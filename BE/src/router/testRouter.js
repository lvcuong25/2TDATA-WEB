import { Router } from "express";

const router = Router();


// Simple test endpoint
router.get("/test-simple", (req, res) => {
  res.json({ 
    success: true, 
    message: "testRouter works!",
    timestamp: new Date().toISOString()
  });
});

export default router;
