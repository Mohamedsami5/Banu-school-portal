# Code Citations

## License: unknown
https://github.com/ericholscher/django-rating/blob/937aaed83ab29aee203338ef20494e4432908377/rating/templates/rating/rating_form.html

```
## Issue Analysis

**The Problem:**
An empty string `""` is being sent for `parentId` to MongoDB. Mongoose expects ObjectId values to be either:
- A valid 24-character hex string
- A valid MongoDB ObjectId
- `null` or `undefined` (not empty string)

**Why It Happens:**
The frontend is sending `parentId: ""` instead of `parentId: null` or omitting it entirely when there's no parent feedback.

**The Fix:**
Filter out empty `parentId` before sending to the backend, and ensure proper payload validation.

---

## Complete Fixed TeacherFeedback.jsx

````jsx
// filepath: d:\24MX330_Major_project\school-portal\src\pages\TeacherFeedback.jsx
import React, { useState, useCallback } from 'react';
import './TeacherFeedback.css';

const TeacherFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    feedbackText: '',
    rating: 5,
    parentId: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Fetch all feedback
  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback`);
      if (!response.ok) throw new Error('Failed to fetch feedback');
      const data = await response.json();
      setFeedbackList(data);
    } catch (err) {
      setError(`Error fetching feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value,
    }));
  }, []);

  // Validate form data
  const validateForm = () => {
    if (!formData.studentName.trim()) {
      setError('Student name is required');
      return false;
    }
    if (!formData.studentId.trim()) {
      setError('Student ID is required');
      return false;
    }
    if (!formData.feedbackText.trim()) {
      setError('Feedback text is required');
      return false;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      setError('Rating must be between 1 and 5');
      return false;
    }
    return true;
  };

  // Build payload with proper parentId handling
  const buildPayload = () => {
    const payload = {
      studentName: formData.studentName.trim(),
      studentId: formData.studentId.trim(),
      feedbackText: formData.feedbackText.trim(),
      rating: formData.rating,
    };

    // Only include parentId if it's a valid string
    if (formData.parentId && typeof formData.parentId === 'string' && formData.parentId.trim()) {
      payload.parentId = formData.parentId.trim();
    }

    return payload;
  };

  // Save feedback (create or update)
  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = buildPayload();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API_URL}/feedback/${editingId}`
        : `${API_URL}/feedback`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save feedback');
      }

      setSuccess(editingId ? 'Feedback updated successfully!' : 'Feedback saved successfully!');
      setFormData({
        studentName: '',
        studentId: '',
        feedbackText: '',
        rating: 5,
        parentId: null,
      });
      setEditingId(null);
      await fetchFeedback();
    } catch (err) {
      setError(`Error saving feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (feedback) => {
    setFormData({
      studentName: feedback.studentName,
      studentId: feedback.studentId,
      feedbackText: feedback.feedbackText,
      rating: feedback.rating,
      parentId: feedback.parentId || null,
    });
    setEditingId(feedback._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete feedback');

      setSuccess('Feedback deleted successfully!');
      await fetchFeedback();
    } catch (err) {
      setError(`Error deleting feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setFormData({
      studentName: '',
      studentId: '',
      feedbackText: '',
      rating: 5,
      parentId: null,
    });
    setEditingId(null);
  };

  // Load feedback on mount
  React.useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return (
    <div className="teacher-feedback-container">
      <h1>Teacher Feedback Portal</h1>

      {/* Alert Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Feedback Form */}
      <form className="feedback-form" onSubmit={handleSaveFeedback}>
        <h2>{editingId ? 'Edit Feedback' : 'Add New Feedback'}</h2>

        <div className="form-group">
          <label htmlFor="studentName">Student Name *</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            placeholder="Enter student name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentId">Student ID *</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            placeholder="Enter student ID"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="feedbackText">Feedback *</label>
          <textarea
            id="feedbackText"
            name="feedbackText"
            value={formData.feedbackText}
            onChange={handleInputChange}
            placeholder="Enter your feedback here"
            rows="5"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rating">Rating (1-5) *</label>
            <select
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              required
            >
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very Good</option>
              <option value
```


## License: unknown
https://github.com/ericholscher/django-rating/blob/937aaed83ab29aee203338ef20494e4432908377/rating/templates/rating/rating_form.html

```
## Issue Analysis

**The Problem:**
An empty string `""` is being sent for `parentId` to MongoDB. Mongoose expects ObjectId values to be either:
- A valid 24-character hex string
- A valid MongoDB ObjectId
- `null` or `undefined` (not empty string)

**Why It Happens:**
The frontend is sending `parentId: ""` instead of `parentId: null` or omitting it entirely when there's no parent feedback.

**The Fix:**
Filter out empty `parentId` before sending to the backend, and ensure proper payload validation.

---

## Complete Fixed TeacherFeedback.jsx

````jsx
// filepath: d:\24MX330_Major_project\school-portal\src\pages\TeacherFeedback.jsx
import React, { useState, useCallback } from 'react';
import './TeacherFeedback.css';

const TeacherFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    feedbackText: '',
    rating: 5,
    parentId: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Fetch all feedback
  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback`);
      if (!response.ok) throw new Error('Failed to fetch feedback');
      const data = await response.json();
      setFeedbackList(data);
    } catch (err) {
      setError(`Error fetching feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value,
    }));
  }, []);

  // Validate form data
  const validateForm = () => {
    if (!formData.studentName.trim()) {
      setError('Student name is required');
      return false;
    }
    if (!formData.studentId.trim()) {
      setError('Student ID is required');
      return false;
    }
    if (!formData.feedbackText.trim()) {
      setError('Feedback text is required');
      return false;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      setError('Rating must be between 1 and 5');
      return false;
    }
    return true;
  };

  // Build payload with proper parentId handling
  const buildPayload = () => {
    const payload = {
      studentName: formData.studentName.trim(),
      studentId: formData.studentId.trim(),
      feedbackText: formData.feedbackText.trim(),
      rating: formData.rating,
    };

    // Only include parentId if it's a valid string
    if (formData.parentId && typeof formData.parentId === 'string' && formData.parentId.trim()) {
      payload.parentId = formData.parentId.trim();
    }

    return payload;
  };

  // Save feedback (create or update)
  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = buildPayload();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API_URL}/feedback/${editingId}`
        : `${API_URL}/feedback`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save feedback');
      }

      setSuccess(editingId ? 'Feedback updated successfully!' : 'Feedback saved successfully!');
      setFormData({
        studentName: '',
        studentId: '',
        feedbackText: '',
        rating: 5,
        parentId: null,
      });
      setEditingId(null);
      await fetchFeedback();
    } catch (err) {
      setError(`Error saving feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (feedback) => {
    setFormData({
      studentName: feedback.studentName,
      studentId: feedback.studentId,
      feedbackText: feedback.feedbackText,
      rating: feedback.rating,
      parentId: feedback.parentId || null,
    });
    setEditingId(feedback._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete feedback');

      setSuccess('Feedback deleted successfully!');
      await fetchFeedback();
    } catch (err) {
      setError(`Error deleting feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setFormData({
      studentName: '',
      studentId: '',
      feedbackText: '',
      rating: 5,
      parentId: null,
    });
    setEditingId(null);
  };

  // Load feedback on mount
  React.useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return (
    <div className="teacher-feedback-container">
      <h1>Teacher Feedback Portal</h1>

      {/* Alert Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Feedback Form */}
      <form className="feedback-form" onSubmit={handleSaveFeedback}>
        <h2>{editingId ? 'Edit Feedback' : 'Add New Feedback'}</h2>

        <div className="form-group">
          <label htmlFor="studentName">Student Name *</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            placeholder="Enter student name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentId">Student ID *</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            placeholder="Enter student ID"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="feedbackText">Feedback *</label>
          <textarea
            id="feedbackText"
            name="feedbackText"
            value={formData.feedbackText}
            onChange={handleInputChange}
            placeholder="Enter your feedback here"
            rows="5"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rating">Rating (1-5) *</label>
            <select
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              required
            >
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very Good</option>
              <option value
```


## License: unknown
https://github.com/ericholscher/django-rating/blob/937aaed83ab29aee203338ef20494e4432908377/rating/templates/rating/rating_form.html

```
## Issue Analysis

**The Problem:**
An empty string `""` is being sent for `parentId` to MongoDB. Mongoose expects ObjectId values to be either:
- A valid 24-character hex string
- A valid MongoDB ObjectId
- `null` or `undefined` (not empty string)

**Why It Happens:**
The frontend is sending `parentId: ""` instead of `parentId: null` or omitting it entirely when there's no parent feedback.

**The Fix:**
Filter out empty `parentId` before sending to the backend, and ensure proper payload validation.

---

## Complete Fixed TeacherFeedback.jsx

````jsx
// filepath: d:\24MX330_Major_project\school-portal\src\pages\TeacherFeedback.jsx
import React, { useState, useCallback } from 'react';
import './TeacherFeedback.css';

const TeacherFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    feedbackText: '',
    rating: 5,
    parentId: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Fetch all feedback
  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback`);
      if (!response.ok) throw new Error('Failed to fetch feedback');
      const data = await response.json();
      setFeedbackList(data);
    } catch (err) {
      setError(`Error fetching feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value,
    }));
  }, []);

  // Validate form data
  const validateForm = () => {
    if (!formData.studentName.trim()) {
      setError('Student name is required');
      return false;
    }
    if (!formData.studentId.trim()) {
      setError('Student ID is required');
      return false;
    }
    if (!formData.feedbackText.trim()) {
      setError('Feedback text is required');
      return false;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      setError('Rating must be between 1 and 5');
      return false;
    }
    return true;
  };

  // Build payload with proper parentId handling
  const buildPayload = () => {
    const payload = {
      studentName: formData.studentName.trim(),
      studentId: formData.studentId.trim(),
      feedbackText: formData.feedbackText.trim(),
      rating: formData.rating,
    };

    // Only include parentId if it's a valid string
    if (formData.parentId && typeof formData.parentId === 'string' && formData.parentId.trim()) {
      payload.parentId = formData.parentId.trim();
    }

    return payload;
  };

  // Save feedback (create or update)
  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = buildPayload();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API_URL}/feedback/${editingId}`
        : `${API_URL}/feedback`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save feedback');
      }

      setSuccess(editingId ? 'Feedback updated successfully!' : 'Feedback saved successfully!');
      setFormData({
        studentName: '',
        studentId: '',
        feedbackText: '',
        rating: 5,
        parentId: null,
      });
      setEditingId(null);
      await fetchFeedback();
    } catch (err) {
      setError(`Error saving feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (feedback) => {
    setFormData({
      studentName: feedback.studentName,
      studentId: feedback.studentId,
      feedbackText: feedback.feedbackText,
      rating: feedback.rating,
      parentId: feedback.parentId || null,
    });
    setEditingId(feedback._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete feedback');

      setSuccess('Feedback deleted successfully!');
      await fetchFeedback();
    } catch (err) {
      setError(`Error deleting feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setFormData({
      studentName: '',
      studentId: '',
      feedbackText: '',
      rating: 5,
      parentId: null,
    });
    setEditingId(null);
  };

  // Load feedback on mount
  React.useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return (
    <div className="teacher-feedback-container">
      <h1>Teacher Feedback Portal</h1>

      {/* Alert Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Feedback Form */}
      <form className="feedback-form" onSubmit={handleSaveFeedback}>
        <h2>{editingId ? 'Edit Feedback' : 'Add New Feedback'}</h2>

        <div className="form-group">
          <label htmlFor="studentName">Student Name *</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            placeholder="Enter student name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentId">Student ID *</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            placeholder="Enter student ID"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="feedbackText">Feedback *</label>
          <textarea
            id="feedbackText"
            name="feedbackText"
            value={formData.feedbackText}
            onChange={handleInputChange}
            placeholder="Enter your feedback here"
            rows="5"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rating">Rating (1-5) *</label>
            <select
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              required
            >
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very Good</option>
              <option value
```


## License: unknown
https://github.com/David-Ade-Creator/dinner-reservation/blob/67a3cb0528984529894e96194728e7499504482c/realstate/src/pages/tabledetail.js

```
## Issue Analysis

**The Problem:**
An empty string `""` is being sent for `parentId` to MongoDB. Mongoose expects ObjectId values to be either:
- A valid 24-character hex string
- A valid MongoDB ObjectId
- `null` or `undefined` (not empty string)

**Why It Happens:**
The frontend is sending `parentId: ""` instead of `parentId: null` or omitting it entirely when there's no parent feedback.

**The Fix:**
Filter out empty `parentId` before sending to the backend, and ensure proper payload validation.

---

## Complete Fixed TeacherFeedback.jsx

````jsx
// filepath: d:\24MX330_Major_project\school-portal\src\pages\TeacherFeedback.jsx
import React, { useState, useCallback } from 'react';
import './TeacherFeedback.css';

const TeacherFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    feedbackText: '',
    rating: 5,
    parentId: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Fetch all feedback
  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback`);
      if (!response.ok) throw new Error('Failed to fetch feedback');
      const data = await response.json();
      setFeedbackList(data);
    } catch (err) {
      setError(`Error fetching feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value,
    }));
  }, []);

  // Validate form data
  const validateForm = () => {
    if (!formData.studentName.trim()) {
      setError('Student name is required');
      return false;
    }
    if (!formData.studentId.trim()) {
      setError('Student ID is required');
      return false;
    }
    if (!formData.feedbackText.trim()) {
      setError('Feedback text is required');
      return false;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      setError('Rating must be between 1 and 5');
      return false;
    }
    return true;
  };

  // Build payload with proper parentId handling
  const buildPayload = () => {
    const payload = {
      studentName: formData.studentName.trim(),
      studentId: formData.studentId.trim(),
      feedbackText: formData.feedbackText.trim(),
      rating: formData.rating,
    };

    // Only include parentId if it's a valid string
    if (formData.parentId && typeof formData.parentId === 'string' && formData.parentId.trim()) {
      payload.parentId = formData.parentId.trim();
    }

    return payload;
  };

  // Save feedback (create or update)
  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = buildPayload();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API_URL}/feedback/${editingId}`
        : `${API_URL}/feedback`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save feedback');
      }

      setSuccess(editingId ? 'Feedback updated successfully!' : 'Feedback saved successfully!');
      setFormData({
        studentName: '',
        studentId: '',
        feedbackText: '',
        rating: 5,
        parentId: null,
      });
      setEditingId(null);
      await fetchFeedback();
    } catch (err) {
      setError(`Error saving feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (feedback) => {
    setFormData({
      studentName: feedback.studentName,
      studentId: feedback.studentId,
      feedbackText: feedback.feedbackText,
      rating: feedback.rating,
      parentId: feedback.parentId || null,
    });
    setEditingId(feedback._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete feedback');

      setSuccess('Feedback deleted successfully!');
      await fetchFeedback();
    } catch (err) {
      setError(`Error deleting feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setFormData({
      studentName: '',
      studentId: '',
      feedbackText: '',
      rating: 5,
      parentId: null,
    });
    setEditingId(null);
  };

  // Load feedback on mount
  React.useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return (
    <div className="teacher-feedback-container">
      <h1>Teacher Feedback Portal</h1>

      {/* Alert Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Feedback Form */}
      <form className="feedback-form" onSubmit={handleSaveFeedback}>
        <h2>{editingId ? 'Edit Feedback' : 'Add New Feedback'}</h2>

        <div className="form-group">
          <label htmlFor="studentName">Student Name *</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            placeholder="Enter student name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentId">Student ID *</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            placeholder="Enter student ID"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="feedbackText">Feedback *</label>
          <textarea
            id="feedbackText"
            name="feedbackText"
            value={formData.feedbackText}
            onChange={handleInputChange}
            placeholder="Enter your feedback here"
            rows="5"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rating">Rating (1-5) *</label>
            <select
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              required
            >
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very Good</option>
              <option value="5">5 - Excellent</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="parentId">Parent
```


## License: unknown
https://github.com/ericholscher/django-rating/blob/937aaed83ab29aee203338ef20494e4432908377/rating/templates/rating/rating_form.html

```
## Issue Analysis

**The Problem:**
An empty string `""` is being sent for `parentId` to MongoDB. Mongoose expects ObjectId values to be either:
- A valid 24-character hex string
- A valid MongoDB ObjectId
- `null` or `undefined` (not empty string)

**Why It Happens:**
The frontend is sending `parentId: ""` instead of `parentId: null` or omitting it entirely when there's no parent feedback.

**The Fix:**
Filter out empty `parentId` before sending to the backend, and ensure proper payload validation.

---

## Complete Fixed TeacherFeedback.jsx

````jsx
// filepath: d:\24MX330_Major_project\school-portal\src\pages\TeacherFeedback.jsx
import React, { useState, useCallback } from 'react';
import './TeacherFeedback.css';

const TeacherFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    feedbackText: '',
    rating: 5,
    parentId: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Fetch all feedback
  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback`);
      if (!response.ok) throw new Error('Failed to fetch feedback');
      const data = await response.json();
      setFeedbackList(data);
    } catch (err) {
      setError(`Error fetching feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value,
    }));
  }, []);

  // Validate form data
  const validateForm = () => {
    if (!formData.studentName.trim()) {
      setError('Student name is required');
      return false;
    }
    if (!formData.studentId.trim()) {
      setError('Student ID is required');
      return false;
    }
    if (!formData.feedbackText.trim()) {
      setError('Feedback text is required');
      return false;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      setError('Rating must be between 1 and 5');
      return false;
    }
    return true;
  };

  // Build payload with proper parentId handling
  const buildPayload = () => {
    const payload = {
      studentName: formData.studentName.trim(),
      studentId: formData.studentId.trim(),
      feedbackText: formData.feedbackText.trim(),
      rating: formData.rating,
    };

    // Only include parentId if it's a valid string
    if (formData.parentId && typeof formData.parentId === 'string' && formData.parentId.trim()) {
      payload.parentId = formData.parentId.trim();
    }

    return payload;
  };

  // Save feedback (create or update)
  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = buildPayload();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API_URL}/feedback/${editingId}`
        : `${API_URL}/feedback`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save feedback');
      }

      setSuccess(editingId ? 'Feedback updated successfully!' : 'Feedback saved successfully!');
      setFormData({
        studentName: '',
        studentId: '',
        feedbackText: '',
        rating: 5,
        parentId: null,
      });
      setEditingId(null);
      await fetchFeedback();
    } catch (err) {
      setError(`Error saving feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (feedback) => {
    setFormData({
      studentName: feedback.studentName,
      studentId: feedback.studentId,
      feedbackText: feedback.feedbackText,
      rating: feedback.rating,
      parentId: feedback.parentId || null,
    });
    setEditingId(feedback._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete feedback');

      setSuccess('Feedback deleted successfully!');
      await fetchFeedback();
    } catch (err) {
      setError(`Error deleting feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setFormData({
      studentName: '',
      studentId: '',
      feedbackText: '',
      rating: 5,
      parentId: null,
    });
    setEditingId(null);
  };

  // Load feedback on mount
  React.useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return (
    <div className="teacher-feedback-container">
      <h1>Teacher Feedback Portal</h1>

      {/* Alert Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Feedback Form */}
      <form className="feedback-form" onSubmit={handleSaveFeedback}>
        <h2>{editingId ? 'Edit Feedback' : 'Add New Feedback'}</h2>

        <div className="form-group">
          <label htmlFor="studentName">Student Name *</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            placeholder="Enter student name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentId">Student ID *</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            placeholder="Enter student ID"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="feedbackText">Feedback *</label>
          <textarea
            id="feedbackText"
            name="feedbackText"
            value={formData.feedbackText}
            onChange={handleInputChange}
            placeholder="Enter your feedback here"
            rows="5"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rating">Rating (1-5) *</label>
            <select
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              required
            >
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very Good</option>
              <option value
```


## License: unknown
https://github.com/David-Ade-Creator/dinner-reservation/blob/67a3cb0528984529894e96194728e7499504482c/realstate/src/pages/tabledetail.js

```
## Issue Analysis

**The Problem:**
An empty string `""` is being sent for `parentId` to MongoDB. Mongoose expects ObjectId values to be either:
- A valid 24-character hex string
- A valid MongoDB ObjectId
- `null` or `undefined` (not empty string)

**Why It Happens:**
The frontend is sending `parentId: ""` instead of `parentId: null` or omitting it entirely when there's no parent feedback.

**The Fix:**
Filter out empty `parentId` before sending to the backend, and ensure proper payload validation.

---

## Complete Fixed TeacherFeedback.jsx

````jsx
// filepath: d:\24MX330_Major_project\school-portal\src\pages\TeacherFeedback.jsx
import React, { useState, useCallback } from 'react';
import './TeacherFeedback.css';

const TeacherFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    feedbackText: '',
    rating: 5,
    parentId: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Fetch all feedback
  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback`);
      if (!response.ok) throw new Error('Failed to fetch feedback');
      const data = await response.json();
      setFeedbackList(data);
    } catch (err) {
      setError(`Error fetching feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value,
    }));
  }, []);

  // Validate form data
  const validateForm = () => {
    if (!formData.studentName.trim()) {
      setError('Student name is required');
      return false;
    }
    if (!formData.studentId.trim()) {
      setError('Student ID is required');
      return false;
    }
    if (!formData.feedbackText.trim()) {
      setError('Feedback text is required');
      return false;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      setError('Rating must be between 1 and 5');
      return false;
    }
    return true;
  };

  // Build payload with proper parentId handling
  const buildPayload = () => {
    const payload = {
      studentName: formData.studentName.trim(),
      studentId: formData.studentId.trim(),
      feedbackText: formData.feedbackText.trim(),
      rating: formData.rating,
    };

    // Only include parentId if it's a valid string
    if (formData.parentId && typeof formData.parentId === 'string' && formData.parentId.trim()) {
      payload.parentId = formData.parentId.trim();
    }

    return payload;
  };

  // Save feedback (create or update)
  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = buildPayload();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API_URL}/feedback/${editingId}`
        : `${API_URL}/feedback`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save feedback');
      }

      setSuccess(editingId ? 'Feedback updated successfully!' : 'Feedback saved successfully!');
      setFormData({
        studentName: '',
        studentId: '',
        feedbackText: '',
        rating: 5,
        parentId: null,
      });
      setEditingId(null);
      await fetchFeedback();
    } catch (err) {
      setError(`Error saving feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (feedback) => {
    setFormData({
      studentName: feedback.studentName,
      studentId: feedback.studentId,
      feedbackText: feedback.feedbackText,
      rating: feedback.rating,
      parentId: feedback.parentId || null,
    });
    setEditingId(feedback._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete feedback');

      setSuccess('Feedback deleted successfully!');
      await fetchFeedback();
    } catch (err) {
      setError(`Error deleting feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setFormData({
      studentName: '',
      studentId: '',
      feedbackText: '',
      rating: 5,
      parentId: null,
    });
    setEditingId(null);
  };

  // Load feedback on mount
  React.useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return (
    <div className="teacher-feedback-container">
      <h1>Teacher Feedback Portal</h1>

      {/* Alert Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Feedback Form */}
      <form className="feedback-form" onSubmit={handleSaveFeedback}>
        <h2>{editingId ? 'Edit Feedback' : 'Add New Feedback'}</h2>

        <div className="form-group">
          <label htmlFor="studentName">Student Name *</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            placeholder="Enter student name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentId">Student ID *</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            placeholder="Enter student ID"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="feedbackText">Feedback *</label>
          <textarea
            id="feedbackText"
            name="feedbackText"
            value={formData.feedbackText}
            onChange={handleInputChange}
            placeholder="Enter your feedback here"
            rows="5"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rating">Rating (1-5) *</label>
            <select
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              required
            >
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very Good</option>
              <option value="5">5 - Excellent</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="parentId">Parent
```


## License: unknown
https://github.com/ericholscher/django-rating/blob/937aaed83ab29aee203338ef20494e4432908377/rating/templates/rating/rating_form.html

```
## Issue Analysis

**The Problem:**
An empty string `""` is being sent for `parentId` to MongoDB. Mongoose expects ObjectId values to be either:
- A valid 24-character hex string
- A valid MongoDB ObjectId
- `null` or `undefined` (not empty string)

**Why It Happens:**
The frontend is sending `parentId: ""` instead of `parentId: null` or omitting it entirely when there's no parent feedback.

**The Fix:**
Filter out empty `parentId` before sending to the backend, and ensure proper payload validation.

---

## Complete Fixed TeacherFeedback.jsx

````jsx
// filepath: d:\24MX330_Major_project\school-portal\src\pages\TeacherFeedback.jsx
import React, { useState, useCallback } from 'react';
import './TeacherFeedback.css';

const TeacherFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    feedbackText: '',
    rating: 5,
    parentId: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Fetch all feedback
  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback`);
      if (!response.ok) throw new Error('Failed to fetch feedback');
      const data = await response.json();
      setFeedbackList(data);
    } catch (err) {
      setError(`Error fetching feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value,
    }));
  }, []);

  // Validate form data
  const validateForm = () => {
    if (!formData.studentName.trim()) {
      setError('Student name is required');
      return false;
    }
    if (!formData.studentId.trim()) {
      setError('Student ID is required');
      return false;
    }
    if (!formData.feedbackText.trim()) {
      setError('Feedback text is required');
      return false;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      setError('Rating must be between 1 and 5');
      return false;
    }
    return true;
  };

  // Build payload with proper parentId handling
  const buildPayload = () => {
    const payload = {
      studentName: formData.studentName.trim(),
      studentId: formData.studentId.trim(),
      feedbackText: formData.feedbackText.trim(),
      rating: formData.rating,
    };

    // Only include parentId if it's a valid string
    if (formData.parentId && typeof formData.parentId === 'string' && formData.parentId.trim()) {
      payload.parentId = formData.parentId.trim();
    }

    return payload;
  };

  // Save feedback (create or update)
  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = buildPayload();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API_URL}/feedback/${editingId}`
        : `${API_URL}/feedback`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save feedback');
      }

      setSuccess(editingId ? 'Feedback updated successfully!' : 'Feedback saved successfully!');
      setFormData({
        studentName: '',
        studentId: '',
        feedbackText: '',
        rating: 5,
        parentId: null,
      });
      setEditingId(null);
      await fetchFeedback();
    } catch (err) {
      setError(`Error saving feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (feedback) => {
    setFormData({
      studentName: feedback.studentName,
      studentId: feedback.studentId,
      feedbackText: feedback.feedbackText,
      rating: feedback.rating,
      parentId: feedback.parentId || null,
    });
    setEditingId(feedback._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete feedback');

      setSuccess('Feedback deleted successfully!');
      await fetchFeedback();
    } catch (err) {
      setError(`Error deleting feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setFormData({
      studentName: '',
      studentId: '',
      feedbackText: '',
      rating: 5,
      parentId: null,
    });
    setEditingId(null);
  };

  // Load feedback on mount
  React.useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return (
    <div className="teacher-feedback-container">
      <h1>Teacher Feedback Portal</h1>

      {/* Alert Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Feedback Form */}
      <form className="feedback-form" onSubmit={handleSaveFeedback}>
        <h2>{editingId ? 'Edit Feedback' : 'Add New Feedback'}</h2>

        <div className="form-group">
          <label htmlFor="studentName">Student Name *</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            placeholder="Enter student name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentId">Student ID *</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            placeholder="Enter student ID"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="feedbackText">Feedback *</label>
          <textarea
            id="feedbackText"
            name="feedbackText"
            value={formData.feedbackText}
            onChange={handleInputChange}
            placeholder="Enter your feedback here"
            rows="5"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rating">Rating (1-5) *</label>
            <select
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              required
            >
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very Good</option>
              <option value
```


## License: unknown
https://github.com/David-Ade-Creator/dinner-reservation/blob/67a3cb0528984529894e96194728e7499504482c/realstate/src/pages/tabledetail.js

```
## Issue Analysis

**The Problem:**
An empty string `""` is being sent for `parentId` to MongoDB. Mongoose expects ObjectId values to be either:
- A valid 24-character hex string
- A valid MongoDB ObjectId
- `null` or `undefined` (not empty string)

**Why It Happens:**
The frontend is sending `parentId: ""` instead of `parentId: null` or omitting it entirely when there's no parent feedback.

**The Fix:**
Filter out empty `parentId` before sending to the backend, and ensure proper payload validation.

---

## Complete Fixed TeacherFeedback.jsx

````jsx
// filepath: d:\24MX330_Major_project\school-portal\src\pages\TeacherFeedback.jsx
import React, { useState, useCallback } from 'react';
import './TeacherFeedback.css';

const TeacherFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    feedbackText: '',
    rating: 5,
    parentId: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Fetch all feedback
  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback`);
      if (!response.ok) throw new Error('Failed to fetch feedback');
      const data = await response.json();
      setFeedbackList(data);
    } catch (err) {
      setError(`Error fetching feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value,
    }));
  }, []);

  // Validate form data
  const validateForm = () => {
    if (!formData.studentName.trim()) {
      setError('Student name is required');
      return false;
    }
    if (!formData.studentId.trim()) {
      setError('Student ID is required');
      return false;
    }
    if (!formData.feedbackText.trim()) {
      setError('Feedback text is required');
      return false;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      setError('Rating must be between 1 and 5');
      return false;
    }
    return true;
  };

  // Build payload with proper parentId handling
  const buildPayload = () => {
    const payload = {
      studentName: formData.studentName.trim(),
      studentId: formData.studentId.trim(),
      feedbackText: formData.feedbackText.trim(),
      rating: formData.rating,
    };

    // Only include parentId if it's a valid string
    if (formData.parentId && typeof formData.parentId === 'string' && formData.parentId.trim()) {
      payload.parentId = formData.parentId.trim();
    }

    return payload;
  };

  // Save feedback (create or update)
  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = buildPayload();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API_URL}/feedback/${editingId}`
        : `${API_URL}/feedback`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save feedback');
      }

      setSuccess(editingId ? 'Feedback updated successfully!' : 'Feedback saved successfully!');
      setFormData({
        studentName: '',
        studentId: '',
        feedbackText: '',
        rating: 5,
        parentId: null,
      });
      setEditingId(null);
      await fetchFeedback();
    } catch (err) {
      setError(`Error saving feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (feedback) => {
    setFormData({
      studentName: feedback.studentName,
      studentId: feedback.studentId,
      feedbackText: feedback.feedbackText,
      rating: feedback.rating,
      parentId: feedback.parentId || null,
    });
    setEditingId(feedback._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete feedback');

      setSuccess('Feedback deleted successfully!');
      await fetchFeedback();
    } catch (err) {
      setError(`Error deleting feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setFormData({
      studentName: '',
      studentId: '',
      feedbackText: '',
      rating: 5,
      parentId: null,
    });
    setEditingId(null);
  };

  // Load feedback on mount
  React.useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return (
    <div className="teacher-feedback-container">
      <h1>Teacher Feedback Portal</h1>

      {/* Alert Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Feedback Form */}
      <form className="feedback-form" onSubmit={handleSaveFeedback}>
        <h2>{editingId ? 'Edit Feedback' : 'Add New Feedback'}</h2>

        <div className="form-group">
          <label htmlFor="studentName">Student Name *</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            placeholder="Enter student name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentId">Student ID *</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            placeholder="Enter student ID"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="feedbackText">Feedback *</label>
          <textarea
            id="feedbackText"
            name="feedbackText"
            value={formData.feedbackText}
            onChange={handleInputChange}
            placeholder="Enter your feedback here"
            rows="5"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rating">Rating (1-5) *</label>
            <select
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              required
            >
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very Good</option>
              <option value="5">5 - Excellent</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="parentId">Parent
```


## License: unknown
https://github.com/ericholscher/django-rating/blob/937aaed83ab29aee203338ef20494e4432908377/rating/templates/rating/rating_form.html

```
## Issue Analysis

**The Problem:**
An empty string `""` is being sent for `parentId` to MongoDB. Mongoose expects ObjectId values to be either:
- A valid 24-character hex string
- A valid MongoDB ObjectId
- `null` or `undefined` (not empty string)

**Why It Happens:**
The frontend is sending `parentId: ""` instead of `parentId: null` or omitting it entirely when there's no parent feedback.

**The Fix:**
Filter out empty `parentId` before sending to the backend, and ensure proper payload validation.

---

## Complete Fixed TeacherFeedback.jsx

````jsx
// filepath: d:\24MX330_Major_project\school-portal\src\pages\TeacherFeedback.jsx
import React, { useState, useCallback } from 'react';
import './TeacherFeedback.css';

const TeacherFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    feedbackText: '',
    rating: 5,
    parentId: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Fetch all feedback
  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback`);
      if (!response.ok) throw new Error('Failed to fetch feedback');
      const data = await response.json();
      setFeedbackList(data);
    } catch (err) {
      setError(`Error fetching feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value,
    }));
  }, []);

  // Validate form data
  const validateForm = () => {
    if (!formData.studentName.trim()) {
      setError('Student name is required');
      return false;
    }
    if (!formData.studentId.trim()) {
      setError('Student ID is required');
      return false;
    }
    if (!formData.feedbackText.trim()) {
      setError('Feedback text is required');
      return false;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      setError('Rating must be between 1 and 5');
      return false;
    }
    return true;
  };

  // Build payload with proper parentId handling
  const buildPayload = () => {
    const payload = {
      studentName: formData.studentName.trim(),
      studentId: formData.studentId.trim(),
      feedbackText: formData.feedbackText.trim(),
      rating: formData.rating,
    };

    // Only include parentId if it's a valid string
    if (formData.parentId && typeof formData.parentId === 'string' && formData.parentId.trim()) {
      payload.parentId = formData.parentId.trim();
    }

    return payload;
  };

  // Save feedback (create or update)
  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = buildPayload();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API_URL}/feedback/${editingId}`
        : `${API_URL}/feedback`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save feedback');
      }

      setSuccess(editingId ? 'Feedback updated successfully!' : 'Feedback saved successfully!');
      setFormData({
        studentName: '',
        studentId: '',
        feedbackText: '',
        rating: 5,
        parentId: null,
      });
      setEditingId(null);
      await fetchFeedback();
    } catch (err) {
      setError(`Error saving feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (feedback) => {
    setFormData({
      studentName: feedback.studentName,
      studentId: feedback.studentId,
      feedbackText: feedback.feedbackText,
      rating: feedback.rating,
      parentId: feedback.parentId || null,
    });
    setEditingId(feedback._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete feedback');

      setSuccess('Feedback deleted successfully!');
      await fetchFeedback();
    } catch (err) {
      setError(`Error deleting feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setFormData({
      studentName: '',
      studentId: '',
      feedbackText: '',
      rating: 5,
      parentId: null,
    });
    setEditingId(null);
  };

  // Load feedback on mount
  React.useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return (
    <div className="teacher-feedback-container">
      <h1>Teacher Feedback Portal</h1>

      {/* Alert Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Feedback Form */}
      <form className="feedback-form" onSubmit={handleSaveFeedback}>
        <h2>{editingId ? 'Edit Feedback' : 'Add New Feedback'}</h2>

        <div className="form-group">
          <label htmlFor="studentName">Student Name *</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            placeholder="Enter student name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentId">Student ID *</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            placeholder="Enter student ID"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="feedbackText">Feedback *</label>
          <textarea
            id="feedbackText"
            name="feedbackText"
            value={formData.feedbackText}
            onChange={handleInputChange}
            placeholder="Enter your feedback here"
            rows="5"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rating">Rating (1-5) *</label>
            <select
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              required
            >
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very Good</option>
              <option value
```


## License: unknown
https://github.com/David-Ade-Creator/dinner-reservation/blob/67a3cb0528984529894e96194728e7499504482c/realstate/src/pages/tabledetail.js

```
## Issue Analysis

**The Problem:**
An empty string `""` is being sent for `parentId` to MongoDB. Mongoose expects ObjectId values to be either:
- A valid 24-character hex string
- A valid MongoDB ObjectId
- `null` or `undefined` (not empty string)

**Why It Happens:**
The frontend is sending `parentId: ""` instead of `parentId: null` or omitting it entirely when there's no parent feedback.

**The Fix:**
Filter out empty `parentId` before sending to the backend, and ensure proper payload validation.

---

## Complete Fixed TeacherFeedback.jsx

````jsx
// filepath: d:\24MX330_Major_project\school-portal\src\pages\TeacherFeedback.jsx
import React, { useState, useCallback } from 'react';
import './TeacherFeedback.css';

const TeacherFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    feedbackText: '',
    rating: 5,
    parentId: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Fetch all feedback
  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback`);
      if (!response.ok) throw new Error('Failed to fetch feedback');
      const data = await response.json();
      setFeedbackList(data);
    } catch (err) {
      setError(`Error fetching feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value,
    }));
  }, []);

  // Validate form data
  const validateForm = () => {
    if (!formData.studentName.trim()) {
      setError('Student name is required');
      return false;
    }
    if (!formData.studentId.trim()) {
      setError('Student ID is required');
      return false;
    }
    if (!formData.feedbackText.trim()) {
      setError('Feedback text is required');
      return false;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      setError('Rating must be between 1 and 5');
      return false;
    }
    return true;
  };

  // Build payload with proper parentId handling
  const buildPayload = () => {
    const payload = {
      studentName: formData.studentName.trim(),
      studentId: formData.studentId.trim(),
      feedbackText: formData.feedbackText.trim(),
      rating: formData.rating,
    };

    // Only include parentId if it's a valid string
    if (formData.parentId && typeof formData.parentId === 'string' && formData.parentId.trim()) {
      payload.parentId = formData.parentId.trim();
    }

    return payload;
  };

  // Save feedback (create or update)
  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = buildPayload();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API_URL}/feedback/${editingId}`
        : `${API_URL}/feedback`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save feedback');
      }

      setSuccess(editingId ? 'Feedback updated successfully!' : 'Feedback saved successfully!');
      setFormData({
        studentName: '',
        studentId: '',
        feedbackText: '',
        rating: 5,
        parentId: null,
      });
      setEditingId(null);
      await fetchFeedback();
    } catch (err) {
      setError(`Error saving feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (feedback) => {
    setFormData({
      studentName: feedback.studentName,
      studentId: feedback.studentId,
      feedbackText: feedback.feedbackText,
      rating: feedback.rating,
      parentId: feedback.parentId || null,
    });
    setEditingId(feedback._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete feedback');

      setSuccess('Feedback deleted successfully!');
      await fetchFeedback();
    } catch (err) {
      setError(`Error deleting feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setFormData({
      studentName: '',
      studentId: '',
      feedbackText: '',
      rating: 5,
      parentId: null,
    });
    setEditingId(null);
  };

  // Load feedback on mount
  React.useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return (
    <div className="teacher-feedback-container">
      <h1>Teacher Feedback Portal</h1>

      {/* Alert Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Feedback Form */}
      <form className="feedback-form" onSubmit={handleSaveFeedback}>
        <h2>{editingId ? 'Edit Feedback' : 'Add New Feedback'}</h2>

        <div className="form-group">
          <label htmlFor="studentName">Student Name *</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            placeholder="Enter student name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentId">Student ID *</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            placeholder="Enter student ID"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="feedbackText">Feedback *</label>
          <textarea
            id="feedbackText"
            name="feedbackText"
            value={formData.feedbackText}
            onChange={handleInputChange}
            placeholder="Enter your feedback here"
            rows="5"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rating">Rating (1-5) *</label>
            <select
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              required
            >
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very Good</option>
              <option value="5">5 - Excellent</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="parentId">Parent
```


## License: unknown
https://github.com/ericholscher/django-rating/blob/937aaed83ab29aee203338ef20494e4432908377/rating/templates/rating/rating_form.html

```
## Issue Analysis

**The Problem:**
An empty string `""` is being sent for `parentId` to MongoDB. Mongoose expects ObjectId values to be either:
- A valid 24-character hex string
- A valid MongoDB ObjectId
- `null` or `undefined` (not empty string)

**Why It Happens:**
The frontend is sending `parentId: ""` instead of `parentId: null` or omitting it entirely when there's no parent feedback.

**The Fix:**
Filter out empty `parentId` before sending to the backend, and ensure proper payload validation.

---

## Complete Fixed TeacherFeedback.jsx

````jsx
// filepath: d:\24MX330_Major_project\school-portal\src\pages\TeacherFeedback.jsx
import React, { useState, useCallback } from 'react';
import './TeacherFeedback.css';

const TeacherFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    feedbackText: '',
    rating: 5,
    parentId: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Fetch all feedback
  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback`);
      if (!response.ok) throw new Error('Failed to fetch feedback');
      const data = await response.json();
      setFeedbackList(data);
    } catch (err) {
      setError(`Error fetching feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value,
    }));
  }, []);

  // Validate form data
  const validateForm = () => {
    if (!formData.studentName.trim()) {
      setError('Student name is required');
      return false;
    }
    if (!formData.studentId.trim()) {
      setError('Student ID is required');
      return false;
    }
    if (!formData.feedbackText.trim()) {
      setError('Feedback text is required');
      return false;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      setError('Rating must be between 1 and 5');
      return false;
    }
    return true;
  };

  // Build payload with proper parentId handling
  const buildPayload = () => {
    const payload = {
      studentName: formData.studentName.trim(),
      studentId: formData.studentId.trim(),
      feedbackText: formData.feedbackText.trim(),
      rating: formData.rating,
    };

    // Only include parentId if it's a valid string
    if (formData.parentId && typeof formData.parentId === 'string' && formData.parentId.trim()) {
      payload.parentId = formData.parentId.trim();
    }

    return payload;
  };

  // Save feedback (create or update)
  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = buildPayload();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API_URL}/feedback/${editingId}`
        : `${API_URL}/feedback`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save feedback');
      }

      setSuccess(editingId ? 'Feedback updated successfully!' : 'Feedback saved successfully!');
      setFormData({
        studentName: '',
        studentId: '',
        feedbackText: '',
        rating: 5,
        parentId: null,
      });
      setEditingId(null);
      await fetchFeedback();
    } catch (err) {
      setError(`Error saving feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (feedback) => {
    setFormData({
      studentName: feedback.studentName,
      studentId: feedback.studentId,
      feedbackText: feedback.feedbackText,
      rating: feedback.rating,
      parentId: feedback.parentId || null,
    });
    setEditingId(feedback._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete feedback');

      setSuccess('Feedback deleted successfully!');
      await fetchFeedback();
    } catch (err) {
      setError(`Error deleting feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setFormData({
      studentName: '',
      studentId: '',
      feedbackText: '',
      rating: 5,
      parentId: null,
    });
    setEditingId(null);
  };

  // Load feedback on mount
  React.useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return (
    <div className="teacher-feedback-container">
      <h1>Teacher Feedback Portal</h1>

      {/* Alert Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Feedback Form */}
      <form className="feedback-form" onSubmit={handleSaveFeedback}>
        <h2>{editingId ? 'Edit Feedback' : 'Add New Feedback'}</h2>

        <div className="form-group">
          <label htmlFor="studentName">Student Name *</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            placeholder="Enter student name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentId">Student ID *</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            placeholder="Enter student ID"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="feedbackText">Feedback *</label>
          <textarea
            id="feedbackText"
            name="feedbackText"
            value={formData.feedbackText}
            onChange={handleInputChange}
            placeholder="Enter your feedback here"
            rows="5"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rating">Rating (1-5) *</label>
            <select
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              required
            >
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very Good</option>
              <option value="5">5 - Excellent</option>
            </select>
```


## License: unknown
https://github.com/David-Ade-Creator/dinner-reservation/blob/67a3cb0528984529894e96194728e7499504482c/realstate/src/pages/tabledetail.js

```
## Issue Analysis

**The Problem:**
An empty string `""` is being sent for `parentId` to MongoDB. Mongoose expects ObjectId values to be either:
- A valid 24-character hex string
- A valid MongoDB ObjectId
- `null` or `undefined` (not empty string)

**Why It Happens:**
The frontend is sending `parentId: ""` instead of `parentId: null` or omitting it entirely when there's no parent feedback.

**The Fix:**
Filter out empty `parentId` before sending to the backend, and ensure proper payload validation.

---

## Complete Fixed TeacherFeedback.jsx

````jsx
// filepath: d:\24MX330_Major_project\school-portal\src\pages\TeacherFeedback.jsx
import React, { useState, useCallback } from 'react';
import './TeacherFeedback.css';

const TeacherFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    feedbackText: '',
    rating: 5,
    parentId: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Fetch all feedback
  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback`);
      if (!response.ok) throw new Error('Failed to fetch feedback');
      const data = await response.json();
      setFeedbackList(data);
    } catch (err) {
      setError(`Error fetching feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value,
    }));
  }, []);

  // Validate form data
  const validateForm = () => {
    if (!formData.studentName.trim()) {
      setError('Student name is required');
      return false;
    }
    if (!formData.studentId.trim()) {
      setError('Student ID is required');
      return false;
    }
    if (!formData.feedbackText.trim()) {
      setError('Feedback text is required');
      return false;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      setError('Rating must be between 1 and 5');
      return false;
    }
    return true;
  };

  // Build payload with proper parentId handling
  const buildPayload = () => {
    const payload = {
      studentName: formData.studentName.trim(),
      studentId: formData.studentId.trim(),
      feedbackText: formData.feedbackText.trim(),
      rating: formData.rating,
    };

    // Only include parentId if it's a valid string
    if (formData.parentId && typeof formData.parentId === 'string' && formData.parentId.trim()) {
      payload.parentId = formData.parentId.trim();
    }

    return payload;
  };

  // Save feedback (create or update)
  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = buildPayload();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API_URL}/feedback/${editingId}`
        : `${API_URL}/feedback`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save feedback');
      }

      setSuccess(editingId ? 'Feedback updated successfully!' : 'Feedback saved successfully!');
      setFormData({
        studentName: '',
        studentId: '',
        feedbackText: '',
        rating: 5,
        parentId: null,
      });
      setEditingId(null);
      await fetchFeedback();
    } catch (err) {
      setError(`Error saving feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (feedback) => {
    setFormData({
      studentName: feedback.studentName,
      studentId: feedback.studentId,
      feedbackText: feedback.feedbackText,
      rating: feedback.rating,
      parentId: feedback.parentId || null,
    });
    setEditingId(feedback._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete feedback');

      setSuccess('Feedback deleted successfully!');
      await fetchFeedback();
    } catch (err) {
      setError(`Error deleting feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setFormData({
      studentName: '',
      studentId: '',
      feedbackText: '',
      rating: 5,
      parentId: null,
    });
    setEditingId(null);
  };

  // Load feedback on mount
  React.useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return (
    <div className="teacher-feedback-container">
      <h1>Teacher Feedback Portal</h1>

      {/* Alert Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Feedback Form */}
      <form className="feedback-form" onSubmit={handleSaveFeedback}>
        <h2>{editingId ? 'Edit Feedback' : 'Add New Feedback'}</h2>

        <div className="form-group">
          <label htmlFor="studentName">Student Name *</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            placeholder="Enter student name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentId">Student ID *</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            placeholder="Enter student ID"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="feedbackText">Feedback *</label>
          <textarea
            id="feedbackText"
            name="feedbackText"
            value={formData.feedbackText}
            onChange={handleInputChange}
            placeholder="Enter your feedback here"
            rows="5"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rating">Rating (1-5) *</label>
            <select
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              required
            >
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very Good</option>
              <option value="5">5 - Excellent</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="parentId">Parent
```


## License: unknown
https://github.com/ericholscher/django-rating/blob/937aaed83ab29aee203338ef20494e4432908377/rating/templates/rating/rating_form.html

```
## Issue Analysis

**The Problem:**
An empty string `""` is being sent for `parentId` to MongoDB. Mongoose expects ObjectId values to be either:
- A valid 24-character hex string
- A valid MongoDB ObjectId
- `null` or `undefined` (not empty string)

**Why It Happens:**
The frontend is sending `parentId: ""` instead of `parentId: null` or omitting it entirely when there's no parent feedback.

**The Fix:**
Filter out empty `parentId` before sending to the backend, and ensure proper payload validation.

---

## Complete Fixed TeacherFeedback.jsx

````jsx
// filepath: d:\24MX330_Major_project\school-portal\src\pages\TeacherFeedback.jsx
import React, { useState, useCallback } from 'react';
import './TeacherFeedback.css';

const TeacherFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    feedbackText: '',
    rating: 5,
    parentId: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Fetch all feedback
  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback`);
      if (!response.ok) throw new Error('Failed to fetch feedback');
      const data = await response.json();
      setFeedbackList(data);
    } catch (err) {
      setError(`Error fetching feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value,
    }));
  }, []);

  // Validate form data
  const validateForm = () => {
    if (!formData.studentName.trim()) {
      setError('Student name is required');
      return false;
    }
    if (!formData.studentId.trim()) {
      setError('Student ID is required');
      return false;
    }
    if (!formData.feedbackText.trim()) {
      setError('Feedback text is required');
      return false;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      setError('Rating must be between 1 and 5');
      return false;
    }
    return true;
  };

  // Build payload with proper parentId handling
  const buildPayload = () => {
    const payload = {
      studentName: formData.studentName.trim(),
      studentId: formData.studentId.trim(),
      feedbackText: formData.feedbackText.trim(),
      rating: formData.rating,
    };

    // Only include parentId if it's a valid string
    if (formData.parentId && typeof formData.parentId === 'string' && formData.parentId.trim()) {
      payload.parentId = formData.parentId.trim();
    }

    return payload;
  };

  // Save feedback (create or update)
  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = buildPayload();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API_URL}/feedback/${editingId}`
        : `${API_URL}/feedback`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save feedback');
      }

      setSuccess(editingId ? 'Feedback updated successfully!' : 'Feedback saved successfully!');
      setFormData({
        studentName: '',
        studentId: '',
        feedbackText: '',
        rating: 5,
        parentId: null,
      });
      setEditingId(null);
      await fetchFeedback();
    } catch (err) {
      setError(`Error saving feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (feedback) => {
    setFormData({
      studentName: feedback.studentName,
      studentId: feedback.studentId,
      feedbackText: feedback.feedbackText,
      rating: feedback.rating,
      parentId: feedback.parentId || null,
    });
    setEditingId(feedback._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete feedback');

      setSuccess('Feedback deleted successfully!');
      await fetchFeedback();
    } catch (err) {
      setError(`Error deleting feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setFormData({
      studentName: '',
      studentId: '',
      feedbackText: '',
      rating: 5,
      parentId: null,
    });
    setEditingId(null);
  };

  // Load feedback on mount
  React.useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return (
    <div className="teacher-feedback-container">
      <h1>Teacher Feedback Portal</h1>

      {/* Alert Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Feedback Form */}
      <form className="feedback-form" onSubmit={handleSaveFeedback}>
        <h2>{editingId ? 'Edit Feedback' : 'Add New Feedback'}</h2>

        <div className="form-group">
          <label htmlFor="studentName">Student Name *</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            placeholder="Enter student name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentId">Student ID *</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            placeholder="Enter student ID"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="feedbackText">Feedback *</label>
          <textarea
            id="feedbackText"
            name="feedbackText"
            value={formData.feedbackText}
            onChange={handleInputChange}
            placeholder="Enter your feedback here"
            rows="5"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rating">Rating (1-5) *</label>
            <select
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              required
            >
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very Good</option>
              <option value="5">5 - Excellent</option>
            </select>
          </div>

          
```


## License: unknown
https://github.com/David-Ade-Creator/dinner-reservation/blob/67a3cb0528984529894e96194728e7499504482c/realstate/src/pages/tabledetail.js

```
## Issue Analysis

**The Problem:**
An empty string `""` is being sent for `parentId` to MongoDB. Mongoose expects ObjectId values to be either:
- A valid 24-character hex string
- A valid MongoDB ObjectId
- `null` or `undefined` (not empty string)

**Why It Happens:**
The frontend is sending `parentId: ""` instead of `parentId: null` or omitting it entirely when there's no parent feedback.

**The Fix:**
Filter out empty `parentId` before sending to the backend, and ensure proper payload validation.

---

## Complete Fixed TeacherFeedback.jsx

````jsx
// filepath: d:\24MX330_Major_project\school-portal\src\pages\TeacherFeedback.jsx
import React, { useState, useCallback } from 'react';
import './TeacherFeedback.css';

const TeacherFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    feedbackText: '',
    rating: 5,
    parentId: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Fetch all feedback
  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback`);
      if (!response.ok) throw new Error('Failed to fetch feedback');
      const data = await response.json();
      setFeedbackList(data);
    } catch (err) {
      setError(`Error fetching feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value,
    }));
  }, []);

  // Validate form data
  const validateForm = () => {
    if (!formData.studentName.trim()) {
      setError('Student name is required');
      return false;
    }
    if (!formData.studentId.trim()) {
      setError('Student ID is required');
      return false;
    }
    if (!formData.feedbackText.trim()) {
      setError('Feedback text is required');
      return false;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      setError('Rating must be between 1 and 5');
      return false;
    }
    return true;
  };

  // Build payload with proper parentId handling
  const buildPayload = () => {
    const payload = {
      studentName: formData.studentName.trim(),
      studentId: formData.studentId.trim(),
      feedbackText: formData.feedbackText.trim(),
      rating: formData.rating,
    };

    // Only include parentId if it's a valid string
    if (formData.parentId && typeof formData.parentId === 'string' && formData.parentId.trim()) {
      payload.parentId = formData.parentId.trim();
    }

    return payload;
  };

  // Save feedback (create or update)
  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = buildPayload();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API_URL}/feedback/${editingId}`
        : `${API_URL}/feedback`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save feedback');
      }

      setSuccess(editingId ? 'Feedback updated successfully!' : 'Feedback saved successfully!');
      setFormData({
        studentName: '',
        studentId: '',
        feedbackText: '',
        rating: 5,
        parentId: null,
      });
      setEditingId(null);
      await fetchFeedback();
    } catch (err) {
      setError(`Error saving feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (feedback) => {
    setFormData({
      studentName: feedback.studentName,
      studentId: feedback.studentId,
      feedbackText: feedback.feedbackText,
      rating: feedback.rating,
      parentId: feedback.parentId || null,
    });
    setEditingId(feedback._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete feedback');

      setSuccess('Feedback deleted successfully!');
      await fetchFeedback();
    } catch (err) {
      setError(`Error deleting feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setFormData({
      studentName: '',
      studentId: '',
      feedbackText: '',
      rating: 5,
      parentId: null,
    });
    setEditingId(null);
  };

  // Load feedback on mount
  React.useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return (
    <div className="teacher-feedback-container">
      <h1>Teacher Feedback Portal</h1>

      {/* Alert Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Feedback Form */}
      <form className="feedback-form" onSubmit={handleSaveFeedback}>
        <h2>{editingId ? 'Edit Feedback' : 'Add New Feedback'}</h2>

        <div className="form-group">
          <label htmlFor="studentName">Student Name *</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            placeholder="Enter student name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentId">Student ID *</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            placeholder="Enter student ID"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="feedbackText">Feedback *</label>
          <textarea
            id="feedbackText"
            name="feedbackText"
            value={formData.feedbackText}
            onChange={handleInputChange}
            placeholder="Enter your feedback here"
            rows="5"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rating">Rating (1-5) *</label>
            <select
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              required
            >
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very Good</option>
              <option value="5">5 - Excellent</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="parentId">Parent
```


## License: unknown
https://github.com/ericholscher/django-rating/blob/937aaed83ab29aee203338ef20494e4432908377/rating/templates/rating/rating_form.html

```
## Issue Analysis

**The Problem:**
An empty string `""` is being sent for `parentId` to MongoDB. Mongoose expects ObjectId values to be either:
- A valid 24-character hex string
- A valid MongoDB ObjectId
- `null` or `undefined` (not empty string)

**Why It Happens:**
The frontend is sending `parentId: ""` instead of `parentId: null` or omitting it entirely when there's no parent feedback.

**The Fix:**
Filter out empty `parentId` before sending to the backend, and ensure proper payload validation.

---

## Complete Fixed TeacherFeedback.jsx

````jsx
// filepath: d:\24MX330_Major_project\school-portal\src\pages\TeacherFeedback.jsx
import React, { useState, useCallback } from 'react';
import './TeacherFeedback.css';

const TeacherFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    feedbackText: '',
    rating: 5,
    parentId: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Fetch all feedback
  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback`);
      if (!response.ok) throw new Error('Failed to fetch feedback');
      const data = await response.json();
      setFeedbackList(data);
    } catch (err) {
      setError(`Error fetching feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value,
    }));
  }, []);

  // Validate form data
  const validateForm = () => {
    if (!formData.studentName.trim()) {
      setError('Student name is required');
      return false;
    }
    if (!formData.studentId.trim()) {
      setError('Student ID is required');
      return false;
    }
    if (!formData.feedbackText.trim()) {
      setError('Feedback text is required');
      return false;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      setError('Rating must be between 1 and 5');
      return false;
    }
    return true;
  };

  // Build payload with proper parentId handling
  const buildPayload = () => {
    const payload = {
      studentName: formData.studentName.trim(),
      studentId: formData.studentId.trim(),
      feedbackText: formData.feedbackText.trim(),
      rating: formData.rating,
    };

    // Only include parentId if it's a valid string
    if (formData.parentId && typeof formData.parentId === 'string' && formData.parentId.trim()) {
      payload.parentId = formData.parentId.trim();
    }

    return payload;
  };

  // Save feedback (create or update)
  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = buildPayload();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API_URL}/feedback/${editingId}`
        : `${API_URL}/feedback`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save feedback');
      }

      setSuccess(editingId ? 'Feedback updated successfully!' : 'Feedback saved successfully!');
      setFormData({
        studentName: '',
        studentId: '',
        feedbackText: '',
        rating: 5,
        parentId: null,
      });
      setEditingId(null);
      await fetchFeedback();
    } catch (err) {
      setError(`Error saving feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (feedback) => {
    setFormData({
      studentName: feedback.studentName,
      studentId: feedback.studentId,
      feedbackText: feedback.feedbackText,
      rating: feedback.rating,
      parentId: feedback.parentId || null,
    });
    setEditingId(feedback._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete feedback');

      setSuccess('Feedback deleted successfully!');
      await fetchFeedback();
    } catch (err) {
      setError(`Error deleting feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setFormData({
      studentName: '',
      studentId: '',
      feedbackText: '',
      rating: 5,
      parentId: null,
    });
    setEditingId(null);
  };

  // Load feedback on mount
  React.useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return (
    <div className="teacher-feedback-container">
      <h1>Teacher Feedback Portal</h1>

      {/* Alert Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Feedback Form */}
      <form className="feedback-form" onSubmit={handleSaveFeedback}>
        <h2>{editingId ? 'Edit Feedback' : 'Add New Feedback'}</h2>

        <div className="form-group">
          <label htmlFor="studentName">Student Name *</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            placeholder="Enter student name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentId">Student ID *</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            placeholder="Enter student ID"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="feedbackText">Feedback *</label>
          <textarea
            id="feedbackText"
            name="feedbackText"
            value={formData.feedbackText}
            onChange={handleInputChange}
            placeholder="Enter your feedback here"
            rows="5"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rating">Rating (1-5) *</label>
            <select
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              required
            >
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very Good</option>
              <option value="5">5 - Excellent</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="parentId">Parent
```


## License: unknown
https://github.com/David-Ade-Creator/dinner-reservation/blob/67a3cb0528984529894e96194728e7499504482c/realstate/src/pages/tabledetail.js

```
## Issue Analysis

**The Problem:**
An empty string `""` is being sent for `parentId` to MongoDB. Mongoose expects ObjectId values to be either:
- A valid 24-character hex string
- A valid MongoDB ObjectId
- `null` or `undefined` (not empty string)

**Why It Happens:**
The frontend is sending `parentId: ""` instead of `parentId: null` or omitting it entirely when there's no parent feedback.

**The Fix:**
Filter out empty `parentId` before sending to the backend, and ensure proper payload validation.

---

## Complete Fixed TeacherFeedback.jsx

````jsx
// filepath: d:\24MX330_Major_project\school-portal\src\pages\TeacherFeedback.jsx
import React, { useState, useCallback } from 'react';
import './TeacherFeedback.css';

const TeacherFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    feedbackText: '',
    rating: 5,
    parentId: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Fetch all feedback
  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback`);
      if (!response.ok) throw new Error('Failed to fetch feedback');
      const data = await response.json();
      setFeedbackList(data);
    } catch (err) {
      setError(`Error fetching feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value,
    }));
  }, []);

  // Validate form data
  const validateForm = () => {
    if (!formData.studentName.trim()) {
      setError('Student name is required');
      return false;
    }
    if (!formData.studentId.trim()) {
      setError('Student ID is required');
      return false;
    }
    if (!formData.feedbackText.trim()) {
      setError('Feedback text is required');
      return false;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      setError('Rating must be between 1 and 5');
      return false;
    }
    return true;
  };

  // Build payload with proper parentId handling
  const buildPayload = () => {
    const payload = {
      studentName: formData.studentName.trim(),
      studentId: formData.studentId.trim(),
      feedbackText: formData.feedbackText.trim(),
      rating: formData.rating,
    };

    // Only include parentId if it's a valid string
    if (formData.parentId && typeof formData.parentId === 'string' && formData.parentId.trim()) {
      payload.parentId = formData.parentId.trim();
    }

    return payload;
  };

  // Save feedback (create or update)
  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = buildPayload();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API_URL}/feedback/${editingId}`
        : `${API_URL}/feedback`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save feedback');
      }

      setSuccess(editingId ? 'Feedback updated successfully!' : 'Feedback saved successfully!');
      setFormData({
        studentName: '',
        studentId: '',
        feedbackText: '',
        rating: 5,
        parentId: null,
      });
      setEditingId(null);
      await fetchFeedback();
    } catch (err) {
      setError(`Error saving feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (feedback) => {
    setFormData({
      studentName: feedback.studentName,
      studentId: feedback.studentId,
      feedbackText: feedback.feedbackText,
      rating: feedback.rating,
      parentId: feedback.parentId || null,
    });
    setEditingId(feedback._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/feedback/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete feedback');

      setSuccess('Feedback deleted successfully!');
      await fetchFeedback();
    } catch (err) {
      setError(`Error deleting feedback: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setFormData({
      studentName: '',
      studentId: '',
      feedbackText: '',
      rating: 5,
      parentId: null,
    });
    setEditingId(null);
  };

  // Load feedback on mount
  React.useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return (
    <div className="teacher-feedback-container">
      <h1>Teacher Feedback Portal</h1>

      {/* Alert Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Feedback Form */}
      <form className="feedback-form" onSubmit={handleSaveFeedback}>
        <h2>{editingId ? 'Edit Feedback' : 'Add New Feedback'}</h2>

        <div className="form-group">
          <label htmlFor="studentName">Student Name *</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            placeholder="Enter student name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentId">Student ID *</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            placeholder="Enter student ID"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="feedbackText">Feedback *</label>
          <textarea
            id="feedbackText"
            name="feedbackText"
            value={formData.feedbackText}
            onChange={handleInputChange}
            placeholder="Enter your feedback here"
            rows="5"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rating">Rating (1-5) *</label>
            <select
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              required
            >
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very Good</option>
              <option value="5">5 - Excellent</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="parentId">Parent
```

