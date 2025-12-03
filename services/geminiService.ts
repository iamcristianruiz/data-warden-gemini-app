
import { GoogleGenAI } from "@google/genai";
import { DataSource, SchemaField } from "../types";

// --- MOCK DATA GENERATOR ---
const generateMockSolution = (source: DataSource) => {
  const newFields = source.driftDetails?.unexpectedFields.map(f => 
    `  ${f.name} ${f.type.toUpperCase()} options(description="Automatically detected new field")`
  ).join(",\n");

  return `
### Drift Analysis
The upstream payload contains new fields that are not present in the BigQuery staging table. Based on the field names, this appears to be a legitimate feature expansion rather than data corruption.

**Recommendation:**
To resolve this without breaking downstream dependencies, I recommend evolving the schema in Dataform.

\`\`\`sqlx
-- ${source.id}.sqlx
config {
  type: "incremental",
  schema: "production",
  tags: ["daily", "critical"],
  description: "Automatically patched by Data Warden"
}

SELECT
  event_timestamp,
  user_id,
  device_type,
  -- Existing schema preserved
  existing_field_1,
  existing_field_2,
${newFields ? '  -- NEWLY ADDED FIELDS (Gemini)\n' + newFields + ',' : ''}
  payload_raw
FROM
  \$\{ref("events_raw")\}
WHERE
  event_timestamp > (SELECT MAX(event_timestamp) FROM \$\{self()\})
\`\`\`
`;
};

export const analyzeDriftWithGemini = async (
  source: DataSource
): Promise<string> => {
  // If no API key is provided, return a high-fidelity mock response
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'demo') {
    await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate network latency
    return generateMockSolution(source);
  }

  // Real API Call Implementation
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      You are a Data Engineering Assistant specializing in Google Cloud.
      
      Context:
      A data source named "${source.name}" (Type: ${source.type}) is experiencing schema drift.
      
      Current Schema:
      ${JSON.stringify(source.schema)}
      
      Drift Details (Unexpected Fields):
      ${JSON.stringify(source.driftDetails)}
      
      Task:
      1. Analyze the risk of this drift.
      2. Generate a Dataform (.sqlx) code snippet that safely incorporates these new fields.
      
      Output format rules:
      - Provide a brief markdown analysis first.
      - Then provide the code block enclosed in triple backticks with 'sqlx' language identifier.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2, // Low temperature for precise code generation
      }
    });

    return response.text || "Error: No response text generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to contact Gemini API. Check console for details.");
  }
};

export const detectDriftWithGemini = async (
  currentSchema: SchemaField[],
  payload: string
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  // Mock Detection Logic
  if (!apiKey || apiKey === 'demo') {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return `**Gemini Detection Report:**
- **Status:** Drift Detected
- **Confidence:** High (98%)
- **Assessment:** The payload contains valid field naming conventions consistent with previous schema versions. This appears to be a legitimate schema evolution (Feature Flag data) rather than data corruption.
- **Recommendation:** Flag for review and auto-generate schema patch.`;
  }

  // Real Detection Logic
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Role: Data Quality AI.
      Task: Analyze if the JSON payload fits the current BigQuery Schema.
      
      Current Schema: ${JSON.stringify(currentSchema)}
      Incoming Payload: ${payload}
      
      Instructions:
      1. Identify fields in Payload that are missing from Schema.
      2. Determine if this looks like valid data evolution (new features) or garbage/error data.
      3. Provide a concise detection report formatted in Markdown with bullet points.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Analysis inconclusive.";
  } catch (error) {
    console.error("Gemini Detection Error:", error);
    return "Gemini service unavailable for real-time detection. Defaulting to DLQ alert.";
  }
};
