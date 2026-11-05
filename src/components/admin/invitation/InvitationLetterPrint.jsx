import { forwardRef } from 'react';
import { getCachedSchoolName } from '../../../utils/api';
import { getKhmerLunarDateString } from '../../../utils/khmerDate';

const KH_NUMBERS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
const toKhmerNum = (num) => String(num ?? '').split('').map((d) => KH_NUMBERS[parseInt(d, 10)] ?? d).join('');

const KH_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

// Format meeting date
const formatMeetingDate = (dateString, timeString) => {
  if (!dateString) {
    return (
      <span>
        នៅថ្ងៃ.............. ទី............ ខែ.............. ឆ្នាំ................ វេលាម៉ោង.................... ជាកំណត់។
      </span>
    );
  }
  const date = new Date(dateString);
  const dayNames = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
  const dayOfWeek = dayNames[date.getDay()] || '............';
  const day = toKhmerNum(date.getDate().toString().padStart(2, '0'));
  const month = KH_MONTHS[date.getMonth()] || '............';
  const year = toKhmerNum(date.getFullYear());
  const time = timeString ? toKhmerNum(timeString) : '....................';

  return (
    <span>
      នៅថ្ងៃ<strong>{dayOfWeek}</strong> ទី <strong>{day}</strong> ខែ <strong>{month}</strong> ឆ្នាំ <strong>{year}</strong> វេលាម៉ោង <strong>{time}</strong> ជាកំណត់។
    </span>
  );
};

// Single Invitation Letter Component (Exact replica of the school letter template)
function SingleInvitationLetter({ student = {}, config = {} }) {
  const schoolName = config.schoolName || getCachedSchoolName() || 'វិទ្យាល័យអង្គរកា';
  
  // Abbreviate school prefix for date header (e.g., វិទ្យាល័យអង្គរកា → វ.អង្គរកា)
  const schoolPrefix = schoolName.startsWith('វិទ្យាល័យ')
    ? 'វ.' + schoolName.replace(/^វិទ្យាល័យ\s*/, '')
    : schoolName.startsWith('អនុវិទ្យាល័យ')
    ? 'អ.' + schoolName.replace(/^អនុវិទ្យាល័យ\s*/, '')
    : schoolName;

  const today = new Date();
  const currentDay = toKhmerNum(today.getDate().toString().padStart(2, '0'));
  const currentMonth = KH_MONTHS[today.getMonth()];
  const currentYear = toKhmerNum(today.getFullYear());
  const lunarDateStr = getKhmerLunarDateString(today);

  return (
    <div className="single-letter w-full bg-white text-black relative flex flex-col justify-between py-1 px-3 font-normal">
      {/* ── Header ── */}
      <div className="relative w-full mb-1">
        {/* Top Left: School Name & Reference No */}
        <div className="absolute top-0 left-0 text-left leading-[1.4]">
          <div className="font-moul text-[15.5px] text-black">{schoolName}</div>
          <div className="text-[14.5px] mt-1 font-normal text-black">
            លេខ{config.reference ? <span className="font-bold border-b border-dotted border-black px-1.5">{toKhmerNum(config.reference)}</span> : '.......................'}
          </div>
        </div>

        {/* Top Center: Kingdom & National Motto */}
        <div className="text-center leading-[1.3] pt-0">
          <div className="font-moul text-[16.5px] tracking-wide text-black">ព្រះរាជាណាចក្រកម្ពុជា</div>
          <div className="font-moul text-[15px] tracking-wider mt-0.5 text-black">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
          <div className="ornament-symbol text-[20px] leading-none mt-0.5 text-black" style={{ fontFamily: 'Tacteing, "Khmer OS Muol Light", serif' }}>3</div>
        </div>

        {/* Top Right: Lunar & Solar Dates */}
        <div className="absolute top-0 right-0 text-right text-[14px] leading-[1.5] text-black whitespace-nowrap">
          <div>{lunarDateStr}</div>
          <div>{schoolPrefix} ថ្ងៃទី {currentDay} ខែ {currentMonth} ឆ្នាំ {currentYear}</div>
        </div>
      </div>

      {/* ── Title ── */}
      <div className="text-center my-2">
        <span className="font-moul text-[19px] text-black border-b-[1.5px] border-black pb-0.5 inline-block tracking-wide">
          លិខិតអញ្ជើញ{student.cycle > 1 ? ` (លើកទី ${toKhmerNum(student.cycle)})` : ''}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="text-[15.5px] leading-[28px] text-black space-y-0.5">
        <table className="w-full border-collapse border-none text-[15.5px]">
          <tbody>
            {/* Item 1: សូមគោរពអញ្ជើញ */}
            <tr className="align-top">
              <td className="w-[170px] whitespace-nowrap font-bold py-0.5 pr-2 border-none text-black">
                - សូមគោរពអញ្ជើញ ៖
              </td>
              <td className="py-0.5 border-none text-black">
                {student.parentName ? (
                  <>លោក/លោកស្រី <span className="font-bold border-b border-dotted border-black px-1.5">{student.parentName}</span></>
                ) : (
                  <>លោក/លោកស្រី......................................</>
                )}
                {' '}ជាអាណាព្យាបាលសិស្សឈ្មោះ{' '}
                {student.name ? (
                  <span className="font-bold border-b border-dotted border-black px-2 text-[16px]">{student.name}</span>
                ) : (
                  <>...................................</>
                )}
                <br />
                ភេទ {student.gender ? <span className="font-bold border-b border-dotted border-black px-1.5">{student.gender}</span> : '...............'}
                {' '}អាយុ {student.age ? <span className="font-bold border-b border-dotted border-black px-1.5">{toKhmerNum(student.age)}</span> : '..................'} ឆ្នាំ
                {' '}រៀនថ្នាក់ទី {student.class ? <span className="font-bold border-b border-dotted border-black px-2">{toKhmerNum(student.class)}</span> : '.....................'} នៃ{schoolName}។
                <br />
                ទីលំនៅបច្ចុប្បន្នភូមិ...................................ឃុំ.........................ស្រុក.................ខេត្ត...............
                <br />
                <span className="italic font-normal text-[14px]">(បញ្ជាក់៖ប្រសិនបើកូនលោក/លោកស្រីឈប់រៀនហើយ ពុំចាំបាច់អញ្ជើញមកទេ)</span>
              </td>
            </tr>

            {/* Item 2: ដើម្បីចូលរួម */}
            <tr className="align-top">
              <td className="whitespace-nowrap font-bold py-0.5 pr-2 border-none text-black">
                - ដើម្បីចូលរួម ៖
              </td>
              <td className="py-0.5 border-none text-black">
                ទទួលនូវព័ត៌មានមួយចំនួនដែលពាក់ព័ន្ធនឹងអវត្តមានកូនរបស់លោក/លោកស្រី។
              </td>
            </tr>

            {/* Item 3: កាលបរិច្ឆេទ */}
            <tr className="align-top">
              <td className="whitespace-nowrap font-bold py-0.5 pr-2 border-none text-black">
                - កាលបរិច្ឆេទ ៖
              </td>
              <td className="py-0.5 border-none text-black">
                {formatMeetingDate(config.meetingDate, config.meetingTime)}
              </td>
            </tr>

            {/* Item 4: ទីកន្លែង */}
            <tr className="align-top">
              <td className="whitespace-nowrap font-bold py-0.5 pr-2 border-none text-black">
                - ទីកន្លែង ៖
              </td>
              <td className="py-0.5 border-none text-black">
                <strong>{config.location || schoolName}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Closing sentence */}
        <div className="mt-2 text-justify indent-8 leading-[28px] text-black">
          សូមលោក/លោកស្រី និងប្អូនៗសិស្សានុសិស្សដែលមានឈ្មោះខាងលើអញ្ជើញចូលរួមកុំបីខាន និងទទួលនូវការគោរពរាប់អានដ៏ស្មោះអំពីខ្ញុំ។
        </div>

        {/* Signature Area */}
        <div className="mt-2 pr-14 text-right">
          <div className="font-moul text-[15.5px] text-black">នាយកសាលា</div>
          <div className="h-[46px]"></div>
        </div>
      </div>
    </div>
  );
}

const InvitationLetterPrint = forwardRef(({ selectedStudents = [], config = {} }, ref) => {
  // Mode:
  // 'duplicate': Each student gets 2 identical copies on their A4 sheet (Top & Bottom) -> Exactly matches school sample!
  // 'pair': 2 different students per A4 sheet (saves paper for bulk printing)
  const printMode = config.printMode || 'duplicate';

  const pages = [];
  if (printMode === 'pair') {
    for (let i = 0; i < selectedStudents.length; i += 2) {
      pages.push({
        topStudent: selectedStudents[i],
        bottomStudent: selectedStudents[i + 1] || selectedStudents[i]
      });
    }
  } else {
    // Default duplicate: 2 copies of the same student per A4 page
    selectedStudents.forEach((student) => {
      pages.push({
        topStudent: student,
        bottomStudent: student
      });
    });
  }

  return (
    <div className="hidden print:block">
      <div ref={ref} className="print-container text-black bg-white w-full h-full">
        <style type="text/css" media="print">
          {`
            @import url('https://fonts.googleapis.com/css2?family=Moul&family=Noto+Sans+Khmer:wght@400;700&family=Battambang:wght@400;700&display=swap');
            
            @page {
              size: A4 portrait;
              margin: 10mm 14mm;
            }
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              body * {
                visibility: hidden !important;
              }
              .print-container, .print-container * {
                visibility: visible !important;
              }
              .print-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
                font-family: 'Khmer OS Siemreap', 'Khmer OS Battambang', 'Noto Sans Khmer', 'Battambang', Arial, sans-serif;
              }
              .font-moul {
                font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', serif !important;
                font-weight: normal;
              }
              .ornament-symbol {
                font-family: 'Tacteing', 'Khmer OS Muol Light', serif;
              }
              .a4-page {
                height: 275mm;
                max-height: 275mm;
                page-break-inside: avoid;
                break-inside: avoid;
                page-break-after: always;
                break-after: page;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                overflow: hidden;
              }
              .a4-page:last-child {
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
              .letter-half {
                height: 133mm;
                max-height: 133mm;
                box-sizing: border-box;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
              }
            }
          `}
        </style>

        {pages.map((page, idx) => (
          <div key={idx} className="a4-page relative w-full h-[275mm] flex flex-col justify-between overflow-hidden">
            {/* Top Letter */}
            <div className="letter-half w-full flex-1 flex flex-col justify-start">
              <SingleInvitationLetter student={page.topStudent} config={config} />
            </div>

            {/* Middle Divider Line across the page (Matching school sample) */}
            <div className="divider-line my-1.5 w-full border-t border-black"></div>

            {/* Bottom Letter */}
            <div className="letter-half w-full flex-1 flex flex-col justify-start pt-1">
              <SingleInvitationLetter student={page.bottomStudent} config={config} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

InvitationLetterPrint.displayName = 'InvitationLetterPrint';
export default InvitationLetterPrint;
