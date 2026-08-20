export type DashboardNavItem = {
  label: string;
  href: string;
  icon: string;
};

export const ADMIN_NAV: DashboardNavItem[] = [
  {label:"Ringkasan",href:"/dashboard/admin",icon:"⌂"},
  {label:"Notifikasi",href:"/dashboard/admin/notifikasi",icon:"✦"},
  {label:"Pendaftaran & Bayar",href:"/dashboard/admin/pendaftaran",icon:"¤"},
  {label:"Siswa",href:"/dashboard/admin/siswa",icon:"◎"},
  {label:"Orang Tua/Wali",href:"/dashboard/admin/orangtua",icon:"♡"},
  {label:"Tutor",href:"/dashboard/admin/tutor",icon:"◇"},
  {label:"Kelas & Jadwal",href:"/dashboard/admin/kelas",icon:"▦"},
  {label:"Kalender",href:"/dashboard/admin/kalender",icon:"◫"},
  {label:"Materi",href:"/dashboard/admin/materi",icon:"▤"},
  {label:"Tryout",href:"/dashboard/admin/tryout",icon:"◉"},
  {label:"Bank Soal",href:"/dashboard/admin/bank-soal",icon:"✎"},
  {label:"Laporan",href:"/dashboard/admin/laporan",icon:"↗"},
  {label:"Audit & Backup",href:"/dashboard/admin/audit",icon:"⌁"},
  {label:"Pengaturan",href:"/dashboard/admin/pengaturan",icon:"⚙"},
];

export const TUTOR_NAV: DashboardNavItem[] = [
  {label:"Ringkasan",href:"/dashboard/tutor",icon:"⌂"},
  {label:"Notifikasi",href:"/dashboard/tutor/notifikasi",icon:"✦"},
  {label:"Kelas",href:"/dashboard/tutor/kelas",icon:"▦"},
  {label:"Jadwal",href:"/dashboard/tutor/jadwal",icon:"◷"},
  {label:"Kalender",href:"/dashboard/tutor/kalender",icon:"◫"},
  {label:"Pesan",href:"/dashboard/tutor/pesan",icon:"✉"},
  {label:"Materi",href:"/dashboard/tutor/materi",icon:"▤"},
  {label:"Tugas",href:"/dashboard/tutor/tugas",icon:"✓"},
  {label:"Absensi",href:"/dashboard/tutor/absensi",icon:"◎"},
  {label:"Nilai",href:"/dashboard/tutor/nilai",icon:"★"},
  {label:"Pengaturan",href:"/dashboard/tutor/pengaturan",icon:"⚙"},
];

export const STUDENT_NAV: DashboardNavItem[] = [
  {label:"Ringkasan",href:"/dashboard/siswa",icon:"⌂"},
  {label:"Notifikasi",href:"/dashboard/siswa/notifikasi",icon:"✦"},
  {label:"Langganan",href:"/dashboard/siswa/langganan",icon:"¤"},
  {label:"Profil Saya",href:"/dashboard/siswa/profil",icon:"◇"},
  {label:"Kalender",href:"/dashboard/siswa/kalender",icon:"◫"},
  {label:"Pesan",href:"/dashboard/siswa/pesan",icon:"✉"},
  {label:"Kelas Saya",href:"/dashboard/siswa/kelas",icon:"▦"},
  {label:"Materi",href:"/dashboard/siswa/materi",icon:"▤"},
  {label:"Tugas",href:"/dashboard/siswa/tugas",icon:"✓"},
  {label:"Tryout",href:"/dashboard/siswa/tryout",icon:"◉"},
  {label:"Analisis",href:"/dashboard/siswa/analisis",icon:"↗"},
  {label:"Ranking",href:"/dashboard/siswa/ranking",icon:"★"},
  {label:"Sertifikat",href:"/dashboard/siswa/sertifikat",icon:"♢"},
  {label:"Pengaturan",href:"/dashboard/siswa/pengaturan",icon:"⚙"},
];


export const PARENT_NAV: DashboardNavItem[] = [
  {label:"Ringkasan",href:"/dashboard/orangtua",icon:"⌂"},
  {label:"Notifikasi",href:"/dashboard/orangtua/notifikasi",icon:"✦"},
  {label:"Kehadiran",href:"/dashboard/orangtua/kehadiran",icon:"◎"},
  {label:"Perkembangan",href:"/dashboard/orangtua/perkembangan",icon:"↗"},
  {label:"Transcript",href:"/dashboard/orangtua/transkrip",icon:"▤"},
  {label:"Kalender",href:"/dashboard/orangtua/kalender",icon:"◫"},
  {label:"Pesan Tutor",href:"/dashboard/orangtua/pesan",icon:"✉"},
  {label:"Pengaturan",href:"/dashboard/orangtua/pengaturan",icon:"⚙"},
];
