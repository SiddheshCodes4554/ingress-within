import { InterventionCategoryMeta } from '../types/intervention';

export const CATEGORY_LABELS: Record<string, string> = {
  anxiety_worry: 'Anxiety & Worry',
  low_mood_depression: 'Low Mood & Depression',
  stress_overwhelm: 'Stress & Overwhelm',
  sleep_issues: 'Sleep',
  anger_irritability: 'Anger & Irritability',
  grief_loss: 'Grief & Loss',
  family_relationship: 'Family & Relationships',
  loneliness_isolation: 'Loneliness & Isolation',
  panic_attacks: 'Panic Attacks',
  self_esteem: 'Self-Esteem',
  academic_work_pressure: 'Academic & Work Pressure',
  crisis_safety: 'Crisis & Safety Planning',
};

export const CATEGORY_SHORT_LABELS: Record<string, string> = {
  anxiety_worry: 'Anxiety',
  low_mood_depression: 'Low Mood',
  stress_overwhelm: 'Stress',
  sleep_issues: 'Sleep',
  anger_irritability: 'Anger',
  grief_loss: 'Grief',
  family_relationship: 'Family',
  loneliness_isolation: 'Loneliness',
  panic_attacks: 'Panic',
  self_esteem: 'Self-Esteem',
  academic_work_pressure: 'Academic/Work',
  crisis_safety: 'Crisis & Safety',
};

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  anxiety_worry: 'Breathing, grounding, and thought-record techniques for worry and racing thoughts.',
  low_mood_depression: 'Behavioral activation and small-step tools for low motivation and low mood.',
  stress_overwhelm: 'Quick resets and planning tools for when too much is happening at once.',
  sleep_issues: 'Wind-down routines and techniques for a racing mind at bedtime.',
  anger_irritability: 'Pause techniques and pattern-tracking for anger and irritability.',
  grief_loss: 'Expressive and reflective practices to process loss.',
  family_relationship: 'Communication tools for difficult family and relationship conversations.',
  loneliness_isolation: 'Small, low-pressure steps to rebuild connection.',
  panic_attacks: 'In-the-moment grounding for panic, and reflection afterward.',
  self_esteem: 'Evidence-based exercises to counter harsh self-criticism.',
  academic_work_pressure: 'Tools for exam, career, and performance pressure.',
  crisis_safety: 'Safety planning and reflection for moments of crisis.',
};

export const CATEGORY_ICONS: Record<string, string> = {
  anxiety_worry: 'wind',
  low_mood_depression: 'sun',
  stress_overwhelm: 'zap',
  sleep_issues: 'moon',
  anger_irritability: 'shield-alert',
  grief_loss: 'heart',
  family_relationship: 'users',
  loneliness_isolation: 'user',
  panic_attacks: 'activity',
  self_esteem: 'sparkles',
  academic_work_pressure: 'book-open',
  crisis_safety: 'life-buoy',
};

export const INDIA_CRISIS_RESOURCES = {
  note: "Always show this block first if a user indicates self-harm or suicidal thoughts. Do not gate it behind other content.",
  helplines: [
    { name: "Tele-MANAS (Govt. of India)", number: "14416 or 1800-891-4416", hours: "24x7", languages: "20+ Indian languages" },
    { name: "KIRAN Mental Health Helpline (Govt. of India)", number: "1800-599-0019", hours: "24x7", languages: "13 Indian languages" },
    { name: "Vandrevala Foundation Helpline", number: "1860-2662-345 / 1800-2333-330", hours: "24x7", languages: "English, Hindi + regional" },
    { name: "iCall (TISS)", number: "9152987821", hours: "Mon–Sat, 8am–10pm", languages: "English, Hindi, and more" },
    { name: "AASRA", number: "9820466726", hours: "24x7", languages: "English, Hindi" },
    { name: "Sneha India Foundation", number: "044-24640050", hours: "24x7", languages: "English, Tamil, Hindi" }
  ],
  immediate_steps: [
    "If there is immediate danger to life, go to the nearest hospital emergency room or call 112 (national emergency number).",
    "Stay with the person or ask them to stay with someone they trust; avoid leaving them alone.",
    "Remove or secure easy access to means of harm (medications, sharp objects, etc.) where possible.",
    "Encourage contacting one of the helplines above — these are free/low-cost and confidential."
  ]
};
