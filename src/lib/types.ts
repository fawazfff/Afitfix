export type ComplaintStatus =
  | "submitted"
  | "under_review"
  | "assigned"
  | "in_progress"
  | "awaiting_confirmation"
  | "resolved"
  | "reopened";

export type ComplaintCategory =
  | "Electricity"
  | "Water & Plumbing"
  | "Classroom"
  | "Hostel"
  | "Laboratory"
  | "Cleanliness"
  | "Internet"
  | "Other";

export type UserRole = "student" | "admin";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  matric_number: string | null;
  role: UserRole;
}

export interface Complaint {
  id: string;
  tracking_code: string;
  user_id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  location: string;
  image_url: string | null;
  status: ComplaintStatus;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, "full_name"> | null;
  vote_count?: number;
  comment_count?: number;
}
