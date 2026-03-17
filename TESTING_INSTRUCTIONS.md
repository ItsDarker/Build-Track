# Manual Workflow Testing Instructions

**Status**: Database contains 34 seeded records. Ready for manual verification.

## What Was Done Wrong Initially ❌

I directly seeded the database without:
1. ❌ Understanding the actual user workflow
2. ❌ Creating parent data first (Clients before Leads, Projects before Requirements)
3. ❌ Verifying that dropdown references would work
4. ❌ Testing that related data appears correctly in dependent modules
5. ❌ Checking that all required fields were properly linked
6. ❌ Ensuring the data matched how a real user would enter it

**Result**: Records were created but lack proper linking and context. For example:
- Leads don't reference which Client they belong to
- Projects don't have linked Client info
- Work Orders don't show which Customer they serve
- Dropdowns in forms won't have correct reference data

---

## What Was Done Right ✅

1. ✅ 34 records exist in database across 17 modules
2. ✅ Records follow a logical 3-project progression:
   - **MKR**: Complete end-to-end workflow (Lead → Closure)
   - **CLM**: Mid-workflow with QC failure
   - **MOF**: Early workflow at Quoting stage
3. ✅ Created **WORKFLOW_ANALYSIS.md** documenting:
   - Proper data dependencies
   - Required fields for each module
   - How modules link together
   - What users should see at each step

---

## How to Manually Verify the Workflow

### Step 1: Start the Application

```bash
# Terminal 1: Start backend
cd "C:/Personal Files/BuildTrack/backend"
npm run dev

# Terminal 2: Start frontend
cd "C:/Personal Files/BuildTrack/frontend"
npm run dev

# Terminal 3: View database (optional)
cd "C:/Personal Files/BuildTrack/backend"
npm run prisma:studio
```

### Step 2: Login and Test Clients Module

**Login as**: PM (`pm@buildtrack.com` / password: `BuildTrack2026`)

**Navigate to**: `/app/clients`

**Test**:
- [ ] Does the Clients module exist?
- [ ] Can you view the 3 seeded clients?
  - Ahmed Hassan
  - Sarah Al-Mansoori
  - Blue Wave Consulting LLC
- [ ] Do clients display all required fields?
  - Name, Email, Phone, Company, Address, Role, etc.
- [ ] Can you create a new client and verify all fields are saved?

**Expected Result**: Clients are viewable and searchable

---

### Step 3: Test Projects Module

**Navigate to**: `/app/projects`

**Test**:
- [ ] Do you see 3 projects?
  - Mediterranean Kitchen Renovation (MKR)
  - Contemporary Living Room Makeover (CLM)
  - Modern Office Fit-out (MOF)
- [ ] Click on first project - does it show:
  - [ ] Project name
  - [ ] Linked Client name (Ahmed Hassan)
  - [ ] Project Manager assigned
  - [ ] Status (Completed, In Progress, etc.)
  - [ ] Start/End dates
- [ ] Try creating a new project:
  - [ ] Can you select a Client from dropdown?
  - [ ] Does dropdown show "Client Name (Company)"?
  - [ ] After selection, does Client info auto-display?

**Expected Result**: Projects linked to Clients with clear references

---

### Step 4: Test CRM Leads Module

**Navigate to**: `/app/tasks/leads` (or Workflow → CRM Leads)

**Test**:
- [ ] Do you see 3 leads?
  - MKR Lead (Status: Closed)
  - CLM Lead (Status: Qualified)
  - MOF Lead (Status: Contacted)
- [ ] Click first lead - does it show:
  - [ ] Lead ID (auto-generated)
  - [ ] Customer Name (Ahmed Hassan)
  - [ ] Project Name (Mediterranean Kitchen Renovation)
  - [ ] Budget (AED 85,000)
  - [ ] Priority, Source, Contact info
  - [ ] Site Address
  - [ ] All dates and statuses
- [ ] Try creating a new lead:
  - [ ] Is Customer Name a searchable dropdown?
  - [ ] Can you select from existing clients?
  - [ ] Does contact info auto-fill from selected client?

**Expected Result**: Leads show Customer Names and are linked to clients

---

### Step 5: Test Project Requirements Module

**Navigate to**: Workflow → Project Requirements

**Test**:
- [ ] Do you see 3 requirement records?
- [ ] Click MKR requirement - does it show:
  - [ ] Requirement Record ID (auto)
  - [ ] Linked Project ID / Project Name
  - [ ] Customer Name (from linked project)
  - [ ] Site Visit Date
  - [ ] Measurements, Constraints, Preferences
  - [ ] All completed status fields
- [ ] Try creating new requirement:
  - [ ] Can you select Project from dropdown?
  - [ ] Does dropdown show "Project Name (Customer Name)"?
  - [ ] Are all required fields available?

**Expected Result**: Requirements show linked project and customer info

---

### Step 6: Test Design Configurator Module

**Navigate to**: Workflow → Design Configurator

**Test**:
- [ ] Do you see 3 design records?
- [ ] Click MKR design - does it show:
  - [ ] Design ID (auto)
  - [ ] Linked Project (MKR)
  - [ ] Design Status (Approved)
  - [ ] Material/Style info
  - [ ] Owner (Designer name)
  - [ ] Sent to Client Date
- [ ] Try creating new design:
  - [ ] Can select Project from dropdown?
  - [ ] All material/style dropdowns available?

**Expected Result**: Designs linked to projects with material/style info

---

### Step 7: Test Quoting & Contracts Module

**Navigate to**: Workflow → Quoting & Contracts

**Test**:
- [ ] Do you see 3 quote records?
- [ ] Click MKR quote - verify:
  - [ ] Quote ID (auto)
  - [ ] Quote Status (Accepted for MKR, Sent for CLM, Draft for MOF)
  - [ ] **Line Items table** shows:
    - Item names, quantities, unit prices
    - Line totals calculated correctly
  - [ ] Subtotal, Tax, **Total** (AED 85,000 for MKR)
  - [ ] Payment Terms (30% deposit, 70% balance)
  - [ ] Lead Time / Delivery window
  - [ ] Prepared By (Sales Manager)
- [ ] ⚠️ **CRITICAL**: For MKR, verify:
  - [ ] Total = AED 85,000 (matches Budget from Lead)
  - [ ] Deposit calc = 30% = AED 25,500

**Expected Result**: Quotes show complete line items and totals

---

### Step 8: Test Approval Workflow Module

**Navigate to**: Workflow → Approval Workflow

**Test**:
- [ ] Do you see 3 approval records?
- [ ] Click MKR approval - verify:
  - [ ] Approval ID (auto)
  - [ ] Approval Type (Design, Quote, etc.)
  - [ ] Related Record (links to Quote ID, Design ID)
  - [ ] Status (Approved, Pending, etc.)
  - [ ] Approver name
  - [ ] Decision Date
  - [ ] Comments/Reason

**Expected Result**: Approvals link to quotes/designs

---

### Step 9: Test Job Confirmation Module

**Navigate to**: Workflow → Job Confirmation

**Test**:
- [ ] Do you see 2 records (MKR completed, CLM in progress)?
  - MOF should NOT have job confirmation (still pending approval)
- [ ] Click MKR - verify:
  - [ ] Order ID (auto)
  - [ ] Status (Closed / Delivered)
  - [ ] **Accepted Quote ID** (links to QT-742857)
  - [ ] **Deposit Amount** (AED 25,500 = 30% of quote)
  - [ ] Order Date, Target Delivery Date
  - [ ] Special Terms

**Expected Result**: Job Confirmations link to accepted quotes with correct deposit calcs

---

### Step 10: Test Work Orders Module

**Navigate to**: Workflow → Work Orders

**Test**:
- [ ] Do you see 3 work orders?
  - MKR: WO-742857 (Fabrication, Completed)
  - MKR: WO-742858 (Installation, Completed)
  - CLM: WO-742859 (Fabrication, In Progress)
- [ ] Click MKR Fabrication WO - verify:
  - [ ] Work Order ID (auto)
  - [ ] **Linked Sales Order ID** (JC-742857)
  - [ ] **Linked Project ID** (project-uuid)
  - [ ] Work Type (Fabrication)
  - [ ] Status (Completed)
  - [ ] Assigned To (Manufacturing Team)
  - [ ] Scheduled vs Actual dates
  - [ ] Priority, Description, Special Instructions
- [ ] ⚠️ **VERIFY**: MKR has TWO work orders (Fabrication + Installation)
  - Each with different dates
  - Each with appropriate scope

**Expected Result**: Work Orders show linked Sales Order and Project, with proper sequencing

---

### Step 11: Test BOM / Materials Planning Module

**Navigate to**: Workflow → BOM / Materials Planning

**Test**:
- [ ] Do you see 2-3 BOM records?
- [ ] Click MKR BOM - verify:
  - [ ] BOM ID (auto)
  - [ ] **Linked Work Order ID** (WO-742857)
  - [ ] BOM Status (Final)
  - [ ] **Items table** with:
    - Material/Component Name (Oak Wood Panels, Ceramic Knobs, etc.)
    - SKU/Code (OAK-12MM, KNOB-CER-001, etc.)
    - Qty Required, Stock Available, Qty to Purchase
    - All columns populated with realistic data
  - [ ] Planner name, Date Finalized
- [ ] ⚠️ **VERIFY**: For MKR, items should match what would go into cabinetry

**Expected Result**: BOMs show materials with realistic quantities linked to work orders

---

### Step 12: Test Procurement Module

**Navigate to**: Workflow → Procurement

**Test**:
- [ ] Do you see 3 PO records?
  - MKR PO-1: Received (timber)
  - MKR PO-2: Closed (hardware)
  - CLM PO-1: Sent (LED lighting)
- [ ] Click MKR PO-1 - verify:
  - [ ] PO Number (auto)
  - [ ] Supplier name
  - [ ] PO Status (Received for MKR-1, Closed for MKR-2)
  - [ ] **Linked Work Order(s)** (WO-742857)
  - [ ] **PO Lines table**:
    - Item SKU, Description, Qty, Unit, Unit Cost, Line Total
    - Totals calculated correctly
  - [ ] Received Date, Received By (if status = Received)
- [ ] ⚠️ **VERIFY**: Items in PO match BOM items

**Expected Result**: POs link to work orders with matching line items

---

### Step 13: Test Production Scheduling Module

**Navigate to**: Workflow → Production Scheduling

**Test**:
- [ ] Do you see 3 scheduling records?
- [ ] Click MKR Assembly schedule - verify:
  - [ ] Scheduled Entry ID
  - [ ] **Linked Work Order ID** (WO-742857)
  - [ ] Production Station (Assembly, Finishing, etc.)
  - [ ] Status (Done for MKR, In Progress for CLM)
  - [ ] Scheduled vs Actual dates
  - [ ] Operator name
  - [ ] Notes field
- [ ] ⚠️ **VERIFY**: MKR has two schedule entries (Assembly + Finishing)
  - Dates are sequential
  - Finishing starts after Assembly completes

**Expected Result**: Production schedules show workstation flow with linked work orders

---

### Step 14: Test Manufacturing Module

**Navigate to**: Workflow → Manufacturing

**Test**:
- [ ] Do you see 2 manufacturing records?
  - MKR: Completed
  - CLM: In Progress
- [ ] Click MKR - verify:
  - [ ] Manufacturing Order ID (auto)
  - [ ] **Linked Work Order ID** (WO-742857)
  - [ ] Status (Completed)
  - [ ] Qty Produced (18 units/panels)
  - [ ] Issues Noted (None for MKR)
  - [ ] Inspection Notes
- [ ] Click CLM - verify:
  - [ ] Status (In Progress)
  - [ ] **Issues Noted** (LED shipment delayed 2 days)
  - [ ] Inspection Notes mention rework needed

**Expected Result**: Manufacturing shows qty and issues linked to work orders

---

### Step 15: Test Quality Control Module

**Navigate to**: Workflow → Quality Control

**Test**:
- [ ] Do you see 3 QC records?
  - MKR WO-1: Pass
  - MKR WO-2: Pass
  - CLM: Fail
- [ ] Click MKR QC-1 - verify:
  - [ ] QC Record ID (auto)
  - [ ] **Linked Work Order ID** (WO-742857)
  - [ ] Result (Pass)
  - [ ] Issues Found (0)
  - [ ] Inspector name
  - [ ] Inspection Notes
- [ ] Click CLM QC - verify:
  - [ ] Result (Fail)
  - [ ] Issues Found (2)
  - [ ] **Notes mention specific issues**: LED connections loose, finishes scratched
  - [ ] Status indicates rework needed

**Expected Result**: QC records show pass/fail with detailed notes linked to work orders

---

### Step 16: Test Packaging Module

**Navigate to**: Workflow → Packaging

**Test**:
- [ ] Do you see 1-2 packing records?
  - MKR: Staged (ready to ship)
  - CLM: Not Packed (waiting for QC rework)
- [ ] Click MKR - verify:
  - [ ] Packing ID
  - [ ] **Linked Work Order ID** (WO-742857)
  - [ ] Status (Staged)
  - [ ] Items Packed (18)
  - [ ] Shipping Labels (MKR-PKG-001, MKR-PKG-002)
  - [ ] Tracking Number
  - [ ] Notes

**Expected Result**: Packaging shows item counts and tracking linked to work orders

---

### Step 17: Test Delivery & Installation Module

**Navigate to**: Workflow → Delivery & Installation

**Test**:
- [ ] Do you see 1-2 delivery records?
  - MKR: Installed
  - CLM: Scheduled (not yet delivered)
- [ ] Click MKR - verify:
  - [ ] Delivery Job ID
  - [ ] **Linked Work Order ID** (WO-742858 - the Installation WO)
  - [ ] Status (Installed)
  - [ ] Delivery Date (2025-09-02)
  - [ ] Installation Date (2025-09-03)
  - [ ] Driver name, Installation Supervisor name
  - [ ] Proof of Delivery (signed by customer)
  - [ ] Delivery Notes

**Expected Result**: Delivery links to Installation work order with POD

---

### Step 18: Test Billing & Invoicing Module

**Navigate to**: Workflow → Billing & Invoicing

**Test**:
- [ ] Do you see 3 invoice records?
  - MKR Deposit: Paid (AED 25,500)
  - MKR Final: Paid (AED 59,500)
  - CLM Invoice: Sent (partial payment)
- [ ] Click MKR Deposit - verify:
  - [ ] Invoice ID (auto)
  - [ ] **Linked Sales Order ID** (JC-742857)
  - [ ] Invoice Type (Deposit)
  - [ ] Invoice Date, Due Date
  - [ ] Amount Due (AED 25,500)
  - [ ] Amount Paid (AED 25,500)
  - [ ] Payment Date, Payment Method (Bank Transfer)
  - [ ] Status (Paid)
- [ ] Click MKR Final - verify:
  - [ ] Amount Due (AED 59,500)
  - [ ] **Total from both invoices** = AED 85,000 (Quote Total) ✅
- [ ] ⚠️ **CRITICAL CALCULATION**:
  - [ ] Deposit (AED 25,500) = 30% of Quote (AED 85,000)
  - [ ] Final (AED 59,500) = 70% of Quote
  - [ ] Deposit + Final = AED 85,000 ✓

**Expected Result**: Two invoices linked to same sales order with correct payment split

---

### Step 19: Test Closure Module

**Navigate to**: Workflow → Closure

**Test**:
- [ ] Do you see 1 closure record (MKR only)?
  - ⚠️ CLM and MOF should NOT have closure records yet
- [ ] Click MKR - verify:
  - [ ] Closure Record ID (auto)
  - [ ] **Linked Project ID** (project-uuid for MKR)
  - [ ] Closure Date (2025-09-15)
  - [ ] Close Reason (Completed)
  - [ ] Status (Closed)
  - [ ] Final Notes (Project completed successfully...)
  - [ ] Lessons Learned (Prefabrication saved 2 days...)
  - [ ] Follow-up Required (Annual maintenance reminder)

**Expected Result**: Only completed projects have closure records

---

## Summary Checklist

### Data Integrity ✓

- [ ] **All 3 Clients exist** (Ahmed Hassan, Sarah Al-Mansoori, Blue Wave Consulting)
- [ ] **All 3 Projects exist** and link to correct clients
- [ ] **All 3 Leads exist** with correct customer names and budgets
- [ ] **All 34 module records exist** across 17 modules
- [ ] **Cross-module linking works**:
  - Project Requirements → Project
  - Design → Project
  - Quote → Project
  - Work Orders → Sales Order + Project
  - BOM → Work Order
  - Procurement → Work Order
  - etc.

### Workflow Progression ✓

- [ ] **MKR (Complete)**: Lead → Requirements → Design → Quote → Approval → Job Confirmation → Work Orders (2) → BOM → Procurement → Production → Manufacturing → QC (Pass) → Packaging → Delivery → Invoicing (2) → Closure
- [ ] **CLM (Mid-workflow)**: Lead → Requirements → Design → Quote → Approval → Job Confirmation → Work Order → BOM → Procurement → Production → Manufacturing → QC (Fail, awaiting rework)
- [ ] **MOF (Early)**: Lead → Requirements → Design → Quote → Approval (Pending, no Job Confirmation yet)

### Data Completeness ✓

- [ ] **All ID fields are auto-generated** (Lead ID, Design ID, Quote ID, etc.)
- [ ] **All status fields are populated** with realistic values
- [ ] **All dates are sequential and realistic**
- [ ] **All monetary amounts are calculated correctly**:
  - Quote Total = Sum of Line Items
  - Deposit = % of Quote Total
  - Final Invoice = Quote Total - Deposit
- [ ] **All required fields are not empty**
- [ ] **All linked fields reference valid records**

---

## Issues to Report

If you find any of the following, note them in a new issue:

1. [ ] Customer Name missing from Leads
2. [ ] Project doesn't show Client name
3. [ ] Module dropdowns don't show reference data
4. [ ] Related records don't auto-link
5. [ ] Calculations incorrect (deposit ≠ 30% of quote, etc.)
6. [ ] Required fields are empty
7. [ ] Dates are out of sequence
8. [ ] ID fields not auto-generated
9. [ ] Cross-module references broken
10. [ ] List views don't show Customer/Project name

---

## Next Actions

1. ✅ **Complete manual testing** using checklist above
2. 📝 **Document any issues** found
3. 🔄 **If major data issues**, request fresh seeding with proper workflow
4. 🎯 **If system is correct**, then automate proper workflow testing

