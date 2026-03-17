/**
 * Leaderboard Module - Rankings & Scores
 */

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  requireAuth(async (user, profile) => {
    currentUser = user;

    // Load all leaderboards
    await loadLeaderboard('all-time');
    await loadLeaderboard('this-month');
    await loadLeaderboard('this-week');
    
    // Load user stats
    await loadUserStats(user);

    // Refresh every 30 seconds
    setInterval(async () => {
      await loadLeaderboard('all-time');
      await loadLeaderboard('this-month');
      await loadLeaderboard('this-week');
      await loadUserStats(user);
    }, 30000);
  });
});

/**
 * Load leaderboard data
 */
async function loadLeaderboard(period) {
  try {
    let query = supabase
      .from('tasks')
      .select('accepted_by, reward')
      .not('accepted_by', 'is', null);

    // Filter by time period
    const now = new Date();
    if (period === 'this-month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      query = query.gte('accepted_at', monthStart);
    } else if (period === 'this-week') {
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('accepted_at', weekStart);
    }

    const { data: tasks, error } = await query;
    if (error) throw error;

    // Aggregate scores
    const leaderboard = {};
    if (tasks) {
      tasks.forEach(task => {
        leaderboard[task.accepted_by] = (leaderboard[task.accepted_by] || 0) + (task.reward || 10);
      });
    }

    // Get user profiles
    const userIds = Object.keys(leaderboard);
    if (userIds.length === 0) {
      renderLeaderboard(period, []);
      return;
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds);

    if (profileError) throw profileError;

    // Combine and sort
    const entries = profiles.map(profile => ({
      id: profile.id,
      email: profile.email,
      score: leaderboard[profile.id],
    })).sort((a, b) => b.score - a.score);

    renderLeaderboard(period, entries);
  } catch (error) {
    console.error(`Load leaderboard (${period}) error:`, error);
    const container = document.getElementById(`leaderboard-${period}-list`);
    if (container) {
      container.innerHTML = `<p class="error">Failed to load leaderboard</p>`;
    }
  }
}

/**
 * Render leaderboard
 */
function renderLeaderboard(period, entries) {
  const container = document.getElementById(`leaderboard-${period}-list`);
  if (!container) return;

  if (!entries || entries.length === 0) {
    container.innerHTML = '<p class="empty-state">No one has completed tasks yet</p>';
    return;
  }

  container.innerHTML = '';

  entries.forEach((entry, index) => {
    const rank = index + 1;
    const medalsEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '•';
    const topClass = rank <= 3 ? `top-${rank}` : '';

    const div = document.createElement('div');
    div.className = `leaderboard-entry ${topClass}`;
    div.innerHTML = `
      <div class="leaderboard-rank">${medalsEmoji} #${rank}</div>
      <div class="leaderboard-info">
        <div class="leaderboard-name">${escapeHtml(entry.email)}</div>
        <div class="leaderboard-email">Points earned</div>
      </div>
      <div class="leaderboard-score">
        <strong>${entry.score}</strong>
        <small>pts</small>
      </div>
    `;

    container.appendChild(div);
  });
}

/**
 * Load user's personal stats
 */
async function loadUserStats(user) {
  try {
    // Get user's completed tasks
    const { data: userTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('reward')
      .eq('accepted_by', user.id)
      .not('accepted_by', 'is', null);

    if (tasksError) throw tasksError;

    const totalPoints = userTasks?.reduce((sum, task) => sum + (task.reward || 10), 0) || 0;
    const tasksCompleted = userTasks?.length || 0;

    // Get user's rank
    const { data: allTasks, error: allTasksError } = await supabase
      .from('tasks')
      .select('accepted_by, reward')
      .not('accepted_by', 'is', null);

    if (allTasksError) throw allTasksError;

    const leaderboard = {};
    if (allTasks) {
      allTasks.forEach(task => {
        leaderboard[task.accepted_by] = (leaderboard[task.accepted_by] || 0) + (task.reward || 10);
      });
    }

    const sorted = Object.entries(leaderboard)
      .map(([userId, score]) => ({ userId, score }))
      .sort((a, b) => b.score - a.score);

    const userRank = sorted.findIndex(entry => entry.userId === user.id) + 1 || 'Unranked';

    // Update display
    const yourRank = document.getElementById('your-rank');
    if (yourRank) yourRank.textContent = userRank;

    const yourScore = document.getElementById('your-score');
    if (yourScore) yourScore.textContent = tasksCompleted;

    const yourPoints = document.getElementById('your-points');
    if (yourPoints) yourPoints.textContent = totalPoints;
  } catch (error) {
    console.error('Load user stats error:', error);
  }
}