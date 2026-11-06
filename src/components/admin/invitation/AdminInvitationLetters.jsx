import React, { useState, useRef, useEffect } from 'react';
import { Settings, Save, Mail, Printer, CheckCircle2, Search, Filter, Calendar, Users, FileText, RefreshCw, Download, ShieldCheck, Clock, RotateCcw, AlertTriangle, Trash2, X } from 'lucide-react';
import InvitationLetterPrint from './InvitationLetterPrint';
import { exportInvitationPdf } from './exports/exportInvitationPdf';
import { exportInvitationWord } from './exports/exportInvitationWord';
import { api, getCachedSchoolName } from '../../../utils/api';

function normalizeGrade(className) {
  if (!className) return null;
  const str = String(className)
    .replace(/០/g, '0').replace(/១/g, '1').replace(/២/g, '2')
    .replace(/៣/g, '3').replace(/៤/g, '4').replace(/៥/g, '5')
    .replace(/៦/g, '6').replace(/៧/g, '7').replace(/៨/g, '8')
    .replace(/៩/g, '9');
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function getDisciplineThreshold(className) {
  try {
    const saved = localStorage.getItem('disciplineThresholds');
    if (saved) {
      const parsed = JSON.parse(saved);
      const grade = normalizeGrade(className);
      if (grade !== null) {
        if (grade >= 7 && grade <= 9 && parsed['7-9'] !== undefined) {
          return Number(parsed['7-9']) || 20;
        }
        if (grade >= 10 && grade <= 12 && parsed['10-12'] !== undefined) {
          return Number(parsed['10-12']) || 20;
        }
      }
      if (parsed['default'] !== undefined) return Number(parsed['default']) || 20;
      if (parsed['10-12'] !== undefined) return Number(parsed['10-12']) || 20;
      if (parsed['7-9'] !== undefined) return Number(parsed['7-9']) || 20;
    }
  } catch (e) {}
  return 20;
}

export default function AdminInvitationLetters() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection states
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState([]);

  const [showError, setShowError] = useState(false);
  const [printSettingsOpen, setPrintSettingsOpen] = useState(false);
  const [customPrintStudents, setCustomPrintStudents] = useState(null);
  const [printConfig, setPrintConfig] = useState({
    reference: '',
    meetingDate: '',
    meetingTime: '08:00',
    location: getCachedSchoolName(),
    printMode: 'duplicate'
  });
  const printRef = useRef(null);

  // Data
  const [pendingStudents, setPendingStudents] = useState([]);
  const [printedHistory, setPrintedHistory] = useState([]);
  const [historyStatusFilter, setHistoryStatusFilter] = useState('UNRESOLVED');
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false);
  const [printConfirmModalOpen, setPrintConfirmModalOpen] = useState(false);
  const [pendingPrintTargets, setPendingPrintTargets] = useState(null);
  const [thresholds, setThresholds] = useState(() => {
    try {
      const saved = localStorage.getItem('disciplineThresholds');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { '7-9': 20, '10-12': 20 };
  });
  const [tempThresholds, setTempThresholds] = useState({ '7-9': 20, '10-12': 20 });

  const handleOpenThresholdModal = () => {
    setTempThresholds({ ...thresholds });
    setThresholdModalOpen(true);
  };

  const handleSaveThresholds = () => {
    setThresholds(tempThresholds);
    localStorage.setItem('disciplineThresholds', JSON.stringify(tempThresholds));
    setThresholdModalOpen(false);
    fetchInvitationData();
  }; // 'UNRESOLVED' | 'RESOLVED'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  // Interactive Undo Toast State
  const [toastState, setToastState] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showUndoToast = ({ message, onUndo }) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    const id = Date.now();
    setToastState({ id, message, onUndo, isUndoing: false, undone: false });

    toastTimeoutRef.current = setTimeout(() => {
      setToastState(null);
    }, 6000);
  };

  const handleToastUndo = async () => {
    if (!toastState || !toastState.onUndo || toastState.isUndoing) return;
    setToastState(prev => ({ ...prev, isUndoing: true }));
    try {
      await toastState.onUndo();
      setToastState(prev => ({
        ...prev,
        isUndoing: false,
        undone: true,
        message: 'បានត្រឡប់មកវិញ (Undo) ជោគជ័យ!'
      }));
      setTimeout(() => setToastState(null), 2500);
    } catch (e) {
      console.error('Undo failed', e);
      setToastState(null);
    }
  };

  const fetchInvitationData = async () => {
    setIsRefreshing(true);
    try {
      const [invRes, discRes, stuRes] = await Promise.all([
        api('invitation.getAll'),
        api('discipline.getTracking', { force: true }),
        api('students.getAll')
      ]);

      const historyData = invRes && invRes.success && Array.isArray(invRes.data) ? invRes.data : [];
      const normalizedHistory = historyData.map(h => ({
        ...h,
        id: h.id || `inv_${h.studentId || Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        studentId: h.studentId || h.id,
        status: h.status || (h.resolvedDate ? 'RESOLVED' : 'UNRESOLVED'),
        cycle: Number(h.cycle) || 1
      }));
      setPrintedHistory(normalizedHistory);

      const allStudents = stuRes && stuRes.success && Array.isArray(stuRes.data) ? stuRes.data : [];
      const studentMap = new Map();
      allStudents.forEach(s => {
        if (s.id) studentMap.set(String(s.id).toLowerCase(), s);
        if (s.studentId) studentMap.set(String(s.studentId).toLowerCase(), s);
        if (s.name) studentMap.set(String(s.name).trim().toLowerCase(), s);
      });

      if (discRes && discRes.success && Array.isArray(discRes.data)) {
        const activeUnresolvedStudentIds = new Set(
          normalizedHistory
            .filter(h => h.status === 'UNRESOLVED')
            .map(h => String(h.studentId || h.id).toLowerCase())
        );

        const criticalStudents = discRes.data
          .filter(s => {
            const limit = getDisciplineThreshold(s.class || s.className);
            return (Number(s.absent) || 0) >= limit;
          })
          .filter(s => {
            const sid = String(s.id || s.studentId || '').toLowerCase();
            return !activeUnresolvedStudentIds.has(sid);
          })
          .map(s => {
            const sid = String(s.id || s.studentId || '').toLowerCase();
            const sname = String(s.name || '').trim().toLowerCase();
            const info = studentMap.get(sid) || studentMap.get(sname) || {};
            
            let age = s.age || info.age || '';
            if (!age && info.dob) {
              const birthYear = new Date(info.dob).getFullYear();
              if (birthYear && !isNaN(birthYear)) {
                age = new Date().getFullYear() - birthYear;
              }
            }

            return {
              id: s.id || s.studentId,
              studentId: s.id || s.studentId,
              name: s.name,
              gender: (s.gender === 'F' || info.gender === 'F' || s.gender === 'ស្រី' || info.gender === 'ស្រី') ? 'ស្រី' : 'ប្រុស',
              age: age || '',
              class: s.class || s.className || info.class || '',
              parentName: s.parentName || info.parentName || '',
              parentPhone: s.parentPhone || info.parentPhone || '',
              absences: Number(s.absent) || 0,
              cycle: s.cycle || 1,
              dateReached: s.records?.[0]?.date || new Date().toISOString().split('T')[0]
            };
          });

        let fromNav = null;
        try {
          const printStudentStr = localStorage.getItem('printStudent');
          if (printStudentStr) {
            const parsed = JSON.parse(printStudentStr);
            const sid = String(parsed.id || parsed.studentId || '').toLowerCase();
            const sname = String(parsed.name || '').trim().toLowerCase();
            const info = studentMap.get(sid) || studentMap.get(sname) || {};
            
            let age = parsed.age || info.age || '';
            if (!age && info.dob) {
              const birthYear = new Date(info.dob).getFullYear();
              if (birthYear && !isNaN(birthYear)) {
                age = new Date().getFullYear() - birthYear;
              }
            }

            fromNav = {
              id: parsed.id || parsed.studentId,
              studentId: parsed.id || parsed.studentId,
              name: parsed.name,
              gender: (parsed.gender === 'F' || info.gender === 'F' || parsed.gender === 'ស្រី' || info.gender === 'ស្រី') ? 'ស្រី' : 'ប្រុស',
              age: age || '',
              class: parsed.class || info.class || '',
              parentName: parsed.parentName || info.parentName || '',
              parentPhone: parsed.parentPhone || info.parentPhone || '',
              absences: Number(parsed.absent) || 0,
              cycle: parsed.cycle || 1,
              dateReached: new Date().toISOString().split('T')[0]
            };
            setSelectedIds(prev => [...new Set([...prev, fromNav.id])]);
            localStorage.removeItem('printStudent');
          }
        } catch (e) {}

        setPendingStudents(prev => {
          const list = [...criticalStudents];
          if (fromNav && !list.some(s => s.id === fromNav.id)) {
            list.unshift(fromNav);
          }
          prev.forEach(p => {
            if (!list.some(s => s.id === p.id) && !activeUnresolvedStudentIds.has(String(p.id).toLowerCase())) {
              list.push(p);
            }
          });
          return list;
        });
      }
    } catch (e) {
      console.error('Failed to load invitation history', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvitationData();
  }, []);

  // Selection handlers
  const handleSelectAllPending = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredPending.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOnePending = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAllHistory = (e) => {
    if (e.target.checked) {
      setSelectedHistoryIds(filteredHistory.map(s => s.id));
    } else {
      setSelectedHistoryIds([]);
    }
  };

  const handleSelectOneHistory = (id) => {
    if (selectedHistoryIds.includes(id)) {
      setSelectedHistoryIds(selectedHistoryIds.filter(i => i !== id));
    } else {
      setSelectedHistoryIds([...selectedHistoryIds, id]);
    }
  };

  const handlePrintClick = () => {
    if (selectedIds.length === 0) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }
    setCustomPrintStudents(null);
    setPrintSettingsOpen(true);
  };

  const executePrint = () => {
    setPrintSettingsOpen(false);
    const targets = customPrintStudents || pendingStudents.filter(s => selectedIds.includes(s.id));
    if (targets.length === 0) return;

    exportInvitationPdf({
      selectedStudents: targets,
      config: printConfig
    });

    setPendingPrintTargets(targets);
    setPrintConfirmModalOpen(true);
  };

  const executeExportWord = () => {
    setPrintSettingsOpen(false);
    const targets = customPrintStudents || pendingStudents.filter(s => selectedIds.includes(s.id));
    if (targets.length === 0) return;

    exportInvitationWord({
      selectedStudents: targets,
      config: printConfig
    });

    setPendingPrintTargets(targets);
    setPrintConfirmModalOpen(true);
  };

  const handleCancelPrintConfirm = () => {
    setPrintConfirmModalOpen(false);
    setPendingPrintTargets(null);
    setCustomPrintStudents(null);
  };

  const handleCompletePrintConfirm = () => {
    const targets = pendingPrintTargets;
    if (!targets || targets.length === 0) {
      setPrintConfirmModalOpen(false);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newItems = targets.map(s => {
      const letterDocId = `inv_${s.id || s.studentId}_c${s.cycle || 1}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      return {
        ...s,
        letterId: letterDocId,
        id: letterDocId,
        studentId: s.id || s.studentId,
        datePrinted: todayStr,
        printedBy: 'អ្នកគ្រប់គ្រង',
        status: 'UNRESOLVED',
        cycle: Number(s.cycle) || 1,
        meetingDate: printConfig.meetingDate,
        meetingTime: printConfig.meetingTime,
        meetingLocation: printConfig.location,
        reference: printConfig.reference
      };
    });

    api('invitation.savePrinted', { letters: newItems }).catch(err => console.error(err));

    setPrintedHistory(prev => [...newItems, ...prev]);

    const targetIds = new Set(targets.map(t => String(t.id || t.studentId).toLowerCase()));
    setPendingStudents(prev => prev.filter(s => !targetIds.has(String(s.id || s.studentId).toLowerCase())));
    setSelectedIds(prev => prev.filter(id => !targetIds.has(String(id).toLowerCase())));

    setPrintConfirmModalOpen(false);
    setPendingPrintTargets(null);
    setCustomPrintStudents(null);

    // Switch to history tab and UNRESOLVED filter so the newly moved records appear immediately
    setActiveTab('history');
    setHistoryStatusFilter('UNRESOLVED');

    showUndoToast({
      message: `បានកត់ត្រា និងផ្លាស់ទីសិស្សចំនួន ${newItems.length} នាក់ទៅ «ប្រវត្តិបោះពុម្ព» រួចរាល់!`
    });
  };

  // Single Resolve (Instant 1-Click with Undo & Reset absences to 0 across system)
  const handleSingleResolve = async (student) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const studentId = student.studentId || student.id;
      const letterDocId = student.letterId || student.id;
      const previousState = { ...student };
      const resId = `res_${studentId}_${Date.now()}`;

      // Fetch all attendance records for this student to clear them and store in resolution for undo
      let studentRecords = [];
      let recordIds = [];
      try {
        const attRes = await api('attendance.getAll');
        if (attRes && attRes.success && Array.isArray(attRes.data)) {
          studentRecords = attRes.data.filter(r => 
            String(r.studentId || '').trim().toLowerCase() === String(studentId).trim().toLowerCase() ||
            String(r.name || '').trim().toLowerCase() === String(student.name || '').trim().toLowerCase()
          );
          recordIds = studentRecords.map(r => r.id).filter(Boolean);
        }
      } catch (attErr) {
        console.warn('Failed to fetch attendance records for resolution reset:', attErr);
      }

      const resolutionPayload = {
        id: resId,
        studentId: studentId,
        studentName: student.name,
        class: student.class,
        cycle: Number(student.cycle) || 1,
        resolvedDate: todayStr,
        parentName: student.parentName || '',
        handledBy: 'អ្នកគ្រប់គ្រង',
        note: 'អាណាព្យាបាលបានមកសាលា និងដោះស្រាយរួចរាល់',
        absentAtResolution: student.absences || student.absent || 0,
        totalAbsentAtResolution: student.totalAbsent || student.absences || student.absent || 0,
        clearedAttendanceRecords: studentRecords,
        createdAt: new Date().toISOString()
      };

      const updatedLetter = {
        ...student,
        id: letterDocId,
        status: 'RESOLVED',
        resolvedDate: todayStr,
        resolvedBy: 'អ្នកគ្រប់គ្រង'
      };

      await Promise.all([
        api('discipline.saveResolution', { resolution: resolutionPayload }),
        api('invitation.savePrinted', { letter: updatedLetter }),
        recordIds.length > 0 ? api('attendance.deleteMultiple', { recordIds }) : Promise.resolve()
      ]);

      setPrintedHistory(prev => prev.map(item => item.id === letterDocId ? updatedLetter : item));
      fetchInvitationData();

      showUndoToast({
        message: `បាន Reset វិន័យ និងអវត្តមានសិស្ស ${student.name} មក ០ រួចរាល់!`,
        onUndo: async () => {
          await Promise.all([
            api('discipline.deleteResolution', { id: resId }),
            api('invitation.savePrinted', { letter: previousState }),
            studentRecords.length > 0 ? api('attendance.restoreRecords', { records: studentRecords }) : Promise.resolve()
          ]);
          setPrintedHistory(prev => prev.map(item => item.id === letterDocId ? previousState : item));
          fetchInvitationData();
        }
      });
    } catch (err) {
      console.error('Failed to resolve student', err);
    }
  };

  // Batch Resolve (Instant with Undo & Reset absences to 0 across system)
  const handleBatchResolve = async () => {
    if (selectedHistoryIds.length === 0) return;
    setIsProcessingBatch(true);

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const selectedSet = new Set(selectedHistoryIds);
      const targetStudents = printedHistory.filter(h => selectedSet.has(h.id));
      const previousStates = targetStudents.map(s => ({ ...s }));

      let allRecords = [];
      try {
        const attRes = await api('attendance.getAll');
        if (attRes && attRes.success && Array.isArray(attRes.data)) {
          allRecords = attRes.data;
        }
      } catch (attErr) {
        console.warn('Failed to fetch attendance for batch reset:', attErr);
      }

      const allClearedRecords = [];
      const allRecordIdsToDelete = [];

      const resolutions = targetStudents.map(student => {
        const studentId = student.studentId || student.id;
        const studentRecords = allRecords.filter(r => 
          String(r.studentId || '').trim().toLowerCase() === String(studentId).trim().toLowerCase() ||
          String(r.name || '').trim().toLowerCase() === String(student.name || '').trim().toLowerCase()
        );
        studentRecords.forEach(r => {
          allClearedRecords.push(r);
          if (r.id) allRecordIdsToDelete.push(r.id);
        });

        return {
          id: `res_${studentId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          studentId: studentId,
          studentName: student.name,
          class: student.class,
          cycle: Number(student.cycle) || 1,
          resolvedDate: todayStr,
          parentName: student.parentName || '',
          handledBy: 'អ្នកគ្រប់គ្រង',
          note: 'អាណាព្យាបាលបានមកសាលា និងដោះស្រាយរួចរាល់',
          absentAtResolution: student.absences || student.absent || 0,
          totalAbsentAtResolution: student.totalAbsent || student.absences || student.absent || 0,
          clearedAttendanceRecords: studentRecords,
          createdAt: new Date().toISOString()
        };
      });

      const resIds = resolutions.map(r => r.id);

      const updatedLetters = targetStudents.map(student => ({
        ...student,
        id: student.letterId || student.id,
        status: 'RESOLVED',
        resolvedDate: todayStr,
        resolvedBy: 'អ្នកគ្រប់គ្រង'
      }));

      await Promise.all([
        api('discipline.saveResolution', { resolutions }),
        api('invitation.savePrinted', { letters: updatedLetters }),
        allRecordIdsToDelete.length > 0 ? api('attendance.deleteMultiple', { recordIds: allRecordIdsToDelete }) : Promise.resolve()
      ]);

      setPrintedHistory(prev => prev.map(item => {
        if (selectedSet.has(item.id)) {
          return {
            ...item,
            status: 'RESOLVED',
            resolvedDate: todayStr,
            resolvedBy: 'អ្នកគ្រប់គ្រង'
          };
        }
        return item;
      }));

      setSelectedHistoryIds([]);
      fetchInvitationData();

      showUndoToast({
        message: `បាន Reset វិន័យ និងអវត្តមានសិស្សចំនួន ${targetStudents.length} នាក់មក ០ រួចរាល់!`,
        onUndo: async () => {
          await Promise.all([
            Promise.all(resIds.map(id => api('discipline.deleteResolution', { id }))),
            api('invitation.savePrinted', { letters: previousStates }),
            allClearedRecords.length > 0 ? api('attendance.restoreRecords', { records: allClearedRecords }) : Promise.resolve()
          ]);
          const prevMap = new Map(previousStates.map(p => [p.id, p]));
          setPrintedHistory(prev => prev.map(item => prevMap.get(item.id) || item));
          fetchInvitationData();
        }
      });
    } catch (err) {
      console.error('Failed batch resolution', err);
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const handleBatchReInvite = () => {
    const selectedSet = new Set(selectedHistoryIds);
    const targetStudents = printedHistory
      .filter(h => selectedSet.has(h.id) && (h.status || 'UNRESOLVED') === 'UNRESOLVED')
      .map(h => ({
        ...h,
        id: h.studentId || h.id,
        studentId: h.studentId || h.id,
        cycle: (Number(h.cycle) || 1) + 1,
        dateReached: new Date().toISOString().split('T')[0]
      }));

    if (targetStudents.length === 0) return;

    setCustomPrintStudents(targetStudents);
    setPrintSettingsOpen(true);
  };

  const handleReInvite = (historyItem) => {
    const nextCycle = (Number(historyItem.cycle) || 1) + 1;
    const reInviteStudent = {
      ...historyItem,
      id: historyItem.studentId || historyItem.id,
      studentId: historyItem.studentId || historyItem.id,
      cycle: nextCycle,
      dateReached: new Date().toISOString().split('T')[0]
    };
    setCustomPrintStudents([reInviteStudent]);
    setPrintSettingsOpen(true);
  };

  const handleRevertToUnresolved = async (historyItem) => {
    try {
      const studentId = historyItem.studentId || historyItem.id;
      const letterDocId = historyItem.letterId || historyItem.id;
      const previousState = { ...historyItem };

      const resList = await api('discipline.getResolutions');
      let deletedRes = null;
      if (resList && resList.success && Array.isArray(resList.data)) {
        const matchRes = resList.data.find(r => 
          String(r.studentId || '').toLowerCase() === String(studentId).toLowerCase() ||
          String(r.studentName || '').toLowerCase() === String(historyItem.name || '').toLowerCase()
        );
        if (matchRes?.id) {
          deletedRes = matchRes;
          await api('discipline.deleteResolution', { id: matchRes.id });
          if (Array.isArray(matchRes.clearedAttendanceRecords) && matchRes.clearedAttendanceRecords.length > 0) {
            await api('attendance.restoreRecords', { records: matchRes.clearedAttendanceRecords });
          }
        }
      }

      const revertedLetter = {
        ...historyItem,
        id: letterDocId,
        status: 'UNRESOLVED',
        resolvedDate: null,
        resolutionNote: null
      };
      await api('invitation.savePrinted', { letter: revertedLetter });

      setPrintedHistory(prev => prev.map(item => {
        if (item.id === letterDocId) {
          return revertedLetter;
        }
        return item;
      }));

      fetchInvitationData();

      showUndoToast({
        message: `បានប្តូរស្ថានភាព ${historyItem.name} មក «មិនទាន់ដោះស្រាយ» វិញ!`,
        onUndo: async () => {
          if (deletedRes) {
            await api('discipline.saveResolution', { resolution: deletedRes });
            if (Array.isArray(deletedRes.clearedAttendanceRecords) && deletedRes.clearedAttendanceRecords.length > 0) {
              await api('attendance.deleteMultiple', { recordIds: deletedRes.clearedAttendanceRecords.map(r => r.id).filter(Boolean) });
            }
          }
          await api('invitation.savePrinted', { letter: previousState });
          setPrintedHistory(prev => prev.map(item => item.id === letterDocId ? previousState : item));
          fetchInvitationData();
        }
      });
    } catch (err) {
      console.error('Failed to revert status', err);
    }
  };

  // Single Delete History Item
  const handleDeleteHistoryItem = async (historyItem) => {
    const confirm = window.confirm(`តើអ្នកពិតជាចង់លុបប្រវត្តិកោះហៅរបស់សិស្ស «${historyItem.name}» មែនទេ?`);
    if (!confirm) return;

    try {
      const letterId = historyItem.id;
      await api('invitation.delete', { id: letterId });
      setPrintedHistory(prev => prev.filter(item => item.id !== letterId));
      setSelectedHistoryIds(prev => prev.filter(id => id !== letterId));

      showUndoToast({
        message: `បានលុបប្រវត្តិកោះហៅរបស់ ${historyItem.name} រួចរាល់!`,
        onUndo: async () => {
          await api('invitation.savePrinted', { letter: historyItem });
          setPrintedHistory(prev => [historyItem, ...prev]);
        }
      });
    } catch (err) {
      console.error('Failed to delete history item', err);
    }
  };

  // Batch Delete History Items
  const handleBatchDeleteHistory = async () => {
    if (selectedHistoryIds.length === 0) return;
    const confirm = window.confirm(`តើអ្នកពិតជាចង់លុបប្រវត្តិកោះហៅចំនួន ${selectedHistoryIds.length} ករណីដែលបានជ្រើសរើសមែនទេ?`);
    if (!confirm) return;

    setIsProcessingBatch(true);
    try {
      const selectedSet = new Set(selectedHistoryIds);
      const itemsToDelete = printedHistory.filter(h => selectedSet.has(h.id));
      const idsToDelete = itemsToDelete.map(h => h.id);

      await api('invitation.deleteMultiple', { ids: idsToDelete });
      setPrintedHistory(prev => prev.filter(item => !selectedSet.has(item.id)));
      setSelectedHistoryIds([]);

      showUndoToast({
        message: `បានលុបប្រវត្តិកោះហៅចំនួន ${idsToDelete.length} ករណីរួចរាល់!`,
        onUndo: async () => {
          await api('invitation.savePrinted', { letters: itemsToDelete });
          setPrintedHistory(prev => [...itemsToDelete, ...prev]);
        }
      });
    } catch (err) {
      console.error('Failed batch delete history', err);
    } finally {
      setIsProcessingBatch(false);
    }
  };

  // Batch Revert to Unresolved
  const handleBatchRevertToUnresolved = async () => {
    if (selectedHistoryIds.length === 0) return;
    setIsProcessingBatch(true);

    try {
      const selectedSet = new Set(selectedHistoryIds);
      const targetStudents = printedHistory.filter(h => selectedSet.has(h.id));
      const previousStates = targetStudents.map(s => ({ ...s }));

      const resList = await api('discipline.getResolutions');
      const allResolutions = (resList && resList.success && Array.isArray(resList.data)) ? resList.data : [];

      const allClearedRecords = [];
      const resIdsToDelete = [];

      targetStudents.forEach(student => {
        const studentId = student.studentId || student.id;
        const matchRes = allResolutions.find(r => 
          String(r.studentId || '').toLowerCase() === String(studentId).toLowerCase() ||
          String(r.studentName || '').toLowerCase() === String(student.name || '').toLowerCase()
        );
        if (matchRes?.id) {
          resIdsToDelete.push(matchRes.id);
          if (Array.isArray(matchRes.clearedAttendanceRecords)) {
            matchRes.clearedAttendanceRecords.forEach(r => allClearedRecords.push(r));
          }
        }
      });

      const updatedLetters = targetStudents.map(student => ({
        ...student,
        id: student.letterId || student.id,
        status: 'UNRESOLVED',
        resolvedDate: null,
        resolutionNote: null
      }));

      await Promise.all([
        Promise.all(resIdsToDelete.map(id => api('discipline.deleteResolution', { id }))),
        api('invitation.savePrinted', { letters: updatedLetters }),
        allClearedRecords.length > 0 ? api('attendance.restoreRecords', { records: allClearedRecords }) : Promise.resolve()
      ]);

      setPrintedHistory(prev => prev.map(item => {
        if (selectedSet.has(item.id)) {
          return {
            ...item,
            status: 'UNRESOLVED',
            resolvedDate: null,
            resolutionNote: null
          };
        }
        return item;
      }));

      setSelectedHistoryIds([]);
      fetchInvitationData();

      showUndoToast({
        message: `បានប្តូរស្ថានភាពសិស្សចំនួន ${targetStudents.length} នាក់មក «មិនទាន់ដោះស្រាយ» វិញ!`,
        onUndo: async () => {
          await api('invitation.savePrinted', { letters: previousStates });
          const prevMap = new Map(previousStates.map(p => [p.id, p]));
          setPrintedHistory(prev => prev.map(item => prevMap.get(item.id) || item));
          fetchInvitationData();
        }
      });
    } catch (err) {
      console.error('Failed batch revert', err);
    } finally {
      setIsProcessingBatch(false);
    }
  };

  // Filtered lists
  const filteredPending = pendingStudents.filter(student => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = String(student.name || '').toLowerCase().includes(term);
      const matchId = String(student.id || student.studentId || '').toLowerCase().includes(term);
      const matchClass = String(student.class || '').toLowerCase().includes(term);
      return matchName || matchId || matchClass;
    }
    return true;
  });

  const filteredHistory = printedHistory.filter(student => {
    const studentStatus = student.status || (student.resolvedDate ? 'RESOLVED' : 'UNRESOLVED');
    if (historyStatusFilter === 'UNRESOLVED' && studentStatus !== 'UNRESOLVED') return false;
    if (historyStatusFilter === 'RESOLVED' && studentStatus !== 'RESOLVED') return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = String(student.name || '').toLowerCase().includes(term);
      const matchId = String(student.studentId || student.id || '').toLowerCase().includes(term);
      const matchClass = String(student.class || '').toLowerCase().includes(term);
      return matchName || matchId || matchClass;
    }
    return true;
  });

  const studentsToPrint = customPrintStudents || pendingStudents.filter(s => selectedIds.includes(s.id));

  // Counts
  const unresolvedHistoryCount = printedHistory.filter(h => (h.status || (h.resolvedDate ? 'RESOLVED' : 'UNRESOLVED')) === 'UNRESOLVED').length;
  const resolvedHistoryCount = printedHistory.filter(h => (h.status || (h.resolvedDate ? 'RESOLVED' : 'UNRESOLVED')) === 'RESOLVED').length;
  const totalPending = pendingStudents.length;

  const selectedUnresolvedCount = printedHistory.filter(h => 
    selectedHistoryIds.includes(h.id) && (h.status || 'UNRESOLVED') === 'UNRESOLVED'
  ).length;

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto w-full pb-20">

      {/* 1. PAGE HEADER (Clean, balanced, standard dashboard scale) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            លិខិតកោះហៅអាណាព្យាបាល
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 font-medium mt-0.5">
            គ្រប់គ្រងការចេញលិខិត និងតាមដានការដោះស្រាយវិន័យសិស្ស
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenThresholdModal}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[13px] font-bold transition-all shadow-xs hover:shadow cursor-pointer"
            title="កំណត់កម្រិតវិន័យអវត្តមានដែលត្រូវកោះហៅ"
          >
            <Settings size={15} className="text-slate-500" />
            <span>កំណត់វិន័យ ({thresholds['10-12'] || 20} ថ្ងៃ)</span>
          </button>
          <button
            type="button"
            onClick={fetchInvitationData}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[13px] font-bold transition-all shadow-xs hover:shadow cursor-pointer disabled:opacity-60"
            title="ទាញយកទិន្នន័យថ្មីពី Cloud"
          >
            <RefreshCw size={15} className={`text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'កំពុងទាញ...' : 'ទាញថ្មី'}</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN CARD CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        
        {/* TOOLBAR */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-3.5 justify-between items-stretch lg:items-center bg-white">
          
          {/* Main Tabs (Standard, balanced font) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start">
            <button
              onClick={() => {
                setActiveTab('pending');
                setSelectedHistoryIds([]);
              }}
              className={`flex items-center gap-2 px-4.5 py-2 rounded-lg text-[13.5px] font-bold transition-all cursor-pointer ${
                activeTab === 'pending' 
                  ? 'bg-white text-rose-600 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Printer size={16} />
              <span>ត្រូវបោះពុម្ព</span>
              <span className={`text-[11.5px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'pending' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'
              }`}>
                {totalPending}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('history');
                setSelectedIds([]);
                setHistoryStatusFilter('UNRESOLVED');
                setSelectedHistoryIds([]);
              }}
              className={`flex items-center gap-2 px-4.5 py-2 rounded-lg text-[13.5px] font-bold transition-all cursor-pointer ${
                activeTab === 'history' 
                  ? 'bg-white text-emerald-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={16} />
              <span>ប្រវត្តិបោះពុម្ព</span>
              <span className={`text-[11.5px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'history' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {unresolvedHistoryCount}
              </span>
            </button>
          </div>

          {/* Right Tools (Sub-filters & Search) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sub-filters in History Tab */}
            {activeTab === 'history' && (
              <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setHistoryStatusFilter('UNRESOLVED');
                    setSelectedHistoryIds([]);
                  }}
                  className={`px-3 py-1.5 rounded-md text-[12.5px] font-bold transition-all cursor-pointer ${
                    historyStatusFilter === 'UNRESOLVED'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  កំពុងដោះស្រាយ ({unresolvedHistoryCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHistoryStatusFilter('RESOLVED');
                    setSelectedHistoryIds([]);
                  }}
                  className={`px-3 py-1.5 rounded-md text-[12.5px] font-bold transition-all cursor-pointer ${
                    historyStatusFilter === 'RESOLVED'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ដោះស្រាយរួច ({resolvedHistoryCount})
                </button>
              </div>
            )}

            {/* Search Input (Standard comfortable size) */}
            <div className="relative w-full sm:w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text" 
                placeholder="ស្វែងរកឈ្មោះសិស្ស..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Print Action for Pending Tab */}
            {activeTab === 'pending' && (
              <button 
                onClick={handlePrintClick}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[13px] transition-all shadow-xs cursor-pointer ${
                  selectedIds.length > 0 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white hover:shadow' 
                    : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <Printer size={15} />
                <span>បោះពុម្ព {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. TABLE AREA (Standard Balanced Font Sizes) */}
        <div className="w-full overflow-x-auto relative min-h-[360px]">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                {/* Checkbox Column */}
                <th className="py-3.5 px-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={
                      activeTab === 'pending'
                        ? filteredPending.length > 0 && selectedIds.length === filteredPending.length
                        : filteredHistory.length > 0 && selectedHistoryIds.length === filteredHistory.length
                    }
                    onChange={activeTab === 'pending' ? handleSelectAllPending : handleSelectAllHistory}
                    title="ជ្រើសរើសទាំងអស់"
                  />
                </th>
                <th className="py-3.5 px-4 text-[12.5px] font-bold text-slate-600">អត្តលេខ</th>
                <th className="py-3.5 px-4 text-[12.5px] font-bold text-slate-600 min-w-[190px]">ឈ្មោះសិស្ស</th>
                <th className="py-3.5 px-4 text-[12.5px] font-bold text-slate-600 text-center">ភេទ</th>
                <th className="py-3.5 px-4 text-[12.5px] font-bold text-slate-600 text-center">ថ្នាក់</th>
                <th className="py-3.5 px-4 text-[12.5px] font-bold text-slate-600 text-center">អវត្តមាន</th>
                <th className="py-3.5 px-4 text-[12.5px] font-bold text-slate-600 text-center">លើកទី</th>
                <th className="py-3.5 px-4 text-[12.5px] font-bold text-slate-600">
                  {activeTab === 'pending' ? 'ថ្ងៃឈានដល់កម្រិត' : 'កាលបរិច្ឆេទបោះពុម្ព'}
                </th>
                {activeTab === 'history' && (
                  <th className="py-3.5 px-4 text-[12.5px] font-bold text-slate-600 text-center">ស្ថានភាព</th>
                )}
                {activeTab === 'history' && (
                  <th className="py-3.5 px-4 text-[12.5px] font-bold text-slate-600 text-center min-w-[170px]">សកម្មភាព</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-[13px]">
              
              {/* PENDING ROWS */}
              {activeTab === 'pending' && filteredPending.map(student => {
                const isChecked = selectedIds.includes(student.id);
                return (
                  <tr 
                    key={student.id} 
                    className={`hover:bg-slate-50/80 transition-colors ${isChecked ? 'bg-blue-50/30' : ''}`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={isChecked}
                        onChange={() => handleSelectOnePending(student.id)}
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[12px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        #{student.id}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-800 text-[13.5px]">{student.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600 font-medium">
                      {student.gender || 'ប្រុស'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[12px]">
                        {student.class}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-rose-600 text-[13.5px]">
                        {student.absences} ថ្ងៃ
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-[12px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        លើកទី {student.cycle || 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium text-[12.5px]">
                      {student.dateReached}
                    </td>
                  </tr>
                );
              })}

              {/* HISTORY ROWS */}
              {activeTab === 'history' && filteredHistory.map(student => {
                const isResolved = (student.status || (student.resolvedDate ? 'RESOLVED' : 'UNRESOLVED')) === 'RESOLVED';
                const cycleNum = Number(student.cycle) || 1;
                const nextCycle = cycleNum + 1;
                const isChecked = selectedHistoryIds.includes(student.id);

                return (
                  <tr 
                    key={student.id} 
                    className={`hover:bg-slate-50/80 transition-colors ${isChecked ? 'bg-emerald-50/30' : ''}`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        checked={isChecked}
                        onChange={() => handleSelectOneHistory(student.id)}
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[12px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        #{student.studentId || student.id}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-800 text-[13.5px]">{student.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600 font-medium">
                      {student.gender || 'ប្រុស'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[12px]">
                        {student.class}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-rose-600 text-[13.5px]">
                        {student.absences || student.absent || 0} ថ្ងៃ
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${
                        cycleNum > 1 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        លើកទី {cycleNum}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium text-[12.5px]">
                      {student.datePrinted}
                    </td>

                    {/* Clean Status Pill */}
                    <td className="py-3.5 px-4 text-center">
                      {isResolved ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                          <span>ដោះស្រាយរួច</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                          <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                          <span>កំពុងដោះស្រាយ</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      {!isResolved ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSingleResolve(student)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[12px] rounded-lg transition-all shadow-xs hover:shadow cursor-pointer"
                            title="ដោះស្រាយរួច និង Reset វិន័យមក 0 (មាន Undo)"
                          >
                            ដោះស្រាយ
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReInvite(student)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-bold text-[12px] rounded-lg transition-all border border-slate-200 cursor-pointer"
                            title={`កោះហៅលើកទី ${nextCycle}`}
                          >
                            លើកទី {nextCycle}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRevertToUnresolved(student)}
                            className="text-slate-500 hover:text-indigo-600 font-bold text-[12px] transition-colors cursor-pointer py-1 px-2.5 rounded-md hover:bg-indigo-50"
                            title="ប្តូរត្រឡប់មក មិនទាន់ដោះស្រាយ វិញ"
                          >
                            ប្តូរមកវិញ
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHistoryItem(student)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="លុបប្រវត្តិកោះហៅនេះ"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Empty States (Balanced Scale) */}
          {activeTab === 'pending' && filteredPending.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3 shadow-xs">
                <CheckCircle2 size={30} className="text-emerald-500" />
              </div>
              <h3 className="text-base font-bold text-slate-800">អស្ចារ្យណាស់!</h3>
              <p className="text-[13px] text-slate-500 font-medium mt-1">
                មិនមានសិស្សដល់កម្រិតត្រូវកោះហៅអាណាព្យាបាលនោះទេ។
              </p>
            </div>
          )}
          
          {activeTab === 'history' && filteredHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3 shadow-xs">
                <FileText size={30} className="text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {historyStatusFilter === 'UNRESOLVED' ? 'មិនមានសិស្សកំពុងដោះស្រាយទេ' : 'មិនទាន់មានសិស្សដោះស្រាយរួចទេ'}
              </h3>
              <p className="text-[13px] text-slate-500 font-medium mt-1">
                {historyStatusFilter === 'UNRESOLVED' 
                  ? 'រាល់ករណីកោះហៅដែលបានបោះពុម្ពត្រូវបានដោះស្រាយរួចរាល់' 
                  : 'ករណីដែលបានដោះស្រាយរួច នឹងបង្ហាញនៅទីនេះ'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. SLEEK FLOATING BATCH ACTION BAR (Bottom Center) */}
      {selectedHistoryIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="bg-slate-900 text-white px-4.5 py-2.5 rounded-xl shadow-2xl flex items-center gap-3.5 border border-slate-800">
            <span className="text-[13px] font-medium text-slate-300">
              បានរើស <span className="text-white font-bold">{selectedHistoryIds.length}</span> នាក់
            </span>
            <div className="w-[1px] h-4 bg-slate-700"></div>
            
            {/* IN 'UNRESOLVED' (កំពុងដោះស្រាយ): Show Reset and Re-invite (NO Delete button) */}
            {historyStatusFilter === 'UNRESOLVED' ? (
              <>
                <button
                  type="button"
                  onClick={handleBatchResolve}
                  disabled={isProcessingBatch}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[12.5px] font-bold transition-all shadow-xs cursor-pointer"
                >
                  <ShieldCheck size={15} />
                  <span>{isProcessingBatch ? 'កំពុង Reset...' : 'ដោះស្រាយរួច (Reset 0)'}</span>
                </button>

                {selectedUnresolvedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleBatchReInvite}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[12.5px] font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>កោះហៅបន្ត ({selectedUnresolvedCount})</span>
                  </button>
                )}
              </>
            ) : (
              /* IN 'RESOLVED' (ដោះស្រាយរួច): Show Delete & Revert (NO Reset button) */
              <>
                <button
                  type="button"
                  onClick={handleBatchDeleteHistory}
                  disabled={isProcessingBatch}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[12.5px] font-bold transition-all shadow-xs cursor-pointer"
                  title="លុបករណីដែលបានជ្រើសរើស"
                >
                  <Trash2 size={14} />
                  <span>លុប ({selectedHistoryIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={handleBatchRevertToUnresolved}
                  disabled={isProcessingBatch}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[12.5px] font-bold transition-all shadow-xs cursor-pointer border border-slate-700"
                  title="ប្តូរមក មិនទាន់ដោះស្រាយ វិញ"
                >
                  <RotateCcw size={14} />
                  <span>ប្តូរមកវិញ ({selectedHistoryIds.length})</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setSelectedHistoryIds([])}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer ml-0.5"
              title="បោះបង់ការជ្រើសរើស"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* 5. GMAIL-STYLE INTERACTIVE UNDO TOAST */}
      {toastState && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700 shadow-xl rounded-xl px-5 py-3 flex items-center gap-3.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} strokeWidth={2.5} />
            </div>

            <div className="text-[13px] font-bold text-slate-100 whitespace-nowrap">
              {toastState.message}
            </div>

            {!toastState.undone && toastState.onUndo && (
              <button
                type="button"
                onClick={handleToastUndo}
                disabled={toastState.isUndoing}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 rounded-lg text-[12px] font-bold transition-all cursor-pointer"
              >
                <RotateCcw size={12} className={toastState.isUndoing ? 'animate-spin' : ''} />
                <span>{toastState.isUndoing ? 'កំពុង Undo...' : 'មិនធ្វើវិញ (Undo)'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setToastState(null)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Print Settings Modal */}
      {printSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Printer size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-slate-800">
                    {customPrintStudents ? `រៀបចំបោះពុម្ព (${customPrintStudents.length > 1 ? `${customPrintStudents.length} នាក់` : `លើកទី ${customPrintStudents[0]?.cycle || 2}`})` : 'រៀបចំមុនបោះពុម្ព'}
                  </h3>
                  <p className="text-[12px] font-bold text-slate-500">
                    {customPrintStudents ? (customPrintStudents.length === 1 ? `សិស្ស៖ ${customPrintStudents[0]?.name}` : `សិស្សដែលបានជ្រើសរើស ${customPrintStudents.length} នាក់`) : 'កំណត់កាលបរិច្ឆេទសម្រាប់លិខិត'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setPrintSettingsOpen(false);
                  setCustomPrintStudents(null);
                }} 
                className="text-slate-400 hover:text-rose-500 transition-colors bg-white hover:bg-rose-50 p-1.5 rounded-full border border-slate-100"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-slate-700">លេខយោងលិខិត (ជាជម្រើស)</label>
                <input 
                  type="text" 
                  placeholder="ឧ. ៣១/២៥" 
                  value={printConfig.reference}
                  onChange={e => setPrintConfig({...printConfig, reference: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-blue-400 focus:ring-3 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                />
                <p className="text-[11.5px] text-slate-500 font-medium">ប្រសិនបើមិនបំពេញ ប្រព័ន្ធនឹងទុកចន្លោះទទេសម្រាប់សរសេរដៃ។</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700">កាលបរិច្ឆេទជួប <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    value={printConfig.meetingDate}
                    onChange={e => setPrintConfig({...printConfig, meetingDate: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-blue-400 focus:ring-3 focus:ring-blue-100 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700">ម៉ោងជួប <span className="text-red-500">*</span></label>
                  <input 
                    type="time" 
                    value={printConfig.meetingTime}
                    onChange={e => setPrintConfig({...printConfig, meetingTime: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-blue-400 focus:ring-3 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-slate-700">ទីកន្លែងជួប <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={printConfig.location}
                  onChange={e => setPrintConfig({...printConfig, location: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-blue-400 focus:ring-3 focus:ring-blue-100 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-slate-700">ទម្រង់បោះពុម្ពលើក្រដាស A4</label>
                <div className="grid grid-cols-1 gap-2">
                  <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${printConfig.printMode === 'duplicate' ? 'bg-blue-50/70 border-blue-300 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <input 
                      type="radio" 
                      name="printMode" 
                      value="duplicate" 
                      checked={printConfig.printMode === 'duplicate'} 
                      onChange={() => setPrintConfig({...printConfig, printMode: 'duplicate'})} 
                      className="mt-1 w-3.5 h-3.5 text-blue-600 focus:ring-blue-500" 
                    />
                    <div>
                      <div className="text-[13px] font-bold">២ ច្បាប់/សិស្សម្នាក់ (គំរូសាលា)</div>
                      <div className="text-[11.5px] text-slate-500">១ ច្បាប់ជូនអាណាព្យាបាល, ១ ច្បាប់តម្កល់ទុកនៅសាលា</div>
                    </div>
                  </label>
                  <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${printConfig.printMode === 'pair' ? 'bg-blue-50/70 border-blue-300 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <input 
                      type="radio" 
                      name="printMode" 
                      value="pair" 
                      checked={printConfig.printMode === 'pair'} 
                      onChange={() => setPrintConfig({...printConfig, printMode: 'pair'})} 
                      className="mt-1 w-3.5 h-3.5 text-blue-600 focus:ring-blue-500" 
                    />
                    <div>
                      <div className="text-[13px] font-bold">សិស្ស ២ នាក់/ទំព័រ A4 (សន្សំក្រដាស)</div>
                      <div className="text-[11.5px] text-slate-500">បោះពុម្ពសិស្ស ២ នាក់ផ្សេងគ្នាក្នុងមួយសន្លឹក A4</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-2.5">
              <button 
                onClick={() => {
                  setPrintSettingsOpen(false);
                  setCustomPrintStudents(null);
                }} 
                className="py-2 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-bold text-[13px] transition-all"
              >
                បោះបង់
              </button>
              <button
                onClick={executeExportWord}
                className="flex items-center justify-center gap-2 py-2 px-3.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-[13px] transition-all cursor-pointer"
                title="ទាញយកជាឯកសារ Microsoft Word (.doc)"
              >
                <FileText size={15} className="text-blue-600" />
                Word (.doc)
              </button>
              <button 
                onClick={executePrint}
                disabled={!printConfig.meetingDate || !printConfig.meetingTime || !printConfig.location}
                className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed text-white py-2 px-4.5 rounded-xl font-bold text-[13px] transition-all shadow-xs"
              >
                <Printer size={15} strokeWidth={2.5} />
                បោះពុម្ព (PDF)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Threshold Settings Modal */}
      {thresholdModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Settings size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-slate-800">កំណត់កម្រិតវិន័យកោះហៅ</h3>
                  <p className="text-[12px] font-bold text-slate-500">កំណត់ចំនួនអវត្តមានអតិបរិមា</p>
                </div>
              </div>
              <button 
                onClick={() => setThresholdModalOpen(false)}
                className="text-slate-400 hover:text-rose-500 transition-colors bg-white hover:bg-rose-50 p-1.5 rounded-full border border-slate-100"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                  កម្រិតអនុវិទ្យាល័យ (ថ្នាក់ទី ៧ ដល់ ទី ៩)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={tempThresholds['7-9']}
                    onChange={e => setTempThresholds({ ...tempThresholds, '7-9': Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3.5 font-bold text-slate-800 text-[13.5px] focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-3 focus:ring-indigo-100 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-400">ថ្ងៃ</span>
                </div>
                <span className="text-[11.5px] text-slate-400 mt-1 block">អវត្តមានដល់ចំនួននេះ នឹងលោតចូលបញ្ជីត្រូវកោះហៅ</span>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                  កម្រិតវិទ្យាល័យ (ថ្នាក់ទី ១០ ដល់ ទី ១២)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={tempThresholds['10-12']}
                    onChange={e => setTempThresholds({ ...tempThresholds, '10-12': Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3.5 font-bold text-slate-800 text-[13.5px] focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-3 focus:ring-indigo-100 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-400">ថ្ងៃ</span>
                </div>
                <span className="text-[11.5px] text-slate-400 mt-1 block">កម្រិតវិន័យកោះហៅអាណាព្យាបាល (គិតជាថ្ងៃ)</span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setThresholdModalOpen(false)}
                className="py-2 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-[13px] transition-all"
              >
                បោះបង់
              </button>
              <button
                onClick={handleSaveThresholds}
                className="py-2 px-4.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[13px] shadow-xs hover:shadow transition-all flex items-center gap-1.5"
              >
                <Save size={15} />
                <span>រក្សាទុក</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Confirmation Modal (សួរថាបានបោះពុម្ពរួចហើយឬនៅ) */}
      {printConfirmModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/50 shadow-xs">
                  <Printer size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-[15.5px] font-black text-slate-800">
                    បញ្ជាក់ការបោះពុម្ពលិខិត
                  </h3>
                  <p className="text-[12px] font-bold text-slate-500">
                    សិស្សចំនួន {pendingPrintTargets?.length || 0} នាក់
                  </p>
                </div>
              </div>
              <button 
                onClick={handleCancelPrintConfirm}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
                title="បិទ"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col gap-3.5">
              <div className="text-[14px] font-bold text-slate-800 leading-relaxed">
                តើអ្នកបានបោះពុម្ពលិខិតកោះហៅរួចរាល់ហើយឬនៅ?
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 flex flex-col gap-2 text-[12.5px] text-slate-600">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                  <span>
                    បើ <strong>«បានបោះពុម្ពរួចរាល់»</strong>៖ សិស្សនឹងត្រូវផ្លាស់ទីទៅក្នុង <strong>«ប្រវត្តិបោះពុម្ព»</strong> ភ្លាមៗ។
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                  <span>
                    បើ <strong>«មិនទាន់បោះពុម្ពទេ»</strong>៖ សិស្សនឹងនៅបន្តស្ថិតក្នុង <strong>«ត្រូវបោះពុម្ព»</strong> ដដែល។
                  </span>
                </div>
              </div>

              {pendingPrintTargets && pendingPrintTargets.length > 0 && (
                <div className="max-h-32 overflow-y-auto custom-scrollbar border border-slate-100 rounded-xl p-2.5 bg-slate-50/50">
                  <div className="text-[11.5px] font-bold text-slate-400 mb-1.5">បញ្ជីសិស្សដែលបានជ្រើសរើស៖</div>
                  <div className="flex flex-wrap gap-1.5">
                    {pendingPrintTargets.map((s, idx) => (
                      <span key={s.id || idx} className="inline-flex items-center gap-1 text-[12px] font-bold bg-white border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-md shadow-2xs">
                        {s.name} <span className="text-slate-400 text-[10.5px]">({s.class})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
              <button 
                type="button"
                onClick={handleCancelPrintConfirm} 
                className="py-2.5 px-4.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl font-bold text-[13px] transition-all cursor-pointer shadow-xs"
              >
                មិនទាន់បោះពុម្ពទេ
              </button>
              <button 
                type="button"
                onClick={handleCompletePrintConfirm}
                className="flex items-center gap-1.5 py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[13px] transition-all shadow-xs hover:shadow cursor-pointer"
              >
                <CheckCircle2 size={15} strokeWidth={2.5} />
                <span>បានបោះពុម្ពរួចរាល់</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Component */}
      <InvitationLetterPrint ref={printRef} selectedStudents={studentsToPrint} config={printConfig} />
    </div>
  );
}
