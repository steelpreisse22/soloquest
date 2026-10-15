import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const RULES = `You are the Game Master for a solo fantasy tabletop RPG.
The player controls only their own character. Never choose their dialogue or actions for them.
You control NPCs, enemies, companions, hidden information, pacing, environment, and consequences.
NPCs and companions may only use information they plausibly know.
Do not railroad. Negotiation, stealth, retreat, surrender, investigation, and creative plans are valid.
The application owns tracked state such as HP, inventory, quests, conditions, companion HP, and combat state.
Return ONLY valid JSON with this exact top-level shape:
{"narrative":"string","roll":null,"events":[],"scene":{}}
A roll may instead be {"label":"Stealth","dice":"1d20","modifier":5,"reason":"Remain unseen"}.
Allowed event objects include:
{"type":"damage","target":"player","amount":3}
{"type":"heal","target":"player","amount":3}
{"type":"add_item","name":"Iron Key","qty":1}
{"type":"remove_item","name":"Torch","qty":1}
{"type":"quest_add","id":"id","title":"Title","detail":"Detail"}
{"type":"quest_update","id":"id","status":"completed"}
{"type":"condition_add","target":"player","name":"Poisoned"}
{"type":"condition_remove","target":"player","name":"Poisoned"}
{"type":"companion_hp","id":"id","delta":-2}
{"type":"combat_start","enemies":[{"id":"enemy-1","name":"Bandit","initiative":12,"hp":8,"ac":12}]}
{"type":"combat_end"}
If a player roll is required, request the roll and do not resolve the outcome until the roll result is sent back.
Keep turns atmospheric but concise and playable, normally 2-7 short paragraphs.`;

function fallback(action, character) {
  const a = String(action || "").toLowerCase();
  const skills = character?.skills || {};
  if (/(look|observe|scan|study|search)/.test(a)) {
    return { narrative: `${character?.name || "The adventurer"} slows down and studies the scene carefully. The obvious details are easy to read, but the more useful clues may be hidden in posture, tracks, or small inconsistencies.`, roll: { label: "Perception", dice: "1d20", modifier: Number(skills.perception || 0), reason: "Notice subtle details." }, events: [], scene: {}, mode: "mock" };
  }
  if (/(sneak|quiet|stealth|unseen)/.test(a)) {
    return { narrative: `${character?.name || "The adventurer"} lowers their profile and begins moving with deliberate care, using cover and timing to stay unnoticed.`, roll: { label: "Stealth", dice: "1d20", modifier: Number(skills.stealth || 0), reason: "Remain unnoticed." }, events: [], scene: {}, mode: "mock" };
  }
  return { narrative: `The world reacts to the choice.\n\n“${action}”\n\nNothing immediately prevents the attempt, but the people and environment continue acting according to their own motives.\n\nWhat do you do next?`, roll: null, events: [], scene: {}, mode: "mock" };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const b = req.body || {};
  if (!process.env.OPENAI_API_KEY) return res.status(200).json(fallback(b.action, b.character));
  try {
    const state = {
      character: b.character,
      campaign: b.campaign,
      inventory: b.inventory,
      quests: b.quests,
      companions: b.companions,
      combat: b.combat,
      recent_log: (b.recentLog || []).slice(-14),
      player_action: b.action
    };
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions: RULES,
      input: `CURRENT CANONICAL GAME STATE:\n${JSON.stringify(state, null, 2)}\n\nReturn the next turn as JSON only.`
    });
    let raw = (response.output_text || "").trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { parsed = { narrative: raw || "The Game Master considers what happens next.", roll: null, events: [], scene: {} }; }
    parsed.mode = "openai";
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(200).json({ ...fallback(b.action, b.character), mode: "fallback", warning: String(e.message || e) });
  }
}
