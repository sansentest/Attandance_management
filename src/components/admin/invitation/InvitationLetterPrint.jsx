import { forwardRef } from 'react';

const InvitationLetterPrint = forwardRef(({ selectedStudents, config = {} }, ref) => {
  
  // Format Date Function (convert YYYY-MM-DD to Khmer text format roughly)
  const formatKhmerDate = (dateString) => {
    if (!dateString) return '....... ខែ ........ ឆ្នាំ២០២...';
    const date = new Date(dateString);
    const months = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
    
    // Get Khmer numeral mapping
    const khmerNumbers = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    const toKhmerNum = (num) => String(num).split('').map(d => khmerNumbers[parseInt(d)] || d).join('');
    
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `ទី ${toKhmerNum(day)} ខែ ${months[date.getMonth()]} ឆ្នាំ ${toKhmerNum(year)}`;
  };

  const toKhmerNum = (num) => {
    const khmerNumbers = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    return String(num).split('').map(d => khmerNumbers[parseInt(d)] || d).join('');
  }

  // Generate current date for header
  const today = new Date();
  const currentKhmerDate = `ថ្ងៃទី ${toKhmerNum(today.getDate().toString().padStart(2, '0'))} ខែ ${['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'][today.getMonth()]} ឆ្នាំ ${toKhmerNum(today.getFullYear())}`;

  return (
    <div className="hidden print:block">
      <div ref={ref} className="print-container text-black bg-white w-full h-full font-khmer">
        <style type="text/css" media="print">
          {`
            @import url('https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&family=Moul&display=swap');
            
            @page { size: A5 landscape; margin: 15mm; }
            @media print {
              body * { visibility: hidden !important; }
              .print-container, .print-container * { visibility: visible !important; }
              .print-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; font-family: 'Battambang', serif; }
              .page-break { page-break-after: always; }
              .no-page-break { page-break-inside: avoid; }
              .font-moul { font-family: 'Moul', serif; }
            }
          `}
        </style>

        {selectedStudents.map((student, index) => (
          <div key={student.id} className={`w-full max-w-[210mm] mx-auto min-h-[148mm] p-4 bg-white relative ${index !== selectedStudents.length - 1 ? 'page-break' : ''}`}>
            
            {/* National Motto - Center Top */}
            <div className="absolute top-4 left-0 w-full text-center">
              <h1 className="text-[16px] font-moul mb-1 tracking-wider">ព្រះរាជាណាចក្រកម្ពុជា</h1>
              <h2 className="text-[14px] font-moul mb-2 tracking-widest">ជាតិ សាសនា ព្រះមហាក្សត្រ</h2>
              <div className="flex justify-center mb-1">
                 <svg width="60" height="15" viewBox="0 0 100 20">
                    <path d="M10,10 Q50,-10 90,10" fill="transparent" stroke="black" strokeWidth="2"/>
                    <path d="M10,15 Q50,-5 90,15" fill="transparent" stroke="black" strokeWidth="2"/>
                 </svg>
              </div>
            </div>

            {/* School Info - Top Left */}
            <div className="absolute top-4 left-4 text-left">
              <h3 className="text-[14px] font-moul mb-2">វិទ្យាល័យអង្គរកា</h3>
              <p className="text-[13px] font-bold">លេខ <span className="font-normal">{config.reference || '.........................'}</span></p>
            </div>

            {/* Dates - Top Right */}
            <div className="absolute top-[4.5rem] right-4 text-right flex flex-col items-end text-[12px] italic">
              <p className="mb-1">ថ្ងៃ.............................ខែ...................ឆ្នាំ...................ព.ស ២៥៦...</p>
              <p>អង្គរកា, {currentKhmerDate}</p>
            </div>

            {/* Title */}
            <div className="mt-28 mb-6 text-center">
              <h2 className="text-[18px] font-moul inline-block border-b-2 border-black pb-1">លិខិតអញ្ជើញ</h2>
            </div>

            {/* Content Table-like Structure */}
            <div className="text-[13px] leading-[26px] pl-2 pr-4 space-y-1">
              
              <div className="flex items-start">
                <div className="w-[120px] shrink-0 font-bold">- សូមគោរពអញ្ជើញ :</div>
                <div className="flex-1">
                  លោក/លោកស្រី .............................................................. ជាអាណាព្យាបាលសិស្សឈ្មោះ <span className="font-bold border-b border-dotted border-black px-4">{student.name}</span>
                  <br />
                  ភេទ <span className="font-bold border-b border-dotted border-black px-2">{student.gender || 'ប្រុស'}</span> អាយុ ............ ឆ្នាំ រៀនថ្នាក់ទី <span className="font-bold border-b border-dotted border-black px-2">{toKhmerNum(student.class)}</span> នៃវិទ្យាល័យអង្គរកា។
                  <br />
                  ទីលំនៅបច្ចុប្បន្នភូមិ................................................ ឃុំ................................................ ស្រុក................................................ ខេត្ត................................................
                  <br />
                  <span className="italic">(បញ្ជាក់៖ ប្រសិនបើកូនលោក/លោកស្រីឈប់រៀនហើយ ពុំបាច់អញ្ជើញមកទេ)</span>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-[120px] shrink-0 font-bold">- ដើម្បីចូលរួម :</div>
                <div className="flex-1">
                  ទទួលនូវព័ត៌មានមួយចំនួនដែលពាក់ព័ន្ធនឹងអវត្តមានកូនរបស់លោក/លោកស្រី។
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-[120px] shrink-0 font-bold">- កាលបរិច្ឆេទ :</div>
                <div className="flex-1">
                  នៅ <span className="font-bold">{config.meetingDate ? formatKhmerDate(config.meetingDate) : 'ថ្ងៃ ........... ទី ....... ខែ ............ ឆ្នាំ ២០២...'}</span> វេលាម៉ោង <span className="font-bold">{config.meetingTime ? toKhmerNum(config.meetingTime) : '...................'}</span> ជាកំហិត។
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-[120px] shrink-0 font-bold">- ទីកន្លែង :</div>
                <div className="flex-1">
                  <span className="font-bold">{config.location || 'វិទ្យាល័យអង្គរកា'}</span>
                </div>
              </div>
              
              <div className="mt-4 indent-8 text-justify leading-7">
                សូមលោក/លោកស្រី និងប្អូនៗសិស្សានុសិស្សដែលមានឈ្មោះខាងលើអញ្ជើញចូលរួមឱ្យបាន និងសូមទទួលនូវការគោរពរាប់អានដ៏ស្មោះអំពីខ្ញុំ។
              </div>

            </div>

            {/* Signature Area */}
            <div className="mt-8 pr-12 text-right">
              <h4 className="text-[14px] font-moul mb-[60px]">នាយកសាលា</h4>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
});

InvitationLetterPrint.displayName = 'InvitationLetterPrint';
export default InvitationLetterPrint;
