export class NodeProcessingService {
    async execute(functionName: string, params: any, inputData?: any) {
        console.log(`[MockService] Executing function: ${functionName}`);
        console.log(`[MockService] Params:`, params);
        // console.log(`[MockService] Input Data:`, inputData);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock logic based on function name
        // FIXME: For now, we simply pass through the input image (base64) so the frontend doesn't crash with invalid image data.
        let result = inputData;

        // In a real mock with pre-loaded assets, we could switch on functionName:
        /*
        if (functionName === "cv2.cvtColor") {
            // result = "some_grayscale_base64_string";
        }
        */

        return {
            status: "success",
            result: result,
            logs: [
                `Executed ${functionName} successfully.`,
                `Params used: ${JSON.stringify(params)}`
            ]
        };
    }
}

export const nodeProcessingService = new NodeProcessingService();
