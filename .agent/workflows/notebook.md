---
description: # Work Notebook Creation Prompt (Self-Sufficient)  Use this prompt to create structured work notebooks for complex technical tasks in any repository.
---

---

## PROMPT START

Create a Jupyter notebook at `notebooks/[task_name]_work.ipynb` to track this work.

**CRITICAL:** Each section below is shown as a markdown template. You must create these as MARKDOWN CELLS in the Jupyter notebook, not as code blocks. The content shown in triple-backtick blocks below represents what should go INSIDE each markdown cell.

### Notebook Structure Requirements

The notebook MUST have these 6 sections as separate markdown cells in this exact order:

---

#### SECTION 1: ACTIVE TASK HEADER (Top of Notebook)

**Create as:** Single markdown cell  
**Cell content template below:**

```markdown
# 🚨 ACTIVE TASK: [Task Name] - START HERE 🚨

## Quick Start for New Session

**Command to resume:** "Read the [task_name] notebook and continue"

---

## Task Summary

**Status:** [Investigation | Implementation | Testing | Complete]
**Last Updated:** [Current Date]
**Blocker:** [None | Description if blocked]

**Objective:** [Clear 1-2 sentence description of what needs to be accomplished]

**Root Cause:** [Brief description of the problem - add after investigation]

**Result if not fixed:** [Impact/consequences]

---

## Implementation Requirements

### MANDATORY: Use Orchestration (Not Direct Implementation)

**WHEN ORCHESTRATION IS REQUIRED:**
- Multi-file changes (3+ files)
- Complex implementations requiring multiple steps
- Tasks spanning multiple sessions
- Critical fixes where context preservation is essential
- ANY task where you might lose context mid-implementation

**WHEN YOU CAN WORK DIRECTLY (exceptions):**
- Single-file edits with clear scope
- Simple fixes under 20 lines of code
- Quick documentation updates
- Trivial configuration changes

**WHY ORCHESTRATION MATTERS:**
- Main session preserves complete project context through completion
- Prevents context drift during complex implementations
- Allows focused subagents to handle execution while main agent validates
- Maintains oversight from investigation → implementation → testing

**Approach:**
1. Main session reads this notebook and understands full context
2. Launch subagent with detailed implementation instructions from Section 4
3. Subagent performs code changes
4. Subagent reports back what was changed
5. Main session validates and continues with testing

---

## Where to Find Everything

### Documentation Location
- **This Notebook:** `notebooks/[task_name]_work.ipynb`
- **Investigation:** Section 2 below
- **Solution Design:** Section 3 below
- **Implementation Details:** Section 4 below (THE EXACT CODE CHANGES)
- **Testing Plan:** Section 5 below

### Key Code Files
[To be populated during investigation - will include file paths and line numbers]

### Database/Config Context
[To be populated during investigation - will include table names, column details, config file paths]

---

## Success Criteria

After implementation:
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]
- [ ] No syntax errors or import issues
- [ ] Tests pass

---

## Next Steps After Implementation

1. **Validation:** Check for errors
2. **Testing:** Run unit tests
3. **Manual Test:** [Specific test scenario]
4. **Verification:** [How to confirm it works]

---

## Investigation History

**Session Date:** [Date]
- [What was investigated]
- [What was discovered]
- [Key findings]

[Add entries as work progresses]

---

## 🎯 ACTION ITEM FOR NEW SESSION

1. Read Sections 2-5 in this notebook
2. [If implementation needed] Launch subagent with instructions from Section 4
3. [If testing needed] Execute test plan from Section 5
4. Review results and proceed to next phase

**Do NOT implement directly** - orchestrate to preserve context.
```

---

#### SECTION 2: INVESTIGATION & FINDINGS

**Create as:** Single markdown cell  
**Cell content template below:**

```markdown
# Investigation & Analysis

## Problem Statement

[Detailed description of the issue or requirement]

### Symptoms/Observations
- Symptom 1: [What's observed]
- Symptom 2: [What's observed]
- Symptom 3: [What's observed]

---

## Investigation Process

### Step 1: [Investigation Step Name]
**What we checked:** [What was examined]
**Files analyzed:** 
- `path/to/file.py` (lines X-Y) - [what it does]
- `path/to/other.py` (lines A-B) - [what it does]

**Findings:**
[What was discovered]

### Step 2: [Investigation Step Name]
**What we checked:** [What was examined]
**Tools used:** [grep_search, semantic_search, read_file, etc.]

**Findings:**
[What was discovered]

[Repeat for each investigation step]

---

## Root Cause Analysis

**Primary Issue:**
[Detailed explanation of the root cause]

**Why it's broken:**
1. [Reason 1]
2. [Reason 2]
3. [Reason 3]

**Evidence:**
- File: `path/to/file` (line X): [Code showing the issue]
- File: `path/to/file` (line Y): [Code showing the issue]

---

## Key Discoveries

### Discovery 1: [Title]
**Impact:** [How this affects the system]
**Details:** [Explanation]
**Code Location:** `path/to/file.py:123-145`

### Discovery 2: [Title]
**Impact:** [How this affects the system]
**Details:** [Explanation]
**Code Location:** `path/to/file.py:234-256`

[Repeat for each major discovery]

---

## Current State Documentation

### How It Works Now (Broken)

**Flow:**
```
Step 1: [What happens]
    ↓
Step 2: [What happens]
    ↓
Step 3: ❌ [Where it breaks]
    ↓
Result: [Bad outcome]
```

**Code Locations:**
- `file.py:100-120` - [What this code does]
- `file.py:200-220` - [What this code does]

### Related Components

| Component | Purpose | Status | Location |
|-----------|---------|--------|----------|
| [Component 1] | [What it does] | ✅ Works / ❌ Broken | `path/to/file` |
| [Component 2] | [What it does] | ✅ Works / ❌ Broken | `path/to/file` |

---

## Database/Configuration Context

### Database Schema
**Table:** `table_name`
**Relevant Columns:**
- `column1`: [What it stores] - [Current value/status]
- `column2`: [What it stores] - [Current value/status]

### Configuration Files
**File:** `path/to/config.yaml`
**Relevant Settings:**
```yaml
setting1: value
setting2: value
```

### Environment Variables
- `ENV_VAR_1`: [What it controls] - [Status]
- `ENV_VAR_2`: [What it controls] - [Status]

---

## Dependencies Analysis

**External Libraries:**
- `library-name==version` - [Purpose] - [Status: installed/missing]

**Internal Dependencies:**
- Module/Service 1 - [How it's used]
- Module/Service 2 - [How it's used]
```

---

#### SECTION 3: SOLUTION DESIGN

**Create as:** Single markdown cell  
**Cell content template below:**

```markdown
# Solution Design

## High-Level Approach

**Strategy:** [Overall approach to solving the problem]

**Why this approach:**
1. [Reason 1]
2. [Reason 2]
3. [Reason 3]

---

## Changes Required

### Change 1: [Title]
**File:** `path/to/file.py`
**Method/Function:** `method_name()`
**Lines:** X-Y

**What needs to change:** [Description]
**Why:** [Explanation]
**Impact:** [What this affects]

### Change 2: [Title]
**File:** `path/to/file.py`
**Method/Function:** `method_name()`
**Lines:** A-B

**What needs to change:** [Description]
**Why:** [Explanation]
**Impact:** [What this affects]

[Repeat for each required change]

---

## Architecture Impact

### Before (Current - Broken)

```
Component A
    ↓
Component B ❌ [What's wrong]
    ↓
Component C
    ↓
Result: [Bad outcome]
```

### After (Fixed)

```
Component A
    ↓
Component B ✅ [What's fixed]
    ↓
Component C
    ↓
Result: [Good outcome]
```

---

## Data Flow Changes

**Before:**
```
Input → Process 1 → ❌ Fails here → No output
```

**After:**
```
Input → Process 1 → ✅ Fixed logic → Process 2 → Correct output
```

---

## Key Design Decisions

### Decision 1: [Title]
**What:** [What was decided]
**Why:** [Rationale]
**Alternative considered:** [What else was considered and why rejected]

### Decision 2: [Title]
**What:** [What was decided]
**Why:** [Rationale]
**Alternative considered:** [What else was considered and why rejected]

---

## Edge Cases & Considerations

**Edge Case 1:** [Scenario]
- **Handling:** [How solution addresses it]

**Edge Case 2:** [Scenario]
- **Handling:** [How solution addresses it]

---

## Backwards Compatibility

**Breaking changes:** [Yes/No]
**Migration required:** [Yes/No]
**Deployment considerations:** [Any special steps needed]
```

---

#### SECTION 4: IMPLEMENTATION DETAILS

**Create as:** Single markdown cell  
**Cell content template below:**

```markdown
# Implementation Details

## Overview

**Number of files to change:** X
**Estimated complexity:** [Low/Medium/High]
**Dependencies to add:** [List or "None"]

---

## Code Changes (Exact Copy-Paste Ready)

### Change 1: [Title]

**File:** `path/to/file.py`
**Method:** `method_name()`
**Lines:** X-Y

**Current Code:**
```python
# Show the EXACT current code with context
def method_name():
    # Current implementation
    current_line_1
    current_line_2
    current_line_3  # This line is broken
    current_line_4
```

**New Code:**
```python
# Show the EXACT replacement code with same context
def method_name():
    # Fixed implementation
    current_line_1
    current_line_2
    fixed_line_3  # This line is now correct
    current_line_4
```

**Explanation:** [Why this specific change fixes the issue]

**Testing:** [How to verify this change works]

---

### Change 2: [Title]

**File:** `path/to/file.py`
**Method:** `method_name()`
**Lines:** A-B

**Current Code:**
```python
# Exact current implementation
```

**New Code:**
```python
# Exact fixed implementation
```

**Explanation:** [Why this change is needed]

**Testing:** [How to verify this change works]

---

[Repeat for each code change]

---

## New Files to Create

### File 1: `path/to/new/file.py`

**Purpose:** [Why this file is needed]

**Content:**
```python
# Complete file content here
```

---

## Files to Delete

- `path/to/old/file.py` - [Why it's no longer needed]

---

## Import Changes

**Add these imports:**
```python
from module import NewClass
import new_library
```

**Remove these imports:**
```python
from module import OldClass  # No longer needed
```

---

## Configuration Changes

### File: `path/to/config.yaml`

**Add/Modify:**
```yaml
new_setting: value
updated_setting: new_value
```

---

## Database Migrations

**Required:** [Yes/No]

**Migration Script:**
```sql
-- Migration up
ALTER TABLE table_name ADD COLUMN new_column TYPE;
UPDATE table_name SET new_column = 'value' WHERE condition;

-- Migration down (rollback)
ALTER TABLE table_name DROP COLUMN new_column;
```

---

## Environment Variables

**Add to `.env`:**
```bash
NEW_VAR=value
```

**Update in deployment:**
- Production: [What to set]
- Staging: [What to set]

---

## Dependencies to Install

**Add to `requirements.txt` / `package.json`:**
```
library-name>=version
```

**Installation command:**
```bash
pip install library-name
# or
npm install library-name
```
```

---

#### SECTION 5: TESTING & VALIDATION

**Create as:** Single markdown cell  
**Cell content template below:**

```markdown
# Testing & Validation Plan

## Pre-Implementation Checklist

- [ ] All investigation complete
- [ ] Root cause confirmed
- [ ] Solution design reviewed
- [ ] Code changes documented with exact locations
- [ ] Edge cases identified
- [ ] Dependencies verified

---

## Unit Tests

### Test 1: [Test Name]

**Purpose:** Verify [what is being tested]

**Test File:** `tests/test_[module].py`

**Test Code:**
```python
import pytest
from module import function_to_test

def test_[specific_behavior]():
    """Test that [expected behavior]"""
    # Arrange
    input_data = [setup]
    
    # Act
    result = function_to_test(input_data)
    
    # Assert
    assert result == expected_value
    assert condition is True
```

**Success Criteria:**
- [ ] Test passes
- [ ] Covers edge case X
- [ ] Validates output format

---

### Test 2: [Test Name]

[Similar structure]

