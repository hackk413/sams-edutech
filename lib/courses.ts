import type { Course } from "@/lib/types";

export const COURSES: Course[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "cybersecurity-soc-operations",
    title: "Cybersecurity & SOC Operations (Level 1/2 Analyst)",
    description:
      "Master enterprise Security Operations Center (SOC) workflows, SIEM engineering (Splunk, Elastic, Microsoft Sentinel), live threat hunting, packet forensics with Wireshark, incident response protocols, and MITRE ATT&CK detection frameworks.",
    category: "Cybersecurity",
    level: "Intermediate",
    duration_hours: 80.0,
    lessons_count: 64,
    duration_months: 4,
    training_plan: "4-Month Comprehensive Track",
    accent: "blue",
    highlights: [
      "Enterprise SIEM Architecture (Splunk, Elastic & Microsoft Sentinel)",
      "Real-Time Network Packet Inspection & PCAP Forensics with Wireshark",
      "MITRE ATT&CK Mapping & Custom Detection Rule Engineering (Sigma/YARA)",
      "Live Ransomware Containment & Incident Response Protocols (NIST SP 800-61)",
    ],
    price: 3999,
    original_price: 12999,
    discount_percent: 69,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    slug: "applied-data-science",
    title: "Applied Data Science & Advanced Analytics",
    description:
      "End-to-end data science pipeline from exploratory data analysis (EDA), NumPy/Pandas data wrangling, statistical hypothesis testing, and automated SQL pipelines to interactive data visualization with Plotly, Seaborn, and Streamlit dashboards.",
    category: "Data Science",
    level: "Beginner to Intermediate",
    duration_hours: 58.0,
    lessons_count: 44,
    duration_months: 3,
    training_plan: "3-Month Accelerator Track",
    accent: "green",
    highlights: [
      "Vectorized Data Manipulation with Advanced NumPy & Pandas",
      "Statistical Hypothesis Testing, A/B Test Frameworks & Inference",
      "Interactive Analytical Dashboards with Plotly, Streamlit & PowerBI",
      "Automated SQL ETL Data Pipelines & Cloud Data Warehousing",
    ],
    price: 3499,
    original_price: 10999,
    discount_percent: 68,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    slug: "generative-ai-and-agents",
    title: "Generative AI, Large Language Models & Autonomous Agents",
    description:
      "Architect state-of-the-art Generative AI applications. Build Retrieval-Augmented Generation (RAG) engines, fine-tune open-weight models, implement autonomous multi-agent systems with LangChain/LangGraph, and deploy production vector search pipelines.",
    category: "Artificial Intelligence",
    level: "Intermediate to Advanced",
    duration_hours: 96.0,
    lessons_count: 68,
    duration_months: 4,
    training_plan: "4-Month Comprehensive Track",
    accent: "purple",
    highlights: [
      "Enterprise Retrieval-Augmented Generation (RAG) with Hybrid Search & Rerankers",
      "Multi-Agent Orchestration & Stateful Workflows with LangGraph & CrewAI",
      "Parameter-Efficient Fine-Tuning (LoRA & QLoRA) on Open-Weights Models",
      "Production Prompt Engineering, Safety Guardrails & LLM Observability",
    ],
    price: 4999,
    original_price: 15999,
    discount_percent: 68,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    slug: "machine-learning-engineering",
    title: "Machine Learning Engineering & MLOps Pipelines",
    description:
      "Master predictive modeling, deep neural networks with PyTorch, supervised & unsupervised algorithms, feature stores, and end-to-end MLOps deployment with Docker, FastAPI, MLflow, and Kubernetes inference pipelines.",
    category: "Machine Learning",
    level: "Intermediate",
    duration_hours: 68.0,
    lessons_count: 50,
    duration_months: 3,
    training_plan: "3-Month Accelerator Track",
    accent: "orange",
    highlights: [
      "Supervised & Unsupervised Machine Learning with Scikit-Learn & XGBoost",
      "Deep Neural Networks, Convolutions & Transformers in PyTorch",
      "End-to-End MLOps: Experiment Tracking with MLflow & Model Versioning",
      "High-Performance Model Serving with FastAPI, Docker & ONNX Runtime",
    ],
    price: 4299,
    original_price: 13999,
    discount_percent: 69,
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    slug: "fullstack-web-cloud-development",
    title: "Full Stack Web & Cloud Engineering (Next.js, Node & Cloud)",
    description:
      "Build modern, production-grade web applications from scratch with Next.js App Router, TypeScript, React Server Components, Node.js REST/GraphQL APIs, PostgreSQL with Prisma ORM, Redis caching, Docker, and AWS/Vercel CI/CD pipelines.",
    category: "Full Stack Development",
    level: "All levels",
    duration_hours: 92.0,
    lessons_count: 72,
    duration_months: 4,
    training_plan: "4-Month Comprehensive Track",
    accent: "dark",
    highlights: [
      "Modern React 19, Next.js App Router & Server Components Architecture",
      "Robust Node.js / TypeScript Backends with Express, Prisma ORM & PostgreSQL",
      "Stateful Authentication (OAuth, JWT, RBAC), Session Security & Rate Limiting",
      "Cloud Containerization with Docker, Redis Microcaching & Automated CI/CD",
    ],
    price: 3799,
    original_price: 11999,
    discount_percent: 68,
  },
];

// Fallback pricing map
export const COURSE_PRICES: Record<string, { price: number; original: number; discount_percent?: number }> = {
  "cybersecurity-soc-operations": { price: 3999, original: 12999, discount_percent: 69 },
  "applied-data-science": { price: 3499, original: 10999, discount_percent: 68 },
  "generative-ai-and-agents": { price: 4999, original: 15999, discount_percent: 68 },
  "machine-learning-engineering": { price: 4299, original: 13999, discount_percent: 69 },
  "fullstack-web-cloud-development": { price: 3799, original: 11999, discount_percent: 68 },
};

export function getCourseBySlug(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}
