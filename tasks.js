/**
 * Tasks Module - Handle task creation, listing, and acceptance
 */

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  requireAuth(async (user, profile) => {
    currentUser = user;
    
    // Check if admin - show admin button
    const isAdminUser = await isAdmin(user.id);
    const adminBtn = document.getElementById('nav-admin');
    if (adminBtn && isAdminUser) {
      adminBtn.style.display = 'inline-block';
    }

    // Update user info
    updateUserInfo(user, profile);
    
    // Check verification status
    if (profile?.verification_status !== 'verified') {
      document.getElementById('verification-card').style.display = 'block';
    }

    // Load tasks
    await loadAvailableTasks(user);
    await loadMyTasks(user);
    await updateTaskCount(user);

    // Setup form
    setupCreateTaskForm(user);

    // Refresh every 30 seconds
    setInterval(() => {
      loadAvailableTasks(user);
      loadMyTasks(user);
      updateTaskCount(user);
    }, 30000);
  });
});

/**
 * Update user info display
 */
async function updateUserInfo(user, profile) {
  const userInfoEl = document.getElementById('user-info');
  if (userInfoEl && profile) {
    userInfoEl.textContent = `👤 ${profile.email}`;
  }

  if (profile?.verification_status) {
    const badge = document.getElementById('verification-badge');
    const status = profile.verification_status;
    
    if (badge) {
      badge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
      badge.style.color = 
        status === 'verified' ? '#10b981' :
        status === 'rejected' ? '#ef4444' :
        '#f59e0b';
    }
  }
}

/**
 * Update daily task count
 */
async function updateTaskCount(user) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();

    const { count, error } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('creator', user.id)
      .gte('created_at', todayStart);

    if (error) throw error;

    const taskCountEl = document.getElementById('task-count');
    if (taskCountEl) {
      taskCountEl.textContent = `${count}/${CONFIG.MAX_TASKS_PER_DAY}`;
    }
  } catch (error) {
    console.error('Task count error:', error);
  }
}

/**
 * Setup create task form
 */
function setupCreateTaskForm(user) {
  const form = document.getElementById('create-task-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError('create-task-error');

    const title = document.getElementById('task-title')?.value.trim();
    const description = document.getElementById('task-description')?.value.trim();
    const reward = parseInt(document.getElementById('task-reward')?.value) || 0;

    if (!title || !description || !reward) {
      showError('create-task-error', '❌ All fields required');
      return;
    }

    if (title.length < 3) {
      showError('create-task-error', '❌ Title must be at least 3 characters');
      return;
    }

    if (description.length < 10) {
      showError('create-task-error', '❌ Description must be at least 10 characters');
      return;
    }

    if (reward < CONFIG.TASK_REWARD_MIN || reward > CONFIG.TASK_REWARD_MAX) {
      showError('create-task-error', `❌ Reward must be ${CONFIG.TASK_REWARD_MIN}-${CONFIG.TASK_REWARD_MAX}`);
      return;
    }

    try {
      // Check daily limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();

      const { count, error: countError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('creator', user.id)
        .gte('created_at', todayStart);

      if (countError) throw countError;

      if (count >= CONFIG.MAX_TASKS_PER_DAY) {
        showError('create-task-error', `❌ Daily limit reached (${CONFIG.MAX_TASKS_PER_DAY} tasks)`);
        return;
      }

      // Get user profile
      const profile = await getUserProfile(user.id);
      if (profile?.verification_status !== 'verified') {
        showError('create-task-error', '❌ Complete verification first');
        return;
      }

      // Create task
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title,
          description,
          reward,
          creator: user.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Success
      form.reset();
      await loadAvailableTasks(user);
      await loadMyTasks(user);
      await updateTaskCount(user);
      
      showSuccess('create-task-error', '✅ Task created successfully!');
    } catch (error) {
      console.error('Create task error:', error);
      showError('create-task-error', `❌ ${error.message || 'Failed to create task'}`);
    }
  });
      // WhatsApp link
    const whatsappNumber = task.whatsapp.replace(/[^0-9]/g, '');
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=Hi%20${posterUser.name}%2C%20I'm%20interested%20in%20the%20task%3A%20${task.title}`;
    document.getElementById('modal-whatsapp-link').href = whatsappLink;
}

/**
 * Load available tasks
 */
async function loadAvailableTasks(user) {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .is('accepted_by', null)
      .neq('creator', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const container = document.getElementById('available-tasks');
    if (!container) return;

    if (!tasks || tasks.length === 0) {
      container.innerHTML = '<p class="empty-state">No tasks available right now</p>';
      return;
    }

    container.innerHTML = '';

    for (const task of tasks) {
      const creatorProfile = await getUserProfile(task.creator);
      const taskEl = createTaskElement(task, creatorProfile, user, 'accept');
      container.appendChild(taskEl);
    }
  } catch (error) {
    console.error('Load tasks error:', error);
    const container = document.getElementById('available-tasks');
    if (container) {
      showError('load-tasks-error', '❌ Failed to load tasks');
    }
  }
}

/**
 * Load my accepted tasks
 */
async function loadMyTasks(user) {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('accepted_by', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const container = document.getElementById('my-tasks');
    if (!container) return;

    if (!tasks || tasks.length === 0) {
      container.innerHTML = '<p class="empty-state">You haven\'t accepted any tasks yet</p>';
      return;
    }

    container.innerHTML = '';

    for (const task of tasks) {
      const creatorProfile = await getUserProfile(task.creator);
      const taskEl = createTaskElement(task, creatorProfile, user, 'view');
      container.appendChild(taskEl);
    }
  } catch (error) {
    console.error('Load my tasks error:', error);
    const container = document.getElementById('my-tasks');
    if (container) {
      container.innerHTML = '<p class="error">Failed to load tasks</p>';
    }
  }
}

/**
 * Create task element
 */
function createTaskElement(task, creatorProfile, user, mode) {
  const div = document.createElement('div');
  div.className = 'task-card';

  const creatorEmail = creatorProfile?.email || 'Unknown';
  const timeAgo = getTimeDifference(task.created_at);

  let actionsHtml = '';
  
  if (mode === 'accept') {
    actionsHtml = `
      <button class="btn btn-primary" onclick="acceptTask('${task.id}')">
        Accept Task
      </button>
    `;
  } else if (mode === 'view') {
    actionsHtml = `
      <button class="btn btn-secondary" disabled>
        Accepted ✓
      </button>
    `;
  }

  div.innerHTML = `
    <div class="task-header">
      <h3 class="task-title">${escapeHtml(task.title)}</h3>
      <span class="task-badge badge-reward">+${task.reward} pts</span>
    </div>
    <p class="task-description">${escapeHtml(task.description)}</p>
    <div class="task-meta">
      <div>Created by <strong>${escapeHtml(creatorEmail)}</strong></div>
      <div style="font-size: 12px; color: #999;">${timeAgo}</div>
    </div>
    <div class="task-actions">
      ${actionsHtml}
    </div>
  `;

  return div;
}

/**
 * Accept task
 */
window.acceptTask = async function(taskId) {
  if (!currentUser) return;

  try {
    clearError('create-task-error');

    const { data: task, error: getError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (getError) throw getError;

    // Validations
    if (task.accepted_by) {
      showError('create-task-error', '❌ This task has already been accepted');
      return;
    }

    if (task.creator === currentUser.id) {
      showError('create-task-error', '❌ You cannot accept your own task');
      return;
    }

    // Check verification
    const profile = await getUserProfile(currentUser.id);
    if (profile?.verification_status !== 'verified') {
      showError('create-task-error', '❌ Complete verification first');
      return;
    }

    // Accept task
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        accepted_by: currentUser.id,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (updateError) throw updateError;

    // Reload tasks
    await loadAvailableTasks(currentUser);
    await loadMyTasks(currentUser);
    
    showSuccess('create-task-error', '✅ Task accepted!');
  } catch (error) {
    console.error('Accept task error:', error);
    showError('create-task-error', `❌ ${error.message || 'Failed to accept task'}`);
  }
};
