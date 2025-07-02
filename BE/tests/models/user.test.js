import User from '../../src/model/User.js';
import { clearTestDB, createTestUser } from '../../src/utils/testUtils.js';
import { hashPassword } from '../../src/utils/password.js';

describe('User Model', () => {
  beforeEach(async () => {
    await clearTestDB();
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'model@example.com',
        password: await hashPassword('TestPassword123!'),
        site_id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        role: 'member'
      };

      const user = await User.create(userData);

      expect(user).toBeTruthy();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.role).toBe(userData.role);
      expect(user.active).toBe(true); // Default value
      expect(user.createdAt).toBeTruthy();
      expect(user.updatedAt).toBeTruthy();
    });

    it('should set default values correctly', async () => {
      const userData = {
        email: 'defaults@example.com',
        site_id: '507f1f77bcf86cd799439011'
      };

      const user = await User.create(userData);

      expect(user.password).toBe('');
      expect(user.role).toBe('member');
      expect(user.active).toBe(true);
    });

    it('should require email field', async () => {
      const userData = {
        site_id: '507f1f77bcf86cd799439011',
        name: 'Test User'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require site_id field', async () => {
      const userData = {
        email: 'nosite@example.com',
        name: 'Test User'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        email: 'unique@example.com',
        site_id: '507f1f77bcf86cd799439011'
      };

      await User.create(userData);
      
      // Try to create another user with same email
      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('User Updates', () => {
    it('should update user information', async () => {
      const userData = {
        email: 'update@example.com',
        site_id: '507f1f77bcf86cd799439011',
        name: 'Original Name'
      };

      const user = await User.create(userData);
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { name: 'Updated Name', phone: '1234567890' },
        { new: true }
      );

      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.phone).toBe('1234567890');
    });

    it('should update timestamps on modification', async () => {
      const userData = {
        email: 'timestamp@example.com',
        site_id: '507f1f77bcf86cd799439011'
      };

      const user = await User.create(userData);
      const originalUpdatedAt = user.updatedAt;

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await User.findByIdAndUpdate(user._id, { name: 'Updated' });
      const updatedUser = await User.findById(user._id);

      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('User Queries', () => {
    it('should find user by email', async () => {
      const userData = {
        email: 'findme@example.com',
        site_id: '507f1f77bcf86cd799439011'
      };

      await User.create(userData);
      const foundUser = await User.findOne({ email: userData.email });

      expect(foundUser).toBeTruthy();
      expect(foundUser.email).toBe(userData.email);
    });

    it('should find active users only', async () => {
      const activeUserData = {
        email: 'active@example.com',
        site_id: '507f1f77bcf86cd799439011',
        active: true
      };

      const inactiveUserData = {
        email: 'inactive@example.com',
        site_id: '507f1f77bcf86cd799439011',
        active: false
      };

      await User.create(activeUserData);
      await User.create(inactiveUserData);

      const activeUsers = await User.find({ active: true });
      const inactiveUsers = await User.find({ active: false });

      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0].email).toBe(activeUserData.email);
      expect(inactiveUsers).toHaveLength(1);
      expect(inactiveUsers[0].email).toBe(inactiveUserData.email);
    });

    it('should filter users by role', async () => {
      const adminData = {
        email: 'admin@example.com',
        site_id: '507f1f77bcf86cd799439011',
        role: 'admin'
      };

      const memberData = {
        email: 'member@example.com',
        site_id: '507f1f77bcf86cd799439011',
        role: 'member'
      };

      await User.create(adminData);
      await User.create(memberData);

      const admins = await User.find({ role: 'admin' });
      const members = await User.find({ role: 'member' });

      expect(admins).toHaveLength(1);
      expect(admins[0].email).toBe(adminData.email);
      expect(members).toHaveLength(1);
      expect(members[0].email).toBe(memberData.email);
    });
  });

  describe('User Deletion', () => {
    it('should delete user successfully', async () => {
      const userData = {
        email: 'deleteme@example.com',
        site_id: '507f1f77bcf86cd799439011'
      };

      const user = await User.create(userData);
      await User.findByIdAndDelete(user._id);

      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });
  });
});
