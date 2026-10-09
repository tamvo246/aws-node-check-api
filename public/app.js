const form = document.querySelector('#user-form');
const nameInput = document.querySelector('#name');
const emailInput = document.querySelector('#email');
const submitButton = document.querySelector('#submit-button');
const refreshButton = document.querySelector('#refresh-button');
const formStatus = document.querySelector('#form-status');
const listStatus = document.querySelector('#list-status');
const userCount = document.querySelector('#user-count');
const usersList = document.querySelector('#users-list');

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
loadUsers();
