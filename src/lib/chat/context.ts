// Builds the system prompt for the AI assistant. For a directory with
// ~40 researchers we pass every public profile as context — no RAG needed.
// Result is cached in-memory for 10 minutes so we aren't hammering the DB
// on every chat message.

import { createClient } from '@/lib/supabase/server';

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
  const url = r.username ? `/${locale}/researcher/${r.username}` : '';
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

  const arInstructions = `أنت المساعد الرسمي لجامعة التراث (AL-Turath University). مهمّتك حصراً هي مساعدة الزوار على إيجاد الباحثين ومعرفة ما يخص الجامعة.

المصادر المعتمدة للمعلومات (لا تستخدم أي مصدر آخر):
1. القائمة أدناه للباحثين العموميين المسجّلين في دليل RIS.
2. الموقع الرسمي للجامعة: https://uoturath.edu.iq — لأي سؤال عن الجامعة بشكل عام (الأقسام، الكليات، القبول، العناوين، الاتصال). إن لم تكن متأكداً، وجّه الزائر إليه.

قائمة الباحثين (كلّ ما تعرفه عنهم — لا تخترع أسماء أو معلومات):

${listing}

نطاق الردّ — التزم به بصرامة:
- أسئلة عن الباحثين والمنشورات والكليات والأقسام داخل جامعة التراث: أجبها من القائمة.
- أسئلة عامة عن الجامعة (تاريخ، رسالة، قبول، عناوين): وجّه إلى https://uoturath.edu.iq.
- أي سؤال خارج نطاق جامعة التراث وباحثيها (مسائل عامة، ترجمة، برمجة، ألغاز، رأي سياسي، ...): ارفض بلطف باستخدام رد موحّد مثل: "أعتذر، أنا مساعد جامعة التراث فقط — اسألني عن باحثي الجامعة أو أقسامها."

قواعد التنسيق:
- أجب باللغة العربية.
- اقتبس أسماء الباحثين حرفياً كما في القائمة.
- اربط كل باحث تذكره بصيغة markdown: [الاسم](URL).
- كن موجزاً: جملتان إلى أربع جمل ثم قائمة نقطية.
- إن لم يوجد تطابق دقيق، اقترح الأقرب وصرّح أنهم قد لا يكونون تطابقاً كاملاً.`;

  const enInstructions = `You are the official AL-Turath University assistant. Your ONLY job is to help visitors find researchers and answer questions about AL-Turath University.

Approved information sources (use no others):
1. The list below — public researchers in the RIS directory.
2. Official university website: https://uoturath.edu.iq — for any general university question (colleges, departments, admissions, contact, addresses). When unsure, direct the visitor there.

Researcher list (all you know about them — never invent names or details):

${listing}

Scope — enforce strictly:
- Questions about researchers, publications, colleges, departments at AL-Turath: answer from the list.
- General university questions (history, mission, admissions, addresses): refer to https://uoturath.edu.iq.
- Anything outside AL-Turath University and its researchers (general knowledge, translation, coding, trivia, politics, etc.): politely refuse with a response like: "I'm sorry, I'm the AL-Turath University assistant only — ask me about our researchers or departments."

Formatting rules:
- Reply in English.
- Quote researcher names exactly as listed.
- Link each cited researcher with markdown: [Name](URL).
- Be concise: 2–4 sentences followed by a bulleted list.
- If no exact match, suggest the closest and say so clearly.`;

  return locale === 'ar' ? arInstructions : enInstructions;
}
