// Thêm/cập nhật iframe cho n8n (không cần authentication) - VALIDATE SAME SITE USERS
export const upsertIframeForN8N = async (req, res) => {
  try {
    console.log('[IFRAME N8N] upsertIframeForN8N called');
    console.log('[IFRAME N8N] Request body:', req.body);
    console.log('[IFRAME N8N] Host:', req.get('host'));

    const { title, domain, user_id, url, viewers } = req.body;

    // Validate required fields
    if (!title || !domain || !user_id || !url) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc",
        error: "MISSING_REQUIRED_FIELDS",
        required_fields: ["title", "domain", "user_id", "url"]
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        message: "URL không hợp lệ",
        error: "INVALID_URL"
      });
    }

    // Validate domain format
    if (!/^[a-zA-Z0-9-]+$/.test(domain)) {
      return res.status(400).json({
        success: false,
        message: "Tên miền chỉ được chứa chữ cái, số và dấu gạch ngang",
        error: "INVALID_DOMAIN_FORMAT"
      });
    }

    // Validate user_id format
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        success: false,
        message: "user_id không hợp lệ",
        error: "INVALID_USER_ID"
      });
    }

    // Auto-detect site_id from host header
    let hostname = req.get('x-host') || req.get('host') || req.hostname;
    hostname = hostname.split(':')[0]; // Remove port if present

    console.log('[IFRAME N8N] Detecting site for hostname:', hostname);

    // Find site by domain
    const Site = mongoose.model('Site');
    let site = await Site.findOne({ 
      domains: { $in: [hostname] },
      status: 'active' 
    });

    // Try alternative patterns for localhost development
    if (!site && (hostname.includes('localhost') || hostname === '127.0.0.1')) {
      const patterns = [
        hostname,
        hostname.replace('.localhost', ''),
        `${hostname}.localhost`,
        'localhost',
        '2tdata.com'
      ];
      
      for (const pattern of patterns) {
        site = await Site.findOne({ 
          domains: { $in: [pattern] },
          status: 'active' 
        });
        if (site) {
          console.log('[IFRAME N8N] Found site with pattern:', pattern);
          break;
        }
      }
    }

    // If still no site found, try to find the main site
    if (!site) {
      site = await Site.findOne({ 
        $or: [
          { is_main_site: true },
          { name: /main|master|2tdata/i }
        ],
        status: 'active' 
      }).sort({ createdAt: 1 });
    }

    if (!site) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy site cho domain: ${hostname}`,
        error: "SITE_NOT_FOUND"
      });
    }

    console.log('[IFRAME N8N] Using site:', site.name, 'ID:', site._id);

    // VALIDATE MAIN USER BELONGS TO SITE
    const User = mongoose.model('User');
    const mainUser = await User.findById(user_id).select('_id email site_id');
    
    if (!mainUser) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user với user_id đã cung cấp",
        error: "USER_NOT_FOUND"
      });
    }

    const mainUserSiteId = mainUser.site_id?.toString();
    const targetSiteId = site._id.toString();
    
    console.log('[IFRAME N8N] Main user site_id:', mainUserSiteId);
    console.log('[IFRAME N8N] Target site_id:', targetSiteId);

    if (mainUserSiteId !== targetSiteId) {
      return res.status(403).json({
        success: false,
        message: `User ${mainUser.email} không thuộc site ${site.name}`,
        error: "USER_NOT_IN_SAME_SITE",
        details: {
          user_site_id: mainUserSiteId,
          required_site_id: targetSiteId
        }
      });
    }

    // VALIDATE VIEWERS ARRAY - ALL MUST BE FROM SAME SITE
    let validatedViewers = [];
    if (viewers && Array.isArray(viewers)) {
      console.log('[IFRAME N8N] Validating viewers:', viewers.length);
      
      for (const viewerId of viewers) {
        if (!mongoose.Types.ObjectId.isValid(viewerId)) {
          return res.status(400).json({
            success: false,
            message: `viewer_id không hợp lệ: ${viewerId}`,
            error: "INVALID_VIEWER_ID"
          });
        }

        // Check if viewer exists and belongs to same site
        const viewer = await User.findById(viewerId).select('_id email site_id');
        if (!viewer) {
          return res.status(404).json({
            success: false,
            message: `Không tìm thấy viewer với ID: ${viewerId}`,
            error: "VIEWER_NOT_FOUND",
            invalid_viewer_id: viewerId
          });
        }

        const viewerSiteId = viewer.site_id?.toString();
        if (viewerSiteId !== targetSiteId) {
          return res.status(403).json({
            success: false,
            message: `User ${viewer.email} không thuộc cùng site. Chỉ cho phép users cùng site.`,
            error: "VIEWER_NOT_IN_SAME_SITE",
            details: {
              viewer_email: viewer.email,
              viewer_site_id: viewerSiteId,
              required_site_id: targetSiteId,
              site_name: site.name
            }
          });
        }

        validatedViewers.push(viewerId);
      }
      
      console.log('[IFRAME N8N] All viewers validated successfully:', validatedViewers.length);
    }

    // Check if iframe already exists with this domain
    const existingIframe = await Iframe.findOne({ domain });

    if (existingIframe) {
      // Update existing iframe
      console.log('[IFRAME N8N] Updating existing iframe for domain:', domain);
      
      const updateData = {
        title,
        url,
        user_id,
        site_id: site._id,
        updatedAt: new Date()
      };

      // Update viewers if provided
      if (validatedViewers.length > 0) {
        updateData.viewers = validatedViewers;
        console.log('[IFRAME N8N] Updating viewers:', validatedViewers.length, 'users');
      }

      const updatedIframe = await Iframe.findOneAndUpdate(
        { domain },
        updateData,
        { new: true, runValidators: true }
      ).populate('site_id', 'name domains');

      return res.status(200).json({
        success: true,
        message: `Domain "${domain}" đã được cập nhật thành công`,
        action: "updated",
        data: {
          id: updatedIframe._id,
          title: updatedIframe.title,
          domain: updatedIframe.domain,
          url: updatedIframe.url,
          user_id: updatedIframe.user_id,
          viewers: updatedIframe.viewers,
          viewers_count: updatedIframe.viewers.length,
          site_id: updatedIframe.site_id._id,
          site_name: updatedIframe.site_id.name,
          created_at: updatedIframe.createdAt,
          updated_at: updatedIframe.updatedAt
        }
      });
    } else {
      // Create new iframe
      console.log('[IFRAME N8N] Creating new iframe for domain:', domain);
      
      const newIframeData = {
        title,
        domain,
        url,
        user_id,
        site_id: site._id
      };

      // Add viewers if provided
      if (validatedViewers.length > 0) {
        newIframeData.viewers = validatedViewers;
        console.log('[IFRAME N8N] Adding viewers:', validatedViewers.length, 'users');
      }

      const newIframe = new Iframe(newIframeData);
      const savedIframe = await newIframe.save();
      await savedIframe.populate('site_id', 'name domains');

      return res.status(201).json({
        success: true,
        message: `Domain "${domain}" đã được tạo thành công`,
        action: "created",
        data: {
          id: savedIframe._id,
          title: savedIframe.title,
          domain: savedIframe.domain,
          url: savedIframe.url,
          user_id: savedIframe.user_id,
          viewers: savedIframe.viewers,
          viewers_count: savedIframe.viewers.length,
          site_id: savedIframe.site_id._id,
          site_name: savedIframe.site_id.name,
          created_at: savedIframe.createdAt,
          updated_at: savedIframe.updatedAt
        }
      });
    }

  } catch (error) {
    console.error('[IFRAME N8N] Error:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Domain này đã tồn tại",
        error: "DOMAIN_ALREADY_EXISTS"
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        error: "VALIDATION_ERROR",
        details: validationErrors
      });
    }

    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
        error: "INVALID_ID"
      });
    }

    // Generic error
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};
