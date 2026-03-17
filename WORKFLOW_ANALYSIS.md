# BuildTrack Workflow Analysis - How Humans Interact With The System

## Overview
The current database has 34 seeded records that need manual verification. This document outlines the **proper workflow** that should have been followed and **data dependencies** that must exist.

---

## Phase 1: Customer/Client Management
**WHO**: Sales Manager, Org Admin
**SYSTEM MODULE**: Clients (separate from modules - under `/app/clients`)

### Step 1.1: Create Client/Customer
- **Navigate to**: `/app/clients`
- **Click**: "Add New Client" or similar
- **Required Fields** (from schema.prisma Client model):
  - `name` ✅ (Ahmed Hassan, Sarah Al-Mansoori, Blue Wave Consulting LLC)
  - `email` (ahmed@example.ae)
  - `phone` (+971 50 123 4567)
  - `altPhone` (optional)
  - `company` (optional, but important for B2B)
  - `role` (Owner / Manager / Purchasing)
  - `projectAddress` (site location)
  - `billingAddress` (invoice address)
  - `preferredApprovalMethod` (Email, In-person, etc.)
  - `notes` (Budget, special requirements)

**Expected Result**: Client record created with unique ID in `clients` table

### Data Dependencies for Later Modules
⚠️ **CRITICAL**: All downstream modules need customer name to be:
1. **Searchable** in dropdowns when creating leads/projects
2. **Stored as reference** (Customer ID or name) in module records
3. **Display-ready** in all detail views and reports

---

## Phase 2: CRM / Lead Creation
**WHO**: Sales Manager / Client
**MODULE**: `crm-leads`
**DEPENDENCY**: Must have Client created first

### Step 2.1: Create Lead Record
- **Navigate to**: `/app/tasks/leads` or CRM module
- **Required Fields**:
  - `Lead ID` ✅ (AUTO-GENERATED: CRM-742857)
  - `Lead Status` ✅ (New → Contacted → Qualified → Closed)
  - **`Customer Name`** ⚠️ **MUST BE LINKED TO CLIENT** - should be dropdown populated from `clients` table
  - `Project Name / Reference` (e.g., "Mediterranean Kitchen Renovation")
  - `Project Type` (Kitchen, Bathroom, Office, Other)
  - `Site Address` (captured from Client or entered fresh)
  - `Primary Contact Name` (Ahmed Hassan)
  - `Contact Phone` (should auto-fill from Client if linked)
  - `Contact Email` (should auto-fill from Client if linked)
  - `Requested Target Date` (2025-08-15)
  - `Budget range` (AED 85,000)
  - `Priority` (High, Medium, Low)
  - `Source` (Website, Referral, Walk-in, Ads, Other)
  - `Notes` (High-end kitchen renovation...)
  - `Attachments` (photos)
  - `Task Status` (New, In Progress, Completed)
  - `Created at`, `Updated at` (auto)
  - `Created by`, `Updated by` (auto from logged-in user)

**Data That SHOULD BE IN RECORD**:
```json
{
  "Lead ID": "CRM-742857",
  "Lead Status": "Closed",
  "Customer Name": "Ahmed Hassan",  // ← Linked to Client ID
  "Customer ID": "client-uuid-123", // ← FK reference if schema supports
  "Project Name / Reference": "Mediterranean Kitchen Renovation",
  "Project Type": "Kitchen",
  "Site Address": "123 Palm Jumeirah, Dubai, UAE",
  "Primary Contact Name": "Ahmed Hassan",
  "Contact Phone": "+971 50 123 4567",
  "Contact Email": "ahmed@example.ae",
  "Requested Target Date": "2025-08-15",
  "Budget range": "AED 85,000",
  "Priority": "High",
  "Source": "Referral",
  "Notes": "High-end kitchen renovation with marble countertops",
  "Task Status": "Completed"
}
```

**Expected Behavior**:
- Lead appears in CRM dashboard with Customer Name clearly visible
- Customer Name is searchable/filterable
- Sales can click lead to see all details

---

## Phase 3: Project Creation (Projects Module - NOT a workflow module)
**WHO**: Project Manager, Sales Manager
**SYSTEM MODULE**: `/app/projects` (separate from workflow modules)
**DEPENDENCY**: Lead must exist + Client must exist

### Step 3.1: Create Project
- **Navigate to**: `/app/projects`
- **Click**: "Create New Project"
- **Expected Behavior**:
  - ✅ Customer Name dropdown should show ALL existing clients (from Phase 1)
  - ✅ Can select "Ahmed Hassan" from dropdown (populated from `clients` table)
  - ✅ After selection, Client ID stored in project

- **Required Fields** (from schema.prisma Project model):
  - `name` (e.g., "Mediterranean Kitchen Renovation")
  - `code` (optional: MKR-2025-001)
  - `description` (project scope)
  - `status` (PLANNING, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED)
  - **`clientId`** ⚠️ **MUST BE LINKED TO CLIENT** (selected from dropdown)
  - **`managerId`** ✅ (Project Manager assigned - filtered to PROJECT_MANAGER role)
  - `assignedToId` (optional: who is responsible)
  - `startDate`, `endDate`

**Data That SHOULD BE IN DB**:
```json
{
  "id": "proj-uuid-123",
  "name": "Mediterranean Kitchen Renovation",
  "code": "MKR-2025-001",
  "description": "Full kitchen renovation with custom cabinetry",
  "status": "COMPLETED",
  "clientId": "client-uuid-123",  // ← Links to Client "Ahmed Hassan"
  "managerId": "pm-user-id",      // ← Links to PM user
  "assignedToId": "coordinator-user-id",
  "startDate": "2025-07-22",
  "endDate": "2025-09-15"
}
```

**Expected Result**:
- ✅ Project created and linked to Client
- ✅ Project appears in `/app/projects` list
- ✅ Project shows Customer Name in list view
- ✅ Project Manager assigned and visible

---

## Phase 4: Workflow Modules - PROJECT REQUIREMENTS
**WHO**: Project Coordinator
**MODULE**: `project-requirements`
**DEPENDENCY**: Project must exist (from Phase 3)

### Step 4.1: Create Requirement Record
- **Navigate to**: Workflow module list → Project Requirements
- **Click**: "Create New" or linked from Project
- **Required Fields**:
  - `Requirement Record ID` (AUTO: PRJ-742857)
  - **`Linked Project ID`** ⚠️ **MUST BE REFERENCE TO PROJECT** - should be dropdown showing:
    - All projects with their Client names
    - E.g., "Mediterranean Kitchen Renovation (Ahmed Hassan)"
  - `Site Visit Date` (2025-06-10)
  - `Requirement Summary` (Full kitchen renovation...)
  - `Measurements` (Kitchen: 5.5m x 4.2m...)
  - `Constraints` (Electrical panel location...)
  - `Preferences` (Mediterranean style, light woods...)
  - `Internal Notes` (Client provided 15 reference images)
  - `Task Status` (New, In Progress, Completed)

**Data That SHOULD BE IN RECORD**:
```json
{
  "Requirement Record ID": "PRJ-742857",
  "Linked Project ID": "proj-uuid-123",  // ← Reference to Project from Phase 3
  "Linked Project Name": "Mediterranean Kitchen Renovation",  // ← Denormalized for display
  "Linked Client Name": "Ahmed Hassan",  // ← Denormalized from Project → Client
  "Site Visit Date": "2025-06-10",
  "Requirement Summary": "Full kitchen renovation...",
  "Measurements": "Kitchen: 5.5m x 4.2m...",
  "Constraints": "Electrical panel on east wall...",
  "Preferences": "Mediterranean style, light woods...",
  "Internal Notes": "Client provided inspiration board...",
  "Task Status": "Completed"
}
```

**Expected Behavior**:
- ✅ When creating, can select Project from dropdown
- ✅ Project dropdown shows: "Project Name (Customer Name)"
- ✅ After selection, record auto-shows Client info
- ✅ In detail view, can see Customer Name, Project Name, all linked data

---

## Phase 5: DESIGN CONFIGURATOR
**WHO**: Designer
**MODULE**: `design-configurator`
**DEPENDENCY**: Project + Requirement must exist

### Step 5.1: Create Design Record
- **Required Fields**:
  - `Design ID` (AUTO: DES-742857)
  - **`Linked Project ID`** ⚠️ (Dropdown: "Project Name (Customer Name)")
  - `Design Version #` (1, 2, 3...)
  - `Design Status` (Draft → Sent for Review → Revision Requested → Approved → Archived)
  - `Product/Style` (Mediterranean, Modern, Contemporary, etc.)
  - `Material/Finish` (Oak Wood, Walnut, etc.)
  - `Color/Finish Code` (Natural Oak #M2847)
  - `Hardware/Accessories` (Multi-select: Ceramic Knobs, Soft-close Hinges, etc.)
  - `Design Notes` (Approved after 2 revisions...)
  - `Owner` (Designer name - should be current user or selectable)
  - `Sent to Client Date` (2025-07-01)
  - `Task Status` (New, In Progress, Completed)

**Data That SHOULD INCLUDE**:
```json
{
  "Design ID": "DES-742857",
  "Linked Project ID": "proj-uuid-123",
  "Linked Project Name": "Mediterranean Kitchen Renovation",
  "Linked Client Name": "Ahmed Hassan",
  "Design Version #": 3,
  "Design Status": "Approved",
  "Product/Style": "Mediterranean",
  "Material/Finish": "Oak Wood with Ceramic Handles",
  "Color/Finish Code": "Natural Oak #M2847",
  "Hardware/Accessories": ["Ceramic Knobs", "Soft-close Hinges", "Pull-out Shelves"],
  "Design Notes": "Approved after 2 revisions. Client satisfied.",
  "Owner": "Designer Name",
  "Sent to Client Date": "2025-07-01",
  "Task Status": "Completed"
}
```

---

## Phase 6: QUOTING & CONTRACTS
**WHO**: Sales Manager / Finance Manager
**MODULE**: `quoting-contracts`
**DEPENDENCY**: Design approved + Project exists

### Step 6.1: Create Quote
- **Required Fields**:
  - `Quote ID` (AUTO: QT-742857)
  - **`Linked Project ID`** ⚠️ (Dropdown)
  - `Quote Version #` (1, 2...)
  - `Quote Status` (Draft → Sent → Revised → Accepted → Rejected → Expired)
  - `Quote Date` (2025-07-15)
  - `Valid Until` (2025-08-15)
  - **`Line Items`** (Table with: Item Name, Qty, Unit Price, Line Total)
    - Oak Cabinetry | 12 units | AED 2,500 | AED 30,000
    - Marble Countertops | 8 m² | AED 4,000 | AED 32,000
    - Hardware | 1 set | AED 8,000 | AED 8,000
  - `Subtotal` (AED 70,000)
  - `Discount` (AED 0)
  - `Tax` (AED 15,000)
  - **`Total`** (AED 85,000) ⚠️ **Should match Budget from Lead**
  - `Payment Terms` (30% deposit, 70% on completion)
  - `Lead Time / Estimated Delivery Window` (6 weeks)
  - `Prepared By` (Sales Manager name)
  - `Task Status` (Completed)

**VERIFICATION CHECKLIST**:
- ✅ Total amount matches Lead Budget range
- ✅ Line items are realistic and detailed
- ✅ Payment terms are clear and documented
- ✅ Project Name and Client Name visible in quote

---

## Phase 7: APPROVAL WORKFLOW
**WHO**: Client / Approver
**MODULE**: `approval-workflow`
**DEPENDENCY**: Quote created

### Step 7.1: Create Approval Record
- **Required Fields**:
  - `Approval ID` (AUTO: APR-742857)
  - **`Linked Project ID`** ⚠️ (Reference to Project)
  - `Approval Type` (Design, Quote, Change Order)
  - **`Related Record`** (Quote ID: QT-742857)
  - `Status` (Pending → Approved → Rejected)
  - `Approver` (Client name or internal manager)
  - `Decision Date` (2025-07-20)
  - `Comments / Reason` (Quote approved by client...)
  - `Task Status` (Completed)

**Data Expected**:
```json
{
  "Approval ID": "APR-742857",
  "Linked Project ID": "proj-uuid-123",
  "Linked Project Name": "Mediterranean Kitchen Renovation",
  "Approval Type": "Quote",
  "Related Record": "QT-742857",
  "Status": "Approved",
  "Approver": "Ahmed Hassan (Client) / Finance Manager",
  "Decision Date": "2025-07-20",
  "Comments / Reason": "Quote approved by client. Ready for production.",
  "Task Status": "Completed"
}
```

---

## Phase 8: JOB CONFIRMATION
**WHO**: Project Manager / Finance Manager
**MODULE**: `job-confirmation`
**DEPENDENCY**: Approval received + Quote accepted

### Step 8.1: Create Job Confirmation (Sales Order)
- **Required Fields**:
  - `Order ID` (AUTO: JC-742857)
  - **`Linked Project ID`** ⚠️
  - `Status` (Open → In Production → Ready → Delivered → Closed)
  - **`Accepted Quote ID`** (QT-742857) ⚠️ **Should be dropdown/reference**
  - `Order Date` (2025-07-22)
  - `Target Delivery Date` (2025-09-03)
  - `Deposit Required` (Y/N)
  - `Deposit Amount` (AED 25,500) ⚠️ **Should auto-calc as 30% of Quote Total**
  - `Special Terms / Notes` (Install includes final walkthrough...)
  - `Customer Reference` (AH-2025-07-001)
  - `Internal Owner` (Project Coordinator name)
  - `Task Status` (Completed)

**CRITICAL VALIDATIONS**:
- ✅ Deposit Amount = Quote Total × Deposit Percentage
- ✅ Quote ID is valid and references correct quote
- ✅ Project ID is valid
- ✅ Customer Name visible and correct

---

## Phase 9: WORK ORDERS
**WHO**: Production Manager / Coordinator
**MODULE**: `work-orders`
**DEPENDENCY**: Job Confirmation created

### Step 9.1: Create Work Order
- **Required Fields**:
  - `Work Order ID` (AUTO: WO-742857, WO-742858, etc. for multi-part projects)
  - **`Linked Sales Order ID`** (JC-742857) ⚠️ **Reference to Job Confirmation**
  - **`Linked Project ID`** ⚠️ (Reference to Project)
  - `Work Type` (Design, Fabrication, Assembly, Installation, Other)
  - `Status` (Assigned → In Progress → On Hold → Ready for QC → Completed)
  - `Assigned To` (Team/Person name)
  - `Assigned Date` (2025-07-25)
  - `Scheduled Start Date` (2025-07-28)
  - `Scheduled End Date` (2025-08-25)
  - `Actual Start Date` (2025-07-28)
  - `Actual End Date` (2025-08-24)
  - `Priority` (Low, Medium, High, Critical)
  - `Description / Scope` (Fabricate all cabinetry...)
  - `Special Instructions` (Use only premium oak...)
  - `Task Status` (Completed)

**Expected Data**:
```json
{
  "Work Order ID": "WO-742857",  // ← Fabrication
  "Linked Sales Order ID": "JC-742857",
  "Linked Project ID": "proj-uuid-123",
  "Linked Project Name": "Mediterranean Kitchen Renovation",
  "Work Type": "Fabrication",
  "Status": "Completed",
  "Assigned To": "Manufacturing Team",
  "Assigned Date": "2025-07-25",
  "Scheduled Start Date": "2025-07-28",
  "Scheduled End Date": "2025-08-25",
  "Actual Start Date": "2025-07-28",
  "Actual End Date": "2025-08-24",
  "Priority": "High",
  "Description / Scope": "Fabricate all cabinetry and prepare marble...",
  "Special Instructions": "Use only premium oak wood...",
  "Task Status": "Completed"
}
```

```json
{
  "Work Order ID": "WO-742858",  // ← Installation (separate WO for same project)
  "Linked Sales Order ID": "JC-742857",
  "Linked Project ID": "proj-uuid-123",
  "Work Type": "Installation",
  "Status": "Completed",
  // ... rest of fields
}
```

---

## Phase 10: BOM / MATERIALS PLANNING
**WHO**: Planner / Production Manager
**MODULE**: `bom-materials-planning`
**DEPENDENCY**: Work Order created

### Step 10.1: Create BOM
- **Required Fields**:
  - `BOM ID` (AUTO: BOM-742857)
  - **`Linked Work Order ID`** (WO-742857) ⚠️ **Links to Work Order**
  - `BOM Version` (1, 2...)
  - `BOM Status` (Draft → Final)
  - **`Items`** (Table):
    - Oak Wood Panels | SKU: OAK-12MM | Qty: 45 m² | Stock Available: 50 m² | To Purchase: 0
    - Ceramic Knobs | SKU: KNOB-CER-001 | Qty: 24 pieces | Stock: 30 | To Purchase: 0
    - Soft-close Hinges | SKU: HINGE-SC-50 | Qty: 36 pairs | Stock: 40 | To Purchase: 0
  - `Planner` (User name)
  - `Date Finalized` (2025-07-26)
  - `Task Status` (Completed)

**Expected Behavior**:
- ✅ When linking Work Order, auto-populates work type, project info
- ✅ Can add items with SKU lookup (if inventory module exists)
- ✅ System calculates "Qty to Purchase" = Qty Required - Stock Available
- ✅ Display shows Project Name, Work Order ID, all linked info

---

## Phase 11: PROCUREMENT
**WHO**: Procurement Manager
**MODULE**: `procurement`
**DEPENDENCY**: BOM created (if items need to be purchased)

### Step 11.1: Create Purchase Order
- **Required Fields**:
  - `PO Number` (AUTO: PO-742857)
  - `Supplier` (AlMarjan Timber & Hardware, Italian Marble Imports, etc.)
  - `PO Status` (Draft → Sent → Partially Received → Received → Closed)
  - `Order Date` (2025-07-26)
  - `Expected Delivery Date` (2025-08-10)
  - **`Linked Work Order(s)`** (WO-742857) ⚠️ **Reference to Work Orders**
  - **`PO Lines`** (Table):
    - Item/SKU | Description | Qty | Unit | Unit Cost | Line Total
    - OAK-12MM | Premium oak wood panels | 50 | m² | AED 400 | AED 20,000
    - KNOB-CER-001 | Ceramic drawer knobs | 50 | pieces | AED 50 | AED 2,500
  - `Subtotal`, `Tax`, `Total`
  - `Received Date`, `Received By` (when received)
  - `Task Status` (Completed)

**VERIFICATION**:
- ✅ Work Order ID is valid
- ✅ Items match BOM items
- ✅ Quantities match BOM quantities (or more)
- ✅ Supplier is documented
- ✅ Costs are reasonable

---

## Phase 12: PRODUCTION SCHEDULING
**WHO**: Planner / Production Manager
**MODULE**: `production-scheduling`
**DEPENDENCY**: BOM finalized + Work Order exists

### Step 12.1: Create Production Schedule Entry
- **Required Fields**:
  - `Scheduled Entry ID` (AUTO: PS-742857)
  - **`Linked Work Order ID`** (WO-742857) ⚠️
  - `Production Station` (Assembly, Finishing, Painting, QC, Packing, etc.)
  - `Status` (Scheduled, In Progress, Done, On Hold, Blocked)
  - `Scheduled Start` (2025-07-28)
  - `Scheduled End` (2025-08-15)
  - `Actual Start` (2025-07-28)
  - `Actual End` (2025-08-14)
  - `Operator` (Technician/Manager name)
  - `Notes` (Assembly completed ahead of schedule...)
  - `Task Status` (Completed)

**Expected Behavior**:
- ✅ When selecting Work Order, auto-shows Project Name, Customer, Work Type
- ✅ Multiple schedule entries for same WO (Assembly → Finishing → QC)
- ✅ Actual dates can be compared against scheduled dates

---

## Phase 13: MANUFACTURING
**WHO**: Manufacturing Manager
**MODULE**: `manufacturing`
**DEPENDENCY**: Work Order + Production Schedule

### Step 13.1: Create Manufacturing Record
- **Required Fields**:
  - `Manufacturing Order ID` (AUTO: MFG-742857)
  - **`Linked Work Order ID`** (WO-742857) ⚠️
  - `Status` (In Progress, Completed, On Hold, Issue Found)
  - `Qty Produced` (18 panels + counters)
  - `Qty Units` (panels, units, sets, etc.)
  - `Completion Date` (2025-08-24)
  - `Issues Noted` (None / List of issues)
  - `Inspection Notes` (All pieces passed quality standards...)
  - `Task Status` (Completed)

**VERIFICATION**:
- ✅ Work Order ID valid
- ✅ Qty Produced matches BOM item quantities
- ✅ Issues documented if any

---

## Phase 14: QUALITY CONTROL
**WHO**: QC Manager
**MODULE**: `quality-control`
**DEPENDENCY**: Manufacturing completed + Work Order

### Step 14.1: Create QC Record
- **Required Fields**:
  - `QC Record ID` (AUTO: QC-742857)
  - **`Linked Work Order ID`** (WO-742857) ⚠️
  - `Inspection Date` (2025-08-25)
  - `Inspector` (QC Manager name)
  - `Result` (Pass, Fail, Conditional Pass)
  - `Issues Found` (0, 1, 2, etc.)
  - `Notes` (All cabinetry meets specifications...)
  - `Task Status` (Completed)

**Expected Behavior**:
- ✅ Displays Work Order info, Project Name, Customer Name
- ✅ Fail result can trigger workflow (rework needed)
- ✅ Pass result allows progression to Packaging

---

## Phase 15: PACKAGING
**WHO**: Packaging/Logistics Team
**MODULE**: `packaging`
**DEPENDENCY**: QC passed + Work Order

### Step 15.1: Create Packing Record
- **Required Fields**:
  - `Packing ID` (AUTO: PKG-742857)
  - **`Linked Work Order ID`** (WO-742857) ⚠️
  - `Status` (Not Packed, Packed, Staged, Shipped)
  - `Items Packed` (18 units)
  - `Packing Date` (2025-08-25)
  - `Shipping Labels` (MKR-PKG-001, MKR-PKG-002)
  - `Tracking Number` (AE-DXB-2025-08-001)
  - `Notes` (All items wrapped and labeled...)
  - `Task Status` (Completed)

---

## Phase 16: DELIVERY & INSTALLATION
**WHO**: Logistics Manager / Installation Supervisor
**MODULE**: `delivery-installation`
**DEPENDENCY**: Packaging completed + Work Order

### Step 16.1: Create Delivery Record
- **Required Fields**:
  - `Delivery Job ID` (AUTO: DEL-742857)
  - **`Linked Work Order ID`** (WO-742858 - Installation WO) ⚠️
  - `Status` (Scheduled, In Transit, Arrived, Installed, Completed)
  - `Delivery Date` (2025-09-02)
  - `Installation Date` (2025-09-03)
  - `Driver` (Hassan Al-Mulla)
  - `Installation Supervisor` (Logistics Manager name)
  - `Proof of Delivery` (Signed by Ahmed Hassan)
  - `Delivery Notes` (On-time delivery. Installation completed...)
  - `Task Status` (Completed)

---

## Phase 17: BILLING & INVOICING
**WHO**: Finance Manager
**MODULE**: `billing-invoicing`
**DEPENDENCY**: Job Confirmation (Sales Order)

### Step 17.1: Create Invoice Records
**Invoice 1 - Deposit**:
- `Invoice ID` (AUTO: INV-742857)
- **`Linked Sales Order ID`** (JC-742857) ⚠️
- `Invoice Type` (Deposit, Partial, Final, Adjustment)
- `Invoice Date` (2025-07-22)
- `Due Date` (2025-07-29)
- `Amount Due` (AED 25,500) ⚠️ **30% of Quote Total**
- `Amount Paid` (AED 25,500)
- `Payment Date` (2025-07-28)
- `Status` (Paid, Pending, Overdue, Cancelled)
- `Payment Method` (Bank Transfer, Credit Card, Cash, Check)
- `Notes` (30% deposit received before production start)
- `Task Status` (Completed)

**Invoice 2 - Final**:
- `Invoice ID` (AUTO: INV-742858)
- **`Linked Sales Order ID`** (JC-742857) ⚠️ (same Sales Order)
- `Invoice Type` (Final)
- `Invoice Date` (2025-09-04)
- `Due Date` (2025-09-11)
- `Amount Due` (AED 59,500) ⚠️ **70% of Quote Total**
- `Amount Paid` (AED 59,500)
- `Payment Date` (2025-09-08)
- `Status` (Paid)
- `Payment Method` (Bank Transfer)
- `Notes` (70% balance paid after successful installation)
- `Task Status` (Completed)

**VERIFICATION**:
- ✅ Deposit + Final = Quote Total
- ✅ Both invoices linked to same Sales Order
- ✅ Payment dates are realistic relative to project timeline

---

## Phase 18: CLOSURE
**WHO**: Project Manager
**MODULE**: `closure`
**DEPENDENCY**: All work completed + Invoices paid

### Step 18.1: Create Closure Record (Only for COMPLETED projects)
- **Required Fields**:
  - `Closure Record ID` (AUTO: CLS-742857)
  - **`Linked Project ID`** ⚠️
  - `Closure Date` (2025-09-15)
  - `Close Reason` (Completed, Cancelled, On Hold, etc.)
  - `Status` (Closed, Archived)
  - `Final Notes` (Project completed successfully...)
  - `Lessons Learned` (Prefabrication in workshop saved 2 days...)
  - `Follow-up Required` (Annual maintenance reminder in Sep 2026)
  - `Task Status` (Completed)

**Expected Behavior**:
- ✅ Only appears for projects that have reached completion
- ✅ Links to Project
- ✅ All required documentation is attached

---

## Key Data Dependencies Summary

```
Clients (independent)
   ↓
Leads (crm-leads) ← references Client
   ↓
Projects ← references Client
   ↓
Requirements ← references Project
Design ← references Project
Quote ← references Project
Approval ← references Project, Quote
Job Confirmation ← references Project, Quote
   ↓
Work Orders (can be multiple) ← references Project, Sales Order
   ↓
BOM ← references Work Order
Procurement ← references Work Order
Production Scheduling ← references Work Order
Manufacturing ← references Work Order
QC ← references Work Order
   ↓
Packaging ← references Work Order
   ↓
Delivery ← references Work Order (Installation WO)
   ↓
Invoicing ← references Sales Order
   ↓
Closure ← references Project
```

---

## What Should Be Verified in Database

For each of the 3 projects (MKR, CLM, MOF), verify:

### MKR (Mediterranean Kitchen - COMPLETE)
- ✅ Client "Ahmed Hassan" exists in `clients` table
- ✅ Lead record has Customer Name = "Ahmed Hassan"
- ✅ Project linked to Client ID
- ✅ All 17 module records have correct `Linked Project ID` / `Linked Work Order ID`
- ✅ Quote Total (AED 85,000) matches Budget from Lead
- ✅ Deposit Amount (AED 25,500) = 30% of Quote
- ✅ Final Invoice (AED 59,500) = 70% of Quote
- ✅ QC Results = "Pass" for both Work Orders
- ✅ All dates are sequential and realistic
- ✅ Closure record exists (only for complete projects)

### CLM (Contemporary Living Room - MID-WORKFLOW)
- ✅ Client "Sarah Al-Mansoori" exists
- ✅ Lead status = "Qualified"
- ✅ Project exists and linked to Client
- ✅ Design = "Sent for Review"
- ✅ Quote = "Sent" (not yet accepted)
- ✅ Job Confirmation = "In Production"
- ✅ Work Order = "In Progress"
- ✅ Production Scheduling = "In Progress" (40% complete)
- ✅ Manufacturing = "In Progress" with issue noted
- ✅ QC = "Fail" with 2 issues found
- ✅ ⚠️ NO closure record (project not complete)

### MOF (Modern Office Fit-out - EARLY WORKFLOW)
- ✅ Client "Blue Wave Consulting LLC" exists
- ✅ Lead status = "Contacted"
- ✅ Project exists and linked to Client
- ✅ Requirements = "In Progress"
- ✅ Design = "Draft" (not sent yet)
- ✅ Quote = "Draft" (not sent yet)
- ✅ Approval = "Pending"
- ✅ ⚠️ NO Job Confirmation (approval still pending)
- ✅ ⚠️ NO Work Orders (not yet confirmed)
- ✅ ⚠️ NO downstream records (procurement, manufacturing, etc.)

---

## Next Steps: Manual Workflow Testing

1. **Login as Sales Manager**
   - Create 3 new clients (if not using seeded data)
   - Verify client details can be saved with all required fields
   - Check that clients appear in dropdowns

2. **Login as Project Manager**
   - Create projects and link to clients from dropdown
   - Verify Customer Name auto-populates from Client
   - Check that projects show in `/app/projects` with Client info

3. **Navigate to CRM Leads Module**
   - Create lead and link to Client
   - Verify Customer Name is searchable/selectable
   - Check that lead shows Customer Name in list view

4. **Navigate to Project Requirements Module**
   - Link requirement to project (from dropdown)
   - Verify project dropdown shows "Project Name (Customer Name)"
   - Check that Customer info auto-displays

5. **Continue through each module**
   - For each module, verify:
     - Correct linking to previous module
     - Required fields cannot be left blank
     - Dropdown references show related info
     - All data persists correctly

6. **Verify Dashboard/Reports**
   - Check that Customer Name appears in all list views
   - Verify filters work correctly
   - Check that detail views show all linked data

