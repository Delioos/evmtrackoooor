import dotenv from 'dotenv';
dotenv.config();

export const token = process.env.TG_TOKEN;
export const adminId = process.env.ADMIN_ID;
export const apiUrl = process.env.API_URL || 'http://localhost:8080';


