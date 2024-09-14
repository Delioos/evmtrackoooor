import dotenv from 'dotenv';
dotenv.config();

export const token = process.env.TG_TOKEN;
export const adminId = process.env.ADMIN_ID;
export const apiUrl = process.env.API_URL || 'http://localhost:8080';
export const wsUrl = process.env.WS_URL || 'ws://localhost:8081/ws';
export const apiKey = process.env.API_KEY || 'meow meow';
