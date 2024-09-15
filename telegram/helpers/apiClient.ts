import axios from 'axios';
import { apiUrl } from '../config';
import { apiKey } from '../config';



// Create a fetch client with default headers
export const apiClient = async (method, path, data ) => {
  const url = `${apiUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'api_key': apiKey,
  };


  const response = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
	console.log(response);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export default apiClient;


