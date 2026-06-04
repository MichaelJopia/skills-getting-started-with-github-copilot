import copy
from urllib.parse import quote
import pytest
from fastapi.testclient import TestClient

from src.app import app, activities

client = TestClient(app)

# Snapshot the initial activities so each test can reset to a known state
_original_snapshot = copy.deepcopy(activities)

@pytest.fixture(autouse=True)
def reset_activities():
    # Arrange: reset global `activities` to the original snapshot before each test
    activities.clear()
    activities.update(copy.deepcopy(_original_snapshot))
    yield


def test_root_redirect():
    # Act
    res = client.get("/", allow_redirects=False)
    # Assert
    assert res.status_code in (301, 302, 307, 308)
    assert res.headers.get("location") == "/static/index.html"


def test_get_activities():
    # Act
    res = client.get("/activities")
    # Assert
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_for_activity():
    activity = "Chess Club"
    email = "alice@example.com"
    url = f"/activities/{quote(activity, safe='')}/signup"

    # Act
    res = client.post(url, params={"email": email})

    # Assert
    assert res.status_code == 200
    body = res.json()
    assert email in body.get("message", "")
    assert email in activities[activity]["participants"]


def test_signup_duplicate():
    activity = "Chess Club"
    existing_email = activities[activity]["participants"][0]
    url = f"/activities/{quote(activity, safe='')}/signup"

    # Act
    res = client.post(url, params={"email": existing_email})

    # Assert
    assert res.status_code == 400
    assert res.json().get("detail") is not None


def test_unregister_from_activity():
    activity = "Programming Class"
    email = activities[activity]["participants"][0]
    url = f"/activities/{quote(activity, safe='')}/signup"

    # Act
    res = client.delete(url, params={"email": email})

    # Assert
    assert res.status_code == 200
    assert email not in activities[activity]["participants"]
