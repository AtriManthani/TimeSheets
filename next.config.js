/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prisma and LangGraph need to run in Node.js runtime, not Edge
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma", "@langchain/langgraph", "@langchain/core"],
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
