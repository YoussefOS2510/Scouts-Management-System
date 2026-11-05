export interface SubdivisionTerms {
  singularAr: string;      // سداسي / طليعة / رهط
  pluralAr: string;        // سداسيات / طلائع / رهوط
  singularEn: string;      // Six / Patrol / Clan
  pluralEn: string;        // Sixes / Patrols / Clans
  unassignedAr: string;    // بدون سداسي محدد / بدون طليعة محددة / بدون رهط محدد
  unassignedEn: string;    // Unassigned to Six / Unassigned to Patrol / Unassigned to Clan
  boardTitleAr: string;    // لوحة توزيع سداسيات مرحلة: / لوحة توزيع طلائع مرحلة: / لوحة توزيع رهوط مرحلة:
  boardTitleEn: string;    // Sixes Distribution Board: / Patrol Distribution Board: / Clan Distribution Board:
  addNewAr: string;        // إضافة سداسي جديد / إضافة طليعة جديدة / إضافة رهط جديد
  addNewEn: string;        // + Add New Six / + Add New Patrol / + Add New Clan
  editTitleAr: string;     // تعديل اسم السداسي / تعديل اسم الطليعة / تعديل اسم الرهط
  editTitleEn: string;     // Edit Six Name / Edit Patrol Name / Edit Clan Name
  deleteTitleAr: string;   // حذف السداسي / حذف الطليعة / حذف الرهط
  deleteTitleEn: string;   // Delete Six / Delete Patrol / Delete Clan
  placeholderAr: string;   // مثال: سداسي الفل الأبيض / مثال: طليعة الفهد / مثال: رهط القديس مارمرقس
  placeholderEn: string;   // e.g. White Jasmine Six / e.g. Panther Patrol / e.g. St. Mark Clan
  isApplicable: boolean;   // false for leadership
}

/**
 * Returns accurate scouting subdivision terminology depending on the scout unit or stage group.
 * In Scouting traditions:
 * - Cubs & Brownies (Ashbal & Zahrat): "سداسيات" (Sixes)
 * - Scouts, Guides, Advanced, Senior Guides: "طلائع" (Patrols)
 * - Rovers (Gawala): "رهوط" (Clans)
 * - Leadership: Not applicable
 */
export function getSubdivisionTerms(unitIdOrStageGroup?: number | string | null): SubdivisionTerms {
  let stage = '';
  if (typeof unitIdOrStageGroup === 'number') {
    if (unitIdOrStageGroup === 1 || unitIdOrStageGroup === 2) stage = 'cubs';
    else if (unitIdOrStageGroup === 3 || unitIdOrStageGroup === 4) stage = 'brownies';
    else if (unitIdOrStageGroup === 5 || unitIdOrStageGroup === 6) stage = 'scouts';
    else if (unitIdOrStageGroup === 7 || unitIdOrStageGroup === 8) stage = 'guides';
    else if (unitIdOrStageGroup === 9) stage = 'advanced_scouts';
    else if (unitIdOrStageGroup === 10) stage = 'senior_guides';
    else if (unitIdOrStageGroup === 11) stage = 'rovers';
    else if (unitIdOrStageGroup === 12) stage = 'leadership';
  } else if (typeof unitIdOrStageGroup === 'string') {
    stage = unitIdOrStageGroup.toLowerCase().trim();
  }

  // 1. Cubs & Brownies (أشبال وزهرات -> سداسيات)
  if (stage === 'cubs' || stage === 'brownies' || stage.includes('شبال') || stage.includes('زهرات')) {
    return {
      singularAr: 'سداسي',
      pluralAr: 'سداسيات',
      singularEn: 'Six',
      pluralEn: 'Sixes',
      unassignedAr: 'بدون سداسي محدد',
      unassignedEn: 'Unassigned to Six',
      boardTitleAr: 'لوحة توزيع سداسيات مرحلة:',
      boardTitleEn: 'Sixes Distribution Board:',
      addNewAr: 'إضافة سداسي جديد',
      addNewEn: 'Add New Six',
      editTitleAr: 'تعديل اسم السداسي',
      editTitleEn: 'Edit Six Name',
      deleteTitleAr: 'تأكيد حذف السداسي',
      deleteTitleEn: 'Confirm Six Deletion',
      placeholderAr: 'مثال: سداسي الفل الأبيض أو سداسي النسر',
      placeholderEn: 'e.g. White Jasmine Six',
      isApplicable: true,
    };
  }

  // 2. Rovers (جوالة -> رهوط)
  if (stage === 'rovers' || stage.includes('جوالة') || stage.includes('جواله')) {
    return {
      singularAr: 'رهط',
      pluralAr: 'رهوط',
      singularEn: 'Clan',
      pluralEn: 'Clans',
      unassignedAr: 'بدون رهط محدد',
      unassignedEn: 'Unassigned to Clan',
      boardTitleAr: 'لوحة توزيع رهوط مرحلة:',
      boardTitleEn: 'Clan Distribution Board:',
      addNewAr: 'إضافة رهط جديد',
      addNewEn: 'Add New Clan',
      editTitleAr: 'تعديل اسم الرهط',
      editTitleEn: 'Edit Clan Name',
      deleteTitleAr: 'تأكيد حذف الرهط',
      deleteTitleEn: 'Confirm Clan Deletion',
      placeholderAr: 'مثال: رهط القديس مارمرقس',
      placeholderEn: 'e.g. St. Mark Clan',
      isApplicable: true,
    };
  }

  // 3. Leadership (قادة)
  if (stage === 'leadership' || stage === 'leaders' || stage.includes('قادة') || stage.includes('قاده')) {
    return {
      singularAr: 'قيادة',
      pluralAr: 'قيادات',
      singularEn: 'Leadership',
      pluralEn: 'Leadership',
      unassignedAr: 'غير منطبق',
      unassignedEn: 'N/A',
      boardTitleAr: 'هيئة القيادة والتدريب الكشفي',
      boardTitleEn: 'Leadership & Staff Board',
      addNewAr: 'غير منطبق',
      addNewEn: 'N/A',
      editTitleAr: 'غير منطبق',
      editTitleEn: 'N/A',
      deleteTitleAr: 'غير منطبق',
      deleteTitleEn: 'N/A',
      placeholderAr: '',
      placeholderEn: '',
      isApplicable: false,
    };
  }

  // 4. Scouts, Guides, Motakadem, Raedat (كشافة، مرشدات، متقدم، رائدات -> طلائع)
  return {
    singularAr: 'طليعة',
    pluralAr: 'طلائع',
    singularEn: 'Patrol',
    pluralEn: 'Patrols',
    unassignedAr: 'بدون طليعة محددة',
    unassignedEn: 'Unassigned to Patrol',
    boardTitleAr: 'لوحة توزيع طلائع مرحلة:',
    boardTitleEn: 'Patrol Distribution Board:',
    addNewAr: 'إضافة طليعة جديدة',
    addNewEn: 'Add New Patrol',
    editTitleAr: 'تعديل اسم الطليعة',
    editTitleEn: 'Edit Patrol Name',
    deleteTitleAr: 'تأكيد حذف الطليعة',
    deleteTitleEn: 'Confirm Patrol Deletion',
    placeholderAr: 'مثال: طليعة الفهد أو طليعة النسر',
    placeholderEn: 'e.g. Panther Patrol',
    isApplicable: true,
  };
}
