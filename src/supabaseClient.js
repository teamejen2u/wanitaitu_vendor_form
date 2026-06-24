import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

let supabaseInstance = null;

if (isSupabaseConfigured) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;

/**
 * Mock DB Implementation for local developer testing when Supabase keys are not set.
 * Uses localStorage to save and load submissions and mock logo assets.
 */
export const mockDb = {
  // Key for local storage
  STORAGE_KEY: 'wanitaitu_mock_vendor_submissions',

  // Save submission
  async insertSubmission(data) {
    console.warn('⚠️ Supabase not configured. Using Mock DB fallback.');
    
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    const submissions = this.getSubmissions();
    const newSubmission = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      ...data
    };
    
    submissions.push(newSubmission);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(submissions));
    
    return { data: newSubmission, error: null };
  },

  // Get all submissions
  async selectSubmissions() {
    console.warn('⚠️ Supabase not configured. Using Mock DB fallback.');
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const submissions = this.getSubmissions();
    return { data: submissions, error: null };
  },

  // Mock Upload Logo
  async uploadLogo(file) {
    console.warn('⚠️ Supabase not configured. Mocking file upload.');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Convert file to Base64 string for preview storage
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          publicUrl: reader.result, // base64 string
          error: null
        });
      };
      reader.onerror = () => {
        resolve({
          publicUrl: null,
          error: new Error('Failed to read file')
        });
      };
      reader.readAsDataURL(file);
    });
  },

  // Delete submission
  async deleteSubmission(id) {
    console.warn('⚠️ Supabase not configured. Using Mock DB fallback.');
    await new Promise((resolve) => setTimeout(resolve, 500));

    const submissions = this.getSubmissions();
    const filtered = submissions.filter(sub => sub.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));

    return { data: null, error: null };
  },

  // Get submissions from localStorage
  getSubmissions() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
};
