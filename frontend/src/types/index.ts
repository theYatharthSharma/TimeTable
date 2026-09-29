export type UserRole = 'admin' | 'principal' | 'teacher';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId : string;
  schoolName: string;
  teacherId?: string; // If role is teacher, link to teacher profile
  avatarUrl?: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface PeriodSlot {
  periodNumber: number;
  label: string;
  startTime: string;
  endTime: string;
}

export interface Standard {
  id: number;
  name: string;
  level: number;
}

export interface Section {
  id: string;
  standardId: number;
  name: string; // 'A', 'B', 'C'
  roomNumber?: string;
  assignedSubjectIds: string[];
  assignedTeacherIds: string[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  standardIds: number[];
  weeklyPeriods: number;
  colorBg: string;
  colorText: string;
  colorBorder: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  standardIds: number[];
  subjectIds: string[];
  sectionIds: string[];
  workingDays: DayOfWeek[];
  maxPeriodsPerDay: number;
  phone?: string;
  avatar?: string;
}

export interface TeacherAvailability {
  teacherId: string;
  // Day -> map of period number to boolean (true = available, false = unavailable)
  schedule: Record<DayOfWeek, Record<number, boolean>>;
  maxPeriodsPerDay: number;
}

export interface TimetableEntry {
  id: string;
  standardId: number;
  sectionId: string; // e.g. '8A'
  day: DayOfWeek;
  period: number; // 1 to 6
  subjectId: string;
  teacherId: string;
  isLocked?: boolean;
}

export interface TimetableConflict {
  id: string;
  type: 'teacher_double_booking' | 'section_double_booking' | 'teacher_unavailable' | 'workload_exceeded';
  message: string;
  severity: 'warning' | 'error';
  day: DayOfWeek;
  period: number;
  teacherId?: string;
  sectionId?: string;
}

export interface AiConstraint {
  id: string;
  subject?: string;
  preference: string;
  period?: string;
  type: 'Hard Constraint' | 'Soft Constraint';
  rawText: string;
  active: boolean;
}

export interface GenerationConfig {
  scope: 'entire_school' | 'standard' | 'section';
  targetStandardId?: number;
  targetSectionId?: string;
  hardConstraints: {
    teacherNoClash: boolean;
    sectionNoClash: boolean;
    respectAvailability: boolean;
    satisfyWeeklyRequirements: boolean;
  };
  softPreferences: {
    avoidTeacherGaps: boolean;
    balanceTeacherWorkload: boolean;
    spreadSubjectsAcrossWeek: boolean;
    avoidConsecutiveClasses: boolean;
  };
  customAiConstraints: AiConstraint[];
}

export interface SchoolSettings {
  schoolName: string;
  academicYear: string;
  workingDays: DayOfWeek[];
  periodsPerDay: number;
  periodDurationMin: number;
  startTime: string;
}
