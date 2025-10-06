# Zuper FSM MCP Server

A comprehensive Model Context Protocol (MCP) server for Zuper Field Service Management platform, built with [Mastra](https://mastra.ai). This server provides AI-powered tools and agents for automating field service operations.

## 🚀 Features

### Complete API Coverage
- **42+ MCP Tools** covering all major Zuper FSM operations
- **Multi-tenant architecture** with secure API key-based authentication
- **Dynamic credentials** support for SaaS deployments

### Intelligent Agents
- **Dispatcher Agent**: Automatically assigns jobs to the best-matched technicians
- **Extensible architecture**: Build custom agents for any workflow

### Smart Prompts
- **13 pre-built prompts** for common FSM operations
- Context-aware assistance for job creation, scheduling, and analysis

## 📚 Documentation

- **[USAGE.md](USAGE.md)** - Getting started, authentication, and integration examples
- **[TOOLS_REFERENCE.md](TOOLS_REFERENCE.md)** - Complete reference for all 42+ tools
- **[AGENTS.md](AGENTS.md)** - Agent examples and custom agent development
- **[PROMPTS.md](prompts.md)** - Smart prompt library and usage

## 🛠️ Available Tools

### Core Operations
- **Jobs**: Create, update, list, and manage work orders
- **Customers**: Manage customer records and relationships
- **Invoices**: Generate and track invoices
- **Quotes**: Create estimates and proposals
- **Properties**: Track service locations

### Workforce Management
- **Users**: Access technician details and skills
- **Teams**: Organize by teams and territories
- **Skills**: Match jobs with qualified technicians
- **Timesheets**: Track working hours and capacity
- **Time-off**: Check availability and manage leave

### Resources
- **Assets**: Track equipment and service history
- **Parts**: Manage inventory and stock levels
- **Service Contracts**: Handle recurring maintenance agreements

## 🤖 Intelligent Agents

### Dispatcher Agent

Automates job assignment by:
1. Analyzing job requirements (skills, location, priority)
2. Finding available technicians with matching skills
3. Checking time-off and workload
4. Scoring candidates on multiple factors
5. Making optimal assignments with transparent reasoning

```typescript
import { dispatchJob } from './mastra/agents/dispatcher';

const result = await dispatchJob({
  apiKey: userApiKey,
  baseUrl: userBaseUrl,
  jobUid: 'job_12345'
});
```

**More agents**: Customer Success, Invoice Automation, Inventory Management, Schedule Optimization, and more. See [AGENTS.md](AGENTS.md).

## 🚦 Quick Start

### Prerequisites
- Node.js v20.0+
- API key from your Zuper account
- OpenAI API key (for agents)

### Installation

```bash
# Clone and navigate to project
cd MCP_Server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials
```

### Configuration

Edit `.env`:

```env
# OpenAI for agents
OPENAI_API_KEY=your_openai_key

# Zuper credentials (optional fallback for development)
ZUPER_API_KEY=your_zuper_api_key
ZUPER_BASE_URL=https://your-region.zuperpro.com
```

### Run

```bash
# Development
npm run dev

# Production
npm run build
npm run start
```

## 📖 Usage Examples

### Basic Tool Usage

```typescript
import { mcp } from './mastra/mcp/server';

// Create a job with user-specific credentials
const result = await mcp.tools.createJob({
  apiKey: userApiKey,  // Per-tenant API key
  baseUrl: userBaseUrl,
  customerUid: 'customer_123',
  jobTitle: 'HVAC Maintenance',
  priority: 'high'
});
```

### Dispatcher Workflow

```typescript
// 1. Get job details
const job = await mcp.tools.getJob({ apiKey, baseUrl, jobUid });

// 2. List available technicians
const users = await mcp.tools.listUsers({ apiKey, baseUrl, status: 'active' });

// 3. Check skills and availability
for (const user of users.data) {
  const skills = await mcp.tools.getUserSkills({ apiKey, baseUrl, userUid: user.uid });
  const available = await mcp.tools.checkTimeOffAvailability({
    apiKey,
    baseUrl,
    userUid: user.uid,
    startDate: job.scheduledStartTime,
    endDate: job.scheduledEndTime
  });

  // Score and select best match...
}

// 4. Assign the job
await mcp.tools.updateJob({
  apiKey,
  baseUrl,
  jobUid,
  updates: { assignedTo: [selectedUser.uid] }
});
```

### Using Smart Prompts

```typescript
// Use the smart-dispatch prompt for AI-powered assignment
const prompt = mcp.prompts['smart-dispatch'];
const result = await prompt.handler({ jobId: 'job_12345' });

// Use availability check prompt
const availPrompt = mcp.prompts['check-availability'];
const availability = await availPrompt.handler({
  startDate: '2025-10-01T00:00:00Z',
  endDate: '2025-10-07T23:59:59Z'
});
```

## 🏗️ Architecture

```
MCP_Server/
├── src/
│   └── mastra/
│       ├── index.ts              # Mastra configuration
│       ├── agents/
│       │   └── dispatcher.ts     # Dispatcher agent
│       └── mcp/
│           ├── server.ts         # 42+ MCP tools
│           ├── resources.ts      # Data resources
│           └── prompts.ts        # Smart prompts
├── USAGE.md                      # Usage guide
├── TOOLS_REFERENCE.md            # Complete tools reference
├── AGENTS.md                     # Agent examples
└── README.md                     # This file
```

## 🔒 Multi-Tenant Security

This MCP server is designed for **SaaS multi-tenancy**:

- ✅ Each tool accepts optional `apiKey` and `baseUrl` parameters
- ✅ Data isolation through unique API keys per tenant
- ✅ No shared credentials between tenants
- ✅ Suitable for web apps, mobile apps, and backend services

### Security Best Practices

1. **Never expose API keys in client-side code**
2. **Always proxy through your backend**
3. **Validate user permissions** before API calls
4. **Use HTTPS** for all communication
5. **Implement rate limiting** on your backend
6. **Rotate API keys regularly**

See [USAGE.md](USAGE.md) for detailed security guidelines.

## 🔧 Integration Examples

### React/Next.js Web App

```typescript
// lib/zuper-mcp.ts
import { mcp } from '@/mcp/server';

export async function createJobForUser(userSession, jobData) {
  return await mcp.tools.createJob({
    apiKey: userSession.zuperApiKey,
    baseUrl: userSession.zuperBaseUrl,
    ...jobData
  });
}

// app/jobs/page.tsx
const job = await createJobForUser(session, {
  customerUid: 'customer_123',
  jobTitle: 'Repair Service',
  priority: 'high'
});
```

### Node.js Backend

```typescript
import { mcp } from './mastra/mcp/server';
import express from 'express';

const app = express();

app.post('/api/jobs', async (req, res) => {
  const user = await getUserFromRequest(req);

  const result = await mcp.tools.createJob({
    apiKey: user.zuperApiKey,
    baseUrl: user.zuperBaseUrl,
    ...req.body
  });

  res.json(result);
});
```

### Mobile App (React Native)

```typescript
async function scheduleServiceCall(jobDetails) {
  const session = await getUserSession();

  const result = await fetch('YOUR_BACKEND/api/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: session.zuperApiKey,
      baseUrl: session.zuperBaseUrl,
      ...jobDetails
    })
  });

  return result.json();
}
```

## 📊 Use Cases

### 1. Automated Dispatching
Use the Dispatcher Agent to automatically assign jobs based on skills, availability, and workload.

### 2. Customer Portals
Build customer-facing portals where clients can view job history, request services, and track technicians.

### 3. Mobile Workforce Apps
Empower field technicians with mobile apps that access real-time job data, customer info, and asset details.

### 4. Analytics & Reporting
Create dashboards that analyze job completion rates, technician productivity, and revenue metrics.

### 5. Workflow Automation
Build custom agents for invoice generation, contract renewals, inventory management, and more.

### 6. Chatbots & Voice Assistants
Create conversational interfaces for scheduling, status updates, and customer support.

## 🧪 Testing

```bash
# Run tests
npm test

# Test with real Zuper API (requires test credentials)
ZUPER_TEST_API_KEY=xxx ZUPER_TEST_BASE_URL=xxx npm run test:integration
```

## 🛣️ Roadmap

- [ ] Additional agents (Invoice Automation, Customer Success, etc.)
- [ ] Webhook support for real-time updates
- [ ] Caching layer for performance optimization
- [ ] Batch operations for bulk data management
- [ ] Enhanced error handling with retry logic
- [ ] GraphQL interface option
- [ ] Additional Zuper API coverage (webhooks, reports, etc.)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [AGENTS.md](AGENTS.md) for guidelines on contributing new agents.

## 📄 License

ISC

## 🆘 Support

### Documentation
- [Zuper API Documentation](https://developers.zuper.co/reference)
- [Mastra Documentation](https://mastra.ai/docs)
- [MCP Specification](https://modelcontextprotocol.io)

### Getting Help
- Check the documentation files in this repository
- Review example code and use cases
- Contact Zuper support for API-specific questions
- Create an issue for bugs or feature requests

## 🙏 Acknowledgments

Built with:
- [Mastra](https://mastra.ai) - AI framework for building agents
- [Zuper FSM](https://www.zuper.co) - Field Service Management platform
- [Model Context Protocol](https://modelcontextprotocol.io) - Protocol for AI-tool integration

---

**Ready to automate your field service operations?** Start with [USAGE.md](USAGE.md)!
