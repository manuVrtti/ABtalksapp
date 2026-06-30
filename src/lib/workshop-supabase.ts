import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const workshopSupabase = createClient(supabaseUrl, supabaseAnonKey);

export interface WorkshopConfig {
  zoomLink: string;
  whatsappLink: string;
  webinarDate: string;
  webinarTime: string;
  webinarTargetUtc: string;
}

const FALLBACK_CONFIG: WorkshopConfig = {
  zoomLink: "#",
  whatsappLink: "https://chat.whatsapp.com/LDUvHRIlb5dGHpDJLueR9i?s=cl&p=a&mlu=0&amv=0",
  webinarDate: "July 11, 2026",
  webinarTime: "4:00 PM IST",
  webinarTargetUtc: "2026-07-11T10:30:00Z",
};

export async function getWorkshopConfig(): Promise<WorkshopConfig> {
  const { data, error } = await workshopSupabase
    .from("workshop_config")
    .select("zoom_link, whatsapp_link, webinar_date, webinar_time, webinar_target_utc")
    .single();
  if (error || !data) return FALLBACK_CONFIG;
  return {
    zoomLink: data.zoom_link,
    whatsappLink: data.whatsapp_link,
    webinarDate: data.webinar_date,
    webinarTime: data.webinar_time,
    webinarTargetUtc: data.webinar_target_utc,
  };
}
