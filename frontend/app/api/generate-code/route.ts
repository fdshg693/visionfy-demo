import { NextRequest, NextResponse } from "next/server";
import { createLogger, withHttpContext, logEnvVar } from "@/lib/logger";

const baseLogger = createLogger('GenerateCodeAPI');

const getBackendUrl = () => {
    const url = process.env.API_BASE_URL;
    logEnvVar(baseLogger, 'API_BASE_URL', url);
    return url || "http://localhost:8080";
};

export async function POST(req: NextRequest) {
    const logger = withHttpContext(baseLogger, req, 'POST', req.url);

    try {
        const body = await req.json();
        logger.info({ nodeCount: body?.processNodes?.length }, 'Generate code request received');

        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/generate_code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Backend error" }));
            logger.error({ status: response.status, errorData }, 'Backend returned error');
            return NextResponse.json(
                { status: "error", message: errorData.error || "Backend error" },
                { status: response.status }
            );
        }

        const data = await response.json();
        logger.info('Code generation completed');
        return NextResponse.json(data);
    } catch (error) {
        logger.error(
            { error: error instanceof Error ? error.message : String(error) },
            'Error generating code'
        );
        return NextResponse.json(
            { status: "error", message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
