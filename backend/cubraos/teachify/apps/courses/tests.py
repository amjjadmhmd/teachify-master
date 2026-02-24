from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import LandingCourse


User = get_user_model()


class LandingCourseApiTests(APITestCase):
    def setUp(self):
        self.list_url = reverse("landing-courses-list")

        self.student_user = User.objects.create_user(
            email="student@test.com",
            username="student",
            password="testpass123",
            role="student",
        )
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            username="admin",
            password="testpass123",
            role="admin",
        )

        self.published_course = LandingCourse.objects.create(
            title="Published Course",
            description="Visible for everyone",
            image_url="https://example.com/published.jpg",
            is_published=True,
            sort_order=1,
        )
        self.hidden_course = LandingCourse.objects.create(
            title="Hidden Course",
            description="Visible for admins only",
            image_url="https://example.com/hidden.jpg",
            is_published=False,
            sort_order=2,
        )

    def test_public_list_returns_only_published(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_titles = {item["title"] for item in response.data}
        self.assertIn("Published Course", returned_titles)
        self.assertNotIn("Hidden Course", returned_titles)

    def test_non_admin_cannot_create_landing_course(self):
        self.client.force_authenticate(user=self.student_user)
        payload = {
            "title": "Student Created",
            "description": "Should fail",
            "image_url": "https://example.com/image.jpg",
            "is_published": True,
        }
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_landing_course_with_episodes(self):
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "title": "GeoTop Admin Course",
            "short_description": "Landing managed",
            "description": "Admin-created landing course",
            "image_url": "https://example.com/landing.jpg",
            "is_published": True,
            "sort_order": 10,
            "episodes": [
                {
                    "title": "Episode 1",
                    "description": "Intro",
                    "duration_minutes": 15,
                    "sort_order": 1,
                },
                {
                    "title": "Episode 2",
                    "description": "Practice",
                    "duration_minutes": 30,
                    "sort_order": 2,
                },
            ],
        }
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "GeoTop Admin Course")
        self.assertEqual(len(response.data["episodes"]), 2)

    def test_admin_list_can_see_unpublished(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_titles = {item["title"] for item in response.data}
        self.assertIn("Published Course", returned_titles)
        self.assertIn("Hidden Course", returned_titles)
