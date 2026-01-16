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

const AskSupportInputSchema = z.object({
  question: z.string().describe("The user's question for the support chatbot."),
  language: z.string().describe("The language the user is asking in (e.g., 'en', 'zh-HK')."),
});
export type AskSupportInput = z.infer<typeof AskSupportInputSchema>;

const AskSupportOutputSchema = z.object({
  answer: z.string().describe("The AI-generated answer to the user's question."),
});
export type AskSupportOutput = z.infer<typeof AskSupportOutputSchema>;

export async function askSupport(input: AskSupportInput): Promise<AskSupportOutput> {
  return supportChatFlow(input);
}

const supportChatPrompt = ai.definePrompt({
  name: 'supportChatPrompt',
  input: {schema: AskSupportInputSchema},
  output: {schema: AskSupportOutputSchema},
  prompt: `You are a helpful and friendly customer support chatbot for 'U-Dry', a smart umbrella sharing app. Your purpose is to answer user questions about the service concisely and accurately based on the information provided below.

**Key U-Dry Information:**
*   **Rental Cost:** The first rental for a new user is free. After that, it is HK$5 per hour.
*   **Daily Cap:** The rental charge is capped at HK$25 for every 24-hour period.
*   **Security Deposit:** A refundable security deposit of HK$100 is required to rent an umbrella. This deposit can be refunded at any time through the app, as long as the user has no active rentals and no negative balance.
*   **Lost/Overdue Umbrella:** If an umbrella is not returned within 72 hours, it is considered lost. The HK$100 security deposit will be forfeited as a penalty.
*   **How to Rent/Return:** Users must scan the QR code on a U-Dry stall using the app's camera function. For rentals, this unlocks an umbrella. For returns, this confirms the rental has ended.
*   **Contacting Support:** For issues that cannot be resolved, users can call customer service at 9737-3875 or use the WhatsApp link in the app.

**Important Rules:**
1.  For any user problem that seems like a technical glitch (e.g., 'the app is frozen', 'the timer is not updating'), your *very first suggestion* must be to ask the user to **fully close and reopen the app**.
2.  You MUST reply in the same language as the user's question. The user is asking in language code: {{{language}}}. If it is 'zh-HK', you must reply in Traditional Chinese (Cantonese).

Now, please answer the following user's question. If the question is unrelated to U-Dry, politely state that you can only answer questions about the U-Dry service.

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
