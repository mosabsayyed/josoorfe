---
name: perfecting-arabic
description: Reviews and perfects Arabic translations for the Josoor project. Use when checking, writing, or revising any Arabic content including i18n JSON files, HTML pages, UI text, or founder letter content. Ensures intent-based translation with natural flow, proper grammar, and Saudi government register. Triggers on phrases like "check the Arabic", "fix Arabic", "translate to Arabic", "Arabic content", or when editing ar.json or founder-ar.html files.
---

# Perfecting Arabic for Josoor

## Core Philosophy

Arabic text must read as if **originally written in Arabic** — never as a translation.

- **Intent-based**: The MEANING and EMOTIONAL IMPACT must match the English, not the words
- **Audience**: Saudi government decision-makers (vice ministers, strategy directors, PMO managers)
- **Register**: Authoritative, confident, concise. A respected advisor speaking to peers. Not academic. Not casual.
- **Structure**: Arabic sentence structure differs from English — restructure freely. Short punchy sentences work.

## Review Process

When asked to "check the Arabic" or review Arabic content:

1. **Read the English source** — understand the INTENT, not the words
2. **Read the Arabic version**
3. **For each paragraph, ask these 4 questions:**
   - Does the Arabic convey the same INTENT, or just the same WORDS?
   - Would a native reader feel this was written FOR them, or translated AT them?
   - Is the sentence structure natural Arabic, or English grammar with Arabic words?
   - Would a Saudi government director nod reading this, or cringe?
4. **Flag issues** with specific alternatives and reasoning
5. **For HTML files**: Only modify text content — never touch HTML structure, CSS, or JS

## Anti-Patterns to Catch

These are the most common failures. See [./anti-patterns-and-glossary.md](./anti-patterns-and-glossary.md) for the complete table.

**Critical patterns to catch immediately:**

| Pattern | Why it fails |
|---|---|
| Word-for-word mapping | Arabic has different sentence flow — restructure |
| English idioms translated literally | Find the Arabic equivalent idiom or rephrase |
| Passive voice everywhere | Arabic prefers active voice |
| Long compound English-style sentences | Break into 2-3 shorter Arabic sentences |
| تخلّف used alone | Offensive — always use التخلّف عن الركب |
| كيانات for government bodies | Too abstract — use جهات حكومية |
| معيارية for "modular" | Means "standardized" — use مرنة |

## Arabic Grammar Essentials

See [./grammar-and-style-rules.md](./grammar-and-style-rules.md) for complete rules.

**Non-negotiable rules:**

- **Shaddah (ّ)**: Always include: تحوّل، مُكلّف، يُدقّق، تفرّغ، سجّل
- **Hamza**: Correct placement: تتواءم (NOT تتوائم), إنّما (NOT وانما)
- **CSS**: NEVER add letter-spacing to Arabic text (letter-spacing: 0)
- **Punctuation**: Arabic comma (،) not English (,). Arabic question mark (؟).
- **Numbers**: Arabic-Indic (٢٠٢٥) in flowing text, Western in technical contexts

## Josoor Glossary (Key Terms)

See [./anti-patterns-and-glossary.md](./anti-patterns-and-glossary.md) for the full glossary.

**Critical terms that must be consistent:**

| English | Arabic | Notes |
|---|---|---|
| JOSOOR | جسور | Platform name = "bridges" |
| Transformation Intelligence | الذكاء التحوّلي | NOT ذكاء التحوّل |
| Operating System | نظام تشغيل | |
| Beta | النسخة التجريبية | NOT بيتا |
| entities (gov) | جهات حكومية | NOT كيانات |

## Tone Calibration

**Landing page & founder letter:**
- Confident but humble — "We built this" not "We humbly present"
- Direct — no filler like "من الجدير بالذكر أن..."
- Aspirational — reader should feel excited
- Personal — a real person speaking, not a corporate statement

**UI/app text:**
- Shortest possible text that conveys meaning
- Actionable — tell user what to do, not what happened
- Consistent — same term = same Arabic word everywhere

## File-Specific Guidelines

**`i18n/ar.json`:**
- Only modify keys actually rendered (check component code first)
- Preserve JSON structure exactly
- Don't break string interpolation ({{variables}})

**`founder-ar.html`:**
- Only modify text inside HTML tags
- Preserve all `<em>`, `<br>`, `style=` attributes
- Maintain RTL direction

**New Arabic content:**
- Write fresh in Arabic, don't translate from English draft
- Reference English only for intent alignment

## Quality Checklist

Before declaring Arabic content done:

```
Arabic Quality Check:
- [ ] No literal translations — every sentence reads naturally
- [ ] Proper shaddas on all words that need them
- [ ] Correct hamza placement
- [ ] No English grammar patterns forced into Arabic
- [ ] Government register maintained
- [ ] All Josoor terms use approved glossary
- [ ] Arabic punctuation used (، not ,)
- [ ] No letter-spacing on Arabic CSS
- [ ] Emotional impact matches English intent
- [ ] A Saudi director would nod, not cringe
```
