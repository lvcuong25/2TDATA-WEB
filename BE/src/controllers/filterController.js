import FilterPreference from '../model/FilterPreference.js';
import Table from '../model/Table.js';

// Get filter preference for a table
export const getFilterPreference = async (req, res) => {
  try {
    const { tableId } = req.params;
    const userId = req.user._id;
    const siteId = req.siteId;

    // Verify table exists and belongs to user
    const table = await Table.findOne({
      _id: tableId,
      userId,
      siteId
    });

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Find existing filter preference or create default
    let filterPreference = await FilterPreference.findOne({
      tableId,
      userId,
      siteId
    });

    if (!filterPreference) {
      // Create default filter preference
      filterPreference = new FilterPreference({
        tableId,
        userId,
        siteId,
        filterRules: [],
        isActive: false
      });
      await filterPreference.save();
    }

    res.status(200).json({
      success: true,
      data: filterPreference
    });
  } catch (error) {
    console.error('Error getting filter preference:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Save filter preference
export const saveFilterPreference = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { filterRules, isActive } = req.body;
    const userId = req.user._id;
    const siteId = req.siteId;

    // Verify table exists and belongs to user
    const table = await Table.findOne({
      _id: tableId,
      userId,
      siteId
    });

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Validate filter rules
    if (!Array.isArray(filterRules)) {
      return res.status(400).json({ message: 'Filter rules must be an array' });
    }

    // Validate each filter rule
    for (const rule of filterRules) {
      if (!rule.field || !rule.operator || rule.value === undefined) {
        return res.status(400).json({ 
          message: 'Each filter rule must have field, operator, and value' 
        });
      }

      // Validate operator
      const validOperators = ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'is_empty', 'is_not_empty', 'is_null', 'is_not_null'];
      if (!validOperators.includes(rule.operator)) {
        return res.status(400).json({ 
          message: `Invalid operator: ${rule.operator}` 
        });
      }
    }

    // Find existing filter preference or create new one
    let filterPreference = await FilterPreference.findOne({
      tableId,
      userId,
      siteId
    });

    if (filterPreference) {
      // Update existing preference
      filterPreference.filterRules = filterRules;
      filterPreference.isActive = isActive !== undefined ? isActive : filterPreference.isActive;
      await filterPreference.save();
    } else {
      // Create new preference
      filterPreference = new FilterPreference({
        tableId,
        userId,
        siteId,
        filterRules,
        isActive: isActive !== undefined ? isActive : false
      });
      await filterPreference.save();
    }

    res.status(200).json({
      success: true,
      message: 'Filter preference saved successfully',
      data: filterPreference
    });
  } catch (error) {
    console.error('Error saving filter preference:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete filter preference
export const deleteFilterPreference = async (req, res) => {
  try {
    const { tableId } = req.params;
    const userId = req.user._id;
    const siteId = req.siteId;

    // Verify table exists and belongs to user
    const table = await Table.findOne({
      _id: tableId,
      userId,
      siteId
    });

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Delete filter preference
    await FilterPreference.findOneAndDelete({
      tableId,
      userId,
      siteId
    });

    res.status(200).json({
      success: true,
      message: 'Filter preference deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting filter preference:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all filter preferences for a user
export const getAllFilterPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const siteId = req.siteId;

    const filterPreferences = await FilterPreference.find({
      userId,
      siteId
    }).populate('tableId', 'name');

    res.status(200).json({
      success: true,
      data: filterPreferences
    });
  } catch (error) {
    console.error('Error getting all filter preferences:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
