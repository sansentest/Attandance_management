import { useState, useRef, useEffect } from 'react';
import {
  X, User, Lock, Eye, EyeOff, Save, Loader2, Camera,
  CheckCircle2, AlertCircle, Phone, AtSign, Crown, GraduationCap, Sparkles, RefreshCw
} from 'lucide-react';
import { api, loadSession, saveSession } from '../utils/api';

// Helper function to compress uploaded avatar to high-quality lightweight Base64 string
const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function MonitorProfileModal({
  isOpen,
  onClose,
  session,
  onUpdateSession
}) {
  const fileInputRef = useRef(null);

  const active = session || loadSession() || {};
  const [name, setName] = useState(active.fullName || active.name || active.username || '');
  const [username, setUsername] = useState(active.username || '');
  const [phone, setPhone] = useState(active.phone || '');
  const [avatar, setAvatar] = useState(active.avatar || null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [usernameWarning, setUsernameWarning] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      const current = session || loadSession() || {};
      setName(current.fullName || current.name || current.username || '');
      setUsername(current.username || '');
      setPhone(current.phone || '');
      setAvatar(current.avatar || null);
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
      setUsernameWarning('');
      setIsReloading(false);
    }
  }, [isOpen, session]);

  if (!isOpen) return null;

  // Handle strictly English and Numbers for Username
  const handleUsernameChange = (e) => {
    const raw = e.target.value;
    // Allow only lowercase English letters (a-z), numbers (0-9) and underscore (_)
    const sanitized = raw.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(sanitized);

    if (raw !== sanitized && /[^a-zA-Z0-9_]/.test(raw)) {
      setUsernameWarning('ឈ្មោះគណនីអនុញ្ញាតតែអក្សរអង់គ្លេស (a-z) និងលេខ (0-9) ប៉ុណ្ណោះ មិនអាចវាយអក្សរខ្មែរ ឬដកឃ្លាបានទេ!');
    } else {
      setUsernameWarning('');
    }
  };

  // Handle avatar photo upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('សូមជ្រើសរើសឯកសារជារូបភាព (JPG, PNG)!');
      return;
    }

    try {
      const compressed = await compressImage(file, 400, 400, 0.85);
      setAvatar(compressed);
      setError('');
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setError('មិនអាចដំណើរការរូបភាពបានទេ។ សូមព្យាយាមម្តងទៀត!');
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccess('');

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanName = name.trim();

    if (!cleanName) {
      setError('សូមបញ្ចូលឈ្មោះពេញ!');
      return;
    }

    if (!cleanUsername) {
      setError('សូមបញ្ចូលឈ្មោះគណនី (Username)!');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setError('ឈ្មោះគណនី (Username) ត្រូវប្រើតែអក្សរអង់គ្លេស និងលេខប៉ុណ្ណោះ (a-z, 0-9)!');
      return;
    }

    if (cleanUsername.length < 3) {
      setError('ឈ្មោះគណនីត្រូវមានយ៉ាងតិច ៣ តួអក្សរ!');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setError('ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៦ តួអក្សរ!');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('ពាក្យសម្ងាត់ថ្មី និងការបញ្ជាក់មិនត្រូវគ្នាទេ!');
        return;
      }
    }

    setIsSaving(true);

    try {
      // 1. Fetch existing users to check username collision & get DB record
      let existingRecord = null;
      let allUsers = [];

      try {
        const res = await api('users.getAll');
        if (res?.success && Array.isArray(res.data)) {
          allUsers = res.data;
          existingRecord = allUsers.find(
            (u) =>
              u.id === active.id ||
              (u.username || '').toLowerCase() === (active.username || '').toLowerCase()
          );

          // Check if the NEW username is already taken by someone else
          const isTaken = allUsers.some(
            (u) =>
              (u.username || '').toLowerCase() === cleanUsername &&
              u.id !== (existingRecord?.id || active.id)
          );

          if (isTaken) {
            setError(`ឈ្មោះគណនី "${cleanUsername}" នេះមានអ្នកប្រើរួចហើយ! សូមប្តូរឈ្មោះថ្មី`);
            setIsSaving(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Check user collision fallback:', err);
      }

      // 2. Prepare user payload for Database
      const targetId = existingRecord?.id || active.id || `USR-${cleanUsername}`;
      const userToSave = {
        id: targetId,
        name: cleanName,
        username: cleanUsername,
        phone: phone.trim(),
        avatar: avatar || null,
        role: existingRecord?.role || active.role || 'monitor',
        class: existingRecord?.class || active.className || '',
        status: existingRecord?.status || 'active',
        lastLogin: existingRecord?.lastLogin || active.lastLogin || 'មិនទាន់ចូលប្រើ',
        ...(newPassword ? { password: newPassword } : (existingRecord?.password ? { password: existingRecord.password } : {})),
        lastModified: new Date().toISOString()
      };

      // 3. Save to database/backend via api('users.save')
      const saveRes = await api('users.save', { user: userToSave });
      if (!saveRes?.success) {
        throw new Error(saveRes?.error || 'ការរក្សាទុកបរាជ័យ');
      }

      // 4. Update current active session in localStorage
      const updatedSession = {
        ...active,
        id: userToSave.id,
        username: userToSave.username,
        fullName: userToSave.name,
        phone: userToSave.phone,
        avatar: userToSave.avatar,
        className: userToSave.class || active.className
      };
      saveSession(updatedSession);

      // 5. Notify parent App/Dashboard
      if (onUpdateSession) {
        onUpdateSession(updatedSession);
      }

      setSuccess('បានធ្វើបច្ចុប្បន្នភាពគណនីដោយជោគជ័យ!');
      setIsReloading(true);

      // Trigger actual browser reload after brief animated confirmation
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error('Update monitor profile error:', err);
      setError(err?.message || 'មានបញ្ហាក្នុងការរក្សាទុកព័ត៌មាន!');
    } finally {
      setIsSaving(false);
    }
  };

  const displayClass = session?.className
    ? session.className.startsWith('ថ្នាក់')
      ? session.className
      : `ថ្នាក់ ${session.className}`
    : 'មិនទាន់មានថ្នាក់';

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header Banner */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 pt-6 px-6 pb-6 text-white overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-white opacity-10 blur-xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-28 h-28 rounded-full bg-indigo-400 opacity-20 blur-lg pointer-events-none"></div>

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              {/* Avatar with Upload button */}
              <div className="relative group shrink-0">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center shadow-md overflow-hidden">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={34} className="text-white" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-6 h-6 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-full flex items-center justify-center shadow-md border-2 border-white transition-transform active:scale-90 cursor-pointer"
                  title="ប្តូររូបថតគណនី"
                >
                  <Camera size={13} strokeWidth={2.5} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div>
                <h3 className="text-[19px] sm:text-[21px] font-black leading-tight drop-shadow-sm">
                  {name || 'ប្រធានថ្នាក់'}
                </h3>
                <p className="text-[13px] text-indigo-100 font-mono mt-0.5 opacity-90">
                  @{username || 'username'}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white border border-white/25">
                    <Crown size={12} className="text-yellow-300" fill="currentColor" /> ប្រធានថ្នាក់
                  </span>
                  <span className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white border border-white/25">
                    <GraduationCap size={12} className="text-sky-200" fill="currentColor" /> {displayClass}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4.5 bg-slate-50/40 flex-1">
          {/* Alerts */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-[12.5px] font-medium flex items-center gap-2.5 animate-in fade-in duration-150">
              <AlertCircle size={17} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[12.5px] font-medium flex items-center gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 size={17} className="shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-bold text-slate-700 flex items-center gap-1.5">
              <User size={14} className="text-indigo-600" />
              <span>ឈ្មោះពេញ (Full Name)</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ឧ. សុខ ពិសិដ្ឋ"
              className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 px-3.5 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[12.5px] font-bold text-slate-700 flex items-center gap-1.5">
                <AtSign size={14} className="text-indigo-600" />
                <span>ឈ្មោះគណនី (Username)</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-medium text-slate-400">
                អក្សរអង់គ្លេស & លេខប៉ុណ្ណោះ
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="ឧ. monitor10a"
                className={`w-full bg-white border text-slate-800 py-2.5 pl-3.5 pr-20 rounded-xl font-mono text-[13px] focus:outline-none focus:ring-4 transition-all placeholder:text-slate-400 shadow-2xs ${
                  usernameWarning
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                    : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                a-z, 0-9
              </span>
            </div>
            {usernameWarning ? (
              <p className="text-[11.5px] font-medium text-rose-500 flex items-center gap-1 animate-in fade-in duration-150">
                <AlertCircle size={13} className="shrink-0" />
                <span>{usernameWarning}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">
                កំណត់ជាអក្សរអង់គ្លេសតូច (a-z) និងលេខ (0-9) សម្រាប់ Login ចូលប្រព័ន្ធ។
              </p>
            )}
          </div>

          {/* Phone (Optional) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-bold text-slate-700 flex items-center gap-1.5">
              <Phone size={14} className="text-indigo-600" />
              <span>លេខទូរស័ព្ទ (Phone Number)</span>
              <span className="text-[11px] font-normal text-slate-400">(ស្រេចចិត្ត)</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="ឧ. 012 345 678"
              className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 px-3.5 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          {/* Divider */}
          <div className="pt-2 border-t border-slate-200/80">
            <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-800 mb-1">
              <Lock size={14} className="text-amber-500" />
              <span>ប្តូរពាក្យសម្ងាត់ (Change Password)</span>
            </div>
            <p className="text-[11.5px] text-slate-400">
              សូមទុកទទេ ប្រសិនបើមិនចង់ផ្លាស់ប្តូរពាក្យសម្ងាត់ទេ។
            </p>
          </div>

          {/* New Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-slate-600">
                ពាក្យសម្ងាត់ថ្មី
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="យ៉ាងតិច ៦ ខ្ទង់"
                  className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 pl-3.5 pr-10 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-slate-600">
                បញ្ជាក់ពាក្យសម្ងាត់ថ្មី
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="វាយម្តងទៀត"
                  className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 pl-3.5 pr-10 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-[13px] rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>កំពុងរក្សាទុក...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>រក្សាទុកការកែប្រែ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Full-screen Reloading Overlay */}
      {isReloading && (
        <div className="fixed inset-0 z-[250] flex flex-col items-center justify-center bg-slate-900/85 backdrop-blur-md text-white animate-in fade-in duration-300 p-6 text-center">
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-full border-4 border-indigo-400/20 border-t-indigo-400 border-r-indigo-400 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-emerald-400 animate-bounce">
              <CheckCircle2 size={36} />
            </div>
          </div>
          <h3 className="text-[20px] font-black text-white tracking-tight drop-shadow-sm">
            បានធ្វើបច្ចុប្បន្នភាពគណនីដោយជោគជ័យ!
          </h3>
          <p className="text-[13.5px] text-indigo-200 mt-1 max-w-sm font-medium">
            ព័ត៌មានគណនីថ្មីត្រូវបានរក្សាទុកក្នុងប្រព័ន្ធ
          </p>
          <div className="mt-5 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-100 text-[12.5px] font-medium shadow-sm">
            <RefreshCw size={15} className="animate-spin text-amber-300" />
            <span>កំពុងដំណើរការ Refresh ប្រព័ន្ធឡើងវិញ (Reloading)...</span>
          </div>
        </div>
      )}
    </div>
  );
}

