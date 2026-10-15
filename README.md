# SoloQuest

SoloQuest is a browser-based solo fantasy tabletop RPG prototype with an AI Game Master, character sheet, dice, quests, inventory, companions, combat tracking, browser saves, and optional generated scene art.

## Deploy

This repository is structured for Vercel. Add these environment variables in Vercel:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional; defaults to `gpt-5.6-luna`)
- `OPENAI_IMAGE_MODEL` (optional; defaults to `gpt-image-2`)

Then deploy the repository. The OpenAI API key stays server-side.

## Current alpha features

- Free-form player actions
- Live AI Game Master endpoint with mock fallback
- Richter Belmont preset
- Visible character sheet
- App-controlled dice
- AI-requested checks
- Inventory and quests
- Companion tracking
- Basic combat/initiative state
- Browser autosave/manual saves
- Scene-art endpoint

This is an alpha prototype and is not yet a complete rules engine.
