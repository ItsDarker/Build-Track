# BuildTrack: Complete User Workflow & System Architecture

**Last Updated:** March 3, 2026  
**Project Status:** MVP-Ready  
**Purpose:** Complete documentation of user roles, workflows, and system architecture

---

## Executive Summary

BuildTrack is a construction project management platform orchestrating the complete lifecycle from lead capture through project closure.

### System Scope:
- **17 Sequential Workflow Modules** (CRM → Closure)
- **12 Distinct User Roles** (each with specific responsibilities)
- **Granular RBAC** (fine-grained permission control)
- **Flexible JSON Data Model** (rapid iteration)
- **Complete Audit Trail** (every change tracked)
- **Full Automation** (auto-generated IDs, status defaults, smart assignments)

---

## Quick Reference: 12 User Roles

1. **PROJECT_MANAGER** - Orchestrates entire project lifecycle, all 17 modules R/W
2. **SALES_MANAGER** - Captures leads, creates quotes (CRM/Leads, Quoting R/W)
3. **PROJECT_COORDINATOR** - Gathers requirements, creates designs
4. **PROCUREMENT_MANAGER** - Sources materials, creates purchase orders
5. **PRODUCTION_MANAGER** - Supervises manufacturing, manages production
6. **PLANNER** - Plans production timeline, creates bills of materials
7. **QC_MANAGER** - Inspects quality, approves products
8. **LOGISTICS_MANAGER** - Schedules delivery, manages installation
9. **FINANCE_MANAGER** - Creates invoices, manages billing
10. **CLIENT** - External customer, mostly read-only access
11. **SUPER_ADMIN** - System administrator, full access
12. **ORG_ADMIN** - Organization administrator, full access

---

## Project Lifecycle: 17 Modules

**QUALIFICATION PHASE (Weeks 1-4)**
1. CRM/Leads - Sales captures inquiry
2. Project-Requirements - Requirements gathering via site visit
3. Design-Configurator - Design creation, material selection
4. Quoting-Contracts - Quote generation

**APPROVAL PHASE (Weeks 4-6)**
5. Approval-Workflow - Client approves design/quote
6. Job-Confirmation - Order confirmed, deposit collected

**PLANNING PHASE (Weeks 6-10)**
7. Work-Orders - Create work instructions
8. Support-Warranty - Setup warranty terms
9. BOM-Materials-Planning - Create material list
10. Procurement - Source from suppliers

**MANUFACTURING PHASE (Weeks 10-20)**
11. Production-Scheduling - Schedule production timeline
12. Manufacturing - Fabrication, assembly, finishing
13. Quality-Control - Inspect at each phase

**DELIVERY PHASE (Weeks 20-22)**
14. Packaging - Package product for shipment
15. Delivery-Installation - Install at client site

**CLOSURE PHASE (Weeks 22-24)**
16. Billing-Invoicing - Final invoice and payment
17. Closure - Project sign-off

---

## Core Features

### Auto-Generated Fields
- ID fields: Auto-populated on creation (format: PREFIX-TIMESTAMP, e.g., "CRM-742856")
- Status fields: Auto-populated with first option, editable if needed
- Audit fields: Created at/by, Updated at/by, always read-only

### Smart Assignments
- 14+ assignee field types detected automatically
- "Assign" button opens user picker modal
- Shows only assignable users by role

### File Management
- Upload any file type (50MB limit)
- Inline preview for images, PDFs, text
- Metadata tracked: filename, MIME type, size, uploader, date

### Validation & Error Handling
- Red asterisks mark required fields
- Client-side blocks empty required fields
- Server-side Zod validation
- Field-specific error messages

### Audit Trail
- Every change tracked (who, when, what)
- Full edit history available
- Essential for construction (disputes, warranties)

---

## Role-Based Access Control

### Permission Matrix Summary

PROJECT_MANAGER: All 17 modules (R/W on most, R on finance)
SALES_MANAGER: CRM/Leads (R/W), Quoting (R/W)
PROJECT_COORDINATOR: Requirements (R/W), Design (R/W), Work-Orders (R/W)
PROCUREMENT_MANAGER: BOM (R/W), Procurement (R/W)
PRODUCTION_MANAGER: Work-Orders (R/W), Manufacturing (R/W), Packaging (R/W), Scheduling (R/W)
PLANNER: Scheduling (R/W), BOM (R/W)
QC_MANAGER: Quality-Control (R/W + Approve)
LOGISTICS_MANAGER: Delivery (R/W)
FINANCE_MANAGER: Billing (R/W + Approve), Closure (R/W)
CLIENT: Read-only access to Project, Work-Orders, Delivery, Billing
SUPER_ADMIN: All resources, all actions
ORG_ADMIN: All resources, all actions

---

## MVP Demo Flow (45-60 minutes)

1. **Authentication & Roles** (5 min)
   - Login as different roles (PM, Sales, Production, QC, Client)
   - Show different module access per role
   - Demonstrate permission enforcement

2. **Lead to Quote** (10 min)
   - Sales logs new lead (auto-generated ID shown)
   - Status auto-populated to "New"
   - Upload project photo
   - Create quote

3. **Design Process** (10 min)
   - PM reviews and approves design
   - Client approves in approval-workflow
   - Deposit collected (Job Confirmation)

4. **Production** (15 min)
   - Planner creates BOM
   - Procurement creates PO
   - Work orders created
   - Manufacturing progress tracked
   - QC inspects and approves
   - Packaging complete

5. **Delivery & Closure** (10 min)
   - Logistics schedules delivery
   - Installation completed
   - Finance issues final invoice
   - Project marked Closed
   - View audit trail

6. **RBAC Demo** (5 min)
   - Try unauthorized access → 403 error
   - Try edit as read-only user → Disabled
   - Admin override

---

## Technology Stack

- **Frontend:** Next.js 16+, TypeScript, Ant Design, Tailwind CSS
- **Backend:** Node.js + Express, PostgreSQL 18, Prisma ORM
- **Auth:** JWT + Google OAuth
- **Data:** JSON-based ModuleRecords (flexible)

---

## MVP Status: READY ✅

✅ 17-module workflow fully functional
✅ 12 user roles with granular permissions
✅ Complete RBAC enforcement (API + UI)
✅ Dynamic form rendering
✅ File attachment system
✅ Audit trail tracking
✅ Auto-generated IDs
✅ Form validation
✅ Responsive UI

**Ready for MVP demo and production deployment**

---

**Generated:** March 3, 2026 | **Version:** 1.0 - Complete System Documentation
