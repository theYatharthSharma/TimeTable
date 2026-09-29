import { AiConstraint } from '../types';

export const aiService = {
  interpretPreference(promptText: string): AiConstraint {
    const text = promptText.trim();
    const lower = text.toLowerCase();

    // Default detection
    let detectedSubject = 'General';
    let detectedPref = 'Prefer';
    let detectedPeriod = 'Flexible';
    let constraintType: 'Hard Constraint' | 'Soft Constraint' = 'Soft Constraint';

    // Subject matching
    if (lower.includes('math')) detectedSubject = 'Mathematics';
    else if (lower.includes('science')) detectedSubject = 'Science';
    else if (lower.includes('english')) detectedSubject = 'English';
    else if (lower.includes('social') || lower.includes('history') || lower.includes('geography')) detectedSubject = 'Social Science';
    else if (lower.includes('comp') || lower.includes('coding') || lower.includes('lab')) detectedSubject = 'Computer';

    // Preference matching
    if (lower.includes('avoid') || lower.includes('away from') || lower.includes('do not') || lower.includes("don't") || lower.includes('no ')) {
      detectedPref = 'Avoid';
    } else if (lower.includes('only in') || lower.includes('must') || lower.includes('strict')) {
      detectedPref = 'Strictly Assign';
      constraintType = 'Hard Constraint';
    } else if (lower.includes('prefer') || lower.includes('first') || lower.includes('morning')) {
      detectedPref = 'Prioritize';
    }

    // Period matching
    if (lower.includes('last period') || lower.includes('period 6') || lower.includes('end of day')) {
      detectedPeriod = 'Last Period (Period 6)';
    } else if (lower.includes('first period') || lower.includes('period 1') || lower.includes('early morning')) {
      detectedPeriod = 'Period 1';
    } else if (lower.includes('morning')) {
      detectedPeriod = 'Morning (Periods 1-3)';
    } else if (lower.includes('afternoon') || lower.includes('post-lunch')) {
      detectedPeriod = 'Afternoon (Periods 4-6)';
    } else if (lower.includes('saturday')) {
      detectedPeriod = 'Saturday Slots';
    } else if (lower.includes('consecutive')) {
      detectedPeriod = 'Consecutive Blocks';
    }

    return {
      id: `ai_c_${Date.now()}`,
      subject: detectedSubject,
      preference: detectedPref,
      period: detectedPeriod,
      type: constraintType,
      rawText: text,
      active: true,
    };
  },
};
