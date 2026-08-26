# Service Dependency & Blast Radius Analyzer 🚀

A production-grade full-stack MERN operations tool designed for engineering teams to register microservices, map dependency graphs, simulate failure/degradation scenarios, calculate exact downstream blast radius, and enforce Change Impact Gates before executing risky changes.

---

## 📸 Key Features & Architecture

- **Service Registry**: Complete CRUD management for services with attributes including team, environment (`Production`, `Staging`, `Development`), criticality (`Low`, `Medium`, `High`, `Critical`), and status (`Healthy`, `Degraded`, `Unhealthy`, `Maintenance`).
- **Dependency Mapping**: Explicit mapping of relationships between services with custom relation types (`depends_on`, `calls`, `publishes_to`, `reads_from`).
- **Interactive Service Topology Graph**: Visual graph representation of all registered services, directional dependency edges, and criticality color coding with zoom, pan, and node inspection.
- **Explicit Graph Traversal Engine**: Backend BFS traversal algorithm with cycle safety (visited set tracking minimum depth), computing direct (depth = 1) vs indirect (depth > 1) impacts and exact chain trace paths.
- **Change Impact Gate Decision Engine**:
  - `LOW IMPACT`: Only target service affected & criticality is Low/Medium.
  - `REVIEW`: Multiple downstream services affected or important dependency involved.
  - `HIGH IMPACT`: A Critical service is inside blast radius or chain reaches multiple critical services.
- **Impact Scoring (0-100)**: Formula accounting for depth decay and service criticality weights.
- **Change Preview & Pre-checks**: Automated actionable recommendations checklist (e.g. verifying health metrics, scheduling maintenance windows).
- **Audit & Simulation History**: Searchable and filterable history log storing all what-if runs and full audit trails.
- **Zero-Config Database Fallback**: Built-in `MongoMemoryServer` auto-fallback if local MongoDB instance is offline.

---

## 🛠️ Graph Traversal Approach & Algorithm

### Downstream Propagation Logic
In service topology graph:
- Edge $A \to B$ represents **$A$ depends on / calls $B$**.
- If service $B$ (e.g., `Payment DB`) suffers an outage or maintenance:
  - Service $A$ (`Payment API`) calling $B$ is **Directly Affected** (depth = 1).
  - Service $C$ (`Customer Portal`) calling $A$ ($C \to A \to B$) is **Indirectly Affected** (depth = 2).

### Traversal Implementation (`server/src/services/traversalEngine.js`)
```javascript
// 1. Build reverse adjacency list: TargetID -> DependentServices.
// 2. Initialize BFS Queue with direct dependents at depth = 1.
// 3. Maintain visited Map: serviceId -> { depth, path: [ServiceNames] }.
// 4. Process queue iteratively. If next node visited with smaller/equal depth, skip.
// 5. Format human-readable explanation: "Customer Portal is affected through Customer Portal → Payment API → Payment DB."
```

---

## 🚦 Change Impact Gate Decision Rules

| Gate Outcome | Criteria / Rule |
| :--- | :--- |
| **`LOW IMPACT`** | Only the selected target service itself is affected (0 downstream dependents affected) AND target service criticality is `Low` or `Medium`. |
| **`REVIEW`** | Multiple downstream services affected (>1) or important dependency involved, but does not meet `HIGH IMPACT` threshold. |
| **`HIGH IMPACT`** | Any service in the blast radius has criticality `Critical`, OR count of High/Critical services in blast radius $\ge 2$. |

---

## 🚀 Run Instructions

### Prerequisites
- Node.js v18+ and npm installed.

### 1. Start Backend Server
```bash
cd server
npm install
npm start
```
*Backend runs on `http://localhost:5000` (auto-uses local MongoDB or starts embedded MongoMemoryServer).*

### 2. Run Backend Unit Test Suite (Section 11 Test Cases)
```bash
cd server
npm test
```

### 3. Populate Seed Data
```bash
cd server
npm run seed
```
*(Creates 14 services and 16 dependency relationships, including multi-level chains like `Customer Portal → Order API → Order DB` and circular loops like `Alpha → Beta → Gamma → Alpha`).*

### 4. Start Frontend Console
```bash
cd client
npm install
npm run dev
```
*Access UI at `http://localhost:3000` or click the **"Seed Data"** button in top navbar.*

---

## 📡 API Endpoint Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/dashboard/summary` | `GET` | Returns operational health summary & recent simulations |
| `/api/services` | `GET`, `POST` | List all services or create a new service |
| `/api/services/:id` | `GET`, `PUT`, `DELETE` | Retrieve, update, or delete a service |
| `/api/dependencies` | `GET`, `POST`, `DELETE` | List, create, or remove dependency relationships |
| `/api/topology` | `GET` | Get full topology nodes & edges for graph visualization |
| `/api/topology/:serviceId` | `GET` | Get service-specific upstream & downstream dependencies |
| `/api/simulations/run` | `POST` | Execute what-if simulation & return blast radius breakdown |
| `/api/simulations/history` | `GET` | Retrieve searchable simulation audit log |
| `/api/seed` | `POST` | Reset & seed database with sample topology |

---

## 🧪 Minimum Test Cases Covered

1. **Single service with no dependencies**: Returns only target service (`LOW IMPACT`).
2. **One direct dependency**: Returned at depth = 1 (`Direct`).
3. **Multi-level dependency**: Indirect services returned with full path (`Customer Portal → Payment API → Payment DB`).
4. **Circular dependency**: Traversal safely terminates without infinite loops or duplicate output nodes.
5. **Critical service in blast radius**: Gate outcome evaluates to `HIGH IMPACT`.
6. **Repeated simulation**: Simulation history logs every execution without mutating topology graph.
