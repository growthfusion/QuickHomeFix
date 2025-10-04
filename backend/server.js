import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import cors from 'cors';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.warn('Warning: GOOGLE_API_KEY is not set in environment variables');
}

app.get('/api/places/autocomplete', async (req, res) => {
  try {
    const { input } = req.query;
    if (!input) {
      return res.status(400).json({ error: 'Input parameter is required' });
    }
    
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/autocomplete/json',
      {
        params: {
          input: input,
          key: GOOGLE_API_KEY
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Error with Places API:', error.message);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

app.get('/api/places/details', async (req, res) => {
  try {
    const { place_id } = req.query;
    if (!place_id) {
      return res.status(400).json({ error: 'place_id parameter is required' });
    }
    
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: place_id,
          fields: 'address_component,formatted_address',  
          key: GOOGLE_API_KEY
        }
      }
    );
    
    const addressComponents = response.data.result.address_components || [];
    const formattedAddress = response.data.result.formatted_address || '';
    
    const addressData = {
      street: '',
      city: '',
      state: '',
      zipcode: ''
    };
    
    let streetNumber = '';
    let route = '';
    
    addressComponents.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        streetNumber = component.long_name;
      } else if (types.includes('route')) {
        route = component.long_name;
      } else if (types.includes('locality')) {
        addressData.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        addressData.state = component.short_name;
      } else if (types.includes('postal_code')) {
        addressData.zipcode = component.long_name;
      }
    });
    
    if (streetNumber && route) {
      addressData.street = `${streetNumber} ${route}`.trim();
    } 
    else if (formattedAddress) {
      const parts = formattedAddress.split(',');
      if (parts.length >= 1) {
        addressData.street = parts[0].trim();
      }
      
      if (!addressData.city && parts.length >= 2) {
        const cityPart = parts[1].trim();
        addressData.city = cityPart.split(' ')[0]; 
      }
    }
    
    if (!addressData.street && (addressData.city || addressData.state)) {
      addressData.street = formattedAddress.split(',')[0] || "Address details incomplete";
    }
    
    res.json(addressData);
  } catch (error) {
    console.error('Error with Place Details API:', error.message);
    res.status(500).json({ error: 'Failed to fetch place details' });
  }
});

app.get('/', (req, res) => {
  res.send('Server is running properly');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
