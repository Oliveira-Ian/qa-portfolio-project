/**
 * Person List Handler
 * Manages the people list view with selection and actions.
 */

(function () {
  let selectedIds = new Set();
  let persons = [];

  async function loadPersons() {
    try {
      const response = await fetch('http://localhost:3000/api/persons');
      const result = await response.json();

      if (result.success) {
        persons = result.data;
        renderTable();
      } else {
        authHelper.showToast('Failed to load persons');
      }
    } catch (error) {
      console.error('Error loading persons:', error);
      authHelper.showToast('Failed to load persons');
    }
  }

  function renderTable() {
    const tbody = document.querySelector('[data-testid="person-list-tbody"]');
    if (!tbody) return;

    tbody.innerHTML = persons.map(person => {
      const isSelected = selectedIds.has(person.id);
      const date = new Date(person.createdAt).toLocaleDateString();
      const activeBadge = person.active
        ? '<span class="badge badge-active">Yes</span>'
        : '<span class="badge badge-inactive">No</span>';

      return `
        <tr class="${isSelected ? 'selected' : ''}" data-person-id="${person.id}" ondblclick="viewPerson('${person.id}')">
          <td class="checkbox-cell">
            <input type="checkbox" class="checkbox-input" ${isSelected ? 'checked' : ''} onchange="toggleSelection('${person.id}')">
          </td>
          <td>${person.id.substring(0, 8)}...</td>
          <td>${escapeHtml(person.name)}</td>
          <td>${person.type}</td>
          <td>${person.document}</td>
          <td>${activeBadge}</td>
          <td>${date}</td>
        </tr>
      `;
    }).join('');

    updateActionButtons();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  window.toggleSelection = function (id) {
    if (selectedIds.has(id)) {
      selectedIds.delete(id);
    } else {
      selectedIds.clear();
      selectedIds.add(id);
    }
    renderTable();
  };

  window.toggleSelectAll = function () {
    const checkbox = document.querySelector('[data-testid="person-checkbox-select-all"]');
    if (checkbox.checked) {
      persons.forEach(p => selectedIds.add(p.id));
    } else {
      selectedIds.clear();
    }
    renderTable();
  };

  function updateActionButtons() {
    const hasSelection = selectedIds.size === 1;
    const editBtn = document.querySelector('[data-testid="person-button-edit"]');
    const deleteBtn = document.querySelector('[data-testid="person-button-delete"]');

    if (editBtn) editBtn.disabled = !hasSelection;
    if (deleteBtn) deleteBtn.disabled = !hasSelection;
  }

  window.editSelected = function () {
    if (selectedIds.size === 1) {
      const id = Array.from(selectedIds)[0];
      window.location.href = `person-form.html?id=${id}&mode=edit`;
    }
  };

  window.viewPerson = function (id) {
    window.location.href = `person-form.html?id=${id}&mode=view`;
  };

  window.deleteSelected = async function () {
    if (selectedIds.size !== 1) return;

    const id = Array.from(selectedIds)[0];
    if (!confirm('Are you sure you want to delete this person?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/persons/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        authHelper.showToast('Person deleted', 'success');
        selectedIds.clear();
        loadPersons();
      } else {
        authHelper.showToast(result.message || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting person:', error);
      authHelper.showToast('Failed to delete');
    }
  };

  // Load data on page load
  document.addEventListener('DOMContentLoaded', loadPersons);
})();
