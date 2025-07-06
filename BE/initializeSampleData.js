import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Import models
import Site from './src/model/Site.js';
import User from './src/model/User.js';
import Blog from './src/model/Blog.js';
import Role from './src/model/Role.js';
import Permission from './src/model/Permission.js';
import RolePermission from './src/model/RolePermission.js';
import Organization from './src/model/Organization.js';
import UserInfo from './src/model/UserInfo.js';

// Load environment variables
dotenv.config({ path: './.env.production' });

// Sample base64 logo (small transparent PNG)
const SAMPLE_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// Sample data
const sampleSites = [
  {
    name: 'Main Site',
    domains: ['trunglq8.com', 'www.trunglq8.com'],
    theme_config: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1F2937',
      logoUrl: SAMPLE_LOGO_BASE64,
      layout: 'default'
    },
    logo_url: SAMPLE_LOGO_BASE64,
    status: 'active',
    settings: {
      allowRegistration: true,
      requireEmailVerification: false,
      timezone: 'Asia/Ho_Chi_Minh',
      language: 'vi',
      maxUsers: 5000,
      iframeUrl: 'https://example.com/embed'
    }
  },
  {
    name: 'Test Site',
    domains: ['test.2tdata.com'],
    theme_config: {
      primaryColor: '#10B981',
      secondaryColor: '#374151',
      logoUrl: SAMPLE_LOGO_BASE64,
      layout: 'modern'
    },
    logo_url: SAMPLE_LOGO_BASE64,
    status: 'active',
    settings: {
      allowRegistration: false,
      requireEmailVerification: true,
      timezone: 'UTC',
      language: 'en',
      maxUsers: 1000
    }
  },
  {
    name: 'Affiliate Site 1',
    domains: ['site1.trunglq8.com'],
    theme_config: {
      primaryColor: '#F59E0B',
      secondaryColor: '#111827',
      logoUrl: SAMPLE_LOGO_BASE64,
      layout: 'classic'
    },
    logo_url: SAMPLE_LOGO_BASE64,
    status: 'active',
    settings: {
      allowRegistration: true,
      requireEmailVerification: false,
      timezone: 'Asia/Ho_Chi_Minh',
      language: 'vi',
      maxUsers: 2000
    }
  },
  {
    name: 'Affiliate Site 2',
    domains: ['site2.trunglq8.com'],
    theme_config: {
      primaryColor: '#EF4444',
      secondaryColor: '#1F2937',
      logoUrl: SAMPLE_LOGO_BASE64,
      layout: 'default'
    },
    logo_url: SAMPLE_LOGO_BASE64,
    status: 'active',
    settings: {
      allowRegistration: true,
      requireEmailVerification: true,
      timezone: 'Asia/Ho_Chi_Minh',
      language: 'vi',
      maxUsers: 1500
    }
  }
];

const samplePermissions = [
  { name: 'site.create', description: 'Create new sites', category: 'site', is_system: true },
  { name: 'site.read', description: 'View sites', category: 'site', is_system: true },
  { name: 'site.update', description: 'Update sites', category: 'site', is_system: true },
  { name: 'site.delete', description: 'Delete sites', category: 'site', is_system: true },
  { name: 'user.create', description: 'Create new users', category: 'user', is_system: true },
  { name: 'user.read', description: 'View users', category: 'user', is_system: true },
  { name: 'user.update', description: 'Update users', category: 'user', is_system: true },
  { name: 'user.delete', description: 'Delete users', category: 'user', is_system: true },
  { name: 'content.create', description: 'Create content', category: 'content', is_system: true },
  { name: 'content.read', description: 'View content', category: 'content', is_system: true },
  { name: 'content.update', description: 'Update content', category: 'content', is_system: true },
  { name: 'content.delete', description: 'Delete content', category: 'content', is_system: true },
  { name: 'analytics.read', description: 'View analytics', category: 'analytics', is_system: true },
  { name: 'analytics.export', description: 'Export analytics', category: 'analytics', is_system: true },
  { name: 'system.settings', description: 'Manage system settings', category: 'system', is_system: true },
  { name: 'system.logs', description: 'View system logs', category: 'system', is_system: true }
];

const sampleRoles = [
  {
    name: 'super_admin',
    get_user: true,
    create_user: true,
    update_user: true,
    delete_user: true,
    restore_user: true,
    create_role: true,
    update_role: true,
    delete_role: true
  },
  {
    name: 'site_admin',
    get_user: true,
    create_user: true,
    update_user: true,
    delete_user: false,
    restore_user: true,
    create_role: false,
    update_role: false,
    delete_role: false
  },
  {
    name: 'site_moderator',
    get_user: true,
    create_user: false,
    update_user: true,
    delete_user: false,
    restore_user: false,
    create_role: false,
    update_role: false,
    delete_role: false
  },
  {
    name: 'member',
    get_user: false,
    create_user: false,
    update_user: false,
    delete_user: false,
    restore_user: false,
    create_role: false,
    update_role: false,
    delete_role: false
  }
];

const sampleOrganizations = [
  {
    name: '2TData Corporation',
    email: 'info@2tdata.com',
    phone: '+84-123-456-789',
    address: 'Ho Chi Minh City, Vietnam',
    identifier: '2TDATA-001',
    taxCode: 'VN123456789',
    logo: SAMPLE_LOGO_BASE64,
    active: true
  },
  {
    name: 'Tech Solutions Ltd',
    email: 'contact@techsolutions.com',
    phone: '+84-987-654-321',
    address: 'Hanoi, Vietnam',
    identifier: 'TECH-SOL-002',
    taxCode: 'VN987654321',
    logo: SAMPLE_LOGO_BASE64,
    active: true
  }
];

async function connectDB() {
  try {
    const mongoUri = process.env.DB_URI || 'mongodb://localhost:27017/2tdata';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

async function clearExistingData() {
  console.log('🧹 Clearing existing data...');
  
  const collections = [
    Site, User, Blog, Role, Permission, 
    RolePermission, Organization, UserInfo
  ];
  
  for (const Model of collections) {
    try {
      await Model.deleteMany({});
      console.log(`   Cleared ${Model.modelName} collection`);
    } catch (error) {
      console.log(`   Warning: Could not clear ${Model.modelName}:`, error.message);
    }
  }
}

async function createPermissions() {
  console.log('🔐 Creating permissions...');
  
  for (const permissionData of samplePermissions) {
    try {
      await Permission.create(permissionData);
      console.log(`   Created permission: ${permissionData.name}`);
    } catch (error) {
      console.log(`   Warning: Could not create permission ${permissionData.name}:`, error.message);
    }
  }
}

async function createRoles() {
  console.log('👥 Creating roles...');
  
  for (const roleData of sampleRoles) {
    try {
      await Role.create(roleData);
      console.log(`   Created role: ${roleData.name}`);
    } catch (error) {
      console.log(`   Warning: Could not create role ${roleData.name}:`, error.message);
    }
  }
}

async function createSites() {
  console.log('🌐 Creating sites...');
  
  const createdSites = [];
  
  for (const siteData of sampleSites) {
    try {
      const site = await Site.create(siteData);
      createdSites.push(site);
      console.log(`   Created site: ${site.name} (${site.domains.join(', ')})`);
    } catch (error) {
      console.log(`   Warning: Could not create site ${siteData.name}:`, error.message);
    }
  }
  
  return createdSites;
}

async function createUsers(sites) {
  console.log('👤 Creating users...');
  
  const createdUsers = [];
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // Create super admin
  try {
    const superAdmin = await User.create({
      email: 'superadmin@2tdata.com',
      name: 'Super Administrator',
      password: hashedPassword,
      role: 'super_admin',
      phone: '+84-900-000-001',
      address: 'Ho Chi Minh City, Vietnam',
      age: 30,
      avatar: SAMPLE_LOGO_BASE64,
      active: true
    });
    createdUsers.push(superAdmin);
    console.log(`   Created super admin: ${superAdmin.email}`);
  } catch (error) {
    console.log(`   Warning: Could not create super admin:`, error.message);
  }
  
  // Create site admins for each site
  for (let i = 0; i < sites.length; i++) {
    const site = sites[i];
    try {
      const siteAdmin = await User.create({
        site_id: site._id,
        email: `admin${i + 1}@${site.domains[0]}`,
        name: `Site Admin ${i + 1}`,
        password: hashedPassword,
        role: 'site_admin',
        phone: `+84-900-000-${String(i + 2).padStart(3, '0')}`,
        address: `Office ${i + 1}, Vietnam`,
        age: 25 + i,
        avatar: SAMPLE_LOGO_BASE64,
        active: true
      });
      
      // Add site admin to site
      site.site_admins.push({
        user_id: siteAdmin._id,
        role: 'site_admin',
        permissions: ['manage_users', 'manage_content', 'manage_settings', 'view_analytics']
      });
      await site.save();
      
      createdUsers.push(siteAdmin);
      console.log(`   Created site admin: ${siteAdmin.email} for ${site.name}`);
    } catch (error) {
      console.log(`   Warning: Could not create site admin for ${site.name}:`, error.message);
    }
  }
  
  // Create sample members for each site
  for (let i = 0; i < sites.length; i++) {
    const site = sites[i];
    
    for (let j = 1; j <= 3; j++) {
      try {
        const member = await User.create({
          site_id: site._id,
          email: `member${j}@${site.domains[0]}`,
          name: `Member ${j} - ${site.name}`,
          password: hashedPassword,
          role: 'member',
          phone: `+84-900-${String(i + 1).padStart(2, '0')}${String(j).padStart(2, '0')}`,
          address: `Address ${j}, Vietnam`,
          age: 20 + j,
          active: true
        });
        createdUsers.push(member);
        console.log(`   Created member: ${member.email} for ${site.name}`);
      } catch (error) {
        console.log(`   Warning: Could not create member ${j} for ${site.name}:`, error.message);
      }
    }
  }
  
  return createdUsers;
}

async function createOrganizations(users) {
  console.log('🏢 Creating organizations...');
  
  const createdOrganizations = [];
  
  for (let i = 0; i < sampleOrganizations.length; i++) {
    const orgData = sampleOrganizations[i];
    
    // Find a suitable manager (prefer super admin or site admin)
    const manager = users.find(user => 
      user.role === 'super_admin' || user.role === 'site_admin'
    ) || users[0];
    
    try {
      const organization = await Organization.create({
        ...orgData,
        manager: manager._id,
        members: [
          { user: manager._id, role: 'owner' }
        ]
      });
      
      createdOrganizations.push(organization);
      console.log(`   Created organization: ${organization.name}`);
    } catch (error) {
      console.log(`   Warning: Could not create organization ${orgData.name}:`, error.message);
    }
  }
  
  return createdOrganizations;
}

async function createBlogs(sites) {
  console.log('📝 Creating blog posts...');
  
  const sampleBlogPosts = [
    {
      title: 'Welcome to 2TData Platform',
      content: 'This is the first blog post on our new platform. We are excited to share our journey with you!',
      image: SAMPLE_LOGO_BASE64
    },
    {
      title: 'Getting Started Guide',
      content: 'Here is a comprehensive guide on how to get started with our platform. Follow these steps to maximize your experience.',
      image: SAMPLE_LOGO_BASE64
    },
    {
      title: 'New Features Update',
      content: 'We have released new features that will enhance your productivity. Check out what\'s new in this latest update.',
      image: SAMPLE_LOGO_BASE64
    },
    {
      title: 'Tips and Tricks',
      content: 'Learn some useful tips and tricks to make the most out of our platform. These insights will help you work more efficiently.',
      image: SAMPLE_LOGO_BASE64
    }
  ];
  
  for (const site of sites) {
    for (let i = 0; i < sampleBlogPosts.length; i++) {
      const blogData = sampleBlogPosts[i];
      try {
        const blog = await Blog.create({
          site_id: site._id,
          title: `${blogData.title} - ${site.name}`,
          content: blogData.content,
          image: blogData.image
        });
        console.log(`   Created blog: "${blog.title}" for ${site.name}`);
      } catch (error) {
        console.log(`   Warning: Could not create blog for ${site.name}:`, error.message);
      }
    }
  }
}

async function createUserInfos(users) {
  console.log('ℹ️ Creating user info records...');
  
  for (const user of users.slice(0, 5)) { // Create info for first 5 users only
    try {
      const userInfo = await UserInfo.create({
        name: user.name,
        email: user.email,
        phoneNumber: user.phone || '+84-000-000-000'
      });
      console.log(`   Created user info for: ${user.email}`);
    } catch (error) {
      console.log(`   Warning: Could not create user info for ${user.email}:`, error.message);
    }
  }
}

async function createRolePermissions() {
  console.log('🔗 Creating role-permission mappings...');
  
  const permissions = await Permission.find({});
  const superAdminPermissions = permissions.map(p => p._id);
  
  try {
    // Super admin gets all permissions
    for (const permissionId of superAdminPermissions) {
      await RolePermission.create({
        role: 'super_admin',
        permission_id: permissionId
      });
    }
    console.log(`   Assigned all permissions to super_admin role`);
  } catch (error) {
    console.log(`   Warning: Could not create super admin role permissions:`, error.message);
  }
  
  // Site admin gets limited permissions
  const siteAdminPermissionNames = [
    'site.read', 'site.update',
    'user.create', 'user.read', 'user.update',
    'content.create', 'content.read', 'content.update', 'content.delete',
    'analytics.read'
  ];
  
  try {
    for (const permName of siteAdminPermissionNames) {
      const permission = permissions.find(p => p.name === permName);
      if (permission) {
        await RolePermission.create({
          role: 'site_admin',
          permission_id: permission._id
        });
      }
    }
    console.log(`   Assigned limited permissions to site_admin role`);
  } catch (error) {
    console.log(`   Warning: Could not create site admin role permissions:`, error.message);
  }
}

async function updateSiteStats(sites) {
  console.log('📊 Updating site statistics...');
  
  for (const site of sites) {
    try {
      const userCount = await User.countDocuments({ site_id: site._id });
      const blogCount = await Blog.countDocuments({ site_id: site._id });
      
      await Site.findByIdAndUpdate(site._id, {
        'stats.totalUsers': userCount,
        'stats.totalContent': blogCount,
        'stats.lastActivity': new Date()
      });
      
      console.log(`   Updated stats for ${site.name}: ${userCount} users, ${blogCount} blogs`);
    } catch (error) {
      console.log(`   Warning: Could not update stats for ${site.name}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Initializing sample data for 2TDATA system...\n');
  
  try {
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await clearExistingData();
    console.log('');
    
    // Create all data
    await createPermissions();
    console.log('');
    
    await createRoles();
    console.log('');
    
    const sites = await createSites();
    console.log('');
    
    const users = await createUsers(sites);
    console.log('');
    
    const organizations = await createOrganizations(users);
    console.log('');
    
    await createBlogs(sites);
    console.log('');
    
    await createUserInfos(users);
    console.log('');
    
    await createRolePermissions();
    console.log('');
    
    await updateSiteStats(sites);
    console.log('');
    
    console.log('✅ Sample data initialization completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   - Sites: ${sites.length}`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Organizations: ${organizations.length}`);
    console.log(`   - Permissions: ${samplePermissions.length}`);
    console.log(`   - Roles: ${sampleRoles.length}`);
    console.log('');
    console.log('🔑 Login credentials:');
    console.log('   Super Admin: superadmin@2tdata.com / admin123');
    console.log('   Site Admins: admin1@trunglq8.com, admin2@test.2tdata.com, etc. / admin123');
    console.log('   Members: member1@trunglq8.com, member2@test.2tdata.com, etc. / admin123');
    
  } catch (error) {
    console.error('❌ Error during initialization:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
main();
