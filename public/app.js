const form = document.querySelector('#user-form');
const nameInput = document.querySelector('#name');
const emailInput = document.querySelector('#email');
const submitButton = document.querySelector('#submit-button');
const refreshButton = document.querySelector('#refresh-button');
const formStatus = document.querySelector('#form-status');
const listStatus = document.querySelector('#list-status');
const userCount = document.querySelector('#user-count');
const usersList = document.querySelector('#users-list');
const uploadForm = document.querySelector('#upload-form');
const uploadInput = document.querySelector('#upload-file');
const chooseFileButton = document.querySelector('#choose-file-button');
const uploadButton = document.querySelector('#upload-button');
const uploadStatus = document.querySelector('#upload-status');
const previewEmpty = document.querySelector('#preview-empty');
const previewImage = document.querySelector('#preview-image');
const previewDetails = document.querySelector('#preview-details');
const maxFileSize = 10 * 1024 * 1024;
let previewUrl;

function clearPreview(message = 'Image preview will appear here.') {
  previewImage.onerror = null;
  previewImage.hidden = true;
  previewImage.removeAttribute('src');
  previewDetails.hidden = true;
  previewEmpty.textContent = message;
  previewEmpty.hidden = false;

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = undefined;
  }
}

function renderUsers(users) {
  usersList.replaceChildren();
  userCount.textContent = `${users.length} user${users.length === 1 ? '' : 's'}`;

  if (users.length === 0) {
    listStatus.textContent = 'No users yet. Add the first one.';
    return;
  }

  listStatus.textContent = '';
  for (const user of users) {
    const item = document.createElement('li');
    item.className = 'user-item';

    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    avatar.textContent = (user.name || '?').trim().charAt(0).toUpperCase() || '?';

    const details = document.createElement('span');
    details.className = 'user-details';

    const name = document.createElement('strong');
    name.textContent = user.name;

    const email = document.createElement('span');
    email.textContent = user.email;

    details.append(name, email);
    item.append(avatar, details);
    usersList.append(item);
  }
}

async function loadUsers() {
  refreshButton.disabled = true;
  listStatus.textContent = 'Loading users...';

  try {
    const response = await fetch('/users');
    if (!response.ok) {
      throw new Error('Could not load users. Check your database connection.');
    }

    renderUsers(await response.json());
  } catch (error) {
    userCount.textContent = 'Unable to load data';
    listStatus.textContent = error.message;
  } finally {
    refreshButton.disabled = false;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  formStatus.className = 'form-status';
  formStatus.textContent = 'Adding user...';

  try {
    const response = await fetch('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      if (response.status === 409) {
        throw new Error('This email is already in use.');
      }
      throw new Error(body.error || 'Could not add user.');
    }

    form.reset();
    formStatus.classList.add('success');
    formStatus.textContent = 'User added successfully.';
    await loadUsers();
  } catch (error) {
    formStatus.classList.add('error');
    formStatus.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

refreshButton.addEventListener('click', loadUsers);

chooseFileButton.addEventListener('click', () => uploadInput.click());

uploadInput.addEventListener('change', () => {
  uploadStatus.className = 'form-status';
  clearPreview();
  const file = uploadInput.files[0];
  if (!file) {
    uploadStatus.textContent = '';
  } else if (file.size > maxFileSize) {
    uploadStatus.classList.add('error');
    uploadStatus.textContent = 'File must be 10 MB or smaller.';
    previewEmpty.textContent = 'Choose a file up to 10 MB to preview it.';
  } else {
    uploadStatus.textContent = `Selected: ${file.name}`;
    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file);
      const imageUrl = previewUrl;
      previewImage.alt = `Preview of ${file.name}`;
      previewImage.onerror = () => {
        if (previewUrl === imageUrl) clearPreview('Preview unavailable for this image format.');
      };
      previewImage.src = previewUrl;
      previewImage.hidden = false;
      previewDetails.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      previewDetails.hidden = false;
      previewEmpty.hidden = true;
    } else {
      previewEmpty.textContent = 'Preview is available for images only.';
    }
  }
});

uploadForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  uploadStatus.className = 'form-status';

  const file = uploadInput.files[0];
  if (!file) {
    uploadStatus.classList.add('error');
    uploadStatus.textContent = 'Select a file to upload.';
    return;
  }
  if (file.size > maxFileSize) {
    uploadStatus.classList.add('error');
    uploadStatus.textContent = 'File must be 10 MB or smaller.';
    return;
  }

  uploadButton.disabled = true;
  uploadStatus.textContent = 'Uploading file...';

  try {
    const data = new FormData();
    data.append('file', file);
    const response = await fetch('/files', { method: 'POST', body: data });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || 'Could not upload file.');
    }

    uploadForm.reset();
    clearPreview();
    uploadStatus.classList.add('success');
    uploadStatus.textContent = `Uploaded successfully. S3 key: ${body.key}`;
  } catch (error) {
    uploadStatus.classList.add('error');
    uploadStatus.textContent = error.message;
  } finally {
    uploadButton.disabled = false;
  }
});

loadUsers();
