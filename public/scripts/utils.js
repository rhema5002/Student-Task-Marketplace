/**
 * Utility Functions
 */

/**
 * Display error message
 */
function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.style.display = 'block';
  }
}

/**
 * Clear error message
 */
function clearError(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = '';
    element.style.display = 'none';
  }
}

/**
 * Show success message
 */
function showSuccess(elementId, message) {
  const element = document.getElementById(elementId);
  if (element && element.classList.contains('success-message')) {
    element.textContent = message;
    element.style.display = 'block';
  }
}

/**
 * Require authentication - redirect if not logged in
 */
async function requireAuth(callback) {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      window.location.href = 'index.html';
      return;
    }

    const user = session.user;
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile error:', profileError);
    }

    callback(user, profile);
  } catch (error) {
    console.error('Auth error:', error);
    window.location.href = 'index.html';
  }
}

/**
 * Check if user is admin
 */
async function isAdmin(userId) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) return false;
    return profile?.role === 'admin';
  } catch (error) {
    console.error('Admin check error:', error);
    return false;
  }
}

/**
 * Get user profile
 */
async function getUserProfile(userId) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return profile;
  } catch (error) {
    console.error('Get profile error:', error);
    return null;
  }
}

/**
 * Format date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Get time difference
 */
function getTimeDifference(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(dateString);
}

/**
 * Validate email
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate password
 */
function validatePassword(password) {
  return password.length >= 6;
}

/**
 * Validate file
 */
function validateFile(file) {
  if (!file) return { valid: false, error: 'No file selected' };
  if (file.size > CONFIG.MAX_FILE_SIZE) {
    return { valid: false, error: `File too large (max ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB)` };
  }
  if (!CONFIG.FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type (JPG, PNG, WebP only)' };
  }
  return { valid: true };
}

/**
 * Toggle auth forms
 */
function toggleAuth() {
  const loginSection = document.getElementById('login-section');
  const registerSection = document.getElementById('register-section');
  
  if (loginSection && registerSection) {
    const isLoginVisible = loginSection.style.display !== 'none';
    loginSection.style.display = isLoginVisible ? 'none' : 'block';
    registerSection.style.display = isLoginVisible ? 'block' : 'none';
  }
}

/**
 * Switch tabs
 */
function switchTab(tabName) {
  // Hide all tab contents
  const contents = document.querySelectorAll('.tab-content');
  contents.forEach(content => content.style.display = 'none');

  // Remove active class from all buttons
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  // Show selected tab
  const activeContent = document.getElementById(tabName);
  if (activeContent) {
    activeContent.style.display = 'block';
  }

  // Add active class to clicked button
  event.target.classList.add('active');
}

/**
 * Redirect function
 */
function goToPage(page) {
  window.location.href = page;
}

/**
 * Copy to clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Copy failed:', error);
    return false;
  }
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
function toggleAuth() {
  const loginSection = document.getElementById('login-section');
  const registerSection = document.getElementById('register-section');
  
  if (loginSection && registerSection) {
    const isLoginVisible = loginSection.style.display !== 'none';
    loginSection.style.display = isLoginVisible ? 'none' : 'block';
    registerSection.style.display = isLoginVisible ? 'block' : 'none';
    console.log('🔄 Toggled auth form');
  }
}