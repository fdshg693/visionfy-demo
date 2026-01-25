import { backendApiService } from "@/services/backendApiService";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { functionName, params, inputData } = body;

        if (!functionName) {
            return NextResponse.json(
                { status: "error", message: "functionName is required" },
                { status: 400 }
            );
        }

        const result = await backendApiService.processNode(functionName, params, inputData);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error processing node:", error);
        return NextResponse.json(
            { status: "error", message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
