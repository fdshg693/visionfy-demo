import { backendApiService } from "@/lib/backendApiService";
import type { ProcessNodeFunctionName, ProcessNodeParams } from "@/types/node";
import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";

const logger = createLogger('ProcessNodeAPI');

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { functionName, params, inputData } = body as {
            functionName?: ProcessNodeFunctionName;
            params?: ProcessNodeParams;
            inputData?: string;
        };

        logger.info({ functionName, hasParams: !!params, hasInputData: !!inputData }, 'Process node request received');
        logger.debug({ params }, 'Process node params');

        if (!functionName) {
            logger.warn('Missing functionName in request');
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

        logger.info({ functionName, status: result.status }, 'Process node completed');
        return NextResponse.json(result);
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, 'Error processing node');
        return NextResponse.json(
            { status: "error", message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
