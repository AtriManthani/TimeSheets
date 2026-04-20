import { StateGraph, END, START } from "@langchain/langgraph";
import { SubmissionStateAnnotation } from "../state";
import { submissionAgentNode } from "../agents/submission";
import { approvalRoutingAgentNode } from "../agents/approval-routing";

function routeAfterSubmission(state: typeof SubmissionStateAnnotation.State) {
  if (state.errors && state.errors.length > 0) return "failed";
  return "route";
}

const graph = new StateGraph(SubmissionStateAnnotation)
  .addNode("submission", submissionAgentNode)
  .addNode("routing", approvalRoutingAgentNode)
  .addEdge(START, "submission")
  .addConditionalEdges("submission", routeAfterSubmission, {
    route: "routing",
    failed: END,
  })
  .addEdge("routing", END);

export const submissionGraph = graph.compile();

export async function runSubmissionWorkflow(
  input: typeof SubmissionStateAnnotation.State
) {
  return submissionGraph.invoke(input);
}
