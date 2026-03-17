/**
 * Authentication Module - Complete Working Version
 */

console.log('📌 auth.js loaded');
console.log('📌 Supabase available:', typeof supabase !== 'undefined' ? 'YES' : 'NO');

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 DOMContentLoaded fired');
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('📊 Session check:', session ? 'Has session' : 'No session');
    
    if (session) {
      console.log('✅ User already logged in, redirecting to dashboard...');
      window.location.href = 'dashboard.html';
      return;
    }

    console.log('👤 No session, showing login/register forms');
    
    // Setup forms
    setupLoginForm();
    setupRegisterForm();
    setupNavigation();
    
  } catch (error) {
    console.error('❌ Session check error:', error);
  }
});

/**
 * Setup login form
 */
function setupLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) {
    console.error('❌ login-form not found!');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError('login-error');

    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;

    console.log('🔐 Attempting login with:', email);

    if (!email || !password) {
      showError('login-error', '❌ Email and password required');
      return;
    }

    if (!validateEmail(email)) {
      showError('login-error', '❌ Invalid email format');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Login error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Login successful!');
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);

    } catch (error) {
      console.error('❌ Login failed:', error);
      showError('login-error', `❌ ${error.message || 'Login failed'}`);
    }
  });
}

/**
 * Setup register form
 */
function setupRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) {
    console.error('❌ register-form not found!');
    return;
  }

  console.log('✅ register-form found, attaching listener');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError('register-error');

    console.log('📝 Register form submitted');

    const email = document.getElementById('register-email')?.value.trim();
    const password = document.getElementById('register-password')?.value;
    const confirmPassword = document.getElementById('register-password-confirm')?.value;

    console.log('📝 Form values:', { email, password: '***', confirmPassword: '***' });

    if (!email || !password || !confirmPassword) {
      showError('register-error', '❌ All fields required');
      return;
    }

    if (!validateEmail(email)) {
      showError('register-error', '❌ Invalid email format');
      return;
    }

    if (!validatePassword(password)) {
      showError('register-error', '❌ Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      showError('register-error', '❌ Passwords do not match');
      return;
    }

    try {
      console.log('🔐 Calling supabase.auth.signUp()...');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('❌ SignUp error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Registration successful!', data);

      showSuccess('register-error', '✅ Registration successful! Please log in.');
      
      setTimeout(() => {
        toggleAuth();
        form.reset();
        clearError('register-error');
      }, 2000);

    } catch (error) {
      console.error('❌ Register failed:', error);
      showError('register-error', `❌ ${error.message || 'Registration failed'}`);
    }
  });
}

/**
 * Setup navigation
 */
function setupNavigation() {
  const logoutBtns = document.querySelectorAll('#nav-logout, #logout-btn, #dashboard-logout-btn, #admin-logout-btn');
  logoutBtns.forEach(btn => {
    btn?.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.href = 'index.html';
    });
  });

  const dashboardBtns = document.querySelectorAll('#nav-dashboard, #go-dashboard');
  dashboardBtns.forEach(btn => {
    btn?.addEventListener('click', () => window.location.href = 'dashboard.html');
  });

  const adminBtns = document.querySelectorAll('#nav-admin, #go-admin');
  adminBtns.forEach(btn => {
    btn?.addEventListener('click', () => window.location.href = 'admin.html');
  });

  const leaderboardBtns = document.querySelectorAll('#nav-leaderboard, #go-leaderboard');
  leaderboardBtns.forEach(btn => {
    btn?.addEventListener('click', () => window.location.href = 'leaderboard.html');
  });

  const backBtns = document.querySelectorAll('#nav-back');
  backBtns.forEach(btn => {
    btn?.addEventListener('click', () => window.location.href = 'dashboard.html');
  });
}