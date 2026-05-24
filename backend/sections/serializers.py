# sections/serializers.py
from rest_framework import serializers
from subjects.serializers import SubjectSerializer
from subjects.models import Subject
from .models import Section


class SectionSerializer(serializers.ModelSerializer):
    subjects_detail = SubjectSerializer(source='subjects', many=True, read_only=True)
    subjects        = serializers.PrimaryKeyRelatedField(
                        queryset=Subject.objects.all(), many=True, required=False
                      )
    enrolled_count  = serializers.ReadOnlyField()
    available_slots = serializers.ReadOnlyField()
    is_full         = serializers.ReadOnlyField()
    total_units     = serializers.ReadOnlyField()

    class Meta:
        model  = Section
        # ✅ Removed 'schedule' and 'room' — they live on Subject now, not Section
        fields = (
            'id', 'code', 'subjects', 'subjects_detail',
            'max_capacity', 'academic_year', 'semester',
            'enrolled_count', 'available_slots', 'is_full',
            'total_units', 'created_at'
        )

    def create(self, validated_data):
        subjects = validated_data.pop('subjects', [])
        section  = Section.objects.create(**validated_data)
        section.subjects.set(subjects)
        return section

    def update(self, instance, validated_data):
        subjects = validated_data.pop('subjects', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if subjects is not None:
            instance.subjects.set(subjects)
        return instance