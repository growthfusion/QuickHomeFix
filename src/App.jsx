import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Home from './features/select_service/page/Home.jsx'; 
import RoofingEstimate from './features/select_service/page/RoofingEstimate.jsx';
import Form from '@/backed_db/features/leads/Form.jsx';

function App() {
  return (
    <Routes>


      <Route path='/' element={<Home />} />
      
      <Route path='/quote' element={<RoofingEstimate />} />
      <Route path='/quote/roof' element={<RoofingEstimate />} />
      <Route path='/quote/gutter' element={<RoofingEstimate />} />
      <Route path='/quote/solar' element={<RoofingEstimate />} />
      <Route path='/quote/windows' element={<RoofingEstimate />} />
      <Route path='/quote/bath' element={<RoofingEstimate />} />
      <Route path='/quote/tub' element={<RoofingEstimate />} />
      <Route path='/quote/shower' element={<RoofingEstimate />} />
      <Route path='/quote/complete' element={<RoofingEstimate />} />



      <Route path='/dash/form_leads' element={<Form />} />

      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}

export default App;
