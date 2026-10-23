import type { Course, Enrollment, Profile, SyllabusModule } from "@/lib/types";

export function clampProgress(value: number | null | undefined) {
  return Math.min(100, Math.max(0, Math.round(Number(value ?? 0))));
}

export function averageProgress(enrollments: Enrollment[]) {
  if (!enrollments.length) return 0;
  return Math.round(enrollments.reduce((sum, item) => sum + clampProgress(item.progress_percent), 0) / enrollments.length);
}

export function completedCourses(enrollments: Enrollment[]) {
  return enrollments.filter((item) => clampProgress(item.progress_percent) === 100).length;
}

export function inProgressCourses(enrollments: Enrollment[]) {
  return enrollments.filter((item) => {
    const progress = clampProgress(item.progress_percent);
    return progress > 0 && progress < 100;
  }).length;
}

export function profileCompletion(profile: Profile | null) {
  if (!profile) return 0;
  const fields = [profile.full_name, profile.username, profile.bio];
  return Math.round((fields.filter((field) => field?.trim()).length / fields.length) * 100);
}

export function recommendedCourses(courses: Course[], enrollments: Enrollment[], limit = 6) {
  const enrolled = new Set(enrollments.map((item) => item.course_id));
  return courses.filter((course) => !enrolled.has(course.id)).slice(0, limit);
}

export function progressLabel(progress: number) {
  const value = clampProgress(progress);
  if (value === 0) return "Not started";
  if (value === 100) return "Completed";
  if (value < 40) return "Getting started";
  if (value < 80) return "Making progress";
  return "Almost there";
}

/**
 * Returns structured, industry-aligned syllabus modules for each course.
 */
export function getCourseSyllabus(slug: string): SyllabusModule[] {
  switch (slug) {
    case "cybersecurity-soc-operations":
      return [
        {
          title: "Module 1: Enterprise Security Architecture & Threat Modeling",
          duration: "Weeks 1–2",
          topics: [
            "Security Operations Center (SOC) Architecture: Tier 1, 2, 3 Triage & Escalation",
            "MITRE ATT&CK Framework, Cyber Kill Chain & Threat Matrix Mapping",
            "Enterprise Identity & Access Management (IAM), Zero Trust & Host Hardening",
            "Endpoint Detection and Response (EDR) Agent Architecture & Telemetry",
          ],
        },
        {
          title: "Module 2: Network Traffic Forensics & Deep Packet Inspection",
          duration: "Weeks 3–4",
          topics: [
            "TCP/IP Protocol Security, Firewall Rulesets & Microsegmentation",
            "Deep Packet Analysis with Wireshark & Network Flow Triage (Zeek/Suricata)",
            "C2 Communication Patterns, DNS Tunneling & Beaconing Detection",
            "Decryption Architectures, TLS 1.3 Inspection & PKI Certificate Verification",
          ],
        },
        {
          title: "Module 3: Enterprise SIEM Deployment, Log Analytics & Detection Engineering",
          duration: "Weeks 5–6",
          topics: [
            "SIEM Architecture: Ingestion Pipelines, Log Normalization & Indexing",
            "Splunk & Elastic (ELK) Query Syntax: Writing High-Fidelity Correlation Rules",
            "Detection Engineering with Sigma Rules & YARA Threat Scanning",
            "Alert Fatigue Mitigation, False Positive Elimination & Tuning",
          ],
        },
        {
          title: "Module 4: Incident Handling, Threat Hunting & Live Ransomware Containment",
          duration: "Weeks 7–8",
          topics: [
            "NIST SP 800-61 & SANS 6-Step Incident Response Lifecycle",
            "Live Memory Forensics (Volatility) & Windows Event Log Forensics",
            "Ransomware Containment Playbooks & Lateral Movement Interception",
            "Capstone: Live Red vs. Blue Enterprise Breach Simulation & Post-Mortem Report",
          ],
        },
      ];

    case "applied-data-science":
      return [
        {
          title: "Module 1: Python for Data Science & Vectorized Computing",
          duration: "Weeks 1–2",
          topics: [
            "High-Performance Numerical Computing with NumPy Array Operations",
            "Advanced Data Wrangling, Cleaning & Transformation with Pandas",
            "Handling Missing Values, Outlier Detection & Categorical Encoding",
            "Optimizing Data Pipelines with Vectorized Functions & Polars",
          ],
        },
        {
          title: "Module 2: Statistical Analysis, Probability & Hypothesis Testing",
          duration: "Weeks 3–4",
          topics: [
            "Descriptive vs. Inferential Statistics & Probability Distributions",
            "Hypothesis Testing: T-tests, ANOVA, Chi-Square & Non-Parametric Tests",
            "A/B Testing Frameworks: Minimum Detectable Effect, Sample Sizing & P-hacking Defenses",
            "Correlation vs. Causation & Regression Modeling Fundamentals",
          ],
        },
        {
          title: "Module 3: Advanced Data Visualization & Interactive Dashboards",
          duration: "Weeks 5–6",
          topics: [
            "Exploratory Data Analysis (EDA) Best Practices & Cognitive Visual Hierarchy",
            "Publication-Quality Plotting with Matplotlib & Seaborn",
            "Building Interactive Web Applications & Dashboards with Streamlit & Plotly",
            "Business Intelligence Storytelling & Executive Reporting Frameworks",
          ],
        },
        {
          title: "Module 4: Enterprise SQL Pipelines, ETL Automation & Cloud Warehousing",
          duration: "Weeks 7–8",
          topics: [
            "Advanced SQL: Window Functions, CTEs, Recursive Queries & Index Optimization",
            "Automating ETL Workflows with Python, DuckDB & Parquet File Formats",
            "Connecting to Cloud Warehouses (BigQuery / Snowflake / Postgres)",
            "Capstone: Building an End-to-End Enterprise E-Commerce Analytics Engine",
          ],
        },
      ];

    case "generative-ai-and-agents":
      return [
        {
          title: "Module 1: Foundation Models, Embeddings & Vector Databases",
          duration: "Weeks 1–2",
          topics: [
            "Transformer Architecture Deep Dive: Self-Attention, Tokenization & Positional Encoding",
            "Text Embeddings, Cosine Similarity & Dimensionality Reduction",
            "Vector Database Implementations: Pinecone, Qdrant, ChromaDB & pgvector",
            "Dense vs. Sparse Retrieval & Approximate Nearest Neighbor (HNSW) Algorithms",
          ],
        },
        {
          title: "Module 2: Production-Grade RAG Systems & Context Augmentation",
          duration: "Weeks 3–4",
          topics: [
            "Retrieval-Augmented Generation (RAG) Architecture from Scratch",
            "Advanced Chunking Strategies, Metadata Filtering & Semantic Caching",
            "Hybrid Search (BM25 + Dense Vectors) & Neural Rerankers (Cohere/BGE)",
            "GraphRAG & Knowledge Graphs for Multi-Hop Complex Question Answering",
          ],
        },
        {
          title: "Module 3: Autonomous Multi-Agent Systems & Tool Orchestration",
          duration: "Weeks 5–6",
          topics: [
            "Agentic Loops: ReAct Prompting, Function Calling & Structured JSON Outputs",
            "Stateful Multi-Agent Orchestration with LangChain & LangGraph",
            "Hierarchical Agent Teams with CrewAI & Multi-Agent Collaboration",
            "Human-in-the-Loop Safeguards, Dynamic Memory & Tool Sandboxing",
          ],
        },
        {
          title: "Module 4: Model Fine-Tuning (LoRA/QLoRA), Evaluation & Deployment",
          duration: "Weeks 7–8",
          topics: [
            "Instruction Tuning & Parameter-Efficient Fine-Tuning (PEFT, LoRA, QLoRA)",
            "Synthetic Dataset Generation, Data Cleaning & Alignment (DPO/RLHF)",
            "LLM Observability, Cost Tracking & Tracing (LangSmith, Phoenix)",
            "Capstone: Deploying a Multi-Agent Autonomous Research & Coding Assistant",
          ],
        },
      ];

    case "machine-learning-engineering":
      return [
        {
          title: "Module 1: Classical Machine Learning & Algorithmic Foundations",
          duration: "Weeks 1–2",
          topics: [
            "Supervised Learning: Ridge/Lasso Regression, Logistic Regression & SVMs",
            "Tree-Based Ensembles: Random Forests, Gradient Boosting & XGBoost/LightGBM",
            "Unsupervised Learning: K-Means, DBSCAN, PCA & Dimensionality Reduction",
            "Cross-Validation, Hyperparameter Optimization (Optuna) & Data Leakage Prevention",
          ],
        },
        {
          title: "Module 2: Deep Learning Architectures & Neural Networks with PyTorch",
          duration: "Weeks 3–4",
          topics: [
            "PyTorch Tensors, Autograd & Building Custom Neural Network Layers",
            "Activation Functions, Backpropagation, Learning Rate Schedulers & Optimizers (AdamW)",
            "Convolutional Neural Networks (CNNs) & Modern Vision Transformers",
            "Sequence Modeling: LSTMs, Transformers & Self-Supervised Pretraining",
          ],
        },
        {
          title: "Module 3: End-to-End MLOps & Reproducible Pipelines",
          duration: "Weeks 5–6",
          topics: [
            "Experiment Tracking, Metric Logging & Artifact Storage with MLflow",
            "Feature Store Engineering & Data Version Control with DVC",
            "Continuous Training (CT) Pipelines & Automated Model Validation",
            "Data Drift & Concept Drift Detection with Evidently AI",
          ],
        },
        {
          title: "Module 4: High-Performance Model Serving & Cloud Inference",
          duration: "Weeks 7–8",
          topics: [
            "Containerizing PyTorch/Scikit-Learn Models with Docker",
            "High-Throughput Model Serving with FastAPI, Uvicorn & Async Workers",
            "Model Optimization: Quantization, Pruning & ONNX Runtime Acceleration",
            "Capstone: Deploying a Real-Time Fraud Detection ML Microservice with Live Monitoring",
          ],
        },
      ];

    case "fullstack-web-cloud-development":
      return [
        {
          title: "Module 1: Modern Frontend Architecture with Next.js & React 19",
          duration: "Weeks 1–2",
          topics: [
            "React 19 Foundations: Server Components, Actions, Suspense & Streaming",
            "Next.js App Router Architecture: Layouts, Route Handlers & Parallel Routing",
            "Enterprise State Management & Optimistic UI Updates",
            "Tailwind CSS, Component Design Systems & Responsive Accessibility (a11y)",
          ],
        },
        {
          title: "Module 2: Enterprise Backend APIs & PostgreSQL Database Design",
          duration: "Weeks 3–4",
          topics: [
            "RESTful & GraphQL API Architecture in Node.js / TypeScript",
            "Relational Schema Design, Normalization & Indexing in PostgreSQL",
            "Type-Safe ORM Modeling, Migrations & Transactions with Prisma",
            "In-Memory Caching, Rate-Limiting & Session Management with Redis",
          ],
        },
        {
          title: "Module 3: Authentication, Cryptographic Security & System Resilience",
          duration: "Weeks 5–6",
          topics: [
            "Secure Auth Flows: OAuth 2.0, Refresh Tokens, Magic Links & Argon2 Hashing",
            "Role-Based Access Control (RBAC), Row Level Security & CSRF/XSS Mitigation",
            "Background Job Queues, Webhook Listeners & Resilient Async Processing",
            "API Gateway Patterns, Schema Validation with Zod & Error Boundaries",
          ],
        },
        {
          title: "Module 4: Cloud Infrastructure, Containerization & CI/CD Pipelines",
          duration: "Weeks 7–8",
          topics: [
            "Multi-Stage Docker Containers, Docker Compose & Local Dev Parity",
            "Automated GitHub Actions CI/CD: Linting, Unit/Integration Tests & Builds",
            "Zero-Downtime Cloud Deployments on Vercel, AWS ECS & Managed PostgreSQL",
            "Capstone: Launching a Full-Stack Multi-Tenant SaaS Platform with Stripe Billing",
          ],
        },
      ];

    // Backward compatibility for legacy slugs
    case "cybersecurity-foundations":
      return [
        {
          title: "Module 1: Information Security & Threat Landscapes",
          duration: "Weeks 1–2",
          topics: [
            "CIA Triad & Enterprise Security Governance",
            "Modern Threat Actors & Attack Vectors (MITRE ATT&CK Framework)",
            "Authentication, IAM & Principle of Least Privilege",
            "Endpoint Security & Host Hardening",
          ],
        },
        {
          title: "Module 2: Network Defense & Cryptography",
          duration: "Weeks 3–4",
          topics: [
            "TCP/IP Security, Firewalls, IDS/IPS & Packet Analysis with Wireshark",
            "Symmetric vs. Asymmetric Encryption, TLS/SSL, PKI Infrastructure",
            "VPN Architectures & Zero Trust Network Access (ZTNA)",
            "Vulnerability Scanning & Asset Inventory Management",
          ],
        },
        {
          title: "Module 3: Defensive Operations, SIEM & Incident Response",
          duration: "Weeks 5–6",
          topics: [
            "Security Information & Event Management (SIEM) Architecture",
            "Log Parsing, Detection Engineering & Alert Triage",
            "Incident Response Lifecycles (NIST SP 800-61)",
            "Live Capstone: Responding to a Multi-Vector Ransomware Simulation",
          ],
        },
      ];

    case "web-application-security":
      return [
        {
          title: "Module 1: HTTP Architecture & Browser Security Model",
          duration: "Weeks 1–3",
          topics: [
            "HTTP Protocols, Headers, Cookies, and CORS Security",
            "Same-Origin Policy (SOP), CSP & Safe Iframe Sandbox Policies",
            "Session Management, JWT Security & Secure State Tokens",
            "Interception Proxies: Deep Dive with Burp Suite & OWASP ZAP",
          ],
        },
        {
          title: "Module 2: OWASP Top 10 Exploitation & Remediation",
          duration: "Weeks 4–7",
          topics: [
            "Injection Attacks: SQL Injection, NoSQL Injection, Command Injection",
            "Cross-Site Scripting (XSS): Stored, Reflected, DOM-based & Contextual Defense",
            "Broken Object Level Authorization (BOLA) & IDOR Defenses",
            "Server-Side Request Forgery (SSRF) & Insecure Deserialization",
          ],
        },
        {
          title: "Module 3: DevSecOps & Enterprise API Protection",
          duration: "Weeks 8–10",
          topics: [
            "Static (SAST) & Dynamic (DAST) Automated Security Pipeline Integration",
            "OAuth 2.0 / OpenID Connect Implementations & Access Token Auditing",
            "Rate Limiting, WAF Configuration, and Bot Mitigation",
            "Live Capstone: Full Web Application Penetration Test & Security Audit Report",
          ],
        },
      ];

    case "python-for-security":
      return [
        {
          title: "Module 1: Python Essentials for Engineers",
          duration: "Weeks 1–2",
          topics: [
            "Data Structures, Regex Parsing, and File I/O for Log Analytics",
            "Socket Programming & Raw Packet Crafting with Scapy",
            "Object-Oriented Design for Security Tools",
            "Virtual Environments, Packaging, and Error Handling",
          ],
        },
        {
          title: "Module 2: Network & Reconnaissance Automation",
          duration: "Weeks 3–5",
          topics: [
            "Building Custom Port Scanners & Banner Grabbers with AsyncIO",
            "Automating OSINT with Shodan, Censys & VirusTotal REST APIs",
            "Subdomain Enumeration & Web Crawler Development",
            "Credential Spraying Simulations & Hash Cracking Scripts",
          ],
        },
        {
          title: "Module 3: Defensive Automation & Threat Intelligence",
          duration: "Weeks 6–8",
          topics: [
            "Automated Malware Triage & PE File Header Inspection (pefile)",
            "Log Analysis at Scale: Parsing Syslog & CloudTrail with Pandas",
            "Automated Alerting: Telegram & Slack Bot Security Webhooks",
            "Live Capstone: Building an End-to-End Autonomous Threat Intelligence Collector",
          ],
        },
      ];

    default:
      return [
        {
          title: "Module 1: Foundations & Architecture",
          duration: "Weeks 1–2",
          topics: [
            "Domain Concepts and Key Engineering Principles",
            "Tooling Setup, Environment Architecture & Workflows",
            "Best Practices and Security Foundations",
          ],
        },
        {
          title: "Module 2: Advanced Techniques & Real-World Labs",
          duration: "Weeks 3–4",
          topics: [
            "Hands-On Problem Solving & Practical Implementations",
            "Performance Tuning, Hardening & Quality Assurance",
            "Live Capstone Project and Career Portfolio Review",
          ],
        },
      ];
  }
}
