import AdminInvitationLetters from './AdminInvitationLetters'
import { isTeacher } from '../../../utils/accessControl'

/**
 * Dedicated Teacher-only Invitation Letters page.
 * Keeps the identical UI while restricting actions strictly to printing letters
 * and viewing print history (read-only history, no resolve/delete/re-invite/settings).
 */
export default function TeacherInvitationLetters({ session }) {
  if (!isTeacher(session)) return null
  return <AdminInvitationLetters session={session} teacherRestricted />
}

