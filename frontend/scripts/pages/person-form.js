/**
 * Person Form Handler
 * Handles create, edit, and view modes for person form.
 */

(function () {
  let mode = 'create';
  let personId = null;

  function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      id: params.get('id'),
      mode: params.get('mode') || 'create',
    };
  }

  async function loadPerson(id) {
    try {
      const response = await fetch(`http://localhost:3000/api/persons/${id}`);
      const result = await response.json();

      if (result.success) {
        populateForm(result.data);
      } else {
        authHelper.showToast('Failed to load person');
      }
    } catch (error) {
      console.error('Error loading person:', error);
      authHelper.showToast('Failed to load person');
    }
  }

  function populateForm(person) {
    document.getElementById('personId').value = person.id;
    document.getElementById('name').value = person.name;
    document.getElementById('type').value = person.type;
    document.getElementById('documentType').value = person.documentType;
    document.getElementById('document').value = person.document;
    document.getElementById('email').value = person.email || '';
    document.getElementById('phone').value = person.phone || '';
    document.getElementById('birthdate').value = person.birthdate ? person.birthdate.split('T')[0] : '';
    document.getElementById('active').checked = person.active;
    document.getElementById('street').value = person.street || '';
    document.getElementById('city').value = person.city || '';
    document.getElementById('state').value = person.state || '';
    document.getElementById('zipCode').value = person.zipCode || '';
    document.getElementById('notes').value = person.notes || '';
  }

  function setViewMode() {
    const form = document.querySelector('[data-testid="person-form"]');
    const inputs = form.querySelectorAll('input, select, textarea');
    const saveBtn = document.querySelector('[data-testid="person-form-button-save"]');

    inputs.forEach(input => {
      input.disabled = true;
    });

    if (saveBtn) {
      saveBtn.style.display = 'none';
    }
  }

  function clearErrors() {
    document.querySelectorAll('[data-error]').forEach(node => {
      node.textContent = '';
    });
  }

  function validateForm() {
    clearErrors();
    let hasError = false;

    const name = document.getElementById('name').value.trim();
    const document = document.getElementById('document').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!name) {
      const errorNode = document.querySelector('[data-testid="person-form-error-name"]');
      if (errorNode) errorNode.textContent = 'Name is required';
      hasError = true;
    }

    if (!document) {
      const errorNode = document.querySelector('[data-testid="person-form-error-document"]');
      if (errorNode) errorNode.textContent = 'Document is required';
      hasError = true;
    }

    if (email && !authHelper.isValidEmail(email)) {
      const errorNode = document.querySelector('[data-testid="person-form-error-email"]');
      if (errorNode) errorNode.textContent = 'Invalid email';
      hasError = true;
    }

    return !hasError;
  }

  async function savePerson(event) {
    event.preventDefault();

    if (!validateForm()) return;

    const data = {
      name: document.getElementById('name').value.trim(),
      type: document.getElementById('type').value,
      documentType: document.getElementById('documentType').value,
      document: document.getElementById('document').value.trim(),
      email: document.getElementById('email').value.trim() || null,
      phone: document.getElementById('phone').value.trim() || null,
      birthdate: document.getElementById('birthdate').value || null,
      active: document.getElementById('active').checked,
      street: document.getElementById('street').value.trim() || null,
      city: document.getElementById('city').value.trim() || null,
      state: document.getElementById('state').value.trim() || null,
      zipCode: document.getElementById('zipCode').value.trim() || null,
      notes: document.getElementById('notes').value.trim() || null,
    };

    try {
      const url = mode === 'edit'
        ? `http://localhost:3000/api/persons/${personId}`
        : 'http://localhost:3000/api/persons';

      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        authHelper.showToast(mode === 'edit' ? 'Person updated' : 'Person created', 'success');
        window.location.href = 'people.html';
      } else {
        authHelper.showToast(result.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving person:', error);
      authHelper.showToast('Failed to save');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const params = getQueryParams();
    mode = params.mode;
    personId = params.id;

    const title = document.querySelector('[data-testid="person-form-title"]');

    if (mode === 'edit' && personId) {
      if (title) title.textContent = 'Edit Person';
      loadPerson(personId);
    } else if (mode === 'view' && personId) {
      if (title) title.textContent = 'View Person';
      loadPerson(personId);
      setViewMode();
    } else {
      if (title) title.textContent = 'New Person';
    }

    const form = document.querySelector('[data-testid="person-form"]');
    if (form) {
      form.addEventListener('submit', savePerson);
    }
  });
})();
