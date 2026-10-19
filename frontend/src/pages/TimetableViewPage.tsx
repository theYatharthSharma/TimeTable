import React, { useEffect, useMemo, useState } from 'react';
import API_BASE_URL from '../services/apiConfig';
import { authService } from '../services/authService';
import { TimetableErrorState } from '../components/common/TimetableErrorState';
import {
  Calendar,
  Download,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  User as UserIcon,
  Layers,
  Clock,
} from 'lucide-react';

import {
  TimetableEntry,
  TimetableConflict,
  DayOfWeek,
  User,
  Subject,
  Teacher,
} from '../types';

import { timetableService } from '../services/timetableService';
import { sectionService } from '../services/sectionService';
import { subjectService } from '../services/subjectService';
import { teacherService } from '../services/teacherService';
import { DAYS_OF_WEEK, PERIOD_SLOTS } from '../data/mockData';
import { Modal } from '../components/common/Modal';

interface TimetableViewPageProps {
  currentUser: User;
  onShowToast: (
    message: string,
    type: 'success' | 'error' | 'info'
  ) => void;
  onNavigateToGenerate: () => void;
}

interface BackendStandard {
  id: string;
  name: string;
  level: number;
}

interface BackendSection {
  id: string;
  name: string;
  standard_id: string;
  room_number?: string | null;
}

interface BackendSubject {
  id: string;
  name: string;
  code: string;
  weekly_periods: number;
}

interface BackendTeacher {
  id: string;
  name: string;
  email?: string;
  phone?: string | null;
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('timegen_access_token');
};

const getSchoolId = (): string | null => authService.getSchoolId();

const backendRequest = async <T,>(
  endpoint: string
): Promise<T> => {
  const token = getAuthToken();
  const schoolId = getSchoolId();

  if (!token) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  if (!schoolId) {
    throw new Error(
      'No school is selected. Please log in again.'
    );
  }

  const separator = endpoint.includes('?') ? '&' : '?';

  const response = await fetch(
    `${API_BASE_URL}${endpoint}${separator}school_id=${schoolId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
