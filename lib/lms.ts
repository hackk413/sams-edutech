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
      // 4-Month Comprehensive Track (16 Weeks)
      return [
        {
          title: "Month 1: Enterprise Security Architecture & Threat Modeling",
          duration: "Weeks 1–4",
          topics: [
            "Week 1: SOC Architecture: Tier 1, 2, 3 Triage, Runbooks & Escalation Workflows",
            "Week 2: MITRE ATT&CK Matrix, Cyber Kill Chain & Defensive Strategy Mapping",
            "Week 3: Zero Trust Architecture, Enterprise IAM & Linux/Windows Host Hardening",
            "Week 4: EDR Telemetry, Endpoint Security & Live Attack Surface Reconnaissance",
          ],
        },
        {
          title: "Month 2: Deep Packet Forensics & Network Threat Hunting",
          duration: "Weeks 5–8",
          topics: [
            "Week 5: TCP/IP Packet Dissection, Flow Triage with Zeek & Suricata IDS/IPS",
            "Week 6: Wireshark Packet Forensics, TLS 1.3 Decryption & Certificate Inspection",
            "Week 7: Command & Control (C2) Detection, DNS Tunneling & Beaconing Analysis",
            "Week 8: Perimeter Security, Microsegmentation & Advanced Firewall Rulesets",
          ],
        },
        {
          title: "Month 3: Enterprise SIEM Log Ingestion & Detection Engineering",
          duration: "Weeks 9–12",
          topics: [
            "Week 9: Splunk & Elastic Log Ingestion Pipelines, Normalization & Index Tuning",
            "Week 10: Writing High-Fidelity Splunk (SPL) & KQL Correlation Rules",
            "Week 11: Detection Engineering with Sigma Rules & Automated YARA File Scanning",
            "Week 12: Alert Fatigue Reduction, False Positive Elimination & Automated SOAR Playbooks",
          ],
        },
        {
          title: "Month 4: Incident Response, Live Ransomware Containment & Capstone",
          duration: "Weeks 13–16",
          topics: [
            "Week 13: NIST SP 800-61 Incident Handling Lifecycle & Digital Chain of Custody",
            "Week 14: Volatility 3 Memory Forensics, Kernel Hook Detection & Sysmon Triage",
            "Week 15: Ransomware Outbreak Containment Playbooks & Lateral Movement Interception",
            "Week 16: Enterprise Red vs. Blue Live Breach Simulation & CIRT Executive Post-Mortem",
          ],
        },
      ];

    case "applied-data-science":
      // 3-Month Accelerator Track (12 Weeks)
      return [
        {
          title: "Month 1: High-Performance Python & Vectorized Data Wrangling",
          duration: "Weeks 1–4",
          topics: [
            "Week 1: High-Performance Numerical Computing with NumPy Vectorized Operations",
            "Week 2: Advanced Data Cleaning, Outlier Detection & Transformation with Pandas",
            "Week 3: Categorical Encoding, Feature Imputation & Memory Optimization with Polars",
            "Week 4: Automated Data Ingestion Pipelines & Exploratory Data Analysis (EDA)",
          ],
        },
        {
          title: "Month 2: Statistical Inference, Hypothesis Testing & SQL ETL",
          duration: "Weeks 5–8",
          topics: [
            "Week 5: Inferential Statistics, Probability Distributions & Regression Modeling",
            "Week 6: A/B Testing Frameworks: Minimum Detectable Effect, Sample Sizing & P-Hacking Defenses",
            "Week 7: Advanced Enterprise SQL: Window Functions, CTEs & Index Optimization",
            "Week 8: Automated ETL Pipelines with Python, DuckDB & Parquet Cloud Lakehouses",
          ],
        },
        {
          title: "Month 3: Interactive Dashboards, Production Analytics & Capstone",
          duration: "Weeks 9–12",
          topics: [
            "Week 9: Publication-Grade Visual Analytics with Matplotlib, Seaborn & Plotly",
            "Week 10: Interactive Web Applications & Real-Time Executive Dashboards with Streamlit",
            "Week 11: Business Intelligence Storytelling, KPI Tracking & Executive Reporting",
            "Week 12: Production Capstone: End-to-End Enterprise E-Commerce Analytics Engine",
          ],
        },
      ];

    case "generative-ai-and-agents":
      // 4-Month Comprehensive Track (16 Weeks)
      return [
        {
          title: "Month 1: Foundation Models, Neural Architectures & Vector Search",
          duration: "Weeks 1–4",
          topics: [
            "Week 1: Transformer Architecture Deep Dive: Self-Attention, Tokenization & Positional Encoding",
            "Week 2: Dense Text Embeddings, Semantic Similarity & Dimensionality Reduction",
            "Week 3: Vector Databases from Scratch: Pinecone, Qdrant, ChromaDB & pgvector",
            "Week 4: Approximate Nearest Neighbor Search (HNSW) & Vector Index Benchmarking",
          ],
        },
        {
          title: "Month 2: Enterprise RAG Systems, Hybrid Search & Knowledge Graphs",
          duration: "Weeks 5–8",
          topics: [
            "Week 5: Production RAG Pipelines: Semantic Chunking, Metadata Filters & Ingestion",
            "Week 6: Hybrid Search (BM25 + Dense Vectors) with Cohere & BGE Neural Rerankers",
            "Week 7: GraphRAG & Knowledge Graphs for Multi-Hop Complex Question Answering",
            "Week 8: RAG Evaluation Frameworks (Ragas, TruLens) & Faithfulness Metrics",
          ],
        },
        {
          title: "Month 3: Parameter-Efficient Fine-Tuning (PEFT/LoRA) & Alignment",
          duration: "Weeks 9–12",
          topics: [
            "Week 9: Instruction Fine-Tuning Open-Weights LLMs with LoRA & QLoRA",
            "Week 10: Synthetic Dataset Generation, Data De-duplication & Quality Filtering",
            "Week 11: Preference Alignment with DPO (Direct Preference Optimization) & RLHF",
            "Week 12: LLM Safety Guardrails, Jailbreak Defenses & Prompt Injection Mitigations",
          ],
        },
        {
          title: "Month 4: Autonomous Multi-Agent Teams & Production Orchestration",
          duration: "Weeks 13–16",
          topics: [
            "Week 13: ReAct Loops, Tool Use, Function Calling & Structured JSON Schemas",
            "Week 14: Stateful Multi-Agent Workflows & Graph Branching with LangGraph",
            "Week 15: Hierarchical Agent Swarms with CrewAI & Human-in-the-Loop Approval Gates",
            "Week 16: Production Capstone: Deploying an Autonomous Software Engineering Agent Team",
          ],
        },
      ];

    case "machine-learning-engineering":
      // 3-Month Accelerator Track (12 Weeks)
      return [
        {
          title: "Month 1: Classical Machine Learning & Algorithmic Foundations",
          duration: "Weeks 1–4",
          topics: [
            "Week 1: Supervised Regression & Classification: Regularization (Ridge/Lasso) & SVMs",
            "Week 2: Tree-Based Ensembles: Random Forests, Gradient Boosting & XGBoost/LightGBM",
            "Week 3: Unsupervised Learning: K-Means, DBSCAN Clustering, PCA & UMAP",
            "Week 4: Cross-Validation, Optuna Hyperparameter Tuning & Data Leakage Prevention",
          ],
        },
        {
          title: "Month 2: Deep Learning Architectures & PyTorch Foundations",
          duration: "Weeks 5–8",
          topics: [
            "Week 5: PyTorch Tensors, Autograd & Building Custom Deep Neural Network Layers",
            "Week 6: Activation Functions, Backpropagation, Learning Rate Schedulers & AdamW",
            "Week 7: Convolutional Neural Networks (CNNs) & Modern Vision Transformers",
            "Week 8: Sequence Modeling, LSTMs & Self-Supervised Representation Learning",
          ],
        },
        {
          title: "Month 3: End-to-End MLOps, Model Serving & Cloud Inference",
          duration: "Weeks 9–12",
          topics: [
            "Week 9: Experiment Tracking, Artifact Storage & Model Registry with MLflow",
            "Week 10: Feature Store Architecture & Dataset Version Control with DVC",
            "Week 11: Containerizing ML Models with Docker & High-Throughput FastAPI Async Serving",
            "Week 12: Production Capstone: Real-Time Fraud Detection Engine with Live Drift Monitoring",
          ],
        },
      ];

    case "fullstack-web-cloud-development":
      // 4-Month Comprehensive Track (16 Weeks)
      return [
        {
          title: "Month 1: Modern Frontend Architecture, React 19 & Next.js",
          duration: "Weeks 1–4",
          topics: [
            "Week 1: React 19 Foundations: Server Components, Server Actions & Streaming SSR",
            "Week 2: Next.js App Router Architecture: Nested Layouts, Route Groups & Parallel Routes",
            "Week 3: Advanced TypeScript: Strict Generics, Utility Types & Zod Schema Validation",
            "Week 4: Responsive Design Systems with Tailwind CSS & Web Accessibility (WCAG/a11y)",
          ],
        },
        {
          title: "Month 2: Scalable Node.js Backends, GraphQL & Relational Databases",
          duration: "Weeks 5–8",
          topics: [
            "Week 5: Enterprise REST & GraphQL API Architecture in Node.js & Express",
            "Week 6: PostgreSQL Database Design: Normalization, Foreign Keys & Compound Indexes",
            "Week 7: Type-Safe ORM Modeling, Migrations, Seeders & Transactions with Prisma",
            "Week 8: High-Performance Database Query Tuning & Connection Pooling (PgBouncer)",
          ],
        },
        {
          title: "Month 3: Microservices, Redis Caching & Application Security",
          duration: "Weeks 9–12",
          topics: [
            "Week 9: In-Memory Caching & Distributed Session Storage with Redis",
            "Week 10: Stateful Authentication (OAuth 2.0, HTTP-Only Cookies, JWT & Argon2id)",
            "Week 11: Webhook Listeners, Event-Driven Architecture & Asynchronous Job Queues (BullMQ)",
            "Week 12: Application Security: CSRF, XSS, Row Level Security (RLS) & Rate Limiting",
          ],
        },
        {
          title: "Month 4: Cloud Containerization, Docker, Kubernetes & Production Capstone",
          duration: "Weeks 13–16",
          topics: [
            "Week 13: Optimized Multi-Stage Docker Builds & Local Orchestration with Docker Compose",
            "Week 14: Automated CI/CD Pipelines with GitHub Actions (Linting, Tests, Image Publishing)",
            "Week 15: Cloud Deployment on AWS ECS, Vercel & Managed PostgreSQL Databases",
            "Week 16: Production Capstone: Building & Launching a Full-Stack Multi-Tenant SaaS Platform",
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
