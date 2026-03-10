# Arabic Grammar & Style Rules

## Contents
- Non-negotiable grammar rules
- Diacritical marks (tashkeel)
- Punctuation
- Numbers
- CSS rules for Arabic
- Sentence structure patterns

## Non-Negotiable Grammar Rules

### Shaddah (ّ)
Always include shaddah on doubled consonants:
- تحوّل (transformation)
- مُكلّف (mandated/costly)
- يُدقّق (scrutinizes)
- تفرّغ (dedication)
- سجّل (register)
- مُحدّد (specific)
- تطوّر (evolution)
- مُتكرّر (recurring)

### Hamza Placement
| Correct | Wrong | Rule |
|---|---|---|
| تتواءم | تتوائم | Hamza on seat after long vowel |
| إنّما | وانما | Hamza at word start on alif |
| مسؤول | مسأول | Hamza on waw after damma |
| تساؤل | تسائل | Hamza on waw between two vowels |
| بيئة | بيأة | Hamza on ya' seat after kasra |

### Tanween
- Use tanween for indefinite nouns in formal register: حلًّا، نظامًا، قرارًا
- Tanween fatha (ً) always sits on alif: قرارًا (NOT قراراً)
- Exception: taa marbuta takes tanween directly: بيئةً

### Common Errors to Catch
| Error | Correct | Why |
|---|---|---|
| هاذا | هذا | No alif after ha in demonstratives |
| اللذي | الذي | One lam only |
| إنشاء الله | إن شاء الله | Three separate words |
| لاكن | لكن | No alif |
| مائة | مئة | Modern standard spelling |

## Punctuation

### Arabic-Specific Marks
| Mark | Arabic | Unicode | Use |
|---|---|---|---|
| Comma | ، | U+060C | Between clauses |
| Semicolon | ؛ | U+061B | Between related sentences |
| Question mark | ؟ | U+061F | Questions |
| Period | . | Same as English | End of sentence |
| Colon | : | Same as English | Before lists/explanations |
| Quotation marks | « » | U+00AB, U+00BB | Preferred in formal Arabic |

### Rules
- NEVER use English comma (,) in Arabic text
- Ellipsis: use three dots with no space before (...)
- Parentheses: same as English but content inside is RTL
- Exclamation mark: use sparingly in formal register

## Numbers

### Arabic-Indic Numerals
Use in flowing Arabic text:
- ٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩
- Example: أكثر من ٣٠ جهة حكومية

### Western Numerals
Use in technical contexts:
- Version numbers: v2.0
- Code references
- Technical specifications
- Mixed Arabic-English content where consistency matters

### Year Convention
- In formal Arabic text: ٢٠٣٠ (Arabic-Indic)
- In UI labels/buttons: 2030 (Western) — for consistency with selectors

## CSS Rules for Arabic

### Critical: Letter Spacing
```css
/* NEVER add letter-spacing to Arabic text */
.arabic-text {
  letter-spacing: 0 !important;
  /* Arabic letters MUST connect — spacing breaks ligatures */
}
```

### Font Stack
```css
/* Recommended for Josoor */
font-family: 'Tajawal', 'Noto Sans Arabic', 'Segoe UI', sans-serif;

/* For formal documents */
font-family: 'Amiri', 'Traditional Arabic', serif;
```

### Line Height
```css
/* Arabic needs more line height than English */
.arabic-content {
  line-height: 1.8; /* vs 1.5 for English */
}
```

### Direction
```css
/* Always set on containers */
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}
```

## Sentence Structure Patterns

### Verb-First (Preferred)
Arabic naturally leads with verbs. Convert English SVO to Arabic VSO:

| English (SVO) | Arabic (VSO) |
|---|---|
| The system analyzes data | يُحلّل النظام البيانات |
| We built this platform | بنينا هذه المنصة |
| The team delivers results | يُقدّم الفريق النتائج |

### Short Sentences
Break English compound sentences into shorter Arabic ones:

**English:** "The platform, which was designed for government entities and integrates with existing systems, provides real-time analytics."

**Arabic:** "المنصة مُصمَّمة للجهات الحكومية. تتكامل مع الأنظمة القائمة. وتوفّر تحليلات لحظية."

### Active Voice
Arabic strongly prefers active voice:

| Passive (Avoid) | Active (Preferred) |
|---|---|
| تم بناء المنصة | بنينا المنصة |
| تم تحليل البيانات | حلّلنا البيانات |
| يتم تقديم التقارير | نُقدّم التقارير |

Exception: Arabic passive (بُني، حُلِّل) is acceptable when the doer is unknown or unimportant.

### Connectors
Use natural Arabic connectors, not English-style transitions:

| English Pattern | Arabic Equivalent |
|---|---|
| However | غير أنّ / إلا أنّ |
| Therefore | لذا / من هنا |
| In addition | فضلًا عن ذلك |
| On the other hand | في المقابل |
| As a result | نتيجةً لذلك |
| In order to | لـ (concise) |
| Not only... but also | ليس فحسب... بل |

### Avoid Filler
Remove these — they add nothing:

| Filler (Remove) | Why |
|---|---|
| من الجدير بالذكر أن... | Wastes reader's time |
| تجدر الإشارة إلى... | Same — empty filler |
| لا يخفى على أحد أن... | Patronizing |
| كما هو معلوم... | If it's known, don't say it |
| بطبيعة الحال... | Padding |
