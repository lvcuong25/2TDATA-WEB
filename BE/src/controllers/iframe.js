import Iframe from "../model/Iframe.js";
import mongoose from 'mongoose';

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

// Thêm/cập nhật iframe cho n8n (không cần authentication)
// Thêm/cập nhật iframe cho n8n (không cần authentication) - ENHANCED VERSION
export const upsertIframeForN8N = async (req, res) => {
  try {
    console.log('[IFRAME N8N] upsertIframeForN8N called');
    console.log('[IFRAME N8N] Request body:', req.body);
    console.log('[IFRAME N8N] Host:', req.get('host'));

    const { title, domain, user_id, url } = req.body;

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

    // VALIDATE USER EXISTS AND GET USER INFO
    const User = mongoose.model('User');
    const user = await User.findById(user_id).select('_id email name site_id');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user với user_id đã cung cấp",
        error: "USER_NOT_FOUND"
      });
    }

    console.log('[IFRAME N8N] Found user:', user.email);

    // Check if iframe already exists with this domain
    const existingIframe = await Iframe.findOne({ domain });

    if (existingIframe) {
      // Update existing iframe
      console.log('[IFRAME N8N] Updating existing iframe for domain:', domain);
      
      // Ensure user_id is in viewers array (add if not present)
      let currentViewers = existingIframe.viewers || [];
      const userIdString = user_id.toString();
      
      // Convert existing viewers to strings for comparison
      const existingViewerIds = currentViewers.map(v => v.toString());
      
      // Add user_id to viewers if not already present
      if (!existingViewerIds.includes(userIdString)) {
        currentViewers.push(user_id);
        console.log('[IFRAME N8N] Added user_id to viewers array');
      }

      const updatedIframe = await Iframe.findOneAndUpdate(
        { domain },
        {
          title,
          url,
          user_id,
          site_id: site._id,
          viewers: currentViewers,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).populate([
        { path: 'user_id', select: 'email name' },
        { path: 'site_id', select: 'name domains' },
        { path: 'viewers', select: 'email name' }
      ]);

      return res.status(200).json({
        success: true,
        message: `Domain "${domain}" đã được cập nhật thành công`,
        action: "updated",
        data: {
          id: updatedIframe._id,
          title: updatedIframe.title,
          domain: updatedIframe.domain,
          url: updatedIframe.url,
          user_email: updatedIframe.user_id.email,
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
      
      // Create new iframe with user_id automatically added to viewers
      const newIframe = new Iframe({
        title,
        domain,
        url,
        user_id,
        site_id: site._id,
        viewers: [user_id] // Automatically add user_id to viewers
      });

      const savedIframe = await newIframe.save();
      
      // Populate the saved iframe with user and site information
      const populatedIframe = await Iframe.findById(savedIframe._id).populate([
        { path: 'user_id', select: 'email name' },
        { path: 'site_id', select: 'name domains' },
        { path: 'viewers', select: 'email name' }
      ]);

      console.log('[IFRAME N8N] Created iframe with user_id in viewers');

      return res.status(201).json({
        success: true,
        message: `Domain "${domain}" đã được tạo thành công`,
        action: "created",
        data: {
          id: populatedIframe._id,
          title: populatedIframe.title,
          domain: populatedIframe.domain,
          url: populatedIframe.url,
          user_email: populatedIframe.user_id.email,
          viewers: populatedIframe.viewers,
          viewers_count: populatedIframe.viewers.length,
          site_id: populatedIframe.site_id._id,
          site_name: populatedIframe.site_id.name,
          created_at: populatedIframe.createdAt,
          updated_at: populatedIframe.updatedAt
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
