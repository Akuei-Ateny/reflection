import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder' });

const MODERATION_SYSTEM = `You are a strict content moderator for a university social-awareness platform. Your job is to decide if a user-submitted review comment is acceptable.

REJECT (respond with exactly "REJECT") if the comment contains ANY of:
- Bullying, harassment, or personal attacks
- Hate speech or discrimination
- Defamation or false damaging claims
- Sexual or inappropriate content
- Doxxing or identifying information
- Threats or encouragement of harm
- Excessive negativity that could harm someone's wellbeing (e.g. purely cruel criticism)

ACCEPT (respond with exactly "ACCEPT") if the comment is:
- Respectful, constructive, or neutral
- Appropriate for a supportive, growth-oriented community
- Even if it's brief or generic (e.g. "Great teammate")

Respond with only one word: either REJECT or ACCEPT.`;

export async function moderateReviewComment(comment) {
  if (!comment || !comment.trim()) return { allowed: false, reason: 'empty' };
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-placeholder')) {
    return { allowed: true };
  }
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: MODERATION_SYSTEM },
        { role: 'user', content: comment }
      ],
      max_tokens: 10
    });
    const answer = (completion.choices[0]?.message?.content || '').trim().toUpperCase();
    const allowed = answer.includes('ACCEPT') && !answer.includes('REJECT');
    return { allowed, reason: allowed ? null : 'community_standards' };
  } catch (e) {
    console.error('Moderation API error:', e.message);
    return { allowed: false, reason: 'error' };
  }
}

export async function generateReflectionSummary(reviews) {
  if (!reviews?.length) return null;
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-placeholder')) {
    return 'Students often describe this person as thoughtful and collaborative. Reviews highlight a positive presence in group settings.';
  }
  const text = reviews.map(r => `${r.rating} stars: "${r.comment}"`).join('\n');
  const { default: db } = await import('./db/index.js');
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You write short, positive "reflection summaries" for a university social-awareness platform. Based only on the provided anonymous reviews, write 2-3 sentences that capture how others experience this person. Be warm, balanced, and insightful. Never be harsh or amplify negativity. Write in third person (e.g. "Students often describe X as..."). Do not mention specific reviews or star counts.`
      },
      { role: 'user', content: text }
    ],
    max_tokens: 200
  });
  return completion.choices[0]?.message?.content?.trim() || null;
}

export async function generateGrowthInsights(reviews, userName) {
  if (!reviews?.length) return { feedback: null, resources: [] };
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-placeholder')) {
    return {
      feedback: `${userName || 'You'}, reviewers appreciate your presence. Consider asking for more specific feedback in person to continue growing.`,
      resources: [
        { title: 'How to speak confidently in groups', url: 'https://example.com/speaking' },
        { title: 'Active listening and conversation skills', url: 'https://example.com/listening' },
        { title: 'Public speaking confidence tips', url: 'https://example.com/public-speaking' }
      ]
    };
  }
  const text = reviews.map(r => `${r.rating} stars: "${r.comment}"`).join('\n');
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You write private, constructive growth feedback for a university student based on their anonymous reviews. Address the student by first name. Be supportive and constructive; never harsh. Give 2-4 sentences of specific, actionable feedback. Then output a JSON array of 3-5 learning resources (each with "title" and "url") that could help them improve. Format your response as two parts separated by "---RESOURCES---". Part 1: the feedback text. Part 2: JSON array only, e.g. [{"title":"...","url":"..."}]. Use real, helpful URLs when possible (e.g. TED, MindTools, university pages).`
      },
      { role: 'user', content: `Student name: ${userName || 'Student'}\n\nReviews:\n${text}` }
    ],
    max_tokens: 500
  });
  const raw = completion.choices[0]?.message?.content?.trim() || '';
  const [feedbackPart, jsonPart] = raw.split('---RESOURCES---').map(s => s?.trim());
  let resources = [];
  try {
    const parsed = JSON.parse(jsonPart || '[]');
    resources = Array.isArray(parsed) ? parsed : [];
  } catch (_) {}
  return {
    feedback: feedbackPart || null,
    resources
  };
}
