// Database types matching the MySQL schema from the PHP project

export type UserRole = 'user' | 'admin' | 'mechanic'

export type MaintenanceStatus =
  | 'pending'
  | 'awaiting_approval'
  | 'requisitioning'
  | 'repairing'
  | 'in_progress'
  | 'completed'
  | 'rejected'

export type RequisitionStatus = 'pending' | 'approved' | 'rejected'
export type GeneralRequestStatus = 'pending' | 'in_progress' | 'completed' | 'rejected'

export interface User {
  id: string
  username: string
  email: string
  full_name: string | null
  role: UserRole
  affiliation: string | null
  rank: string | null
  phone_number: string | null
  is_verified: boolean
  is_initial_setup_complete: boolean
  created_at: string
}

export interface Vehicle {
  id: string
  vehicle_name: string
  license_plate: string
  vehicle_image_path: string | null
  project_affiliation: string | null
  created_at: string
}

export interface Part {
  id: string
  part_name_th: string
  part_id: string | null
  quantity: number
  standard_lifespan_days: number
  part_image_path: string | null
  part_text_th: string | null
  created_at: string
}

export interface VehiclePart {
  id: string
  vehicle_id: string
  part_id: string
  install_date: string
  status: string
  created_at: string
  // Joined fields
  part?: Part
  vehicle?: Vehicle
}

export interface MaintenanceRequest {
  id: string
  vehicle_part_id: string
  reported_by_user_id: string
  report_details: string
  status: MaintenanceStatus
  is_urgent: boolean
  image_path: string | null
  assigned_to_user_id: string | null
  admin_notes: string | null
  request_date: string
  completed_at: string | null
  created_at: string
  // Joined fields
  reporter?: User
  assignee?: User
  vehicle_part?: VehiclePart
}

export interface PartRequisition {
  id: string
  maintenance_request_id: string
  part_id: string
  quantity_requested: number
  requested_by_user_id: string
  status: RequisitionStatus
  approved_by_user_id: string | null
  created_at: string
  // Joined fields
  part?: Part
  requester?: User
  maintenance_request?: MaintenanceRequest
}

export interface GeneralRequest {
  id: string
  user_id: string
  request_type: string
  subject: string
  details: string
  status: GeneralRequestStatus
  admin_notes: string | null
  created_at: string
  // Joined fields
  user?: User
}

export interface Post {
  id: string
  title: string
  content: string
  featured_image_path: string | null
  author_id: string
  project_affiliation: string | null
  created_at: string
  // Joined fields
  author?: User
}
