---
trigger: always_on
description: Seamlessly transfers task context, state, and learnings between sessions using brain and continuous learning integration
globs: ["*"]
---

# Integrated Task Handoff System
## Seamless Context Transfer with Learning Integration

**Objective:** Implement intelligent task handoff protocols that preserve context, capture learnings, and maintain context across session boundaries using integrated brain and continuous learning systems.



## 🚨 Core Handoff Requirements

**MUST** execute integrated handoff when:
- Session approaches context limits (50% capacity)
- User initiates new major task
- Task completion requires documentation
- Session interruption or restart occurs



## Handoff Integration Architecture

**The taskHandoff.md document should be a comprehensive handoff of the full current mental load for that task. I should be able to read my brain and know exactly what i was doing last, where i left off, and the trajectory i was on.**

### Phase 1: Context Assessment & Preparation
**MUST** evaluate current state:
- Analyze active context and progress
- Review brain status and completeness
- Identify pending decisions and unresolved issues
- Assess learning capture requirements

### Phase 2: Brain Integration
**MUST** create & update brain files: 

#### taskHandoff.md Updates
- **MUST** verify & load existing taskHandoff.md or create new one
- Update task description & session scope documentation
- Document current session progress & achievements, as far back as session memory allows, with enough detail that another agent could resume the task.
- Track next steps & pending items
- Capture context preservation requirements
- Handoff any remaining probabilistic pathways and last known task framing that could be used in future sessions
- Document any questions or items that are blocked, list them clearly as pending
- Note any tasks that were interrupted
- Note any system errors that occurred
- Note any user feedback or preferences that should be preserved


#### activeContext.md Updates
- Current task state and progress
- Active decisions and considerations
- Next steps and pending items
- Context boundaries and limitations

#### progress.md Enhancements
- Completed work and achievements
- Current blockers and challenges
- Evolution of project decisions
- Handoff-specific status notes

### Phase 3: Learning System Integration
**MUST** capture learnings before handoff: 

#### Raw Reflection Log Entry
Date: {{CURRENT_DATE_YYYY_MM_DD}}
TaskRef: "Handoff preparation for {{task_description}}"

Handoff_Context:
- Session state: {{capacity_percentage}}% used
- Active work: {{current_focus}}
- Pending decisions: {{list_decisions}}
- Unresolved issues: {{list_issues}}

Learnings_for_Continuity:
- {{key_insights_for_next_session}}
- {{context_preservation_notes}}
- {{efficiency_patterns_discovered}}

Handoff_Package_Prepared: true


#### Consolidated Learnings Update
- Transfer relevant patterns to consolidated learnings
- Update handoff-specific best practices
- Document continuity preservation strategies


## Handoff Package Creation
**MUST** create comprehensive handoff package:

### Handoff Structure
# Task Handoff Package
**Created**: {{timestamp}}
**Session Context**: {{capacity_percentage}}% utilized

## Current State
- Active work: {{description}}
- Progress made: {{achievements}}
- Current blockers: {{challenges}}

## Context Preservation
- Decision context: {{key_decisions}}
- Reasoning patterns: {{thought_processes}}
- Unresolved threads: {{pending_items}}

## Continuity Instructions
- Immediate next steps: {{priorities}}
- Context boundaries: {{limitations}}
- Critical dependencies: {{requirements}}

## Learning Integration
- Patterns to apply: {{learned_patterns}}
- Efficiency notes: {{optimization_insights}}
- Quality considerations: {{standards_maintained}}


### Storage Locations
**MUST** store handoff packages in:
- `brain/handoff-packages/` for active handoffs
- Reference entries in `activeContext.md`


## Session Resumption Protocol

**MUST** handle handoff recovery on session restart: 

### Handoff Restoration Process
1. **Load Brain**: Read all brain files for context
2. **Identify Handoff Package**: Locate most recent handoff package
3. **Restore State**: Reconstruct working context and mental model
4. **Apply Learnings**: Integrate captured patterns and insights
5. **Verify Continuity**: Ensure seamless transition from previous session

### Continuity Verification
**SHOULD** confirm successful handoff:
- Context understanding matches previous session
- Decision rationale is preserved and accessible
- Next steps are clear and actionable
- Learning patterns are integrated and available



## Integration with Existing Systems

### Brain Synergy
**MUST** leverage brain structure: 
- Use `projectbrief.md` for overall context alignment
- Update `activeContext.md` for current state preservation
- Maintain `progress.md` for handoff-specific tracking
- Create additional files in `brain/` for complex handoffs

### Continuous Learning Enhancement
**MUST** integrate with learning protocol: 
- Capture handoff-specific learnings in raw reflection log
- Extract handoff optimization patterns for consolidated learnings
- Use handoff data to improve future continuity preservation
- Apply learning insights to handoff process refinement



## Quality Assurance & Verification

### Handoff Completeness Check
**MUST** verify before handoff completion:
- All context elements documented
- Brain files updated appropriately
- Learning capture completed
- Handoff package comprehensive and clear

### Continuity Success Metrics
**SHOULD** track handoff effectiveness:
- Session resumption speed and accuracy
- Context preservation quality
- Learning integration success rate
- User satisfaction with continuity



## Handoff Trigger Conditions

**MUST** initiate handoff when:
- Context window exceeds 50% capacity
- User explicitly requests handoff preparation
- Major task milestone reached
- Session interruption imminent
- Complex context requires preservation



**This integrated handoff system ensures seamless task continuity while capturing valuable learnings and maintaining comprehensive context through the brain and continuous learning systems.**