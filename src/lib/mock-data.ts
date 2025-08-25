
import type { Stall } from './types';
import { GeoPoint } from 'firebase/firestore';

// Hong Kong locations for mock stalls.
// NOTE: Location data now uses `latitude` and `longitude` to match Firestore's GeoPoint object structure.
export const mockStalls: (Omit<Stall, 'id' | 'location'> & { location: { latitude: number, longitude: number } })[] = [
  // --- Mong Kok Stalls ---
  {
    dvid: 'MK001',
    btName: 'UDRY-MK001',
    name: 'Langham Place',
    location: { latitude: 22.3188, longitude: 114.1685 },
    address: '8 Argyle Street, Mong Kok, Kowloon',
    availableUmbrellas: 15,
    totalUmbrellas: 20,
    nextActionSlot: 1,
    isDeployed: true,
  },
  {
    dvid: 'MK002',
    btName: 'UDRY-MK002',
    name: 'Sai Yeung Choi St South',
    location: { latitude: 22.3175, longitude: 114.1698 },
    address: 'Near Shantung Street, Mong Kok',
    availableUmbrellas: 8,
    totalUmbrellas: 15,
    nextActionSlot: 1,
    isDeployed: true,
  },
  // --- Tsim Sha Tsui Stalls ---
  {
    dvid: 'TST001',
    btName: 'UDRY-TST001',
    name: 'Harbour City',
    location: { latitude: 22.2959, longitude: 114.1687 },
    address: '3-27 Canton Road, Tsim Sha Tsui, Kowloon',
    availableUmbrellas: 25,
    totalUmbrellas: 30,
    nextActionSlot: 1,
    isDeployed: true,
  },
  {
    dvid: 'TST002',
    btName: 'UDRY-TST002',
    name: 'K11 MUSEA',
    location: { latitude: 22.2938, longitude: 114.1732 },
    address: '18 Salisbury Road, Tsim Sha Tsui, Kowloon',
    availableUmbrellas: 18,
    totalUmbrellas: 25,
    nextActionSlot: 1,
    isDeployed: true,
  },
  // --- Central Stalls ---
  {
    dvid: 'CEN001',
    btName: 'UDRY-CEN001',
    name: 'IFC Mall',
    location: { latitude: 22.2850, longitude: 114.1585 },
    address: '8 Finance Street, Central, Hong Kong Island',
    availableUmbrellas: 28,
    totalUmbrellas: 30,
    nextActionSlot: 1,
    isDeployed: true,
  },
  // --- Causeway Bay Stalls ---
  {
    dvid: 'CWB001',
    btName: 'UDRY-CWB001',
    name: 'SOGO Causeway Bay',
    location: { latitude: 22.2800, longitude: 114.1841 },
    address: '555 Hennessy Road, Causeway Bay, Hong Kong Island',
    availableUmbrellas: 22,
    totalUmbrellas: 25,
    nextActionSlot: 1,
    isDeployed: true,
  },
   // --- Non-deployed Stall for testing ---
  {
    dvid: 'TEST001',
    btName: 'UDRY-TEST001',
    name: 'Testing Machine (Lab)',
    location: { latitude: 22.2612, longitude: 114.1292 }, // Cyberport
    address: 'Cyberport 3, 100 Cyberport Road, Telegraph Bay',
    availableUmbrellas: 19,
    totalUmbrellas: 20,
    nextActionSlot: 1,
    isDeployed: false,
  },
];


// Default map center to Hong Kong
export const defaultMapCenter = { lat: 22.3193, lng: 114.1694 };
