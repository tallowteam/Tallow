/**
 * Arabic (العربية) Translations
 * RTL (Right-to-Left) Language
 */

import type { TranslationKeys } from '../types';

const translations: Partial<TranslationKeys> = {
  // Common
  'common.loading': 'جاري التحميل...',
  'common.error': 'خطأ',
  'common.success': 'نجح',
  'common.cancel': 'إلغاء',
  'common.confirm': 'تأكيد',
  'common.close': 'إغلاق',
  'common.save': 'حفظ',
  'common.delete': 'حذف',
  'common.edit': 'تحرير',
  'common.search': 'بحث',
  'common.settings': 'الإعدادات',
  'common.language': 'اللغة',

  // Navigation
  'nav.home': 'الرئيسية',
  'nav.features': 'المميزات',
  'nav.security': 'الأمان',
  'nav.pricing': 'الأسعار',
  'nav.docs': 'المستندات',
  'nav.openApp': 'فتح التطبيق',

  // Hero Section
  'hero.title': 'نقل ملفات آمن، محمي ضد الحوسبة الكمومية',
  'hero.subtitle': 'شارك الملفات مباشرة مع تشفير عسكري الدرجة. بدون خوادم، بدون تتبع، فقط خصوصية نقية.',
  'hero.cta.primary': 'ابدأ النقل',
  'hero.cta.secondary': 'معرفة المزيد',

  // Features
  'features.title': 'لماذا تختار Tallow؟',
  'features.subtitle': 'أمان رائد في الصناعة يلتقي بأداء فائق السرعة',
  'features.p2p.title': 'نقل مباشر حقيقي',
  'features.p2p.description': 'اتصال مباشر بين الأجهزة. ملفاتك لا تلمس خوادمنا أبداً.',
  'features.encryption.title': 'تشفير ما بعد الكم',
  'features.encryption.description': 'أمان مقاوم للمستقبل مع Kyber-1024 و ChaCha20-Poly1305.',
  'features.speed.title': 'سريع جداً',
  'features.speed.description': 'انقل الملفات بسرعة الشبكة الكاملة مع التقسيم المتوازي.',

  // Transfer
  'transfer.selectFiles': 'اختر الملفات',
  'transfer.dropFiles': 'أسقط الملفات هنا',
  'transfer.connecting': 'جاري الاتصال...',
  'transfer.connected': 'متصل',
  'transfer.transferring': 'جاري النقل',
  'transfer.complete': 'اكتمل النقل',
  'transfer.failed': 'فشل النقل',

  // File Management
  'files.count': '{{count}} ملف',
  'files.count_plural': '{{count}} ملفات',
  'files.size': 'الحجم: {{size}}',
  'files.uploaded': 'تم الرفع',
  'files.downloading': 'جاري التنزيل',

  // Security
  'security.encrypted': 'مشفر',
  'security.verified': 'تم التحقق',
  'security.quantum': 'مقاوم للكم',

  // Errors
  'error.network': 'حدث خطأ في الشبكة',
  'error.fileSize': 'حجم الملف يتجاوز الحد المسموح',
  'error.upload': 'فشل الرفع',
  'error.download': 'فشل التنزيل',
  'error.connection': 'فقد الاتصال',

  // Accessibility
  'a11y.skipToContent': 'تخطي إلى المحتوى الرئيسي',
  'a11y.menu': 'فتح قائمة التنقل',
  'a11y.closeMenu': 'إغلاق قائمة التنقل',
  'a11y.darkMode': 'التبديل إلى الوضع الداكن',
  'a11y.lightMode': 'التبديل إلى الوضع الفاتح',

  // Footer
  'footer.copyright': '© {{year}} Tallow. جميع الحقوق محفوظة.',
  'footer.privacy': 'سياسة الخصوصية',
  'footer.terms': 'شروط الخدمة',
  'footer.contact': 'اتصل بنا',
};

export default translations;
