import PocketBase from 'pocketbase';
import { TypedPocketBase } from '../types/pocketbase.types';

const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

// Initialize the PocketBase client with the server URL
export const pb = new PocketBase(pbUrl) as TypedPocketBase;

// Enable auto-cancellation to prevent hanging requests by default
pb.autoCancellation(true);
