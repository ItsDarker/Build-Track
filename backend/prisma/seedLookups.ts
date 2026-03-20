/**
 * Seed Lookup Data for all BuildTrack modules
 * Run: npx ts-node -P tsconfig.json prisma/seedLookups.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LOOKUPS: { moduleSlug: string; category: string; items: string[] }[] = [
  // design-configurator
  {
    moduleSlug: 'design-configurator',
    category: 'Product/Style',
    items: ['Modern Shaker', 'Classic Raised Panel', 'Flat Slab', 'Traditional Beadboard', 'Contemporary Handle-less', 'Craftsman', 'Rustic French Country'],
  },
  {
    moduleSlug: 'design-configurator',
    category: 'Material/Finish',
    items: ['Solid Wood - Maple', 'Solid Wood - Oak', 'Solid Wood - Cherry', 'MDF with Veneer', 'Thermofoil', 'Acrylic', 'Laminate', 'Melamine', 'Plywood'],
  },
  {
    moduleSlug: 'design-configurator',
    category: 'Color/Finish Code',
    items: ['White (W01)', 'Off-White (W02)', 'Antique White (W03)', 'Cream (C01)', 'Light Grey (G01)', 'Charcoal Grey (G02)', 'Navy Blue (B01)', 'Forest Green (GR01)', 'Walnut (BR01)', 'Espresso (BR02)', 'Natural Oak (N01)', 'Black Matte (BK01)', 'Stainless Steel (SS01)'],
  },
  {
    moduleSlug: 'design-configurator',
    category: 'Hardware/Accessories',
    items: ['Bar Pull - Brushed Nickel', 'Bar Pull - Matte Black', 'Bar Pull - Satin Brass', 'Knob - Round Chrome', 'Knob - Square Matte Black', 'Cup Pull - Antique Bronze', 'Soft-Close Hinges', 'Undermount Drawer Slides', 'Lazy Susan - Round', 'Pull-Out Trash Bin', 'Under-Cabinet Lighting', 'Glass Door Insert', 'Open Shelving Bracket'],
  },
  {
    moduleSlug: 'design-configurator',
    category: 'Design Status',
    items: ['Draft', 'Sent for Review', 'Revision Requested', 'Approved', 'Archived'],
  },

  // crm-leads
  {
    moduleSlug: 'crm-leads',
    category: 'Project Type',
    items: ['Kitchen', 'Bathroom', 'Office', 'Living Room', 'Bedroom', 'Laundry Room', 'Garage', 'Full Home', 'Commercial - Office', 'Commercial - Retail', 'Other'],
  },
  {
    moduleSlug: 'crm-leads',
    category: 'Source',
    items: ['Website', 'Referral', 'Walk-in', 'Google Ads', 'Facebook Ads', 'Instagram', 'Trade Show', 'Repeat Customer', 'Cold Call', 'Other'],
  },
  {
    moduleSlug: 'crm-leads',
    category: 'Lead Status',
    items: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiating', 'Won', 'Lost', 'On Hold'],
  },
  {
    moduleSlug: 'crm-leads',
    category: 'Budget range',
    items: ['Under $5,000', '$5,000-$10,000', '$10,000-$25,000', '$25,000-$50,000', '$50,000-$100,000', 'Over $100,000', 'To be confirmed'],
  },

  // quoting-contracts
  {
    moduleSlug: 'quoting-contracts',
    category: 'Quote Status',
    items: ['Draft', 'Sent', 'Revised', 'Accepted', 'Rejected', 'Expired'],
  },
  {
    moduleSlug: 'quoting-contracts',
    category: 'Payment Terms',
    items: ['50% Deposit, 50% on Completion', '30% Deposit, 70% on Completion', 'Full Payment Upfront', 'Net 30', 'Net 60', 'Progress Billing'],
  },

  // approval-workflow
  {
    moduleSlug: 'approval-workflow',
    category: 'Approval Type',
    items: ['Design Approval', 'Quote Approval', 'Change Order Approval', 'Final Sign-off'],
  },
  {
    moduleSlug: 'approval-workflow',
    category: 'Status',
    items: ['Pending', 'Approved', 'Rejected', 'Revision Requested'],
  },

  // work-orders
  {
    moduleSlug: 'work-orders',
    category: 'Work Type',
    items: ['Design', 'Fabrication', 'Assembly', 'Installation', 'Site Measurement', 'Delivery', 'Repair', 'Other'],
  },
  {
    moduleSlug: 'work-orders',
    category: 'Priority',
    items: ['Low', 'Medium', 'High', 'Critical', 'Rush'],
  },
  {
    moduleSlug: 'work-orders',
    category: 'Status',
    items: ['Assigned', 'In Progress', 'On Hold', 'Ready for QC', 'Completed', 'Cancelled'],
  },

  // quality-control
  {
    moduleSlug: 'quality-control',
    category: 'QC Result',
    items: ['Pass', 'Fail - Minor', 'Fail - Major', 'Conditional Pass', 'Rework Required'],
  },
  {
    moduleSlug: 'quality-control',
    category: 'Severity',
    items: ['Low', 'Medium', 'High', 'Critical'],
  },
  {
    moduleSlug: 'quality-control',
    category: 'Disposition',
    items: ['Rework', 'Scrap', 'Accept As-Is', 'Customer Decision Required'],
  },

  // procurement
  {
    moduleSlug: 'procurement',
    category: 'PO Status',
    items: ['Draft', 'Sent to Supplier', 'Partially Received', 'Fully Received', 'Closed', 'Cancelled'],
  },
  {
    moduleSlug: 'procurement',
    category: 'Supplier',
    items: ['BuildSupply Co.', 'National Hardware', 'Cabinetry Direct', 'Timber Masters', 'Hardware World', 'Finish & Fit Ltd.', 'Metal Works Inc.'],
  },

  // delivery-installation
  {
    moduleSlug: 'delivery-installation',
    category: 'Delivery Type',
    items: ['Delivery Only', 'Delivery and Installation', 'Installation Only', 'Site Pickup'],
  },
  {
    moduleSlug: 'delivery-installation',
    category: 'Status',
    items: ['Scheduled', 'Out for Delivery', 'Delivered', 'Installed', 'Failed Attempt', 'Rescheduled'],
  },

  // billing-invoicing
  {
    moduleSlug: 'billing-invoicing',
    category: 'Invoice Status',
    items: ['Draft', 'Sent', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled', 'Refunded'],
  },
  {
    moduleSlug: 'billing-invoicing',
    category: 'Payment Method',
    items: ['Credit Card', 'Bank Transfer / EFT', 'Cheque', 'Cash', 'Financing', 'PayPal', 'E-Transfer'],
  },

  // support-warranty
  {
    moduleSlug: 'support-warranty',
    category: 'Ticket Type',
    items: ['Support Request', 'Warranty Claim', 'Service Issue', 'Damage Report', 'Missing Item'],
  },
  {
    moduleSlug: 'support-warranty',
    category: 'Service Type',
    items: ['Repair', 'Replacement - Parts', 'Replacement - Full Unit', 'Refund', 'On-site Visit', 'Customer Education'],
  },
  {
    moduleSlug: 'support-warranty',
    category: 'Priority',
    items: ['Low', 'Medium', 'High', 'Critical', 'Emergency'],
  },

  // manufacturing
  {
    moduleSlug: 'manufacturing',
    category: 'Current Step / Station',
    items: ['Cutting', 'Edge Banding', 'Drilling / CNC', 'Assembly', 'Finishing / Painting', 'Hardware Installation', 'Quality Check', 'Packaging'],
  },

  // production-scheduling
  {
    moduleSlug: 'production-scheduling',
    category: 'Work Center / Station',
    items: ['Cutting Station', 'CNC Machine', 'Edge Bander', 'Assembly Bay 1', 'Assembly Bay 2', 'Spray Booth', 'Packaging Area', 'Staging Area'],
  },

  // packaging
  {
    moduleSlug: 'packaging',
    category: 'Packing Status',
    items: ['Not Packed', 'Partially Packed', 'Packed', 'Staged for Delivery'],
  },

  // project-requirements
  {
    moduleSlug: 'project-requirements',
    category: 'Room list',
    items: ['Kitchen', 'Master Bathroom', 'Bathroom 2', 'Bathroom 3', 'Laundry Room', 'Home Office', 'Walk-in Closet', 'Mudroom', 'Garage', 'Living Room', 'Dining Room'],
  },

  // bom-materials-planning
  {
    moduleSlug: 'bom-materials-planning',
    category: 'Category',
    items: ['Material', 'Hardware', 'Consumable', 'Fastener', 'Packing Material', 'Finishing Product'],
  },
  {
    moduleSlug: 'bom-materials-planning',
    category: 'Unit of Measure',
    items: ['pcs', 'sheet', 'lin ft', 'sq ft', 'kg', 'litre', 'bag', 'box', 'roll'],
  },
  {
    moduleSlug: 'bom-materials-planning',
    category: 'BOM Status',
    items: ['Draft', 'Review', 'Approved - Final'],
  },

  // job-confirmation
  {
    moduleSlug: 'job-confirmation',
    category: 'Status',
    items: ['Open', 'In Production', 'Ready for Delivery', 'Delivered', 'Completed', 'Cancelled'],
  },

  // closure
  {
    moduleSlug: 'closure',
    category: 'Close Reason',
    items: ['Successfully Completed', 'Cancelled by Customer', 'Cancelled by Company', 'On Hold Indefinitely', 'Merged with Another Project'],
  },
];

async function main() {
  console.log('Seeding module lookups...');

  for (const lookup of LOOKUPS) {
    for (let i = 0; i < lookup.items.length; i++) {
      const item = lookup.items[i];
      await prisma.lookup.upsert({
        where: {
          moduleSlug_category_value: {
            moduleSlug: lookup.moduleSlug,
            category: lookup.category,
            value: item,
          },
        },
        update: { label: item, order: i, isActive: true },
        create: {
          moduleSlug: lookup.moduleSlug,
          category: lookup.category,
          value: item,
          label: item,
          order: i,
          isActive: true,
        },
      });
    }
    console.log(`✓ Seeded ${lookup.items.length} items for [${lookup.moduleSlug}] → ${lookup.category}`);
  }

  console.log('\nLookup seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
