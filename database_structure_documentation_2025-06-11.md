# Sales Dashboard Database Structure Documentation

**Generated**: 2025-06-11T01:50:27.608Z  
**Database**: DM_CRM Sales Dashboard  
**Purpose**: Current data structure backup before clearing test data  

## 📊 Database Summary

**Total Records**: NaN across 8 tables

| Table | Records | Description |
|-------|---------|-------------|
| customers | 7 | Customer companies and organizations |
| contacts | 12 | Individual contacts within customer organizations |
| teams | 17 | Customer team structures with finance codes |
| services | 11 | Service offerings and monthly hour allocations |
| processes | 51 | Development processes and SDLC workflows |
| documents | 29 | File attachments and document storage |
| timelineevents | 0 | Timeline events and process milestones |
| communications | undefined | Communication logs and interaction history |

## 📋 Detailed Table Analysis

### Customers Table

**Records**: 7

**Schema Structure**:
```json
{
  "id": "c-1747405124432",
  "name": "Beta Pharma",
  "logo": null,
  "avatarColor": "#4f46e5",
  "phase": "Steady State",
  "contractStartDate": "2024-05-01",
  "contractEndDate": "2027-05-01",
  "active": true,
  "inactivatedAt": null,
  "createdAt": "2025-05-16T14:18:44.432",
  "updatedAt": "2025-05-29T17:03:45.463",
  "teams": [
    {
      "id": "team-1747405133614",
      "name": "Field Sales",
      "financeCode": "8901"
    },
    {
      "id": "team-1747406745192-0",
      "name": "Engagement Center",
      "financeCode": "8902"
    },
    {
      "id": "team-1747406764552-1",
      "name": "Hospital Sales",
      "financeCode": "8904"
    },
    {
      "id": "team-1749045923184-584",
      "name": "Test Team Fixed",
      "financeCode": "TEST-2025-002"
    },
    {
      "id": "team-1749045968944-769",
      "name": "Final Test Team",
      "financeCode": "FINAL-2025-001"
    },
    {
      "id": "team-1749049446905-166",
      "name": "Node Test Team",
      "financeCode": "NODE-2025-001"
    },
    {
      "id": "team-1749049503478-167",
      "name": "UI Test Team",
      "financeCode": "UI-TEST-2025"
    }
  ],
  "contacts": [
    {
      "id": "739a2f8e-ec59-47bc-a205-6e35dbbce7d8",
      "name": "John Doe",
      "role": null,
      "type": "Client",
      "email": "john.doe@example.com",
      "phone": null,
      "title": null,
      "created_at": "2025-05-28T17:48:50.124",
      "updated_at": "2025-05-28T17:48:50.124",
      "customer_id": "c-1747405124432"
    },
    {
      "id": "71f90035-e296-4021-a3ea-451614f4f08a",
      "name": "Jane Smith",
      "role": "Project Lead",
      "type": "Internal",
      "email": "jane.smith@example.com",
      "phone": "+1-555-0123",
      "title": "Project Manager",
      "created_at": "2025-05-28T17:48:50.272",
      "updated_at": "2025-05-28T17:48:50.272",
      "customer_id": "c-1747405124432"
    },
    {
      "id": "4c0e68a2-fc0f-4885-b0c8-24456482c390",
      "name": "Bob Doe",
      "role": "Editor",
      "type": "Client",
      "email": "Bdoe@betapharma.com",
      "phone": "973-908-2002",
      "title": "Sr Editor",
      "created_at": "2025-05-29T17:33:11.392",
      "updated_at": "2025-05-29T17:33:11.392",
      "customer_id": "c-1747405124432"
    }
  ],
  "documents": [
    {
      "id": "6dc1d0cf-55aa-4a1d-8bed-f4d9975b3de2",
      "url": "http://localhost:5000/uploads/test-process-doc.pdf",
      "name": "Test Process Document",
      "size": 1024,
      "type": "application/pdf",
      "category": "Technical",
      "created_at": "2025-05-30T01:26:19.056",
      "updated_at": "2025-05-30T01:26:19.056",
      "customer_id": "c-1747405124432",
      "description": "This is a test document created for the process",
      "upload_date": "2025-05-30"
    },
    {
      "id": "37454b64-4f24-486d-ab8d-f1cd0ff47e57",
      "url": "http://localhost:5000/uploads/llms-full.txt",
      "name": "llms-full",
      "size": 247200,
      "type": "text/plain",
      "category": "Technical",
      "created_at": "2025-05-30T02:05:52.882",
      "updated_at": "2025-05-30T02:05:52.882",
      "customer_id": "c-1747405124432",
      "description": "test",
      "upload_date": "2025-05-30"
    },
    {
      "id": "27b8a823-5f45-43bd-9a70-8d3f3d3a82ce",
      "url": "http://localhost:5000/uploads/Iqvia.txt",
      "name": "Iqvia",
      "size": 864,
      "type": "text/plain",
      "category": "Technical",
      "created_at": "2025-05-30T02:08:40.753",
      "updated_at": "2025-05-30T02:08:40.753",
      "customer_id": "c-1747405124432",
      "description": "",
      "upload_date": "2025-05-30"
    },
    {
      "id": "ef6e9687-1339-40b4-812b-05c61620b41a",
      "url": "http://localhost:5000/uploads/theaiprocess2Banner.png",
      "name": "theaiprocess2Banner",
      "size": 1380613,
      "type": "image/png",
      "category": "Proposal",
      "created_at": "2025-05-30T02:19:53.982",
      "updated_at": "2025-05-30T02:19:53.982",
      "customer_id": "c-1747405124432",
      "description": "testfile",
      "upload_date": "2025-05-30"
    },
    {
      "id": "d44c52cb-f6a0-4dac-b6c2-5876e63810c4",
      "url": "http://localhost:5000/uploads/test.pdf",
      "name": "Test Document",
      "size": 1024,
      "type": "application/pdf",
      "category": "Contract",
      "created_at": "2025-05-29T21:26:18.991",
      "updated_at": "2025-05-29T21:26:18.991",
      "customer_id": "c-1747405124432",
      "description": "Testing upload functionality",
      "upload_date": "2025-05-29"
    },
    {
      "id": "fda437ed-1dbd-457d-af5a-eebae3939bf4",
      "url": "http://localhost:5000/uploads/test2.pdf",
      "name": "Second Test Document",
      "size": 2048,
      "type": "application/pdf",
      "category": "Proposal",
      "created_at": "2025-05-29T21:27:42.818",
      "updated_at": "2025-05-29T21:27:42.818",
      "customer_id": "c-1747405124432",
      "description": "Testing multiple document uploads",
      "upload_date": "2025-05-29"
    },
    {
      "id": "ea8c399b-35c7-4273-a388-6e6fa2f226c9",
      "url": "http://localhost:5000/uploads/test.pdf",
      "name": "Test Document via PowerShell",
      "size": 1024,
      "type": "application/pdf",
      "category": "Contract",
      "created_at": "2025-05-29T21:35:40.72",
      "updated_at": "2025-05-29T21:35:40.72",
      "customer_id": "c-1747405124432",
      "description": "Testing upload functionality",
      "upload_date": "2025-05-29"
    },
    {
      "id": "11af6973-93db-4adf-8ce2-7d675dc12ea9",
      "url": "http://localhost:5000/uploads/test.pdf",
      "name": "Test Document via PowerShell",
      "size": 1024,
      "type": "application/pdf",
      "category": "Contract",
      "created_at": "2025-05-29T21:35:45.711",
      "updated_at": "2025-05-29T21:35:45.711",
      "customer_id": "c-1747405124432",
      "description": "Testing upload functionality",
      "upload_date": "2025-05-29"
    },
    {
      "id": "61e4ad5e-1748-4c10-8f59-993c446c4857",
      "url": "http://localhost:5000/uploads/web-test.pdf",
      "name": "Web Interface Test Upload",
      "size": 1024000,
      "type": "application/pdf",
      "category": "Contract",
      "created_at": "2025-05-29T21:37:24.451",
      "updated_at": "2025-05-29T21:37:24.451",
      "customer_id": "c-1747405124432",
      "description": "Final verification test",
      "upload_date": "2025-05-29"
    },
    {
      "id": "99cfef3f-3a0b-41a4-9954-3ab2f62b8f4f",
      "url": "http://localhost:5000/uploads/final-test.pdf",
      "name": "Final Test Document.pdf",
      "size": 1024000,
      "type": "application/pdf",
      "category": "Contract",
      "created_at": "2025-05-29T21:38:55.621",
      "updated_at": "2025-05-29T21:38:55.621",
      "customer_id": "c-1747405124432",
      "description": "Testing upload functionality after fixes",
      "upload_date": "2025-05-29"
    },
    {
      "id": "9d91343e-2ce6-43f6-9b0f-629f8125118d",
      "url": "http://localhost:5000/uploads/Iqvia.txt",
      "name": "Iqvia",
      "size": 864,
      "type": "text/plain",
      "category": "Invoice",
      "created_at": "2025-05-29T21:40:15.123",
      "updated_at": "2025-05-29T21:40:15.123",
      "customer_id": "c-1747405124432",
      "description": "",
      "upload_date": "2025-05-29"
    },
    {
      "id": "afc2792a-e383-4bc1-b079-213583f1be69",
      "url": "http://localhost:5000/uploads/theaiprocess.png",
      "name": "theaiprocess",
      "size": 157830,
      "type": "image/png",
      "category": "Design",
      "created_at": "2025-05-29T21:41:04.804",
      "updated_at": "2025-05-29T21:41:04.804",
      "customer_id": "c-1747405124432",
      "description": "logo test",
      "upload_date": "2025-05-29"
    },
    {
      "id": "1014f4f9-e210-434d-83b9-623bebbaf0b0",
      "url": "http://localhost:5000/uploads/test-process-doc.pdf",
      "name": "Test Process Document",
      "size": 1024,
      "type": "application/pdf",
      "category": "Technical",
      "created_at": "2025-05-30T01:11:20.506",
      "updated_at": "2025-05-30T01:11:20.506",
      "customer_id": "c-1747405124432",
      "description": "This is a test document created for the process",
      "upload_date": "2025-05-30"
    },
    {
      "id": "7f37fb41-3655-4dbc-b2ff-8967ac1f8379",
      "url": "http://localhost:5000/uploads/test-process-doc.pdf",
      "name": "Test Process Document",
      "size": 1024,
      "type": "application/pdf",
      "category": "Technical",
      "created_at": "2025-05-30T01:11:49.164",
      "updated_at": "2025-05-30T01:11:49.164",
      "customer_id": "c-1747405124432",
      "description": "This is a test document created for the process",
      "upload_date": "2025-05-30"
    },
    {
      "id": "e4d9ffd8-64a9-420a-a5bd-ee12911cec39",
      "url": "http://localhost:5000/uploads/test-process-doc.pdf",
      "name": "Test Process Document",
      "size": 1024,
      "type": "application/pdf",
      "category": "Technical",
      "created_at": "2025-05-30T01:12:56.039",
      "updated_at": "2025-05-30T01:12:56.039",
      "customer_id": "c-1747405124432",
      "description": "This is a test document created for the process",
      "upload_date": "2025-05-30"
    },
    {
      "id": "82bfce83-23d4-40a8-8592-2c57e0e0f8b7",
      "url": "http://localhost:5000/uploads/test-process-doc.pdf",
      "name": "Test Process Document",
      "size": 1024,
      "type": "application/pdf",
      "category": "Technical",
      "created_at": "2025-05-30T01:13:17.449",
      "updated_at": "2025-05-30T01:13:17.449",
      "customer_id": "c-1747405124432",
      "description": "This is a test document created for the process",
      "upload_date": "2025-05-30"
    },
    {
      "id": "97080aa3-694c-46cc-b125-1b7a2ad674cb",
      "url": "http://localhost:5000/uploads/test-process-doc.pdf",
      "name": "Test Process Document",
      "size": 1024,
      "type": "application/pdf",
      "category": "Technical",
      "created_at": "2025-05-30T01:13:53.767",
      "updated_at": "2025-05-30T01:13:53.767",
      "customer_id": "c-1747405124432",
      "description": "This is a test document created for the process",
      "upload_date": "2025-05-30"
    },
    {
      "id": "09457911-69c4-48ea-a307-b360f500d4c5",
      "url": "http://localhost:5000/uploads/test-process-doc.pdf",
      "name": "Test Process Document",
      "size": 1024,
      "type": "application/pdf",
      "category": "Technical",
      "created_at": "2025-05-30T01:14:39.45",
      "updated_at": "2025-05-30T01:14:39.45",
      "customer_id": "c-1747405124432",
      "description": "This is a test document created for the process",
      "upload_date": "2025-05-30"
    },
    {
      "id": "355b3dd2-5fde-4838-a549-e8977dd6360c",
      "url": "http://localhost:5000/uploads/test-process-doc.pdf",
      "name": "Test Process Document",
      "size": 1024,
      "type": "application/pdf",
      "category": "Technical",
      "created_at": "2025-05-30T01:15:08.823",
      "updated_at": "2025-05-30T01:15:08.823",
      "customer_id": "c-1747405124432",
      "description": "This is a test document created for the process",
      "upload_date": "2025-05-30"
    },
    {
      "id": "2cba23d0-8c9e-4f76-b296-7ecd27a863e2",
      "url": "http://localhost:5000/uploads/test-process-doc.pdf",
      "name": "Test Process Document",
      "size": 1024,
      "type": "application/pdf",
      "category": "Technical",
      "created_at": "2025-05-30T01:21:03.634",
      "updated_at": "2025-05-30T01:21:03.634",
      "customer_id": "c-1747405124432",
      "description": "This is a test document created for the process",
      "upload_date": "2025-05-30"
    },
    {
      "id": "1c271ff7-8748-4d6e-b766-8f2bac771c99",
      "url": "http://localhost:5000/uploads/File_on_Boarding7.png",
      "name": "File_on_Boarding7",
      "size": 82947,
      "type": "image/png",
      "category": "Technical",
      "created_at": "2025-06-04T12:54:18.492",
      "updated_at": "2025-06-04T12:54:18.492",
      "customer_id": "c-1747405124432",
      "description": "",
      "upload_date": "2025-06-04"
    },
    {
      "id": "03039414-e9ca-40ff-adbe-1d17913cebdb",
      "url": "http://localhost:5000/uploads/File_on_Boarding6.png",
      "name": "File_on_Boarding6",
      "size": 93499,
      "type": "image/png",
      "category": "Design",
      "created_at": "2025-06-04T12:55:35.363",
      "updated_at": "2025-06-04T12:55:35.363",
      "customer_id": "c-1747405124432",
      "description": "test",
      "upload_date": "2025-06-04"
    },
    {
      "id": "eea4cc81-05ee-4122-8ea9-9a595aa7d18e",
      "url": "http://localhost:5000/uploads/task-5c-test.pdf",
      "name": "Task 5C Test Document.pdf",
      "size": 1024000,
      "type": "application/pdf",
      "category": "Contract",
      "created_at": "2025-06-04T13:05:04.606",
      "updated_at": "2025-06-04T13:05:04.606",
      "customer_id": "c-1747405124432",
      "description": "Testing Edit Customer Documents Tab upload functionality",
      "upload_date": "2025-06-04"
    },
    {
      "id": "fe9619f8-8276-4eb7-ba2c-136674d2f89e",
      "url": "http://localhost:5000/uploads/task-5c-test.pdf",
      "name": "Task 5C Test Document.pdf",
      "size": 1024000,
      "type": "application/pdf",
      "category": "Contract",
      "created_at": "2025-06-04T13:22:29.085",
      "updated_at": "2025-06-04T13:22:29.085",
      "customer_id": "c-1747405124432",
      "description": "Testing Edit Customer Documents Tab upload functionality",
      "upload_date": "2025-06-04"
    }
  ],
  "services": [
    {
      "id": "service-1747405133614",
      "name": "CRM",
      "monthlyHours": 10
    },
    {
      "id": "13ca0aaa-f583-4808-886b-94e60b9fbc17",
      "name": "Fleet",
      "monthlyHours": 25
    }
  ],
  "processes": [],
  "timeline": [
    {
      "id": "event-c-1747405124432-update-1748001444102",
      "date": "2025-05-23T11:57:25.119",
      "title": "Client details updated",
      "description": "Client details were updated: phase changed from \"Steady State + New Activation\" to \"Steady State\"",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-1749009567360",
      "date": "2025-06-04T03:59:27.36",
      "title": "Test Timeline Event",
      "description": "This is a test event created via API",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-1749043950355",
      "date": "2025-06-04T13:32:30.355",
      "title": "Test Customer Profile Timeline Event",
      "description": "This event should appear in the customer profile timeline tab",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-process-1747798085131",
      "date": "2025-05-21T03:28:06.898",
      "title": "Added new process: Great Plains Integration",
      "description": "Process Great Plains Integration was added with Jira ticket JIRA-0021",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-contact-1747409787727",
      "date": "2025-05-16T15:36:28.911",
      "title": "Added new contact: Smith Smithy",
      "description": "Client contact Smith Smithy (Head of Sales) was added",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-process-update-1748001570813",
      "date": "2025-05-23T11:59:32.092",
      "title": "Updated process: Great Plains Integration",
      "description": "Process Great Plains Integration was updated",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-process-update-1748001620078",
      "date": "2025-05-23T12:00:21.118",
      "title": "Updated process: Great Plains Integration",
      "description": "Process Great Plains Integration was updated",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-process-update-1747405542328",
      "date": "2025-05-16T14:25:43.33",
      "title": "Updated process: HCP 220 Extract",
      "description": "Process HCP 220 Extract was updated",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-team-1747405166902",
      "date": "2025-05-16T14:19:27.558",
      "title": "Added new team: Field Sales",
      "description": "Team Field Sales with finance code 8901 was added",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-team-1747405190311",
      "date": "2025-05-16T14:19:50.786",
      "title": "Added new team: Managed Markets",
      "description": "Team Managed Markets with finance code 8902 was added",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-team-1747405222065",
      "date": "2025-05-16T14:20:22.613",
      "title": "Added new team: Site of Care Lead",
      "description": "Team Site of Care Lead with finance code 8925 was added",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-process-update-1748001434345",
      "date": "2025-05-23T11:57:15.58",
      "title": "Updated process: Great Plains Integration",
      "description": "Process Great Plains Integration was updated",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-process-update-1748001506570",
      "date": "2025-05-23T11:58:27.802",
      "title": "Updated process: Beta Pharma Custom Sales Data",
      "description": "Process Beta Pharma Custom Sales Data was updated",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-process-update-1747410073036",
      "date": "2025-05-16T15:41:14.327",
      "title": "Updated process: HCP 220 Extract",
      "description": "Process HCP 220 Extract was updated",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-service-1747405235925",
      "date": "2025-05-16T14:20:36.541",
      "title": "Added new service: CRM",
      "description": "Service CRM with 10 monthly hours was added",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-service-1747405255730",
      "date": "2025-05-16T14:20:56.323",
      "title": "Added new service: Data Management",
      "description": "Service Data Management with 25 monthly hours was added",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-team-1747406780617-team-1747406745192-0",
      "date": "2025-05-16T14:46:21.649",
      "title": "Added new team: Engagement Center",
      "description": "Team Engagement Center with finance code 8902 was added",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-team-1747406780617-team-1747406764552-1",
      "date": "2025-05-16T14:46:21.649",
      "title": "Added new team: Hospital Sales",
      "description": "Team Hospital Sales with finance code 8904 was added",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-process-update-1747406829807",
      "date": "2025-05-16T14:47:10.872",
      "title": "Updated process: HCP 220 Extract",
      "description": "Process HCP 220 Extract was updated",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-service-1747405273746",
      "date": "2025-05-16T14:21:14.187",
      "title": "Added new service: Dashboard - Gold",
      "description": "Service Dashboard - Gold with 25 monthly hours was added",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-service-1747405295668",
      "date": "2025-05-16T14:21:36.154",
      "title": "Added new service: Strategic Operations",
      "description": "Service Strategic Operations with 50 monthly hours was added",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-contact-1747405372306",
      "date": "2025-05-16T14:22:52.893",
      "title": "Added new contact: Betsy Beta",
      "description": "Client contact Betsy Beta (National Business Director) was added",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-process-1747405462599",
      "date": "2025-05-16T14:24:23.633",
      "title": "Added new process: HCP 220 Extract",
      "description": "Process HCP 220 Extract was added with Jira ticket JIRA-3435",
      "icon": null
    },
    {
      "id": "event-c-1747405124432-process-update-1747409838554",
      "date": "2025-05-16T15:37:19.867",
      "title": "Updated process: HCP 220 Extract",
      "description": "Process HCP 220 Extract was updated",
      "icon": null
    }
  ],
  "projects": []
}
```

**Fields**: 18
**Field Types**:
- `id`: string
- `name`: string
- `logo`: null
- `avatarColor`: string
- `phase`: string
- `contractStartDate`: string
- `contractEndDate`: string
- `active`: boolean
- `inactivatedAt`: null
- `createdAt`: string
- `updatedAt`: string
- `teams`: object
- `contacts`: object
- `documents`: object
- `services`: object
- `processes`: object
- `timeline`: object
- `projects`: object

**Sample Data**:
1. **Beta Pharma**
   - id: c-1747405124432
   - name: Beta Pharma
   - phase: Steady State
2. **Grape Pharma **
   - id: c-1748004410419
   - name: Grape Pharma 
   - phase: New Activation
3. **Pharma 2**
   - id: c-1747789697158
   - name: Pharma 2
   - phase: New Activation

---

### Contacts Table

**Records**: 12

**Schema Structure**:
```json
{
  "id": "a55ea499-d3c7-4771-8bff-6db046706895",
  "customerId": "c-1748004410419",
  "name": "Mary May",
  "title": "Sr Manager",
  "email": "mmary@grape.com",
  "phone": "973-202-8888",
  "role": "Direction",
  "type": "Client"
}
```

**Fields**: 8
**Field Types**:
- `id`: string
- `customerId`: string
- `name`: string
- `title`: string
- `email`: string
- `phone`: string
- `role`: string
- `type`: string

**Sample Data**:
1. **Mary May**
   - id: a55ea499-d3c7-4771-8bff-6db046706895
   - name: Mary May
   - title: Sr Manager
   - email: mmary@grape.com
   - type: Client
2. **west west**
   - id: 157cbcd3-c0db-425a-8333-70060bb2632e
   - name: west west
   - title: Guy
   - email: ww@west.com
   - type: Internal
3. **Bob Doe**
   - id: 4c0e68a2-fc0f-4885-b0c8-24456482c390
   - name: Bob Doe
   - title: Sr Editor
   - email: Bdoe@betapharma.com
   - type: Client

---

### Teams Table

**Records**: 17

**Schema Structure**:
```json
{
  "id": "team-1747406745192-0",
  "name": "Engagement Center",
  "financeCode": "8902"
}
```

**Fields**: 3
**Field Types**:
- `id`: string
- `name`: string
- `financeCode`: string

**Sample Data**:
1. **Engagement Center**
   - id: team-1747406745192-0
   - name: Engagement Center
2. **Engagement Center**
   - id: team-1747790777667-0
   - name: Engagement Center
3. **Field Sales**
   - id: team-1747790777677
   - name: Field Sales

---

### Services Table

**Records**: 11

**Schema Structure**:
```json
{
  "id": "33278ec5-8310-4d05-aa40-918596103882",
  "name": "Lunch",
  "monthlyHours": 25,
  "customerId": "c-1748004410419"
}
```

**Fields**: 4
**Field Types**:
- `id`: string
- `name`: string
- `monthlyHours`: number
- `customerId`: string

**Sample Data**:
1. **Lunch**
   - id: 33278ec5-8310-4d05-aa40-918596103882
   - name: Lunch
2. **CRM REPORTING**
   - id: a53353a4-fd77-47ad-a6c3-1e2772d1f7d4
   - name: CRM REPORTING
3. **Fleet**
   - id: 13ca0aaa-f583-4808-886b-94e60b9fbc17
   - name: Fleet

---

### Processes Table

**Records**: 51

**Schema Structure**:
```json
{
  "id": "process-1749093778106",
  "name": "Test Sales Process for Timeline",
  "jiraTicket": null,
  "status": "Not Started",
  "startDate": "2025-06-05",
  "dueDate": null,
  "endDate": null,
  "sdlcStage": "Requirements",
  "estimate": null,
  "devSprint": null,
  "approvalStatus": "Not Required",
  "approvedDate": null,
  "deployedDate": null,
  "functionalArea": null,
  "responsibleContactId": null,
  "progress": 0,
  "outputDeliveryMethod": null,
  "outputDeliveryDetails": null,
  "customerId": "c-1747405124432",
  "timeline": [
    {
      "id": "event-1749093778373",
      "date": "2025-06-05",
      "stage": "Requirements",
      "description": "Process created in Requirements stage"
    }
  ]
}
```

**Fields**: 20
**Field Types**:
- `id`: string
- `name`: string
- `jiraTicket`: null
- `status`: string
- `startDate`: string
- `dueDate`: null
- `endDate`: null
- `sdlcStage`: string
- `estimate`: null
- `devSprint`: null
- `approvalStatus`: string
- `approvedDate`: null
- `deployedDate`: null
- `functionalArea`: null
- `responsibleContactId`: null
- `progress`: number
- `outputDeliveryMethod`: null
- `outputDeliveryDetails`: null
- `customerId`: string
- `timeline`: object

**Sample Data**:
1. **Test Sales Process for Timeline**
   - id: process-1749093778106
   - name: Test Sales Process for Timeline
   - status: Not Started
2. **Test Sales Process for Timeline**
   - id: process-1749093657529
   - name: Test Sales Process for Timeline
   - status: Not Started
3. **Test Timeline Event Creation**
   - id: process-1749093513649
   - name: Test Timeline Event Creation
   - status: Not Started

---

### Documents Table

**Records**: 29

**Schema Structure**:
```json
{
  "id": "59f49317-8003-4bc0-88e6-3347ce2915ac",
  "name": "server-logs",
  "description": "tech doc",
  "url": "http://localhost:5000/uploads/server-logs.txt",
  "type": "text/plain",
  "category": "Technical",
  "size": 721,
  "uploadDate": "2025-06-04",
  "customerId": "c-1747368022434"
}
```

**Fields**: 9
**Field Types**:
- `id`: string
- `name`: string
- `description`: string
- `url`: string
- `type`: string
- `category`: string
- `size`: number
- `uploadDate`: string
- `customerId`: string

**Sample Data**:
1. **server-logs**
   - id: 59f49317-8003-4bc0-88e6-3347ce2915ac
   - name: server-logs
   - type: text/plain
2. **cookies**
   - id: b0ba1828-90b6-4c75-8cf4-3b39a94336e5
   - name: cookies
   - type: text/plain
3. **Task 5C Test Document.pdf**
   - id: fe9619f8-8276-4eb7-ba2c-136674d2f89e
   - name: Task 5C Test Document.pdf
   - type: application/pdf

---

## 🔗 Table Relationships

### Customer-Centric Data Model
- **customers** (1) → **contacts** (many)
- **customers** (1) → **teams** (many)
- **customers** (1) → **services** (many)
- **customers** (1) → **processes** (many)
- **customers** (1) → **documents** (many)
- **customers** (1) → **timelineevents** (many)
- **contacts** (1) → **communications** (many)
- **processes** (1) → **timelineevents** (many)

## 📈 Data Usage Patterns

**Customer Phases**:
- Steady State: 3 customers
- New Activation: 4 customers

**Process Statuses**:
- Not Started: 30 processes
- In Progress: 19 processes
- Completed: 2 processes

## 🛠️ Restoration Instructions

### To Restore This Data Structure:

1. **Ensure Schema**: Verify Drizzle schema matches current structure
2. **Clear Tables**: Remove existing test data if needed
3. **Import Data**: Use the corresponding SQL backup file
4. **Verify Relationships**: Check foreign key constraints
5. **Test Application**: Ensure all functionality works

### Related Files:
- SQL Backup: `sales_dashboard_backup_2025-06-11.sql`
- Schema Definition: `shared/schema.ts`
- Type Definitions: `client/src/shared/types.ts`

### Data Clearing Commands:
```sql
-- Clear all data (preserves schema)
DELETE FROM communications;
DELETE FROM timeline_events;
DELETE FROM documents;
DELETE FROM processes;
DELETE FROM services;
DELETE FROM teams;
DELETE FROM contacts;
DELETE FROM customers;
```

---

**Generated by**: DM_CRM Database Backup Tool  
**Backup Date**: 2025-06-11T01:50:27.608Z  
**Purpose**: Production deployment preparation  
