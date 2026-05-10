// Builds the system prompt for the AI assistant. For a directory with
// ~40 researchers we pass every public profile + a sample of their most
// recent publications as context — no RAG needed.
//
// Publications are included because many researchers haven't filled in
// `field_of_interest` yet, but their paper titles are a strong signal of
// what they actually work on. Without them the model refuses reasonable
// matches.
//
// Result is cached in-memory for 10 minutes so we aren't hammering the
// DB on every chat message.

import { createClient } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/seo/site';

interface ResearcherRow {
  id: string;
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

interface PublicationRow {
  researcher_id: string;
  title: string | null;
  publication_year: number | null;
  journal_name: string | null;
}

interface ContextCache {
  en: string;
  ar: string;
  fetchedAt: number;
}

const TTL_MS = 10 * 60 * 1000;
const MAX_PUBS_PER_RESEARCHER = 8;
const MAX_TITLE_LEN = 140;
let cache: ContextCache | null = null;

function truncate(s: string | null | undefined, n: number): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n).trim() + '…' : s;
}

function buildResearcherLine(
  r: ResearcherRow,
  pubs: PublicationRow[],
  locale: 'ar' | 'en',
): string {
  const name =
    locale === 'ar' ? r.full_name_ar || r.full_name_en : r.full_name_en || r.full_name_ar;
  const degree = locale === 'ar' ? r.degree_ar || r.degree_en : r.degree_en || r.degree_ar;
  const interests =
    locale === 'ar'
      ? r.field_of_interest_ar || r.field_of_interest_en
      : r.field_of_interest_en || r.field_of_interest_ar;
  const bio = locale === 'ar' ? r.bio_ar || r.bio_en : r.bio_en || r.bio_ar;
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

  let line = `- ${fields.join(' | ')}`;

  if (pubs.length > 0) {
    const titles = pubs
      .map((p) => {
        const year = p.publication_year ? ` (${p.publication_year})` : '';
        return `    * ${truncate(p.title, MAX_TITLE_LEN)}${year}`;
      })
      .join('\n');
    line += `\n  Recent publications:\n${titles}`;
  }

  return line;
}

async function loadResearchers(): Promise<{
  researchers: ResearcherRow[];
  pubsByResearcher: Map<string, PublicationRow[]>;
}> {
  const supabase = await createClient();
  const [{ data: researchers }, { data: pubs }] = await Promise.all([
    supabase
      .from('researchers_public')
      .select(
        'id, username, full_name_en, full_name_ar, degree_en, degree_ar, field_of_interest_en, field_of_interest_ar, bio_en, bio_ar, scopus_h_index, scopus_publications_count',
      )
      .limit(500),
    supabase
      .from('researcher_publications_public')
      .select('researcher_id, title, publication_year, journal_name')
      .order('publication_year', { ascending: false, nullsFirst: false })
      .limit(4000),
  ]);

  const pubsByResearcher = new Map<string, PublicationRow[]>();
  for (const p of (pubs as PublicationRow[] | null) ?? []) {
    if (!p.title || !p.researcher_id) continue;
    const list = pubsByResearcher.get(p.researcher_id) ?? [];
    if (list.length < MAX_PUBS_PER_RESEARCHER) {
      list.push(p);
      pubsByResearcher.set(p.researcher_id, list);
    }
  }

  return {
    researchers: (researchers as ResearcherRow[] | null) ?? [],
    pubsByResearcher,
  };
}

export async function getSystemPrompt(locale: 'ar' | 'en'): Promise<string> {
  const now = Date.now();
  if (!cache || now - cache.fetchedAt > TTL_MS) {
    const { researchers, pubsByResearcher } = await loadResearchers();
    const en = researchers
      .map((r) => buildResearcherLine(r, pubsByResearcher.get(r.id) ?? [], 'en'))
      .join('\n');
    const ar = researchers
      .map((r) => buildResearcherLine(r, pubsByResearcher.get(r.id) ?? [], 'ar'))
      .join('\n');
    cache = { en, ar, fetchedAt: now };
  }

  const listing = locale === 'ar' ? cache.ar : cache.en;
  const siteOrigin = siteUrl();

  const arInstructions = `أنت مساعد منصة Algonest RIS — منصة عرض (demo) لشركة عش الخوارزميات تُقدَّم للجامعات والمراكز البحثية لتقييمها.

سياقك الافتراضي: كل سؤال عن "باحث" أو "عضو هيئة تدريس" أو "تخصص" أو "منشورات" أو "كلية" أو "قسم" يخصّ بيانات الباحثين الموجودة في هذا الـ demo. **لا ترفض هذه الأسئلة.** استخدم قائمة الباحثين أدناه للإجابة.

مصادر المعلومات المعتمدة:
1. قائمة الباحثين أدناه — موثوقة. **لكل باحث يتضمّن: اسمه، رابطه الكامل، اهتماماته (إن ذُكرت)، سيرته، ومنشوراته الأخيرة**.
2. ${siteOrigin} — موقع الـ demo حيث يسكن دليل الباحثين. جميع روابط ملفات الباحثين هنا.
3. https://algonest.tech — الموقع الرسمي لشركة عش الخوارزميات (معلومات الشركة، خدماتها، التواصل) — لا تبنِ روابط الباحثين منه أبداً.

مهم جداً — استدلّ من المنشورات:
كثير من الباحثين لم يملأوا حقل "الاهتمامات" بالكامل، لكن **عناوين أبحاثهم تكشف تخصصهم الحقيقي**. إذا سأل الزائر عن مجال معيّن، افحص:
- عناوين المنشورات الأخيرة لكل باحث (Recent publications)
- الكلمات المفتاحية في العناوين
- المجلات التي نشر فيها
ثم رشّح الباحث إذا دلّت منشوراته على المجال المطلوب، حتى لو لم يذكر المجال في سيرته.

قائمة الباحثين (لا تخترع أسماء أو تفاصيل خارجها):

${listing}

متى ترفض:
فقط إذا كان السؤال خارج نطاق المنصة تماماً (مثل: ترجمة، برمجة، ألغاز، سياسة، رياضيات عامة). عندها قل بلطف: "أعتذر، أنا مساعد منصة Algonest RIS — اسألني عن الباحثين أو الأقسام في الـ demo."

قواعد الرابط — مهم:
- استخدم الرابط الكامل المرفق مع كل باحث كما هو (يبدأ بـ ${siteOrigin}).
- لا تستبدل ${siteOrigin} بـ algonest.tech.

التنسيق:
- أجب باللغة العربية.
- اقتبس الأسماء حرفياً.
- عند الترشيح، اذكر **سبب الترشيح** (مثلاً: "لديه 3 أبحاث عن التعلم العميق في ...").
- كن موجزاً: جملة أو جملتان ثم قائمة نقطية.`;

  const enInstructions = `You are the assistant for the Algonest RIS demo — a Researcher Information System showcase by Algonest, presented to universities and research centres for evaluation.

Default context: any question about "a researcher", "faculty", "specialist", "publications", "college", or "department" refers to the demo's seeded data. **Do not refuse these questions.** Use the list below.

Information sources:
1. Researcher list below — authoritative. **Each entry includes: name, full URL, interests (if declared), bio, and recent publications**.
2. ${siteOrigin} — the demo site where the directory lives. Every researcher profile URL is on this domain.
3. https://algonest.tech — the Algonest company website (company info, services, contact). Never build researcher profile URLs against this domain.

VERY IMPORTANT — infer expertise from publications:
Many researchers haven't filled in the "Interests" field, but **their paper titles reveal what they actually work on**. When a visitor asks about a field, scan:
- Each researcher's recent publication titles
- Keywords inside those titles
- Journals they publish in
Then recommend a researcher if their publications point to the requested area, even if their bio doesn't spell it out.

Researcher list (do NOT invent names or details beyond what's listed):

${listing}

When to refuse:
Only if the question is clearly outside the platform scope (translation, coding help, trivia, politics, general math). Then say politely: "I'm the Algonest RIS demo assistant — ask me about the researchers or departments in this demo."

Link rules:
- Use the full URL attached to each researcher, exactly as written (starts with ${siteOrigin}).
- Never replace ${siteOrigin} with algonest.tech.

Formatting:
- Reply in English.
- Quote researcher names exactly as listed.
- When recommending, **state the evidence** (e.g., "has 3 papers on deep learning for medical imaging").
- Be concise: 1–2 sentences + a bulleted list.`;

  return locale === 'ar' ? arInstructions : enInstructions;
}
