/**
 * Admin Dashboard Module - User & Task Management
 * Complete merged version with all functionality
 */

let currentAdminUser = null;

document.addEventListener('DOMContentLoaded', () => {
  requireAuth(async (user, profile) => {
    // Check admin role
    const adminUser = await isAdmin(user.id);
    if (!adminUser) {
      showError('admin-error', '❌ Unauthorized: Admin access required');
      const adminSection = document.getElementById('admin-section');
      if (adminSection) {
        adminSection.style.display = 'none';
      }
      return;
    }

    currentAdminUser = user;

    // Load all data
    await loadUsers();
    await loadTasks();
    await loadStatistics();

    // Refresh every 60 seconds
    setInterval(async () => {
      await loadUsers();
      await loadTasks();
      await loadStatistics();
    }, 60000);
  });
});

/**
 * Load all users for admin view
 */
async function loadUsers() {
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Separate by verification status
    const pending = users.filter(u => u.verification_status === 'pending');
    const verified = users.filter(u => u.verification_status === 'verified');

    // Load pending verifications
    const pendingList = document.getElementById('users-pending-list');
    if (pendingList) {
      if (pending.length === 0) {
        pendingList.innerHTML = '<p class="empty-state">No pending verifications</p>';
      } else {
        pendingList.innerHTML = '';
        pending.forEach(user => {
          pendingList.appendChild(createUserElement(user));
        });
      }
    }

    // Load verified users
    const verifiedList = document.getElementById('users-verified-list');
    if (verifiedList) {
      if (verified.length === 0) {
        verifiedList.innerHTML = '<p class="empty-state">No verified users</p>';
      } else {
        verifiedList.innerHTML = '';
        verified.forEach(user => {
          verifiedList.appendChild(createUserElement(user));
        });
      }
    }

    // Load all users
    const allList = document.getElementById('users-all-list');
    if (allList) {
      allList.innerHTML = '';
      users.forEach(user => {
        allList.appendChild(createUserElement(user));
      });
    }
  } catch (error) {
    console.error('Load users error:', error);
    showError('admin-error', `❌ Failed to load users: ${error.message}`);
  }
}

/**
 * Create user card element
 */
function createUserElement(user) {
  const div = document.createElement('div');
  div.className = 'user-card';

  const statusClass = `status-${user.verification_status}`;
  const isAdmin = user.role === 'admin';

  div.innerHTML = `
    <div class="user-email">${escapeHtml(user.email)}</div>
    <div class="user-status">
      <div>Status: <span class="${statusClass}">${user.verification_status}</span></div>
      <div>Role: <strong>${user.role}</strong></div>
      <div>Points: <strong>${user.points || 0}</strong></div>
      <div>Joined: ${formatDate(user.created_at)}</div>
    </div>
    <div class="user-actions">
      ${user.verification_status === 'pending' ? `
        <button class="btn btn-success" onclick="verifyUser('${user.id}')">✓ Verify</button>
        <button class="btn btn-danger" onclick="rejectUser('${user.id}')">✗ Reject</button>
      ` : user.verification_status === 'rejected' ? `
        <button class="btn btn-warning" onclick="reverifyUser('${user.id}')">Re-verify</button>
      ` : ''}
      ${!isAdmin ? `
        <button class="btn btn-warning" onclick="makeAdmin('${user.id}')">Make Admin</button>
      ` : `
        <button class="btn btn-secondary" disabled>✓ Is Admin</button>
      `}
    </div>
  `;

  return div;
}

/**
 * Verify user
 */
window.verifyUser = async function(userId) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: 'verified' })
      .eq('id', userId);

    if (error) throw error;
    
    await loadUsers();
    showSuccess('admin-error', '✅ User verified successfully');
  } catch (error) {
    console.error('Verify error:', error);
    showError('admin-error', `❌ Verification failed: ${error.message}`);
  }
};

/**
 * Reject user
 */
window.rejectUser = async function(userId) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: 'rejected' })
      .eq('id', userId);

    if (error) throw error;
    
    await loadUsers();
    showSuccess('admin-error', '✅ User rejected');
  } catch (error) {
    console.error('Reject error:', error);
    showError('admin-error', `❌ Rejection failed: ${error.message}`);
  }
};

/**
 * Re-verify rejected user
 */
window.reverifyUser = async function(userId) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: 'pending' })
      .eq('id', userId);

    if (error) throw error;
    
    await loadUsers();
    showSuccess('admin-error', '✅ User set back to pending');
  } catch (error) {
    console.error('Re-verify error:', error);
    showError('admin-error', `❌ Failed: ${error.message}`);
  }
};

/**
 * Make user admin
 */
window.makeAdmin = async function(userId) {
  if (!confirm('⚠️ Make this user an admin? They will have full control.')) return;

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId);

    if (error) throw error;
    
    await loadUsers();
    showSuccess('admin-error', '✅ User is now an admin');
  } catch (error) {
    console.error('Make admin error:', error);
    showError('admin-error', `❌ Failed to make admin: ${error.message}`);
  }
};

/**
 * Load tasks for management
 */
async function loadTasks() {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const container = document.getElementById('tasks-admin-list');
    if (!container) return;

    if (!tasks || tasks.length === 0) {
      container.innerHTML = '<p class="empty-state">No tasks created yet</p>';
      return;
    }

    container.innerHTML = '';

    // Get creator and acceptor details for each task
    for (const task of tasks) {
      const creatorProfile = await getUserProfile(task.creator);
      const acceptorProfile = task.accepted_by ? await getUserProfile(task.accepted_by) : null;
      
      const el = document.createElement('div');
      el.className = 'task-card';

      const creatorEmail = creatorProfile?.email || 'Unknown';
      const acceptorEmail = acceptorProfile?.email || 'Unaccepted';
      const statusBadge = task.accepted_by 
        ? '<span class="task-badge badge-accepted">✓ Accepted</span>'
        : '<span class="task-badge badge-reward">Open</span>';

      el.innerHTML = `
        <div class="task-header">
          <h3 class="task-title">${escapeHtml(task.title)}</h3>
          ${statusBadge}
        </div>
        <p class="task-description">${escapeHtml(task.description)}</p>
        <div class="task-meta">
          <div>Creator: <strong>${escapeHtml(creatorEmail)}</strong></div>
          <div>Accepted by: <strong>${escapeHtml(acceptorEmail)}</strong></div>
          <div>Reward: <strong>+${task.reward} pts</strong></div>
          <div style="font-size: 12px; color: #999;">Created ${getTimeDifference(task.created_at)}</div>
        </div>
        <div class="task-actions">
          <button class="btn btn-danger" onclick="deleteTask('${task.id}')">Delete Task</button>
        </div>
      `;

      container.appendChild(el);
    }
  } catch (error) {
    console.error('Load tasks error:', error);
    showError('admin-error', `❌ Failed to load tasks: ${error.message}`);
  }
}

/**
 * Delete task
 */
window.deleteTask = async function(taskId) {
  if (!confirm('⚠️ Permanently delete this task? This cannot be undone.')) return;

  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
    
    await loadTasks();
    showSuccess('admin-error', '✅ Task deleted successfully');
  } catch (error) {
    console.error('Delete error:', error);
    showError('admin-error', `❌ Failed to delete task: ${error.message}`);
  }
};

/**
 * Load statistics
 */
async function loadStatistics() {
  try {
    // Total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Verified users
    const { count: verifiedUsers, error: verifiedError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'verified');

    if (verifiedError) throw verifiedError;

    // Total tasks
    const { count: totalTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    if (tasksError) throw tasksError;

    // Completed tasks
    const { count: completedTasks, error: completedError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .not('accepted_by', 'is', null);

    if (completedError) throw completedError;

    // Update stats display
    const stats = {
      'stat-total-users': totalUsers || 0,
      'stat-verified-users': verifiedUsers || 0,
      'stat-total-tasks': totalTasks || 0,
      'stat-completed-tasks': completedTasks || 0,
    };

    Object.entries(stats).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });
  } catch (error) {
    console.error('Load stats error:', error);
    showError('admin-error', `❌ Failed to load statistics: ${error.message}`);
  }
}