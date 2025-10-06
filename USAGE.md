# Zuper FSM MCP Server - Usage Guide

## Overview

This MCP (Model Context Protocol) server provides an AI-powered interface to the Zuper FSM (Field Service Management) API. It supports multi-tenant architecture with secure API key-based authentication per request.

## Multi-Tenant Architecture

The server is designed for **SaaS multi-tenancy** with data isolation per company/tenant:

- Each tool accepts optional `apiKey` and `baseUrl` parameters
- API keys are passed via the `x-api-key` header for each request
- Data isolation is maintained at the API level through unique API keys per tenant
- Fallback to environment variables for development/testing

## Authentication

### Method 1: Per-Request API Key (Recommended for Production)

When calling tools from your web app or mobile app, pass the user's API key dynamically:

```javascript
// Example: Creating a job with user-specific API key
await mcp.tools.createJob({
  apiKey: "user_specific_api_key_here",
  baseUrl: "https://us.zuperpro.com",
  customerUid: "customer_123",
  jobTitle: "HVAC Maintenance",
  priority: "high"
});
```

### Method 2: Environment Variables (Development/Testing)

For development or testing with a single tenant:

```env
ZUPER_API_KEY=your_default_api_key
ZUPER_BASE_URL=https://your-region.zuperpro.com
```

## Getting Zuper API Credentials

1. Login to Zuper web app
2. Navigate to **Settings** → **Account Settings** → **API Keys**
3. Click **New API Key** and provide a name
4. Copy the generated API key
5. Determine your base URL based on your data center region

## Available Tools

### Job Management

#### `createJob`
Create a new job/work order.

**Parameters:**
- `apiKey` (optional): Zuper API key
- `baseUrl` (optional): Zuper base URL
- `customerUid` (required): Customer identifier
- `jobTitle` (required): Job title
- `jobDescription` (optional): Job description
- `propertyUid` (optional): Property identifier
- `scheduledStartTime` (optional): ISO 8601 format
- `scheduledEndTime` (optional): ISO 8601 format
- `priority` (optional): low | medium | high | urgent
- `assignedTo` (optional): Array of user UIDs

#### `getJob`
Retrieve job details by UID.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `jobUid` (required): Job identifier

#### `listJobs`
List all jobs with optional filtering.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `status` (optional): scheduled | in_progress | completed | cancelled | on_hold
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50)

#### `updateJob`
Update an existing job.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `jobUid` (required): Job identifier
- `updates` (required): Object with fields to update

### Customer Management

#### `createCustomer`
Create a new customer.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `firstName` (required): Customer's first name
- `lastName` (required): Customer's last name
- `email` (optional): Email address
- `phone` (optional): Phone number
- `companyName` (optional): Company name
- `address` (optional): Address object

#### `getCustomer`
Retrieve customer details.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `customerUid` (required): Customer identifier

#### `listCustomers`
List all customers with search.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `page` (optional): Page number
- `limit` (optional): Results per page
- `search` (optional): Search by name, email, or phone

### Invoice Management

#### `createInvoice`
Create a new invoice.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `jobUid` (optional): Associated job
- `customerUid` (required): Customer identifier
- `invoiceDate` (required): ISO 8601 format
- `dueDate` (optional): ISO 8601 format
- `lineItems` (required): Array of line items
- `notes` (optional): Additional notes

#### `getInvoice`
Retrieve invoice details.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `invoiceUid` (required): Invoice identifier

#### `listInvoices`
List all invoices with filtering.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `status` (optional): draft | sent | paid | overdue | cancelled
- `customerUid` (optional): Filter by customer
- `page` (optional): Page number
- `limit` (optional): Results per page

### Property Management

#### `createProperty`
Create a new property/location.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `customerUid` (required): Customer identifier
- `propertyName` (required): Property name
- `address` (required): Address object
- `propertyType` (optional): Property type
- `notes` (optional): Additional notes

#### `getProperty`
Retrieve property details.

**Parameters:**
- `apiKey` (optional)
- `baseUrl` (optional)
- `propertyUid` (required): Property identifier

## Available Resources

Resources provide read-only access to Zuper data:

- `zuper://jobs` - List all jobs
- `zuper://customers` - List all customers
- `zuper://invoices` - List all invoices
- `zuper://properties` - List all properties
- `zuper://dashboard` - Overview dashboard

**Note:** Resources currently use environment variables. Update needed for multi-tenant support.

## Available Prompts

Smart prompts for common FSM operations:

- `create-job` - Create jobs with AI assistance
- `generate-invoice` - Generate invoices from jobs
- `daily-summary` - Daily job summaries
- `customer-overview` - Customer insights and history
- `optimize-schedule` - Schedule optimization
- `invoice-followup` - Overdue invoice management
- `contract-review` - Service contract analysis
- `performance-metrics` - KPI dashboards

## Integration Examples

### Web Application (React/Next.js)

```typescript
import { mcp } from '@/lib/zuper-mcp';

export async function createJobForUser(userApiKey: string, userBaseUrl: string, jobData: any) {
  try {
    const result = await mcp.tools.createJob({
      apiKey: userApiKey,
      baseUrl: userBaseUrl,
      ...jobData
    });

    return result;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
}
```

### Mobile Application (React Native)

```typescript
import { getUserSession } from '@/auth';

async function scheduleServiceCall(jobDetails: any) {
  const session = await getUserSession();

  const result = await fetch('YOUR_MCP_SERVER_ENDPOINT/tools/createJob', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: session.zuperApiKey,
      baseUrl: session.zuperBaseUrl,
      ...jobDetails
    })
  });

  return result.json();
}
```

### Node.js Backend

```typescript
import { mcp } from './mastra/mcp/server';

app.post('/api/jobs', async (req, res) => {
  // Get user's Zuper credentials from your database or session
  const user = await getUserFromRequest(req);

  try {
    const result = await mcp.tools.createJob({
      apiKey: user.zuperApiKey,
      baseUrl: user.zuperBaseUrl,
      customerUid: req.body.customerUid,
      jobTitle: req.body.jobTitle,
      priority: req.body.priority
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Security Best Practices

1. **Never expose API keys in client-side code** - Always proxy through your backend
2. **Validate user permissions** - Ensure users can only access their tenant's data
3. **Use HTTPS** - All communication should be encrypted
4. **Rotate API keys regularly** - Implement key rotation policies
5. **Log access** - Maintain audit logs for compliance
6. **Rate limiting** - Implement rate limiting on your backend

## Error Handling

All tools return structured responses:

```typescript
// Success
{
  status: "success",
  data: { ... },
  message: "Operation completed successfully"
}

// Error
{
  status: "error",
  error: "Error message here"
}
```

Zuper API errors include HTTP status codes:
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Running the Server

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm run start
```

## Future Enhancements

- [ ] Update resources to support per-request API keys
- [ ] Add webhook support for real-time updates
- [ ] Implement caching layer for frequently accessed data
- [ ] Add batch operations for bulk data management
- [ ] Enhanced error handling with retry logic
- [ ] Support for additional Zuper API endpoints (teams, timesheets, etc.)
