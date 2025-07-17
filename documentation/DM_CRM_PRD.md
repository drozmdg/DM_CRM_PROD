# Product Requirements Document: DM's CRM

## 1. Introduction

**Product Name:** DM's CRM (Sales Dashboard)
**Version:** 1.0
**Date:** 2025-06-29

This document outlines the product requirements for the DM's CRM, a comprehensive Customer Relationship Management system tailored for B2B consulting and service-oriented companies. The system aims to provide a unified platform for managing customer data, tracking sales processes, and overseeing service delivery.

The current version of the application is for internal demonstration purposes and does not include an authentication system.

### 1.1. Purpose

The primary purpose of the DM's CRM is to streamline and centralize all customer-related activities. It serves as a single source of truth for sales, account management, and project teams, enhancing visibility, collaboration, and efficiency across the organization.

### 1.2. Target Audience

*   **Sr. Technical Data Managers:** Manage clients, the services clients have contracted for, the technical processes required to support each client, and the contacts the Manager works with.

## 2. Goals and Objectives

### 2.1. Primary Goal

To provide a robust, user-friendly, and centralized CRM platform that supports the entire customer lifecycle, from initial contact to long-term relationship management.

### 2.2. Key Objectives

*   **Centralize Customer Data:** Consolidate all customer information into a single, easily accessible repository.
*   **Streamline Processes:** Automate and simplify workflows for sales, service delivery, and project management.
*   **Enhance Visibility:** Provide real-time insights into the sales pipeline, project status, and customer health.
*   **Improve Collaboration:** Facilitate seamless communication and information sharing between teams.
*   **Increase Efficiency:** Reduce manual data entry and administrative overhead.

## 3. User Personas & Stories

### 3.1. Bob - The Senior Technical Data Manager

*   **Goal:** To effectively manage his portfolio of clients, ensuring that all contracted services and technical processes are implemented and supported efficiently.
*   **Needs:**
    *   A centralized place to view all his clients and their information.
    *   The ability to see which services and teams each client has contracted for.
    *   A way to track the implementation and status of technical processes and associate them with the correct teams.
    *   A system to manage contacts for each client.
*   **Pain Points:**
    *   Juggling multiple spreadsheets and documents to keep track of client information.
    *   Lack of a clear, up-to-date view of process implementation status and which teams are affected.
    *   Difficulty in quickly finding contact information for a specific client.

### 3.2. User Stories

*   **As a Sr. Technical Data Manager,** I want to be able to add a new client, so that I can start managing their information in the system.
*   **As a Sr. Technical Data Manager,** I want to be able to view a list of all my clients, so that I can get a quick overview of my portfolio.
*   **As a Sr. Technical Data Manager,** for each client, I want to manage the **Teams** we are contracted to support (e.g., Hospital Team, Sales Team), so that I have a clear understanding of the client's structure.
*   **As a Sr. Technical Data Manager,** for each client, I want to manage the technical **Processes** required to support them (e.g., "Monthly Exponent Sales data"), so that I can track their implementation and status.
*   **As a Sr. Technical Data Manager,** I want to associate one or more **Processes** with one or more **Teams**, so I know which processes support which teams.
*   **As a Sr. Technical Data Manager,** I want to manage the **Contacts** I work with for each client, so that I can easily find their information when I need it.
*   **As a Sr. Technical Data Manager,** I want to see the status of each technical process (e.g., Not Started, In Progress, Completed), so that I can prioritize my work.

## 4. Data Model

This section provides a high-level overview of the core entities in the system and their relationships.

*   **Customer:** Represents a client company (e.g., Signma Pharma).
    *   `id` (Primary Key)
    *   `name`
*   **Team:** Represents a team that the client has contracted your company to manage. Each team has a finance code. (e.g., Hospital Team, Sales Team).
    *   `id` (Primary Key)
    *   `name`
    *   `finance_code`
    *   `customer_id` (Foreign Key to Customers)
*   **Product:** (Implicitly managed through other entities, like Services or Processes, as there is no dedicated `products` table in the schema).
*   **Service:** Represents a service that a customer has contracted for.
    *   `id` (Primary Key)
    *   `name`
    *   `customer_id` (Foreign Key to Customers)
*   **Process:** Represents a technical process required to support a client (e.g., Monthly Exponent Sales data, Concur 220 extract).
    *   `id` (Primary Key)
    *   `name`
    *   `customer_id` (Foreign Key to Customers)
*   **Contact:** Represents a contact person at a client company.
    *   `id` (Primary Key)
    *   `name`
    *   `customer_id` (Foreign Key to Customers)

### Relationships

*   A **Customer** can have multiple **Teams**, **Services**, **Processes**, and **Contacts**.
*   A **Process** can be associated with multiple **Teams**, and a **Team** can be associated with multiple **Processes**. This is a many-to-many relationship, managed through the `process_team` junction table.
*   A **Process** can be associated with a **Contact** (the responsible person).

## 5. Features

### 5.1. Core Dashboard

*   **Real-time Metrics:** Display key statistics for customers, processes, and services.
*   **Quick Actions:** Provide one-click access to create new customers, services, and processes.
*   **Activity Feed:** Show a chronological log of recent activities and system-wide updates.
*   **Performance Overview:** Visualize active processes and track their completion status.

### 5.2. Customer Management

*   **Comprehensive Profiles:** Create and manage detailed customer profiles including company information, status, and assigned team members.
*   **Contact Management:** Add and track key contacts associated with each customer.
*   **Service Management:** Assign and monitor services, including monthly hours allocation.
*   **Document Storage:** Upload, categorize, and manage customer-related documents.
*   **Communication History:** Log all interactions, creating a complete timeline of the customer relationship.
*   **Notes:** Add and manage timestamped notes for specific customer interactions.
*   **Important Dates:** Track key dates such as contract renewals, quarterly business reviews, and project milestones.

### 5.3. Process Management

*   **SDLC Tracking:** Monitor the stage of each process within the Software Development Lifecycle (SDLC).
*   **Progress Monitoring:** Track real-time progress and manage project milestones.
*   **Team Assignment:** Assign team members to processes and define their roles and responsibilities.
*   **Timeline Visualization:** View a visual timeline of the process, including key events and milestones.
*   **Full Edit Capabilities:** Modify all aspects of a process as it evolves.

### 5.4. Service Management

*   **Service Catalog:** Create and manage a catalog of services offered to customers.
*   **Hours Tracking:** Allocate and monitor monthly hours for each service.
*   **Customer Integration:** Seamlessly link services to customer profiles.
*   **Performance Metrics:** Track service utilization and performance.

### 5.5. Advanced Features

*   **AI Assistant:** An integrated chat interface to provide support and information to users.
*   **Document Management:** Centralized repository for all documents, with support for versioning and categorization.
*   **Search and Filtering:** Robust search functionality across all modules.
*   **Responsive Design:** A modern, mobile-friendly interface that works on any device.
*   **Data Validation:** Ensure data integrity with comprehensive form validation and error handling.

## 6. Functional Requirements

This section details the specific functionalities of the system.

| Feature ID | Feature Name | Description |
| :--- | :--- | :--- |
| CUST-01 | Create Customer | User can create a new customer with all relevant details. |
| CUST-02 | View/Edit Customer | User can view and edit existing customer information. |
| CUST-03 | Delete Customer | User can delete a customer. |
| PROC-01 | Create Process | User can create a new process and associate it with a customer. |
| PROC-02 | View/Edit Process | User can view and update the status, stage, and other details of a process. |
| PROC-03 | Delete Process | User can delete a process. |
| SERV-01 | Create Service | User can create a new service in the service catalog. |
| SERV-02 | Assign Service | User can assign a service to a customer with specific terms (e.g., monthly hours). |
| SERV-03 | Delete Service | User can delete a service. |
| DOC-01 | Upload Document | User can upload documents and associate them with a customer or process. |
| DOC-02 | View Document | User can view documents. |
| DOC-03 | Delete Document | User can delete documents. |
| NOTE-01 | Add Note | User can add a timestamped note to a customer's record. |
| NOTE-02 | Update Note | User can update a note. |
| NOTE-03 | Delete Note | User can delete a note. |
| DATE-01 | Add Important Date | User can add an important date to a customer's record. |
| DATE-02 | Update Important Date | User can update an important date. |
| DATE-03 | Delete Important Date | User can delete an important date. |
| AI-01 | Chat | User can interact with an AI assistant for help and information. |
| HEALTH-01 | Health Check | System provides a health check endpoint. |

## 7. Non-Functional Requirements

| Requirement | Description |
| :--- | :--- |
| **Security** | For production, the system must have a robust authentication and authorization mechanism. Data should be encrypted at rest and in transit. Role-based access control (RBAC) must be implemented. |
| **Performance** | The application should load in under 3 seconds. API responses should be returned in under 500ms for typical requests. |
| **Scalability** | The system should be able to support a 50% growth in users and data over a year without significant performance degradation. |
| **Usability** | The user interface must be intuitive and require minimal training for new users. |
| **Reliability** | The system should have an uptime of 99.9%. |

## 8. System Architecture

*   **Frontend:** React 18.3, TypeScript, TailwindCSS, Shadcn/UI, Vite
*   **Backend:** Node.js, Express
*   **Database:** Supabase (PostgreSQL)
*   **State Management:** TanStack Query (React Query)
*   **Routing:** Wouter
*   **Project Structure:** The project is organized into `client`, `server`, and `shared` directories to maintain a clear separation of concerns.

## 9. Future Enhancements / Roadmap

*   **Authentication & Authorization:** Implement a full-featured authentication system with user roles and permissions.
*   **Advanced Analytics:** Introduce a dedicated analytics module with customizable reports and dashboards.
*   **Third-Party Integrations:** Integrate with external services such as Google Calendar, Outlook, and Slack.
*   **Mobile Application:** Develop native mobile applications for iOS and Android.
*   **Customer Portal:** Create a portal for customers to log in, view their project status, and communicate with the team.
