import Organization from '../model/Organization.js';
import User from '../model/User.js';

// Thêm tổ chức
export const createOrganization = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, email, phone, address, identifier, taxCode, logo } = req.body;
       
        const org = new Organization({
            name,
            manager: userId,
            email,
            phone,
            address,
            identifier,
            taxCode,
            logo,
            members: [{ user: userId, role: 'owner' }]
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
        const org = await Organization.findByIdAndDelete(id);
        if (!org) return res.status(404).json({ error: 'Organization not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
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
        const currentMember = organization.members.find(m => m.user.equals(currentUserId));
        if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'manager')) {
            return res.status(403).json({ error: "Chỉ owner hoặc manager mới được thêm thành viên." });
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
        
        // TODO: Thêm logic kiểm tra quyền của người dùng hiện tại (chỉ owner mới được sửa)

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
        
        // TODO: Thêm logic kiểm tra quyền của người dùng hiện tại (chỉ owner mới được xóa)
        
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