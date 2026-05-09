// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export type UserRole = "admin" | "staff" | "patient";

export interface JwtPayload {
  sub: string; // user id
  role: UserRole;
  clinicId?: string;
  iat: number;
  exp: number;
}

// ---------------------------------------------------------------------------
// Patient
// ---------------------------------------------------------------------------

export interface Patient {
  id: string;
  hn: string; // Hospital Number — primary identifier
  nameTh: string;
  nameEn?: string;
  dob: string; // ISO date YYYY-MM-DD
  idCard?: string; // Thai national ID
  phone?: string;
  lineUid?: string; // LINE user id (linked via LINE Login)
  createdAt: string;
  updatedAt: string;
}

export type CreatePatientInput = Omit<Patient, "id" | "createdAt" | "updatedAt">;

// ---------------------------------------------------------------------------
// Pregnancy
// ---------------------------------------------------------------------------

export type PregnancyStatus = "active" | "delivered" | "terminated";

export interface Pregnancy {
  id: string;
  patientId: string;
  lmp: string; // Last Menstrual Period — ISO date
  edd: string; // Estimated Due Date — ISO date
  gaAtRegistration?: number; // Gestational age in weeks at first visit
  status: PregnancyStatus;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Child
// ---------------------------------------------------------------------------

export type ChildSex = "male" | "female";

export interface Child {
  id: string;
  patientId: string; // mother's patient id
  pregnancyId?: string;
  nameTh: string;
  dob: string;
  sex: ChildSex;
  birthWeightGrams?: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// API response wrappers
// ---------------------------------------------------------------------------

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
