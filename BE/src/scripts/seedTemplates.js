import mongoose from 'mongoose';
import TableTemplate from '../model/TableTemplate.js';
import TemplateCategory from '../model/TemplateCategory.js';
import User from '../model/User.js';

const seedTemplates = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2tdata');
    console.log('Connected to MongoDB');

    // Find or create super admin user
    let superAdmin = await User.findOne({ role: 'super_admin' });
    if (!superAdmin) {
      // Create a super admin user for seeding
      superAdmin = new User({
        name: 'Super Admin',
        email: 'admin@2tdata.com',
        role: 'super_admin'
      });
      await superAdmin.save();
      console.log('Created super admin:', superAdmin.email);
    } else {
      console.log('Found super admin:', superAdmin.email);
    }

    // Clear existing data
    await TableTemplate.deleteMany({});
    await TemplateCategory.deleteMany({});
    console.log('Cleared existing templates and categories');

    // Create categories first
    const categories = [
      { name: 'CRM', description: 'Customer Relationship Management', color: '#722ed1' },
      { name: 'Inventory', description: 'Product and Inventory Management', color: '#fa8c16' },
      { name: 'HR', description: 'Human Resources Management', color: '#13c2c2' },
      { name: 'Project', description: 'Project Management', color: '#52c41a' },
      { name: 'Finance', description: 'Financial Management', color: '#f5222d' },
      { name: 'Education', description: 'Educational Management', color: '#1890ff' },
      { name: 'Healthcare', description: 'Healthcare Management', color: '#eb2f96' },
      { name: 'Other', description: 'Other Templates', color: '#8c8c8c' }
    ];

    const createdCategories = {};
    for (const categoryData of categories) {
      const category = new TemplateCategory({
        ...categoryData,
        createdBy: superAdmin._id
      });
      await category.save();
      createdCategories[categoryData.name] = category._id;
      console.log('Created category:', category.name);
    }

    // Sample templates with database structure
    const templates = [
      {
        name: 'CRM System',
        description: 'Complete Customer Relationship Management system with customers, leads, deals, and activities.',
        category: createdCategories['CRM'],
        icon: '👥',
        tags: ['customer', 'sales', 'crm', 'leads'],
        tables: [
          {
            name: 'Customers',
            description: 'Customer information and contact details',
            columns: [
              {
                name: 'Customer Name',
                key: 'customer_name',
                dataType: 'text',
                isRequired: true,
                description: 'Full name of the customer'
              },
              {
                name: 'Email',
                key: 'email',
                dataType: 'email',
                isRequired: true,
                isUnique: true,
                description: 'Customer email address'
              },
              {
                name: 'Phone',
                key: 'phone',
                dataType: 'phone',
                description: 'Customer phone number'
              },
              {
                name: 'Company',
                key: 'company',
                dataType: 'text',
                description: 'Company name'
              },
              {
                name: 'Status',
                key: 'status',
                dataType: 'single_select',
                config: {
                  options: ['Lead', 'Prospect', 'Customer', 'Inactive']
                },
                description: 'Customer status'
              },
              {
                name: 'Last Contact',
                key: 'last_contact',
                dataType: 'date',
                description: 'Date of last contact'
              }
            ],
            sampleData: [
              {
                customer_name: 'John Smith',
                email: 'john@example.com',
                phone: '+1234567890',
                company: 'Acme Corp',
                status: 'Customer',
                last_contact: '2024-01-15'
              },
              {
                customer_name: 'Jane Doe',
                email: 'jane@techstart.com',
                phone: '+1987654321',
                company: 'TechStart Inc',
                status: 'Prospect',
                last_contact: '2024-01-10'
              }
            ]
          },
          {
            name: 'Deals',
            description: 'Sales deals and opportunities',
            columns: [
              {
                name: 'Deal Name',
                key: 'deal_name',
                dataType: 'text',
                isRequired: true,
                description: 'Name of the deal'
              },
              {
                name: 'Customer',
                key: 'customer',
                dataType: 'text',
                isRequired: true,
                description: 'Associated customer'
              },
              {
                name: 'Value',
                key: 'value',
                dataType: 'currency',
                isRequired: true,
                description: 'Deal value'
              },
              {
                name: 'Stage',
                key: 'stage',
                dataType: 'single_select',
                config: {
                  options: ['Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
                },
                description: 'Deal stage'
              },
              {
                name: 'Expected Close',
                key: 'expected_close',
                dataType: 'date',
                description: 'Expected close date'
              }
            ],
            sampleData: [
              {
                deal_name: 'Website Redesign',
                customer: 'John Smith',
                value: 15000,
                stage: 'Proposal',
                expected_close: '2024-02-15'
              }
            ]
          }
        ],
        createdBy: superAdmin._id,
        isPublic: true,
        complexity: 'intermediate',
        estimatedSetupTime: '10 minutes',
        features: ['validation', 'automation']
      },
      {
        name: 'E-commerce System',
        description: 'Complete e-commerce system with products, orders, customers, and inventory.',
        category: createdCategories['Inventory'],
        icon: '🛒',
        tags: ['ecommerce', 'products', 'orders', 'inventory'],
        tables: [
          {
            name: 'Products',
            description: 'Product catalog and inventory',
            columns: [
              {
                name: 'Product Name',
                key: 'product_name',
                dataType: 'text',
                isRequired: true,
                description: 'Name of the product'
              },
              {
                name: 'SKU',
                key: 'sku',
                dataType: 'text',
                isRequired: true,
                isUnique: true,
                description: 'Stock Keeping Unit'
              },
              {
                name: 'Category',
                key: 'category',
                dataType: 'single_select',
                config: {
                  options: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports']
                },
                description: 'Product category'
              },
              {
                name: 'Price',
                key: 'price',
                dataType: 'currency',
                isRequired: true,
                description: 'Product price'
              },
              {
                name: 'Stock Quantity',
                key: 'stock_quantity',
                dataType: 'number',
                isRequired: true,
                description: 'Available stock quantity'
              },
              {
                name: 'Description',
                key: 'description',
                dataType: 'text',
                description: 'Product description'
              }
            ],
            sampleData: [
              {
                product_name: 'Wireless Headphones',
                sku: 'WH-001',
                category: 'Electronics',
                price: 99.99,
                stock_quantity: 50,
                description: 'High-quality wireless headphones with noise cancellation'
              }
            ]
          },
          {
            name: 'Orders',
            description: 'Customer orders and order details',
            columns: [
              {
                name: 'Order Number',
                key: 'order_number',
                dataType: 'text',
                isRequired: true,
                isUnique: true,
                description: 'Unique order number'
              },
              {
                name: 'Customer Email',
                key: 'customer_email',
                dataType: 'email',
                isRequired: true,
                description: 'Customer email'
              },
              {
                name: 'Total Amount',
                key: 'total_amount',
                dataType: 'currency',
                isRequired: true,
                description: 'Total order amount'
              },
              {
                name: 'Status',
                key: 'status',
                dataType: 'single_select',
                config: {
                  options: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
                },
                description: 'Order status'
              },
              {
                name: 'Order Date',
                key: 'order_date',
                dataType: 'date',
                isRequired: true,
                description: 'Date of order'
              }
            ],
            sampleData: [
              {
                order_number: 'ORD-001',
                customer_email: 'john@example.com',
                total_amount: 199.98,
                status: 'Processing',
                order_date: '2024-01-15'
              }
            ]
          }
        ],
        createdBy: superAdmin._id,
        isPublic: true,
        complexity: 'advanced',
        estimatedSetupTime: '15 minutes',
        features: ['validation', 'automation', 'formula']
      },
      {
        name: 'Project Management',
        description: 'Project management system with projects, tasks, team members, and time tracking.',
        category: createdCategories['Project'],
        icon: '📋',
        tags: ['project', 'task', 'management', 'team'],
        tables: [
          {
            name: 'Projects',
            description: 'Project information and details',
            columns: [
              {
                name: 'Project Name',
                key: 'project_name',
                dataType: 'text',
                isRequired: true,
                description: 'Name of the project'
              },
              {
                name: 'Description',
                key: 'description',
                dataType: 'text',
                description: 'Project description'
              },
              {
                name: 'Status',
                key: 'status',
                dataType: 'single_select',
                config: {
                  options: ['Planning', 'In Progress', 'Review', 'Completed', 'On Hold']
                },
                defaultValue: 'Planning',
                description: 'Current project status'
              },
              {
                name: 'Priority',
                key: 'priority',
                dataType: 'single_select',
                config: {
                  options: ['Low', 'Medium', 'High', 'Critical']
                },
                description: 'Project priority level'
              },
              {
                name: 'Start Date',
                key: 'start_date',
                dataType: 'date',
                description: 'Project start date'
              },
              {
                name: 'Due Date',
                key: 'due_date',
                dataType: 'date',
                description: 'Project due date'
              },
              {
                name: 'Project Manager',
                key: 'project_manager',
                dataType: 'text',
                description: 'Assigned project manager'
              }
            ],
            sampleData: [
              {
                project_name: 'Website Redesign',
                description: 'Complete redesign of company website with modern UI/UX',
                status: 'In Progress',
                priority: 'High',
                start_date: '2024-01-01',
                due_date: '2024-03-31',
                project_manager: 'Alice Johnson'
              }
            ]
          },
          {
            name: 'Tasks',
            description: 'Project tasks and assignments',
            columns: [
              {
                name: 'Task Name',
                key: 'task_name',
                dataType: 'text',
                isRequired: true,
                description: 'Name of the task'
              },
              {
                name: 'Project',
                key: 'project',
                dataType: 'text',
                isRequired: true,
                description: 'Associated project'
              },
              {
                name: 'Assigned To',
                key: 'assigned_to',
                dataType: 'text',
                description: 'Person assigned to the task'
              },
              {
                name: 'Status',
                key: 'status',
                dataType: 'single_select',
                config: {
                  options: ['To Do', 'In Progress', 'Review', 'Done']
                },
                defaultValue: 'To Do',
                description: 'Task status'
              },
              {
                name: 'Due Date',
                key: 'due_date',
                dataType: 'date',
                description: 'Task due date'
              },
              {
                name: 'Priority',
                key: 'priority',
                dataType: 'single_select',
                config: {
                  options: ['Low', 'Medium', 'High', 'Critical']
                },
                description: 'Task priority'
              }
            ],
            sampleData: [
              {
                task_name: 'Design Homepage',
                project: 'Website Redesign',
                assigned_to: 'Bob Smith',
                status: 'In Progress',
                due_date: '2024-01-20',
                priority: 'High'
              }
            ]
          }
        ],
        createdBy: superAdmin._id,
        isPublic: true,
        complexity: 'intermediate',
        estimatedSetupTime: '12 minutes',
        features: ['validation', 'automation', 'formula']
      }
    ];

    // Create templates
    for (const templateData of templates) {
      const template = new TableTemplate(templateData);
      await template.save();
      console.log('Created template:', template.name);
    }

    console.log('✅ Successfully seeded templates!');
    console.log(`Created ${templates.length} templates`);

  } catch (error) {
    console.error('Error seeding templates:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seeder
seedTemplates();
