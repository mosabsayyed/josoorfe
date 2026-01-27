# Feature Orchestration Notebook Template

## ⚠️ Critical Understanding

**WHO DOES WHAT:**
- **Orchestrator** = AI agent (GitHub Copilot/Claude reading this notebook)
- **User** = Business owner (provides requirements, monitors progress)
- **Subagent** = Specialist AI (implements specific tasks via runSubagent tool)
- **Notebook** = Project management tool (prevents memory loss, contains ALL context)

**THE NOTEBOOK DOES NOT RUN ITSELF** - The orchestrator (AI) reads it and follows it.

---

## Step 1: Read System Architecture

**BEFORE creating task breakdown, orchestrator MUST:**

1. Read `.github/copilot-instructions.md` and include from it the relevant context for this feature
2. Understand:
   - Current technology stack
   - Coding patterns and conventions
   - Service architecture (how components connect)
   - File organization structure
   - Testing patterns
   - Integration patterns

**Example from josoorbe:**
```
Technology: Python/FastAPI, Supabase PostgreSQL, Neo4j graph
Patterns: Async/await everywhere, dependency injection
Services location: backend/app/services/
Tests location: backend/tests/
MCP tools: mcp-server/servers/mcp-router/router_config.yaml
```

---

## Step 2: Analyze Business Requirements

**User provides (business owner perspective):**
```
FEATURE: [Feature name]

BUSINESS PROBLEM:
[What problem does this solve for end users?]

DESIRED OUTCOME:
[What should users be able to do after this is built?]

INTEGRATION POINTS:
[Which parts of the system does this touch?]
```

**Example:**
```
FEATURE: Infinite Context Trace

BUSINESS PROBLEM:
Users lose context between conversation sessions. Agent can't reference
previous queries or build on earlier work.

DESIRED OUTCOME:
Agent maintains perfect memory of all queries, results, and reasoning steps
across unlimited conversation length.

INTEGRATION POINTS:
- Agent orchestrator (needs to create trace on conversation start)
- Query execution system (needs to log each query to trace)
- Frontend (needs to display trace notebooks)
```

---

## Step 3: Create Task Breakdown Table

**Orchestrator creates markdown table:**

| Task ID | Task Name | Type | Files to Create/Modify | Acceptance Criteria | Dependencies |
|---------|-----------|------|------------------------|---------------------|--------------|
| 6.1.1 | Build NotebookContextService | python_service | backend/app/services/notebook_context_service.py | (1) File exists, (2) Has create_trace_notebook() method, (3) Has append_trace_cell() method, (4) Uses .ipynb file format, (5) NO Supabase imports | None |
| 6.1.2 | Unit tests for NotebookContextService | test | backend/tests/test_notebook_context_service.py | (1) File exists, (2) pytest passes, (3) Tests create/append/get methods, (4) Validates .ipynb structure | 6.1.1 |
| 6.1.3 | Inject into orchestrator | integration | backend/app/services/orchestrator_universal.py | (1) Imports NotebookContextService, (2) Calls create_trace_notebook on conversation start, (3) Passes trace to chains_service | 6.1.2 |
| 6.1.4 | Add logging to chains_service | integration | backend/app/services/chains_service.py | (1) Accepts trace notebook param, (2) Appends query as markdown cell, (3) Appends result as code cell | 6.1.2 |
| QA_6.1 | E2E test | qa | backend/tests/test_infinite_context_e2e.py | (1) Full flow test, (2) Creates valid .ipynb file, (3) Contains query+result cells | 6.1.3, 6.1.4 |

**RULES:**
- **Task Types**: python_service, test, integration, qa, api, config, documentation
- **Complexity**: Each task = 15-60 minutes (split if longer)
- **Maximum 13 tasks** - create multiple notebooks if needed
- **Acceptance Criteria**: 3-5 SPECIFIC, TESTABLE checks (file exists, function exists, no wrong imports, etc.)
- **Dependencies**: Must form DAG (no circular dependencies)

---

## Step 4: Write Detailed Task Specifications

**For EACH task, orchestrator creates markdown cell:**

### 📋 Task 6.1.1: Build NotebookContextService

**Type**: python_service  
**Complexity**: medium (45 minutes)  
**Dependencies**: None

**Context for Subagent:**
You are building a service to manage Jupyter notebook files (.ipynb) that store conversation context traces. Each conversation gets one notebook file. The notebook IS the database - no Supabase tables involved.

**System Architecture (from copilot-instructions.md):**
- **Location**: Create `backend/app/services/notebook_context_service.py`
- **Pattern**: All methods must be `async def` (FastAPI async convention)
- **Storage**: Files go in `notebooks/context_traces/` directory
- **Error handling**: Use Python logging, raise exceptions with clear messages
- **Testing**: Will be tested with pytest-asyncio

**Files to Create:**
- `backend/app/services/notebook_context_service.py`

**Implementation Requirements:**

1. **Class structure:**
```python
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime
import json
import logging

class NotebookContextService:
    def __init__(self, notebooks_dir: str = "notebooks/context_traces"):
        # Create directory if not exists
        # Initialize logger
        
    async def create_trace_notebook(self, conversation_id: str) -> Path:
        # Create {conversation_id}.ipynb file
        # Initial structure: {"cells": [], "metadata": {...}, "nbformat": 4, "nbformat_minor": 5}
        # Add initial markdown cell with conversation_id and timestamp
        # Return Path to created file
        
    async def append_trace_cell(self, conversation_id: str, cell_type: str, content: List[str]) -> Dict:
        # cell_type: "markdown" or "code"
        # content: List of strings (notebook format)
        # Load existing notebook JSON
        # Append new cell to cells array
        # Save updated JSON
        # Return cell data
        
    async def get_trace_notebook(self, conversation_id: str) -> Dict:
        # Load and return notebook JSON
        # Raise FileNotFoundError if doesn't exist
```

2. **Notebook structure (.ipynb format):**
```json
{
  "cells": [
    {
      "cell_type": "markdown",
      "metadata": {},
      "source": ["## Context Trace\n", "Conversation: abc-123\n"]
    }
  ],
  "metadata": {
    "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"}
  },
  "nbformat": 4,
  "nbformat_minor": 5
}
```

3. **CRITICAL CONSTRAINTS:**
- ❌ NO Supabase imports (this is file-based, not database)
- ✅ Must use `json` module for .ipynb manipulation
- ✅ Must use `pathlib.Path` for file operations
- ✅ All methods `async def` (even if not awaiting - FastAPI pattern)
- ✅ Create parent directories with `parents=True, exist_ok=True`

**Acceptance Criteria:**
1. File `backend/app/services/notebook_context_service.py` exists
2. Has `create_trace_notebook()` method
3. Has `append_trace_cell()` method
4. Has `get_trace_notebook()` method
5. Does NOT import supabase (check with grep)
6. Imports `json` for notebook manipulation
7. Creates valid .ipynb files that open in Jupyter

**Output**: Working NotebookContextService class

---

## Step 5: Generate Complete Notebook

**Orchestrator generates .ipynb file with these cells:**

### Cell 1 (markdown): START HERE
```markdown
# 🚀 START HERE - Orchestrator Execution Guide

## How This Notebook Works

**Roles:**
- **Orchestrator (AI agent)**: Reads this notebook, delegates tasks, validates code
- **User (business owner)**: Monitors progress, provides feedback
- **Subagent (specialist AI)**: Implements specific tasks

## Execution Order

1. **Read Cells 2-6** - Understand system architecture and requirements
2. **Read Cell 7** - Review task breakdown table
3. **Read Cell 8** - Review all task specifications
4. **Execute Cell 9** - Mark task 1 as "in progress"
5. **Use runSubagent** - Delegate task 1 to subagent (copy spec from Cell 8)
6. **Execute Cell 10** - Validate task 1 output
7. **Repeat** for remaining tasks

## Memory-Loss Protection

This notebook contains ALL context needed. If conversation summary wipes context:
- Re-read this notebook
- Check task status in execution log (Cell 11+)
- Continue from last completed task
```

### Cell 2 (markdown): System Architecture
```markdown
## System Architecture Overview

[Copy from copilot-instructions.md:]

**Technology Stack:**
- Backend: Python 3.10+, FastAPI
- Database: Supabase (PostgreSQL), Neo4j (graph)
- Agent: MCP (Model Context Protocol)

**Key Services:**
- `orchestrator_universal.py` - Main agent
- `chains_service.py` - Query execution
- `llm_service.py` - LLM provider management

**File Structure:**
```
backend/
  app/
    services/     # Business logic
    api/routes/   # FastAPI endpoints
    db/           # Database clients
  mcp-server/     # Tool definitions
  tests/          # pytest tests
```

**Integration Pattern:**
Services injected via dependency injection in main.py
```

### Cell 3 (markdown): Feature Requirements
```markdown
## Feature: [Name]

**Business Problem:**
[From user requirements]

**Solution:**
[Technical approach]

**Integration Points:**
- Service X (needs modification)
- Service Y (new service)
- API endpoint Z
```

### Cell 4 (markdown): Technical Constraints
```markdown
## Technical Constraints

[SPECIFIC constraints from copilot-instructions.md:]

Example:
- **Storage**: Filesystem at `notebooks/context_traces/`, NOT Supabase tables
- **Async**: All service methods must be `async def`
- **Error Handling**: Use FastAPI HTTPException, log errors
- **Testing**: pytest-asyncio pattern
- **Integration**: Dependency injection via main.py
```

### Cell 5 (markdown): File Map
```markdown
## Files Created/Modified by This Feature

**New Files:**
- backend/app/services/notebook_context_service.py
- backend/tests/test_notebook_context_service.py
- backend/tests/test_infinite_context_e2e.py

**Modified Files:**
- backend/app/services/orchestrator_universal.py (inject NotebookContextService)
- backend/app/services/chains_service.py (add trace logging)
```

### Cell 6 (markdown): Integration Strategy
```markdown
## How This Feature Integrates

**Step 1**: NotebookContextService manages .ipynb files
**Step 2**: Orchestrator creates trace on conversation start
**Step 3**: Chains service appends query/results to trace
**Step 4**: Frontend renders notebook as read-only view

**Backward Compatibility:**
- Existing conversations without trace continue working
- Trace is optional enhancement
- No breaking changes to existing APIs
```

### Cell 7 (markdown): Task Breakdown Table
```markdown
## Task Breakdown

| Task ID | Task Name | Type | Files | Acceptance Criteria | Dependencies |
|---------|-----------|------|-------|---------------------|--------------|
[Insert table from Step 3]
```

### Cell 8 (markdown): Detailed Task Specifications
```markdown
## Detailed Task Specifications

[Insert all task specs from Step 4]

---

### 📋 Task 6.1.1: Build NotebookContextService
[Full spec]

---

### 📋 Task 6.1.2: Unit Tests
[Full spec]

[etc...]
```

### Cell 9 (markdown): Task 1 - EXECUTE
```markdown
## 🎯 EXECUTE: Task 6.1.1

**Orchestrator Actions:**
1. Mark task as "in progress" in execution log (Cell 11)
2. Copy task specification from Cell 8
3. Use runSubagent tool:
   ```
   runSubagent(
     prompt="<paste Task 6.1.1 full spec>",
     description="Build NotebookContextService"
   )
   ```
4. Wait for subagent completion
5. Proceed to Cell 10 for validation

**Current Status**: ⏸️ PENDING
```

### Cell 10 (markdown): Task 1 - VALIDATE
```markdown
## ✅ VALIDATE: Task 6.1.1

**Orchestrator performs QA:**

### Acceptance Criteria Checklist:
- [ ] File exists: `backend/app/services/notebook_context_service.py`
- [ ] Has method: `create_trace_notebook()`
- [ ] Has method: `append_trace_cell()`
- [ ] Has method: `get_trace_notebook()`
- [ ] No Supabase imports (check: `grep -i supabase notebook_context_service.py`)
- [ ] Imports json module
- [ ] All methods are `async def`

**Orchestrator reads file and checks each criterion:**
1. Use read_file tool to read the service file
2. Verify each acceptance criterion
3. If ALL pass → Update execution log (Cell 11): Task 6.1.1 = COMPLETED
4. If ANY fail → Send feedback to subagent, request fixes, re-validate

**Decision**: ⏸️ PENDING VALIDATION
```

### Cell 11 (markdown): Execution Log
```markdown
## 📊 Execution Log

**Project**: [Feature Name]  
**Started**: [Date]  
**Orchestrator**: AI Agent (GitHub Copilot/Claude)

### Task Status

| Task ID | Status | Started | Completed | Validation Result | Notes |
|---------|--------|---------|-----------|-------------------|-------|
| 6.1.1 | ⏸️ PENDING | - | - | - | Waiting for delegation |
| 6.1.2 | ⏸️ PENDING | - | - | - | Depends on 6.1.1 |
| 6.1.3 | ⏸️ PENDING | - | - | - | Depends on 6.1.2 |

**Legend:**
- ⏸️ PENDING - Not started
- 🔄 IN PROGRESS - Subagent working
- ✅ COMPLETED - Validated and accepted
- ❌ FAILED - Rejected, needs rework

**Update this table as tasks progress**
```

### Cell 12 (markdown): Task 2 - EXECUTE
[Same pattern as Cell 9, for Task 6.1.2]

### Cell 13 (markdown): Task 2 - VALIDATE
[Same pattern as Cell 10, for Task 6.1.2]

[Repeat pattern for remaining tasks...]

### Cell N (markdown): Integration Dashboard
```markdown
## 🎯 Feature Integration Dashboard

### Completion Status
- **Tasks Completed**: 0 / 13
- **Tests Passing**: 0 / 3
- **Files Created**: 0 / 5
- **Files Modified**: 0 / 2

### Integration Checklist
After all tasks complete:
- [ ] All unit tests pass (`pytest backend/tests/`)
- [ ] E2E test passes
- [ ] No breaking changes to existing features
- [ ] Documentation updated
- [ ] Code reviewed by orchestrator
- [ ] Ready for deployment

### Next Steps
[Updated by orchestrator as work progresses]
```

---

## Step 6: Orchestrator Execution Pattern

**For each task, orchestrator follows:**

### Phase 1: DELEGATION
1. Read task specification from Cell 8
2. Check dependencies completed (Cell 11 log)
3. Update execution log: Task X.Y.Z = 🔄 IN PROGRESS
4. Call runSubagent with full specification
5. Wait for subagent report

### Phase 2: VALIDATION (QA)
1. Read acceptance criteria from task spec
2. Use read_file tool to inspect created/modified files
3. Check EACH criterion:
   - File exists? Use file_search or read_file
   - Has function X? Use grep_search or read_file
   - No wrong imports? Use grep_search
   - Follows patterns? Read file and compare to existing code
4. Make decision:
   - ✅ ALL PASS → Update log: COMPLETED, proceed to next task
   - ❌ ANY FAIL → Provide specific feedback to subagent, re-run validation

### Phase 3: INTEGRATION
1. After all tasks completed and validated
2. Run integration tests
3. Verify no breaking changes
4. Mark feature ready for deployment

---

## Template Usage Instructions

### For Orchestrator (AI Agent):

1. **Receive business requirements** from user
2. **Read system architecture** (copilot-instructions.md)
3. **Generate notebook** using this template structure:
   - Cell 1: START HERE guide
   - Cells 2-6: Architecture, requirements, constraints
   - Cell 7: Task breakdown table
   - Cell 8: Detailed task specifications
   - Cells 9+: Execute/Validate pairs for each task
   - Last cell: Integration dashboard
4. **Execute tasks sequentially**:
   - Read task spec
   - Use runSubagent tool
   - Validate output
   - Update execution log
5. **Prevent memory loss**: All context in notebook, no reliance on chat history

### For User (Business Owner):

1. **Provide requirements** (business problem, desired outcome)
2. **Monitor progress** via execution log (Cell 11)
3. **Review completed work** when orchestrator marks ✅ COMPLETED
4. **Provide feedback** if changes needed

---

## Common Pitfalls to Avoid

❌ **Don't write Python code to automate orchestration** - Orchestrator is AI reading markdown  
❌ **Don't rely on chat memory** - All context must be in notebook  
❌ **Don't make vague acceptance criteria** - "Works correctly" is not testable  
❌ **Don't create tasks > 60 minutes** - Split into smaller atomic tasks  
❌ **Don't forget to read copilot-instructions.md** - Feature must integrate properly  
❌ **Don't skip validation** - Always QA subagent output before proceeding  
❌ **Don't have circular dependencies** - Task graph must be a DAG

✅ **Do make specific acceptance criteria** - "File X exists, has function Y, no import Z"  
✅ **Do update execution log** - Prevents losing progress  
✅ **Do read existing code** - Follow established patterns  
✅ **Do validate thoroughly** - Check each criterion explicitly  
✅ **Do provide detailed specs** - Subagent needs complete context

---

## Example: Frontend Feature

**For a React/TypeScript feature:**

Same structure, different details:

**Cell 2**: System Architecture
- Technology: React 18, TypeScript, Vite
- State: Redux Toolkit
- Routing: React Router v6
- API: Axios with base client

**Cell 4**: Technical Constraints
- All components TypeScript with proper interfaces
- Use existing API client (don't create new axios instances)
- Follow component structure: components/FeatureName/ComponentName.tsx
- Use existing design system components
- Tests: Vitest + React Testing Library

**Cell 7**: Task Breakdown
- Task 1: Create FilterContext (state management)
- Task 2: Build FilterPanel component (UI)
- Task 3: Implement useFilters hook (business logic)
- Task 4: Update ResultsGrid to consume filter state
- Task 5: E2E test with Playwright

Same execute/validate pattern, different technology stack.

---

## Meta Notes

This template is the **standardized way** to orchestrate ANY feature implementation:
- Backend (Python, Node, etc.)
- Frontend (React, Vue, etc.)
- Infrastructure (Docker, CI/CD, etc.)
- Documentation projects

The pattern is language-agnostic - only the specifics change (file paths, tech stack, patterns).

**Key principle**: Notebook is a GUIDE for the AI orchestrator, not executable automation.
