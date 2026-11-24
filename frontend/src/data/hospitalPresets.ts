export interface HospitalPreset {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  totalBeds: number;
  occupiedBeds: number;
  phone: string;
}

export const REAL_HOSPITAL_PRESETS: HospitalPreset[] = [
  {
    id: 'HOSP-RUBY',
    name: 'Ruby Hall Clinic',
    address: '40, Sassoon Road, Sangamvadi, Pune, Maharashtra 411001',
    city: 'Pune',
    latitude: 18.5326,
    longitude: 73.8777,
    totalBeds: 120,
    occupiedBeds: 78,
    phone: '+91 20 6645 5100',
  },
  {
    id: 'HOSP-KEM',
    name: 'KEM Hospital & Research Centre',
    address: '489, Sardar Moodliar Road, Rasta Peth, Pune, Maharashtra 411011',
    city: 'Pune',
    latitude: 18.5236,
    longitude: 73.8688,
    totalBeds: 90,
    occupiedBeds: 55,
    phone: '+91 20 6603 7300',
  },
  {
    id: 'HOSP-JEHANGIR',
    name: 'Jehangir Hospital',
    address: '32, Sassoon Road, Opposite Pune Railway Station, Pune, Maharashtra 411001',
    city: 'Pune',
    latitude: 18.5307,
    longitude: 73.8762,
    totalBeds: 85,
    occupiedBeds: 48,
    phone: '+91 20 6681 9999',
  },
  {
    id: 'HOSP-SASSOON',
    name: 'Sassoon General Hospital & BJ Government Medical College',
    address: 'Near Pune Railway Station, Jai Prakash Narayan Road, Pune, Maharashtra 411001',
    city: 'Pune',
    latitude: 18.5284,
    longitude: 73.8739,
    totalBeds: 150,
    occupiedBeds: 95,
    phone: '+91 20 2612 8000',
  },
  {
    id: 'HOSP-DEENANATH',
    name: 'Deenanath Mangeshkar Hospital & Research Center',
    address: 'Near Mhatre Bridge, Erandwane, Pune, Maharashtra 411004',
    city: 'Pune',
    latitude: 18.5028,
    longitude: 73.8296,
    totalBeds: 100,
    occupiedBeds: 62,
    phone: '+91 20 4015 1000',
  },
  {
    id: 'HOSP-POONA',
    name: 'Poona Hospital and Research Centre',
    address: '27, Ganjwe Chowk, Sadashiv Peth, Pune, Maharashtra 411030',
    city: 'Pune',
    latitude: 18.5132,
    longitude: 73.8475,
    totalBeds: 70,
    occupiedBeds: 40,
    phone: '+91 20 2433 1707',
  },
  {
    id: 'HOSP-SAHYADRI',
    name: 'Sahyadri Super Speciality Hospital',
    address: 'Plot No. 30 C, Erandvane, Karve Road, Deccan Gymkhana, Pune, Maharashtra 411004',
    city: 'Pune',
    latitude: 18.5158,
    longitude: 73.8370,
    totalBeds: 75,
    occupiedBeds: 42,
    phone: '+91 20 6721 5000',
  },
  {
    id: 'HOSP-METRO',
    name: 'Metro Trauma & Tertiary Care Hospital',
    address: 'Shivajinagar, Pune, Maharashtra 411005',
    city: 'Pune',
    latitude: 18.5204,
    longitude: 73.8567,
    totalBeds: 60,
    occupiedBeds: 38,
    phone: '+91 20 2553 4000',
  },
  {
    id: 'HOSP-LILAVATI',
    name: 'Lilavati Hospital & Research Centre',
    address: 'A-791, Bandra Reclamation, Bandra West, Mumbai, Maharashtra 400050',
    city: 'Mumbai',
    latitude: 19.0514,
    longitude: 72.8295,
    totalBeds: 110,
    occupiedBeds: 74,
    phone: '+91 22 2675 1000',
  },
  {
    id: 'HOSP-AIIMS',
    name: 'AIIMS Trauma Center',
    address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi 110029',
    city: 'Delhi',
    latitude: 28.5672,
    longitude: 77.2100,
    totalBeds: 200,
    occupiedBeds: 160,
    phone: '+91 11 2658 8500',
  },
];
