import axios from 'axios';
import { apiUrl } from '../config';
import { apiKey } from '../config';

// TODO: Don't use axios, instead use fetch from bun / native node 
export const apiClient = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
    'api_key': apiKey,
  },
});


