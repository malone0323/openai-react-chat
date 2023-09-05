import {OpenAIModel} from "../models/model";
import {ChatCompletion, ChatMessage} from "../models/ChatCompletion";
import {CHAT_PARAMETERS, OPENAI_API_KEY} from "../config";
import {CustomError} from "./CustomError";

export class ChatService {
    private static models: Promise<OpenAIModel[]> | null = null;
    static selectedModelId: string = '';

    static setSelectedModelId(modelId: string) {
        this.selectedModelId = modelId;
    }

    static getSelectedModelId(): string {
        return this.selectedModelId;
    }

    static async sendMessage(messages: ChatMessage[], modelId: string): Promise<ChatCompletion> {

        let endpoint = "https://api.openai.com/v1/chat/completions";
        let headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
        };

        // Map to a new array with the messageType removed
        const messagesWithoutMessageType =
            messages.map(({messageType, id: number, ...rest}) => rest);

        const requestBody = {
            model: modelId,
            messages: messagesWithoutMessageType,
            temperature: CHAT_PARAMETERS.temperature
        };

        const response = await fetch(endpoint, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new CustomError(err.error.message, err);
        }

        return await response.json();
    }

    static fetchModels = (): Promise<OpenAIModel[]> => {
        if (this.models !== null) {
            return Promise.resolve(this.models);
        }
        this.models = fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.error.message);
                    });
                }
                return response.json();
            })
            .catch(err => {
                throw new Error(err.message || err);
            })
            .then(data => {
                const models: OpenAIModel[] = data.data;
                let filteredModels: OpenAIModel[] = models.filter(model => model.id.startsWith("gpt-"));
                const sortedModels = [...filteredModels].sort((a, b) => a.id.localeCompare(b.id));
                return sortedModels;
            });

        return this.models;
    };


}

