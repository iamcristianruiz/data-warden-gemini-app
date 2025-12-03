
export enum SourceStatus {
  HEALTHY = 'HEALTHY',
  DRIFT_DETECTED = 'DRIFT_DETECTED',
  RESOLVING = 'RESOLVING',
  FAILED = 'FAILED'
}

export interface SchemaField {
  name: string;
  type: string;
  mode: 'NULLABLE' | 'REQUIRED' | 'REPEATED';
}

export interface SchemaPatch {
  id: string;
  appliedAt: string;
  description: string;
  addedFields: SchemaField[];
}

export interface DataSource {
  id: string;
  name: string;
  type: 'PubSub' | 'GCS' | 'CloudSQL';
  lastUpdated: string;
  status: SourceStatus;
  schema: SchemaField[];
  history: SchemaPatch[]; // Track schema evolution
  driftDetails?: {
    detectedAt: string;
    unexpectedFields: SchemaField[];
    missingFields: string[];
    samplePayload: string;
    detectionReport?: string; // Gemini's initial assessment during detection
    
    // Persisted Solution Data
    solutionAnalysis?: string; // The markdown analysis from Gemini (Resolver Step 2)
    solutionCode?: string;     // The extracted SQLX code (Resolver Step 2)
  };
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  source: 'Frontend' | 'Backend' | 'Gemini' | 'System' | 'Dataflow' | 'Dataform' | 'BigQuery';
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
  details?: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  MONITORING = 'MONITORING', // Renamed from SOURCES
  RESOLVER = 'RESOLVER',
  DOCS = 'DOCS'
}
