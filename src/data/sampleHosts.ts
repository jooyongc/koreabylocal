export interface Host {
  name: string;
  city: string;
  rating: string;
  img: string;
  langs: string[];
}

// TODO(db): replace with `hosts` table once the schema is applied.
export const SAMPLE_HOSTS: Host[] = [
  { name: "Jiwon K.", city: "Seoul", rating: "4.98", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80", langs: ["EN", "KR", "JP"] },
  { name: "Minho P.", city: "Busan", rating: "4.95", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80", langs: ["EN", "KR"] },
  { name: "Soyeon L.", city: "Jeju", rating: "4.99", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80", langs: ["EN", "KR", "CN"] },
  { name: "Daniel R.", city: "Seoul", rating: "4.97", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80", langs: ["EN", "KR", "ES"] },
];
