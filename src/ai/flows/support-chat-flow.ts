'use server';
/**
 * @fileOverview A customer support chatbot flow for the U-Dry app.
 *
 * - askSupport - A function that takes a user's question and returns an AI-generated answer.
 * - AskSupportInput - The input type for the askSupport function.
 * - AskSupportOutput - The return type for the askSupport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { UDRY_KNOWLEDGE_BASE } from '../knowledge-base';

const AskSupportInputSchema = z.object({
  question: z.string().describe("The user's question for the support chatbot."),
  language: z.string().describe("The language the user is asking in (e.g., 'en', 'zh-HK')."),
  knowledgeBase: z.string().describe("The knowledge base for the chatbot."),
});
export type AskSupportInput = z.infer<typeof AskSupportInputSchema>;

const AskSupportOutputSchema = z.object({
  answer: z.string().describe("The AI-generated answer to the user's question."),
});
export type AskSupportOutput = z.infer<typeof AskSupportOutputSchema>;

export async function askSupport(input: { question: string, language: string }): Promise<AskSupportOutput> {
  return supportChatFlow({ ...input, knowledgeBase: UDRY_KNOWLEDGE_BASE });
}

const supportChatPrompt = ai.definePrompt({
  name: 'supportChatPrompt',
  input: {schema: AskSupportInputSchema},
  output: {schema: AskSupportOutputSchema},
  prompt: `You are a helpful and friendly customer support chatbot for 'U-Dry', a smart umbrella sharing app. Your purpose is to answer user questions about the service concisely and accurately based on the information provided in the U-DRY KNOWLEDGE BASE below.

**U-DRY KNOWLEDGE BASE:**
{{{knowledgeBase}}}
---

**Important Rules:**
1.  Before providing any solution, always start by briefly acknowledging the user's specific problem and showing empathy. For example, if a user says, 'My payment isn't showing up,' start with something like, 'I'm sorry to hear you're having trouble with your payment. I understand that can be worrying,' before you suggest a solution.
2.  For any user problem that seems like a technical glitch (e.g., 'the app is frozen', 'the timer is not updating'), your *very first suggestion* must be to ask the user to **fully close and reopen the app**.
3.  You MUST reply in the same language as the user's question. The user is asking in language code: {{{language}}}. If it is 'zh-HK', you must reply in Traditional Chinese.

Now, please answer the following user's question. If the question is unrelated to U-Dry or the knowledge base, politely state that you can only answer questions about the U-Dry service.

**User's Question:**
{{{question}}}
`,
});

const supportChatFlow = ai.defineFlow(
  {
    name: 'supportChatFlow',
    inputSchema: AskSupportInputSchema,
    outputSchema: AskSupportOutputSchema,
  },
  async input => {
    const {output} = await supportChatPrompt(input);
    return output!;
  }
);
