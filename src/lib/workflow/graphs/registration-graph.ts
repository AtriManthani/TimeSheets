import { StateGraph, END, START } from "@langchain/langgraph";
import { RegistrationStateAnnotation } from "../state";
import { registrationAgentNode, profileValidationAgentNode } from "../agents/registration";

function routeAfterValidation(state: typeof RegistrationStateAnnotation.State) {
  return state.isValid ? "done" : "invalid";
}

const graph = new StateGraph(RegistrationStateAnnotation)
  .addNode("registration", registrationAgentNode)
  .addNode("profile_validation", profileValidationAgentNode)
  .addEdge(START, "registration")
  .addEdge("registration", "profile_validation")
  .addConditionalEdges("profile_validation", routeAfterValidation, {
    done: END,
    invalid: END,
  });

export const registrationGraph = graph.compile();

export async function runRegistrationWorkflow(
  input: typeof RegistrationStateAnnotation.State
) {
  return registrationGraph.invoke(input);
}
