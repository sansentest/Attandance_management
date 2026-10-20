// API Utility (MOCKED FOR UI DEVELOPMENT)

export async function api(action, body = {}, token = null) {
  console.log(`[API Mock] Action: ${action}`, body);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  switch (action) {
    case 'auth.login':
      return {
        success: true,
        data: {
          token: 'mock_token_123',
          username: body.username,
          role: body.username === 'admin' ? 'admin' : 'monitor',
          className: body.username === 'admin' ? 'ALL' : '12A',
          fullName: body.username === 'admin' ? 'System Admin' : 'Sok Dara',
          expiresAt: Date.now() + 86400000
        }
      };

    case 'schedule.current':
      if (body.className === 'ALL' || !body.className) {
        return { success: true, data: { currentPeriod: null } };
      }
      return {
        success: true,
        data: {
          currentTime: '10:15',
          dayOfWeek: 'Monday',
          currentPeriod: {
            period: 2,
            subject: 'Mathematics',
            startTime: '10:00',
            endTime: '11:30',
            teacher: 'Mr. Seng'
          }
        }
      };

    case 'reports.daily':
      return {
        success: true,
        data: {
          className: body.className,
          date: body.date,
          present: 25,
          absent: 3,
          leave: 2,
          totalStudents: 30,
          attendanceRate: '83%',
          absentStudents: ['Chan Vuthy', 'Sok Mean', 'Keo Rotha'],
          periodBreakdown: [
            { period: 1, subject: 'Khmer', absent: 1, leave: 2 },
            { period: 2, subject: 'Math', absent: 3, leave: 2 }
          ]
        }
      };

    case 'reports.allClasses':
      return {
        success: true,
        data: {
          summaries: [
            { className: '12A', present: 25, absent: 3, leave: 2, rate: '83%' },
            { className: '12B', present: 28, absent: 0, leave: 2, rate: '93%' },
            { className: '11A', present: 30, absent: 1, leave: 0, rate: '96%' }
          ]
        }
      };

    case 'reports.weekly':
      return {
        success: true,
        data: {
          periodLabel: 'សប្តាហ៍នេះ',
          totalAbsences: 12,
          totalLeaves: 4,
          attendanceRate: '91%',
          dailyTrend: [
            { date: 'ច័ន្ទ', absent: 2 },
            { date: 'អង្គារ', absent: 5 },
            { date: 'ពុធ', absent: 1 },
            { date: 'ព្រហ', absent: 4 },
            { date: 'សុក្រ', absent: 0 }
          ],
          topAbsentStudents: [
            { name: 'Sok Mean', absences: 3, leaves: 0 },
            { name: 'Keo Rotha', absences: 2, leaves: 1 }
          ]
        }
      };

    case 'reports.monthly':
      return {
        success: true,
        data: {
          periodLabel: 'ខែនេះ (មិថុនា)',
          totalAbsences: 45,
          totalLeaves: 15,
          attendanceRate: '87%',
          dailyTrend: [
            { date: 'សប្តាហ៍១', absent: 10 },
            { date: 'សប្តាហ៍២', absent: 15 },
            { date: 'សប្តាហ៍៣', absent: 12 },
            { date: 'សប្តាហ៍៤', absent: 8 }
          ],
          topAbsentStudents: [
            { name: 'Chan Vuthy', absences: 8, leaves: 2 },
            { name: 'Sok Mean', absences: 6, leaves: 0 },
            { name: 'Keo Rotha', absences: 5, leaves: 3 },
            { name: 'Meas Sophea', absences: 4, leaves: 4 }
          ]
        }
      };

    case 'reports.yearly':
      return {
        success: true,
        data: {
          periodLabel: 'ឆ្នាំនេះ (២០២៦)',
          totalAbsences: 120,
          totalLeaves: 45,
          attendanceRate: '94%',
          dailyTrend: [
            { date: 'មករា', absent: 15 },
            { date: 'កុម្ភៈ', absent: 12 },
            { date: 'មីនា', absent: 18 },
            { date: 'មេសា', absent: 10 },
            { date: 'ឧសភា', absent: 20 },
            { date: 'មិថុនា', absent: 45 }
          ],
          topAbsentStudents: [
            { name: 'Chan Vuthy', absences: 20, leaves: 5 },
            { name: 'Sok Mean', absences: 18, leaves: 2 },
            { name: 'Keo Rotha', absences: 15, leaves: 8 },
            { name: 'Chea Vibol', absences: 12, leaves: 3 }
          ]
        }
      };

    case 'reports.warnings':
      return {
        success: true,
        data: {
          warningCount: 2,
          threshold: 3,
          students: [
            { name: 'Chan Vuthy', studentId: '005', className: '12A', absences: 5 },
            { name: 'Sok Mean', studentId: '012', className: '12A', absences: 4 }
          ]
        }
      };

    case 'students.getByClass':
      return {
        success: true,
        data: [
          { id: '001', name: 'Sok Dara', gender: 'M', status: 'PRESENT' },
          { id: '002', name: 'Chan Vuthy', gender: 'M', status: 'PRESENT' },
          { id: '003', name: 'Keo Rotha', gender: 'F', status: 'ABSENT' },
          { id: '004', name: 'Meas Sophea', gender: 'F', status: 'LEAVE' },
          { id: '005', name: 'Chea Vibol', gender: 'M', status: 'PRESENT' },
        ]
      };

    case 'leave.getByClass':
      return {
        success: true,
        data: {
          records: [
            {
              studentId: '004',
              name: 'Meas Sophea',
              className: body.className || '12A',
              startDate: '2026-06-29',
              endDate: '2026-06-30',
              reason: 'Family event in the province.',
              approvedBy: 'Sok Dara (Monitor)'
            },
            {
              studentId: '008',
              name: 'Tith Seyha',
              className: body.className || '12A',
              startDate: '2026-06-28',
              endDate: '2026-06-28',
              reason: 'Sick leave (fever).',
              approvedBy: 'System Admin'
            }
          ]
        }
      };

    case 'leave.submit':
    case 'leave.delete':
    case 'attendance.save':
      return { success: true, data: { message: 'Success (Mocked)' } };

    default:
      return { success: false, error: 'Unknown action' };
  }
}

// Session Management Helpers
export function saveSession(session) {
  try {
    localStorage.setItem('att_session', JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session', e);
  }
}

export function loadSession() {
  try {
    const raw = localStorage.getItem('att_session');
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s.expiresAt && Date.now() > s.expiresAt) {
      clearSession();
      return null;
    }
    return s;
  } catch (e) {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem('att_session');
}
