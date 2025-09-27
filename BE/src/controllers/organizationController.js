import Organization from '../model/Organization.js';
import User from '../model/User.js';
import { deleteFromCloudinary, extractPublicIdFromUrl } from '../utils/cloudinary.js';

// Thêm tổ chức
export const createOrganization = async (req, res) => {
    try {
        const { name, email, phone, address, identifier, taxCode, logo, logo_public_id, manager, site_id: bodySiteId } = req.body;

        // Lấy site_id từ user hoặc request body
        const site_id = req.user.role === 'super_admin' && bodySiteId ? bodySiteId : req.user.site_id;

        if (!site_id) {
            return res.status(400).json({
                error: "site_id is required"
            });
        }

        // Nếu có manager (super_admin chọn), kiểm tra user này có thuộc site không
        let managerId = req.user._id;
        if (req.user.role === 'super_admin' && manager) {
            const managerUser = await User.findById(manager);
            if (!managerUser) {
                return res.status(404).json({ error: "Không tìm thấy người quản lý được chọn" });
            }
            // Kiểm tra user này có thuộc site không
            const managerSiteId = managerUser.site_id?.toString();
            if (managerSiteId !== site_id.toString()) {
                return res.status(400).json({ error: "Người quản lý phải thuộc site đã chọn" });
            }
            managerId = manager;
        }

        const org = new Organization({
            site_id,
            name,
            manager: managerId,
            email,
            phone,
            address,
            identifier,
            taxCode,
            logo,
            logo_public_id,
            members: [{ user: managerId, role: 'owner' }]
        });
        await org.save();
        res.status(201).json(org);
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({ error: `Tổ chức với ${field} '${err.keyValue[field]}' đã tồn tại.` });
        }
        res.status(400).json({ error: err.message });
    }
};

// Sửa tổ chức
export const updateOrganization = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Nếu có logo mới, xóa logo cũ khỏi Cloudinary
        if (updateData.logo) {
            const currentOrg = await Organization.findById(id);
            if (currentOrg && currentOrg.logo && currentOrg.logo !== updateData.logo) {
                try {
                    const publicId = currentOrg.logo_public_id || extractPublicIdFromUrl(currentOrg.logo);
                    if (publicId) {
                        await deleteFromCloudinary(publicId);
                        console.log(`✅ Old logo deleted from Cloudinary for organization: ${currentOrg.name}`);
                    }
                } catch (error) {
                    console.error('Error deleting old logo from Cloudinary:', error);
                }
            }
        }

        // Nếu đổi manager, cập nhật owner trong members
        if (updateData.manager) {
            const org = await Organization.findById(id);
            if (org) {
                // Tìm owner cũ
                const ownerIndex = org.members.findIndex(m => m.role === 'owner');
                if (ownerIndex !== -1) {
                    // Đổi sang user mới
                    org.members[ownerIndex].user = updateData.manager;
                } else {
                    // Nếu chưa có owner, thêm mới
                    org.members.push({ user: updateData.manager, role: 'owner' });
                }
                await org.save();
            }
        }

        const org = await Organization.findByIdAndUpdate(id, updateData, { new: true });
        if (!org) return res.status(404).json({ error: 'Organization not found' });
        res.json(org);
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({ error: `Tổ chức với ${field} '${err.keyValue[field]}' đã tồn tại.` });
        }
        res.status(400).json({ error: err.message });
    }
};

// Xóa tổ chức
export const deleteOrganization = async (req, res) => {
    try {
        const { id } = req.params;
        const org = await Organization.findById(id);
        
        if (!org) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Xóa logo khỏi Cloudinary nếu có
        if (org.logo) {
            try {
                // Ưu tiên sử dụng logo_public_id nếu có, nếu không thì extract từ URL
                const publicId = org.logo_public_id || extractPublicIdFromUrl(org.logo);
                if (publicId) {
                    await deleteFromCloudinary(publicId);
                    console.log(`✅ Logo deleted from Cloudinary for organization: ${org.name}`);
                }
            } catch (error) {
                console.error('Error deleting logo from Cloudinary:', error);
                // Không dừng quá trình xóa nếu lỗi xóa logo
            }
        }

        // Xóa tổ chức
        await Organization.findByIdAndDelete(id);
        
        console.log(`✅ Organization deleted successfully: ${org.name} (${id})`);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('Error deleting organization:', err);
        res.status(400).json({ error: err.message });
    }
};

// Lấy danh sách tổ chức
export const getOrganizations = async (req, res) => {
    try {
        let { page = 1, limit = 10, search = "" } = req.query;
        page = Math.max(1, parseInt(page));
        limit = Math.max(1, parseInt(limit));
        search = String(search || "").trim();
        const query = {};
        
        // Lọc theo site_id nếu user không phải super-admin
        if (req.user.role !== 'super_admin' && req.user.site_id) {
            query.site_id = req.user.site_id;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
                { address: { $regex: search, $options: "i" } },
                { identifier: { $regex: search, $options: "i" } },
                { taxCode: { $regex: search, $options: "i" } },
            ];
        }
        const totalDocs = await Organization.countDocuments(query);
        const orgs = await Organization.find(query)
            .populate('manager', 'name email')
            .populate('site_id', 'name domains')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });
        res.json({
            docs: orgs,
            totalDocs,
            page,
            pageSize: limit,
            totalPages: Math.ceil(totalDocs / limit)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Lấy chi tiết tổ chức
export const getOrganizationById = async (req, res) => {
    try {
        const { id } = req.params;
        const org = await Organization.findById(id)
            .populate('manager', 'name email')
            .populate('site_id', 'name domains')
            .populate('members.user', 'name email avatar')
            .populate({
                path: 'services',
                populate: {
                    path: 'service',
                    select: 'name slug image authorizedLinks description'
                }
            });
        if (!org) return res.status(404).json({ error: 'Organization not found' });
        res.json(org);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ===== Quản lý thành viên =====

// Thêm thành viên vào tổ chức
export const addMember = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { userId, role } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "Vui lòng cung cấp ID người dùng." });
        }

        const organization = await Organization.findById(orgId);
        if (!organization) {
            return res.status(404).json({ error: "Không tìm thấy tổ chức." });
        }

        // Lấy user hiện tại từ req.user
        const currentUserId = req.user._id;
        const currentUserRole = req.user.role;
        // Nếu không phải super_admin thì phải là owner/manager mới được thêm
        if (currentUserRole !== 'super_admin') {
            const currentMember = organization.members.find(m => m.user.equals(currentUserId));
            if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'manager')) {
                return res.status(403).json({ error: "Chỉ owner, manager hoặc super_admin mới được thêm thành viên." });
            }
        }

        const userToAdd = await User.findById(userId);
        if (!userToAdd) {
            return res.status(404).json({ error: "Không tìm thấy người dùng để thêm." });
        }
        // For super admin, allow adding users from any site
        if (currentUserRole !== 'super_admin') {
            const orgSiteId = organization.site_id?.toString();
            const userSiteId = userToAdd.site_id?.toString();
            if (orgSiteId && userSiteId && orgSiteId !== userSiteId) {
                return res.status(400).json({ error: "Chỉ được thêm người dùng cùng site với tổ chức." });
            }
        }

        const isMember = organization.members.some(member => member.user.equals(userId));
        if (isMember) {
            return res.status(400).json({ error: "Người dùng này đã là thành viên của tổ chức." });
        }

        organization.members.push({ user: userId, role: role || 'member' });
        await organization.save();
        
        const updatedOrg = await Organization.findById(orgId).populate('members.user', 'name email avatar');

        res.status(200).json(updatedOrg);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Cập nhật vai trò của thành viên
export const updateMemberRole = async (req, res) => {
    try {
        const { orgId, userId } = req.params;
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({ error: "Vui lòng cung cấp vai trò mới." });
        }
        
        const organization = await Organization.findById(orgId);
        if (!organization) {
            return res.status(404).json({ error: "Không tìm thấy tổ chức." });
        }
        
        // Kiểm tra quyền của người dùng hiện tại (chỉ owner mới được sửa)
        const currentUserId = req.user._id;
        const currentUserRole = req.user.role;
        
        // Admin có thể sửa
        if (currentUserRole !== 'super_admin' && currentUserRole !== 'site_admin') {
            const currentMember = organization.members.find(m => m.user.equals(currentUserId));
            if (!currentMember || currentMember.role !== 'owner') {
                return res.status(403).json({ error: "Chỉ owner hoặc admin mới được thay đổi vai trò thành viên." });
            }
        }

        const memberToUpdate = organization.members.find(member => member.user.equals(userId));
        if (!memberToUpdate) {
            return res.status(404).json({ error: "Không tìm thấy thành viên trong tổ chức." });
        }

        if (memberToUpdate.role === 'owner') {
            return res.status(403).json({ error: "Không thể thay đổi vai trò của chủ sở hữu." });
        }

        memberToUpdate.role = role;
        await organization.save();
        
        const updatedOrg = await Organization.findById(orgId).populate('members.user', 'name email avatar');

        res.status(200).json(updatedOrg);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Xóa thành viên khỏi tổ chức
export const removeMember = async (req, res) => {
    try {
        const { orgId, userId } = req.params;

        const organization = await Organization.findById(orgId);
        if (!organization) {
            return res.status(404).json({ error: "Không tìm thấy tổ chức." });
        }
        
        // Kiểm tra quyền của người dùng hiện tại (chỉ owner mới được xóa)
        const currentUserId = req.user._id;
        const currentUserRole = req.user.role;
        
        // Admin có thể xóa
        if (currentUserRole !== 'super_admin' && currentUserRole !== 'site_admin') {
            const currentMember = organization.members.find(m => m.user.equals(currentUserId));
            if (!currentMember || currentMember.role !== 'owner') {
                return res.status(403).json({ error: "Chỉ owner hoặc admin mới được xóa thành viên." });
            }
        }
        
        const memberToRemove = organization.members.find(member => member.user.equals(userId));
        if (!memberToRemove) {
            return res.status(404).json({ error: "Không tìm thấy thành viên trong tổ chức." });
        }

        if (memberToRemove.role === 'owner') {
            return res.status(403).json({ error: "Không thể xóa chủ sở hữu khỏi tổ chức." });
        }

        organization.members = organization.members.filter(member => !member.user.equals(userId));
        await organization.save();

        res.status(200).json(organization);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Lấy danh sách tổ chức theo userId
export const getOrganizationsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: 'Missing userId parameter' });
        }
        const org = await Organization.findOne({ 'members.user': userId })
            .populate('manager', 'name email')
            .populate('members.user', 'name email avatar')
            .populate({
                path: 'services',
                populate: {
                    path: 'service',
                    select: 'name slug image authorizedLinks description'
                }
            })
            .sort({ createdAt: -1 });
        if (!org) {
            return res.status(404).json({ error: 'Không tìm thấy tổ chức nào.' });
        }
        res.json(org);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Lấy danh sách users chưa thuộc tổ chức nào (trong cùng site)
export const getAvailableUsers = async (req, res) => {
    try {
        const { siteId } = req.query;
        
        // Lấy site_id từ query hoặc từ user hiện tại
        let targetSiteId = siteId;
        if (!targetSiteId) {
            targetSiteId = req.user.site_id;
        }
        
        if (!targetSiteId) {
            return res.status(400).json({ error: "Không xác định được site_id" });
        }

        // Lấy tất cả user IDs đã thuộc tổ chức nào đó trong site này
        const organizations = await Organization.find({ site_id: targetSiteId });
        const usersInOrganizations = [];
        
        organizations.forEach(org => {
            org.members.forEach(member => {
                if (!usersInOrganizations.includes(member.user.toString())) {
                    usersInOrganizations.push(member.user.toString());
                }
            });
        });

        // Lấy users từ site này nhưng chưa thuộc tổ chức nào
        const availableUsers = await User.find({
            site_id: targetSiteId,
            _id: { $nin: usersInOrganizations }
        }).select('_id name email avatar');

        res.json(availableUsers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}; 
