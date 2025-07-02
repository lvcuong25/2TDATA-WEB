import OrganizationService from "../model/OrganizationService.js";
import Organization from "../model/Organization.js";
import Service from "../model/Service.js";

// Lấy danh sách service đang chờ xác nhận cho tổ chức
export const getPendingOrganizationServices = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      // Tìm organization
      const matchingOrgs = await Organization.find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      const orgIds = matchingOrgs.map(org => org._id);
      // Tìm service
      const matchingServices = await Service.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { slug: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const serviceIds = matchingServices.map(s => s._id);
      const orConditions = [];
      if (orgIds.length > 0) orConditions.push({ organization: { $in: orgIds } });
      if (serviceIds.length > 0) orConditions.push({ service: { $in: serviceIds } });
      if (orConditions.length > 0) query.$or = orConditions;
      else return res.status(200).json({ data: { docs: [], totalDocs: 0, limit: 10, page: 1, totalPages: 0 } });
    }
    const options = {
      page: req.query.page ? +req.query.page : 1,
      limit: req.query.limit ? +req.query.limit : 10,
      sort: { createdAt: -1 },
      populate: [
        { path: 'organization', select: 'name email phone address logo' },
        { path: 'service', select: 'name slug image status description' },
        { path: 'approvedBy', select: 'name email avatar' }
      ]
    };
    const data = await OrganizationService.paginate(query, options);
    const filteredDocs = data.docs.filter(doc => doc.organization && doc.service && doc.organization.name && doc.service.name);
    const totalDocs = filteredDocs.length;
    const totalPages = Math.ceil(totalDocs / options.limit);
    return res.status(200).json({
      data: {
        docs: filteredDocs,
        totalDocs,
        limit: options.limit,
        page: options.page,
        totalPages
      }
    });
  } catch (error) { next(error); }
};

// Lấy danh sách service của organization (phân trang)
export const getOrganizationServices = async (req, res, next) => {
  try {
    const options = {
      page: req.query.page ? +req.query.page : 1,
      limit: req.query.limit ? +req.query.limit : 10,
      sort: { createdAt: -1 },
      populate: [
        { path: 'service', select: 'name slug image status description' },
        { path: 'approvedBy', select: 'name email avatar' }
      ]
    };
    const data = await OrganizationService.paginate({ organization: req.params.orgId }, options);
    return res.status(200).json({ data });
  } catch (error) { next(error); }
};

// Admin xác nhận service cho organization
export const approveOrganizationService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }
    const orgService = await OrganizationService.findById(id);
    if (!orgService) {
      return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
    }
    if (status === 'approved') {
      await Organization.findByIdAndUpdate(
        orgService.organization,
        { $addToSet: { services: orgService._id } }
      );
    }
    orgService.status = status;
    orgService.approvedBy = req.user._id;
    orgService.approvedAt = new Date();
    if (status === 'rejected' && reason) orgService.reason = reason;
    await orgService.save();
    const populatedOrgService = await OrganizationService.findById(orgService._id)
      .populate('organization', 'name email phone address logo')
      .populate('service', 'name slug image status description')
      .populate('approvedBy', 'name email avatar');
    return res.status(200).json({
      data: populatedOrgService,
      message: status === 'approved' ? "Xác nhận service cho tổ chức thành công" : "Từ chối service cho tổ chức thành công"
    });
  } catch (error) { next(error); }
};

// Thêm service vào organization (sẽ ở trạng thái chờ xác nhận)
export const addServiceToOrganization = async (req, res, next) => {
  try {
    let { serviceId, customSlug, link } = req.body;
    const orgId = req.params.orgId;
    const serviceIds = Array.isArray(serviceId) ? serviceId : [serviceId];
    const results = [];
    const errors = [];
    for (const item of serviceIds) {
      let sid, itemCustomSlug, itemLink;
      if (typeof item === 'object' && item !== null) {
        sid = item.serviceId || item._id || item.id;
        itemCustomSlug = item.customSlug;
        itemLink = item.link;
      } else {
        sid = item;
        itemCustomSlug = customSlug;
        itemLink = link;
      }
      if (!sid) {
        errors.push({ serviceId: item, message: "Thiếu serviceId" });
        continue;
      }
      const existingRequest = await OrganizationService.findOne({
        organization: orgId,
        service: sid,
        status: 'waiting'
      });
      if (existingRequest) {
        errors.push({ serviceId: sid, message: "Đã có yêu cầu thêm service này đang chờ xác nhận" });
        continue;
      }
      const orgService = new OrganizationService({
        organization: orgId,
        service: sid,
        status: 'waiting',
        customSlug: itemCustomSlug,
        link: itemLink || []
      });
      await orgService.save();
      // Đảm bảo OrganizationService nằm trong mảng services của Organization
      await Organization.findByIdAndUpdate(
        orgId,
        { $addToSet: { services: orgService._id } }
      );
      const populatedOrgService = await OrganizationService.findById(orgService._id)
        .populate('organization', 'name email phone address logo')
        .populate('service', 'name slug image status description')
        .populate('approvedBy', 'name email avatar');
      results.push(populatedOrgService);
    }
    const updatedOrg = await Organization.findById(orgId)
      .populate({
        path: 'services',
        populate: {
          path: 'service',
          select: 'name slug image status description'
        }
      });
    return res.status(201).json({
      organization: updatedOrg,
      message: errors.length === 0 
        ? "Tất cả yêu cầu thêm service đã được gửi, đang chờ xác nhận"
        : "Một số yêu cầu thêm service đã được gửi, một số yêu cầu đã tồn tại hoặc thiếu thông tin"
    });
  } catch (error) { next(error); }
};

// Lấy chi tiết của một organization service
export const getOrganizationServiceDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orgService = await OrganizationService.findById(id)
      .populate('organization', 'name email phone address logo')
      .populate('service', 'name slug image status description')
      .populate('approvedBy', 'name email avatar');
    if (!orgService) {
      return res.status(404).json({ message: "Không tìm thấy thông tin service" });
    }
    return res.status(200).json({
      data: orgService,
      message: "Lấy thông tin service thành công"
    });
  } catch (error) { next(error); }
};

// Xóa service khỏi organization
export const removeOrganizationService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orgId = req.user.organization || req.body.organization || req.query.organization;
    const orgService = await OrganizationService.findById(id);
    if (!orgService) {
      return res.status(404).json({ message: "Không tìm thấy thông tin service" });
    }
    // Chỉ cho phép admin hoặc manager của tổ chức xóa
    // (Cần bổ sung kiểm tra quyền nếu cần)
    await OrganizationService.findByIdAndDelete(id);
    // Cập nhật lại danh sách service của organization
    if (orgId) {
      await Organization.findByIdAndUpdate(
        orgId,
        { $pull: { services: id } }
      );
    }
    const updatedOrg = orgId ? await Organization.findById(orgId).populate({
      path: 'services',
      populate: [
        { path: 'service', select: 'name slug image status description' },
        { path: 'approvedBy', select: 'name email avatar' }
      ]
    }) : null;
    return res.status(200).json({
      data: updatedOrg,
      message: "Xóa service thành công"
    });
  } catch (error) { next(error); }
};

// Cập nhật link cho organization service
export const updateOrganizationServiceLinks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { links, link_update } = req.body;
    const orgService = await OrganizationService.findById(id);
    if (!orgService) {
      return res.status(404).json({ message: "Không tìm thấy thông tin service" });
    }
    // (Có thể bổ sung kiểm tra quyền nếu cần)
    if (links && Array.isArray(links)) {
      const formattedLinks = links.map(link => {
        if (typeof link === 'string') {
          return {
            url: link,
            title: 'Link không có tiêu đề',
            description: ''
          };
        }
        return {
          url: link.url || '',
          title: link.title || 'Link không có tiêu đề',
          description: link.description || ''
        };
      });
      orgService.link = formattedLinks;
    }
    if (link_update && Array.isArray(link_update)) {
      const formattedUpdateLinks = link_update.map(link => {
        if (typeof link === 'string') {
          return {
            url: link,
            title: 'Link cập nhật không có tiêu đề',
            description: ''
          };
        }
        return {
          url: link.url || '',
          title: link.title || 'Link cập nhật không có tiêu đề',
          description: link.description || ''
        };
      });
      orgService.link_update = formattedUpdateLinks;
    }
    await orgService.save();
    const updatedOrgService = await OrganizationService.findById(orgService._id)
      .populate('organization', 'name email phone address logo')
      .populate('service', 'name slug image status description')
      .populate('approvedBy', 'name email avatar');
    return res.status(200).json({
      data: updatedOrgService,
      message: "Cập nhật link thành công"
    });
  } catch (error) { next(error); }
};
