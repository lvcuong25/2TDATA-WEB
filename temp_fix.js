// Fix for deleteMultipleRecords function
export const deleteMultipleRecords = async (req, res) => {
    console.log("🔄 deleteMultipleRecords called with:", req.body);
    console.log("🔄 Request user:", req.user);
    console.log("🔄 Request siteId:", req.siteId);
    
  try {
    const { recordIds } = req.body;
    
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required. Please login first.' 
      });
    }
    
    const userId = req.user._id;
    const siteId = req.siteId;
    
    // Check siteId
    if (!siteId) {
      return res.status(400).json({ 
        message: 'Site context required' 
      });
    }

    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return res.status(400).json({ message: 'Record IDs array is required' });
    }

    // Verify all records exist and belong to user
    const records = await Record.find({
      _id: { $in: recordIds },
      userId,
      siteId
    });

    if (records.length !== recordIds.length) {
      return res.status(404).json({ 
        message: 'Some records not found or do not belong to user' 
      });
    }

    // Delete all records
    const result = await Record.deleteMany({
      _id: { $in: recordIds },
      userId,
      siteId
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} records deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting multiple records:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
