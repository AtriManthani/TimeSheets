/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prisma and LangGraph need to run in Node.js runtime, not Edge
  serverExternalPackages: ["@prisma/client", "prisma", "@langchain/langgraph", "@langchain/core"],
  experimental: {
    // Suppress false positive "missing suspense boundary" warnings for params
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
