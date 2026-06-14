// Concrete row types
export type Artist = {
  name: string;        // Hebrew name (primary)
  name_en?: string;    // English name
  instrument?: string;    // Hebrew instrument
  instrument_en?: string; // English instrument
};

export type Concert = {
  id: string;
  band_name: string;      // Hebrew band name (primary)
  band_name_en?: string;  // English band name
  artists: Artist[];
  title_en: string;
  title_he: string;
  date: string;
  location_en: string;
  location_he: string;
  description_en: string;
  description_he: string;
  details_en: string;
  details_he: string;
  capacity: number;
  price_nis: number;
  poster_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type Registration = {
  id: string;
  concert_id: string;
  full_name: string;
  phone: string;
  email: string;
  spots: number;
  checked_in: boolean;
  checked_in_at: string | null;
  on_waitlist: boolean;
  created_at: string;
};

export type ConcertStats = {
  totalSpots: number;
  registrations: number;
  checkedIn: number;
  waitlist: number;
};

export type ConcertWithStats = Concert & { stats: ConcertStats };

// Full Supabase Database shape
export type Database = {
  public: {
    Tables: {
      concerts: {
        Row: Concert;
        Insert: Omit<Concert, "id" | "created_at">;
        Update: Partial<Omit<Concert, "id" | "created_at">>;
        Relationships: [];
      };
      registrations: {
        Row: Registration;
        Insert: Omit<
          Registration,
          "id" | "checked_in" | "checked_in_at" | "created_at"
        >;
        Update: Partial<Omit<Registration, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
