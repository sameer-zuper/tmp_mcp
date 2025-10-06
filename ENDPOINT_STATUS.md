# Zuper API Endpoint Status

## Tested: October 3, 2025
**Environment**: Staging (`https://eks-staging.zuperpro.com`)
**API Key**: `59ed3a6f230c1803317a4974597edc33`

## ✅ Working Endpoints (6 total)

| Endpoint | Method | Items | MCP Tool | Status |
|----------|--------|-------|----------|--------|
| `/api/user/all` | GET | 10 | `listUsers` | ✅ Working |
| `/api/user/{uid}` | GET | - | `getUser` | ✅ Working |
| `/api/team` | GET | 118 | `listTeams` | ✅ **Fixed** (was `/api/teams`) |
| `/api/jobs` | GET | 10 | `listJobs` | ✅ Working |
| `/api/customers` | GET | 10 | `listCustomers` | ✅ Working |
| `/api/assets` | GET | 10 | `listAssets` | ✅ Working |

### Key Finding
- Team endpoint is **singular** `/api/team` not `/api/teams` ⚠️

## ❌ Not Available Endpoints (404)

| Expected Endpoint | MCP Tool | Alternative? |
|-------------------|----------|--------------|
| `/api/properties` | `listProperties`, `createProperty` | May need different path |
| `/api/invoices` | `listInvoices`, `createInvoice` | May need different path |
| `/api/parts` | `listParts`, `createPart` | May need different path |
| `/api/service-contracts` | `listServiceContracts` | May need different path |
| `/api/quotes` | `listQuotes`, `createQuote` | May need different path |
| `/api/timeoff` | `listTimeOffRequests` | May need different path |

## ⚠️ Error Responses

| Endpoint | Status | Error | Note |
|----------|--------|-------|------|
| `/api/timesheets` | 400 | Bad Request | Requires parameters |

## 📋 Working Tools for Dispatcher Agent

Based on available endpoints, the Dispatcher Agent **CAN** use:

### ✅ Fully Functional
1. **`listUsers`** - Get all technicians ✅
2. **`getUser`** - Get technician details ✅
3. **`listJobs`** - Get all jobs ✅
4. **`getJob`** - Get job details ✅
5. **`listTeams`** - Get teams (118 available!) ✅
6. **`getTeam`** - Get team details ✅
7. **`listCustomers`** - Get customer info ✅
8. **`getCustomer`** - Get specific customer ✅
9. **`listAssets`** - Get asset list ✅
10. **`getAsset`** - Get asset details ✅

### ❌ Not Available (Need Alternative)
- `getUserSkills` - Skills endpoint not tested
- `listTimeOffRequests` - 404 not found
- `checkTimeOffAvailability` - 404 not found
- `listTimesheets` - 400 bad request (needs params)
- `createProperty` - Properties endpoint 404
- `createInvoice` - Invoices endpoint 404
- `createPart` - Parts endpoint 404

## 🎯 Dispatcher Workflow - What Works

### ✅ Currently Functional

```typescript
// 1. Get job details
const job = await mcp.tools.getJob({ apiKey, baseUrl, jobUid });

// 2. Find all technicians
const users = await mcp.tools.listUsers({ apiKey, baseUrl });

// 3. Get user details
for (const user of users.data) {
  const details = await mcp.tools.getUser({ apiKey, baseUrl, userUid: user.user_uid });
}

// 4. Analyze workload (count jobs per user)
const jobs = await mcp.tools.listJobs({ apiKey, baseUrl });
// Count jobs per assigned user

// 5. Check teams
const teams = await mcp.tools.listTeams({ apiKey, baseUrl });
// 118 teams available!

// 6. Make assignment decision
// - Score based on workload
// - Consider team membership
// - Select best candidate
```

### ❌ Not Currently Functional

```typescript
// Skills matching - endpoint not available
const skills = await mcp.tools.getUserSkills({ userUid }); // ❌

// Time-off checking - endpoint not available
const available = await mcp.tools.checkTimeOffAvailability({ ... }); // ❌

// Timesheet checking - needs params
const timesheets = await mcp.tools.listTimesheets({ ... }); // ⚠️
```

## 🔧 Recommended Actions

### For Missing Endpoints

1. **Properties** - Check with Zuper docs for correct path
   - Try: `/api/property`, `/api/v2/properties`, `/api/locations`

2. **Invoices** - Check with Zuper docs
   - Try: `/api/invoice`, `/api/v2/invoices`, `/api/billing`

3. **Parts** - Check with Zuper docs
   - Try: `/api/inventory`, `/api/v2/parts`

4. **Service Contracts** - Check with Zuper docs
   - Try: `/api/contracts`, `/api/v2/service-contracts`

5. **Quotes** - Check with Zuper docs
   - Try: `/api/quote`, `/api/estimates`, `/api/v2/quotes`

6. **Time-off** - Check with Zuper docs
   - Try: `/api/leave`, `/api/time-off-requests`, `/api/v2/timeoff`

7. **Timesheets** - Requires date parameters
   - Try: `/api/timesheets?startDate=XXX&endDate=XXX`

### For Zuper Team

Please provide documentation for:
- Correct endpoint paths for missing resources
- Required parameters for timesheets endpoint
- Skills endpoint availability and path
- Time-off/leave management endpoints

## 📊 Success Rate

- **Total Endpoints Tested**: 20
- **Working**: 6 (30%)
- **Not Found (404)**: 13 (65%)
- **Error (400)**: 1 (5%)

## 💡 Current Capabilities

Despite some missing endpoints, the dispatcher can still:

✅ **Find and assign jobs** based on:
- User availability (by workload count)
- Team membership
- Customer history
- Asset requirements

❌ **Cannot yet** consider:
- User skills matching
- Time-off/leave status
- Timesheet hours/capacity
- Create invoices automatically

## 🚀 Next Steps

1. **Contact Zuper Support** to get correct endpoint paths
2. **Update `server.ts`** with correct endpoints once confirmed
3. **Test in Production** to verify if more endpoints are available
4. **Use working tools** to build basic dispatcher logic
5. **Add advanced features** once all endpoints are available

## 📝 Notes

- Team endpoint fix already applied: `/api/teams` → `/api/team` ✅
- 118 teams found in staging (significant data set!)
- All working endpoints have good test data
- Authentication working perfectly with `x-api-key` header
