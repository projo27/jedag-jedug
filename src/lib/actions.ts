"use server";

import { generateShaderFromPrompt } from "@/ai/flows/generate-shader-from-prompt";
import type { GenerateShaderFromPromptInput } from "@/ai/flows/generate-shader-from-prompt";

export async function generateShaderAction(
  input: GenerateShaderFromPromptInput
): Promise<{ shaderCode: string; description: string } | { error: string }> {
  try {
    // Add default uniforms to the AI prompt to ensure they are available for control panel
    const enhancedInput = {
        ...input,
        visualPatterns: (input.visualPatterns || "") + " The shader must include and use the following uniforms: uniform vec3 u_color1; uniform vec3 u_color2; uniform float u_speed; uniform float u_intensity; uniform sampler2D iAudio; The iAudio texture contains frequency data. Use it to make the visuals react to sound."
    }
    const result = await generateShaderFromPrompt(enhancedInput);
    
    // Basic validation to ensure the generated code is not empty
    if (!result.shaderCode || result.shaderCode.trim() === "") {
        return { error: "AI returned an empty shader. Please try again with a different prompt." };
    }
    
    return result;
  } catch (error) {
    console.error("Error generating shader:", error);
    // Provide a more user-friendly error message
    return { error: "Failed to communicate with the AI service. Please check your connection and try again." };
  }
}
