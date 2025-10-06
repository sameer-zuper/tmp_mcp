# Zuper FSM MCP - Agent Examples

This document provides examples of intelligent agents that can be built on top of the Zuper FSM MCP server.

## Overview

Agents are AI-powered assistants that can autonomously perform complex multi-step tasks by orchestrating multiple MCP tools. They understand context, make decisions, and execute workflows without manual intervention.

## Dispatcher Agent

The Dispatcher Agent automates the job assignment process by analyzing requirements and matching jobs with the best available technicians.

### Location

[src/mastra/agents/dispatcher.ts](src/mastra/agents/dispatcher.ts)

### Features

- **Intelligent Matching**: Analyzes job requirements and matches with technician skills
- **Availability Checking**: Verifies technicians aren't on time-off or overloaded
- **Multi-factor Scoring**: Considers skills, availability, workload, and location
- **Batch Processing**: Can assign multiple jobs at once with optimization
- **Transparent Reasoning**: Explains why specific assignments were made

### Usage Example

```typescript
import { dispatchJob, batchDispatchJobs } from './mastra/agents/dispatcher';

// Single job dispatch
const result = await dispatchJob({
  apiKey: userApiKey,
  baseUrl: userBaseUrl,
  jobUid: 'job_12345',
  preferredDate: '2025-10-05'
});

console.log(result.text); // Explanation of assignment decision

// Batch dispatch with optimization
const batchResult = await batchDispatchJobs({
  apiKey: userApiKey,
  baseUrl: userBaseUrl,
  jobUids: ['job_001', 'job_002', 'job_003'],
  optimize: true // Groups by location, balances workload
});
```

### Decision-Making Process

1. **Job Analysis**
   - Extracts required skills, priority, location
   - Identifies critical vs. nice-to-have requirements

2. **Candidate Discovery**
   - Lists all active users
   - Checks skills for each user
   - Filters by matching capabilities

3. **Availability Verification**
   - Checks time-off requests
   - Reviews current assignments
   - Analyzes working hours and capacity

4. **Scoring & Selection**
   - Skill match: 40% weight
   - Availability: 30% weight
   - Workload balance: 20% weight
   - Location proximity: 10% weight

5. **Assignment & Communication**
   - Updates job with selected technician
   - Provides detailed reasoning
   - Suggests alternatives if needed

### MCP Tools Used

- `getJob` - Get job details
- `listUsers` - Find all technicians
- `getUserSkills` - Check skill match
- `listTimeOffRequests` - Verify availability
- `checkTimeOffAvailability` - Date-specific checks
- `listJobs` - Check current workload
- `listTimesheets` - Review working hours
- `updateJob` - Assign the job

## Other Agent Ideas

### 1. Invoice Automation Agent

**Purpose**: Automatically generate and send invoices when jobs are completed.

**Workflow**:
1. Monitor completed jobs
2. Extract parts used and time spent
3. Calculate totals with appropriate taxes
4. Generate invoice
5. Send to customer
6. Track payment status

**Tools Used**: `getJob`, `createInvoice`, `listParts`, `getCustomer`

### 2. Customer Success Agent

**Purpose**: Proactively manage customer relationships and satisfaction.

**Workflow**:
1. Analyze customer job history
2. Identify patterns (frequent issues, asset problems)
3. Recommend preventive maintenance
4. Suggest service contracts
5. Monitor satisfaction scores
6. Alert for at-risk customers

**Tools Used**: `listCustomers`, `listJobs`, `listAssets`, `listServiceContracts`, `createServiceContract`

### 3. Inventory Management Agent

**Purpose**: Monitor and manage parts inventory automatically.

**Workflow**:
1. Track part usage from completed jobs
2. Calculate reorder points
3. Alert when stock is low
4. Generate purchase orders
5. Optimize inventory levels
6. Predict future needs based on trends

**Tools Used**: `listParts`, `getPart`, `createPart`, `listJobs`

### 4. Schedule Optimization Agent

**Purpose**: Continuously optimize technician schedules for efficiency.

**Workflow**:
1. Analyze all scheduled jobs
2. Group by geographic proximity
3. Identify routing inefficiencies
4. Suggest schedule adjustments
5. Balance workload across team
6. Minimize travel time and costs

**Tools Used**: `listJobs`, `listUsers`, `updateJob`, `listTimesheets`

### 5. Contract Renewal Agent

**Purpose**: Manage service contract renewals proactively.

**Workflow**:
1. Monitor contract expiration dates
2. Analyze contract utilization
3. Calculate ROI for customer
4. Generate renewal proposals
5. Schedule follow-up calls
6. Create quotes for renewals

**Tools Used**: `listServiceContracts`, `getServiceContract`, `getCustomer`, `createQuote`

### 6. Quality Assurance Agent

**Purpose**: Monitor service quality and flag issues.

**Workflow**:
1. Review completed jobs
2. Analyze completion times vs. estimates
3. Check for repeat visits to same location
4. Monitor first-time fix rates
5. Identify training needs
6. Generate quality reports

**Tools Used**: `listJobs`, `getJob`, `listUsers`, `getUserSkills`

### 7. Emergency Response Agent

**Purpose**: Handle urgent service requests with priority routing.

**Workflow**:
1. Detect high-priority/emergency jobs
2. Find nearest available technician
3. Check immediate availability
4. Assign with emergency protocols
5. Notify all stakeholders
6. Monitor real-time progress

**Tools Used**: `createJob`, `listUsers`, `checkTimeOffAvailability`, `updateJob`

## Building Custom Agents

### Basic Structure

```typescript
import { Agent } from "@mastra/core";
import { mastra } from "../index";

export const myAgent = new Agent({
  name: "my-agent",
  instructions: `
    Your agent's instructions here.
    Define the agent's role, decision-making process, and guidelines.
  `,
  model: {
    provider: "openai",
    name: "gpt-4",
    toolChoice: "auto",
  },
  mastra,
});
```

### Best Practices

1. **Clear Instructions**: Provide detailed, step-by-step instructions
2. **Tool Selection**: List which MCP tools the agent should use
3. **Decision Criteria**: Define how the agent should make choices
4. **Error Handling**: Specify what to do when operations fail
5. **Multi-Tenancy**: Always pass apiKey and baseUrl for data isolation
6. **Transparency**: Have agents explain their reasoning
7. **Validation**: Verify preconditions before taking actions

### Example: Simple Customer Greeting Agent

```typescript
export const greetingAgent = new Agent({
  name: "customer-greeting-agent",
  instructions: `You are a friendly customer service agent.

  When a customer name is provided:
  1. Use getCustomer to fetch their details
  2. Review their job history with listJobs
  3. Craft a personalized greeting mentioning:
     - Their name
     - Number of services they've had
     - Any upcoming scheduled jobs
  4. Offer assistance with their needs

  Be warm, professional, and helpful.`,

  model: {
    provider: "openai",
    name: "gpt-4",
    toolChoice: "auto",
  },

  mastra,
});

// Usage
export async function greetCustomer(
  apiKey: string,
  baseUrl: string,
  customerUid: string
) {
  const prompt = `Please greet customer ${customerUid}.

  API Credentials:
  - apiKey: ${apiKey}
  - baseUrl: ${baseUrl}`;

  return await greetingAgent.generate(prompt);
}
```

## Testing Agents

### Unit Testing

Test individual agent functions with mock data:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { dispatchJob } from './dispatcher';

describe('Dispatcher Agent', () => {
  it('should assign job to available technician with matching skills', async () => {
    // Mock MCP tool responses
    vi.mock('./mcp/server', () => ({
      mcp: {
        tools: {
          getJob: vi.fn().mockResolvedValue({ /* job data */ }),
          listUsers: vi.fn().mockResolvedValue({ /* user data */ }),
          // ... other mocks
        }
      }
    }));

    const result = await dispatchJob({
      apiKey: 'test-key',
      baseUrl: 'https://test.zuperpro.com',
      jobUid: 'job_test_123'
    });

    expect(result).toBeDefined();
    // Add more assertions
  });
});
```

### Integration Testing

Test agents with real Zuper API (using test environment):

```typescript
const testApiKey = process.env.ZUPER_TEST_API_KEY;
const testBaseUrl = process.env.ZUPER_TEST_BASE_URL;

// Create a test job
const testJob = await mcp.tools.createJob({
  apiKey: testApiKey,
  baseUrl: testBaseUrl,
  customerUid: 'test_customer',
  jobTitle: 'Test Dispatch Job',
  priority: 'medium'
});

// Run dispatcher
const result = await dispatchJob({
  apiKey: testApiKey,
  baseUrl: testBaseUrl,
  jobUid: testJob.data.uid
});

console.log('Assignment result:', result.text);
```

## Monitoring & Logging

Track agent performance and decisions:

```typescript
import { PinoLogger } from "@mastra/loggers";

const agentLogger = new PinoLogger({
  name: "AgentMonitor",
  level: "info",
});

// Log agent decisions
agentLogger.info({
  agent: "dispatcher",
  jobUid: "job_12345",
  assignedTo: "user_67890",
  reasoning: "Best skill match with availability",
  timestamp: new Date().toISOString()
});
```

## Deployment

### Production Considerations

1. **Rate Limiting**: Implement rate limits for API calls
2. **Retries**: Add retry logic for failed operations
3. **Caching**: Cache frequently accessed data (users, skills)
4. **Monitoring**: Track agent success rates and performance
5. **Alerting**: Set up alerts for agent failures
6. **Versioning**: Version agents for safe updates
7. **Rollback**: Have rollback plans for agent updates

### Scaling

For high-volume operations:

```typescript
// Queue-based processing
import { Queue } from 'bull';

const dispatchQueue = new Queue('job-dispatch', {
  redis: { host: 'localhost', port: 6379 }
});

// Producer
await dispatchQueue.add('dispatch-job', {
  apiKey,
  baseUrl,
  jobUid: 'job_12345'
});

// Worker
dispatchQueue.process('dispatch-job', async (job) => {
  return await dispatchJob(job.data);
});
```

## Contributing

To contribute new agents:

1. Create agent file in `src/mastra/agents/`
2. Follow the naming convention: `{purpose}-agent.ts`
3. Include comprehensive documentation
4. Add unit tests
5. Update this AGENTS.md file
6. Submit pull request

## Support

For questions or issues with agents:
- Check [USAGE.md](USAGE.md) for MCP tool documentation
- Review agent instructions and prompts
- Enable debug logging to see agent decision-making
- Contact support with agent logs for troubleshooting
