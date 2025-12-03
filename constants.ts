
import { DataSource, SourceStatus } from "./types";

export const MOCK_SOURCES: DataSource[] = Array.from({ length: 35 }).map((_, i) => {
  const isDrifting = i === 2 || i === 14 || i === 27;
  const type = i % 3 === 0 ? 'PubSub' : i % 3 === 1 ? 'GCS' : 'CloudSQL';
  
  return {
    id: `src-${i + 1}`,
    name: `service_log_${i + 1}_${type.toLowerCase()}`,
    type,
    lastUpdated: new Date(Date.now() - Math.random() * 10000000).toISOString(),
    status: isDrifting ? SourceStatus.DRIFT_DETECTED : SourceStatus.HEALTHY,
    schema: [
      { name: 'event_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
      { name: 'user_data', type: 'JSON', mode: 'NULLABLE' }
    ],
    history: [],
    driftDetails: isDrifting ? {
      detectedAt: new Date(Date.now() - (Math.random() * 10000000)).toISOString(),
      unexpectedFields: [
        { name: 'device_version_major', type: 'INTEGER', mode: 'NULLABLE' },
        { name: 'marketing_consent', type: 'BOOLEAN', mode: 'NULLABLE' }
      ],
      missingFields: [],
      samplePayload: `{"event_id": "evt_123", "timestamp": "2024-05-21T10:00:00Z", "device_version_major": 14, "marketing_consent": true}`,
      detectionReport: `**Gemini Detection Report:**
- **Status:** Drift Detected
- **Confidence:** High (96%)
- **Assessment:** The payload introduces new fields 'device_version_major' and 'marketing_consent'. Contextual analysis suggests this matches the recent 'Mobile V2' deployment patterns. Data types are compatible with BigQuery evolution.
- **Recommendation:** Automatically evolve schema and patch Dataform definitions.`
    } : undefined
  };
});

export const DOCS_CONTENT = {
  INGESTION: `
    <div class="space-y-6">
      <section>
        <h3 class="text-2xl font-google-sans text-gray-800 mb-3">Ingestion Layer: Streaming & Validation</h3>
        <p class="text-gray-600 leading-relaxed mb-4">
          The ingestion layer is the first line of defense against data quality issues. We utilize 
          <a href="https://cloud.google.com/pubsub/docs/overview" target="_blank" class="text-blue-600 hover:underline font-medium">Cloud Pub/Sub</a> 
          for global async messaging and 
          <a href="https://cloud.google.com/dataflow" target="_blank" class="text-blue-600 hover:underline font-medium">Cloud Dataflow</a> 
          for exactly-once processing.
        </p>
      </section>

      <section class="bg-blue-50 p-5 rounded-lg border border-blue-100">
        <h4 class="font-bold text-blue-800 mb-2 flex items-center gap-2">
          Key Pattern: The Dead Letter Queue (DLQ)
        </h4>
        <p class="text-sm text-blue-900 mb-3">
          When Dataflow detects a schema mismatch (e.g., a payload has a field not in the BigQuery schema), it <strong>does not fail the pipeline</strong>. Instead, it routes the bad element to a separate Pub/Sub topic (the DLQ). This allows valid data to flow while capturing drift for analysis.
        </p>
      </section>

      <section>
        <h4 class="font-bold text-gray-700 mb-2">Apache Beam (Dataflow) Implementation</h4>
        <p class="text-sm text-gray-500 mb-3">Example Python snippet showing how schema validation failure routes to a side output:</p>
        <pre class="bg-[#1e1e1e] text-gray-200 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-gray-700">
class ValidateSchema(beam.DoFn):
    def process(self, element, schema):
        try:
            # Attempt to validate against known schema
            validate_json(element, schema)
            yield beam.pvalue.TaggedOutput('valid', element)
        except SchemaMismatchError as e:
            # Capture the drift and route to DLQ
            error_record = {
                'original_payload': element,
                'error': str(e),
                'timestamp': time.time()
            }
            yield beam.pvalue.TaggedOutput('drift_dlq', error_record)

# Pipeline Definition
valid_data, drift_data = (
    raw_messages 
    | 'Validate' >> beam.ParDo(ValidateSchema(), schema=current_schema)
        .with_outputs('drift_dlq', main='valid')
)
        </pre>
      </section>

      <section>
        <h4 class="font-bold text-gray-700 mb-2">References</h4>
        <ul class="list-disc pl-5 text-sm text-blue-600 space-y-1">
          <li><a href="https://cloud.google.com/pubsub/docs/schemas" target="_blank" class="hover:underline">Pub/Sub Schemas & Validation</a></li>
          <li><a href="https://cloud.google.com/blog/products/data-analytics/handling-invalid-inputs-in-dataflow" target="_blank" class="hover:underline">Handling Invalid Inputs in Dataflow</a></li>
        </ul>
      </section>
    </div>
  `,
  STORAGE: `
    <div class="space-y-6">
      <section>
        <h3 class="text-2xl font-google-sans text-gray-800 mb-3">Storage Layer: BigQuery Warehousing</h3>
        <p class="text-gray-600 leading-relaxed mb-4">
          <a href="https://cloud.google.com/bigquery" target="_blank" class="text-blue-600 hover:underline font-medium">BigQuery</a> 
          serves as the serverless, highly scalable data warehouse. We employ a "Medallion Architecture" (Bronze/Raw -> Silver/Staging -> Gold/Production).
        </p>
      </section>

      <section>
        <h4 class="font-bold text-gray-700 mb-2">Handling Schema Evolution</h4>
        <p class="text-sm text-gray-500 mb-3">
          BigQuery supports non-destructive schema updates. When Gemini approves a drift resolution, it essentially constructs and executes an <code>ALTER TABLE</code> command.
        </p>
        <pre class="bg-[#1e1e1e] text-gray-200 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-gray-700">
-- Example of what Gemini generates to patch the schema
ALTER TABLE \`data_warden_prod.events_log\`
ADD COLUMN device_version_major INT64 OPTIONS(description="Added via Auto-Resolution"),
ADD COLUMN marketing_consent BOOL;
        </pre>
      </section>

      <section class="bg-yellow-50 p-5 rounded-lg border border-yellow-100">
        <h4 class="font-bold text-yellow-800 mb-2">Strategy: The JSON Data Type</h4>
        <p class="text-sm text-yellow-900 mb-2">
          For highly volatile data sources, we utilize BigQuery's native <code>JSON</code> data type. This allows ingestion of arbitrary fields without breaking the pipeline, while still allowing SQL querying on specific paths.
        </p>
        <div class="bg-white/50 p-2 rounded text-xs font-mono text-yellow-900 mt-2 border border-yellow-200">
          SELECT user_data.prefs.theme FROM \`dataset.table\`
        </div>
      </section>

      <section>
        <h4 class="font-bold text-gray-700 mb-2">References</h4>
        <ul class="list-disc pl-5 text-sm text-blue-600 space-y-1">
          <li><a href="https://cloud.google.com/bigquery/docs/managing-table-schemas" target="_blank" class="hover:underline">Modifying Table Schemas</a></li>
          <li><a href="https://cloud.google.com/bigquery/docs/json-data" target="_blank" class="hover:underline">Working with JSON Data in GoogleSQL</a></li>
        </ul>
      </section>
    </div>
  `,
  TRANSFORMATION: `
    <div class="space-y-6">
      <section>
        <h3 class="text-2xl font-google-sans text-gray-800 mb-3">Transformation: Dataform (SQL as Code)</h3>
        <p class="text-gray-600 leading-relaxed mb-4">
          <a href="https://cloud.google.com/dataform" target="_blank" class="text-blue-600 hover:underline font-medium">Dataform</a> 
          brings software engineering best practices to data pipelines. It manages dependencies, compiles SQL, and runs assertions (tests) on your data.
        </p>
      </section>

      <section>
        <h4 class="font-bold text-gray-700 mb-2">The Resolution Workflow</h4>
        <ol class="list-decimal list-inside text-sm text-gray-600 space-y-2 mb-4">
          <li><strong>Drift Detected:</strong> New field identified in DLQ.</li>
          <li><strong>Gemini Analysis:</strong> AI suggests the field is valid.</li>
          <li><strong>Patch Generation:</strong> Gemini writes a new <code>.sqlx</code> definition.</li>
          <li><strong>CI/CD:</strong> Dataform compiles the project to ensure no downstream breakages (e.g., broken views).</li>
        </ol>
      </section>

      <section>
        <h4 class="font-bold text-gray-700 mb-2">Anatomy of a Patch (.sqlx)</h4>
        <p class="text-sm text-gray-500 mb-3">
          This is the code generated by the Gemini Resolver. Note the <code>config</code> block which defines metadata.
        </p>
        <pre class="bg-[#1e1e1e] text-gray-200 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-gray-700">
config {
  type: "incremental",
  schema: "analytics_prod",
  tags: ["daily_events"],
  bigquery: {
    partitionBy: "DATE(timestamp)"
  }
}

SELECT
  event_id,
  timestamp,
  -- Gemini inserts the new fields here safely
  SAFE_CAST(JSON_VALUE(payload, '$.device_version') AS INT64) as device_version,
  * EXCEPT(payload)
FROM
  \${ref("stg_events_raw")}
        </pre>
      </section>

       <section>
        <h4 class="font-bold text-gray-700 mb-2">References</h4>
        <ul class="list-disc pl-5 text-sm text-blue-600 space-y-1">
          <li><a href="https://cloud.google.com/dataform/docs/overview" target="_blank" class="hover:underline">Dataform Overview</a></li>
          <li><a href="https://cloud.google.com/dataform/docs/assertions" target="_blank" class="hover:underline">Data Quality Assertions</a></li>
        </ul>
      </section>
    </div>
  `,
  BATCH_BQML: `
    <div class="space-y-6">
      <section>
        <h3 class="text-2xl font-google-sans text-gray-800 mb-3">Batch Pattern: Gemini via BigQuery ML</h3>
        <p class="text-gray-600 leading-relaxed mb-4">
          For batch-oriented workflows (ELT), you can leverage 
          <a href="https://cloud.google.com/bigquery/docs/bqml-introduction" target="_blank" class="text-blue-600 hover:underline font-medium">BigQuery ML</a> 
          Remote Models to invoke Gemini directly from SQL. This allows for "Lazy Schema Evolution" where raw data is ingested as JSON and structured later.
        </p>
      </section>

      <section class="bg-purple-50 p-5 rounded-lg border border-purple-100">
        <h4 class="font-bold text-purple-800 mb-2 flex items-center gap-2">
          Architecture: The ELT Approach
        </h4>
        <ol class="list-decimal list-inside text-sm text-purple-900 space-y-2">
          <li><strong>Extract/Load:</strong> Dump raw JSON logs into a "Bronze" BigQuery table with a single <code>JSON</code> column (no schema enforcement).</li>
          <li><strong>Detect (SQL):</strong> A scheduled query samples the JSON keys using <code>JSON_KEYS()</code> and compares them to the existing "Silver" table schema.</li>
          <li><strong>Analyze (BQML):</strong> If new keys are found, pass them to <code>ML.GENERATE_TEXT</code> (Gemini) to infer data types.</li>
          <li><strong>Evolve (Stored Proc):</strong> Use Dynamic SQL to <code>ALTER TABLE</code> automatically.</li>
        </ol>
      </section>

      <section>
        <h4 class="font-bold text-gray-700 mb-2">Step 1: Create the Vertex AI Connection</h4>
        <p class="text-sm text-gray-500 mb-3">Before running models, you establish a connection between BigQuery and Vertex AI.</p>
        <pre class="bg-[#1e1e1e] text-gray-200 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-gray-700">
-- Create the Cloud Resource Connection
CREATE EXTERNAL CONNECTION \`us.vertex_conn\`
OPTIONS (
  type = 'CLOUD_RESOURCE', 
  region = 'US'
);

-- Create the Remote Model pointing to Gemini
CREATE OR REPLACE MODEL \`project.dataset.gemini_pro_model\`
REMOTE WITH CONNECTION \`us.vertex_conn\`
OPTIONS (endpoint = 'gemini-pro');
        </pre>
      </section>

      <section>
        <h4 class="font-bold text-gray-700 mb-2">Step 2: Drift Detection & Inference Query</h4>
        <p class="text-sm text-gray-500 mb-3">
          This SQL query asks Gemini to map new JSON keys to BigQuery data types.
        </p>
        <pre class="bg-[#1e1e1e] text-gray-200 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-gray-700">
WITH NewKeys AS (
  -- Find keys in Raw not in Production
  SELECT DISTINCT key 
  FROM \`project.dataset.raw_logs\`, UNNEST(JSON_KEYS(payload)) as key
  WHERE key NOT IN (SELECT column_name FROM \`project.dataset.INFORMATION_SCHEMA.COLUMNS\`)
)

SELECT
  ml_generate_text_result['candidates'][0]['content']['parts'][0]['text'] AS schema_recommendation
FROM
  ML.GENERATE_TEXT(
    MODEL \`project.dataset.gemini_pro_model\`,
    (
      SELECT CONCAT(
        'Map these JSON keys to BigQuery SQL types (STRING, INT64, BOOL, etc). ',
        'Return JSON format only: {"col_name": "type"}. Keys: ', 
        STRING_AGG(key, ', ')
      ) AS prompt
      FROM NewKeys
    ),
    STRUCT(0.0 AS temperature, 500 AS max_output_tokens)
  );
        </pre>
      </section>

       <section>
        <h4 class="font-bold text-gray-700 mb-2">References</h4>
        <ul class="list-disc pl-5 text-sm text-blue-600 space-y-1">
          <li><a href="https://cloud.google.com/bigquery/docs/remote-models" target="_blank" class="hover:underline">BigQuery ML Remote Models</a></li>
          <li><a href="https://cloud.google.com/bigquery/docs/reference/standard-sql/json_functions" target="_blank" class="hover:underline">BigQuery JSON Functions</a></li>
          <li><a href="https://cloud.google.com/bigquery/docs/generate-text" target="_blank" class="hover:underline">The ML.GENERATE_TEXT Function</a></li>
        </ul>
      </section>
    </div>
  `
};
