# Zuper FSM MCP Server - Complete Tools Reference

Comprehensive reference for all available MCP tools in the Zuper FSM server.

## Table of Contents

- [Job Management](#job-management)
- [Customer Management](#customer-management)
- [Invoice Management](#invoice-management)
- [Property Management](#property-management)
- [User Management](#user-management)
- [Team Management](#team-management)
- [Timesheet Tools](#timesheet-tools)
- [Time-Off Management](#time-off-management)
- [Asset Management](#asset-management)
- [Parts & Inventory](#parts--inventory)
- [Service Contract Management](#service-contract-management)
- [Quote Management](#quote-management)

---

## Job Management

### createJob
Create a new job/work order in Zuper FSM.

**Parameters:**
- `apiKey` (optional): Zuper API key
- `baseUrl` (optional): Zuper base URL
- `customerUid` (required): Customer identifier
- `jobTitle` (required): Job title
- `jobDescription` (optional): Description
- `propertyUid` (optional): Property identifier
- `scheduledStartTime` (optional): ISO 8601 datetime
- `scheduledEndTime` (optional): ISO 8601 datetime
- `priority` (optional): `low` | `medium` | `high` | `urgent`
- `assignedTo` (optional): Array of user UIDs

**Returns:** Job UID and creation confirmation

### getJob
Retrieve details of a specific job.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `jobUid` (required): Job identifier

**Returns:** Complete job details

### listJobs
List all jobs with optional filtering.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `status` (optional): `scheduled` | `in_progress` | `completed` | `cancelled` | `on_hold`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50)

**Returns:** Array of jobs with count

### updateJob
Update an existing job.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `jobUid` (required): Job identifier
- `updates` (required): Object with fields to update
  - `jobTitle` (optional)
  - `jobDescription` (optional)
  - `status` (optional)
  - `priority` (optional)
  - `scheduledStartTime` (optional)
  - `scheduledEndTime` (optional)

**Returns:** Updated job details

---

## Customer Management

### createCustomer
Create a new customer record.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `firstName` (required): Customer's first name
- `lastName` (required): Customer's last name
- `email` (optional): Email address
- `phone` (optional): Phone number
- `companyName` (optional): Company name
- `address` (optional): Address object
  - `street` (optional)
  - `city` (optional)
  - `state` (optional)
  - `zipCode` (optional)
  - `country` (optional)

**Returns:** Customer UID and creation confirmation

### getCustomer
Retrieve customer details.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `customerUid` (required): Customer identifier

**Returns:** Complete customer details

### listCustomers
List all customers with search functionality.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `page` (optional): Page number
- `limit` (optional): Results per page
- `search` (optional): Search by name, email, or phone

**Returns:** Array of customers with count

---

## Invoice Management

### createInvoice
Create a new invoice.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `jobUid` (optional): Associated job
- `customerUid` (required): Customer identifier
- `invoiceDate` (required): ISO 8601 date
- `dueDate` (optional): ISO 8601 date
- `lineItems` (required): Array of line items
  - `description` (required)
  - `quantity` (required)
  - `unitPrice` (required)
  - `taxRate` (optional)
- `notes` (optional): Additional notes

**Returns:** Invoice UID and creation confirmation

### getInvoice
Retrieve invoice details.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `invoiceUid` (required): Invoice identifier

**Returns:** Complete invoice details

### listInvoices
List all invoices with filtering.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `status` (optional): `draft` | `sent` | `paid` | `overdue` | `cancelled`
- `customerUid` (optional): Filter by customer
- `page` (optional): Page number
- `limit` (optional): Results per page

**Returns:** Array of invoices with count

---

## Property Management

### createProperty
Create a new property/location.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `customerUid` (required): Customer identifier
- `propertyName` (required): Property name
- `address` (required): Address object
  - `street` (required)
  - `city` (required)
  - `state` (required)
  - `zipCode` (required)
  - `country` (required)
- `propertyType` (optional): Type of property
- `notes` (optional): Additional notes

**Returns:** Property UID and creation confirmation

### getProperty
Retrieve property details.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `propertyUid` (required): Property identifier

**Returns:** Complete property details

---

## User Management

### getUser
Retrieve details of a specific user.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `userUid` (required): User identifier

**Returns:** Complete user details including profile, role, and contact info

**Use Case:** Dispatcher agent uses this to get technician details before assignment

### listUsers
List all users in the organization.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `page` (optional): Page number
- `limit` (optional): Results per page
- `status` (optional): `active` | `inactive`

**Returns:** Array of users with their details

**Use Case:** Essential for dispatcher to find available technicians

### getUserSkills
Get skills assigned to a specific user.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `userUid` (required): User identifier

**Returns:** Array of user's skills and proficiency levels

**Use Case:** Dispatcher matches job requirements with technician skills

**Example:**
```typescript
const skills = await mcp.tools.getUserSkills({
  apiKey,
  baseUrl,
  userUid: 'tech_12345'
});

// Response: { skills: ['HVAC', 'Electrical', 'Plumbing'], ... }
```

---

## Team Management

### getTeam
Retrieve details of a specific team.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `teamUid` (required): Team identifier

**Returns:** Team details including members and assignments

### listTeams
List all teams in the organization.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `page` (optional): Page number
- `limit` (optional): Results per page

**Returns:** Array of teams

**Use Case:** Organize dispatching by team territories or specializations

---

## Timesheet Tools

### listTimesheets
Get timesheets for users within a date range.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `userUid` (optional): Filter by specific user
- `startDate` (optional): ISO 8601 date
- `endDate` (optional): ISO 8601 date
- `page` (optional): Page number
- `limit` (optional): Results per page

**Returns:** Array of timesheet entries with hours worked

**Use Case:** Dispatcher checks working hours to verify technician availability

### getTimesheetSummary
Get timesheet summary for a user.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `userUid` (required): User identifier
- `startDate` (required): ISO 8601 date
- `endDate` (required): ISO 8601 date

**Returns:** Summary of hours worked, overtime, and capacity

**Use Case:** Calculate available capacity for new job assignments

**Example:**
```typescript
const summary = await mcp.tools.getTimesheetSummary({
  apiKey,
  baseUrl,
  userUid: 'tech_12345',
  startDate: '2025-10-01T00:00:00Z',
  endDate: '2025-10-07T23:59:59Z'
});

// Response: { totalHours: 38, availableHours: 2, overtime: 0, ... }
```

---

## Time-Off Management

### listTimeOffRequests
List time-off requests.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `userUid` (optional): Filter by user
- `status` (optional): `pending` | `approved` | `rejected`
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `page` (optional): Page number
- `limit` (optional): Results per page

**Returns:** Array of time-off requests

**Use Case:** Critical for dispatcher to avoid assigning jobs to unavailable technicians

### checkTimeOffAvailability
Check if a user is available during a date range.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `userUid` (required): User identifier
- `startDate` (required): ISO 8601 date
- `endDate` (required): ISO 8601 date

**Returns:** Availability status (boolean) and conflicting time-off details

**Use Case:** Dispatcher validates technician availability before assignment

**Example:**
```typescript
const availability = await mcp.tools.checkTimeOffAvailability({
  apiKey,
  baseUrl,
  userUid: 'tech_12345',
  startDate: '2025-10-05T08:00:00Z',
  endDate: '2025-10-05T17:00:00Z'
});

// Response: { available: true, conflicts: [] }
// or: { available: false, conflicts: [{ type: 'vacation', ... }] }
```

---

## Asset Management

### createAsset
Create a new asset for tracking equipment or resources.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `assetName` (required): Asset name
- `assetType` (optional): Type/category
- `customerUid` (optional): Owner customer
- `propertyUid` (optional): Location
- `serialNumber` (optional)
- `modelNumber` (optional)
- `manufacturer` (optional)
- `installationDate` (optional): ISO 8601 date
- `warrantyExpiry` (optional): ISO 8601 date
- `notes` (optional)

**Returns:** Asset UID and creation confirmation

### getAsset
Retrieve asset details.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `assetUid` (required): Asset identifier

**Returns:** Complete asset details and service history

### listAssets
List all assets with filtering.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `customerUid` (optional): Filter by customer
- `propertyUid` (optional): Filter by property
- `assetType` (optional): Filter by type
- `page` (optional): Page number
- `limit` (optional): Results per page

**Returns:** Array of assets

**Use Case:** Identify assets requiring maintenance for preventive scheduling

---

## Parts & Inventory

### createPart
Create a new part or service item.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `partName` (required): Part/service name
- `partType` (required): `part` | `service`
- `sku` (optional): Stock Keeping Unit
- `description` (optional)
- `unitPrice` (optional)
- `quantity` (optional): Stock quantity
- `unit` (optional): Unit of measurement
- `category` (optional)
- `vendor` (optional)

**Returns:** Part UID and creation confirmation

### getPart
Retrieve part details.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `partUid` (required): Part identifier

**Returns:** Complete part details and inventory levels

### listParts
List all parts and services.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `partType` (optional): `part` | `service`
- `category` (optional): Filter by category
- `search` (optional): Search by name, SKU, or description
- `page` (optional): Page number
- `limit` (optional): Results per page

**Returns:** Array of parts with stock levels

**Use Case:** Check inventory before assigning jobs requiring specific parts

---

## Service Contract Management

### createServiceContract
Create a new service contract.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `customerUid` (required): Customer identifier
- `contractName` (required): Contract name
- `contractType` (optional): Contract type
- `startDate` (required): ISO 8601 date
- `endDate` (required): ISO 8601 date
- `recurringSchedule` (optional): Recurrence pattern
- `value` (optional): Contract value
- `description` (optional)
- `terms` (optional): Terms and conditions

**Returns:** Contract UID and creation confirmation

### getServiceContract
Retrieve service contract details.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `contractUid` (required): Contract identifier

**Returns:** Complete contract details and associated jobs

### listServiceContracts
List all service contracts.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `customerUid` (optional): Filter by customer
- `status` (optional): `active` | `expired` | `cancelled`
- `page` (optional): Page number
- `limit` (optional): Results per page

**Returns:** Array of service contracts

**Use Case:** Identify contracts requiring renewal or scheduled maintenance

---

## Quote Management

### createQuote
Create a new quote/estimate.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `customerUid` (required): Customer identifier
- `jobUid` (optional): Associated job
- `quoteDate` (required): ISO 8601 date
- `validUntil` (optional): ISO 8601 date
- `lineItems` (required): Array of line items
  - `description` (required)
  - `quantity` (required)
  - `unitPrice` (required)
  - `taxRate` (optional)
- `notes` (optional)
- `terms` (optional)

**Returns:** Quote UID and creation confirmation

### getQuote
Retrieve quote details.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `quoteUid` (required): Quote identifier

**Returns:** Complete quote details

### listQuotes
List all quotes.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `customerUid` (optional): Filter by customer
- `status` (optional): `draft` | `sent` | `accepted` | `rejected` | `expired`
- `page` (optional): Page number
- `limit` (optional): Results per page

**Returns:** Array of quotes

---

## Tool Combinations for Common Workflows

### Intelligent Job Dispatching

```typescript
// 1. Get job details
const job = await mcp.tools.getJob({ apiKey, baseUrl, jobUid });

// 2. Find all active technicians
const users = await mcp.tools.listUsers({ apiKey, baseUrl, status: 'active' });

// 3. For each candidate, check skills
for (const user of users.data) {
  const skills = await mcp.tools.getUserSkills({ apiKey, baseUrl, userUid: user.uid });

  // 4. Check availability
  const availability = await mcp.tools.checkTimeOffAvailability({
    apiKey,
    baseUrl,
    userUid: user.uid,
    startDate: job.scheduledStartTime,
    endDate: job.scheduledEndTime
  });

  // 5. Check workload
  const assignedJobs = await mcp.tools.listJobs({
    apiKey,
    baseUrl,
    assignedTo: user.uid,
    status: 'scheduled'
  });

  // Score and select best match...
}

// 6. Assign the job
await mcp.tools.updateJob({
  apiKey,
  baseUrl,
  jobUid,
  updates: { assignedTo: [selectedUser.uid] }
});
```

### Customer Service History

```typescript
// Get customer details
const customer = await mcp.tools.getCustomer({ apiKey, baseUrl, customerUid });

// Get all jobs for customer
const jobs = await mcp.tools.listJobs({ apiKey, baseUrl, customerUid });

// Get all properties
const properties = await mcp.tools.listProperties({ apiKey, baseUrl, customerUid });

// Get all assets
const assets = await mcp.tools.listAssets({ apiKey, baseUrl, customerUid });

// Get invoices
const invoices = await mcp.tools.listInvoices({ apiKey, baseUrl, customerUid });

// Generate comprehensive customer report...
```

### Availability Dashboard

```typescript
const startDate = '2025-10-01T00:00:00Z';
const endDate = '2025-10-07T23:59:59Z';

// Get all users
const users = await mcp.tools.listUsers({ apiKey, baseUrl, status: 'active' });

// For each user, check availability
const availability = await Promise.all(
  users.data.map(async (user) => {
    // Time-off
    const timeOff = await mcp.tools.checkTimeOffAvailability({
      apiKey,
      baseUrl,
      userUid: user.uid,
      startDate,
      endDate
    });

    // Scheduled jobs
    const jobs = await mcp.tools.listJobs({
      apiKey,
      baseUrl,
      assignedTo: user.uid,
      status: 'scheduled'
    });

    // Timesheet summary
    const timesheet = await mcp.tools.getTimesheetSummary({
      apiKey,
      baseUrl,
      userUid: user.uid,
      startDate,
      endDate
    });

    return {
      user: user.name,
      available: timeOff.available,
      jobCount: jobs.count,
      hoursBooked: timesheet.totalHours,
      capacity: 40 - timesheet.totalHours
    };
  })
);

// Display availability dashboard...
```

## Error Handling

All tools may throw errors with the format:

```typescript
{
  status: "error",
  error: "Zuper API error (404): Resource not found"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

Always implement try-catch blocks:

```typescript
try {
  const result = await mcp.tools.createJob({ apiKey, baseUrl, ...params });
  console.log('Job created:', result.data.uid);
} catch (error) {
  console.error('Failed to create job:', error.message);
  // Handle error appropriately
}
```

## Rate Limiting

Be mindful of API rate limits:
- Batch operations when possible
- Cache frequently accessed data (user skills, team info)
- Use pagination to reduce response sizes
- Implement exponential backoff for retries

## Support

For questions about specific tools:
- Check [USAGE.md](USAGE.md) for usage patterns
- Review [AGENTS.md](AGENTS.md) for agent examples
- Consult [Zuper API Documentation](https://developers.zuper.co/reference)
