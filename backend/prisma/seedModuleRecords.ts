import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Module Records Seeding Script
 * Creates 2-3 realistic records per module across 3 projects following BuildTrack workflow lifecycle:
 * - MKR: Mediterranean Kitchen Renovation (fully complete → Closure)
 * - CLM: Contemporary Living Room Makeover (mid-workflow → Quality Control)
 * - MOF: Modern Office Fit-out (early workflow → Quoting)
 *
 * Record IDs are stable across modules to enable cross-module linking
 * Records are created with realistic field values per module configuration
 */

// Stable Project/Record IDs for Cross-Module Linking
const PROJECTS = {
  MKR: { id: 'MKR-001', name: 'Mediterranean Kitchen Renovation', customer: 'Ahmed Hassan' },
  CLM: { id: 'CLM-001', name: 'Contemporary Living Room Makeover', customer: 'Sarah Al-Mansoori' },
  MOF: { id: 'MOF-001', name: 'Modern Office Fit-out', customer: 'Blue Wave Consulting LLC' },
};

const RECORD_IDS = {
  // CRM Leads
  crmMkr: 'LEAD-MKR-001',
  crmClm: 'LEAD-CLM-001',
  crmMof: 'LEAD-MOF-001',
  // Project Requirements
  reqMkr: 'REQ-MKR-001',
  reqClm: 'REQ-CLM-001',
  reqMof: 'REQ-MOF-001',
  // Design Configurator
  desMkr: 'DES-MKR-001',
  desClm: 'DES-CLM-001',
  desMof: 'DES-MOF-001',
  // Quoting
  quoteMkr: 'QT-MKR-001',
  quoteClm: 'QT-CLM-001',
  quoteMof: 'QT-MOF-001',
  // Approval Workflow
  appMkr: 'APR-MKR-001',
  appClm: 'APR-CLM-001',
  appMof: 'APR-MOF-001',
  // Job Confirmation
  jobMkr: 'JC-MKR-001',
  jobClm: 'JC-CLM-001',
  // Work Orders
  woMkr1: 'WO-MKR-001',
  woMkr2: 'WO-MKR-002',
  woClm: 'WO-CLM-001',
  // Support/Warranty
  supMkr: 'SUP-MKR-001',
  supClm: 'SUP-CLM-001',
  // BOM/Materials
  bomMkr1: 'BOM-MKR-001',
  bomMkr2: 'BOM-MKR-002',
  bomClm: 'BOM-CLM-001',
  // Procurement
  procMkr1: 'PO-MKR-001',
  procMkr2: 'PO-MKR-002',
  procClm: 'PO-CLM-001',
  // Production Scheduling
  schedMkr1: 'SCHED-MKR-001',
  schedMkr2: 'SCHED-MKR-002',
  schedClm: 'SCHED-CLM-001',
  // Manufacturing
  mfgMkr: 'MFG-MKR-001',
  mfgClm: 'MFG-CLM-001',
  // Quality Control
  qcMkr1: 'QC-MKR-001',
  qcMkr2: 'QC-MKR-002',
  qcClm: 'QC-CLM-001',
  // Packaging
  packMkr: 'PACK-MKR-001',
  packClm: 'PACK-CLM-001',
  // Delivery/Installation
  delivMkr: 'DEL-MKR-001',
  delivClm: 'DEL-CLM-001',
  // Billing/Invoicing
  billMkr1: 'INV-MKR-001',
  billMkr2: 'INV-MKR-002',
  billClm: 'INV-CLM-001',
  // Closure
  closeMkr: 'CLOSE-MKR-001',
};

async function main() {
  console.log('🌱 Seeding module records...\n');

  try {
    // Get demo user (finofranklin@gmail.com)
    const demoUser = await prisma.user.findUnique({
      where: { email: 'finofranklin@gmail.com' },
    });

    if (!demoUser) {
      console.warn('⚠️  Demo user (finofranklin@gmail.com) not found. Creating records with null createdById.');
    }

    const userId = demoUser?.id;

    // 1. CRM LEADS (3 records)
    console.log('📋 Seeding CRM Leads...');
    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'crm-leads',
        createdById: userId,
        updatedById: userId,
        data: {
          'Lead ID': RECORD_IDS.crmMkr,
          'Lead Status': 'Closed',
          'Customer Name': PROJECTS.MKR.customer,
          'Project Name / Reference': PROJECTS.MKR.name,
          'Project Type': 'Residential',
          'Site Address': 'Mediterranean Coast, Dubai',
          'Primary Contact Name': 'Ahmed Hassan',
          'Contact Phone': '+971 50 123 4567',
          'Contact Email': 'ahmed@example.ae',
          'Requested Target Date': '2026-02-28',
          'Budget range': 'AED 85,000',
          'Priority': 'High',
          'Source': 'Referral',
          'Notes': 'Premium kitchen renovation with Italian design',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-01-15'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'crm-leads',
        createdById: userId,
        updatedById: userId,
        data: {
          'Lead ID': RECORD_IDS.crmClm,
          'Lead Status': 'Qualified',
          'Customer Name': PROJECTS.CLM.customer,
          'Project Name / Reference': PROJECTS.CLM.name,
          'Project Type': 'Residential',
          'Site Address': 'Jumeirah, Dubai',
          'Primary Contact Name': 'Sarah Al-Mansoori',
          'Contact Phone': '+971 50 234 5678',
          'Contact Email': 'sarah@example.ae',
          'Requested Target Date': '2026-04-15',
          'Budget range': 'AED 45,000',
          'Priority': 'Medium',
          'Source': 'Website',
          'Notes': 'Modern living room with accent wall and built-ins',
          'Task Status': 'In Progress',
        },
        createdAt: new Date('2026-02-01'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'crm-leads',
        createdById: userId,
        updatedById: userId,
        data: {
          'Lead ID': RECORD_IDS.crmMof,
          'Lead Status': 'Contacted',
          'Customer Name': PROJECTS.MOF.customer,
          'Project Name / Reference': PROJECTS.MOF.name,
          'Project Type': 'Commercial',
          'Site Address': 'Downtown Dubai Business Park',
          'Primary Contact Name': 'Michael Foster',
          'Contact Phone': '+971 4 555 0123',
          'Contact Email': 'mfoster@bluewaveconsulting.ae',
          'Requested Target Date': '2026-05-30',
          'Budget range': 'AED 120,000',
          'Priority': 'High',
          'Source': 'LinkedIn',
          'Notes': 'Office fit-out for 80 employees. Open-plan design.',
          'Task Status': 'In Progress',
        },
        createdAt: new Date('2026-02-28'),
      },
    });

    console.log('✅ CRM Leads created\n');

    // 2. PROJECT REQUIREMENTS (3 records)
    console.log('🔧 Seeding Project Requirements...');
    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'project-requirements',
        createdById: userId,
        updatedById: userId,
        data: {
          'Requirement Record ID': RECORD_IDS.reqMkr,
          'Linked Project ID': PROJECTS.MKR.id,
          'Site Visit Date': '2026-01-20',
          'Requirement Summary': 'Premium kitchen with island, custom cabinetry, marble counters',
          'Measurements': 'Total: 45 sqm. Kitchen: 30 sqm, Pantry: 15 sqm',
          'Constraints': 'Structural columns fixed. Plumbing/electrical routes defined.',
          'Preferences': 'Mediterranean style, warm wood tones, Italian appliances',
          'Internal Notes': 'Client approved budget. Ready for design phase.',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-01-22'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'project-requirements',
        createdById: userId,
        updatedById: userId,
        data: {
          'Requirement Record ID': RECORD_IDS.reqClm,
          'Linked Project ID': PROJECTS.CLM.id,
          'Site Visit Date': '2026-02-10',
          'Requirement Summary': 'Feature wall with shelving, new paint, updated lighting',
          'Measurements': 'Room: 35 sqm. Feature wall: 5m wide',
          'Constraints': 'Existing furniture placement considerations',
          'Preferences': 'Contemporary, accent color (teal/navy), modern fixtures',
          'Internal Notes': 'Customer still deciding on exact color scheme',
          'Task Status': 'In Progress',
        },
        createdAt: new Date('2026-02-12'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'project-requirements',
        createdById: userId,
        updatedById: userId,
        data: {
          'Requirement Record ID': RECORD_IDS.reqMof,
          'Linked Project ID': PROJECTS.MOF.id,
          'Site Visit Date': '2026-03-05',
          'Requirement Summary': 'Open-plan office, meeting rooms, breakout areas',
          'Measurements': 'Total: 2,500 sqm. Main floor: 1,500 sqm, breakout: 500 sqm',
          'Constraints': 'HVAC system upgrade needed. Limited ceiling height in some areas.',
          'Preferences': 'Modern minimalist, collaborative workspace design',
          'Internal Notes': 'Detailed measurements received. Waiting for finalized floor plan.',
          'Task Status': 'In Progress',
        },
        createdAt: new Date('2026-03-06'),
      },
    });

    console.log('✅ Project Requirements created\n');

    // 3. DESIGN CONFIGURATOR (3 records)
    console.log('🎨 Seeding Design Configurator...');
    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'design-configurator',
        createdById: userId,
        updatedById: userId,
        data: {
          'Design ID': RECORD_IDS.desMkr,
          'Linked Project ID': PROJECTS.MKR.id,
          'Design Version #': 2,
          'Design Status': 'Approved',
          'Product/Style': 'Mediterranean',
          'Material/Finish': 'Oak wood, Marble, Stainless steel',
          'Color/Finish Code': 'Warm Oak with white marble',
          'Hardware/Accessories': ['Copper handles', 'Pendant lights', 'Island seating'],
          'Design Notes': 'Final approved design. Client gave sign-off on 2026-02-15.',
          'Owner': 'designer@buildtrack.com',
          'Sent to Client Date': '2026-02-10',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-02-05'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'design-configurator',
        createdById: userId,
        updatedById: userId,
        data: {
          'Design ID': RECORD_IDS.desClm,
          'Linked Project ID': PROJECTS.CLM.id,
          'Design Version #': 1,
          'Design Status': 'Sent for Review',
          'Product/Style': 'Contemporary',
          'Material/Finish': 'Paint, wood shelving, modern fixtures',
          'Color/Finish Code': 'Teal accent wall, white shelves',
          'Hardware/Accessories': ['Floating shelves', 'LED strips', 'Modern mirrors'],
          'Design Notes': 'Design sent to customer for review on 2026-03-10. Awaiting feedback.',
          'Owner': 'designer@buildtrack.com',
          'Sent to Client Date': '2026-03-10',
          'Task Status': 'In Progress',
        },
        createdAt: new Date('2026-03-08'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'design-configurator',
        createdById: userId,
        updatedById: userId,
        data: {
          'Design ID': RECORD_IDS.desMof,
          'Linked Project ID': PROJECTS.MOF.id,
          'Design Version #': 1,
          'Design Status': 'Draft',
          'Product/Style': 'Modern minimalist',
          'Material/Finish': 'Glass, steel, light wood',
          'Color/Finish Code': 'Neutral palette - whites and grays',
          'Hardware/Accessories': ['Glass partitions', 'Open shelving', 'Modular furniture'],
          'Design Notes': 'Initial draft in progress. Awaiting floor plan finalization.',
          'Owner': 'designer@buildtrack.com',
          'Task Status': 'In Progress',
        },
        createdAt: new Date('2026-03-07'),
      },
    });

    console.log('✅ Design Configurator created\n');

    // 4. QUOTING/CONTRACTS (3 records)
    console.log('💰 Seeding Quoting/Contracts...');
    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'quoting-contracts',
        createdById: userId,
        updatedById: userId,
        data: {
          'Quote ID': RECORD_IDS.quoteMkr,
          'Linked Project ID': PROJECTS.MKR.id,
          'Quote Version #': 1,
          'Quote Status': 'Accepted',
          'Quote Date': '2026-02-16',
          'Valid Until': '2026-03-16',
          'Line Items': [
            { 'Item Name': 'Design & Planning', 'Description': 'Complete design package', 'Qty': 1, 'Unit': 'project', 'Unit Price': 8500, 'Line Total': 8500 },
            { 'Item Name': 'Cabinetry', 'Description': 'Custom oak cabinetry', 'Qty': 1, 'Unit': 'project', 'Unit Price': 45000, 'Line Total': 45000 },
            { 'Item Name': 'Countertops', 'Description': 'Marble countertops', 'Qty': 1, 'Unit': 'project', 'Unit Price': 22000, 'Line Total': 22000 },
            { 'Item Name': 'Installation', 'Description': 'Professional installation', 'Qty': 1, 'Unit': 'project', 'Unit Price': 9500, 'Line Total': 9500 },
          ],
          'Subtotal': 85000,
          'Discount': 0,
          'Tax': 0,
          'Total': 85000,
          'Payment Terms': '50% deposit (AED 42,500), 50% on completion',
          'Lead Time / Estimated Delivery Window': '6 weeks',
          'Prepared By': 'Sales Manager',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-02-16'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'quoting-contracts',
        createdById: userId,
        updatedById: userId,
        data: {
          'Quote ID': RECORD_IDS.quoteClm,
          'Linked Project ID': PROJECTS.CLM.id,
          'Quote Version #': 1,
          'Quote Status': 'Sent',
          'Quote Date': '2026-03-10',
          'Valid Until': '2026-04-10',
          'Line Items': [
            { 'Item Name': 'Design consultation', 'Description': 'Design review & planning', 'Qty': 1, 'Unit': 'project', 'Unit Price': 5000, 'Line Total': 5000 },
            { 'Item Name': 'Feature wall & paint', 'Description': 'Wall prep, paint, accent design', 'Qty': 1, 'Unit': 'project', 'Unit Price': 20000, 'Line Total': 20000 },
            { 'Item Name': 'Shelving & installation', 'Description': 'Custom shelves with hardware', 'Qty': 1, 'Unit': 'project', 'Unit Price': 15000, 'Line Total': 15000 },
            { 'Item Name': 'Lighting upgrade', 'Description': 'New fixtures and LED installation', 'Qty': 1, 'Unit': 'project', 'Unit Price': 5000, 'Line Total': 5000 },
          ],
          'Subtotal': 45000,
          'Discount': 0,
          'Tax': 0,
          'Total': 45000,
          'Payment Terms': '40% deposit (AED 18,000), 60% on completion',
          'Lead Time / Estimated Delivery Window': '4 weeks',
          'Prepared By': 'Sales Manager',
          'Task Status': 'In Progress',
        },
        createdAt: new Date('2026-03-10'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'quoting-contracts',
        createdById: userId,
        updatedById: userId,
        data: {
          'Quote ID': RECORD_IDS.quoteMof,
          'Linked Project ID': PROJECTS.MOF.id,
          'Quote Version #': 1,
          'Quote Status': 'Draft',
          'Quote Date': '2026-03-12',
          'Valid Until': '2026-04-12',
          'Line Items': [
            { 'Item Name': 'Design & Space Planning', 'Description': 'Office layout design', 'Qty': 1, 'Unit': 'project', 'Unit Price': 25000, 'Line Total': 25000 },
            { 'Item Name': 'Partition systems', 'Description': 'Glass partitions & framing', 'Qty': 1, 'Unit': 'project', 'Unit Price': 45000, 'Line Total': 45000 },
            { 'Item Name': 'Furniture & fixtures', 'Description': 'Desks, cabinets, meeting table', 'Qty': 1, 'Unit': 'project', 'Unit Price': 35000, 'Line Total': 35000 },
            { 'Item Name': 'Electrical & HVAC', 'Description': 'Power outlets, LED, AC upgrade', 'Qty': 1, 'Unit': 'project', 'Unit Price': 15000, 'Line Total': 15000 },
          ],
          'Subtotal': 120000,
          'Discount': 0,
          'Tax': 0,
          'Total': 120000,
          'Payment Terms': '30% upfront, 40% mid-project, 30% on completion',
          'Lead Time / Estimated Delivery Window': '10 weeks',
          'Prepared By': 'Sales Manager',
          'Task Status': 'In Progress',
        },
        createdAt: new Date('2026-03-12'),
      },
    });

    console.log('✅ Quoting/Contracts created\n');

    // 5. APPROVAL WORKFLOW (3 records)
    console.log('✔️  Seeding Approval Workflow...');
    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'approval-workflow',
        createdById: userId,
        updatedById: userId,
        data: {
          'Approval ID': RECORD_IDS.appMkr,
          'Linked Project ID': PROJECTS.MKR.id,
          'Approval Type': 'Quote',
          'Related Record': RECORD_IDS.quoteMkr,
          'Status': 'Approved',
          'Approver': 'finofranklin@gmail.com',
          'Decision Date': '2026-02-17',
          'Comments / Reason': 'Quote approved. Design is excellent. Ready for production.',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-02-17'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'approval-workflow',
        createdById: userId,
        updatedById: userId,
        data: {
          'Approval ID': RECORD_IDS.appClm,
          'Linked Project ID': PROJECTS.CLM.id,
          'Approval Type': 'Design',
          'Related Record': RECORD_IDS.desClm,
          'Status': 'Approved',
          'Approver': 'pm@buildtrack.com',
          'Decision Date': '2026-03-11',
          'Comments / Reason': 'Design approved. Customer color choice confirmed. Ready to fabricate.',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-03-11'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'approval-workflow',
        createdById: userId,
        updatedById: userId,
        data: {
          'Approval ID': RECORD_IDS.appMof,
          'Linked Project ID': PROJECTS.MOF.id,
          'Approval Type': 'Quote',
          'Related Record': RECORD_IDS.quoteMof,
          'Status': 'Pending',
          'Approver': 'finofranklin@gmail.com',
          'Decision Date': null,
          'Comments / Reason': 'Awaiting final review. Estimate pending furniture supplier confirmation.',
          'Task Status': 'In Progress',
        },
        createdAt: new Date('2026-03-13'),
      },
    });

    console.log('✅ Approval Workflow created\n');

    // 6. JOB CONFIRMATION (2 records - MOF not yet confirmed)
    console.log('📝 Seeding Job Confirmation...');
    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'job-confirmation',
        createdById: userId,
        updatedById: userId,
        data: {
          'Order ID': RECORD_IDS.jobMkr,
          'Linked Project ID': PROJECTS.MKR.id,
          'Status': 'Closed',
          'Accepted Quote ID': RECORD_IDS.quoteMkr,
          'Order Date': '2026-02-18',
          'Target Delivery Date': '2026-04-01',
          'Deposit Required': true,
          'Deposit Amount': 42500,
          'Special Terms / Notes': 'Includes delivery and installation. Final walkthrough scheduled.',
          'Customer Reference': 'MKR-AHMED-001',
          'Internal Owner': 'pm@buildtrack.com',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-02-18'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'job-confirmation',
        createdById: userId,
        updatedById: userId,
        data: {
          'Order ID': RECORD_IDS.jobClm,
          'Linked Project ID': PROJECTS.CLM.id,
          'Status': 'In Production',
          'Accepted Quote ID': RECORD_IDS.quoteClm,
          'Order Date': '2026-03-12',
          'Target Delivery Date': '2026-04-20',
          'Deposit Required': true,
          'Deposit Amount': 18000,
          'Special Terms / Notes': 'Installation includes final color adjustments if needed.',
          'Customer Reference': 'CLM-SARAH-001',
          'Internal Owner': 'pm@buildtrack.com',
          'Task Status': 'In Progress',
        },
        createdAt: new Date('2026-03-12'),
      },
    });

    console.log('✅ Job Confirmation created\n');

    // 7. WORK ORDERS (3 records)
    console.log('🔨 Seeding Work Orders...');
    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'work-orders',
        createdById: userId,
        updatedById: userId,
        data: {
          'Work Order ID': RECORD_IDS.woMkr1,
          'Linked Sales Order ID': RECORD_IDS.jobMkr,
          'Linked Project ID': PROJECTS.MKR.id,
          'Work Type': 'Fabrication',
          'Status': 'Completed',
          'Assigned To': 'Manufacturing Team',
          'Assigned Date': '2026-02-20',
          'Scheduled Start Date': '2026-02-23',
          'Scheduled End Date': '2026-03-20',
          'Actual Start Date': '2026-02-23',
          'Actual End Date': '2026-03-18',
          'Priority': 'High',
          'Description / Scope': 'Fabricate custom oak cabinetry with marble countertops',
          'Special Instructions': 'Use premium Italian marble. Quality control at each stage.',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-02-20'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'work-orders',
        createdById: userId,
        updatedById: userId,
        data: {
          'Work Order ID': RECORD_IDS.woMkr2,
          'Linked Sales Order ID': RECORD_IDS.jobMkr,
          'Linked Project ID': PROJECTS.MKR.id,
          'Work Type': 'Installation',
          'Status': 'Completed',
          'Assigned To': 'Installation Team',
          'Assigned Date': '2026-03-20',
          'Scheduled Start Date': '2026-03-23',
          'Scheduled End Date': '2026-03-30',
          'Actual Start Date': '2026-03-23',
          'Actual End Date': '2026-03-29',
          'Priority': 'High',
          'Description / Scope': 'Install kitchen cabinetry, countertops, appliances and fixtures',
          'Special Instructions': 'Coordinate with electrician for final connections. Client walkthrough on last day.',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-03-20'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'work-orders',
        createdById: userId,
        updatedById: userId,
        data: {
          'Work Order ID': RECORD_IDS.woClm,
          'Linked Sales Order ID': RECORD_IDS.jobClm,
          'Linked Project ID': PROJECTS.CLM.id,
          'Work Type': 'Fabrication',
          'Status': 'In Progress',
          'Assigned To': 'Manufacturing Team',
          'Assigned Date': '2026-03-13',
          'Scheduled Start Date': '2026-03-15',
          'Scheduled End Date': '2026-04-05',
          'Actual Start Date': '2026-03-15',
          'Actual End Date': null,
          'Priority': 'Medium',
          'Description / Scope': 'Paint feature wall, build shelves, prepare installation materials',
          'Special Instructions': 'Color sample approval from customer before final paint. Shelves must support books.',
          'Task Status': 'In Progress',
        },
        createdAt: new Date('2026-03-13'),
      },
    });

    console.log('✅ Work Orders created\n');

    // 8. SUPPORT/WARRANTY (2 records)
    console.log('🛡️  Seeding Support/Warranty...');
    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'support-warranty',
        createdById: userId,
        updatedById: userId,
        data: {
          'Support Ticket ID': RECORD_IDS.supMkr,
          'Linked Project ID': PROJECTS.MKR.id,
          'Issue Type': 'Warranty Claim',
          'Description': 'Cabinet hinge adjustment needed on upper right door',
          'Status': 'Resolved',
          'Reporter Name': 'Ahmed Hassan',
          'Reporter Phone': '+971 50 123 4567',
          'Reported Date': '2026-04-02',
          'Resolution Date': '2026-04-03',
          'Resolution Details': 'Technician visited and adjusted hinges. Issue resolved.',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-04-02'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'support-warranty',
        createdById: userId,
        updatedById: userId,
        data: {
          'Support Ticket ID': RECORD_IDS.supClm,
          'Linked Project ID': PROJECTS.CLM.id,
          'Issue Type': 'Support Request',
          'Description': 'Question about paint maintenance and care instructions',
          'Status': 'On Hold',
          'Reporter Name': 'Sarah Al-Mansoori',
          'Reporter Phone': '+971 50 234 5678',
          'Reported Date': '2026-03-15',
          'Resolution Date': null,
          'Resolution Details': 'Waiting for customer follow-up on preferred contact method',
          'Task Status': 'In Progress',
        },
        createdAt: new Date('2026-03-15'),
      },
    });

    console.log('✅ Support/Warranty created\n');

    // 9. BOM/MATERIALS PLANNING (3 records)
    console.log('📦 Seeding BOM/Materials Planning...');
    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'bom-materials-planning',
        createdById: userId,
        updatedById: userId,
        data: {
          'BOM ID': RECORD_IDS.bomMkr1,
          'Linked Work Order ID': RECORD_IDS.woMkr1,
          'BOM Version': 1,
          'BOM Status': 'Final',
          'Items': [
            { 'Material/Component Name': 'Oak Wood Panels', 'SKU/Code': 'OAK-PANEL-30', 'Qty Required': 45, 'Unit': 'linear m', 'Stock Available': 50, 'Qty to Purchase': 0 },
            { 'Material/Component Name': 'Marble Slabs', 'SKU/Code': 'MARBLE-WHITE-001', 'Qty Required': 12, 'Unit': 'sqm', 'Stock Available': 15, 'Qty to Purchase': 0 },
            { 'Material/Component Name': 'Stainless Steel Hardware', 'SKU/Code': 'SS-HARDWARE-02', 'Qty Required': 48, 'Unit': 'pieces', 'Stock Available': 60, 'Qty to Purchase': 0 },
            { 'Material/Component Name': 'Cabinet Hinges', 'SKU/Code': 'HINGE-SOFT-CLOSE', 'Qty Required': 36, 'Unit': 'pieces', 'Stock Available': 40, 'Qty to Purchase': 0 },
          ],
          'Planner': 'Production Planner',
          'Date Finalized': '2026-02-22',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-02-22'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'bom-materials-planning',
        createdById: userId,
        updatedById: userId,
        data: {
          'BOM ID': RECORD_IDS.bomMkr2,
          'Linked Work Order ID': RECORD_IDS.woMkr2,
          'BOM Version': 1,
          'BOM Status': 'Final',
          'Items': [
            { 'Material/Component Name': 'Stainless Steel Appliances', 'SKU/Code': 'APPL-SS-SUITE', 'Qty Required': 1, 'Unit': 'set', 'Stock Available': 1, 'Qty to Purchase': 0 },
            { 'Material/Component Name': 'Installation Hardware Kit', 'SKU/Code': 'INSTALL-KIT-001', 'Qty Required': 1, 'Unit': 'kit', 'Stock Available': 1, 'Qty to Purchase': 0 },
            { 'Material/Component Name': 'Silicone Sealant', 'SKU/Code': 'SEALANT-PROF-100', 'Qty Required': 5, 'Unit': 'cartridges', 'Stock Available': 8, 'Qty to Purchase': 0 },
          ],
          'Planner': 'Production Planner',
          'Date Finalized': '2026-03-21',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-03-21'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'bom-materials-planning',
        createdById: userId,
        updatedById: userId,
        data: {
          'BOM ID': RECORD_IDS.bomClm,
          'Linked Work Order ID': RECORD_IDS.woClm,
          'BOM Version': 1,
          'BOM Status': 'Final',
          'Items': [
            { 'Material/Component Name': 'Premium Paint (Teal)', 'SKU/Code': 'PAINT-TEAL-2L', 'Qty Required': 4, 'Unit': '2L cans', 'Stock Available': 5, 'Qty to Purchase': 0 },
            { 'Material/Component Name': 'Wood Shelving Material', 'SKU/Code': 'SHELF-OAK-20MM', 'Qty Required': 8, 'Unit': 'linear m', 'Stock Available': 10, 'Qty to Purchase': 0 },
            { 'Material/Component Name': 'LED Strip Lights', 'SKU/Code': 'LED-STRIP-5M', 'Qty Required': 3, 'Unit': 'units', 'Stock Available': 4, 'Qty to Purchase': 0 },
            { 'Material/Component Name': 'Floating Shelf Brackets', 'SKU/Code': 'BRACKET-FLOAT-SM', 'Qty Required': 16, 'Unit': 'pieces', 'Stock Available': 20, 'Qty to Purchase': 0 },
          ],
          'Planner': 'Production Planner',
          'Date Finalized': '2026-03-16',
          'Task Status': 'In Progress',
        },
        createdAt: new Date('2026-03-16'),
      },
    });

    console.log('✅ BOM/Materials Planning created\n');

    // 10. PROCUREMENT (3 records)
    console.log('🛒 Seeding Procurement...');
    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'procurement',
        createdById: userId,
        updatedById: userId,
        data: {
          'PO ID': RECORD_IDS.procMkr1,
          'Linked Project ID': PROJECTS.MKR.id,
          'PO Status': 'Received',
          'Supplier Name': 'AlMarjan Timber & Materials',
          'PO Date': '2026-02-23',
          'Expected Delivery Date': '2026-03-09',
          'Actual Delivery Date': '2026-03-08',
          'Items Ordered': [
            { 'Item Name': 'Oak Wood Panels', 'Qty': 45, 'Unit Price': 250, 'Line Total': 11250 },
            { 'Item Name': 'Cabinet Hinges', 'Qty': 36, 'Unit Price': 85, 'Line Total': 3060 },
          ],
          'PO Total': 14310,
          'Notes': 'Delivered on time. All items in good condition.',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-02-23'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'procurement',
        createdById: userId,
        updatedById: userId,
        data: {
          'PO ID': RECORD_IDS.procMkr2,
          'Linked Project ID': PROJECTS.MKR.id,
          'PO Status': 'Closed',
          'Supplier Name': 'Italian Stone Imports',
          'PO Date': '2026-02-25',
          'Expected Delivery Date': '2026-03-15',
          'Actual Delivery Date': '2026-03-14',
          'Items Ordered': [
            { 'Item Name': 'White Marble Slabs', 'Qty': 12, 'Unit Price': 950, 'Line Total': 11400 },
          ],
          'PO Total': 11400,
          'Notes': 'Premium marble. All slabs passed quality inspection.',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-02-25'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'procurement',
        createdById: userId,
        updatedById: userId,
        data: {
          'PO ID': RECORD_IDS.procClm,
          'Linked Project ID': PROJECTS.CLM.id,
          'PO Status': 'Sent',
          'Supplier Name': 'BuildMaterials Supply',
          'PO Date': '2026-03-14',
          'Expected Delivery Date': '2026-03-28',
          'Actual Delivery Date': null,
          'Items Ordered': [
            { 'Item Name': 'Premium Paint (Teal)', 'Qty': 4, 'Unit Price': 280, 'Line Total': 1120 },
            { 'Item Name': 'Wood Shelving Material', 'Qty': 8, 'Unit Price': 180, 'Line Total': 1440 },
            { 'Item Name': 'LED Strip Lights', 'Qty': 3, 'Unit Price': 220, 'Line Total': 660 },
          ],
          'PO Total': 3220,
          'Notes': 'PO sent to supplier. Awaiting confirmation and delivery schedule.',
          'Task Status': 'In Progress',
        },
        createdAt: new Date('2026-03-14'),
      },
    });

    console.log('✅ Procurement created\n');

    // 11. PRODUCTION SCHEDULING (3 records)
    console.log('📅 Seeding Production Scheduling...');
    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'production-scheduling',
        createdById: userId,
        updatedById: userId,
        data: {
          'Schedule Entry ID': RECORD_IDS.schedMkr1,
          'Linked Work Order ID': RECORD_IDS.woMkr1,
          'Production Station': 'Assembly',
          'Status': 'Done',
          'Scheduled Start': '2026-02-24',
          'Scheduled End': '2026-03-10',
          'Actual Start': '2026-02-24',
          'Actual End': '2026-03-09',
          'Assigned Crew': 'Assembly Team A',
          'Qty Processed': 18,
          'Issues / Notes': 'None. Assembly completed on schedule.',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-02-24'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'production-scheduling',
        createdById: userId,
        updatedById: userId,
        data: {
          'Schedule Entry ID': RECORD_IDS.schedMkr2,
          'Linked Work Order ID': RECORD_IDS.woMkr1,
          'Production Station': 'Finishing',
          'Status': 'Done',
          'Scheduled Start': '2026-03-10',
          'Scheduled End': '2026-03-18',
          'Actual Start': '2026-03-10',
          'Actual End': '2026-03-17',
          'Assigned Crew': 'Finishing Team B',
          'Qty Processed': 18,
          'Issues / Notes': 'Minor touch-ups needed on 2 panels. Completed and approved.',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-03-10'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'production-scheduling',
        createdById: userId,
        updatedById: userId,
        data: {
          'Schedule Entry ID': RECORD_IDS.schedClm,
          'Linked Work Order ID': RECORD_IDS.woClm,
          'Production Station': 'Assembly',
          'Status': 'In Progress',
          'Scheduled Start': '2026-03-16',
          'Scheduled End': '2026-03-30',
          'Actual Start': '2026-03-16',
          'Actual End': null,
          'Assigned Crew': 'Assembly Team A',
          'Qty Processed': 8,
          'Issues / Notes': 'On schedule. Shelf assembly 60% complete.',
          'Task Status': 'In Progress',
        },
        createdAt: new Date('2026-03-16'),
      },
    });

    console.log('✅ Production Scheduling created\n');

    // 12. MANUFACTURING (2 records)
    console.log('🏭 Seeding Manufacturing...');
    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'manufacturing',
        createdById: userId,
        updatedById: userId,
        data: {
          'Execution Log ID': RECORD_IDS.mfgMkr,
          'Linked Work Order ID': RECORD_IDS.woMkr1,
          'Manufacturing Status': 'Completed',
          'Qty Produced': 18,
          'Start Date': '2026-02-24',
          'End Date': '2026-03-17',
          'Issues Encountered': 'None',
          'Quality Notes': 'All panels passed quality inspection. No rework needed.',
          'Equipment Used': 'CNC Router, Sanders, Assembly jigs',
          'Technician': 'Production Manager',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-02-24'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'manufacturing',
        createdById: userId,
        updatedById: userId,
        data: {
          'Execution Log ID': RECORD_IDS.mfgClm,
          'Linked Work Order ID': RECORD_IDS.woClm,
          'Manufacturing Status': 'In Progress',
          'Qty Produced': 5,
          'Start Date': '2026-03-16',
          'End Date': null,
          'Issues Encountered': 'Minor: Paint color batch variation detected on 2 units',
          'Quality Notes': 'Rework scheduled for color adjustment. Expected completion by 2026-03-25.',
          'Equipment Used': 'Paint spray booth, sanders',
          'Technician': 'Production Manager',
          'Task Status': 'In Progress',
        },
        createdAt: new Date('2026-03-16'),
      },
    });

    console.log('✅ Manufacturing created\n');

    // 13. QUALITY CONTROL (3 records)
    console.log('✅ Seeding Quality Control...');
    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'quality-control',
        createdById: userId,
        updatedById: userId,
        data: {
          'QC Record ID': RECORD_IDS.qcMkr1,
          'Linked Work Order ID': RECORD_IDS.woMkr1,
          'QC Status': 'Pass',
          'Inspection Date': '2026-03-18',
          'Inspector': 'qc@buildtrack.com',
          'Defects Found': 0,
          'Inspection Notes': 'All 18 panels passed inspection. Dimensions accurate, finish excellent.',
          'Rework Required': false,
          'Approval': 'Approved for packaging',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-03-18'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'quality-control',
        createdById: userId,
        updatedById: userId,
        data: {
          'QC Record ID': RECORD_IDS.qcMkr2,
          'Linked Work Order ID': RECORD_IDS.woMkr2,
          'QC Status': 'Pass',
          'Inspection Date': '2026-03-29',
          'Inspector': 'qc@buildtrack.com',
          'Defects Found': 0,
          'Inspection Notes': 'Installation quality excellent. All appliances tested and working.',
          'Rework Required': false,
          'Approval': 'Approved for delivery',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-03-29'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'quality-control',
        createdById: userId,
        updatedById: userId,
        data: {
          'QC Record ID': RECORD_IDS.qcClm,
          'Linked Work Order ID': RECORD_IDS.woClm,
          'QC Status': 'Fail',
          'Inspection Date': '2026-03-25',
          'Inspector': 'qc@buildtrack.com',
          'Defects Found': 2,
          'Inspection Notes': 'Paint color variation on 2 units. Rework required for color matching.',
          'Rework Required': true,
          'Approval': 'Rework scheduled',
          'Task Status': 'In Progress',
        },
        createdAt: new Date('2026-03-25'),
      },
    });

    console.log('✅ Quality Control created\n');

    // 14. PACKAGING (2 records)
    console.log('📮 Seeding Packaging...');
    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'packaging',
        createdById: userId,
        updatedById: userId,
        data: {
          'Packing ID': RECORD_IDS.packMkr,
          'Linked Work Order ID': RECORD_IDS.woMkr1,
          'Packing Status': 'Staged',
          'Items Packed': 18,
          'Packing Date': '2026-03-19',
          'Packing Material': 'Custom crates, foam padding, protective wrap',
          'Packed By': 'Logistics Team',
          'Tracking Number': 'TRK-MKR-001-2026',
          'Special Instructions': 'Fragile - Handle with care. Keep dry. Carefully coordinate with installation team.',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-03-19'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'packaging',
        createdById: userId,
        updatedById: userId,
        data: {
          'Packing ID': RECORD_IDS.packClm,
          'Linked Work Order ID': RECORD_IDS.woClm,
          'Packing Status': 'Not Packed',
          'Items Packed': 0,
          'Packing Date': null,
          'Packing Material': 'TBD - awaiting QC rework completion',
          'Packed By': null,
          'Tracking Number': null,
          'Special Instructions': 'Hold for packing. Waiting for rework completion and final QC approval.',
          'Task Status': 'On Hold',
        },
        createdAt: new Date('2026-03-25'),
      },
    });

    console.log('✅ Packaging created\n');

    // 15. DELIVERY/INSTALLATION (2 records)
    console.log('🚚 Seeding Delivery/Installation...');
    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'delivery-installation',
        createdById: userId,
        updatedById: userId,
        data: {
          'Delivery Job ID': RECORD_IDS.delivMkr,
          'Linked Project ID': PROJECTS.MKR.id,
          'Linked Work Order ID': RECORD_IDS.woMkr2,
          'Delivery Status': 'Installed',
          'Scheduled Delivery Date': '2026-03-30',
          'Actual Delivery Date': '2026-03-30',
          'Delivery Address': 'Mediterranean Coast, Dubai',
          'Delivery Contact': 'Ahmed Hassan',
          'Delivery Phone': '+971 50 123 4567',
          'Installation Completed Date': '2026-03-30',
          'Installation Notes': 'Installation successful. Customer walked through and approved. All systems tested.',
          'Proof of Delivery': 'Signature obtained. Photos taken.',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-03-30'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'delivery-installation',
        createdById: userId,
        updatedById: userId,
        data: {
          'Delivery Job ID': RECORD_IDS.delivClm,
          'Linked Project ID': PROJECTS.CLM.id,
          'Linked Work Order ID': RECORD_IDS.woClm,
          'Delivery Status': 'Scheduled',
          'Scheduled Delivery Date': '2026-04-15',
          'Actual Delivery Date': null,
          'Delivery Address': 'Jumeirah, Dubai',
          'Delivery Contact': 'Sarah Al-Mansoori',
          'Delivery Phone': '+971 50 234 5678',
          'Installation Completed Date': null,
          'Installation Notes': 'Scheduled for delivery and installation. Installer assigned.',
          'Proof of Delivery': null,
          'Task Status': 'In Progress',
        },
        createdAt: new Date('2026-04-01'),
      },
    });

    console.log('✅ Delivery/Installation created\n');

    // 16. BILLING/INVOICING (3 records)
    console.log('💳 Seeding Billing/Invoicing...');
    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'billing-invoicing',
        createdById: userId,
        updatedById: userId,
        data: {
          'Invoice ID': RECORD_IDS.billMkr1,
          'Linked Project ID': PROJECTS.MKR.id,
          'Invoice Type': 'Deposit',
          'Invoice Date': '2026-02-18',
          'Due Date': '2026-02-25',
          'Amount': 42500,
          'Payment Status': 'Paid',
          'Payment Date': '2026-02-24',
          'Payment Method': 'Bank Transfer',
          'Description': 'Deposit payment - 50% of total project cost',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-02-18'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'billing-invoicing',
        createdById: userId,
        updatedById: userId,
        data: {
          'Invoice ID': RECORD_IDS.billMkr2,
          'Linked Project ID': PROJECTS.MKR.id,
          'Invoice Type': 'Final',
          'Invoice Date': '2026-03-31',
          'Due Date': '2026-04-07',
          'Amount': 42500,
          'Payment Status': 'Paid',
          'Payment Date': '2026-04-01',
          'Payment Method': 'Bank Transfer',
          'Description': 'Final payment - Balance on kitchen renovation project',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-03-31'),
      },
    });

    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'billing-invoicing',
        createdById: userId,
        updatedById: userId,
        data: {
          'Invoice ID': RECORD_IDS.billClm,
          'Linked Project ID': PROJECTS.CLM.id,
          'Invoice Type': 'Partial',
          'Invoice Date': '2026-03-13',
          'Due Date': '2026-03-20',
          'Amount': 18000,
          'Payment Status': 'Paid',
          'Payment Date': '2026-03-18',
          'Payment Method': 'Credit Card',
          'Description': 'Deposit payment - 40% of project cost',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-03-13'),
      },
    });

    console.log('✅ Billing/Invoicing created\n');

    // 17. CLOSURE (1 record - only MKR fully closed)
    console.log('🎉 Seeding Closure...');
    await prisma.moduleRecord.create({
      data: {
        moduleSlug: 'closure',
        createdById: userId,
        updatedById: userId,
        data: {
          'Closure Record ID': RECORD_IDS.closeMkr,
          'Linked Project ID': PROJECTS.MKR.id,
          'Project Status': 'Closed',
          'Closure Date': '2026-04-02',
          'Close Reason': 'Completed Successfully',
          'Customer Satisfaction': 'Excellent',
          'Final Cost': 85000,
          'Lessons Learned': 'Excellent collaboration with customer. Material sourcing from Italy went smoothly. Installation timing was perfect.',
          'Recommendations': 'Consider this as a portfolio project. Customer willing to provide testimonial.',
          'Archived Date': '2026-04-02',
          'Task Status': 'Completed',
        },
        createdAt: new Date('2026-04-02'),
      },
    });

    console.log('✅ Closure created\n');

    console.log('\n' + '='.repeat(60));
    console.log('✅ Module Records Seeding Complete!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log('  • CRM Leads: 3 records');
    console.log('  • Project Requirements: 3 records');
    console.log('  • Design Configurator: 3 records');
    console.log('  • Quoting/Contracts: 3 records');
    console.log('  • Approval Workflow: 3 records');
    console.log('  • Job Confirmation: 2 records');
    console.log('  • Work Orders: 3 records');
    console.log('  • Support/Warranty: 2 records');
    console.log('  • BOM/Materials: 3 records');
    console.log('  • Procurement: 3 records');
    console.log('  • Production Scheduling: 3 records');
    console.log('  • Manufacturing: 2 records');
    console.log('  • Quality Control: 3 records');
    console.log('  • Packaging: 2 records');
    console.log('  • Delivery/Installation: 2 records');
    console.log('  • Billing/Invoicing: 3 records');
    console.log('  • Closure: 1 record');
    console.log('\n  Total: 45 module records created');
    console.log('\n📁 Projects:');
    console.log('  • MKR: Fully complete → Closure');
    console.log('  • CLM: Mid-workflow → Quality Control');
    console.log('  • MOF: Early workflow → Quoting');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('❌ Error seeding module records:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
