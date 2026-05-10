# سجل التغييرات والإصلاحات — RIS Platform

## 2026-04-17

### إصلاحات حرجة

#### 1. إصلاح خطأ Base UI #31 — تعطّل جميع الصفحات

- **المشكلة:** جميع الصفحات المحمية (الملف الشخصي، لوحة الإدارة، الإعدادات) كانت تعرض "This page couldn't load"
- **السبب:** مكوّن `DropdownMenuLabel` يتطلب أن يكون داخل `DropdownMenuGroup` في @base-ui/react، لكنه كان موضوعاً مباشرة داخل `DropdownMenuContent`
- **الملفات المعدّلة:**
  - `src/components/layout/user-menu.tsx`
  - `src/components/researchers/sort-dropdown.tsx`

#### 2. إصلاح صفحة الملف الشخصي (manage-profile)

- **المشكلة:** عند الضغط على أيقونة الملف الشخصي تظهر "This page couldn't load"
- **السبب:** الصفحة كانت تستعلم من `researchers_public` (يعرض فقط `is_public = true`)، فإذا لم يكن الملف عاماً، الصفحة تفشل
- **الحل:** الاستعلام مباشرة من الجداول الأساسية (`researcher_publications`, `researcher_skills`, إلخ) — سياسات RLS تسمح للمالك بالوصول لبياناته
- **الملفات المعدّلة:**
  - `src/app/[locale]/manage-profile/page.tsx`

#### 3. إصلاح رؤية البيانات للمستخدمين الآخرين

- **المشكلة:** عند تسجيل دخول مستخدم آخر، تظهر البيانات صفر
- **السبب:** سياسات RLS على جدول `researchers` كانت تسمح فقط للمالك (رؤية بياناته) والأدمن (رؤية الكل). لا يوجد سياسة تسمح للمستخدم المسجّل أو الزائر برؤية الملفات العامة
- **الحل:** إضافة سياستين جديدتين:
  - `authenticated_select_public` — المستخدمون المسجلون يرون الملفات العامة
  - `anon_select_public` — الزوار بدون حساب يرون الملفات العامة
- **الملفات المعدّلة:**
  - `supabase/migrations/20260417180000_fix_public_visibility_and_auto_create.sql`

#### 4. إنشاء ملف باحث تلقائي عند التسجيل

- **المشكلة:** المستخدمون الجدد لا يحصلون على ملف باحث — يُوضعون فقط في `pending_profile_claims`
- **الحل:** تحديث trigger `link_user_to_researcher_on_signup` ليقوم تلقائياً بإنشاء ملف باحث جديد مع استخراج الاسم من بيانات Google
- **الملفات المعدّلة:**
  - `supabase/migrations/20260417180000_fix_public_visibility_and_auto_create.sql`

---

### تحسينات واجهة المستخدم

#### 5. صفحة 404 إبداعية

- رائد فضاء SVG يطفو في الفضاء مع خلفية شبكية وجسيمات متوهجة
- نص ثنائي اللغة: "الصفحة غير موجودة أو لم يتم إنشاؤها بعد. نعتذر عن هذا الخلل"
- أزرار للعودة للرئيسية أو صفحة الباحثين
- **الملف:** `src/app/[locale]/not-found.tsx`

#### 6. إشعار بريد الجامعة في صفحة تسجيل الدخول

- إشعار بارز بلون أزرق مع أيقونة معلومات فوق زر Sign in
- يوضح أن تسجيل الدخول متاح فقط لحسابات `@algonest.tech`
- **الملف:** `src/app/[locale]/sign-in/sign-in-form.tsx`

#### 7. دليل تنصيب إضافة Chrome المحسّن

- wizard تفاعلي من 6 خطوات مع رسوم توضيحية
- شريط تقدم وأزرار Next/Back
- نص ثنائي اللغة (EN/AR) لكل خطوة
- **الملف:** `src/components/manage/tabs/publications-tab.tsx`

---

### إصلاحات تقنية أخرى

#### 8. إصلاح Bookmarklet الاستيراد من Google Scholar

- **المشكلة:** لا يعمل بسبب سياسة `SameSite=Lax` — الكوكيز لا تُرسل مع POST من موقع آخر
- **الحل:** تغيير من form POST إلى GET navigation عبر URL hash + صفحة عميل تقرأ البيانات وترسلها عبر fetch
- **الملفات:**
  - `src/app/[locale]/import-scholar/page.tsx` (جديد)
  - `src/app/api/import/scholar-auto/route.ts` (يقبل JSON POST)
  - `src/components/manage/tabs/publications-tab.tsx`

#### 9. إصلاح أيقونات إضافة Chrome

- **المشكلة:** `manifest.json` يشير لأيقونات غير موجودة → خطأ عند التنصيب
- **الحل:** إنشاء أيقونات PNG (16/48/128) وإضافتها للـ ZIP
- **الملف:** `public/extension/ris-scholar-importer.zip`

#### 10. صفحة Branding (الشعار والأيقونة)

- صفحة إدارة لرفع/تغيير favicon وlogo من لوحة الإدارة
- معاينة مباشرة وحفظ في `app_settings` DB
- الهيدر يقرأ الشعار من قاعدة البيانات
- **الملفات:**
  - `src/app/[locale]/admin/branding/page.tsx`
  - `src/app/[locale]/admin/branding/branding-form.tsx`
  - `src/components/layout/header.tsx`

---

## مهام معلّقة

- [ ] إصلاح القوائم المنسدلة (تعرض UUIDs بدل الأسماء) — يحتاج حل بديل لا يكسر base-ui
- [ ] جلب بيانات Scopus للجامعة وعرضها في الرئيسية والإحصائيات
- [ ] عند الضغط على عدّاد الأبحاث تظهر قائمة الأبحاث مع تصنيف
- [ ] عرض بيانات Scopus العامة لجميع الباحثين والزوار
- [ ] حذف ملفات التشخيص المؤقتة (`error.tsx`, `DebugError` في manage-profile)
