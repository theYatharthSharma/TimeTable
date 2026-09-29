import {
  Standard,
  Section,
  Subject,
  Teacher,
  PeriodSlot,
  DayOfWeek,
  User,
  TeacherAvailability,
  TimetableEntry,
  SchoolSettings
} from '../types';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export const PERIOD_SLOTS: PeriodSlot[] = [
  { periodNumber: 1, label: 'Period 1', startTime: '08:30 AM', endTime: '09:15 AM' },
  { periodNumber: 2, label: 'Period 2', startTime: '09:15 AM', endTime: '10:00 AM' },
  { periodNumber: 3, label: 'Period 3', startTime: '10:15 AM', endTime: '11:00 AM' },
  { periodNumber: 4, label: 'Period 4', startTime: '11:00 AM', endTime: '11:45 AM' },
  { periodNumber: 5, label: 'Period 5', startTime: '12:30 PM', endTime: '01:15 PM' },
  { periodNumber: 6, label: 'Period 6', startTime: '01:15 PM', endTime: '02:00 PM' },
];

export const INITIAL_STANDARDS: Standard[] = [
  { id: 6, name: 'Standard 6', level: 6 },
  { id: 7, name: 'Standard 7', level: 7 },
  { id: 8, name: 'Standard 8', level: 8 },
  { id: 9, name: 'Standard 9', level: 9 },
  { id: 10, name: 'Standard 10', level: 10 },
];

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub_math',
    name: 'Mathematics',
    code: 'MATH',
    standardIds: [6, 7, 8, 9, 10],
    weeklyPeriods: 5,
    colorBg: 'bg-blue-50/90',
    colorText: 'text-blue-700',
    colorBorder: 'border-blue-200/80',
  },
  {
    id: 'sub_sci',
    name: 'Science',
    code: 'SCI',
    standardIds: [6, 7, 8, 9, 10],
    weeklyPeriods: 5,
    colorBg: 'bg-emerald-50/90',
    colorText: 'text-emerald-700',
    colorBorder: 'border-emerald-200/80',
  },
  {
    id: 'sub_eng',
    name: 'English',
    code: 'ENG',
    standardIds: [6, 7, 8, 9, 10],
    weeklyPeriods: 5,
    colorBg: 'bg-indigo-50/90',
    colorText: 'text-indigo-700',
    colorBorder: 'border-indigo-200/80',
  },
  {
    id: 'sub_soc',
    name: 'Social Science',
    code: 'SOC',
    standardIds: [6, 7, 8, 9, 10],
    weeklyPeriods: 5,
    colorBg: 'bg-amber-50/90',
    colorText: 'text-amber-800',
    colorBorder: 'border-amber-200/80',
  },
  {
    id: 'sub_comp',
    name: 'Computer',
    code: 'COMP',
    standardIds: [6, 7, 8, 9, 10],
    weeklyPeriods: 4,
    colorBg: 'bg-teal-50/90',
    colorText: 'text-teal-700',
    colorBorder: 'border-teal-200/80',
  },
];

export const INITIAL_SECTIONS: Section[] = [
  // Standard 6
  { id: '6A', standardId: 6, name: 'A', assignedSubjectIds: ['sub_math', 'sub_sci', 'sub_eng', 'sub_soc', 'sub_comp'], assignedTeacherIds: ['t_1', 't_2', 't_3', 't_4', 't_5'] },
  { id: '6B', standardId: 6, name: 'B', assignedSubjectIds: ['sub_math', 'sub_sci', 'sub_eng', 'sub_soc', 'sub_comp'], assignedTeacherIds: ['t_1', 't_2', 't_3', 't_4', 't_5'] },
  { id: '6C', standardId: 6, name: 'C', assignedSubjectIds: ['sub_math', 'sub_sci', 'sub_eng', 'sub_soc', 'sub_comp'], assignedTeacherIds: ['t_1', 't_2', 't_3', 't_4', 't_5'] },
  // Standard 7
  { id: '7A', standardId: 7, name: 'A', assignedSubjectIds: ['sub_math', 'sub_sci', 'sub_eng', 'sub_soc', 'sub_comp'], assignedTeacherIds: ['t_6', 't_7', 't_8', 't_9', 't_10'] },
  { id: '7B', standardId: 7, name: 'B', assignedSubjectIds: ['sub_math', 'sub_sci', 'sub_eng', 'sub_soc', 'sub_comp'], assignedTeacherIds: ['t_6', 't_7', 't_8', 't_9', 't_10'] },
  { id: '7C', standardId: 7, name: 'C', assignedSubjectIds: ['sub_math', 'sub_sci', 'sub_eng', 'sub_soc', 'sub_comp'], assignedTeacherIds: ['t_6', 't_7', 't_8', 't_9', 't_10'] },
  // Standard 8
  { id: '8A', standardId: 8, name: 'A', assignedSubjectIds: ['sub_math', 'sub_sci', 'sub_eng', 'sub_soc', 'sub_comp'], assignedTeacherIds: ['t_11', 't_12', 't_13', 't_14', 't_15'] },
  { id: '8B', standardId: 8, name: 'B', assignedSubjectIds: ['sub_math', 'sub_sci', 'sub_eng', 'sub_soc', 'sub_comp'], assignedTeacherIds: ['t_11', 't_12', 't_13', 't_14', 't_15'] },
  { id: '8C', standardId: 8, name: 'C', assignedSubjectIds: ['sub_math', 'sub_sci', 'sub_eng', 'sub_soc', 'sub_comp'], assignedTeacherIds: ['t_11', 't_12', 't_13', 't_14', 't_15'] },
  // Standard 9
  { id: '9A', standardId: 9, name: 'A', assignedSubjectIds: ['sub_math', 'sub_sci', 'sub_eng', 'sub_soc', 'sub_comp'], assignedTeacherIds: ['t_16', 't_17', 't_18', 't_19', 't_20'] },
  { id: '9B', standardId: 9, name: 'B', assignedSubjectIds: ['sub_math', 'sub_sci', 'sub_eng', 'sub_soc', 'sub_comp'], assignedTeacherIds: ['t_16', 't_17', 't_18', 't_19', 't_20'] },
  { id: '9C', standardId: 9, name: 'C', assignedSubjectIds: ['sub_math', 'sub_sci', 'sub_eng', 'sub_soc', 'sub_comp'], assignedTeacherIds: ['t_16', 't_17', 't_18', 't_19', 't_20'] },
  // Standard 10
  { id: '10A', standardId: 10, name: 'A', assignedSubjectIds: ['sub_math', 'sub_sci', 'sub_eng', 'sub_soc', 'sub_comp'], assignedTeacherIds: ['t_21', 't_22', 't_23', 't_24', 't_25'] },
  { id: '10B', standardId: 10, name: 'B', assignedSubjectIds: ['sub_math', 'sub_sci', 'sub_eng', 'sub_soc', 'sub_comp'], assignedTeacherIds: ['t_21', 't_22', 't_23', 't_24', 't_25'] },
  { id: '10C', standardId: 10, name: 'C', assignedSubjectIds: ['sub_math', 'sub_sci', 'sub_eng', 'sub_soc', 'sub_comp'], assignedTeacherIds: ['t_21', 't_22', 't_23', 't_24', 't_25'] },
];

export const INITIAL_TEACHERS: Teacher[] = [
  // Standard 6 Teachers (5)
  { id: 't_1', name: 'Mrs. Neha Kulkarni', email: 'neha.kulkarni@greenwood.edu', standardIds: [6], subjectIds: ['sub_math'], sectionIds: ['6A', '6B', '6C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
  { id: 't_2', name: 'Mr. Arvind Joshi', email: 'arvind.joshi@greenwood.edu', standardIds: [6], subjectIds: ['sub_sci'], sectionIds: ['6A', '6B', '6C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
  { id: 't_3', name: 'Ms. Pooja Nair', email: 'pooja.nair@greenwood.edu', standardIds: [6], subjectIds: ['sub_eng'], sectionIds: ['6A', '6B', '6C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
  { id: 't_4', name: 'Mr. Deepak Chopra', email: 'deepak.chopra@greenwood.edu', standardIds: [6], subjectIds: ['sub_soc'], sectionIds: ['6A', '6B', '6C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
  { id: 't_5', name: 'Ms. Sneha Patil', email: 'sneha.patil@greenwood.edu', standardIds: [6], subjectIds: ['sub_comp'], sectionIds: ['6A', '6B', '6C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },

  // Standard 7 Teachers (5)
  { id: 't_6', name: 'Mr. Sanjay Sen', email: 'sanjay.sen@greenwood.edu', standardIds: [7], subjectIds: ['sub_math'], sectionIds: ['7A', '7B', '7C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
  { id: 't_7', name: 'Mrs. Meera Deshmukh', email: 'meera.deshmukh@greenwood.edu', standardIds: [7], subjectIds: ['sub_sci'], sectionIds: ['7A', '7B', '7C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
  { id: 't_8', name: 'Mr. Joseph Fernandez', email: 'joseph.f@greenwood.edu', standardIds: [7], subjectIds: ['sub_eng'], sectionIds: ['7A', '7B', '7C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
  { id: 't_9', name: 'Ms. Ritu Saxena', email: 'ritu.saxena@greenwood.edu', standardIds: [7], subjectIds: ['sub_soc'], sectionIds: ['7A', '7B', '7C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
  { id: 't_10', name: 'Mr. Gaurav Bhatia', email: 'gaurav.bhatia@greenwood.edu', standardIds: [7], subjectIds: ['sub_comp'], sectionIds: ['7A', '7B', '7C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },

  // Standard 8 Teachers (5) - Includes Mr. Rahul Sharma (featured in spec)
  { id: 't_11', name: 'Mr. Rahul Sharma', email: 'rahul.sharma@greenwood.edu', standardIds: [8], subjectIds: ['sub_math'], sectionIds: ['8A', '8B', '8C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
  { id: 't_12', name: 'Mrs. Anita Verma', email: 'anita.verma@greenwood.edu', standardIds: [8], subjectIds: ['sub_sci'], sectionIds: ['8A', '8B', '8C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
  { id: 't_13', name: 'Mr. Vikram Rao', email: 'vikram.rao@greenwood.edu', standardIds: [8], subjectIds: ['sub_eng'], sectionIds: ['8A', '8B', '8C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
  { id: 't_14', name: 'Mrs. Kavita Iyer', email: 'kavita.iyer@greenwood.edu', standardIds: [8], subjectIds: ['sub_soc'], sectionIds: ['8A', '8B', '8C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
  { id: 't_15', name: 'Mr. Amitav Ghosh', email: 'amitav.ghosh@greenwood.edu', standardIds: [8], subjectIds: ['sub_comp'], sectionIds: ['8A', '8B', '8C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },

  // Standard 9 Teachers (5)
  { id: 't_16', name: 'Dr. Ramesh Pillai', email: 'ramesh.pillai@greenwood.edu', standardIds: [9], subjectIds: ['sub_math'], sectionIds: ['9A', '9B', '9C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
  { id: 't_17', name: 'Mrs. Suniti Bose', email: 'suniti.bose@greenwood.edu', standardIds: [9], subjectIds: ['sub_sci'], sectionIds: ['9A', '9B', '9C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
  { id: 't_18', name: 'Mr. Daniel Thomas', email: 'daniel.thomas@greenwood.edu', standardIds: [9], subjectIds: ['sub_eng'], sectionIds: ['9A', '9B', '9C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
  { id: 't_19', name: 'Mrs. Rekha Anand', email: 'rekha.anand@greenwood.edu', standardIds: [9], subjectIds: ['sub_soc'], sectionIds: ['9A', '9B', '9C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
  { id: 't_20', name: 'Mr. Kunal Malhotra', email: 'kunal.malhotra@greenwood.edu', standardIds: [9], subjectIds: ['sub_comp'], sectionIds: ['9A', '9B', '9C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },

  // Standard 10 Teachers (5)
  { id: 't_21', name: 'Prof. Manoj Agarwal', email: 'manoj.agarwal@greenwood.edu', standardIds: [10], subjectIds: ['sub_math'], sectionIds: ['10A', '10B', '10C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
  { id: 't_22', name: 'Dr. Priya Nambiar', email: 'priya.nambiar@greenwood.edu', standardIds: [10], subjectIds: ['sub_sci'], sectionIds: ['10A', '10B', '10C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
  { id: 't_23', name: 'Mrs. Sarah Jenkins', email: 'sarah.jenkins@greenwood.edu', standardIds: [10], subjectIds: ['sub_eng'], sectionIds: ['10A', '10B', '10C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
  { id: 't_24', name: 'Mr. Harish Chandra', email: 'harish.chandra@greenwood.edu', standardIds: [10], subjectIds: ['sub_soc'], sectionIds: ['10A', '10B', '10C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
  { id: 't_25', name: 'Ms. Tanvi Mehra', email: 'tanvi.mehra@greenwood.edu', standardIds: [10], subjectIds: ['sub_comp'], sectionIds: ['10A', '10B', '10C'], workingDays: DAYS_OF_WEEK, maxPeriodsPerDay: 5 },
];

export const INITIAL_SCHOOL_SETTINGS: SchoolSettings = {
  schoolName: 'Greenwood International School',
  academicYear: '2026 – 2027',
  workingDays: DAYS_OF_WEEK,
  periodsPerDay: 6,
  periodDurationMin: 45,
  startTime: '08:30 AM',
};

export const DEMO_USERS: Record<string, User> = {
  admin: {
    id: 'u_admin',
    name: 'Yatharth',
    email: 'yatharth@greenwood.edu',
    role: 'admin',
    schoolName: 'Greenwood International School',
  },
  principal: {
    id: 'u_principal',
    name: 'Dr. Sunita Kapoor',
    email: 'sunita.kapoor@greenwood.edu',
    role: 'principal',
    schoolName: 'Greenwood International School',
  },
  teacher: {
    id: 'u_teacher',
    name: 'Mr. Rahul Sharma',
    email: 'rahul.sharma@greenwood.edu',
    role: 'teacher',
    schoolName: 'Greenwood International School',
    teacherId: 't_11',
  },
};

// Generate default availability for a teacher
export function createDefaultAvailability(teacherId: string, maxPeriods = 5): TeacherAvailability {
  const schedule: Record<DayOfWeek, Record<number, boolean>> = {} as any;
  DAYS_OF_WEEK.forEach(day => {
    schedule[day] = {
      1: true,
      2: true,
      3: true,
      4: true,
      5: true,
      6: true,
    };
  });
  // Add some realistic unavailable slots for demo realism
  if (teacherId === 't_11') {
    // Rahul Sharma: Wednesday Period 6 and Saturday Period 5 unavailable
    schedule['Wednesday'][6] = false;
    schedule['Saturday'][5] = false;
  }
  return {
    teacherId,
    schedule,
    maxPeriodsPerDay: maxPeriods,
  };
}

/**
 * Generate a clean, realistic, conflict-free initial timetable for all sections
 */
export function generateInitialTimetable(): TimetableEntry[] {
  const entries: TimetableEntry[] = [];
  const subjectIds = ['sub_math', 'sub_sci', 'sub_eng', 'sub_soc', 'sub_comp'];

  // For each standard (6 to 10)
  for (const std of INITIAL_STANDARDS) {
    const stdSections = ['A', 'B', 'C'];
    const teachersForStd = INITIAL_TEACHERS.filter(t => t.standardIds.includes(std.id));

    stdSections.forEach((secLetter, sIdx) => {
      const sectionId = `${std.id}${secLetter}`;

      DAYS_OF_WEEK.forEach((day, dIdx) => {
        for (let period = 1; period <= 6; period++) {
          // Compute subject pattern to ensure:
          // 1. Weekly period quota is respected
          // 2. No teacher clash across sections A, B, C of the same standard
          // Offset each section by sIdx and day by dIdx
          let subjIdx = (period - 1 + dIdx * 2 + sIdx) % subjectIds.length;
          
          // Computer is 4 periods/week, math/sci/eng/soc are 5
          if (period === 6 && (dIdx === 4 || dIdx === 5)) {
            subjIdx = (subjIdx + 1) % 4; // Use math or sci or eng instead
          }
          const chosenSubjectId = subjectIds[subjIdx];
          
          // Find teacher who teaches this subject for this standard
          const teacher = teachersForStd.find(t => t.subjectIds.includes(chosenSubjectId)) || teachersForStd[0];

          entries.push({
            id: `entry_${sectionId}_${day}_${period}`,
            standardId: std.id,
            sectionId: sectionId,
            day: day,
            period: period,
            subjectId: chosenSubjectId,
            teacherId: teacher.id,
          });
        }
      });
    });
  }

  return entries;
}
