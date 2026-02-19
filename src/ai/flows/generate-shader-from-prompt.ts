'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating GLSL shader code
 * based on a user's description of mood, style, and complexity.
 *
 * - generateShaderFromPrompt - A function that handles the shader generation process.
 * - GenerateShaderFromPromptInput - The input type for the generateShaderFromPrompt function.
 * - GenerateShaderFromPromptOutput - The return type for the generateShaderFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateShaderFromPromptInputSchema = z.object({
  mood: z
    .string()
    .describe(
      'The desired mood for the shader (e.g., calm, energetic, mysterious).'n    ),
  style: z
    .string()
    .describe('The desired visual style (e.g., abstract, geometric, organic).'),
  complexity: z
    .string()
    .describe('The desired complexity level (e.g., simple, intricate, chaotic).'),
  visualPatterns: z
    .string()
    .optional()
    .describe(
      'Optional: Specific visual patterns or effects to include (e.g., fractal, particle system, fluid dynamics).'
    ),
});
export type GenerateShaderFromPromptInput = z.infer<
  typeof GenerateShaderFromPromptInputSchema
>;

const GenerateShaderFromPromptOutputSchema = z.object({
  shaderCode: z.string().describe('The generated GLSL shader code.'),
  description: z.string().describe('A brief description of the generated shader.'),
});
export type GenerateShaderFromPromptOutput = z.infer<
  typeof GenerateShaderFromPromptOutputSchema
>;

export async function generateShaderFromPrompt(
  input: GenerateShaderFromPromptInput
): Promise<GenerateShaderFromPromptOutput> {
  return generateShaderFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateShaderFromPrompt',
  input: {schema: GenerateShaderFromPromptInputSchema},
  output: {schema: GenerateShaderFromPromptOutputSchema},
  prompt: `You are an expert GLSL shader programmer. Your task is to generate unique and creative GLSL fragment shader code based on the user's description.

Generate GLSL fragment shader code for a visualization that fits the following criteria:

Mood: {{{mood}}}
Style: {{{style}}}
Complexity: {{{complexity}}}
{{#if visualPatterns}}
Specific Visual Patterns/Effects: {{{visualPatterns}}}
{{/if}}

The shader code should be complete and runnable. Focus on creating a visually appealing and dynamic effect.

Provide the raw GLSL fragment shader code as a string, along with a brief description of what the shader visualizes and how it achieves the desired mood/style/complexity.

Example Output:
```json
{
  "shaderCode": "// GLSL code goes here\nvoid main() {\n  gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);\n}",
  "description": "A simple magenta shader demonstrating basic output."
}
```

Remember to create a unique and complex shader based on the given parameters, and include necessary uniforms like 'iTime' for animation.
`,
});

const generateShaderFlow = ai.defineFlow(
  {
    name: 'generateShaderFromPromptFlow',
    inputSchema: GenerateShaderFromPromptInputSchema,
    outputSchema: GenerateShaderFromPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
