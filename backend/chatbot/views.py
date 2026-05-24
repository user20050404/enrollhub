from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from enrollment.models import Enrollment
from students.models import Student
from sections.models import Section
from subjects.models import Subject


def get_bot_reply(message, user):
    msg = message.lower().strip()

    # Fetch live data
    total_students  = Student.objects.count()
    total_subjects  = Subject.objects.count()
    total_sections  = Section.objects.count()
    total_enrolled  = Enrollment.objects.filter(status='enrolled').count()
    total_pending   = Enrollment.objects.filter(status='pending').count()
    full_sections   = [s.code for s in Section.objects.all() if s.is_full]
    open_sections   = [s.code for s in Section.objects.all() if not s.is_full]

    # --- Greetings ---
    if any(w in msg for w in ['hello', 'hi', 'hey', 'good morning', 'good afternoon']):
        return f"Hi {user.first_name}! 👋 I'm EnrollBot. I can help you with enrollment info, section availability, and student records. What do you need?"

    # --- Student queries ---
    if any(w in msg for w in ['how many student', 'total student', 'number of student']):
        return f"There are currently {total_students} registered students in the system."

    if any(w in msg for w in ['enrolled student', 'active enrollment', 'how many enrolled']):
        return f"There are {total_enrolled} active enrollments right now, with {total_pending} still pending approval."

    # --- Section queries ---
    if any(w in msg for w in ['full section', 'which section is full', 'sections full']):
        if full_sections:
            return f"The following sections are currently full: {', '.join(full_sections)}."
        return "Good news! No sections are full right now."

    if any(w in msg for w in ['open section', 'available section', 'slots available', 'section available']):
        if open_sections:
            return f"These sections still have open slots: {', '.join(open_sections[:8])}{'...' if len(open_sections) > 8 else ''}."
        return "All sections are currently full. Please contact the admin to create new sections."

    if any(w in msg for w in ['how many section', 'total section', 'number of section']):
        return f"There are {total_sections} sections in the system. {len(full_sections)} are full and {len(open_sections)} still have open slots."

    # --- Subject queries ---
    if any(w in msg for w in ['how many subject', 'total subject', 'number of subject', 'list subject']):
        subjects = Subject.objects.all()
        codes = ', '.join([s.code for s in subjects])
        return f"There are {total_subjects} subjects in the system: {codes}."

    # --- Enrollment queries ---
    if any(w in msg for w in ['pending', 'pending enrollment', 'waiting approval']):
        return f"There are {total_pending} enrollments pending approval. Go to the Enrollment page to approve them."

    if any(w in msg for w in ['how to enroll', 'enroll a student', 'enrollment process', 'how do i enroll']):
        return "To enroll a student: go to Enrollment → click '+ New Enrollment' → select the student and section → click Enroll. The system will automatically check for capacity and duplicate enrollments."

    if any(w in msg for w in ['duplicate', 'already enrolled', 'enroll twice']):
        return "The system automatically prevents duplicate enrollments. A student cannot enroll in the same subject twice in the same semester."

    if any(w in msg for w in ['capacity', 'max student', 'max capacity', 'section limit']):
        return "Each section has a maximum capacity set when created (default is 40 students). The system will block enrollment when a section is full."

    if any(w in msg for w in ['unit', 'max unit', 'total unit']):
        return "Each student has a maximum unit limit (default 24 units per semester). The system calculates total enrolled units and blocks enrollment if the limit would be exceeded."

    # --- Student-specific queries ---
    if user.role == 'student':
        try:
            student = user.student_profile
            current_units = student.total_enrolled_units

            if any(w in msg for w in ['my unit', 'my enrollment', 'my subject', 'how many unit']):
                return f"You currently have {current_units} out of {student.max_units} units enrolled this semester."

            if any(w in msg for w in ['my section', 'what section', 'my class']):
                enrollments = Enrollment.objects.filter(student=student, status='enrolled')
                if enrollments:
                    sections = ', '.join([e.section.code for e in enrollments])
                    return f"You are currently enrolled in: {sections}."
                return "You don't have any active enrollments yet. Visit the Enrollment page to enroll."

        except Exception:
            pass

    # --- Admin/Staff summary ---
    if any(w in msg for w in ['summary', 'overview', 'report', 'status']):
        return (
            f"📊 EnrollHub Summary:\n"
            f"• Students: {total_students}\n"
            f"• Subjects: {total_subjects}\n"
            f"• Sections: {total_sections} ({len(full_sections)} full)\n"
            f"• Active enrollments: {total_enrolled}\n"
            f"• Pending approvals: {total_pending}"
        )

    if any(w in msg for w in ['help', 'what can you do', 'commands', 'what do you know']):
        return (
            "I can help you with:\n"
            "• Enrollment counts and status\n"
            "• Section availability\n"
            "• Subject list\n"
            "• How to enroll students\n"
            "• Capacity and unit rules\n"
            "• System summary\n\n"
            "Just ask me anything about the enrollment system!"
        )

    # --- Default ---
    return (
        f"I'm not sure about that. Here's what I know right now: "
        f"{total_students} students, {total_enrolled} active enrollments, "
        f"{len(open_sections)} open sections. "
        f"Try asking about sections, enrollment, students, or units!"
    )


class ChatbotView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        reply = get_bot_reply(message, request.user)
        return Response({'reply': reply})