import { StateGraph, END, START } from "@langchain/langgraph";
import { ApprovalStateAnnotation } from "../state";
import { processApprovalDecisionNode } from "../agents/approval-routing";

const graph = new StateGraph(ApprovalStateAnnotation)
  .addNode("decision", processApprovalDecisionNode)
  .addEdge(START, "decision")
  .addEdge("decision", END);

export const approvalGraph = graph.compile();

export async function runApprovalWorkflow(
  input: typeof ApprovalStateAnnotation.State
) {
  return approvalGraph.invoke(input);
}
