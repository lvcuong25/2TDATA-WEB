import GroupPreference from '../model/GroupPreference.js';
import Table from '../model/Table.js';

// Get group preference for a table
export const getGroupPreference = async (req, res) => {
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

    // Find or create group preference
    let groupPreference = await GroupPreference.findOne({
      userId,
      siteId,
      tableId
    });

    if (!groupPreference) {
      // Create default group preference
      groupPreference = new GroupPreference({
        userId,
        siteId,
        tableId,
        groupRules: [],
        expandedGroups: []
      });
      await groupPreference.save();
    }

    res.status(200).json({
      success: true,
      data: groupPreference
    });
  } catch (error) {
    console.error('Error getting group preference:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Save group preference for a table
export const saveGroupPreference = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { groupRules, expandedGroups } = req.body;
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

    // Validate group rules
    if (groupRules && !Array.isArray(groupRules)) {
      return res.status(400).json({ message: 'Group rules must be an array' });
    }

    if (expandedGroups && !Array.isArray(expandedGroups)) {
      return res.status(400).json({ message: 'Expanded groups must be an array' });
    }

    // Find existing preference or create new one
    let groupPreference = await GroupPreference.findOne({
      userId,
      siteId,
      tableId
    });

    if (groupPreference) {
      // Update existing preference
      groupPreference.groupRules = groupRules || [];
      groupPreference.expandedGroups = expandedGroups || [];
      groupPreference.updatedAt = new Date();
    } else {
      // Create new preference
      groupPreference = new GroupPreference({
        userId,
        siteId,
        tableId,
        groupRules: groupRules || [],
        expandedGroups: expandedGroups || []
      });
    }

    await groupPreference.save();

    res.status(200).json({
      success: true,
      message: 'Group preference saved successfully',
      data: groupPreference
    });
  } catch (error) {
    console.error('Error saving group preference:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete group preference for a table
export const deleteGroupPreference = async (req, res) => {
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

    // Delete group preference
    const result = await GroupPreference.deleteOne({
      userId,
      siteId,
      tableId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Group preference not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Group preference deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting group preference:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all group preferences for a user
export const getAllGroupPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const siteId = req.siteId;

    const groupPreferences = await GroupPreference.find({
      userId,
      siteId
    }).populate('tableId', 'name');

    res.status(200).json({
      success: true,
      data: groupPreferences
    });
  } catch (error) {
    console.error('Error getting all group preferences:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
