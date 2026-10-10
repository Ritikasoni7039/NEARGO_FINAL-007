import { supabase } from '../supabaseClient';

// 8-Digit Random Code Generator
export const generate8DigitOTP = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

// 1. Send OTP to Customer Email via Supabase Auth
export const sendCustomerOTP = async (email) => {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) throw error;
  return { success: true, message: "OTP sent successfully to your email!" };
};

// 2. Verify OTP with Supabase Auth
export const verifyCustomerOTP = async (email, inputOtp) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: inputOtp.trim(),
    type: "email",
  });

  if (error) throw error;
  return { success: true, user: data?.user || data?.session?.user };
};

// 3. Customer Sign In with Email & Password (Direct login)
export const loginCustomer = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

// 4. Customer Sign Up
export const registerCustomer = async (email, password, fullName = '') => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  if (data?.user) {
    await supabase.from('profiles').upsert([
      { id: data.user.id, email, full_name: fullName, role: 'customer' }
    ]);
  }

  return data;
};