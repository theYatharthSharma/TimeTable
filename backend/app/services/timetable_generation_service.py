import uuid
from collections import defaultdict
from dataclasses import dataclass

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.academic import Section
from app.models.availability import TeacherAvailability
from app.models.subject import Subject, SubjectStandard
from app.models.teacher import (
    Teacher,
    TeacherSection,
    TeacherStandard,
    TeacherSubject,
)
from app.models.timetable import DayOfWeek, TimetableEntry
from app.schemas.timetable import GenerationConfig


class TimetableGenerationError(Exception):
    """Raised when a valid timetable cannot be generated."""


@dataclass(frozen=True)
class LessonTask:
    section_id: uuid.UUID
    standard_id: uuid.UUID
    subject_id: uuid.UUID


@dataclass(frozen=True)
class Slot:
    day: DayOfWeek
    period: int


def _working_days_from_school(school) -> list[DayOfWeek]:
    """
    Convert school working days into DayOfWeek values.

    Example:
        ["Monday", "Tuesday", "Wednesday"]
    """

    result: list[DayOfWeek] = []

    for value in school.working_days or []:
        try:
            result.append(DayOfWeek(value))
        except ValueError:
            continue

    return result


async def generate_timetable(
    db: AsyncSession,
    school,
    config: GenerationConfig,
) -> list[TimetableEntry]:
    """
    Generate a valid timetable using hard constraints.

    Hard constraints:

    1. One subject per section/day/period.
    2. A teacher cannot teach two sections at the same time.
    3. Teacher must be assigned to the subject.
    4. Teacher must be assigned to the section.
    5. Teacher must be assigned to the section's standard.
    6. Teacher must be available during the slot.
    7. Teacher daily maximum cannot be exceeded.
    8. Subject weekly_periods must be respected.
    9. Locked timetable entries are preserved.
    10. Sections outside the requested generation scope are preserved.

    Supported scopes:

    - entire_school
    - standard
    - section
    """

    # ========================================================
    # 1. LOAD SECTIONS
    # ========================================================

    sections_result = await db.execute(
        select(Section).where(
            Section.school_id == school.id
        )
    )

    all_sections = list(
        sections_result.scalars().all()
    )

    if not all_sections:
        raise TimetableGenerationError(
            "No sections exist for this school."
        )

    section_map = {
        section.id: section
        for section in all_sections
    }

    # ========================================================
    # 2. DETERMINE TARGET SECTIONS
    # ========================================================

    if config.scope == "entire_school":

        target_sections = all_sections

    elif config.scope == "standard":

        if config.target_standard_id is None:
            raise TimetableGenerationError(
                "target_standard_id is required "
                "when scope is 'standard'."
            )

        target_sections = [
            section
            for section in all_sections
            if section.standard_id
            == config.target_standard_id
        ]

    elif config.scope == "section":

        if config.target_section_id is None:
            raise TimetableGenerationError(
                "target_section_id is required "
                "when scope is 'section'."
            )

        target_section = section_map.get(
            config.target_section_id
        )

        if target_section is None:
            raise TimetableGenerationError(
                "Target section was not found in this school."
            )

        target_sections = [target_section]

    else:

        raise TimetableGenerationError(
            f"Unsupported generation scope: {config.scope}"
        )

    if not target_sections:
        raise TimetableGenerationError(
            "No sections matched the requested generation scope."
        )

    target_section_ids = {
        section.id
        for section in target_sections
    }

    # ========================================================
    # 3. LOAD TEACHERS
    # ========================================================

    teachers_result = await db.execute(
        select(Teacher).where(
            Teacher.school_id == school.id
        )
    )

    teachers = list(
        teachers_result.scalars().all()
    )

    if not teachers:
        raise TimetableGenerationError(
            "No teachers exist for this school."
        )

    # ========================================================
    # 4. TEACHER -> SUBJECT MAPPINGS
    # ========================================================

    teacher_subject_result = await db.execute(
        select(TeacherSubject).where(
            TeacherSubject.teacher_id.in_(
                [teacher.id for teacher in teachers]
            )
        )
    )

    teacher_subjects = list(
        teacher_subject_result.scalars().all()
    )

    subjects_by_teacher: dict[
        uuid.UUID,
        set[uuid.UUID],
    ] = defaultdict(set)

    for mapping in teacher_subjects:
        subjects_by_teacher[
            mapping.teacher_id
        ].add(mapping.subject_id)

    # ========================================================
    # 5. TEACHER -> SECTION MAPPINGS
    # ========================================================

    teacher_section_result = await db.execute(
        select(TeacherSection).where(
            TeacherSection.teacher_id.in_(
                [teacher.id for teacher in teachers]
            )
        )
    )

    teacher_sections = list(
        teacher_section_result.scalars().all()
    )

    sections_by_teacher: dict[
        uuid.UUID,
        set[uuid.UUID],
    ] = defaultdict(set)

    for mapping in teacher_sections:
        sections_by_teacher[
            mapping.teacher_id
        ].add(mapping.section_id)

    # ========================================================
    # 6. TEACHER -> STANDARD MAPPINGS
    # ========================================================

    teacher_standard_result = await db.execute(
        select(TeacherStandard).where(
            TeacherStandard.teacher_id.in_(
                [teacher.id for teacher in teachers]
            )
        )
    )

    teacher_standards = list(
        teacher_standard_result.scalars().all()
    )

    standards_by_teacher: dict[
        uuid.UUID,
        set[uuid.UUID],
    ] = defaultdict(set)

    for mapping in teacher_standards:
        standards_by_teacher[
            mapping.teacher_id
        ].add(mapping.standard_id)

    # ========================================================
    # 7. LOAD SUBJECTS
    # ========================================================

    subjects_result = await db.execute(
        select(Subject).where(
            Subject.school_id == school.id
        )
    )

    subjects = list(
        subjects_result.scalars().all()
    )

    if not subjects:
        raise TimetableGenerationError(
            "No subjects exist for this school."
        )

    subject_map = {
        subject.id: subject
        for subject in subjects
    }

    # ========================================================
    # 8. SUBJECT -> STANDARD MAPPINGS
    # ========================================================

    subject_standard_result = await db.execute(
        select(SubjectStandard).where(
            SubjectStandard.subject_id.in_(
                [subject.id for subject in subjects]
            )
        )
    )

    subject_standard_mappings = list(
        subject_standard_result.scalars().all()
    )

    subjects_by_standard: dict[
        uuid.UUID,
        list[Subject],
    ] = defaultdict(list)

    for mapping in subject_standard_mappings:

        subject = subject_map.get(
            mapping.subject_id
        )

        if subject is not None:
            subjects_by_standard[
                mapping.standard_id
            ].append(subject)

    # ========================================================
    # 9. LOAD TEACHER AVAILABILITY
    # ========================================================

    availability_result = await db.execute(
        select(TeacherAvailability).where(
            TeacherAvailability.teacher_id.in_(
                [teacher.id for teacher in teachers]
            )
        )
    )

    availability_records = list(
        availability_result.scalars().all()
    )

    availability_by_teacher = {
        record.teacher_id: record
        for record in availability_records
    }

    # ========================================================
    # 10. LOAD EXISTING TIMETABLE
    # ========================================================

    existing_result = await db.execute(
        select(TimetableEntry).where(
            TimetableEntry.school_id == school.id
        )
    )

    existing_entries = list(
        existing_result.scalars().all()
    )

    # Entries belonging to sections outside the generation
    # scope must remain untouched.
    outside_scope_entries = [
        entry
        for entry in existing_entries
        if entry.section_id not in target_section_ids
    ]

    # Locked entries inside the generation scope must also
    # remain untouched.
    locked_entries = [
        entry
        for entry in existing_entries
        if (
            entry.section_id in target_section_ids
            and entry.is_locked
        )
    ]

    # ========================================================
    # 11. OCCUPANCY TRACKING
    # ========================================================

    occupied_section_slots: set[
        tuple[uuid.UUID, DayOfWeek, int]
    ] = set()

    teacher_busy_slots: set[
        tuple[uuid.UUID, DayOfWeek, int]
    ] = set()

    teacher_daily_load: dict[
        tuple[uuid.UUID, DayOfWeek],
        int,
    ] = defaultdict(int)

    locked_subject_counts: dict[
        tuple[uuid.UUID, uuid.UUID],
        int,
    ] = defaultdict(int)

    # Only outside-scope entries + locked target entries
    # participate in the existing occupancy calculation.
    fixed_entries = [
        *outside_scope_entries,
        *locked_entries,
    ]

    for entry in fixed_entries:

        occupied_section_slots.add(
            (
                entry.section_id,
                entry.day,
                entry.period,
            )
        )

        teacher_busy_slots.add(
            (
                entry.teacher_id,
                entry.day,
                entry.period,
            )
        )

        teacher_daily_load[
            (
                entry.teacher_id,
                entry.day,
            )
        ] += 1

        if entry.section_id in target_section_ids:

            locked_subject_counts[
                (
                    entry.section_id,
                    entry.subject_id,
                )
            ] += 1

    # ========================================================
    # 12. SCHOOL SCHEDULE
    # ========================================================

    working_days = _working_days_from_school(
        school
    )

    if not working_days:
        raise TimetableGenerationError(
            "The school has no valid working days configured."
        )

    periods_per_day = school.periods_per_day

    if (
        periods_per_day is None
        or periods_per_day <= 0
    ):
        raise TimetableGenerationError(
            "The school has an invalid periods_per_day setting."
        )

    # ========================================================
    # 13. BUILD LESSON TASKS
    # ========================================================

    tasks: list[LessonTask] = []

    for section in target_sections:

        section_subjects = subjects_by_standard.get(
            section.standard_id,
            [],
        )

        if not section_subjects:
            raise TimetableGenerationError(
                f"No subjects are assigned to "
                f"standard {section.standard_id}."
            )

        for subject in section_subjects:

            weekly_periods = (
                subject.weekly_periods or 0
            )

            if weekly_periods <= 0:
                continue

            already_locked = locked_subject_counts[
                (
                    section.id,
                    subject.id,
                )
            ]

            remaining_periods = max(
                weekly_periods - already_locked,
                0,
            )

            for _ in range(
                remaining_periods
            ):

                tasks.append(
                    LessonTask(
                        section_id=section.id,
                        standard_id=section.standard_id,
                        subject_id=subject.id,
                    )
                )

    # Nothing needs to be generated.
    if not tasks:

        final_result = await db.execute(
            select(TimetableEntry)
            .where(
                TimetableEntry.school_id
                == school.id
            )
            .order_by(
                TimetableEntry.section_id,
                TimetableEntry.day,
                TimetableEntry.period,
            )
        )

        return list(
            final_result.scalars().all()
        )

    # ========================================================
    # 14. BUILD ALL POSSIBLE SLOTS
    # ========================================================

    all_slots = [
        Slot(
            day=day,
            period=period,
        )
        for day in working_days
        for period in range(
            1,
            periods_per_day + 1,
        )
    ]

    # ========================================================
    # 15. GENERATED ENTRIES
    # ========================================================

    generated_entries: list[
        TimetableEntry
    ] = []

    remaining_tasks = list(tasks)

    # Safety limit for backtracking.
    node_counter = 0
    max_nodes = 100_000

    # ========================================================
    # 16. TEACHER CONSTRAINT CHECK
    # ========================================================

    def teacher_can_teach(
        teacher: Teacher,
        task: LessonTask,
        slot: Slot,
    ) -> bool:

        # ----------------------------------------------------
        # Teacher must teach the subject
        # ----------------------------------------------------

        if task.subject_id not in (
            subjects_by_teacher.get(
                teacher.id,
                set(),
            )
        ):
            return False

        # ----------------------------------------------------
        # Teacher must teach the section
        # ----------------------------------------------------

        if task.section_id not in (
            sections_by_teacher.get(
                teacher.id,
                set(),
            )
        ):
            return False

        # ----------------------------------------------------
        # Teacher must belong to the standard
        # ----------------------------------------------------

        if task.standard_id not in (
            standards_by_teacher.get(
                teacher.id,
                set(),
            )
        ):
            return False

        # ----------------------------------------------------
        # Teacher working days
        # ----------------------------------------------------

        teacher_working_days = (
            teacher.working_days or []
        )

        if teacher_working_days:

            if slot.day.value not in (
                teacher_working_days
            ):
                return False

        # ----------------------------------------------------
        # Teacher availability
        # ----------------------------------------------------

        availability = availability_by_teacher.get(
            teacher.id
        )

        if availability:

            schedule = (
                availability.schedule or {}
            )

            day_schedule = schedule.get(
                slot.day.value,
                {},
            )

            # JSONB keys are normally strings.
            if (
                day_schedule.get(
                    str(slot.period)
                )
                is False
            ):
                return False

            # Also support integer keys.
            if (
                day_schedule.get(
                    slot.period
                )
                is False
            ):
                return False

        # ----------------------------------------------------
        # Teacher double-booking
        # ----------------------------------------------------

        if (
            teacher.id,
            slot.day,
            slot.period,
        ) in teacher_busy_slots:
            return False

        # ----------------------------------------------------
        # Teacher daily maximum
        # ----------------------------------------------------

        teacher_limit = (
            teacher.max_periods_per_day
        )

        if (
            availability
            and availability.max_periods_per_day
        ):

            if teacher_limit:
                teacher_limit = min(
                    teacher_limit,
                    availability.max_periods_per_day,
                )
            else:
                teacher_limit = (
                    availability.max_periods_per_day
                )

        if teacher_limit:

            current_load = teacher_daily_load[
                (
                    teacher.id,
                    slot.day,
                )
            ]

            if current_load >= teacher_limit:
                return False

        return True

    # ========================================================
    # 17. CANDIDATE GENERATION
    # ========================================================

    def get_candidates(
        task: LessonTask,
    ):
        candidates = []

        subject = subject_map.get(
            task.subject_id
        )

        if subject is None:
            return candidates

        for slot in all_slots:

            # Section already occupied.
            if (
                task.section_id,
                slot.day,
                slot.period,
            ) in occupied_section_slots:
                continue

            for teacher in teachers:

                if not teacher_can_teach(
                    teacher,
                    task,
                    slot,
                ):
                    continue

                # --------------------------------------------
                # Soft preference:
                # spread same subject across the week.
                # --------------------------------------------

                same_subject_same_day = sum(
                    1
                    for entry
                    in generated_entries
                    if (
                        entry.section_id
                        == task.section_id
                        and entry.subject_id
                        == task.subject_id
                        and entry.day
                        == slot.day
                    )
                )

                teacher_day_load = (
                    teacher_daily_load[
                        (
                            teacher.id,
                            slot.day,
                        )
                    ]
                )

                # Lower score is preferred.
                score = (
                    same_subject_same_day,
                    teacher_day_load,
                    slot.period,
                )

                candidates.append(
                    (
                        score,
                        slot,
                        teacher,
                        subject,
                    )
                )

        candidates.sort(
            key=lambda item: item[0]
        )

        return candidates

    # ========================================================
    # 18. BACKTRACKING SCHEDULER
    # ========================================================

    def backtrack() -> bool:
        nonlocal node_counter

        node_counter += 1

        if node_counter > max_nodes:
            return False

        # All lessons successfully assigned.
        if not remaining_tasks:
            return True

        best_task_index = None
        best_candidates = None

        # ----------------------------------------------------
        # Minimum Remaining Values heuristic.
        #
        # Schedule the most constrained lesson first.
        # ----------------------------------------------------

        for index, task in enumerate(
            remaining_tasks
        ):

            candidates = get_candidates(
                task
            )

            if not candidates:
                return False

            if (
                best_candidates is None
                or len(candidates)
                < len(best_candidates)
            ):

                best_task_index = index
                best_candidates = candidates

                if len(candidates) == 1:
                    break

        task = remaining_tasks.pop(
            best_task_index
        )

        for (
            _score,
            slot,
            teacher,
            subject,
        ) in best_candidates:

            # ------------------------------------------------
            # Reserve section slot
            # ------------------------------------------------

            section_slot = (
                task.section_id,
                slot.day,
                slot.period,
            )

            occupied_section_slots.add(
                section_slot
            )

            # ------------------------------------------------
            # Reserve teacher slot
            # ------------------------------------------------

            teacher_slot = (
                teacher.id,
                slot.day,
                slot.period,
            )

            teacher_busy_slots.add(
                teacher_slot
            )

            # ------------------------------------------------
            # Increase teacher daily load
            # ------------------------------------------------

            teacher_day = (
                teacher.id,
                slot.day,
            )

            teacher_daily_load[
                teacher_day
            ] += 1

            # ------------------------------------------------
            # Create generated entry
            # ------------------------------------------------

            entry = TimetableEntry(
                school_id=school.id,
                standard_id=task.standard_id,
                section_id=task.section_id,
                day=slot.day,
                period=slot.period,
                subject_id=subject.id,
                teacher_id=teacher.id,
                is_locked=False,
            )

            generated_entries.append(
                entry
            )

            # ------------------------------------------------
            # Continue recursively
            # ------------------------------------------------

            if backtrack():
                return True

            # ------------------------------------------------
            # Undo assignment
            # ------------------------------------------------

            generated_entries.pop()

            occupied_section_slots.remove(
                section_slot
            )

            teacher_busy_slots.remove(
                teacher_slot
            )

            teacher_daily_load[
                teacher_day
            ] -= 1

        # Put task back if all candidates failed.
        remaining_tasks.insert(
            best_task_index,
            task,
        )

        return False

    # ========================================================
    # 19. RUN GENERATION
    # ========================================================

    success = backtrack()

    if not success:

        raise TimetableGenerationError(
            "Unable to generate a valid timetable. "
            "Please check teacher-subject assignments, "
            "teacher-section assignments, teacher-standard "
            "assignments, teacher availability, daily limits, "
            "weekly subject periods, and locked timetable entries."
        )

    # ========================================================
    # 20. REMOVE OLD UNLOCKED TARGET ENTRIES
    # ========================================================

    await db.execute(
        delete(TimetableEntry).where(
            TimetableEntry.school_id == school.id,
            TimetableEntry.section_id.in_(
                target_section_ids
            ),
            TimetableEntry.is_locked.is_(False),
        )
    )

    # ========================================================
    # 21. INSERT NEW GENERATED ENTRIES
    # ========================================================

    db.add_all(
        generated_entries
    )

    await db.commit()

    # ========================================================
    # 22. RETURN COMPLETE CURRENT TIMETABLE
    # ========================================================

    final_result = await db.execute(
        select(TimetableEntry)
        .where(
            TimetableEntry.school_id
            == school.id
        )
        .order_by(
            TimetableEntry.section_id,
            TimetableEntry.day,
            TimetableEntry.period,
        )
    )

    return list(
        final_result.scalars().all()
    )