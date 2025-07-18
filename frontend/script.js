const API = 'http://127.0.0.1:5000/api';

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

const show = id => document.getElementById(id).classList.remove('hidden');
const hide = id => document.getElementById(id).classList.add('hidden');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const otpForm = document.getElementById('otp-form');
const appDiv = document.getElementById('app');

const toggleLoginBtn = document.getElementById('show-login');
const toggleSignupBtn = document.getElementById('show-signup');
const resendOtpBtn = document.getElementById('resend-otp-btn');
const logoutBtn = document.getElementById('logout-btn');

function switchToLogin() {
  loginForm.classList.remove('hidden');
  signupForm.classList.add('hidden');
  otpForm.classList.add('hidden');
  toggleLoginBtn.classList.add('active');
  toggleSignupBtn.classList.remove('active');
}

function switchToSignup() {
  signupForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
  otpForm.classList.add('hidden');
  toggleSignupBtn.classList.add('active');
  toggleLoginBtn.classList.remove('active');
}

toggleLoginBtn.addEventListener('click', switchToLogin);
toggleSignupBtn.addEventListener('click', switchToSignup);

function checkAuth() {
  const token = localStorage.getItem('token');
  if (token) {
    appDiv.classList.remove('hidden');
    loginForm.classList.add('hidden');
    signupForm.classList.add('hidden');
    otpForm.classList.add('hidden');
    toggleLoginBtn.parentElement.style.display = 'none';
    getExpenses();
  } else {
    appDiv.classList.add('hidden');
    toggleLoginBtn.parentElement.style.display = 'flex';
    switchToLogin();
  }
}

checkAuth();

signupForm.onsubmit = async e => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  const signupBtn = signupForm.querySelector('button[type="submit"]');
  signupBtn.disabled = true;
  signupBtn.textContent = 'Sending OTP...';

  const res = await fetch(`${API}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  signupBtn.disabled = false;
  signupBtn.textContent = 'Sign Up';

  if (data.error) {
    if (data.message && data.message.toLowerCase().includes('email exists')) {
      alert('Email already exists. Please login instead.');
      switchToLogin();
      document.getElementById('login-email').value = email;
    } else {
      alert(data.message || 'Signup failed');
    }
  } else {
    // No alert here as requested
    otpForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    loginForm.classList.add('hidden');
    toggleLoginBtn.parentElement.style.display = 'none';
    document.getElementById('otp-code').value = '';
  }
};

otpForm.onsubmit = async e => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const otp = document.getElementById('otp-code').value;
  const res = await fetch(`${API}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    checkAuth();
  } else {
    alert(data.message || 'Verification failed');
  }
};

resendOtpBtn.onclick = () => {
  const email = document.getElementById('signup-email').value;
  fetch(`${API}/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
    .then(res => res.json())
    .then(data => alert(data.message));
};

loginForm.onsubmit = async e => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    checkAuth();
  } else {
    alert(data.message || 'Login failed');
  }
};

document.getElementById('expense-form').onsubmit = async e => {
  e.preventDefault();
  const id = document.getElementById('expense-id').value;
  const body = {
    amount: parseFloat(document.getElementById('amount').value),
    category: document.getElementById('category').value,
    description: document.getElementById('description').value,
    date: document.getElementById('date').value,
  };
  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API}/expenses/${id}` : `${API}/expenses`;
  await fetch(url, {
    method,
    headers: headers(),
    body: JSON.stringify(body)
  });
  document.getElementById('expense-form').reset();
  document.getElementById('expense-id').value = '';
  getExpenses();
};

async function getExpenses() {
  const start = document.getElementById('filter-start').value;
  const end = document.getElementById('filter-end').value;
  let url = `${API}/expenses`;
  const params = [];
  if (start) params.push(`startDate=${start}`);
  if (end) params.push(`endDate=${end}`);
  if (params.length) url += `?${params.join('&')}`;

  const res = await fetch(url, { headers: headers() });
  const data = await res.json();
  const list = document.getElementById('expense-list');
  list.innerHTML = '';
  if (data.length === 0) {
    list.innerHTML = `<p style="text-align:center; color:#bbb;">No expenses found.</p>`;
    return;
  }
  data.forEach(exp => {
    const div = document.createElement('div');
    div.className = 'expense-item';
    div.innerHTML = `
      <h3>$${parseFloat(exp.amount).toFixed(2)} - ${exp.category}</h3>
      <p>${exp.description || ''}</p>
      <small>${new Date(exp.date).toLocaleDateString()}</small>
      <div>
        <button onclick="editExpense('${exp._id}', ${exp.amount}, '${exp.category}', '${escapeQuotes(exp.description)}', '${exp.date}')">Edit</button>
        <button onclick="deleteExpense('${exp._id}')">Delete</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function editExpense(id, amount, category, description, date) {
  document.getElementById('expense-id').value = id;
  document.getElementById('amount').value = amount;
  document.getElementById('category').value = category;
  document.getElementById('description').value = description;
  document.getElementById('date').value = date.slice(0, 10);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  await fetch(`${API}/expenses/${id}`, {
    method: 'DELETE',
    headers: headers()
  });
  getExpenses();
}

logoutBtn.onclick = () => {
  localStorage.removeItem('token');
  location.reload();
};

// Helper to safely escape single quotes in descriptions (for inline JS)
function escapeQuotes(str = '') {
  return str.replace(/'/g, "\\'");
}

document.getElementById('filter-btn').onclick = getExpenses;
