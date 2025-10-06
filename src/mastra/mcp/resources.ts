import type { ResourceHandler } from "@mastra/mcp";

const ZUPER_API_KEY = process.env.ZUPER_API_KEY || "";
const ZUPER_BASE_URL = process.env.ZUPER_BASE_URL || "";

async function makeZuperRequest(endpoint: string) {
  const url = `${ZUPER_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": ZUPER_API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Zuper API error: ${response.statusText}`);
  }

  return response.json();
}

export const resources: Record<string, ResourceHandler> = {
  // List all jobs resource
  "zuper://jobs": async () => {
    try {
      const data = await makeZuperRequest("/api/jobs?limit=100");

      const jobs = data.data || [];
      const content = jobs
        .map((job: any) => {
          return `Job ID: ${job.uid}
Title: ${job.jobTitle || "N/A"}
Customer: ${job.customerName || "N/A"}
Status: ${job.status || "N/A"}
Priority: ${job.priority || "N/A"}
Scheduled: ${job.scheduledStartTime || "Not scheduled"}
---`;
        })
        .join("\n");

      return {
        contents: [
          {
            uri: "zuper://jobs",
            mimeType: "text/plain",
            text: content || "No jobs found",
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri: "zuper://jobs",
            mimeType: "text/plain",
            text: `Error fetching jobs: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  },

  // List all customers resource
  "zuper://customers": async () => {
    try {
      const data = await makeZuperRequest("/api/customers?limit=100");

      const customers = data.data || [];
      const content = customers
        .map((customer: any) => {
          return `Customer ID: ${customer.uid}
Name: ${customer.firstName || ""} ${customer.lastName || ""}
Company: ${customer.companyName || "N/A"}
Email: ${customer.email || "N/A"}
Phone: ${customer.phone || "N/A"}
---`;
        })
        .join("\n");

      return {
        contents: [
          {
            uri: "zuper://customers",
            mimeType: "text/plain",
            text: content || "No customers found",
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri: "zuper://customers",
            mimeType: "text/plain",
            text: `Error fetching customers: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  },

  // List all invoices resource
  "zuper://invoices": async () => {
    try {
      const data = await makeZuperRequest("/api/invoices?limit=100");

      const invoices = data.data || [];
      const content = invoices
        .map((invoice: any) => {
          return `Invoice ID: ${invoice.uid}
Invoice Number: ${invoice.invoiceNumber || "N/A"}
Customer: ${invoice.customerName || "N/A"}
Status: ${invoice.status || "N/A"}
Amount: ${invoice.totalAmount || 0}
Date: ${invoice.invoiceDate || "N/A"}
Due Date: ${invoice.dueDate || "N/A"}
---`;
        })
        .join("\n");

      return {
        contents: [
          {
            uri: "zuper://invoices",
            mimeType: "text/plain",
            text: content || "No invoices found",
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri: "zuper://invoices",
            mimeType: "text/plain",
            text: `Error fetching invoices: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  },

  // List all properties resource
  "zuper://properties": async () => {
    try {
      const data = await makeZuperRequest("/api/properties?limit=100");

      const properties = data.data || [];
      const content = properties
        .map((property: any) => {
          return `Property ID: ${property.uid}
Name: ${property.propertyName || "N/A"}
Type: ${property.propertyType || "N/A"}
Customer: ${property.customerName || "N/A"}
Address: ${property.address?.street || ""}, ${property.address?.city || ""}, ${property.address?.state || ""}
---`;
        })
        .join("\n");

      return {
        contents: [
          {
            uri: "zuper://properties",
            mimeType: "text/plain",
            text: content || "No properties found",
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri: "zuper://properties",
            mimeType: "text/plain",
            text: `Error fetching properties: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  },

  // Dashboard overview resource
  "zuper://dashboard": async () => {
    try {
      const [jobsData, customersData, invoicesData] = await Promise.all([
        makeZuperRequest("/api/jobs?limit=10"),
        makeZuperRequest("/api/customers?limit=10"),
        makeZuperRequest("/api/invoices?limit=10"),
      ]);

      const jobStats = {
        total: jobsData.total || 0,
        recent: jobsData.data?.length || 0,
      };

      const customerStats = {
        total: customersData.total || 0,
        recent: customersData.data?.length || 0,
      };

      const invoiceStats = {
        total: invoicesData.total || 0,
        recent: invoicesData.data?.length || 0,
      };

      const content = `Zuper FSM Dashboard
=====================

Jobs:
- Total Jobs: ${jobStats.total}
- Recent Jobs: ${jobStats.recent}

Customers:
- Total Customers: ${customerStats.total}
- Recent Customers: ${customerStats.recent}

Invoices:
- Total Invoices: ${invoiceStats.total}
- Recent Invoices: ${invoiceStats.recent}

Last Updated: ${new Date().toISOString()}
`;

      return {
        contents: [
          {
            uri: "zuper://dashboard",
            mimeType: "text/plain",
            text: content,
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri: "zuper://dashboard",
            mimeType: "text/plain",
            text: `Error fetching dashboard: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  },
};
