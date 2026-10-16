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

export function recommendedCourses(courses: Course[], enrollments: Enrollment[], limit = 3) {
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
