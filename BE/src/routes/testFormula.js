import express from 'express';
import exprEvalEngine from '../utils/exprEvalEngine.js';

const router = express.Router();

// Test formula endpoint
router.post('/test-formula', (req, res) => {
  try {
    const { formula, testData = {} } = req.body;
    
    if (!formula) {
      return res.status(400).json({ error: 'Formula is required' });
    }

    // Test the formula with sample data
    const result = exprEvalEngine.testFormula(formula, testData);
    
    res.json({
      success: true,
      formula,
      result: result.result,
      error: result.error,
      availableFunctions: exprEvalEngine.getAvailableFunctions().length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get available functions
router.get('/functions', (req, res) => {
  try {
    const categories = exprEvalEngine.getFunctionCategories();
    const functions = exprEvalEngine.getAvailableFunctions();
    
    res.json({
      success: true,
      totalFunctions: functions.length,
      categories,
      functions
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
