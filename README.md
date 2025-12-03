# Data Warden: AI-Enhanced Data Ingestion

> **⚠️ DISCLAIMER: For Demonstration Purposes Only**
>
> This project is intended for demonstration and illustrative purposes only. It is not designed for use in a production environment. The code and configurations herein have not been hardened for security, performance, or reliability and should not be deployed as-is. Use at your own risk.

## Overview

**Data Warden** demonstrates an "Anti-Fragile" approach to data engineering on Google Cloud.

Traditional ETL pipelines are often "Rigid"—they crash or fail when upstream data sources change their schema (e.g., adding a new field like `email` or `discount_code`). This project proposes an "Adaptive" architecture that keeps data flowing and uses AI to manage the changes.

### The "Adaptive" Approach
1.  **Ingests Everything:** Uses a flexible JSON column in BigQuery to capture raw data immediately, regardless of schema mismatches.
2.  **Detects Drift with AI:** An embedded **Gemini Agent** ("Schema Steward") analyzes incoming records to detect:
    -   **Structural Drift:** New fields or nesting.
    -   **Semantic Drift:** Data type changes (e.g., numeric `100` becoming string `"100 USD"`).
3.  **Auto-Remediates:** The system can automatically generate "Defensive SQL" (via Dataform) to patch downstream views without human intervention.

## Repository Structure

This repository contains two main components that work together to demonstrate the concept:

1.  **`shaed_notebook_v2.ipynb` (Backend Simulation)**
    -   A comprehensive Jupyter Notebook that simulates the entire data platform.
    -   Runs on Google Colab or Vertex AI Workbench.
    -   **Functionality:** Simulates API data streams, performs BigQuery ingestion, triggers the Gemini Agent for drift analysis, and generates Dataform SQL patches.

2.  **React Application (Frontend Dashboard)**
    -   A visual dashboard to monitor the health of your pipelines.
    -   Visualizes the "Source Map", showing which sources are drifting and how the AI is resolving them.

## Getting Started

### 1. Run the Backend Simulation
To understand the core logic and see the AI in action:

1.  Open **`shaed_notebook_v2.ipynb`** in [BigQuery Notebooks](https://docs.cloud.google.com/bigquery/docs/notebooks-introduction) or a [Google Colab](https://colab.sandbox.google.com/).
2.  Update the **Global Configuration** cell at the top with your Google Cloud details:
    ```python
    PROJECT_ID = "your-project-id"
    REGION = "us-central1"
    DATASET_ID = "your_dataset_id"
    REPO_ID = "your_dataform_repo"
    WORKSPACE_ID = "your_workspace_id"
    ```
3.  Run the cells sequentially. The notebook will:
    -   Set up BigQuery tables.
    -   Simulate a "Rigid" pipeline failure.
    -   Demonstrate the "Adaptive" success.
    -   Simulate mass ingestion with random schema drift.
    -   Use the **Schema Steward Agent** (Gemini) to analyze and fix the drift.

### 2. Run the Frontend Dashboard
To view the monitoring UI locally:

**Prerequisites:** Node.js

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Environment:**
    Create a `.env.local` file in the root directory and add your Gemini API Key:
    ```bash
    GEMINI_API_KEY=your_gemini_api_key_here
    ```
    *(You can get an API key from [Google AI Studio](https://aistudio.google.com/))*

3.  **Run the App:**
    ```bash
    npm run dev
    ```
    Open your browser to the URL shown (e.g., `http://localhost:3000`).

---
