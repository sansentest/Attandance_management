import { toKhmerLunarDate } from 'khmer-chhankitek-calendar';

/**
 * ទទួលបានកាលបរិច្ឆេទតាមចន្ទគតិខ្មែរ (Khmer Lunar Calendar)
 * ឧទាហរណ៍៖ "ថ្ងៃព្រហស្បតិ៍ ១០ រោច ខែអស្សុជ ឆ្នាំមមី អដ្ឋស័ក ព.ស. ២៥៧០"
 * @param {Date|string|number} [date=new Date()]
 * @returns {string}
 */
export function getKhmerLunarDateString(date = new Date()) {
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) {
      return 'ថ្ងៃ.................ខែ...........ឆ្នាំ................ព.ស២៥......';
    }
    const lunar = toKhmerLunarDate(d);
    return `ថ្ងៃ${lunar.dayOfWeek} ${lunar.moonDayKhmer} ${lunar.moonStatus} ខែ${lunar.khmerMonth} ឆ្នាំ${lunar.animalYear} ${lunar.sak} ព.ស. ${lunar.buddhistEraYearKhmer}`;
  } catch (err) {
    console.error('Error calculating Khmer lunar date:', err);
    return 'ថ្ងៃ.................ខែ...........ឆ្នាំ................ព.ស២៥......';
  }
}

