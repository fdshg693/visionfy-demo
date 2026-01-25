export class NodeProcessingService {
    async execute(functionName: string, params: any, inputData?: any) {
        console.log(`[MockService] Executing function: ${functionName}`);
        console.log(`[MockService] Params:`, params);
        console.log(`[MockService] Input Data:`, inputData);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock logic based on function name
        let result = "default_mock_result";

        if (functionName === "cv2.cvtColor") {
            result = "image_data_grayscale_mock";
        } else if (functionName === "cv2.GaussianBlur") {
            result = "image_data_blurred_mock";
        } else if (functionName === "cv2.createCLAHE") {
            result = "image_data_clahe_mock";
        }

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
