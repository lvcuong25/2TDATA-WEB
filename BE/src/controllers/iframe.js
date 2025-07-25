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

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query dựa trên role và site
    let query = {};
    
    // Super admin có thể xem tất cả
    if (req.user.role !== 'super_admin') {
      // Admin và user chỉ xem iframe của site mình
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

    const iframe = await Iframe.findById(req.params.id).populate("viewers", "name email");
    if (!iframe) return res.status(404).json({ message: "Iframe not found" });

    // Kiểm tra quyền xem
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      // User thường chỉ xem được nếu là viewer
      const isViewer = iframe.viewers.some(viewer => 
        viewer._id.toString() === req.user._id.toString()
      );
      if (!isViewer) {
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
    // Kiểm tra authentication - BẮT BUỘC
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        message: "Vui lòng đăng nhập để xem nội dung này",
        error: "NO_AUTH"
      });
    }

    const iframe = await Iframe.findOne({ domain: req.params.domain })
      .populate("viewers", "_id")
      .populate("site_id", "_id name");
      
    if (!iframe) {
      return res.status(404).json({ message: "Không tìm thấy iframe" });
    }

    // Super admin có thể xem tất cả
    if (req.user.role === "super_admin") {
      return res.status(200).json(iframe);
    }

    // Site admin chỉ xem được iframe của site mình
    if (req.user.role === "site_admin") {
      if (req.user.site_id && iframe.site_id._id.toString() === req.user.site_id.toString()) {
        return res.status(200).json(iframe);
      }
    }

    // Kiểm tra user có cùng site_id với iframe không
    if (req.user.site_id && iframe.site_id._id.toString() === req.user.site_id.toString()) {
      // Kiểm tra xem user có trong danh sách viewers không
      const isViewer = iframe.viewers.some(viewer => 
        viewer._id.toString() === req.user._id.toString()
      );
      
      if (isViewer) {
        return res.status(200).json(iframe);
      }
    }

    // Không có quyền xem
    return res.status(403).json({ 
      message: "Bạn không có quyền xem nội dung này",
      error: "NOT_AUTHORIZED"
    });

  } catch (error) {
    console.error('GetIframeByDomain error:', error);
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

    // Chỉ admin và super_admin mới được tạo iframe
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.role !== 'site_admin') {
      return res.status(403).json({ message: "Admin access required" });
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

    // Chỉ admin và super_admin mới được xóa
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.role !== 'site_admin') {
      return res.status(403).json({ message: "Admin access required" });
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
