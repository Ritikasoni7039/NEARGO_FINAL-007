import { supabase } from '../supabaseClient';

// 8-Digit Random Code Generator
export const generate8DigitOTP = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

// 1. Send 8-digit OTP to Customer Email
export const sendCustomerOTP = async (email) => {
  const otp = generate8DigitOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

  // Purane OTP delete karke naya save karo
  await supabase.from('email_otps').delete().eq('email', email);
  
  const { error: dbError } = await supabase.from('email_otps').insert([
    { email, otp, expires_at: expiresAt.toISOString() }
  ]);

  if (dbError) throw dbError;

  // Supabase Auth ke zariye email trigger
  // Agar Custom SMTP configured hai, toh yeh aapke Gmail se jayega
  const { error: authError } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      data: { custom_code: otp }
    }
  });

  if (authError) throw authError;

  return { success: true, message: 'OTP sent successfully!' };
};

// 2. Verify 8-Digit OTP
export const verifyCustomerOTP = async (email, inputOtp) => {
  const { data, error } = await supabase
    .from('email_otps')
    .select('*')
    .eq('email', email)
    .eq('otp', inputOtp)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    throw new Error('Invalid ya Expired OTP hai!');
  }

  // OTP match hone ke baad delete kar do
  await supabase.from('email_otps').delete().eq('email', email);

  return { success: true };
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