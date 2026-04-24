# TryHackMe Summit Walkthrough

## Overview
This room simulates a blue team scenario where we detect and block an adversary (Sphinx) using progressively stronger detection techniques based on the Pyramid of Pain.

---

## Task 1: Blocking sample1.exe

- Upload `sample1.exe` to Malware Sandbox
- Extract MD5 hash:
  cbda8ae000aa9cbe7c8b982bae006c2a
- Add hash in Manage Hashes to block the file

**Flag:**
THM{f3cbf08151a11a6a331db9c6cf5f4fe4}

---

## Task 2: Blocking sample2.exe

- Analyze `sample2.exe`
- Detect outbound connection to:
  154.35.10.113:4444

### Solution:
Create firewall rule:
- Type: Egress
- Source: Any
- Destination: 154.35.10.113
- Action: Deny

**Flag:**
THM{2ff48a3421a938b388418be273f4806d}

---

## Task 3: Blocking sample3.exe

- Analyze malware behavior
- Identify domain:
  emudyn.bresonicz.info

### Solution:
Create DNS filter rule:
- Domain: emudyn.bresonicz.info
- Action: Deny

**Flag:**
THM{4eca9e2f61a19ecd5df34c788e7dce16}

---

## Task 4: Blocking sample4.exe

- Detect registry modification:
  HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Defender\Real-Time Protection
- Key:
  DisableRealtimeMonitoring = 1

### Solution:
Sigma Rule:
- Log Source: Sysmon
- Event: Registry Modification
- Detect above registry key + value
- ATT&CK: Defense Evasion (TA0005)

**Flag:**
THM{c956f455fc076aea829799c0876ee399}

---

## Task 5: Analyzing outgoing_connections.log

### Findings:
- Repeated traffic to 51.102.10.19
- Packet size: 97 bytes
- Interval: Every 1800 seconds (30 mins)

→ Indicates beaconing (C2 communication)

### Solution:
Sigma Rule:
- Log Source: Sysmon
- Event: Network Connections
- Conditions:
  - Size: 97 bytes
  - Frequency: 1800 seconds
  - Remote IP/Port: Any
- ATT&CK: Command and Control (TA0011)

**Flag:**
THM{46b21c4410e47dc5729ceadef0fc722e}

---

## Task 6: Analyzing commands.log

### Findings:
- Commands output stored in:
  %temp%\exfiltr8.log
- Behavior: System discovery

### Solution:
Sigma Rule:
- Log Source: Sysmon
- Event: File Creation/Modification
- File: %temp%\exfiltr8.log
- ATT&CK: Discovery (TA0007)

**Final Flag:**
THM{c8951b2ad24bbcbac60c16cf2c83d92c}

---

## Key Takeaways

- Hashes are weak indicators
- IP-based detection can be bypassed
- Domain blocking is stronger but still bypassable
- Host artifacts improve detection
- Behavioral detection (beaconing) is more reliable
- Detecting TTPs is the strongest defense

---

## Reference
Based on TryHackMe Summit walkthrough content: :contentReference[oaicite:0]{index=0}
