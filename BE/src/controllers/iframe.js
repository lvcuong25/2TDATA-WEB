import Iframe from "../model/Iframe.js";

// Lấy danh sách tất cả iframe với pagination
export const getAllIframes = async (req, res) => {
  try {
    console.log('[IFRAME] getAllIframes called');
    console.log('[IFRAME] User:', req.user ? req.user.email : 'No user');
    
    // Kiểm tra authentication
    if (!req.user) {
      console.log('[IFRAME] No authentication, returning 401');
      return res.status(401).json({ message: "Authentication required" });
    }

    // Chỉ cho phép site_admin và super_admin truy cập
    if (req.user.role !== 'site_admin' && req.user.role !== 'super_admin') {
      console.log('[IFRAME] Access denied for role:', req.user.role);
      return res.status(403).json({ 
        message: "Chỉ site admin và super admin mới có quyền truy cập quản lý iframe",
        error: "ACCESS_DENIED"
      });
    }

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query dựa trên role và site
    let query = {};
    
    // Super admin có thể xem tất cả
    if (req.user.role !== 'super_admin') {
      // Site admin chỉ xem iframe của site mình
      if (req.user.site_id) {
        query.site_id = req.user.site_id._id || req.user.site_id;
      }
    }

    console.log('[IFRAME] Query:', query);
    
    // Get total count
    const totalDocs = await Iframe.countDocuments(query);
    
    // Get paginated data
    const iframes = await Iframe.find(query)
      .populate("viewers", "name email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    console.log('[IFRAME] Found iframes:', iframes.length);
    
    // Return paginated format
    res.status(200).json({
      docs: iframes,
      totalDocs: totalDocs,
      limit: limit,
      page: page,
      totalPages: Math.ceil(totalDocs / limit),
      hasNextPage: page < Math.ceil(totalDocs / limit),
      hasPrevPage: page > 1,
      nextPage: page < Math.ceil(totalDocs / limit) ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
      pagingCounter: skip + 1
    });
  } catch (error) {
    console.error('[IFRAME] Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Lấy 1 iframe theo id
export const getIframeById = async (req, res) => {
  try {
    // Kiểm tra authentication
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Chỉ cho phép site_admin và super_admin truy cập
    if (req.user.role !== 'site_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        message: "Chỉ site admin và super admin mới có quyền truy cập quản lý iframe",
        error: "ACCESS_DENIED"
      });
    }

    const iframe = await Iframe.findById(req.params.id).populate("viewers", "name email");
    if (!iframe) return res.status(404).json({ message: "Iframe not found" });

    // Kiểm tra quyền xem
    if (req.user.role !== 'super_admin') {
      // Site admin chỉ xem được iframe của site mình
      const userSiteId = req.user.site_id?._id?.toString() || req.user.site_id?.toString();
      const iframeSiteId = iframe.site_id?.toString();
      
      if (userSiteId !== iframeSiteId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.status(200).json(iframe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy iframe theo domain - CẦN AUTHENTICATION
export const getIframeByDomain = async (req, res) => {
  try {
    console.log('[IFRAME] getIframeByDomain called for domain:', req.params.domain);
    console.log('[IFRAME] User:', req.user ? req.user.email : 'No user');
    
    // STEP 1: Bắt buộc phải đăng nhập
    if (!req.user || !req.user._id) {
      console.log('[IFRAME] No authentication, returning 401');
      return res.status(401).json({ 
        message: "Vui lòng đăng nhập để xem nội dung này",
        error: "NO_AUTH",
        requireLogin: true
      });
    }

    // STEP 2: Tìm iframe
    const iframe = await Iframe.findOne({ domain: req.params.domain })
      .populate("viewers", "_id name email avatar")
      .populate("site_id", "_id name");
    
    if (!iframe) {
      return res.status(404).json({ message: "Không tìm thấy iframe" });
    }

    console.log('[IFRAME] Found iframe:', iframe.title);
    console.log('[IFRAME] Iframe site_id:', iframe.site_id?._id);
    console.log('[IFRAME] Viewers count:', iframe.viewers.length);
    console.log('[IFRAME] Viewer IDs:', iframe.viewers.map(v => v._id.toString()));

    // STEP 3: Kiểm tra quyền xem
    // 3.1 - Super admin có thể xem tất cả
    if (req.user.role === "super_admin") {
      console.log(`[IFRAME] Super admin ${req.user.email} accessing iframe ${iframe.title}`);
      return res.status(200).json(iframe);
    }
    
    // 3.2 - Site admin có thể xem iframe của site mình
    if (req.user.role === "site_admin" && req.user.site_id) {
      const userSiteId = req.user.site_id._id ? req.user.site_id._id.toString() : req.user.site_id.toString();
      const iframeSiteId = iframe.site_id ? iframe.site_id._id.toString() : iframe.site_id.toString();
      
      console.log('[IFRAME] Site admin check - User site:', userSiteId, 'Iframe site:', iframeSiteId);
      
      if (userSiteId === iframeSiteId) {
        console.log(`[IFRAME] Site admin ${req.user.email} accessing iframe from their site`);
        return res.status(200).json(iframe);
      }
    }

    // 3.3 - Kiểm tra user có trong danh sách viewers không
    console.log('[IFRAME] Checking viewer access for user ID:', req.user._id.toString());
    
    const isViewer = iframe.viewers.some(viewer => {
      const viewerId = viewer._id ? viewer._id.toString() : viewer.toString();
      const userId = req.user._id.toString();
      console.log('[IFRAME] Comparing viewer:', viewerId, 'with user:', userId);
      return viewerId === userId;
    });
    
    console.log('[IFRAME] Is viewer:', isViewer);
    
    // STEP 4: Nếu không có quyền xem, trả về 403 (không redirect)
    if (!isViewer) {
      console.log('[IFRAME] Access denied for user:', req.user.email);
      return res.status(403).json({ 
        message: "Bạn không có quyền xem nội dung này",
        error: "NOT_AUTHORIZED",
        requireLogin: false // Đã đăng nhập nhưng không có quyền
      });
    }

    // STEP 5: User có quyền xem
    console.log(`[IFRAME] User ${req.user.email} has viewer access to iframe ${iframe.title}`);
    
    // Add cache headers to prevent unnecessary re-fetches
    res.set({
      'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN'
    });
    
    return res.status(200).json(iframe);

  } catch (error) {
    console.error('[IFRAME] GetIframeByDomain error:', error);
    res.status(500).json({ message: error.message });
  }
};


// Lấy iframe theo domain - CHO PHÉP ANONYMOUS nếu iframe là public
export const getIframeByDomainPublic = async (req, res) => {
  try {
    const iframe = await Iframe.findOne({ domain: req.params.domain }).populate("viewers", "_id");
    if (!iframe) {
      return res.status(404).json({ message: "Iframe not found" });
    }

    // Kiểm tra nếu iframe là public
    if (iframe.isPublic) {
      // Trả về iframe nhưng ẩn danh sách viewers
      const publicIframe = {
        ...iframe.toObject(),
        viewers: [] // Ẩn danh sách viewers cho anonymous users
      };
      return res.status(200).json(publicIframe);
    }

    // Nếu không phải public, kiểm tra authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        message: "Authentication required for private iframe",
        error: "NO_AUTH"
      });
    }

    // Logic kiểm tra quyền như cũ
    if (req.user.role === "admin" || req.user.role === "super_admin") {
      return res.status(200).json(iframe);
    }

    const isViewer = iframe.viewers.some(viewer => 
      viewer._id.toString() === req.user._id.toString()
    );
    
    if (!isViewer) {
      return res.status(403).json({ 
        message: "Access denied",
        error: "NOT_AUTHORIZED"
      });
    }

    res.status(200).json(iframe);
  } catch (error) {
    console.error('GetIframeByDomainPublic error:', error);
    res.status(500).json({ message: error.message });
  }
};


// Thêm mới iframe
export const createIframe = async (req, res) => {
  try {
    // Kiểm tra authentication
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Chỉ site_admin và super_admin mới được tạo iframe
    if (req.user.role !== 'site_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        message: "Chỉ site admin và super admin mới có quyền tạo iframe",
        error: "ACCESS_DENIED"
      });
    }

    // Tự động gán site_id từ user đang đăng nhập
    const iframeData = {
      ...req.body,
      site_id: req.user.site_id?._id || req.user.site_id
    };
    
    // Super admin có thể chỉ định site_id khác
    if (req.user.role === "super_admin" && req.body.site_id) {
      iframeData.site_id = req.body.site_id;
    }
    
    const newIframe = new Iframe(iframeData);
    const savedIframe = await newIframe.save();
    res.status(201).json(savedIframe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Sửa iframe
export const updateIframe = async (req, res) => {
  try {
    // Kiểm tra authentication
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Chỉ site_admin và super_admin mới được sửa iframe
    if (req.user.role !== 'site_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        message: "Chỉ site admin và super admin mới có quyền sửa iframe",
        error: "ACCESS_DENIED"
      });
    }

    // Kiểm tra quyền: chỉ cho phép update iframe của site mình
    const query = { _id: req.params.id };
    
    // Nếu không phải super_admin, thêm điều kiện site_id
    if (req.user.role !== 'super_admin') {
      query.site_id = req.user.site_id?._id || req.user.site_id;
    }
    
    const updatedIframe = await Iframe.findOneAndUpdate(
      query,
      req.body,
      { new: true }
    );
    
    if (!updatedIframe) {
      return res.status(404).json({ message: "Iframe not found or access denied" });
    }
    
    res.status(200).json(updatedIframe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa iframe
export const deleteIframe = async (req, res) => {
  try {
    // Kiểm tra authentication
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Chỉ site_admin và super_admin mới được xóa iframe
    if (req.user.role !== 'site_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        message: "Chỉ site admin và super admin mới có quyền xóa iframe",
        error: "ACCESS_DENIED"
      });
    }

    const query = { _id: req.params.id };
    
    // Nếu không phải super_admin, thêm điều kiện site_id
    if (req.user.role !== 'super_admin') {
      query.site_id = req.user.site_id?._id || req.user.site_id;
    }
    
    const deletedIframe = await Iframe.findOneAndDelete(query);
    
    if (!deletedIframe) {
      return res.status(404).json({ message: "Iframe not found or access denied" });
    }
    
    res.status(200).json({ message: "Iframe deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check authentication status endpoint
export const checkAuthStatus = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        authenticated: false,
        message: "Not authenticated"
      });
    }
    
    return res.status(200).json({
      authenticated: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role,
        site_id: req.user.site_id
      }
    });
  } catch (error) {
    console.error('[IFRAME] Check auth status error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Preload iframe data - ensure authentication is complete before loading iframe
export const preloadIframe = async (req, res) => {
  try {
    console.log('[IFRAME] Preload called for domain:', req.params.domain);
    
    // Step 1: Ensure user is authenticated
    if (!req.user || !req.user._id) {
      console.log('[IFRAME] Preload - No authentication');
      return res.status(401).json({ 
        preloaded: false,
        requireAuth: true,
        message: "Authentication required"
      });
    }
    
    // Step 2: Find iframe
    const iframe = await Iframe.findOne({ domain: req.params.domain })
      .select('title domain site_id viewers')
      .populate('viewers', '_id')
      .populate('site_id', '_id name');
    
    if (!iframe) {
      return res.status(404).json({ 
        preloaded: false,
        message: "Iframe not found" 
      });
    }
    
    // Step 3: Check permissions (same logic as getIframeByDomain)
    let hasAccess = false;
    
    if (req.user.role === "super_admin") {
      hasAccess = true;
    } else if (req.user.role === "site_admin" && req.user.site_id) {
      const userSiteId = req.user.site_id._id ? req.user.site_id._id.toString() : req.user.site_id.toString();
      const iframeSiteId = iframe.site_id ? iframe.site_id._id.toString() : iframe.site_id.toString();
      hasAccess = (userSiteId === iframeSiteId);
    } else {
      // Check if user is in viewers list
      hasAccess = iframe.viewers.some(viewer => {
        const viewerId = viewer._id ? viewer._id.toString() : viewer.toString();
        return viewerId === req.user._id.toString();
      });
    }
    
    console.log('[IFRAME] Preload - User has access:', hasAccess);
    
    // Return preload status
    return res.status(200).json({
      preloaded: true,
      hasAccess: hasAccess,
      iframe: {
        title: iframe.title,
        domain: iframe.domain,
        site: iframe.site_id?.name || 'Unknown'
      },
      user: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role
      }
    });
    
  } catch (error) {
    console.error('[IFRAME] Preload error:', error);
    res.status(500).json({ 
      preloaded: false,
      message: error.message 
    });
  }
};
