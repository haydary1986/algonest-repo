// Weighted profile completeness score for the manage-profile page.
// Each category contributes a fixed share of the total; within a category
// the researcher earns partial credit based on how many tracked fields are
// actually filled. Missing items surface in the UI so the researcher
// knows exactly what to fill next — no guessing.

export interface CompletenessCategory {
  id: 'basic' | 'academic' | 'research' | 'publications' | 'contact';
  label_en: string;
  label_ar: string;
  weight: number; // must sum to 100 across all categories
  earned: number; // 0..weight
  total: number; // number of tracked items in this category
  filled: number; // number of tracked items actually filled
  missing: Array<{ key: string; label_en: string; label_ar: string }>;
}

export interface CompletenessResult {
  score: number; // 0..100
  categories: CompletenessCategory[];
  missingCount: number;
}

type Profile = {
  full_name_en: string | null;
  full_name_ar: string | null;
  gender_id: string | null;
  academic_title_id: string | null;
  profile_image: string | null;
  birthdate: string | null;
  workplace_type_id: string | null;
  college_id: string | null;
  department_id: string | null;
  degree_en: string | null;
  degree_ar: string | null;
  bio_en: string | null;
  bio_ar: string | null;
  field_of_interest_en: string | null;
  field_of_interest_ar: string | null;
  website: string | null;
  public_email: string | null;
  public_phone: string | null;
  private_email: string | null;
  private_phone: string | null;
};

interface ChildCounts {
  publications: number;
  work: number;
  certifications: number;
  awards: number;
  projects: number;
  skills: number;
  languages: number;
  socials: number;
}

function filled(v: string | null | undefined): boolean {
  return Boolean(v && v.trim().length > 0);
}

export function computeCompleteness(profile: Profile, children: ChildCounts): CompletenessResult {
  const categories: CompletenessCategory[] = [];

  // ---------------------------------------------------------------------
  // Basic — identity fields shown on every profile card.
  // ---------------------------------------------------------------------
  const basicItems: Array<{ key: string; ok: boolean; label_en: string; label_ar: string }> = [
    {
      key: 'full_name_en',
      ok: filled(profile.full_name_en),
      label_en: 'Full name (English)',
      label_ar: 'الاسم (إنجليزي)',
    },
    {
      key: 'full_name_ar',
      ok: filled(profile.full_name_ar),
      label_en: 'Full name (Arabic)',
      label_ar: 'الاسم (عربي)',
    },
    {
      key: 'profile_image',
      ok: filled(profile.profile_image),
      label_en: 'Profile photo',
      label_ar: 'الصورة الشخصية',
    },
    {
      key: 'academic_title_id',
      ok: Boolean(profile.academic_title_id),
      label_en: 'Academic title',
      label_ar: 'اللقب العلمي',
    },
    {
      key: 'gender_id',
      ok: Boolean(profile.gender_id),
      label_en: 'Gender',
      label_ar: 'الجنس',
    },
  ];
  categories.push(scoreCategory('basic', 'Basic info', 'المعلومات الأساسية', 30, basicItems));

  // ---------------------------------------------------------------------
  // Academic — affiliation + degree.
  // ---------------------------------------------------------------------
  const academicItems = [
    {
      key: 'college_id',
      ok: Boolean(profile.college_id),
      label_en: 'College',
      label_ar: 'الكلية',
    },
    {
      key: 'department_id',
      ok: Boolean(profile.department_id),
      label_en: 'Department',
      label_ar: 'القسم',
    },
    {
      key: 'workplace_type_id',
      ok: Boolean(profile.workplace_type_id),
      label_en: 'Workplace type',
      label_ar: 'نوع مقر العمل',
    },
    {
      key: 'degree',
      ok: filled(profile.degree_en) || filled(profile.degree_ar),
      label_en: 'Highest degree',
      label_ar: 'أعلى شهادة',
    },
  ];
  categories.push(scoreCategory('academic', 'Academic', 'المعلومات الأكاديمية', 20, academicItems));

  // ---------------------------------------------------------------------
  // Research — what makes the profile discoverable (bio, interests,
  // skills, languages, social profiles).
  // ---------------------------------------------------------------------
  const researchItems = [
    {
      key: 'bio',
      ok: filled(profile.bio_en) || filled(profile.bio_ar),
      label_en: 'Biography',
      label_ar: 'السيرة الذاتية',
    },
    {
      key: 'field_of_interest',
      ok: filled(profile.field_of_interest_en) || filled(profile.field_of_interest_ar),
      label_en: 'Research interests',
      label_ar: 'الاهتمامات البحثية',
    },
    {
      key: 'website',
      ok: filled(profile.website),
      label_en: 'Website or portfolio link',
      label_ar: 'موقع ويب أو ملف تعريفي',
    },
    {
      key: 'skills',
      ok: children.skills > 0,
      label_en: 'At least one skill',
      label_ar: 'مهارة واحدة على الأقل',
    },
    {
      key: 'languages',
      ok: children.languages > 0,
      label_en: 'At least one language',
      label_ar: 'لغة واحدة على الأقل',
    },
    {
      key: 'socials',
      ok: children.socials > 0,
      label_en: 'At least one social profile (ORCID, Scholar…)',
      label_ar: 'حساب واحد على الأقل (ORCID، Scholar...)',
    },
  ];
  categories.push(scoreCategory('research', 'Research', 'البحث', 25, researchItems));

  // ---------------------------------------------------------------------
  // Publications / experience — anything that proves real activity.
  // ---------------------------------------------------------------------
  const pubItems = [
    {
      key: 'publications',
      ok: children.publications > 0,
      label_en: 'At least one publication',
      label_ar: 'منشور واحد على الأقل',
    },
    {
      key: 'experience',
      ok:
        children.work > 0 ||
        children.certifications > 0 ||
        children.awards > 0 ||
        children.projects > 0,
      label_en: 'Work, certification, award, or project',
      label_ar: 'خبرة، شهادة، جائزة، أو مشروع',
    },
  ];
  categories.push(scoreCategory('publications', 'Activity', 'النشاط البحثي', 15, pubItems));

  // ---------------------------------------------------------------------
  // Contact — at least one way to reach the researcher.
  // ---------------------------------------------------------------------
  const contactItems = [
    {
      key: 'email_any',
      ok: filled(profile.public_email) || filled(profile.private_email),
      label_en: 'Email (public or private)',
      label_ar: 'بريد إلكتروني (عام أو خاص)',
    },
    {
      key: 'phone_any',
      ok: filled(profile.public_phone) || filled(profile.private_phone),
      label_en: 'Phone (public or private)',
      label_ar: 'رقم هاتف (عام أو خاص)',
    },
  ];
  categories.push(scoreCategory('contact', 'Contact', 'معلومات الاتصال', 10, contactItems));

  const score = Math.round(categories.reduce((acc, c) => acc + c.earned, 0));
  const missingCount = categories.reduce((acc, c) => acc + c.missing.length, 0);

  return { score, categories, missingCount };
}

function scoreCategory(
  id: CompletenessCategory['id'],
  label_en: string,
  label_ar: string,
  weight: number,
  items: Array<{ key: string; ok: boolean; label_en: string; label_ar: string }>,
): CompletenessCategory {
  const total = items.length;
  const filledCount = items.filter((i) => i.ok).length;
  const earned = total === 0 ? 0 : (filledCount / total) * weight;
  const missing = items
    .filter((i) => !i.ok)
    .map((i) => ({ key: i.key, label_en: i.label_en, label_ar: i.label_ar }));
  return { id, label_en, label_ar, weight, earned, total, filled: filledCount, missing };
}
