// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  baseURL?: string;
}

export const models: Array<Model> = [
  {
    id: 'gpt-4o-mini',
    label: 'GPT 4o mini',
    apiIdentifier: 'gpt-4o-mini',
    description: 'Small model for fast, lightweight tasks',
  },
  {
    id: 'gpt-4o',
    label: 'GPT 4o',
    apiIdentifier: 'gpt-4o',
    description: 'For complex, multi-step tasks',
  },
  {
    id: 'llama3-8b-8192',
    label: 'Llama 3',
    apiIdentifier: 'llama3-8b-8192',
    description: 'For React Native UI generation',
    baseURL: 'https://api.groq.com/openai/v1'
  },
] as const;

export const DEFAULT_MODEL_NAME: string = 'gpt-4o-mini';
