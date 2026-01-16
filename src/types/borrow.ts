export type BorrowStatus =
  | "pending"
  | "approved"
  | "borrowed"
  | "returned"
  | "overdue"
  | "lost"

export type AssetType =
  | "headset"
  | "yubikey"
  | "keyboard"
  | "mouse"
  | "laptop"
  | "monitor"
  | "lan_cable"
  | "hdmi"
  | "power_cable"
  | "projector"
  | "projector_screen"
  | "led_tv"
  | "flashdrive"
  | "ups"
  | "type_c_adaptor"
  | "nuc"
  | "other"

export interface BorrowRequest {
  id: string
  request_code: string
  ticket_id: string
  borrower_name: string
  borrower_email: string
  department?: string | null
  asset_type: AssetType
  asset_label?: string | null
  reason?: string | null
  status: BorrowStatus
  borrowed_at: string
  due_at: string
  returned_at?: string | null
  it_owner?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}
