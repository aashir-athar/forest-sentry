// Hand-written Supabase types that mirror migrations 0001 + 0002.
// Generate the canonical version any time with:
//   supabase gen types typescript --linked > backend/types/database.generated.ts
export type Role = 'ranger' | 'researcher';
export type HealthLabel = 'healthy' | 'stressed' | 'diseased' | 'pest';
export type IncidentSeverity = 'observation' | 'minor' | 'serious' | 'critical';
export type ProtectionLevel = 'monitor' | 'restricted' | 'core';

export interface ZoneRow {
  id: string;
  name: string;
  protection_level: ProtectionLevel;
  boundary: { lat: number; lng: number }[];
  area_hectares: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TreeRow {
  id: string;
  species: string;
  lat: number;
  lng: number;
  girth_cm: number | null;
  height_m: number | null;
  notes: string | null;
  photo_uri: string | null;
  last_health_score: number | null;
  last_health_label: HealthLabel | null;
  zone_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InspectionRow {
  id: string;
  tree_id: string;
  health_score: number;
  health_label: HealthLabel;
  confidence: number | null;
  notes: string | null;
  photo_uri: string | null;
  inferred_on_device: boolean;
  created_by: string | null;
  created_at: string;
}

export interface IncidentRow {
  id: string;
  severity: IncidentSeverity;
  lat: number;
  lng: number;
  inside_zone_id: string | null;
  notes: string | null;
  photo_uri: string | null;
  created_by: string | null;
  created_at: string;
}

export interface RangerZoneAssignmentRow {
  user_id: string;
  zone_id: string;
  assigned_at: string;
}

export interface Database {
  public: {
    Tables: {
      zones: { Row: ZoneRow; Insert: Omit<ZoneRow, 'created_at' | 'updated_at'>; Update: Partial<ZoneRow> };
      trees: { Row: TreeRow; Insert: Omit<TreeRow, 'created_at' | 'updated_at'>; Update: Partial<TreeRow> };
      inspections: { Row: InspectionRow; Insert: Omit<InspectionRow, 'created_at'>; Update: Partial<InspectionRow> };
      incidents: { Row: IncidentRow; Insert: Omit<IncidentRow, 'created_at'>; Update: Partial<IncidentRow> };
      ranger_zone_assignments: { Row: RangerZoneAssignmentRow; Insert: Omit<RangerZoneAssignmentRow, 'assigned_at'>; Update: Partial<RangerZoneAssignmentRow> };
    };
  };
}
