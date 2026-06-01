<!--
Melotech take-home implementation documentation.
Prepared as a deterministic planning package for a senior developer.
Code blocks are intentionally avoided except for short structural references where clarity requires it.
-->

# Design Language

## Source of inference

This design language is inferred from Melotech's public website and brand messaging.

The public site presents Melotech as a high-contrast, art-and-technology media company with a bold editorial tone, large typography, monochrome presentation, repeated kinetic words, and language centered around music, video, communities, culture, and movement.

This file should guide the UI so the assignment does not look like a generic SaaS dashboard.

## Brand personality

The UI should feel:

- Artistic but controlled.
- Technical but not cold.
- Editorial, bold, and minimal.
- Music/media-native.
- Premium and stealth-like.
- Fast-moving but not chaotic.

Avoid making it look like:

- A generic admin panel.
- A pastel startup dashboard.
- A crypto DeFi interface.
- A colorful consumer music app.
- A default shadcn/ui installation.

## Core visual direction

Use a dark, stage-like interface with sharp typography, soft glass panels, and strong contrast.

The product should feel like an internal creative operations console for an AI-native entertainment company.

## Color system

Use a mostly monochrome palette. Color should be used sparingly for status, charts, and platform identity.

### Core tokens

- Background primary: near-black, `#050505`.
- Background elevated: soft black, `#0D0D0D`.
- Surface glass: translucent black with white border, `rgba(255,255,255,0.06)`.
- Text primary: warm white, `#F5F2EA`.
- Text secondary: muted grey, `#A7A7A7`.
- Text tertiary: dark grey, `#6F6F6F`.
- Border subtle: `rgba(255,255,255,0.12)`.
- Border active: `rgba(255,255,255,0.32)`.
- Shadow: black with soft blur.

### Functional colors

Use functional colors only for state, not decoration.

- Success: muted acid green, `#B8FF6A`.
- Warning: warm amber, `#FFE16A`.
- Error: soft red, `#FF6B6B`.
- Processing: cool blue-violet, `#9D8CFF`.
- Cache fallback: muted cyan, `#79E6F2`.

### Platform accents

Use platform accents only as small chips or icon highlights. Do not let them dominate the brand.

- Spotify chip: green accent.
- TikTok chip: cyan/pink split accent.
- YouTube chip: red accent.

## Typography

### Headings

Use bold, uppercase, editorial-style headings.

Rules:

- Prefer uppercase for page titles and section headers.
- Use tight letter spacing for large headings.
- Use large type sizes for hero/dashboard title areas.
- Keep headings short and direct.

Examples:

- “DISTRIBUTION PIPELINE”
- “MULTI-PLATFORM OUTPUT”
- “AUDIENCE TARGETING”
- “CREDIT USAGE”

### Body text

Use clean, highly readable sans-serif text.

Rules:

- Body text should be concise.
- Avoid long paragraphs in the UI.
- Use muted text for descriptions.
- Use mono-style treatment for IDs, statuses, and metadata.

## Layout principles

### General layout

- Use a dark full-page canvas.
- Keep a strong left-to-right workflow: input → processing → outputs → history.
- Use cards with thin borders and glass-like backgrounds.
- Use generous spacing.
- Avoid dense tables unless on the usage/history pages.

### Dashboard layout

Recommended desktop layout:

- Top bar: product name, user menu, credits balance, usage link.
- Left/upper panel: prompt and targeting inputs.
- Main section: side-by-side platform outputs.
- Lower section or secondary panel: recent history.

Recommended mobile layout:

- Single-column flow.
- Platform output cards stack vertically.
- Credits and user menu collapse into a compact top bar.
- History and usage remain accessible through navigation tabs or menu.

## Components

### Buttons

Primary button:

- Dark glass or white-on-black depending on context.
- Clear active border.
- Slight glow on hover.
- Label should be action-oriented: “Generate Outputs”, “Add 100 Credits”.

Secondary button:

- Transparent glass background.
- Thin border.
- Muted text.

Danger/destructive button:

- Avoid unless needed.
- Use only for sign out or destructive actions.

### Cards

Use cards for:

- Platform outputs.
- Generation status.
- Credit balance.
- Usage chart.
- History items.

Card rules:

- Rounded corners, but not cartoonish.
- Thin border.
- Subtle background gradient or glass effect.
- Clear title area.
- Status chip in the top-right when useful.

### Chips

Use chips for:

- Platform names.
- Status.
- Region.
- Age range.
- Gender.
- Source: LLM or Cache.

Chip style:

- Small.
- Uppercase or title case.
- Thin border.
- Muted background.

### Charts

Usage charts should be minimal.

Rules:

- One chart per view.
- Default timeframe: daily.
- Weekly and monthly selectable through segmented controls.
- Avoid bright chart palettes.
- Use one main line or bar color from the functional palette.

### Forms

Forms should feel like creative prompt tools, not enterprise settings pages.

Rules:

- Prompt input should be visually prominent.
- Platform selector should be immediate and tactile.
- Audience region should feel like a strategic optimization option.
- Keep labels clear.
- Keep helper text short.

## Motion

Motion should be subtle and music/media-inspired.

Good uses:

- Slow marquee text for background decorative words.
- Gentle pulse for processing statuses.
- Smooth card reveal when outputs complete.
- Progress shimmer for pending platform cards.
- Soft hover movement on cards.

Avoid:

- Loud bouncing animations.
- Excessive confetti.
- Distracting continuous motion in primary content.

## Copywriting tone

Use bold, concise, product-minded language.

Good examples:

- “Prepare one concept for every platform.”
- “Adapt metadata to the audience before distribution.”
- “Credits are captured only when output succeeds.”
- “Processing continues in the background.”

Avoid:

- “Welcome to your AI-powered SaaS dashboard.”
- “Generate amazing content instantly!”
- Generic startup copy.

## UI states

Every async element must have explicit states:

- Pending.
- Processing.
- Completed.
- Failed.
- Completed from cache.

Every platform output card must clearly show its state.

Every credit-consuming action must clearly show:

- Cost before submission.
- Current available credits.
- Reserved credits if a generation is processing.
- Final consumed credits after completion.

## Accessibility

- Maintain strong contrast between text and background.
- Do not rely only on color for statuses.
- Use visible focus states.
- Keep form validation messages readable.
- Ensure mobile tap targets are large enough.

## Implementation standards

### UI component library

Use shadcn/ui components as the base layer for all UI elements.

Rules:

- Install shadcn/ui components through the official CLI or registry.
- Customize shadcn primitives with the color, typography, and spacing tokens defined in this document.
- Leverage the shadcn MCP server when available to browse, install, or configure components.
- Do not leave components in their default theme; override styles to match the dark, monochrome, glass-heavy aesthetic.

### Icons

Use the Lucide icons package for every icon in the interface.

Rules:

- Import icons from `lucide-react` (or the framework-specific Lucide port).
- Keep icons monochrome unless a platform accent calls for color.
- Use consistent icon sizing: small for chips and inline metadata, medium for buttons and navigation, large for empty states.
- Prefer simple, geometric shapes over illustrative or multi-color icon sets.

## Design summary

The UI should feel like a stealth-mode AI media operations console: dark, premium, typographic, kinetic, and structured.
