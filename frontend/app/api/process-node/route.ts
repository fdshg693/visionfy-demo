import { backendApiService } from "@/lib/backendApiService";
import type { ProcessNodeFunctionName, ProcessNodeParams } from "@/types/node";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { functionName, params, inputData } = body as {
            functionName?: ProcessNodeFunctionName;
            params?: ProcessNodeParams;
            inputData?: string;
        };

        if (!functionName) {
            return NextResponse.json(
                { status: "error", message: "functionName is required" },
                { status: 400 }
            );
        }

        const result = await backendApiService.processNode(
            functionName,
            params ?? ({} as ProcessNodeParams),
            inputData
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error processing node:", error);
        return NextResponse.json(
            { status: "error", message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
