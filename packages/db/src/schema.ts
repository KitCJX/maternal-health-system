import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

const id = uuid("id").primaryKey().defaultRandom();

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const userRoleEnum = pgEnum("user_role", ["admin", "staff", "patient"]);
export const pregnancyStatusEnum = pgEnum("pregnancy_status", ["active", "delivered", "terminated"]);
export const childSexEnum = pgEnum("child_sex", ["male", "female"]);
export const notificationChannelEnum = pgEnum("notification_channel", ["line", "sms", "email"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["scheduled", "completed", "cancelled", "no_show"]);
export const dspmResultEnum = pgEnum("dspm_result", ["normal", "suspect_delay", "referred"]);

// ---------------------------------------------------------------------------
// Staff & auth
// Clinic staff (nurses, doctors, admin) — login with username/password
// ---------------------------------------------------------------------------

export const staff = pgTable("staff", {
  id,
  username: varchar("username", { length: 255 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  nameTh: varchar("name_th", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }),
  role: userRoleEnum("role").default("staff").notNull(),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Patients
// Pregnant mothers / parents — identified by Hospital Number (HN)
// LINE uid is linked when patient connects their LINE account
// ---------------------------------------------------------------------------

export const patients = pgTable("patients", {
  id,
  hn: varchar("hn", { length: 20 }).unique().notNull(), // e.g. "ARC-2025-0001"
  nameTh: varchar("name_th", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }),
  dob: text("dob").notNull(), // YYYY-MM-DD
  idCard: varchar("id_card", { length: 13 }).unique(), // Thai national ID (13 digits)
  phone: varchar("phone", { length: 20 }),
  lineUid: text("line_uid").unique(), // set when patient links LINE account
  address: text("address"),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Pregnancies
// Each patient can have multiple pregnancies (sequential)
// LMP = Last Menstrual Period, EDD = Estimated Due Date
// ---------------------------------------------------------------------------

export const pregnancies = pgTable("pregnancies", {
  id,
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  lmp: text("lmp").notNull(), // YYYY-MM-DD
  edd: text("edd").notNull(), // YYYY-MM-DD (calculated: LMP + 280 days)
  gaAtRegistration: integer("ga_at_registration"), // gestational age in weeks at 1st visit
  gravida: integer("gravida"), // total number of pregnancies (including this one)
  para: integer("para"), // number of previous births
  status: pregnancyStatusEnum("status").default("active").notNull(),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Antenatal visits (ฝากครรภ์)
// Recorded by staff at each prenatal checkup
// BP = blood pressure, FHR = fetal heart rate
// ---------------------------------------------------------------------------

export const antenatalVisits = pgTable("antenatal_visits", {
  id,
  pregnancyId: uuid("pregnancy_id").references(() => pregnancies.id).notNull(),
  staffId: uuid("staff_id").references(() => staff.id),
  visitDate: text("visit_date").notNull(), // YYYY-MM-DD
  gaWeeks: integer("ga_weeks"), // gestational age at this visit
  weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
  bpSystolic: integer("bp_systolic"),
  bpDiastolic: integer("bp_diastolic"),
  fhr: integer("fhr"), // fetal heart rate (BPM)
  fundalHeight: numeric("fundal_height", { precision: 4, scale: 1 }), // cm
  fetalPresentation: varchar("fetal_presentation", { length: 50 }),
  complaints: text("complaints"),
  notes: text("notes"),
  nextVisitDate: text("next_visit_date"),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Risk factors (ปัจจัยเสี่ยง)
// 27 risk factors assessed at 1st antenatal visit (from handbook)
// Stored as individual rows so we can query specific risks easily
// ---------------------------------------------------------------------------

export const riskFactors = pgTable("risk_factors", {
  id,
  pregnancyId: uuid("pregnancy_id").references(() => pregnancies.id).notNull(),
  factorCode: varchar("factor_code", { length: 10 }).notNull(), // e.g. "R01"–"R27"
  factorNameTh: text("factor_name_th").notNull(),
  present: boolean("present").default(false).notNull(),
  notes: text("notes"),
  assessedAt: text("assessed_at"), // visit date
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Lab results (ผลการตรวจทางห้องปฏิบัติการ)
// Covers: CBC, blood type, HIV, HBsAg, VDRL, rubella, etc.
// ---------------------------------------------------------------------------

export const labResults = pgTable("lab_results", {
  id,
  pregnancyId: uuid("pregnancy_id").references(() => pregnancies.id).notNull(),
  testType: varchar("test_type", { length: 50 }).notNull(), // "CBC", "HIV", "HBsAg", etc.
  resultValue: text("result_value"), // raw result (text to handle varied formats)
  unit: varchar("unit", { length: 30 }),
  isAbnormal: boolean("is_abnormal").default(false),
  testedDate: text("tested_date").notNull(),
  notes: text("notes"),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// GDM screening (คัดกรองเบาหวานขณะตั้งครรภ์)
// 50g GCT → if ≥140 mg/dL → 100g OGTT or 75g OGTT
// ---------------------------------------------------------------------------

export const gdmScreenings = pgTable("gdm_screenings", {
  id,
  pregnancyId: uuid("pregnancy_id").references(() => pregnancies.id).notNull(),
  method: varchar("method", { length: 20 }).notNull(), // "50g_GCT", "75g_OGTT", "100g_OGTT"
  gaWeeks: integer("ga_weeks"),
  screenedDate: text("screened_date").notNull(),
  fbs: numeric("fbs", { precision: 5, scale: 1 }), // fasting blood sugar mg/dL
  hr1: numeric("hr_1", { precision: 5, scale: 1 }), // 1-hour value
  hr2: numeric("hr_2", { precision: 5, scale: 1 }), // 2-hour value
  hr3: numeric("hr_3", { precision: 5, scale: 1 }), // 3-hour (100g OGTT only)
  result: varchar("result", { length: 20 }), // "normal", "abnormal", "GDM"
  notes: text("notes"),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Ultrasound records (ผลอัลตราซาวด์)
// ---------------------------------------------------------------------------

export const ultrasoundRecords = pgTable("ultrasound_records", {
  id,
  pregnancyId: uuid("pregnancy_id").references(() => pregnancies.id).notNull(),
  gaWeeks: integer("ga_weeks"),
  scanDate: text("scan_date").notNull(),
  bpd: numeric("bpd", { precision: 4, scale: 1 }), // biparietal diameter mm
  fl: numeric("fl", { precision: 4, scale: 1 }), // femur length mm
  ac: numeric("ac", { precision: 5, scale: 1 }), // abdominal circumference mm
  efwGrams: integer("efw_grams"), // estimated fetal weight
  fhr: integer("fhr"),
  placentaLocation: varchar("placenta_location", { length: 100 }),
  findings: text("findings"),
  imageUrl: text("image_url"), // stored in Cloudflare R2
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Maternal vaccinations (วัคซีนสำหรับหญิงตั้งครรภ์)
// Handbook covers: Tdap/aP, dT
// ---------------------------------------------------------------------------

export const maternalVaccines = pgTable("maternal_vaccines", {
  id,
  pregnancyId: uuid("pregnancy_id").references(() => pregnancies.id).notNull(),
  staffId: uuid("staff_id").references(() => staff.id),
  vaccineCode: varchar("vaccine_code", { length: 20 }).notNull(), // "Tdap", "dT", "aP"
  doseNumber: integer("dose_number").default(1),
  lotNumber: varchar("lot_number", { length: 50 }),
  expiryDate: text("expiry_date"),
  givenDate: text("given_date").notNull(),
  gaWeeks: integer("ga_weeks"),
  site: varchar("site", { length: 50 }), // injection site
  notes: text("notes"),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Kick count diary (บันทึกการนับลูกดิ้น)
// Patient self-records fetal movements 3x/day
// ---------------------------------------------------------------------------

export const kickCountLogs = pgTable("kick_count_logs", {
  id,
  pregnancyId: uuid("pregnancy_id").references(() => pregnancies.id).notNull(),
  logDate: text("log_date").notNull(), // YYYY-MM-DD
  morning: integer("morning"), // kick count (morning)
  afternoon: integer("afternoon"),
  evening: integer("evening"),
  notes: text("notes"),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Children (เด็ก)
// Created at birth — linked to mother's patient + pregnancy record
// ---------------------------------------------------------------------------

export const children = pgTable("children", {
  id,
  patientId: uuid("patient_id").references(() => patients.id).notNull(), // mother
  pregnancyId: uuid("pregnancy_id").references(() => pregnancies.id),
  nameTh: varchar("name_th", { length: 255 }),
  dob: text("dob").notNull(), // YYYY-MM-DD
  sex: childSexEnum("sex").notNull(),
  birthWeightGrams: integer("birth_weight_grams"),
  birthLengthCm: numeric("birth_length_cm", { precision: 4, scale: 1 }),
  hct: numeric("hct", { precision: 4, scale: 1 }), // hematocrit at birth
  mbTest: varchar("mb_test", { length: 20 }), // methylene blue test result
  drugAllergy: text("drug_allergy"),
  dischargeDate: text("discharge_date"),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Child vaccinations — EPI schedule (วัคซีนตามแผน EPI)
// Thai EPI: BCG, HBV, OPV, IPV, DTP, MMR, JE, Rota, PCV, Varicella, HPV
// ---------------------------------------------------------------------------

export const vaccinations = pgTable("vaccinations", {
  id,
  childId: uuid("child_id").references(() => children.id).notNull(),
  staffId: uuid("staff_id").references(() => staff.id),
  vaccineCode: varchar("vaccine_code", { length: 20 }).notNull(),
  doseNumber: integer("dose_number").notNull(),
  scheduledDate: text("scheduled_date"), // when it was due
  givenDate: text("given_date").notNull(),
  lotNumber: varchar("lot_number", { length: 50 }),
  expiryDate: text("expiry_date"),
  site: varchar("site", { length: 50 }),
  reaction: text("reaction"),
  notes: text("notes"),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Growth records (บันทึกการเจริญเติบโต)
// Plotted on WHO/Thai growth charts; z-scores calculated at API level
// ---------------------------------------------------------------------------

export const growthRecords = pgTable("growth_records", {
  id,
  childId: uuid("child_id").references(() => children.id).notNull(),
  staffId: uuid("staff_id").references(() => staff.id),
  measuredDate: text("measured_date").notNull(),
  ageMonths: integer("age_months"),
  weightKg: numeric("weight_kg", { precision: 5, scale: 3 }),
  heightCm: numeric("height_cm", { precision: 5, scale: 1 }),
  hcCm: numeric("hc_cm", { precision: 4, scale: 1 }), // head circumference
  weightZScore: numeric("weight_z_score", { precision: 4, scale: 2 }),
  heightZScore: numeric("height_z_score", { precision: 4, scale: 2 }),
  nutritionStatus: varchar("nutrition_status", { length: 30 }), // e.g. "ขาดอาหาร"
  notes: text("notes"),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// DSPM assessments (การคัดกรองพัฒนาการ)
// Screened at 9, 18, 30, 42, 60 months by staff
// items_json: array of {itemId, passed: boolean}
// ---------------------------------------------------------------------------

export const dspmAssessments = pgTable("dspm_assessments", {
  id,
  childId: uuid("child_id").references(() => children.id).notNull(),
  staffId: uuid("staff_id").references(() => staff.id),
  assessedDate: text("assessed_date").notNull(),
  ageMonths: integer("age_months").notNull(), // 9 | 18 | 30 | 42 | 60
  itemsJson: jsonb("items_json"), // [{itemId, passed}]
  result: dspmResultEnum("result").notNull(),
  referralNote: text("referral_note"),
  usesDaim: boolean("uses_daim").default(false), // true for high-risk children
  ...timestamps,
});

// ---------------------------------------------------------------------------
// EPDS — Edinburgh Postnatal Depression Scale (ภาวะซึมเศร้าหลังคลอด)
// 10 questions, each scored 0–3; total ≥13 = high risk
// ---------------------------------------------------------------------------

export const epdsScreenings = pgTable("epds_screenings", {
  id,
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  staffId: uuid("staff_id").references(() => staff.id),
  screenedDate: text("screened_date").notNull(),
  answersJson: jsonb("answers_json").notNull(), // [0..3] × 10 items
  totalScore: integer("total_score").notNull(),
  riskLevel: varchar("risk_level", { length: 20 }).notNull(), // "low", "medium", "high"
  referralNeeded: boolean("referral_needed").default(false),
  notes: text("notes"),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Alcohol screening (คัดกรองการดื่มสุรา)
// ---------------------------------------------------------------------------

export const alcoholScreenings = pgTable("alcohol_screenings", {
  id,
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  staffId: uuid("staff_id").references(() => staff.id),
  screenedDate: text("screened_date").notNull(),
  everDrank: boolean("ever_drank").notNull(),
  referralNeeded: boolean("referral_needed").default(false),
  notes: text("notes"),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Child dental records (บันทึกสุขภาพช่องปากเด็ก)
// ---------------------------------------------------------------------------

export const dentalRecords = pgTable("dental_records", {
  id,
  childId: uuid("child_id").references(() => children.id).notNull(),
  visitDate: text("visit_date").notNull(),
  findings: text("findings"),
  brushingFrequency: varchar("brushing_frequency", { length: 30 }), // "twice_daily", etc.
  fluorideToothpaste: boolean("fluoride_toothpaste"),
  nextAppointment: text("next_appointment"),
  notes: text("notes"),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Appointments & reminders
// ---------------------------------------------------------------------------

export const appointments = pgTable("appointments", {
  id,
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  childId: uuid("child_id").references(() => children.id),
  pregnancyId: uuid("pregnancy_id").references(() => pregnancies.id),
  staffId: uuid("staff_id").references(() => staff.id),
  type: varchar("type", { length: 50 }).notNull(), // "antenatal", "vaccination", "growth", "dspm"
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  status: appointmentStatusEnum("status").default("scheduled").notNull(),
  notes: text("notes"),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notifications = pgTable("notifications", {
  id,
  recipientPatientId: uuid("recipient_patient_id").references(() => patients.id),
  channel: notificationChannelEnum("channel").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "appointment_reminder", "vaccine_due", etc.
  content: text("content").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  status: varchar("status", { length: 20 }).default("pending"), // "pending", "sent", "failed"
  ...timestamps,
});
