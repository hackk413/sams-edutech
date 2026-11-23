import type { McqQuestion } from "@/lib/types";

// Helper to construct questions cleanly
function q(
  id: number,
  question: string,
  options: [string, string, string, string],
  correct_answer: 0 | 1 | 2 | 3,
  explanation: string
): McqQuestion {
  return { id, question, options, correct_answer, explanation };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CYBERSECURITY & SOC OPERATIONS (LEVEL 1/2 ANALYST)
// ─────────────────────────────────────────────────────────────────────────────

const CYBER_W1_QUESTIONS: McqQuestion[] = [
  q(1, "Which Nmap scan flag initiates a TCP SYN (half-open stealth) scan without completing the 3-way handshake?",
    ["-sT", "-sS", "-sU", "-sN"], 1,
    "-sS sends SYN packets and responds with RST upon receiving SYN-ACK, leaving the TCP connection half-open."),
  q(2, "In passive reconnaissance, which technique allows discovering target subdomains without sending direct packets to the target?",
    ["Active banner grabbing with Netcat", "Querying Certificate Transparency (CT) logs via crt.sh", "Running masscan with high packet rate", "Sending ICMP echo requests to the default gateway"], 1,
    "Certificate Transparency logs record SSL/TLS certificates publicly, exposing subdomains passively."),
  q(3, "What does Nmap flag -sV accomplish during a port scan?",
    ["Scans UDP ports only", "Determines service and version information running on open ports", "Spoofs source IP address", "Disables DNS name resolution"], 1,
    "-sV interrogates open ports using probes from nmap-service-probes to determine daemon banners and versions."),
  q(4, "Which TCP flag combination is set in an Nmap Xmas tree scan?",
    ["SYN, ACK, RST", "FIN, URG, PSH", "FIN, ACK, RST", "SYN, FIN, URG"], 1,
    "Xmas scan turns on FIN, URG, and PSH flags ('lit up like a Christmas tree') to bypass stateless packet filters."),
  q(5, "According to NIST SP 800-115, what is the primary distinction between a vulnerability scan and a penetration test?",
    ["Vulnerability scans exploit flaws; penetration tests only catalog them", "Vulnerability scans identify potential flaws passively or actively without exploitation; penetration tests actively exploit flaws", "Vulnerability scans require physical access; penetration tests are remote", "There is no difference in the NIST framework"], 1,
    "NIST SP 800-115 defines vulnerability scanning as identifying weaknesses, whereas penetration testing actively validates exploitability."),
  q(6, "Which tool is best suited for querying DNS records such as MX, TXT, and NS records via CLI?",
    ["dig", "traceroute", "curl", "arp"], 0,
    "dig (Domain Information Groper) is the standard DNS interrogation utility for querying record types."),
  q(7, "What is the purpose of Nmap's -Pn option?",
    ["Treat all hosts as online and skip host discovery (ICMP ping)", "Scan top 100 ports only", "Perform IPv6 scanning", "Enable packet tracing"], 0,
    "-Pn instructs Nmap not to ping hosts prior to port scanning, useful when firewalls drop ICMP probes."),
  q(8, "Which OSINT tool is designed to harvest emails, subdomains, and hostnames from public search engines?",
    ["TheHarvester", "Wireshark", "John the Ripper", "Aircrack-ng"], 0,
    "TheHarvester aggregates publicly available OSINT data from search engines, PGP servers, and Shodan."),
  q(9, "What response indicates an open port during a UDP scan (-sU)?",
    ["ICMP Port Unreachable message received", "UDP response packet returned, or no response (open|filtered)", "TCP RST packet returned", "ICMP Host Unreachable message received"], 1,
    "UDP ports return application data if responsive, or no response (open|filtered) if listening silently."),
  q(10, "Which CVSS v3.1 base metric measures whether an attacker requires prior authenticated credentials?",
    ["Attack Vector (AV)", "Attack Complexity (AC)", "Privileges Required (PR)", "User Interaction (UI)"], 2,
    "Privileges Required (PR) evaluates whether an attacker needs None, Low, or High privileges before exploitation."),
  q(11, "Which Nmap default timing template flag is recommended for balancing scan speed and stealth?",
    ["-T0 (Paranoid)", "-T1 (Sneaky)", "-T3 (Normal)", "-T5 (Insane)"], 2,
    "-T3 is Nmap's default dynamic timing template, optimizing timeouts without overloading network devices."),
  q(12, "What does Shodan primarily index across the public Internet?",
    ["Web page text content and blog posts", "Exposed device banners, IoT hardware, and service ports", "Encrypted VPN payloads", "Deleted social media posts"], 1,
    "Shodan is a search engine for Internet-connected devices, indexing service banners across global IP spaces."),
  q(13, "When conducting whois queries, what information is retrieved?",
    ["Local ARP cache of the target host", "Registrar details, domain ownership dates, and authoritative nameservers", "Target kernel version and patch level", "Firewall ACL rules"], 1,
    "WHOIS queries registries to obtain domain registration records, autonomous system numbers (ASNs), and DNS servers."),
  q(14, "Which Nmap script category should be used with caution because it may destabilize target services?",
    ["safe", "discovery", "intrusive or dos", "version"], 2,
    "The 'intrusive' and 'dos' script categories run aggressive checks that can crash fragile daemons."),
  q(15, "What type of DNS record stores SPF (Sender Policy Framework) email authentication policies?",
    ["A record", "PTR record", "TXT record", "CNAME record"], 2,
    "SPF policies are published as TXT records in DNS to declare authorized outgoing mail transfer agents (MTAs)."),
  q(16, "What port is typically targeted when assessing unsecured remote desktop exposure?",
    ["TCP 22", "TCP 3389", "TCP 445", "TCP 1433"], 1,
    "TCP port 3389 is the standard port for Microsoft Remote Desktop Protocol (RDP)."),
  q(17, "What is 'banner grabbing' in network reconnaissance?",
    ["Stealing cryptographic certificates", "Connecting to an open service port and reading the initial greeting text", "Modifying HTML headers on a web server", "Flooding an ARP table with fake MAC addresses"], 1,
    "Banner grabbing inspects service greetings (e.g. Apache 2.4.52 on port 80) to fingerprint service software."),
  q(18, "Which tool provides automated web directory brute-forcing and enumeration?",
    ["Gobuster", "Hydra", "Wireshark", "Snort"], 0,
    "Gobuster is a high-performance Go-based utility for brute-forcing URIs, subdomains, and virtual hosts."),
  q(19, "What is a major risk of running high-speed SYN scans (-T4/-T5) across enterprise networks?",
    ["They trigger stateful firewall session table exhaustion and alert IDS sensors", "They automatically patch vulnerabilities", "They permanently corrupt target hard drives", "They decrypt SSL certificates in transit"], 0,
    "Aggressive packet rates can exhaust stateful inspection tables in intermediate firewalls and trigger SIEM alerts."),
  q(20, "Which MITRE ATT&CK Enterprise tactic covers techniques that adversaries use to gather information before attacking?",
    ["Initial Access", "Reconnaissance (TA0043)", "Lateral Movement", "Exfiltration"], 1,
    "Tactic TA0043 (Reconnaissance) encompasses active and passive techniques to gather actionable attack surface data.")
];

const CYBER_W2_QUESTIONS: McqQuestion[] = [
  q(1, "In Splunk Search Processing Language (SPL), which command groups events and calculates aggregate statistics?",
    ["eval", "stats", "table", "rename"], 1,
    "The 'stats' command provides grouping, counting, summing, and statistical aggregations (e.g. stats count by src_ip)."),
  q(2, "Which Windows Security Log Event ID indicates a successful account logon?",
    ["4624", "4625", "4672", "4720"], 0,
    "Event ID 4624 documents successful logon events, including logon types (e.g., Type 2 Interactive, Type 3 Network)."),
  q(3, "Which Windows Event ID records a failed account logon attempt?",
    ["4624", "4625", "4634", "4688"], 1,
    "Event ID 4625 is generated when a logon request fails, essential for detecting brute force and credential stuffing."),
  q(4, "What open format is used to write generic detection rules that can be converted into Splunk, Elastic, or Sentinel queries?",
    ["YARA", "Sigma", "Snort", "STIX"], 1,
    "Sigma is the generic signature format for log events, enabling detection-as-code convertible across SIEM engines."),
  q(5, "In SIEM architecture, what is the role of an Indexer in Splunk?",
    ["Renders UI dashboards for analysts", "Parses, indexes, and stores incoming machine data on disk", "Collects logs directly from endpoints only", "Generates SSL certificates"], 1,
    "Indexers receive parsed data, compress it, build inverted search indices, and store it in buckets on disk."),
  q(6, "In SPL, which search pipe filters out duplicate occurrences of a field?",
    ["| dedup", "| sort", "| head", "| fields"], 0,
    "The 'dedup' command eliminates consecutive or overall duplicate events matching specified field values."),
  q(7, "Which Windows Event ID captures process creation when command-line auditing is enabled?",
    ["4624", "4688", "4720", "7045"], 1,
    "Event ID 4688 records new process creation, capturing parent processes and command line arguments."),
  q(8, "What does Logon Type 3 represent in Windows Event 4624 logs?",
    ["Interactive logon at the physical console", "Network logon (e.g., accessing an SMB share or network resource)", "RemoteInteractive via RDP", "Service startup logon"], 1,
    "Logon Type 3 indicates network access from a remote machine (SMB, RPC) without an interactive desktop session."),
  q(9, "What is a 'correlation search' in a Security Operations Center?",
    ["A manual search run by an analyst on demand", "An automated scheduled search that evaluates multiple log sources for suspicious patterns and creates alerts", "A query that deletes old archived logs", "A network ping sweep"], 1,
    "Correlation rules continuously query diverse log streams to trigger alerts when complex rule conditions match."),
  q(10, "In Splunk, what is the purpose of the 'eval' command?",
    ["Performs mathematical and conditional calculations to create or alter field values", "Deletes events from disk", "Sends emails to administrators", "Reboots the indexer"], 0,
    "The 'eval' command computes new fields or modifies existing ones using functions like case(), if(), and round()."),
  q(11, "What does Sysmon Event ID 1 record on Windows endpoints?",
    ["Process creation (with full command line, hashes, and parent process ID)", "Network connection detected", "File creation time changed", "Driver loaded"], 0,
    "Sysmon Event ID 1 provides high-fidelity process creation telemetry, including SHA256 hashes and ParentImage."),
  q(12, "Which metric measures the average time required to discover an active compromise inside a network?",
    ["Mean Time to Detect (MTTD)", "Mean Time to Remediate (MTTR)", "Return on Security Investment (ROSI)", "Recovery Point Objective (RPO)"], 0,
    "MTTD (Mean Time to Detect) measures the duration from adversary compromise until initial SOC detection."),
  q(13, "What is the primary indicator of a 'Pass-the-Hash' lateral movement attack in event logs?",
    ["Logon Type 3 with NTLM authentication where no interactive credentials were typed", "Logon Type 2 with Kerberos ticket renewal", "Event ID 4634 session logoff", "Event ID 1102 audit log cleared"], 0,
    "Pass-the-Hash uses harvested NTLM hashes across the network via SMB/RPC, generating Type 3 NTLM logons."),
  q(14, "In SPL, what does the 'transaction' command do?",
    ["Encrypts data between indexers", "Groups events that share common field values into single multi-event transactions based on time constraints", "Calculates SQL rollback points", "Creates a user session in the browser"], 1,
    "The 'transaction' command fuses discrete log events (e.g. logon, file read, logoff) sharing an identifier into a cohesive session."),
  q(15, "What is the significance of Windows Event ID 1102?",
    ["Audit log was cleared by an administrator or attacker", "New user account was provisioned", "Security policy was modified", "Computer account changed"], 0,
    "Event ID 1102 signifies that the Windows Security Audit Log was cleared, frequently an anti-forensics adversary action."),
  q(16, "What does a sudden spike in DNS query volume with long, high-entropy subdomain strings typically suggest?",
    ["Normal Windows update activity", "DNS Tunneling / Data Exfiltration or C2 beaconing", "NTP clock synchronization failure", "DHCP lease renewal"], 1,
    "Adversaries use DNS tunneling by embedding base64/hex encoded payload data into subdomain labels to bypass firewalls."),
  q(17, "What is a 'false positive' in SIEM alert triage?",
    ["An alert triggered by benign activity that does not represent a genuine threat", "A real security incident that was missed by the detection rule", "An attack that succeeded without any logs", "A system crash caused by an exploit"], 0,
    "A false positive is an alert where the detection rule fired, but investigation shows legitimate authorized behavior."),
  q(18, "Which Splunk component collects data from source systems and forwards it to indexers?",
    ["Universal Forwarder (UF)", "Deployment Server", "Cluster Master", "Search Head Deployer"], 0,
    "Splunk Universal Forwarders are lightweight agents installed on endpoints to tail log files and forward them securely."),
  q(19, "Which MITRE ATT&CK technique involves an adversary querying active directory objects via LDAP?",
    ["Account Discovery (T1087)", "File Deletion (T1070)", "Data Destruction (T1485)", "Network Sniffing (T1040)"], 0,
    "T1087 (Account Discovery) involves querying local or domain controllers to map user and group memberships."),
  q(20, "What is the purpose of normalising log fields using the Common Information Model (CIM) in Splunk?",
    ["To standardize divergent field names (e.g. src, Source_IP, client_ip) into unified schema for cross-platform correlation", "To compress log text into zip archives", "To delete sensitive PII", "To accelerate NTP timing"], 0,
    "CIM normalization maps heterogeneous log formats into uniform fields, allowing one detection search across firewalls, proxies, and hosts.")
];

const CYBER_W3_QUESTIONS: McqQuestion[] = [
  q(1, "What display filter in Wireshark isolates traffic to a specific IPv4 host 192.168.1.50?",
    ["ip.addr == 192.168.1.50", "host = 192.168.1.50", "tcp.host == 192.168.1.50", "ipv4.filter == 192.168.1.50"], 0,
    "'ip.addr == 192.168.1.50' matches packets where either the source or destination IP equals 192.168.1.50."),
  q(2, "In a standard TCP 3-way handshake, what is the order of packet flags exchanged?",
    ["SYN -> SYN-ACK -> ACK", "SYN -> ACK -> FIN", "ACK -> SYN -> RST", "SYN-ACK -> SYN -> ACK"], 0,
    "A client sends SYN, the server responds with SYN-ACK, and the client confirms with ACK to establish connection."),
  q(3, "In Wireshark, which feature reconstructs full plaintext application payloads from fragmented TCP streams?",
    ["Follow TCP Stream", "Decode As SSL", "Expert Information", "Flow Graph Analysis"], 0,
    "'Follow TCP Stream' reassembles TCP segments in sequence to show the entire conversational payload (e.g. HTTP, SMTP)."),
  q(4, "Which Wireshark filter reveals all DNS queries and responses across captured traffic?",
    ["udp.port == 53 or dns", "dns.flags.response == 0 only", "tcp.port == 80", "ip.proto == 6"], 0,
    "DNS operates predominantly on UDP port 53; the 'dns' protocol filter displays all parsed DNS transactions."),
  q(5, "What does an unexpected burst of TCP RST packets during an active session typically indicate?",
    ["Normal TCP keepalive", "Abrupt connection termination by a firewall, IDS, or host rejection", "Slow-start congestion window expansion", "ARP table cache update"], 1,
    "RST (Reset) packets are sent to forcefully close connections or reject packets destined for closed ports."),
  q(6, "Which protocol operates at the Transport Layer of the OSI Model and guarantees ordered, error-checked delivery?",
    ["UDP", "TCP", "IP", "ICMP"], 1,
    "TCP (Transmission Control Protocol) is the connection-oriented Transport Layer protocol with sequencing and ACK checking."),
  q(7, "What is the Wireshark display filter to identify HTTP POST requests containing potential form data?",
    ["http.request.method == \"POST\"", "http.type == \"POST\"", "tcp.payload contains \"POST\"", "http.response.code == 200"], 0,
    "'http.request.method == \"POST\"' filters HTTP requests using the POST verb, often carrying submission payloads."),
  q(8, "When analyzing an encrypted TLS 1.3 session in Wireshark without private keys, which field in the Client Hello reveals the target server domain?",
    ["Server Name Indication (SNI) extension", "Subject Alternative Name (SAN)", "Cipher Suite negotiation tag", "HTTP Host Header"], 0,
    "The SNI extension in the plaintext TLS Client Hello specifies the hostname the client wishes to connect to."),
  q(9, "What anomaly is characterized by multiple SYN packets to sequential destination ports without completing handshakes?",
    ["Port scan (e.g., Nmap SYN scan)", "DNS amplification", "BGP route flapping", "DHCP starvation"], 0,
    "Sequential destination port SYN probes without subsequent ACKs are indicative of an active port scan."),
  q(10, "Which ICMP Type and Code combination signifies an 'Echo Request' (standard ping)?",
    ["Type 8, Code 0", "Type 0, Code 0", "Type 3, Code 3", "Type 11, Code 0"], 0,
    "ICMP Type 8 Code 0 is Echo Request; Type 0 Code 0 is the corresponding Echo Reply."),
  q(11, "What does an ARP Poisoning (Man-in-the-Middle) attack exploit in Ethernet LANs?",
    ["The unauthenticated, stateless nature of ARP replies where hosts accept unsolicited ARP messages", "DNSSEC cryptographic signatures", "BGP autonomous path routing", "SSL certificate expiration"], 0,
    "ARP lacks authentication; hosts update their ARP caches with unsolicited gratuitous ARP replies, allowing IP-MAC spoofing."),
  q(12, "In Wireshark, what does 'tcp.analysis.retransmission' indicate?",
    ["Duplicate SYN packets sent by an adversary", "A sender retransmitting a packet because no ACK was received within the timeout window (packet loss or latency)", "Successful file download", "DNS resolution success"], 1,
    "TCP retransmissions signify lost packets or congestion requiring the sender to re-send unacknowledged sequence data."),
  q(13, "What port does unencrypted Kerberos ticket granting service operate on by default?",
    ["TCP/UDP 88", "TCP 389", "TCP 445", "TCP 636"], 0,
    "Kerberos operates on TCP and UDP port 88 for authentication (AS-REQ/REP) and ticket granting (TGS-REQ/REP)."),
  q(14, "Which Wireshark filter matches packets where the TCP window size is zero (indicating buffer exhaustion)?",
    ["tcp.window_size == 0", "tcp.len == 0", "tcp.flags.ack == 0", "tcp.stream == 0"], 0,
    "'tcp.window_size == 0' identifies window full / zero window events where a receiving endpoint cannot ingest more data."),
  q(15, "What is the primary indicator of an SMB lateral movement using PsExec in a PCAP capture?",
    ["Connections to port 445 accessing the ADMIN$ or C$ share and creating a service executable", "HTTP GET requests to port 80", "DNS queries for mail servers", "SNMP walks on UDP 161"], 0,
    "PsExec connects over SMB (port 445), uploads a service binary to ADMIN$, and creates a remote service over RPC."),
  q(16, "What utility converts raw PCAP files into human-readable text output via command line?",
    ["tshark", "tcpdump only", "netstat", "ipconfig"], 0,
    "tshark is the official terminal-based network packet analyzer that powers Wireshark's dissection engine from the CLI."),
  q(17, "What is the purpose of the 'Expert Information' tab in Wireshark?",
    ["Automatically files bug reports to GitHub", "Highlights protocol anomalies, chatty traffic, TCP warnings, and malformed frames detected by Wireshark", "Decrypts WPA2 handshakes automatically", "Calculates subnet masks"], 1,
    "Expert Info aggregates diagnostic warnings (Errors, Warnings, Notes, Chats) to flag packet-level anomalies."),
  q(18, "Which filter isolates packets with payloads containing the string 'password' case-insensitively?",
    ["frame matches \"(?i)password\"", "tcp.content == \"password\"", "http.auth == true", "ip.proto == \"password\""], 0,
    "Wireshark supports regular expressions via the 'matches' operator; '(?i)' specifies case-insensitivity."),
  q(19, "When examining an HTTP beaconing malware connection, what metric helps identify automated C2 communications?",
    ["Regular, periodic inter-arrival time intervals (jitter) between HTTP requests", "Large MTU size on the frame", "Random source port assignment", "Use of HTTP/2 instead of HTTP/1.1"], 0,
    "Malware beacons exhibit regular timing intervals (e.g. exactly every 60 seconds with low jitter) communicating with C2 servers."),
  q(20, "What does a high frequency of ICMP Type 3 Code 3 packets indicate in a packet capture?",
    ["Network Destination Unreachable: Destination Port Unreachable (service closed on target host)", "Successful ping echo", "Time-to-Live expired in transit", "Router redirection"], 0,
    "ICMP Type 3 Code 3 is returned by UDP endpoints when a packet arrives at an inactive or closed port.")
];

const CYBER_W4_QUESTIONS: McqQuestion[] = [
  q(1, "According to NIST SP 800-61 Rev. 2, what are the four core phases of the Incident Response lifecycle?",
    ["Preparation; Detection & Analysis; Containment, Eradication & Recovery; Post-Incident Activity", "Planning; Scanning; Exploitation; Reporting", "Triage; Quarantine; Lawsuit; Termination", "Firewalling; Patching; Re-imaging; Archival"], 0,
    "NIST SP 800-61 organizes IR into Preparation, Detection/Analysis, Containment/Eradication/Recovery, and Post-Incident Activity."),
  q(2, "In incident response, what is the immediate objective of the 'Containment' phase?",
    ["Patch all enterprise servers", "Limit the scope and impact of an active compromise to prevent lateral spread", "Interview end users to identify culprits", "Issue press releases"], 1,
    "Containment halts attacker progression and lateral spread while preserving volatile memory and forensic evidence."),
  q(3, "When handling an endpoint infected with active ransomware, what is the immediate first responder action?",
    ["Power off the machine by pulling the power plug immediately", "Disconnect the endpoint from the network (unplug Ethernet / disable Wi-Fi) while leaving RAM powered for volatile memory capture", "Run an antivirus scan on the C: drive", "Restart the machine into Safe Mode"], 1,
    "Network isolation halts C2 communication and lateral encryption, while leaving power on preserves critical volatile RAM forensics."),
  q(4, "What does the MITRE ATT&CK framework provide to security operations teams?",
    ["A commercial firewall configuration tool", "A comprehensive matrix of real-world adversary tactics, techniques, and procedures (TTPs)", "An antivirus signature scanner", "A replacement for NIST standards"], 1,
    "MITRE ATT&CK categorizes threat actor behaviors across tactical stages from Initial Access to Impact."),
  q(5, "What constitutes an 'Indicator of Compromise' (IoC)?",
    ["Piece of forensic data (file hash, IP, domain, registry key) identifying malicious network or host activity", "An employee badge swipe entry", "A scheduled Windows update reboot", "A user request for software installation"], 0,
    "IoCs are observable artifacts left by adversaries that evidence a past or ongoing system breach."),
  q(6, "Which artifact in Windows volatile memory contains active network sockets and running uncommitted credentials?",
    ["The physical RAM (captured via DumpIt or WinPmem)", "The Master File Table ($MFT)", "The Volume Shadow Copy", "The BIOS firmware ROM"], 0,
    "RAM contains unencrypted credentials, injected DLLs, decrypted malware payloads, and active network connections."),
  q(7, "What is the 'Order of Volatility' defined in RFC 3227 for digital evidence collection?",
    ["Registers/Cache -> Routing table & RAM -> Temporary file systems -> Disk -> Remote logs -> Physical media", "Hard disk -> RAM -> USB drive -> Cloud backups", "Printed documents -> Registry -> RAM -> CPU cache", "Archived tape -> Local database -> RAM"], 0,
    "RFC 3227 mandates collecting the most ephemeral evidence first (CPU cache/RAM) before persistent disk files."),
  q(8, "Which artifact records Windows execution history by preserving 1024-byte files for recently run executables to optimize launch performance?",
    ["Shimcache (AppCompatCache)", "Prefetch files (.pf)", "Event Viewer logs", "SAM database"], 1,
    "Prefetch files (.pf in C:\\Windows\\Prefetch) capture execution timestamps, run counts, and loaded DLL dependencies."),
  q(9, "What is the primary role of an 'Eradication' phase in incident response?",
    ["Eliminating all components of the threat, including deleting malware artifacts, removing backdoor accounts, and patching root vulnerabilities", "Rebuilding the physical building wiring", "Interviewing senior leadership", "Purchasing new licenses"], 0,
    "Eradication systematically purges malicious implants, rogue accounts, persistence mechanisms, and vulnerabilities before recovery."),
  q(10, "What is a 'Chain of Custody' document in digital forensics?",
    ["A legal record tracing who collected, handled, transferred, analyzed, and secured physical and digital evidence", "A receipt for purchasing hard drives", "A software license agreement", "A list of employee login passwords"], 0,
    "Chain of Custody proves evidence integrity and authenticity by detailing every custodial transfer and storage hash."),
  q(11, "Which cryptographic hash algorithm is widely considered compromised and no longer acceptable for high-security forensic integrity verification?",
    ["MD5 and SHA-1", "SHA-256", "SHA-512", "BLAKE3"], 0,
    "MD5 and SHA-1 have known collision vulnerabilities; NIST standards recommend SHA-256 or SHA-512 for forensic verification."),
  q(12, "In MITRE ATT&CK, what is the difference between a 'Tactic' and a 'Technique'?",
    ["Tactics are the adversary's technical goal ('Why'); Techniques are the specific way they achieve it ('How')", "Tactics are software tools; Techniques are hacker names", "Tactics apply only to Linux; Techniques apply to Windows", "There is no distinction"], 0,
    "Tactics represent the high-level operational objective (e.g. Persistence); Techniques describe the practical implementation method."),
  q(13, "What does a 'Shadow Copy Deletion' command (vssadmin delete shadows /all /quiet) indicate during an attack?",
    ["Adversary preparing ransomware detonation to prevent the victim from recovering encrypted files via Volume Shadow Service", "Routine Windows Disk Cleanup maintenance", "System backup execution", "Safe Mode preparation"], 0,
    "Ransomware routinely purges VSS volume shadow copies so organizations cannot restore files locally without decryption keys."),
  q(14, "What is a post-incident 'Lessons Learned' meeting intended to achieve?",
    ["Assign blame and disciplinary action to administrators", "Analyze what happened, evaluate IR playbook effectiveness, and implement preventative controls to prevent recurrence", "Cancel ongoing security tool contracts", "Re-run the malware in production"], 1,
    "NIST SP 800-61 mandates post-incident reviews to identify playbook shortcomings, refine detections, and improve security posture."),
  q(15, "Which open-source tool is standard for performing live memory analysis on Windows memory dump files?",
    ["Volatility Framework", "Metasploit", "Nmap", "Burp Suite"], 0,
    "Volatility is the premier open-source memory forensics framework for extracting processes, network sockets, and DLLs from RAM dumps."),
  q(16, "What is an effective compensating control to prevent lateral movement via compromised local administrator credentials?",
    ["Deploying Microsoft LAPS (Local Administrator Password Solution) to randomize unique passwords per endpoint", "Using the same administrator password across all workstations", "Disabling Windows Firewall", "Giving all domain users local admin access"], 0,
    "LAPS enforces randomized, rotating passwords for the built-in local administrator account on each domain-joined workstation."),
  q(17, "What is 'Live Triage' in digital incident response?",
    ["Collecting targeted forensic artifacts from a running live system using scripts (e.g. KAPE, CyLR) without taking a full image", "Waiting 24 hours to see if an attack stops", "Deleting all temporary files", "Rebooting the server three times"], 0,
    "Live triage rapidly captures high-value forensic artifacts (event logs, MFT, registry, prefetch) in minutes to expedite analysis."),
  q(18, "Which MITRE ATT&CK tactic deals with maintaining access across reboots and credential resets?",
    ["Persistence (TA0003)", "Exfiltration", "Initial Access", "Command and Control"], 0,
    "Tactic TA0003 (Persistence) includes scheduled tasks, registry run keys, services, and startup folder manipulation."),
  q(19, "What is the primary indicator of a Pass-the-Ticket (PtT) Kerberos attack?",
    ["Injection of a Kerberos TGT (Ticket Granting Ticket) or TGS into memory to authenticate as another user without knowing their password", "Brute forcing a user password over Telnet", "Sending phishing emails", "Creating a guest account"], 0,
    "Pass-the-Ticket reuses harvested Kerberos tickets residing in LSASS memory to impersonate privileged accounts across the domain."),
  q(20, "What legal requirement governs reporting personal data breaches under the GDPR within 72 hours of becoming aware?",
    ["Article 33 of GDPR", "HIPAA Security Rule", "PCI DSS Requirement 3", "SOX Section 404"], 0,
    "Article 33 of GDPR requires data controllers to notify the competent supervisory authority within 72 hours of detecting a personal data breach.")
];

// Fallback generator for generating 20 context-specific MCQs for any course track & week
export function generate20McqsForTrack(
  courseSlug: string,
  weekNumber: number,
  courseTitle: string
): McqQuestion[] {
  // Check predefined modules
  if (courseSlug.includes("cyber") || courseSlug.includes("soc")) {
    if (weekNumber === 1) return CYBER_W1_QUESTIONS;
    if (weekNumber === 2) return CYBER_W2_QUESTIONS;
    if (weekNumber === 3) return CYBER_W3_QUESTIONS;
    if (weekNumber === 4) return CYBER_W4_QUESTIONS;
  }

  // Generate specialized 20 questions based on course topic
  const isDataScience = courseSlug.includes("data-science") || courseSlug.includes("analytics");
  const isGenAI = courseSlug.includes("genai") || courseSlug.includes("agents") || courseSlug.includes("ai");
  const isML = courseSlug.includes("machine-learning") || courseSlug.includes("mle");

  const bank: McqQuestion[] = [];

  for (let i = 1; i <= 20; i++) {
    let questionText = "";
    let options: [string, string, string, string] = [
      "Option Alpha",
      "Option Beta",
      "Option Gamma",
      "Option Delta",
    ];
    let correct: 0 | 1 | 2 | 3 = 0;
    let explanation = "";

    if (isDataScience) {
      if (weekNumber === 1) {
        // NumPy & Vectorization
        const ds1 = [
          ["What is the primary advantage of NumPy vectorized operations over standard Python for-loops?", ["Vectorized operations execute in contiguous C-level memory with SIMD hardware optimization, avoiding Python interpreter overhead", "NumPy loops use more threads automatically", "Python loops cannot handle floating point numbers", "NumPy converts all arrays into strings"], 0, "NumPy delegates operations to compiled C loops and SIMD vector units across contiguous memory buffers."],
          ["In NumPy, which attribute returns the tuple representing array dimensions?", ["arr.shape", "arr.size", "arr.ndim", "arr.dtype"], 0, "The .shape attribute returns a tuple of integers indicating the size of each dimension."],
          ["What does numpy.ndarray.astype(np.float32) do?", ["Converts all elements to 32-bit floating point and returns a new array", "Deletes all elements", "Rounds values to integers", "Reshapes array into a vector"], 0, "astype() casts elements to a specified dtype, allocating a new copy."],
          ["What is broadcasting in NumPy?", ["A mechanism allowing arithmetic operations between arrays of different shapes under compatible alignment rules", "Streaming arrays over HTTP", "Encrypting arrays in memory", "Deleting empty array slots"], 0, "Broadcasting stretches smaller arrays along trailing dimensions to match larger shapes without copying data."],
          ["Which function horizontally stacks two NumPy arrays with compatible row counts?", ["np.hstack()", "np.vstack()", "np.split()", "np.ravel()"], 0, "np.hstack() stacks arrays in sequence horizontally (column-wise)."],
          ["What will np.zeros((3, 4)) generate?", ["A 3-row by 4-column matrix filled with zeros", "A 4-row by 3-column matrix", "A 1D array of 12 zeros", "An error"], 0, "np.zeros((rows, cols)) generates a 2D matrix of shape (3, 4) initialized to 0.0."],
          ["How do you slice elements from index 2 up to index 8 with step 2 in a 1D NumPy array?", ["arr[2:8:2]", "arr[2..8..2]", "arr.slice(2, 8, 2)", "arr[2, 8, 2]"], 0, "Standard slice syntax in Python/NumPy is [start:stop:step]."],
          ["What is the output of np.dot() on two 1D vectors of equal length?", ["The scalar dot product", "An element-wise sum", "A 2D matrix", "A boolean"], 0, "For 1D arrays, np.dot computes the inner scalar product of the vectors."],
          ["Which function flattens a multi-dimensional array into a 1D view without copying memory if possible?", ["np.ravel()", "np.flatten()", "np.split()", "np.reshape(-1, 0)"], 0, "np.ravel() returns a contiguous 1D flattened view without memory allocation where possible."],
          ["How do you compute the arithmetic mean of a 2D array along columns (down rows)?", ["np.mean(arr, axis=0)", "np.mean(arr, axis=1)", "np.mean(arr, axis=-1)", "arr.mean_all()"], 0, "axis=0 collapses rows, computing the mean across columns."],
          ["What happens when you perform boolean masking: arr[arr > 5]?", ["Returns a 1D array containing only the elements greater than 5", "Sets all elements greater than 5 to zero", "Throws an exception", "Returns a boolean matrix"], 0, "Boolean indexing extracts values where the conditional expression evaluates to True."],
          ["Which NumPy function computes the inverse of a square matrix?", ["np.linalg.inv()", "np.linalg.pinv()", "np.linalg.eig()", "np.matrix.invert()"], 0, "np.linalg.inv() calculates the multiplicative inverse of a regular square matrix."],
          ["What does np.nan represent in floating-point arrays?", ["Not a Number (IEEE 754 floating point standard for undefined values)", "Null string", "Zero", "Negative infinity"], 0, "np.nan represents undefined or unrepresentable numerical values."],
          ["How do you find the index of the maximum value in an array?", ["np.argmax()", "np.max()", "np.maximum()", "arr.index_max()"], 0, "np.argmax() returns the indices of the maximum values along an axis."],
          ["What does np.linspace(0, 10, 5) produce?", ["5 evenly spaced numbers over the closed interval [0, 10]: [0., 2.5, 5., 7.5, 10.]", "Integers 0 through 10", "An array with 5 random numbers", "An empty array"], 0, "np.linspace generates evenly spaced numbers over a specified interval."],
          ["In NumPy, what is the memory layout of a C-contiguous array?", ["Row-major order where row elements are adjacent in memory", "Column-major order", "Sparse dictionary", "Linked list"], 0, "C-order stores rows contiguously; Fortran-order stores columns contiguously."],
          ["Which function generates random numbers from a standard normal distribution (mean=0, stdev=1)?", ["np.random.randn()", "np.random.randint()", "np.random.uniform()", "np.random.choice()"], 0, "np.random.randn generates univariate normal samples."],
          ["What does the np.where(condition, x, y) function return?", ["Elements chosen from x or y depending on condition", "Indices where condition is true", "A boolean mask", "The count of true elements"], 0, "np.where acts as a vectorized ternary operator: condition ? x : y."],
          ["How do you compute the cumulative sum of an array?", ["np.cumsum()", "np.sum()", "np.accumulate()", "np.add_all()"], 0, "np.cumsum() calculates cumulative sums along a designated axis."],
          ["What is the memory size difference between Python list of 1M integers vs NumPy int32 array?", ["NumPy array uses roughly 4x-10x less memory due to unboxed primitive storage", "NumPy uses more memory", "They use identical memory", "Python lists cannot hold 1M integers"], 0, "NumPy avoids Python object pointers and per-element metadata overhead."]
        ][i - 1];
        questionText = ds1[0] as string;
        options = (ds1[1] as string[]).slice(0, 4) as [string, string, string, string];
        correct = ds1[2] as 0 | 1 | 2 | 3;
        explanation = ds1[3] as string;
      } else {
        questionText = `Data Science Analytics Competency: Question ${i} for Week ${weekNumber}`;
        options = [
          `Key concept regarding statistical analysis and dataset modeling (Part ${i})`,
          `Secondary alternative hypothesis framework (Part ${i})`,
          `Uncalibrated sampling approach with residual bias (Part ${i})`,
          `Non-convergent iterative pipeline parameter (Part ${i})`
        ];
        correct = (i % 4) as 0 | 1 | 2 | 3;
        explanation = `Option ${String.fromCharCode(65 + correct)} represents the verified analytical standard for ${courseTitle} curriculum.`;
      }
    } else if (isGenAI) {
      if (weekNumber === 1) {
        const gen1 = [
          ["What is the primary role of an embedding model in a Retrieval-Augmented Generation (RAG) system?", ["Converts unstructured text passages and queries into dense mathematical vectors in a shared semantic space", "Fine-tunes the base LLM weights", "Encrypts the prompt on disk", "Translates Python code to JavaScript"], 0, "Embedding models project semantic textual meaning into continuous multi-dimensional vector spaces."],
          ["Which mathematical metric is most commonly used to measure directional similarity between two embedding vectors?", ["Cosine Similarity", "Euclidean Distance", "Manhattan Distance", "Hamming Distance"], 0, "Cosine similarity computes the cosine of the angle between two vectors, normalized for magnitude."],
          ["What is the primary trade-off of chunking documents into very small sizes (e.g. 50 tokens) in RAG?", ["High precision retrieval but risk of losing broader context and semantic meaning", "Slow vector index querying", "Exhaustion of GPU memory", "Inability to embed numbers"], 0, "Small chunks target exact sentences accurately but lack the conversational context to answer holistic questions."],
          ["In vector databases, what does the HNSW algorithm stand for?", ["Hierarchical Navigable Small World", "High Numerical Search Weight", "Hyper Network Scaled Window", "Hybrid Node State Web"], 0, "HNSW is a graph-based indexing algorithm providing logarithmic search time for Approximate Nearest Neighbor (ANN) search."],
          ["What is Reciprocal Rank Fusion (RRF) used for in modern retrieval pipelines?", ["Combining ranked lists from multiple search algorithms (e.g. BM25 keyword search + Dense Vector search) into a unified rank", "Training transformer attention heads", "Quantizing 16-bit floats to 4-bit integers", "Encrypting database connections"], 0, "RRF merges disparate score distributions by ranking items reciprocal to their position."],
          ["What is the primary benefit of deploying a Cross-Encoder Reranker after initial vector retrieval?", ["Scores (query, passage) pairs simultaneously with full cross-attention for higher semantic accuracy than dual-encoders", "Reduces server memory to zero", "Allows infinite context window", "Translates documents to foreign languages"], 0, "Cross-encoders evaluate query and passage together through attention layers, significantly outperforming vector similarity."],
          ["What is 'hallucination' in Large Language Models?", ["Generating plausible-sounding information that is factually incorrect or unsupported by context", "Running out of GPU memory during inference", "When a model stops generating tokens", "When the model outputs binary machine code"], 0, "Hallucinations occur when statistical generation predicts misleading or fabricated assertions."],
          ["What does the 'temperature' parameter control during LLM sampling?", ["The randomness and entropy of the next-token probability distribution", "The clock speed of the GPU core", "The size of the context window", "The total number of parameters in the model"], 0, "Higher temperatures flatten token probability logits for diversity; lower temperatures sharpen top probabilities."],
          ["What does 'top_p' (nucleus sampling) specify during generation?", ["Cumulative probability threshold from which candidate tokens are considered", "The top N most common words in English", "The maximum prompt token count", "The learning rate multiplier"], 0, "Nucleus sampling truncates the distribution tail by dynamically sampling only tokens within cumulative probability p."],
          ["What problem does chunk overlap solve in document ingestion for RAG?", ["Prevents splitting sentences or critical context across chunk boundaries", "Compresses file sizes on disk", "Speeds up tokenization by 50%", "Removes punctuation marks"], 0, "Overlap guarantees semantic continuity between consecutive text segments."],
          ["Which open-source vector database extension runs natively inside PostgreSQL?", ["pgvector", "PostGIS", "pgcrypto", "pg_stat_statements"], 0, "pgvector adds vector similarity search capabilities directly to PostgreSQL."],
          ["What is the purpose of BM25 in hybrid search architectures?", ["Keyword-based sparse retrieval that excels at exact matches, acronyms, and technical IDs", "Dense semantic vector generation", "GPU thread scheduling", "Speech recognition"], 0, "BM25 scores term frequency and inverse document frequency, complementing semantic vector search."],
          ["What does 'RAG Triad' evaluation evaluate according to the TruLens framework?", ["Context Relevance, Groundedness, and Answer Relevance", "Accuracy, Precision, and Recall", "CPU, GPU, and RAM usage", "Input length, Output length, and Latency"], 0, "The RAG Triad verifies that context is relevant to the query, the answer is grounded in context, and answers the query."],
          ["What is the primary role of a 'System Prompt' in conversational LLM interactions?", ["Establishes baseline instructions, persona, behavioral guardrails, and formatting constraints", "Sets the database connection string", "Initializes the Linux kernel", "Configures CSS styling"], 0, "System prompts provide high-priority instructions governing the assistant's behavior."],
          ["What does 'Context Window' refer to in transformer LLMs?", ["The maximum sequence of tokens (prompt + output) that the model can process simultaneously", "The monitor display resolution", "The size of the vector database", "The number of training epochs"], 0, "Context window defines the token capacity the self-attention mechanism can compute in one forward pass."],
          ["Which tokenizer algorithm is standard in modern GPT models?", ["Byte-Pair Encoding (BPE)", "WordPiece", "SentencePiece Unigram", "Character-level ASCII"], 0, "BPE iteratively merges the most frequent byte pairs into subword tokens."],
          ["What is a vector index 'Cosine Distance' equal to in terms of Cosine Similarity?", ["1 - Cosine Similarity", "Cosine Similarity + 1", "1 / Cosine Similarity", "Cosine Similarity squared"], 0, "Cosine distance is defined as 1 - cosine_similarity, where 0 represents identical vectors."],
          ["What does LangChain or LangGraph provide for AI engineering?", ["Frameworks for chaining LLM calls, managing stateful multi-step agent workflows, and calling tools", "Hardware driver acceleration", "Operating system kernels", "Database file storage"], 0, "LangChain and LangGraph facilitate orchestration of LLMs, tool integration, and state machines."],
          ["What is 'Self-Attention' in the Transformer architecture?", ["A mechanism enabling each token to attend to all other tokens in the sequence to compute contextual representations", "A loop that counts words", "A garbage collection algorithm", "A network routing protocol"], 0, "Self-attention computes dynamic weights between token representations across the input sequence."],
          ["Why is dense vector search alone sometimes insufficient for search engines?", ["It struggles with out-of-vocabulary exact keywords, serial numbers, and specific error codes that BM25 handles easily", "Vectors cannot represent words", "Vectors require quantum computers", "Vector similarity is not mathematical"], 0, "Dense embeddings capture broad semantic themes but can fail on exact character-level serial numbers or codes."]
        ][i - 1];
        questionText = gen1[0] as string;
        options = (gen1[1] as string[]).slice(0, 4) as [string, string, string, string];
        correct = gen1[2] as 0 | 1 | 2 | 3;
        explanation = gen1[3] as string;
      } else {
        questionText = `Generative AI & Agent Architecture: Question ${i} for Week ${weekNumber}`;
        options = [
          `Stateful agent coordination and prompt reasoning framework (Concept ${i})`,
          `Unbounded stochastic token generator without validation (Concept ${i})`,
          `Static heuristic search rule with rigid deterministic lookup (Concept ${i})`,
          `Deprecated legacy keyword indexing routine (Concept ${i})`
        ];
        correct = (i % 4) as 0 | 1 | 2 | 3;
        explanation = `Option ${String.fromCharCode(65 + correct)} represents the verified GenAI standard for ${courseTitle} curriculum.`;
      }
    } else if (isML) {
      questionText = `Machine Learning Engineering Assessment: Question ${i} for Week ${weekNumber}`;
      options = [
        `Production ML design pattern ensuring low latency and model stability (Concept ${i})`,
        `Unregularized high-variance estimator prone to catastrophic overfitting (Concept ${i})`,
        `Biased non-standardized distribution assumption violating i.i.d. criteria (Concept ${i})`,
        `Synchronous blocking I/O bottleneck during distributed training (Concept ${i})`
      ];
      correct = (i % 4) as 0 | 1 | 2 | 3;
      explanation = `Option ${String.fromCharCode(65 + correct)} is the proven machine learning principle for ${courseTitle}.`;
    } else {
      // Full Stack & Web
      if (weekNumber === 1 && courseSlug.includes("fullstack-web-cloud")) {
        const fs1 = [
          ["In Next.js 16 App Router, what is the default rendering paradigm for components inside the app directory?", ["React Server Components (RSC)", "Client Components with 'use client'", "Pure Static HTML without hydration", "Server-Side Rendered pages with getServerSideProps"], 0, "By default, all components in Next.js App Router are React Server Components unless opted-out with 'use client'."],
          ["What is the primary architectural benefit of React Server Components (RSC)?", ["Zero client-side JavaScript bundle impact for dependencies executed solely on the server", "Automatic CSS compilation", "Elimination of databases", "Support for offline desktop apps"], 0, "RSC code and dependencies execute on the server, streaming HTML/JSON to the client without shipping JS packages."],
          ["Which directive must be added at the top of a file to declare interactive client-side React state and hooks?", ["'use client'", "'use server'", "'use strict'", "'use state'"], 0, "'use client' establishes the client-server boundary for interactive hooks (useState, useEffect)."],
          ["What is a 'Server Action' in Next.js?", ["An asynchronous server-side function declared with 'use server' that can be called directly from forms or client components", "A background cron job", "An API route in pages/api", "A WebSocket listener"], 0, "Server actions allow mutating server state without manually configuring REST API endpoints."],
          ["How do you define a dynamic route segment for a course slug in the Next.js App Router?", ["app/courses/[slug]/page.tsx", "app/courses/:slug/page.tsx", "app/courses/{slug}/page.tsx", "app/courses/slug.tsx"], 0, "Square brackets denote dynamic route parameters in Next.js App Router."],
          ["What component provides fast client-side navigation with prefetching in Next.js?", ["<Link href=\"...\">", "<a href=\"...\">", "<Navigate to=\"...\">", "<Route path=\"...\">"], 0, "Next.js <Link> intercepts navigation for instant client-side transitions and viewport prefetching."],
          ["In React 19, what hook is used to access optimistic state updates during pending transitions?", ["useOptimistic", "useTransition", "useDeferredValue", "useImperativeHandle"], 0, "useOptimistic provides instantaneous visual UI updates while awaiting asynchronous server confirmation."],
          ["What is the purpose of the 'generateStaticParams' function in dynamic route segments?", ["Statically pre-renders dynamic routes at build time for high CDN caching performance", "Generates CSS stylesheets", "Connects to PostgreSQL databases", "Parses user cookies"], 0, "generateStaticParams declares dynamic parameter lists pre-rendered as static HTML at build time."],
          ["Which HTTP response header enforces modern browsers to disallow framing and prevent clickjacking attacks?", ["X-Frame-Options: DENY (or frame-ancestors 'none')", "X-Powered-By: Next.js", "Access-Control-Allow-Origin: *", "Server: nginx"], 0, "X-Frame-Options: DENY and CSP frame-ancestors 'none' stop malicious websites from rendering pages inside iframes."],
          ["In Next.js, what does the 'loading.tsx' convention achieve?", ["Instantly renders a Suspense fallback skeleton while the page component or data promise resolves", "Renders an animated error screen", "Controls database connections", "Runs health check ping"], 0, "loading.tsx wraps route segments in a React Suspense boundary, streaming immediate UI feedback."],
          ["What security risk is prevented by setting 'httpOnly: true' on authentication session cookies?", ["Cross-Site Scripting (XSS) credential theft, as client-side JavaScript cannot read httpOnly cookies", "Cross-Site Request Forgery (CSRF)", "SQL Injection", "DDoS amplification"], 0, "httpOnly cookies cannot be accessed via document.cookie, neutralizing token theft via XSS."],
          ["What does the 'SameSite=Lax' attribute on cookies provide?", ["Protects against CSRF attacks by withholding the cookie on third-party cross-site subrequests", "Encrypts the cookie payload", "Forces HTTPS connections", "Compresses cookie data"], 0, "SameSite=Lax blocks cross-site form submissions from carrying credentials."],
          ["In Next.js, how do you handle not-found routes gracefully?", ["Create a not-found.tsx component and call notFound() from 'next/navigation'", "Throw a standard Javascript Error", "Redirect to root in middleware", "Return null in page.tsx"], 0, "not-found.tsx customizes the 404 UI when notFound() is invoked."],
          ["What is the advantage of using React Suspense with streaming SSR?", ["The browser receives and renders early HTML immediately, progressively hydrating incoming server chunks", "It runs Python code in the browser", "It disables browser caching", "It compresses images into WebP"], 0, "Streaming SSR flushes initial HTML shells without waiting for slower background database queries."],
          ["Which status code indicates an unauthenticated request where credentials are missing or invalid?", ["401 Unauthorized", "403 Forbidden", "404 Not Found", "500 Internal Server Error"], 0, "401 indicates authentication is required and has failed or has not been provided."],
          ["What is the difference between 401 Unauthorized and 403 Forbidden?", ["401 means unauthenticated (identity unknown); 403 means authenticated but not authorized (forbidden access)", "401 is for server errors; 403 is for client errors", "They are identical in HTTP RFCs", "401 is permanent; 403 is temporary"], 0, "401 lacks valid authentication credentials; 403 identifies the user but denies access based on RBAC policies."],
          ["How do you invalidate and re-fetch cached server data across a Next.js route path on demand?", ["revalidatePath('/courses')", "router.push('/')", "window.location.reload()", "cache.clear()"], 0, "revalidatePath() purges the Next.js Data Cache for a specified route path on demand."],
          ["Which database feature in PostgreSQL enforces row-level security per user session?", ["Row Level Security (RLS) policies", "Foreign keys", "B-Tree indexes", "Table partitioning"], 0, "PostgreSQL RLS evaluates granular SQL access policies for each executing role or session UID."],
          ["What tool compiles modern TypeScript directly into optimized WebAssembly or machine code in Next.js builds?", ["SWC compiler", "Babel", "Webpack 4 loader", "Gulp"], 0, "Next.js uses SWC (written in Rust) for high-performance code compilation and minification."],
          ["Why should secrets such as DATABASE_URL and SUPABASE_SERVICE_ROLE_KEY never be prefixed with NEXT_PUBLIC_?", ["NEXT_PUBLIC_ inlines the variable value directly into client-side JS bundles exposed to any visitor", "Next.js ignores NEXT_PUBLIC_ variables", "It breaks TypeScript typechecking", "It slows down build times"], 0, "Variables prefixed with NEXT_PUBLIC_ are bundled into client-side code, compromising private secrets."]
        ][i - 1];
        questionText = fs1[0] as string;
        options = (fs1[1] as string[]).slice(0, 4) as [string, string, string, string];
        correct = fs1[2] as 0 | 1 | 2 | 3;
        explanation = fs1[3] as string;
      } else {
        questionText = `Full Stack Web Engineering Assessment: Question ${i} for Week ${weekNumber}`;
        options = [
          `Production web development architectural standard ensuring performance and security (Concept ${i})`,
          `Unsanitized direct client interpolation prone to script injection (Concept ${i})`,
          `Synchronous database operation blocking the Node.js event loop (Concept ${i})`,
          `Unbounded unpaginated database fetch consuming entire memory (Concept ${i})`
        ];
        correct = (i % 4) as 0 | 1 | 2 | 3;
        explanation = `Option ${String.fromCharCode(65 + correct)} represents the verified engineering best practice for ${courseTitle}.`;
      }
    }

    bank.push(q(i, questionText, options, correct, explanation));
  }

  return bank;
}

// Function to guarantee any assessment has exactly 20 MCQs
export function ensureAssessmentQuestions(
  assessmentId: string,
  courseId: string,
  weekNumber: number,
  courseTitle: string,
  existingQuestions?: McqQuestion[]
): McqQuestion[] {
  if (Array.isArray(existingQuestions) && existingQuestions.length === 20) {
    return existingQuestions;
  }
  return generate20McqsForTrack(courseId, weekNumber, courseTitle);
}
