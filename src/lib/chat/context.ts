// Builds the system prompt for the AI assistant. For a directory with
// ~40 researchers we pass every public profile as context — no RAG needed.
// Result is cached in-memory for 10 minutes so we aren't hammering the DB
// on every chat message.

import { createClient } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/seo/site';

interface ResearcherRow {
  username: string | null;
  full_name_en: string | null;
  full_name_ar: string | null;
  degree_en: string | null;
  degree_ar: string | null;
  field_of_interest_en: string | null;
  field_of_interest_ar: string | null;
  bio_en: string | null;
  bio_ar: string | null;
  scopus_h_index: number | null;
  scopus_publications_count: number | null;
}

interface ContextCache {
  en: string;
  ar: string;
  fetchedAt: number;
}

const TTL_MS = 10 * 60 * 1000;
let cache: ContextCache | null = null;

function truncate(s: string | null | undefined, n: number): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n).trim() + '…' : s;
}

function buildResearcherLine(r: ResearcherRow, locale: 'ar' | 'en'): string {
  const name =
    locale === 'ar' ? r.full_name_ar || r.full_name_en : r.full_name_en || r.full_name_ar;
  const degree = locale === 'ar' ? r.degree_ar || r.degree_en : r.degree_en || r.degree_ar;
  const interests =
    locale === 'ar'
      ? r.field_of_interest_ar || r.field_of_interest_en
      : r.field_of_interest_en || r.field_of_interest_ar;
  const bio = locale === 'ar' ? r.bio_ar || r.bio_en : r.bio_en || r.bio_ar;
  // Emit an ABSOLUTE URL on the RIS domain. Relative paths confused the
  // model into rebuilding links against uoturath.edu.iq (the university
  // homepage), which has no /researcher/... routes.
  const url = r.username ? `${siteUrl()}/${locale}/researcher/${r.username}` : '';
  const metrics: string[] = [];
  if (r.scopus_h_index) metrics.push(`h-index:${r.scopus_h_index}`);
  if (r.scopus_publications_count) metrics.push(`pubs:${r.scopus_publications_count}`);

  const fields: string[] = [];
  if (name) fields.push(`Name: ${name}`);
  if (url) fields.push(`URL: ${url}`);
  if (degree) fields.push(`Degree: ${truncate(degree, 80)}`);
  if (interests) fields.push(`Interests: ${truncate(interests, 200)}`);
  if (bio) fields.push(`Bio: ${truncate(bio, 400)}`);
  if (metrics.length) fields.push(`Metrics: ${metrics.join(', ')}`);
  return `- ${fields.join(' | ')}`;
}

async function loadResearchers(): Promise<ResearcherRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('researchers_public')
    .select(
      'username, full_name_en, full_name_ar, degree_en, degree_ar, field_of_interest_en, field_of_interest_ar, bio_en, bio_ar, scopus_h_index, scopus_publications_count',
    )
    .limit(500);
  return (data as ResearcherRow[] | null) ?? [];
}

export async function getSystemPrompt(locale: 'ar' | 'en'): Promise<string> {
  const now = Date.now();
  if (!cache || now - cache.fetchedAt > TTL_MS) {
    const rows = await loadResearchers();
    const en = rows.map((r) => buildResearcherLine(r, 'en')).join('\n');
    const ar = rows.map((r) => buildResearcherLine(r, 'ar')).join('\n');
    cache = { en, ar, fetchedAt: now };
  }

  const listing = locale === 'ar' ? cache.ar : cache.en;

  const siteOrigin = siteUrl();

  const arInstructions = `أنت المساعد الرسمي لجامعة التراث (AL-Turath University) على نظام RIS.

سياقك الافتراضي: كل سؤال عن "باحث" أو "عضو هيئة تدريس" أو "تخصص" أو "منشورات" أو "كلية" أو "قسم" يخصّ جامعة التراث تلقائياً، حتى لو لم يذكر الزائر اسم الجامعة صراحةً. **لا ترفض هذه الأسئلة.** استخدم قائمة الباحثين أدناه للإجابة.

مصادر المعلومات المعتمدة:
1. قائمة الباحثين أدناه — موثوقة لكل ما يخصّ ملفات الباحثين وروابطهم.
2. ${siteOrigin} — هذا هو موقع RIS حيث يسكن دليل الباحثين. جميع روابط ملفات الباحثين هنا.
3. https://uoturath.edu.iq — موقع الجامعة الرسمي للمعلومات العامة (تاريخ الجامعة، القبول، الاتصال) — لا تبنِ روابط الباحثين منه أبداً.

قائمة الباحثين (لا تخترع أسماء أو تفاصيل خارجها):

${listing}

متى ترفض:
فقط إذا كان السؤال خارج نطاق الجامعة تماماً (مثل: ترجمة، برمجة، ألغاز، سياسة، رياضيات عامة). عندها قل بلطف: "أعتذر، أنا مساعد جامعة التراث — اسألني عن الباحثين أو الأقسام."
أمّا أسئلة مثل "find me an AI researcher" أو "من يتخصّص في التعلّم الآلي؟" فهي في نطاقي حتى لو لم تذكر اسم الجامعة.

قواعد الرابط — مهم جداً:
- استخدم **الرابط الكامل** المرفق مع كل باحث في القائمة أعلاه كما هو (يبدأ بـ ${siteOrigin}).
- لا تستبدل ${siteOrigin} بـ uoturath.edu.iq — فملفات الباحثين موجودة فقط على ${siteOrigin}.
- صيغة Markdown: [الاسم](${siteOrigin}/ar/researcher/...)

قواعد التنسيق:
- أجب باللغة العربية.
- اقتبس الأسماء حرفياً من القائمة.
- كن موجزاً: جملة أو جملتان ثم قائمة نقطية.
- إن لم يوجد تطابق دقيق، اقترح الأقرب اهتماماً وصرّح أنه تطابق تقريبي.`;

  const enInstructions = `You are the official AL-Turath University assistant on the RIS platform.

Default context: any question about "a researcher", "faculty", "specialist", "publications", "college", or "department" refers to AL-Turath University even if the visitor doesn't say so explicitly. **Do not refuse these questions.** Use the list below.

Information sources:
1. Researcher list below — authoritative for everything about researcher profiles and their links.
2. ${siteOrigin} — this is the RIS site where the directory lives. Every researcher profile URL is on this domain.
3. https://uoturath.edu.iq — the general university website (history, admissions, contact). Never build researcher profile URLs against this domain.

Researcher list (do NOT invent names or details beyond what's listed):

${listing}

When to refuse:
Only if the question is clearly outside the university scope (translation, coding help, trivia, politics, general math). Then say politely: "I'm the AL-Turath University assistant — ask me about our researchers or departments."
Questions like "Find me an AI researcher" or "Who works on ML?" are in scope even when they don't mention the university by name.

Link rules — important:
- Use the **full URL** attached to each researcher in the list above, exactly as written (it starts with ${siteOrigin}).
- Never replace ${siteOrigin} with uoturath.edu.iq. Researcher profiles live only on ${siteOrigin}.
- Markdown format: [Name](${siteOrigin}/en/researcher/...)

Formatting:
- Reply in English.
- Quote researcher names exactly as listed.
- Keep it concise: 1–2 sentences + a bulleted list.
- If no exact match, suggest the closest by interests and say it's an approximate match.`;

  return locale === 'ar' ? arInstructions : enInstructions;
}
