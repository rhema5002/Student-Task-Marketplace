/**
 * Supabase Configuration
 */

var SUPABASE_URL = "https://eslixudvrhnokslgehnz.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbGl4dWR2cmhub2tzbGdlaG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTE1MjUsImV4cCI6MjA4OTMyNzUyNX0.hr4jab4Iyi7hFftEMIkkBDKm59f356MajJUNSznR1KY";

// Use 'var' to allow redeclaration if script loads multiple times
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

var CONFIG = {
  MAX_TASKS_PER_DAY: 5,
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  TASK_REWARD_MIN: 1,
  TASK_REWARD_MAX: 100,
};