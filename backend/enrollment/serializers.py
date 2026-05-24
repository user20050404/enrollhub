from rest_framework import serializers
from students.serializers import StudentSerializer
from sections.serializers import SectionSerializer
from subjects.serializers import SubjectSerializer
from .models import Enrollment


class EnrollmentSerializer(serializers.ModelSerializer):
    student_detail = StudentSerializer(source='student', read_only=True)
    section_detail = SectionSerializer(source='section', read_only=True)
    subject_detail = SubjectSerializer(source='subject', read_only=True)

    class Meta:
        model  = Enrollment
        fields = ('id', 'student', 'student_detail', 'section', 'section_detail',
                  'subject', 'subject_detail', 'status', 'remarks',
                  'enrolled_at', 'updated_at')
        read_only_fields = ('enrolled_at', 'updated_at')


class BulkEnrollSerializer(serializers.Serializer):
    """Enrolls a student in ALL subjects of a section at once."""
    student = serializers.IntegerField()
    section = serializers.IntegerField()
    remarks = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, data):
        from students.models import Student
        from sections.models import Section

        try:
            student = Student.objects.get(id=data['student'])
        except Student.DoesNotExist:
            raise serializers.ValidationError('Student not found.')

        try:
            section = Section.objects.prefetch_related('subjects').get(id=data['section'])
        except Section.DoesNotExist:
            raise serializers.ValidationError('Section not found.')

        if not section.subjects.exists():
            raise serializers.ValidationError(
                f'Section {section.code} has no subjects assigned yet.'
            )

        # Check section capacity
        if section.is_full:
            raise serializers.ValidationError(
                f'Section {section.code} is full ({section.max_capacity}/{section.max_capacity}).'
            )

        # Check each subject for duplicates
        errors = []
        for subject in section.subjects.all():
            already = Enrollment.objects.filter(
                student=student,
                subject=subject,
                status__in=['pending', 'enrolled']
            ).exists()
            if already:
                errors.append(f'{subject.code} — already enrolled.')

        if errors:
            raise serializers.ValidationError(
                'Duplicate subjects found: ' + ' | '.join(errors)
            )

        # Check unit limit
        current_units  = student.total_enrolled_units
        adding_units   = section.total_units
        if current_units + adding_units > student.max_units:
            raise serializers.ValidationError(
                f'Exceeds max units. Current: {current_units}, '
                f'Adding: {adding_units}, Max: {student.max_units}.'
            )

        data['student_obj'] = student
        data['section_obj'] = section
        return data