// ─────────────────────────────────────────────
// Academic Calendar & School Holiday Engine for Cambodian Schools
// 1. វិស្សមកាលតូច (Small Vacation): 07 April to 19 April (Khmer New Year)
// 2. វិស្សមកាលធំ (Big Vacation): 01 September to 31 October (Reopens 01 November)
// 3. សម្រាកចុងសប្តាហ៍ (Weekend): Sunday (whole day) & Saturday Afternoon (>= 12:00 PM)
// ─────────────────────────────────────────────

export function getSchoolStatus(date = new Date()) {
  const month = date.getMonth() + 1; // 1 to 12
  const day = date.getDate(); // 1 to 31
  const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  // 1. វិស្សមកាលធំ (Big Vacation): September 1 to October 31 (reopens Nov 1)
  if (month === 1 || month === 2) {
    return {
      isOpen: false,
      type: 'BIG_VACATION',
      icon: '',
      badgeText: 'វិស្សមកាលធំ',
      title: 'វិស្សមកាលធំ',
      description: 'សាលារៀនកំពុងស្ថិតក្នុងវិស្សមកាលធំ (០១ កញ្ញា – ៣១ តុលា)។ ចូលរៀនវិញនៅថ្ងៃទី ០១ ខែវិច្ឆិកា។',
      reopenDate: 'ថ្ងៃទី ០១ ខែវិច្ឆិកា',
      canTakeAttendance: false
    };
  }

  // 2. វិស្សមកាលតូច (Small Vacation): April 7 to April 19 (Khmer New Year period)
  if (month === 4 && day >= 7 && day <= 19) {
    return {
      isOpen: false,
      type: 'SMALL_VACATION',
      icon: '',
      badgeText: 'វិស្សមកាលតូច',
      title: 'វិស្សមកាលតូច',
      description: 'សាលារៀនកំពុងស្ថិតក្នុងវិស្សមកាលតូច (០៧ មេសា – ១៩ មេសា)។ ចូលរៀនវិញនៅថ្ងៃទី ២០ ខែមេសា។',
      reopenDate: 'ថ្ងៃទី ២០ ខែមេសា',
      canTakeAttendance: false
    };
  }

  // 3. សម្រាកថ្ងៃអាទិត្យ (Sunday - Whole day)
  if (dayOfWeek === 0) {
    return {
      isOpen: false,
      type: 'SUNDAY_OFF',
      icon: '',
      badgeText: 'សម្រាកចុងសប្តាហ៍',
      title: 'ថ្ងៃអាទិត្យជាថ្ងៃឈប់សម្រាក',
      description: 'សាលារៀនមិនបើកបង្រៀនថ្ងៃអាទិត្យទេ។',
      reopenDate: 'ព្រឹកថ្ងៃច័ន្ទ',
      canTakeAttendance: false
    };
  }

  // 4. សម្រាករសៀលថ្ងៃសៅរ៍ (Saturday Afternoon - from 12:00 PM / 720 minutes)
  if (dayOfWeek === 6 && currentMinutes >= 720) {
    return {
      isOpen: false,
      type: 'SATURDAY_AFTERNOON_OFF',
      icon: '',
      badgeText: 'សម្រាករសៀលថ្ងៃសៅរ៍',
      title: 'រសៀលថ្ងៃសៅរ៍ ឈប់សម្រាក',
      description: 'រសៀលថ្ងៃសៅរ៍គ្មានម៉ោងសិក្សាឡើយ (រៀនតែវេនព្រឹក)។',
      reopenDate: 'ព្រឹកថ្ងៃច័ន្ទ',
      canTakeAttendance: false
    };
  }

  // 5. Regular School Session (សាលារៀនបើកដំណើរការធម្មតា)
  return {
    isOpen: true,
    type: 'REGULAR_DAY',
    icon: '',
    badgeText: 'ថ្ងៃសិក្សាធម្មតា',
    title: 'ថ្ងៃសិក្សាធម្មតា',
    description: '',
    canTakeAttendance: true
  };
}
