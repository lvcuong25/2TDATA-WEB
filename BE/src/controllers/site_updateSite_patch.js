// Patch for updateSite function
export const updateSite = async (req, res) => {
  try {
    // Check permissions
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      });
    }
    
    // Super admin can update any site
    if (req.user.role !== 'super_admin') {
      // Site admin can only update their own site
      if (req.user.role === 'site_admin') {
        // Check if site admin has site_id assigned
        if (!req.user.site_id) {
          return res.status(403).json({
            success: false,
            message: 'Site admin does not have a site assigned',
            error: 'NO_SITE_ASSIGNED'
          });
        }
        
        // Check if updating their own site
        const userSiteId = req.user.site_id._id || req.user.site_id;
        if (req.params.id !== userSiteId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Site admin can only update their own site',
            error: 'INSUFFICIENT_PERMISSIONS'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'Only super admin or site admin can update sites',
          error: 'INSUFFICIENT_PERMISSIONS'
        });
      }
    }

    const { id } = req.params;
    const updateData = req.body;

    // Handle file upload
    if (req.file) {
      updateData.logo = `/uploads/logos/${req.file.filename}`;
    }

    const updatedSite = await Site.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('site_admins.user_id', 'name email');

    if (!updatedSite) {
      return res.status(404).json({
        success: false,
        message: 'Site not found',
        error: 'SITE_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Site updated successfully',
      data: updatedSite
    });
  } catch (error) {
    console.error('Update site error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update site',
      error: error.message
    });
  }
};
