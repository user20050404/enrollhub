#subjects/serializers.py
from rest_framework import serializers
from .models import Subject


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Subject
        fields = '__all__'

    def validate_units(self, value):
        if value < 1 or value > 6:
            raise serializers.ValidationError('Units must be between 1 and 6.')
        return value

    def validate_code(self, value):
        return value.upper()