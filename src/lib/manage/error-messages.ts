// Maps raw Zod error codes and technical field names to human-readable messages
// Used by flatten() in actions.ts and ErrorsDialog on the client

export const FIELD_LABELS: Record<string, { en: string; ar: string }> = {
  full_name_en: { en: 'Full name (English)', ar: 'الاسم (إنجليزي)' },
  full_name_ar: { en: 'Full name (Arabic)', ar: 'الاسم (عربي)' },
  employee_id: { en: 'Employee ID', ar: 'رقم الموظف' },
  gender_id: { en: 'Gender', ar: 'الجنس' },
  birthdate: { en: 'Date of birth', ar: 'تاريخ الميلاد' },
  academic_title_id: { en: 'Academic title', ar: 'اللقب العلمي' },
  profile_image: { en: 'Profile image', ar: 'صورة الملف الشخصي' },
  workplace_type_id: { en: 'Workplace type', ar: 'نوع مكان العمل' },
  college_id: { en: 'College', ar: 'الكلية' },
  department_id: { en: 'Department', ar: 'القسم' },
  university_center_id: { en: 'University center', ar: 'المركز الجامعي' },
  degree_en: { en: 'Degree (English)', ar: 'الشهادة (إنجليزي)' },
  degree_ar: { en: 'Degree (Arabic)', ar: 'الشهادة (عربي)' },
  degree_minor_en: { en: 'Minor (English)', ar: 'التخصص الفرعي (إنجليزي)' },
  degree_minor_ar: { en: 'Minor (Arabic)', ar: 'التخصص الفرعي (عربي)' },
  bio_en: { en: 'Biography (English)', ar: 'النبذة (إنجليزي)' },
  bio_ar: { en: 'Biography (Arabic)', ar: 'النبذة (عربي)' },
  website: { en: 'Website', ar: 'الموقع الإلكتروني' },
  degree_type: { en: 'Degree type', ar: 'نوع الشهادة' },
  field_en: { en: 'Field (English)', ar: 'التخصص (إنجليزي)' },
  institution_en: { en: 'Institution', ar: 'المؤسسة' },
  start_year: { en: 'Start year', ar: 'سنة البدء' },
  end_year: { en: 'End year', ar: 'سنة الانتهاء' },
  position_en: { en: 'Position', ar: 'المنصب' },
  organization_en: { en: 'Organization', ar: 'المنظمة' },
  start_date: { en: 'Start date', ar: 'تاريخ البدء' },
  end_date: { en: 'End date', ar: 'تاريخ الانتهاء' },
  name_en: { en: 'Name (English)', ar: 'الاسم (إنجليزي)' },
  issuing_org: { en: 'Issuing organization', ar: 'الجهة المانحة' },
  issue_date: { en: 'Issue date', ar: 'تاريخ الإصدار' },
  expiry_date: { en: 'Expiry date', ar: 'تاريخ الانتهاء' },
  title_en: { en: 'Title (English)', ar: 'العنوان (إنجليزي)' },
  title: { en: 'Title', ar: 'العنوان' },
  publication_year: { en: 'Publication year', ar: 'سنة النشر' },
  journal_name: { en: 'Journal', ar: 'المجلة' },
  doi: { en: 'DOI', ar: 'DOI' },
  url: { en: 'URL', ar: 'الرابط' },
  year: { en: 'Year', ar: 'السنة' },
};

export const ERROR_MESSAGES: Record<string, { en: string; ar: string }> = {
  required: { en: 'This field is required', ar: 'هذا الحقل مطلوب' },
  url: { en: 'Please enter a valid URL', ar: 'يرجى إدخال رابط صالح' },
  date: { en: 'Please enter a valid date (YYYY-MM-DD)', ar: 'يرجى إدخال تاريخ صالح (YYYY-MM-DD)' },
  no_profile: { en: 'No researcher profile found', ar: 'لم يتم العثور على ملف باحث' },
};

export function translateFieldName(field: string, locale: string): string {
  const label = FIELD_LABELS[field];
  return label ? (locale === 'ar' ? label.ar : label.en) : field;
}

export function translateErrorMessage(msg: string, locale: string): string {
  // Handle "max:N" pattern
  const maxMatch = msg.match(/^max:(\d+)$/);
  if (maxMatch) {
    const n = maxMatch[1];
    return locale === 'ar' ? `الحد الأقصى ${n} حرف` : `Maximum ${n} characters`;
  }

  const translated = ERROR_MESSAGES[msg];
  if (translated) return locale === 'ar' ? translated.ar : translated.en;

  // Handle Zod default messages
  if (msg.includes('too_small') || msg.includes('String must contain at least')) {
    return locale === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required';
  }
  if (msg.includes('too_big') || msg.includes('String must contain at most')) {
    return locale === 'ar' ? 'النص طويل جداً' : 'Text is too long';
  }
  if (msg.includes('invalid_type') || msg.includes('Expected number')) {
    return locale === 'ar' ? 'يرجى إدخال قيمة صحيحة' : 'Please enter a valid value';
  }

  return msg;
}
