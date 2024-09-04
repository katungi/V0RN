import {
    CopilotRuntime,
    OpenAIAdapter,
    GroqAdapter,
    copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { Groq } from "groq-sdk";
import { NextRequest } from "next/server";

const groq = new Groq({ apiKey: process.env["GROQ_API_KEY"] });
const serviceAdapter = new GroqAdapter({ groq, model: "llama3-groq-70b-8192-tool-use-preview" });

const runtime = new CopilotRuntime();

export const POST = async (req: NextRequest) => {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
        runtime,
        serviceAdapter,
        endpoint: "/api/copilotkit",
    });

    return handleRequest(req);
};