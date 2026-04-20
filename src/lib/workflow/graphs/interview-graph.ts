import { StateGraph, END, START } from "@langchain/langgraph";
import { InterviewStateAnnotation } from "../state";
import { interviewAgentNode } from "../agents/interview";

const graph = new StateGraph(InterviewStateAnnotation)
  .addNode("interview", interviewAgentNode)
  .addEdge(START, "interview")
  .addEdge("interview", END);

export const interviewGraph = graph.compile();

export async function runInterviewTurn(input: typeof InterviewStateAnnotation.State) {
  return interviewGraph.invoke(input);
}
