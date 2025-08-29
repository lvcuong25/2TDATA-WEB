import FieldPreference from '../model/fieldPreference.js';
import mongoose from 'mongoose';

// Get field preferences for a table
const getFieldPreference = async (req, res) => {
  try {
    const { tableId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tableId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid table ID'
      });
    }

    // Find existing preference or create default
    let preference = await FieldPreference.findOne({ tableId });

    if (!preference) {
      // Create default preference
      preference = new FieldPreference({
        tableId,
        fieldVisibility: {},
        showSystemFields: false
      });
      await preference.save();
    }

    res.json({
      success: true,
      data: preference
    });
  } catch (error) {
    console.error('Error getting field preference:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Save field preferences for a table
const saveFieldPreference = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { fieldVisibility, showSystemFields } = req.body;

    if (!mongoose.Types.ObjectId.isValid(tableId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid table ID'
      });
    }

    // Validate input
    if (typeof fieldVisibility !== 'object' || typeof showSystemFields !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Invalid field preference data'
      });
    }

    // Find existing preference or create new one
    let preference = await FieldPreference.findOne({ tableId });

    if (preference) {
      // Update existing preference
      preference.fieldVisibility = fieldVisibility;
      preference.showSystemFields = showSystemFields;
      preference.updatedAt = new Date();
    } else {
      // Create new preference
      preference = new FieldPreference({
        tableId,
        fieldVisibility,
        showSystemFields
      });
    }

    await preference.save();

    res.json({
      success: true,
      data: preference,
      message: 'Field preference saved successfully'
    });
  } catch (error) {
    console.error('Error saving field preference:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete field preferences for a table
const deleteFieldPreference = async (req, res) => {
  try {
    const { tableId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tableId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid table ID'
      });
    }

    const result = await FieldPreference.deleteOne({ tableId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Field preference not found'
      });
    }

    res.json({
      success: true,
      message: 'Field preference deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting field preference:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export {
  getFieldPreference,
  saveFieldPreference,
  deleteFieldPreference
};
