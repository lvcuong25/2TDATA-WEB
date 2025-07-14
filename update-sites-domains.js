// Update sites with new domain mappings from host file
// Host file entries:
// 127.0.0.1 site1.localhost
// 127.0.0.1 site2.localhost  
// 127.0.0.1 affiliate1.localhost
// 127.0.0.1 affiliate2.localhost
// 127.0.0.1 partner.localhost
// 127.0.0.1 partner-a.2tdata.com
// 127.0.0.1 partner-b.2tdata.com
// 127.0.0.1 demo.localhost

db = db.getSiblingDB('2TDATA');

// Update main site
db.sites.updateOne(
    { name: "2TDATA - Master Platform" },
    { 
        $set: { 
            domains: ["localhost", "2tdata.com", "www.2tdata.com"],
            description: "Main platform with super admin access"
        } 
    }
);

// Update TechHub to site1
db.sites.updateOne(
    { name: "TechHub Affiliate" },
    { 
        $set: { 
            name: "Site 1 - Tech Affiliate",
            domains: ["site1.localhost", "affiliate1.localhost"],
            description: "Tech affiliate site - managed by site admin"
        } 
    }
);

// Update FinanceFlow to site2
db.sites.updateOne(
    { name: "FinanceFlow Affiliate" },
    { 
        $set: { 
            name: "Site 2 - Finance Affiliate",
            domains: ["site2.localhost", "affiliate2.localhost"],
            description: "Finance affiliate site - managed by site admin"
        } 
    }
);

// Update or create Partner A site
db.sites.updateOne(
    { name: "HealthCore Affiliate" },
    { 
        $set: { 
            name: "Partner A - Premium Affiliate",
            domains: ["partner-a.2tdata.com", "partner.localhost"],
            description: "Premium partner with custom domain",
            theme_config: {
                primaryColor: "#10B981",
                secondaryColor: "#059669",
                layout: "modern"
            }
        } 
    }
);

// Update or create Partner B site
db.sites.updateOne(
    { name: "EduPlatform Affiliate" },
    { 
        $set: { 
            name: "Partner B - Enterprise Affiliate",
            domains: ["partner-b.2tdata.com"],
            description: "Enterprise partner with custom domain",
            theme_config: {
                primaryColor: "#3B82F6",
                secondaryColor: "#1D4ED8",
                layout: "enterprise"
            }
        } 
    }
);

// Update GameZone to Demo site
db.sites.updateOne(
    { name: "GameZone Affiliate" },
    { 
        $set: { 
            name: "Demo Affiliate Site",
            domains: ["demo.localhost"],
            description: "Demo site for testing and presentations"
        } 
    }
);

// Remove any test sites
db.sites.deleteMany({ name: { $in: ["Test Site", "Unauthorized Site", "Unauthorized Test Site"] } });

// Display updated sites
print("\nUpdated Sites:");
print("==============");
db.sites.find().forEach(function(site) {
    print("\nSite: " + site.name);
    print("ID: " + site._id);
    print("Domains: " + site.domains.join(", "));
    print("Status: " + site.status);
    if (site.description) {
        print("Description: " + site.description);
    }
    print("---");
});
