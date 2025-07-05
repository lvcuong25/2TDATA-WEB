// Switch to 2TDATA database
db = db.getSiblingDB('2TDATA');

// Create collections
db.createCollection('sites');
db.createCollection('users');
db.createCollection('services');
db.createCollection('blogs');
db.createCollection('organizations');

// Insert initial site data
db.sites.insertMany([
  {
    name: "2TDATA - Master Platform",
    domains: ["localhost", "2tdata.com", "www.2tdata.com"],
    theme_config: {
      primaryColor: "#3B82F6",
      secondaryColor: "#1F2937",
      layout: "default"
    },
    status: "active",
    settings: {
      allowRegistration: true,
      requireEmailVerification: false,
      timezone: "UTC",
      language: "en",
      maxUsers: 10000
    },
    stats: {
      totalUsers: 0,
      totalContent: 0,
      lastActivity: new Date()
    },
    site_admins: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "TechHub Affiliate",
    domains: ["techhub.localhost", "techhub.2tdata.com", "site1.localhost"],
    theme_config: {
      primaryColor: "#10B981",
      secondaryColor: "#065F46",
      layout: "modern"
    },
    logo_url: "/logos/techhub-logo.png",
    status: "active",
    settings: {
      allowRegistration: true,
      requireEmailVerification: false,
      timezone: "UTC",
      language: "en",
      maxUsers: 1000
    },
    stats: {
      totalUsers: 0,
      totalContent: 0,
      lastActivity: new Date()
    },
    site_admins: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "FinanceFlow Affiliate",
    domains: ["finance.localhost", "finance.2tdata.com", "site2.localhost"],
    theme_config: {
      primaryColor: "#7C3AED",
      secondaryColor: "#4C1D95",
      layout: "classic"
    },
    logo_url: "/logos/finance-logo.png",
    status: "active",
    settings: {
      allowRegistration: true,
      requireEmailVerification: true,
      timezone: "UTC",
      language: "en",
      maxUsers: 1000
    },
    stats: {
      totalUsers: 0,
      totalContent: 0,
      lastActivity: new Date()
    },
    site_admins: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Create indexes
db.sites.createIndex({ "domains": 1 }, { unique: true });
db.sites.createIndex({ "status": 1 });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "site_id": 1 });

print("✅ Database initialized with collections and sample data");
