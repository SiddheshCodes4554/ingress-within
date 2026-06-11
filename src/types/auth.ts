export interface User {
  id: string;
  phone_number: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionState {
  currentStep?: string;
  lastRoute?: string;
  theme?: 'light' | 'dark';
  [key: string]: any;
}

export interface UserSession {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  device_id: string;
  device_name: string | null;
  ip_address: string;
  user_agent: string | null;
  is_active: boolean;
  session_state: SessionState;
  created_at: string;
  expires_at: string;
  last_active_at: string;
}

export interface OtpAttempt {
  id: string;
  phone_number: string;
  otp_hash: string;
  salt: string;
  attempts_count: number;
  resend_count: number;
  last_resend_at: string;
  expires_at: string;
  verified_at: string | null;
  created_at: string;
}

export interface SendOtpRequest {
  phone_number: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  resend_in_seconds: number;
}

export interface VerifyOtpRequest {
  phone_number: string;
  otp_code: string;
  device_id: string;
  device_name?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  user: User;
  session: {
    access_token: string;
    expires_in: number;
  };
}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: AuthError;
}
