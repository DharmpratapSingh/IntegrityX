# D1-Simple: Detailed ASCII Template & Implementation Guide

**Purpose**: Create a simplified, presentation-ready architecture diagram where Walacor is UNMISTAKABLE

**Time to Create**: 45 minutes

**Tool**: Eraser.io, draw.io, or Lucidchart

---

## 📐 Full ASCII Template

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│                    INTEGRITYX - SYSTEM ARCHITECTURE                              │
│                 Blockchain-Verified Document Integrity System                    │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────────┐
│  👥 USER LAYER                                                                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│    ┌─────────────────────┐   ┌─────────────────────┐   ┌──────────────────────┐│
│    │   🌐 Web Browser    │   │  📱 Mobile App      │   │  🔍 Third Party      ││
│    │                     │   │                     │   │  Verifier            ││
│    │   Next.js 14        │   │   React Native      │   │                      ││
│    │   Responsive UI     │   │   (Future)          │   │  Public Access       ││
│    │                     │   │                     │   │  No Auth Required!   ││
│    └─────────────────────┘   └─────────────────────┘   └──────────────────────┘│
│                                                                                  │
└─────────────────────────────────────┬────────────────────────────────────────────┘
                                      │
                                      │  HTTPS / TLS 1.3
                                      │  REST API (JSON)
                                      │
┌─────────────────────────────────────▼────────────────────────────────────────────┐
│  🎨 FRONTEND LAYER                                                               │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  Next.js 14 Application (TypeScript + React)                              │ │
│  │                                                                            │ │
│  │  Core Features:                                                            │ │
│  │  • 📤 Document Upload Interface                                           │ │
│  │  • ✅ Verification Portal (Public - No Authentication!)                   │ │
│  │  • 🔬 Forensic Diff Viewer (Side-by-side comparison)                     │ │
│  │  • 📊 Analytics Dashboard (Real-time metrics)                            │ │
│  │  • 🔗 Provenance Graph Viewer (Document lineage)                         │ │
│  │  • 🎯 Pattern Detection Dashboard                                         │ │
│  │                                                                            │ │
│  │  📁 frontend/app/(private)/documents/page.tsx                             │ │
│  │  📁 frontend/app/(private)/verification/page.tsx                          │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────┬────────────────────────────────────────────┘
                                      │
                                      │  POST /ingest-json
                                      │  POST /api/verify
                                      │  GET /api/artifacts
                                      │
┌─────────────────────────────────────▼────────────────────────────────────────────┐
│  ⚙️ BACKEND LAYER                                                                │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  FastAPI Application (Python 3.11+)                                        │ │
│  │                                                                            │ │
│  │  Core Services:                                                            │ │
│  │  • 📥 Document Ingestion & Processing                                     │ │
│  │  • 🔐 Hash Calculation (SHA-256, SHA3-512, BLAKE3)                       │ │
│  │  • ⛓️ Walacor Integration (5 Primitives)                                  │ │
│  │  • ✅ Verification Service (Public API)                                   │ │
│  │  • 🔬 Forensic Analysis Engine (4 Modules)                               │ │
│  │  • 📝 Audit Logging (Immutable trail)                                    │ │
│  │  • 🤖 AI Document Analysis (Classification, Risk scoring)                │ │
│  │                                                                            │ │
│  │  📁 backend/main.py (89 API endpoints)                                    │ │
│  │  📁 backend/src/walacor_service.py                                        │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└───────────────────┬──────────────────────────────────────┬───────────────────────┘
                    │                                      │
                    │                                      │
                    │                                      │
        ┌───────────▼─────────────┐        ┌──────────────▼──────────────────────┐
        │                         │        │                                     │
        │                         │        │                                     │
        │   ⛓️ WALACOR           │        │   💾 HYBRID STORAGE LAYER          │
        │   BLOCKCHAIN            │        │                                     │
        │                         │        │                                     │
        │  ╔══════════════════╗   │        │  ┌───────────────────────────────┐ │
        │  ║  5 PRIMITIVES:   ║   │        │  │  🗄️ PostgreSQL 16            │ │
        │  ║                  ║   │        │  │                               │ │
        │  ║  1️⃣ HASH         ║   │        │  │  Purpose:                     │ │
        │  ║  Seal document   ║   │        │  │  • Document metadata          │ │
        │  ║  hash to chain   ║   │        │  │  • Proof bundles              │ │
        │  ║                  ║   │        │  │  • Audit logs (immutable)     │ │
        │  ║  2️⃣ LOG          ║   │        │  │  • Attestations               │ │
        │  ║  Immutable       ║   │        │  │  • Provenance links           │ │
        │  ║  audit trail     ║   │        │  │                               │ │
        │  ║                  ║   │        │  │  Performance: <10ms queries   │ │
        │  ║  3️⃣ PROVENANCE   ║   │        │  └───────────────────────────────┘ │
        │  ║  Document        ║   │        │                                     │
        │  ║  lineage &       ║   │        │  ┌───────────────────────────────┐ │
        │  ║  relationships   ║   │        │  │  📦 AWS S3 (or equivalent)    │ │
        │  ║                  ║   │        │  │                               │ │
        │  ║  4️⃣ ATTEST       ║   │        │  │  Purpose:                     │ │
        │  ║  Digital         ║   │        │  │  • Large files (PDFs, images) │ │
        │  ║  certifications  ║   │        │  │  • Scalable object storage    │ │
        │  ║                  ║   │        │  │  • Cost-effective             │ │
        │  ║  5️⃣ VERIFY       ║   │        │  │                               │ │
        │  ║  Public          ║   │        │  │  Pattern: Only cryptographic  │ │
        │  ║  verification    ║   │        │  │  proofs anchored to Walacor   │ │
        │  ║  (NO AUTH!)      ║   │        │  │                               │ │
        │  ║                  ║   │        │  │  Object key format:           │ │
        │  ╚══════════════════╝   │        │  │  loans/uuid/document.pdf      │ │
        │                         │        │  └───────────────────────────────┘ │
        │  API Endpoint:          │        │                                     │
        │  13.220.225.175:80      │        │  ┌───────────────────────────────┐ │
        │                         │        │  │  ⚡ Redis 7                   │ │
        │  📁 backend/src/        │        │  │                               │ │
        │     walacor_service.py  │        │  │  Purpose:                     │ │
        │                         │        │  │  • Rate limiting (tier-based) │ │
        │  🔐 Security:           │        │  │  • Session caching            │ │
        │  • SHA-256 hashing      │        │  │  • Performance optimization   │ │
        │  • Blockchain proofs    │        │  └───────────────────────────────┘ │
        │  • Immutable records    │        │                                     │
        │                         │        │                                     │
        └─────────────────────────┘        └─────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────────┐
│  🎯 KEY COMPETITIVE DIFFERENTIATOR: CSI-GRADE FORENSIC ANALYSIS                 │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ❌ Competitors: "Document tampered" (Yes/No only)                              │
│  ✅ IntegrityX: "Here's EXACTLY what changed, when, risk level, and patterns"   │
│                                                                                  │
│  🔬 4 Forensic Analysis Modules:                                                │
│                                                                                  │
│  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────────────┐  │
│  │ 1️⃣ Visual Diff     │  │ 2️⃣ Document DNA    │  │ 3️⃣ Timeline Analysis    │  │
│  │    Engine          │  │    Fingerprinting  │  │                          │  │
│  │                    │  │                    │  │                          │  │
│  │ • Side-by-side     │  │ • 4-layer          │  │ • Modification history   │  │
│  │   comparison       │  │   fingerprint      │  │ • Event sequencing       │  │
│  │ • Field-level      │  │ • 95%+ similarity  │  │ • Time-based patterns    │  │
│  │   changes          │  │   detection        │  │ • Access logs            │  │
│  │ • Visual UI        │  │ • Find duplicates  │  │                          │  │
│  │   highlighting     │  │                    │  │                          │  │
│  └────────────────────┘  └────────────────────┘  └──────────────────────────┘  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │ 4️⃣ Pattern Detection (Cross-Document Fraud Analysis)                      │ │
│  │                                                                            │ │
│  │ Detects:                                                                   │ │
│  │ • Duplicate signatures across documents                                    │ │
│  │ • Amount manipulations (loan inflation patterns)                          │ │
│  │ • Identity reuse (SSN, address recycling)                                 │ │
│  │ • Coordinated tampering (multiple docs, same time)                        │ │
│  │ • Template fraud (same base document, different names)                    │ │
│  │                                                                            │ │
│  │ Output: Risk score 0.0-1.0 + severity (low/medium/high/critical)          │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  📁 backend/src/visual_forensic_engine.py                                       │
│  📁 backend/src/document_dna.py                                                 │
│  📁 backend/src/forensic_timeline.py                                            │
│  📁 backend/src/pattern_detector.py                                             │
│                                                                                  │
│  📊 Performance: <100ms visual diff, <200ms full forensic analysis              │
│  🎯 Accuracy: 95%+ fraud detection rate                                         │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────────┐
│  💡 HYBRID STORAGE PATTERN (Walacor Best Practice)                              │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  📦 Large Files → AWS S3                                                         │
│     • PDFs, images, videos, audio files                                         │
│     • Scalable, cost-effective storage                                          │
│     • S3 object keys stored in database for retrieval                           │
│                                                                                  │
│  ⛓️ Cryptographic Proofs → Walacor Blockchain                                   │
│     • Document hashes only (32-64 bytes)                                        │
│     • Timestamps + signatures                                                   │
│     • Transaction IDs for verification                                          │
│     • Blockchain efficiency maximized                                           │
│                                                                                  │
│  🗄️ Metadata + Proof Bundles → PostgreSQL                                       │
│     • Fast queries (<10ms)                                                      │
│     • Relational joins, full-text search                                        │
│     • Proof bundles: {tx_id, timestamp, hash, signature}                       │
│                                                                                  │
│  ❓ WHY HYBRID?                                                                  │
│  Blockchain storage is expensive and limited. By storing large files in S3,     │
│  anchoring only cryptographic proofs in Walacor, and keeping metadata in        │
│  Postgres, we achieve:                                                           │
│  • Immutability (blockchain proofs)                                             │
│  • Scalability (S3 handles any file size)                                       │
│  • Performance (Postgres for fast queries)                                      │
│  • Cost-effectiveness (no large files on blockchain)                            │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────────┐
│  🔑 LEGEND & ICON KEY                                                            │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  COLOR SEMANTICS:                                                                │
│  🟡 GOLD/YELLOW  = Walacor Blockchain (MOST IMPORTANT - unmistakable!)         │
│  🟢 GREEN        = Verified / Success / Authentic                               │
│  🔴 RED          = Tampered / Failed / Critical Alert                           │
│  🔵 BLUE         = Data in motion / Processing / Active                         │
│  🟣 PURPLE       = Forensic Analysis (Our unique differentiator!)              │
│  ⚫ GRAY         = Storage / Persistent data                                    │
│  🟠 ORANGE       = Backend services / Business logic                            │
│                                                                                  │
│  ICONS:                                                                          │
│  👥 Users / Producers / Clients                                                 │
│  🔍 Verifier / Auditor / Third Party                                            │
│  ⛓️ Walacor Blockchain / Immutable ledger                                       │
│  📦 S3 Storage / Large files                                                    │
│  🗄️ PostgreSQL / Structured database                                            │
│  ⚡ Redis / Caching / Performance                                               │
│  🔐 Encryption / Hashing / Security                                             │
│  ✅ Verified / Authentic / Pass                                                 │
│  🚨 Tampered / Alert / Security issue                                           │
│  🔬 Forensic Analysis / Investigation                                           │
│  📝 Audit Log / Event / Record                                                  │
│  🤖 AI Analysis / Machine Learning                                              │
│  🎯 Unique Feature / Differentiator                                             │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────────┐
│  📊 KEY METRICS                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│  • 49 Python Modules                    • 89 API Endpoints                      │
│  • 5 Walacor Primitives (100% coverage) • <10ms Database Queries                │
│  • 4 Forensic Analysis Modules          • <100ms Verification                   │
│  • 10 Security Layers                   • 95%+ Fraud Detection Rate             │
│  • TLS 1.3 Encryption                   • Quantum-Safe Cryptography             │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Visual Design Implementation Guide

### **Step 1: Set Up Canvas**
```
Canvas Size: 1920px × 2400px (portrait orientation)
Background: White or very light gray (#F9FAFB)
Margins: 40px on all sides
```

### **Step 2: Create Title Section** (Top)
```
Box: Full width, 120px height
Background: Linear gradient (Blue #3B82F6 → Purple #8B5CF6)
Text: "INTEGRITYX - SYSTEM ARCHITECTURE"
Font: 28pt, Bold, White color
Center aligned
```

### **Step 3: User Layer** (First Layer)
```
Box: Full width, 200px height
Background: Light blue (#DBEAFE)
Border: 2px solid #3B82F6

3 Sub-boxes (equal width, 140px height):
├─ Web Browser (Left)
├─ Mobile App (Center)
└─ Third Party Verifier (Right)

Each sub-box:
Background: White
Border: 1px solid #3B82F6
Border-radius: 8px
Icon at top (24px)
Text: 14pt, centered
```

### **Step 4: Frontend Layer** (Second Layer)
```
Box: Full width, 280px height
Background: Light blue (#DBEAFE)
Border: 2px solid #3B82F6

1 Large sub-box (90% width, 240px height):
Background: White
Border: 1px solid #3B82F6
Border-radius: 8px
Title: "Next.js 14 Application" (16pt bold)
Bullet list: 14pt, left-aligned
File references: 12pt, monospace font, gray
```

### **Step 5: Backend Layer** (Third Layer)
```
Box: Full width, 320px height
Background: Light orange (#FED7AA)
Border: 2px solid #F97316

1 Large sub-box (90% width, 280px height):
Background: White
Border: 1px solid #F97316
Border-radius: 8px
Title: "FastAPI Application" (16pt bold)
Bullet list: 14pt, left-aligned
File references: 12pt, monospace font, gray
```

### **Step 6: Walacor Blockchain Box** (Left Bottom - CRITICAL!)
```
⚠️ THIS IS THE MOST IMPORTANT BOX - MAKE IT UNMISSABLE!

Box dimensions: 45% width, 500px height
Background: BRIGHT GOLD (#FCD34D or #FBBF24)
Border: 4px solid #F59E0B (thick!)
Border-radius: 12px
Box-shadow: 0px 4px 12px rgba(245, 158, 11, 0.4) (glow effect!)

Inner box for "5 PRIMITIVES":
Background: White
Border: 3px solid #F59E0B
Border-radius: 8px
Width: 90% of parent
Height: 350px

Title: "⛓️ WALACOR BLOCKCHAIN" (20pt, BOLD)
Subtitle: "5 PRIMITIVES:" (18pt, BOLD)

Numbered list (16pt, bold numbers):
1️⃣ HASH - Seal document hash (14pt)
2️⃣ LOG - Immutable audit trail (14pt)
3️⃣ PROVENANCE - Document lineage (14pt)
4️⃣ ATTEST - Digital certifications (14pt)
5️⃣ VERIFY - Public verification (14pt)

At bottom of box:
API Endpoint: 12pt, monospace
File reference: 12pt, monospace, gray
Security features: 12pt, bullet list

⭐ ADD VISUAL EMPHASIS:
- Emoji/icon in top-left corner (large, 32px)
- Badge/ribbon saying "BLOCKCHAIN LAYER"
- Dotted lines connecting to backend layer above
```

### **Step 7: Hybrid Storage Box** (Right Bottom)
```
Box dimensions: 45% width, 500px height
Background: Light gray (#F3F4F6)
Border: 2px solid #6B7280
Border-radius: 12px

Title: "💾 HYBRID STORAGE LAYER" (18pt, bold)

3 Sub-boxes stacked vertically (each ~140px height):

├─ PostgreSQL Box
│  Background: #E0E7FF (light purple-blue)
│  Border: 1px solid #6366F1
│  Icon: 🗄️ (top-left)
│  Text: 12pt

├─ AWS S3 Box
│  Background: #FECACA (light red)
│  Border: 1px solid #EF4444
│  Icon: 📦 (top-left)
│  Text: 12pt

└─ Redis Box
   Background: #FEE2E2 (light red)
   Border: 1px solid #DC2626
   Icon: ⚡ (top-left)
   Text: 12pt

Spacing between sub-boxes: 15px
```

### **Step 8: Forensic Differentiator Section** (Below Walacor/Storage)
```
Box: Full width, 400px height
Background: Light purple (#EDE9FE)
Border: 3px solid #8B5CF6 (prominent!)
Border-radius: 12px

Title: "🎯 KEY COMPETITIVE DIFFERENTIATOR: CSI-GRADE FORENSIC ANALYSIS"
Font: 18pt, Bold, Purple color (#7C3AED)

Comparison section:
❌ Competitors: (Red text)
✅ IntegrityX: (Green text)

4 Module boxes (equal width, 120px height):
├─ Visual Diff Engine
├─ Document DNA
├─ Timeline Analysis
└─ Pattern Detection

Each module box:
Background: White
Border: 1px solid #8B5CF6
Border-radius: 6px
Icon at top (20px)
Title: 14pt, bold
Bullets: 12pt

File references at bottom: 12pt, monospace, gray
Performance metrics: 12pt, bold, green color
```

### **Step 9: Hybrid Storage Pattern Explanation**
```
Box: Full width, 280px height
Background: Light yellow (#FEF3C7)
Border: 2px solid #F59E0B
Border-radius: 8px

Title: "💡 HYBRID STORAGE PATTERN (Walacor Best Practice)"
Font: 16pt, Bold

3 Sections:
├─ 📦 Large Files → AWS S3
├─ ⛓️ Cryptographic Proofs → Walacor Blockchain
└─ 🗄️ Metadata → PostgreSQL

Each section: 14pt, with 2-3 bullet sub-points (12pt)

"WHY HYBRID?" explanation:
12pt, italic, gray text
4 bullet points explaining benefits
```

### **Step 10: Legend**
```
Box: Full width, 280px height
Background: #F9FAFB
Border: 1px solid #D1D5DB
Border-radius: 6px

Title: "🔑 LEGEND & ICON KEY" (16pt, bold)

Two columns:
├─ Left: Color semantics (12pt)
└─ Right: Icon definitions (12pt)

Use actual colored circles (●) for colors:
🟡 ● GOLD = Walacor
🟢 ● GREEN = Verified
🔴 ● RED = Tampered
etc.
```

### **Step 11: Key Metrics** (Bottom)
```
Box: Full width, 100px height
Background: #F0FDF4 (light green)
Border: 1px solid #10B981

Title: "📊 KEY METRICS" (14pt, bold)

Two columns of metrics (12pt):
Left column: System specs
Right column: Performance metrics

Use bullet points (•) to separate items
```

### **Step 12: Arrows & Connectors**
```
Between layers:
- Solid arrows (2px width)
- Color: #6B7280 (gray)
- Arrow head: 8px triangle
- Label arrows with protocols/APIs:
  "HTTPS / TLS 1.3"
  "POST /ingest-json"
  "REST API (JSON)"

Font for labels: 12pt, italic
Background for label: White with padding
Border around label: 1px dotted gray

Arrow from Backend to Walacor:
- Make thicker (3px)
- Color: Gold (#F59E0B)
- Add animation suggestion (dashed/animated)

Arrow from Backend to Storage:
- Normal thickness (2px)
- Color: Gray (#6B7280)
```

---

## 🎯 Implementation Priority Checklist

When creating in Eraser.io/draw.io, do in this order:

### Phase 1: Structure (15 min)
- [ ] Create canvas (1920×2400)
- [ ] Add title section with gradient
- [ ] Create 3 main layer boxes (User, Frontend, Backend)
- [ ] Position Walacor and Storage boxes (bottom, side-by-side)
- [ ] Add forensic section below
- [ ] Add storage pattern explanation
- [ ] Add legend and metrics at bottom

### Phase 2: Walacor Box - MAKE IT UNMISSABLE (10 min)
- [ ] Set background to BRIGHT GOLD (#FCD34D)
- [ ] Add thick 4px border (#F59E0B)
- [ ] Add box shadow / glow effect
- [ ] Make box 1.5x larger than storage box
- [ ] Add "5 PRIMITIVES" inner box with white background
- [ ] Use large bold font (18pt) for title
- [ ] Add numbered emoji list (1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣)
- [ ] Add file reference at bottom

### Phase 3: Content (15 min)
- [ ] Fill in User layer (3 boxes)
- [ ] Fill in Frontend layer (features list)
- [ ] Fill in Backend layer (services list)
- [ ] Fill in Storage boxes (PostgreSQL, S3, Redis)
- [ ] Fill in Forensic modules (4 boxes)
- [ ] Add all file references (📁 paths)

### Phase 4: Visual Polish (5 min)
- [ ] Add all icons (👥 🌐 📱 🔍 ⛓️ 📦 🗄️ ⚡ 🔬)
- [ ] Add arrows with labels
- [ ] Make Walacor arrow gold and thicker
- [ ] Add legend with colored circles
- [ ] Add key metrics
- [ ] Verify color consistency

### Phase 5: Final Check (5 min)
- [ ] Can you spot Walacor in 2 seconds? (Should be IMMEDIATE!)
- [ ] Are all 5 primitives visible?
- [ ] Is forensic differentiator clear?
- [ ] Is hybrid storage pattern explained?
- [ ] Are file references present?
- [ ] Is legend clear and consistent?
- [ ] Can diagram be understood in 30 seconds?

---

## 🎨 Color Palette (Exact Hex Codes)

Copy these exact colors into your design tool:

```
WALACOR (GOLD - UNMISSABLE!):
Background: #FCD34D or #FBBF24
Border: #F59E0B
Shadow: rgba(245, 158, 11, 0.4)

FRONTEND:
Background: #DBEAFE
Border: #3B82F6
Sub-boxes: #FFFFFF

BACKEND:
Background: #FED7AA
Border: #F97316
Sub-boxes: #FFFFFF

STORAGE:
Background: #F3F4F6
Border: #6B7280
PostgreSQL: #E0E7FF
S3: #FECACA
Redis: #FEE2E2

FORENSICS:
Background: #EDE9FE
Border: #8B5CF6
Title: #7C3AED
Sub-boxes: #FFFFFF

PATTERN EXPLANATION:
Background: #FEF3C7
Border: #F59E0B

LEGEND:
Background: #F9FAFB
Border: #D1D5DB

METRICS:
Background: #F0FDF4
Border: #10B981

TEXT COLORS:
Primary: #111827 (almost black)
Secondary: #6B7280 (gray)
Success: #10B981 (green)
Error: #EF4444 (red)
File paths: #9CA3AF (light gray)
```

---

## 📏 Exact Dimensions (for draw.io / Eraser.io)

```
CANVAS:
Width: 1920px
Height: 2400px

TITLE SECTION:
Width: 1840px (with 40px margins)
Height: 120px
Top margin: 40px

USER LAYER:
Width: 1840px
Height: 200px
Sub-boxes: 560px × 140px (3 boxes)
Spacing: 40px between boxes

FRONTEND LAYER:
Width: 1840px
Height: 280px
Sub-box: 1656px × 240px

BACKEND LAYER:
Width: 1840px
Height: 320px
Sub-box: 1656px × 280px

WALACOR BOX (LEFT):
Width: 810px (45% of 1800)
Height: 500px
Border: 4px
Box-shadow: 12px blur

STORAGE BOX (RIGHT):
Width: 810px
Height: 500px
Border: 2px
Sub-boxes: 750px × 140px each

FORENSIC SECTION:
Width: 1840px
Height: 400px
Module boxes: 420px × 120px (4 boxes)

PATTERN EXPLANATION:
Width: 1840px
Height: 280px

LEGEND:
Width: 1840px
Height: 280px

METRICS:
Width: 1840px
Height: 100px

ARROWS:
Width: 2px (normal)
Width: 3px (Walacor - special)
Arrow head: 8px
```

---

## ✅ What Makes This Work

1. **Walacor is UNMISSABLE**
   - Bright gold background (impossible to miss)
   - 4px thick border (double normal thickness)
   - Box shadow / glow effect
   - 50% larger than other boxes
   - Positioned prominently

2. **Clear Visual Hierarchy**
   - 3 horizontal layers (User → Frontend → Backend)
   - 2 bottom sections (Walacor + Storage)
   - Forensic differentiator separate
   - Legend and metrics at bottom

3. **Rubric-Aligned Content**
   - All 5 primitives listed with emojis
   - S3 storage pattern explained
   - File references shown
   - Forensic differentiator highlighted
   - Legend for consistency

4. **30-Second Comprehension**
   - Total elements: ~18 (down from 50+)
   - Clear sections
   - Visual hierarchy
   - Color-coded layers

---

## 🚀 Next Steps

1. **Open your design tool** (Eraser.io recommended)
2. **Use Phase 1-5 checklist** to create diagram systematically
3. **Copy exact colors** from the palette above
4. **Follow exact dimensions** for consistency
5. **Focus on Walacor box** - spend extra time making it UNMISSABLE
6. **Export at 3x scale** for high resolution (5760×7200 final)
7. **Save as**: `01-system-architecture-SIMPLE.png`

---

**Estimated Time**: 45 minutes
**Scoring Impact**: 30+ points (where Walacor sits is unmistakable)
**Presentation Value**: Can be explained in 30 seconds

This simplified diagram will be **dramatically more effective** than your current D1!
