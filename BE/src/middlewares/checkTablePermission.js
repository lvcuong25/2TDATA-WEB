import TablePermission from '../model/TablePermission.js';
import BaseMember from '../model/BaseMember.js';

// Kiểm tra quyền của user cho table
export const checkTablePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const { tableId } = req.params;
      const userId = req.user._id;

      if (!tableId) {
        return res.status(400).json({ message: 'Table ID is required' });
      }

      // Lấy thông tin table
      const table = await Table.findById(tableId).populate('databaseId');
      if (!table) {
        return res.status(404).json({ message: 'Table not found' });
      }

      // Kiểm tra user có phải member của database không
      const member = await BaseMember.findOne({ 
        databaseId: table.databaseId._id, 
        userId 
      });
      
      if (!member) {
        return res.status(403).json({ 
          message: 'You are not a member of this database' 
        });
      }

      // Owner và manager có quyền mặc định
      if (member.role === 'owner' || member.role === 'manager') {
        return next();
      }

      // Lấy quyền của user cho table này
      const permissions = await TablePermission.find({
        tableId,
        $or: [
          { targetType: 'all_members' },
          { targetType: 'specific_user', userId },
          { targetType: 'specific_role', role: member.role }
        ]
      });

      // Kiểm tra quyền cụ thể
      let hasPermission = false;
      permissions.forEach(permission => {
        if (permission.permissions && permission.permissions[requiredPermission]) {
          hasPermission = true;
        }
      });

      if (!hasPermission) {
        return res.status(403).json({ 
          message: `You don't have ${requiredPermission} permission for this table` 
        });
      }

      // Lưu thông tin table và member vào request
      req.table = table;
      req.member = member;
      next();

    } catch (error) {
      console.error('Error checking table permission:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

// Kiểm tra quyền xem table (bao gồm kiểm tra hidden)
export const checkTableViewPermission = async (req, res, next) => {
  try {
    const { tableId } = req.params;
    const userId = req.user._id;

    if (!tableId) {
      return res.status(400).json({ message: 'Table ID is required' });
    }

    // Lấy thông tin table
    const table = await Table.findById(tableId).populate('databaseId');
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Kiểm tra user có phải member của database không
    const member = await BaseMember.findOne({ 
      databaseId: table.databaseId._id, 
      userId 
    });
    
    if (!member) {
      return res.status(403).json({ 
        message: 'You are not a member of this database' 
      });
    }

    // Owner và manager có quyền mặc định
    if (member.role === 'owner' || member.role === 'manager') {
      req.table = table;
      req.member = member;
      return next();
    }

    // Lấy quyền của user cho table này
    const permissions = await TablePermission.find({
      tableId,
      $or: [
        { targetType: 'all_members' },
        { targetType: 'specific_user', userId },
        { targetType: 'specific_role', role: member.role }
      ]
    });

    // Kiểm tra quyền xem và ẩn
    let canView = false;
    let isHidden = false;

    permissions.forEach(permission => {
      if (permission.permissions) {
        if (permission.permissions.canView) {
          canView = true;
        }
        if (permission.permissions.isHidden) {
          isHidden = true;
        }
      }
    });

    // Nếu table bị ẩn và user không có quyền xem
    if (isHidden && !canView) {
      return res.status(404).json({ 
        message: 'Table not found' // Trả về 404 để ẩn table
      });
    }

    if (!canView) {
      return res.status(403).json({ 
        message: 'You don\'t have view permission for this table' 
      });
    }

    req.table = table;
    req.member = member;
    next();

  } catch (error) {
    console.error('Error checking table view permission:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Kiểm tra quyền quản lý (chỉ manager/owner)
export const checkManagementPermission = async (req, res, next) => {
  try {
    const { databaseId } = req.params;
    const userId = req.user._id;

    if (!databaseId) {
      return res.status(400).json({ message: 'Database ID is required' });
    }

    // Kiểm tra user có phải member của database không
    const member = await BaseMember.findOne({ 
      databaseId, 
      userId 
    });
    
    if (!member) {
      return res.status(403).json({ 
        message: 'You are not a member of this database' 
      });
    }

    // Chỉ owner và manager mới có quyền quản lý
    if (member.role !== 'owner' && member.role !== 'manager') {
      return res.status(403).json({ 
        message: 'Only database managers and owners can manage permissions' 
      });
    }

    req.member = member;
    next();

  } catch (error) {
    console.error('Error checking management permission:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
