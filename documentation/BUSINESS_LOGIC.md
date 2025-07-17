# Business Logic Documentation

This document outlines the key business logic and calculations used within the Sales Dashboard application. This information is intended to supplement the technical documentation by explaining the "how" behind the features.

## 1. Dashboard Metrics

The main dashboard provides a high-level overview of the system's state. The metrics are calculated as follows:

### Customer Metrics

*   **Total Customers:** A count of all customers where the `active` flag is `true`.
*   **Customers by Phase:** A breakdown of active customers grouped by their current `phase` (e.g., `Contracting`, `New Activation`, `Steady State`).

### Process Metrics

*   **Total Processes:** A count of all records in the `processes` table.
*   **Processes by Status:** A count of all processes grouped by their `status` (`Not Started`, `In Progress`, `Completed`).
*   **Processes by Stage:** A count of all processes grouped by their `sdlc_stage` (`Requirements`, `Design`, etc.).
*   **Average Estimate:** The average of the `estimate` field for all processes where an estimate has been provided.

### Service Metrics

*   **Total Services:** A count of all records in the `services` table.
*   **Total Monthly Hours:** The sum of the `monthly_hours` for all services.
*   **Average Monthly Hours:** The average of `monthly_hours` across all services.
*   **Services by Customer:** A count of how many services each customer has.

### Document Metrics

*   **Total Documents:** A count of all records in the `documents` table.
*   **Total Size:** The sum of the `size` field (in bytes) for all documents.
*   **Documents by Category:** A count of all documents grouped by their `category`.
*   **Documents by Customer:** A count of how many documents are associated with each customer.

## 2. Task & Process Management

### Task Progress Calculation

The progress of a parent task is calculated based on the completion status of its sub-tasks. The logic is as follows:

*   A sub-task is considered "complete" if its `status` is `Completed`.
*   The progress of a parent task is the percentage of its sub-tasks that are complete.
*   If a task has no sub-tasks, its progress is 0% unless its own status is `Completed`, in which case it is 100%.

### Process Timeline Events

The system automatically generates timeline events for key changes to a process:

*   **Process Created:** An event is logged when a new process is created.
*   **Stage Change:** An event is logged whenever the `sdlcStage` of a process is updated.
*   **Status Change:** An event is logged whenever the `status` of a process is updated.
