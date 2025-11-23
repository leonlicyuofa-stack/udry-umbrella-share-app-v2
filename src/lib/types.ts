
import { z } from 'zod';
import type { Timestamp, GeoPoint } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';

// This represents the structure of the User document in Firestore.
// It includes Firebase Auth properties and custom app-specific fields.
export interface User extends Partial<FirebaseUser> {
  // Financial and usage fields from Firestore
  deposit?: number;
  balance?: number;
  depositPaymentIntentId?: string | null; // Added to store the Stripe transaction ID
  hasHadFirstFreeRental?: boolean;
  activeRental?: ActiveRental | null;
  createdAt?: any; // Firestore timestamp
  isManuallyVerified?: boolean; // New flag for manual verification override
}

export interface Stall {
  id: string; // Document ID in Firestore, often the same as dvid
  name: string;
  dvid: string; // The physical machine's Device ID
  btName: string; // The advertised Bluetooth device name, e.g., "UDRY-MK001"
  location: GeoPoint; // Use Firestore's GeoPoint type
  address: string;
  availableUmbrellas: number;
  totalUmbrellas: number;
  // This is a unified counter for both get and return actions.
  // The app increments this value in Firestore after each successful command.
  // The Admin test card uses this value for both get and return tests.
  nextActionSlot: number; 
  isDeployed: boolean; // Controls visibility on the map
}

// A simple log entry structure
export interface RentalLog {
  timestamp: number;
  message: string;
  type: 'sent' | 'received' | 'info' | 'error';
}

// Represents an ongoing rental, stored in the User document.
export interface ActiveRental {
  stallId: string;
  stallName: string;
  startTime: number; // Unix timestamp for when the rental began
  isFree?: boolean; // Flag for the first free rental
  logs?: RentalLog[]; // Buffer for machine responses during the rental
}

// Represents a completed rental, stored in the top-level 'rentals' collection.
export interface RentalHistory {
    rentalId: string; // The document ID of this rental history item
    userId: string;
    stallId: string;
    stallName: string;
    startTime: number;
    isFree?: boolean;
    endTime: number;
    durationHours: number;
    finalCost: number;
    returnedToStallId: string;
    returnedToStallName: string;
    logs: RentalLog[]; // Logs are now an array within the document
}

// Log entry for machine events in a subcollection.
export interface MachineLog {
    id: string;
    type: 'sent' | 'received' | 'info' | 'error';
    message: string;
    timestamp: Timestamp;
}

// Sign Up Form Data
export const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});
export type SignUpFormData = z.infer<typeof signUpSchema>;

// Sign In Form Data
export const signInSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});
export type SignInFormData = z.infer<typeof signInSchema>;

// Change Password Form Data
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }).min(6, { message: "Current password must be at least 6 characters." }),
  newPassword: z.string().min(1, { message: "New password is required." }).min(6, { message: "New password must be at least 6 characters." }),
  confirmNewPassword: z.string().min(1, { message: "Confirm new password is required." }).min(6, { message: "Confirm new password must be at least 6 characters." }),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"], // path of error
});
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
