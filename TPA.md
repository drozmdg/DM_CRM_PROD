Project: TPA (Third-Party Agreement) Tracking for Processes
1. Executive Summary & Goal

The goal of this project is to enhance the system's process management capabilities to track and enforce compliance with Third-Party Agreements (TPAs). When a process is created or modified that requires access to specific data, the system must capture details of the associated TPA. This ensures visibility, accountability, and proper governance for data access. This information will be captured on the process creation/modification screens and displayed on the process details view.
2. Detailed Requirements & User Stories

We will formalize the request into specific requirements and user stories.

Data Fields to be Captured:
Field Name  Data Type Required? UI Control  Notes
Is TPA Required Boolean (Yes/No)  Yes Radio Button / Toggle Switch  This will control the visibility of the fields below.
TPA Responsible Person  Foreign Key (Contact ID)  Yes, if Is TPA Required is Yes  Dropdown List Populated from the existing Contacts list.
Data Source Name  Text (String) Yes, if Is TPA Required is Yes  Text Input Field  Name of the data source the TPA governs.
TPA Start Date  Date  Yes, if Is TPA Required is Yes  Date Picker The effective start date of the agreement.
TPA End Date  Date  Yes, if Is TPA Required is Yes  Date Picker The expiration date of the agreement.

User Stories:

    Story 1: Capturing TPA on a New Process

        As a Process Administrator,

        I want to specify if a TPA is required when I create a new process,

        So that I can capture the responsible contact, data source, and agreement dates for compliance purposes.

    Story 2: Updating TPA on an Existing Process

        As a Process Administrator,

        I want to add or modify the TPA details on the "Modify Process" screen,

        So that I can keep the compliance information accurate and up-to-date.

    Story 3: Viewing TPA Details

        As a system user,

        I want to clearly see the TPA details (or lack thereof) on the "Process Details" card,

        So that I can quickly understand the data access constraints and responsible parties for a given process.

3. Design & UX/UI Mockups (Descriptive)

A. New Process & Modify Process Screens:

    A new section titled "Third-Party Agreement (TPA) Details" will be added to the form.

    The first field in this section will be "Is a TPA Required?" with Yes and No options (e.g., a toggle switch).

        By default, this will be set to No.

    Conditional Logic: The following fields will be hidden by default and will only appear if the user selects Yes.

        TPA Responsible Person: A searchable dropdown menu populated with names from the system's "Contacts" list.

        Data Source Name: A standard text input field.

        TPA Start Date: A date picker calendar control.

        TPA End Date: A date picker calendar control.

    Validation:

        If Is TPA Required is Yes, all four subsequent fields become mandatory.

        The TPA End Date cannot be a date before the TPA Start Date. An error message will be displayed if this rule is violated.

B. Process Details Card/View:

    A new section titled "Third-Party Agreement (TPA)" will be added to the details display.

    Conditional Display Logic:

        If Is TPA Required is No: The section will display a single line: "TPA Required: No".

        If Is TPA Required is Yes: The section will display the following key-value pairs:

            TPA Required: Yes

            Responsible Person: [Name of Contact]

            Data Source: [Data Source Name]

            Agreement Start Date: [Formatted Start Date, e.g., Jan 1, 2024]

            Agreement End Date: [Formatted End Date, e.g., Dec 31, 2024]

4. Technical Implementation Plan

This plan is broken down into backend, frontend, and database tasks.

Phase 1: Database & Backend

    Database Schema Update:

        Modify the Processes table (or equivalent) in the database.

        Add the following new nullable columns:

            is_tpa_required (BOOLEAN, default FALSE)

            tpa_responsible_contact_id (INTEGER/UUID, Foreign Key to Contacts table)

            tpa_data_source (VARCHAR/TEXT)

            tpa_start_date (DATE)

            tpa_end_date (DATE)

        Create a database migration script to apply these changes.

    API Endpoint Modifications:

        GET /api/contacts: Ensure this endpoint exists and efficiently returns a list of contacts (ID and Name) for the dropdown.

        POST /api/processes (Create Process):

            Update the request body (DTO) to accept the new TPA fields.

            Add server-side validation logic to enforce the mandatory fields and the start/end date rule.

            Update the service layer to save these new fields to the database.

        PUT /api/processes/{id} (Update Process):

            Update the request body (DTO) to accept the new TPA fields.

            Apply the same server-side validation.

            Update the service layer to handle updates, including cases where a TPA is added or removed (Is TPA Required is toggled).

        GET /api/processes/{id} (Get Process Details):

            Update the response object (DTO) to include the new TPA fields.

            Ensure the responsible contact's name is joined and returned, not just the ID, to simplify frontend work.

Phase 2: Frontend Development

    Create Reusable TPA Form Component:

        Develop a new component (TpaDetailsForm) that contains the UI elements for the TPA section (toggle, dropdown, text inputs, date pickers).

        This component will manage the state for conditional visibility and validation.

    Integrate into New/Modify Process Screens:

        Add the TpaDetailsForm component to both the NewProcess and ModifyProcess pages/components.

        On the NewProcess screen, the form will be blank.

        On the ModifyProcess screen, the form will be pre-populated with data fetched from the GET /api/processes/{id} endpoint.

        Wire up the API call to fetch the list of contacts for the dropdown.

    Update Process Details Component:

        Modify the ProcessDetails component to include the new TPA section.

        Implement the conditional logic to display either "TPA Required: No" or the full list of TPA details based on the is_tpa_required flag from the API response.

        Format dates for readability.

5. Testing Strategy (QA)

    Unit Tests:

        Backend: Test the validation logic in the Process service/controller.

        Frontend: Test the TpaDetailsForm component in isolation to verify conditional rendering and state changes.

    Integration Tests:

        Test the full flow: Fill out the form on the UI -> Submit -> Verify data is correctly saved in the database via an API call.

        Test the modify flow: Load a process with TPA data -> Change the data -> Save -> Verify the update.

        Test toggling Is TPA Required from Yes to No and ensure data is cleared/nulled.

    User Acceptance Testing (UAT):

        Create a test script for business stakeholders to execute.

        Scenario 1: Create a new process without a TPA. Verify it saves and displays correctly.

        Scenario 2: Create a new process with a TPA. Verify all fields are required and save correctly.

        Scenario 3: Modify an existing process to add a TPA. Verify it works.

        Scenario 4: Modify a TPA's details. Verify the changes are reflected on the details card.

        Scenario 5: Attempt to set an end date before the start date and verify the error message appears.

6. Deployment & Documentation

    Deployment:

        Deploy changes to a Staging/UAT environment for final sign-off.

        Schedule a production deployment, preferably during a low-traffic period.

        Prepare a rollback plan in case of unforeseen issues.

    Documentation:

        Update the user guide for the "New/Modify Process" screens to explain the new TPA section.

        Update any internal technical documentation (API specs, database diagrams) to reflect the changes.

7. Assumptions and Risks

    Assumption: A "Contacts" entity with an API to fetch them already exists in the system. If not, this will need to be scoped as a separate prerequisite task.

    Risk: Data Migration. Existing processes in the database will not have TPA information. A decision is needed:

        Option A (Recommended): Leave old records as-is. The fields will be null, and the UI will correctly interpret this as "TPA Required: No". The information will be added organically as processes are modified.

        Option B: A manual data-entry effort is required to backfill TPA information for existing, relevant processes. This is a business/operational task, not a technical one.

    Contacts should pull from the list of Customer contacts similar to how we populate Responsible Contact on the process . This contact is specific to the TPA. 