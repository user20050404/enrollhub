#enrollment/views.py
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import Enrollment
from .serializers import EnrollmentSerializer, BulkEnrollSerializer
from students.models import Student


class EnrollmentListView(generics.ListAPIView):
    serializer_class   = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Enrollment.objects.select_related(
            'student__user', 'section', 'subject'
        ).all().order_by('-enrolled_at')
        student_id = self.request.query_params.get('student')
        if student_id:
            qs = qs.filter(student__id=student_id)
        return qs


class EnrollmentCreateView(APIView):
    """Admin/Staff enrolls a student in ALL subjects of a section at once."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BulkEnrollSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        student = serializer.validated_data['student_obj']
        section = serializer.validated_data['section_obj']
        remarks = serializer.validated_data['remarks']

        created = []
        for subject in section.subjects.all():
            enrollment = Enrollment.objects.create(
                student     = student,
                section     = section,
                subject     = subject,
                status      = 'enrolled',
                enrolled_by = request.user,
                remarks     = remarks,
            )
            created.append(EnrollmentSerializer(enrollment).data)

        return Response({
            'message':     f'Successfully enrolled in {len(created)} subject(s).',
            'enrollments': created,
        }, status=status.HTTP_201_CREATED)


class EnrollmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Enrollment.objects.select_related(
            'student__user', 'section', 'subject'
        ).all()


class EnrollmentSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Count UNIQUE students enrolled, not individual subject rows
        enrolled_students = Enrollment.objects.filter(
            status='enrolled'
        ).values('student').distinct().count()

        pending_students = Enrollment.objects.filter(
            status='pending'
        ).values('student').distinct().count()

        dropped_students = Enrollment.objects.filter(
            status='dropped'
        ).values('student').distinct().count()

        return Response({
            'total_students': Student.objects.count(),
            'total_enrolled': enrolled_students,
            'total_pending':  pending_students,
            'total_dropped':  dropped_students,
        })


class StudentSelfEnrollView(APIView):
    """Allows a student to enroll themselves into a section."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Make sure the logged-in user is a student
        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can use this endpoint.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            student = request.user.student_profile
        except Exception:
            return Response(
                {'error': 'Student profile not found. Contact admin.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = BulkEnrollSerializer(data={
            'student': student.id,
            'section': request.data.get('section'),
            'remarks': request.data.get('remarks', ''),
        })

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        section = serializer.validated_data['section_obj']
        remarks = serializer.validated_data['remarks']

        created = []
        for subject in section.subjects.all():
            enrollment = Enrollment.objects.create(
                student     = student,
                section     = section,
                subject     = subject,
                status      = 'enrolled',
                enrolled_by = request.user,
                remarks     = remarks,
            )
            created.append(EnrollmentSerializer(enrollment).data)

        return Response({
            'message':     f'Successfully enrolled in {len(created)} subject(s)!',
            'enrollments': created,
        }, status=status.HTTP_201_CREATED)


class MyEnrollmentsView(APIView):
    """Returns enrollments for the currently logged-in student."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'student':
            return Response(
                {'error': 'Students only.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            student = request.user.student_profile
        except Exception:
            return Response(
                {'error': 'Student profile not found. Contact admin.'},
                status=status.HTTP_404_NOT_FOUND
            )

        enrollments = Enrollment.objects.select_related(
            'section', 'subject'
        ).filter(student=student).order_by('-enrolled_at')

        return Response({
            'student': {
                'id':                   student.id,
                'student_id':           student.student_id,
                'full_name':            student.user.get_full_name(),
                'course':               student.course,
                'year_level':           student.year_level,
                'max_units':            student.max_units,
                'total_enrolled_units': student.total_enrolled_units,
            },
            'enrollments': EnrollmentSerializer(enrollments, many=True).data,
        })