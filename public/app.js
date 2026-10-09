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
  userCount.textContent = `${users.length} người dùng`;

  if (users.length === 0) {
    listStatus.textContent = 'Chưa có người dùng nào. Hãy thêm người dùng đầu tiên.';
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
  listStatus.textContent = 'Đang tải danh sách...';

  try {
    const response = await fetch('/users');
    if (!response.ok) {
      throw new Error('Không thể tải danh sách người dùng. Kiểm tra kết nối database.');
    }

    renderUsers(await response.json());
  } catch (error) {
    userCount.textContent = 'Không thể tải dữ liệu';
    listStatus.textContent = error.message;
  } finally {
    refreshButton.disabled = false;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  formStatus.className = 'form-status';
  formStatus.textContent = 'Đang thêm người dùng...';

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
        throw new Error('Email này đã tồn tại.');
      }
      throw new Error(body.error || 'Không thể thêm người dùng.');
    }

    form.reset();
    formStatus.classList.add('success');
    formStatus.textContent = 'Đã thêm người dùng thành công.';
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
