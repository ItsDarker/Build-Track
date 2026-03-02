import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Each entry: { moduleSlug: string | null, category: string, values: string[] }
// moduleSlug: null = available everywhere (fallback), or a specific module slug
const defaultLookups: { moduleSlug: string; category: string; values: string[] }[] = [
    // CRM / Leads
    { moduleSlug: 'crm-leads', category: 'Lead Status', values: ['New', 'Contacted', 'Qualified', 'Closed'] },
    { moduleSlug: 'crm-leads', category: 'Project Type', values: ['Kitchen', 'Bathroom', 'Office', 'Living Room', 'Outdoor', 'Other'] },
    { moduleSlug: 'crm-leads', category: 'Source', values: ['Website', 'Referral', 'Walk-in', 'Ads', 'Social Media', 'Other'] },
    { moduleSlug: 'crm-leads', category: 'Priority', values: ['Low', 'Medium', 'High', 'Critical'] },

    // Design Configurator
    { moduleSlug: 'design-configurator', category: 'Design Status', values: ['Draft', 'Sent for Review', 'Revision Requested', 'Approved', 'Archived'] },
    { moduleSlug: 'design-configurator', category: 'Product/Style', values: ['Modern', 'Traditional', 'Transitional', 'Industrial', 'Scandinavian', 'Custom'] },
    { moduleSlug: 'design-configurator', category: 'Material/Finish', values: ['Wood', 'Laminate', 'Metal', 'Glass', 'Stone', 'Veneer', 'Acrylic'] },
    { moduleSlug: 'design-configurator', category: 'Color/Finish Code', values: ['White', 'Black', 'Warm Gray', 'Natural Oak', 'Walnut', 'Cherry', 'Navy Blue', 'Forest Green'] },

    // Quoting & Contracts
    { moduleSlug: 'quoting-contracts', category: 'Quote Status', values: ['Draft', 'Sent', 'Revised', 'Accepted', 'Rejected', 'Expired'] },

    // Approval Workflow
    { moduleSlug: 'approval-workflow', category: 'Approval Type', values: ['Design', 'Quote', 'Change Order'] },
    { moduleSlug: 'approval-workflow', category: 'Status', values: ['Pending', 'Approved', 'Rejected'] },

    // Job Confirmation
    { moduleSlug: 'job-confirmation', category: 'Status', values: ['Open', 'In Production', 'Ready', 'Delivered', 'Closed'] },

    // Work Orders
    { moduleSlug: 'work-orders', category: 'Work Type', values: ['Design', 'Fabrication', 'Assembly', 'Installation', 'Repair', 'Other'] },
    { moduleSlug: 'work-orders', category: 'Status', values: ['Assigned', 'In Progress', 'On Hold', 'Ready for QC', 'Completed'] },
    { moduleSlug: 'work-orders', category: 'Priority', values: ['Low', 'Medium', 'High', 'Critical'] },

    // BOM / Materials Planning
    { moduleSlug: 'bom-materials-planning', category: 'BOM Status', values: ['Draft', 'Final'] },
    { moduleSlug: 'bom-materials-planning', category: 'Category', values: ['Material', 'Hardware', 'Consumable', 'Other'] },

    // Procurement
    { moduleSlug: 'procurement', category: 'PO Status', values: ['Draft', 'Sent', 'Partially Received', 'Received', 'Closed'] },

    // Production Scheduling
    { moduleSlug: 'production-scheduling', category: 'Status', values: ['Planned', 'Scheduled', 'In Progress', 'Done', 'Delayed'] },
    { moduleSlug: 'production-scheduling', category: 'Work Center / Station', values: ['Cutting', 'Edge Banding', 'Drilling', 'Assembly', 'Finishing', 'Packaging'] },

    // Manufacturing
    { moduleSlug: 'manufacturing', category: 'Issue Flags', values: ['Yes', 'No'] },

    // Quality Control
    { moduleSlug: 'quality-control', category: 'QC Result', values: ['Pass', 'Fail'] },
    { moduleSlug: 'quality-control', category: 'Severity', values: ['Low', 'Medium', 'High'] },
    { moduleSlug: 'quality-control', category: 'Disposition', values: ['Rework', 'Scrap', 'Accept-as-is'] },

    // Packaging
    { moduleSlug: 'packaging', category: 'Packing Status', values: ['Not Packed', 'Packed', 'Staged'] },

    // Delivery & Installation
    { moduleSlug: 'delivery-installation', category: 'Delivery Type', values: ['Delivery only', 'Install', 'Delivery & Install', 'Pickup'] },
    { moduleSlug: 'delivery-installation', category: 'Status', values: ['Scheduled', 'Out for Delivery', 'Delivered', 'Installed', 'Failed Attempt'] },

    // Billing & Invoicing
    { moduleSlug: 'billing-invoicing', category: 'Invoice Status', values: ['Draft', 'Sent', 'Paid', 'Partially Paid', 'Overdue'] },

    // Closure
    { moduleSlug: 'closure', category: 'Close Reason', values: ['Completed', 'Cancelled', 'Lost', 'On Hold'] },

    // Support & Warranty
    { moduleSlug: 'support-warranty', category: 'Ticket Type', values: ['Support Request', 'Warranty Claim', 'Service Issue'] },
    { moduleSlug: 'support-warranty', category: 'Priority', values: ['Low', 'Medium', 'High', 'Critical'] },
    { moduleSlug: 'support-warranty', category: 'Status', values: ['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed'] },
    { moduleSlug: 'support-warranty', category: 'Service Type', values: ['Repair', 'Replacement', 'Refund', 'Remote Support'] },
    { moduleSlug: 'support-warranty', category: 'Customer Satisfaction Rating', values: ['1 - Poor', '2 - Fair', '3 - Good', '4 - Very Good', '5 - Excellent'] },
];

// All modules get Task Status
const allModuleSlugs = [
    'crm-leads', 'project-requirements', 'design-configurator', 'quoting-contracts',
    'approval-workflow', 'job-confirmation', 'work-orders', 'support-warranty',
    'bom-materials-planning', 'procurement', 'production-scheduling', 'manufacturing',
    'quality-control', 'packaging', 'delivery-installation', 'billing-invoicing', 'closure'
];

allModuleSlugs.forEach((slug) => {
    defaultLookups.push({
        moduleSlug: slug,
        category: 'Task Status',
        values: ['New', 'In Progress', 'Completed']
    });
});

async function main() {
    console.log('Seeding per-module lookups...');

    // Clear old lookups first
    await prisma.lookup.deleteMany({});

    for (const entry of defaultLookups) {
        let order = 0;
        for (const val of entry.values) {
            order++;
            await prisma.lookup.create({
                data: {
                    moduleSlug: entry.moduleSlug,
                    category: entry.category,
                    value: val,
                    label: val,
                    order,
                    isActive: true
                }
            });
        }
        console.log(`  ✔ ${entry.moduleSlug} / ${entry.category}: ${entry.values.length} options`);
    }

    console.log('\n✅ Per-module lookups seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
