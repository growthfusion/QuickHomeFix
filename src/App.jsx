import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Home from './features/select_service/page/Home.jsx'; 
import RoofingEstimate from './features/select_service/page/RoofingEstimate.jsx';
import Form from '@/backed_db/features/leads/Form.jsx';

function App() {
  return (
    <Routes>


      <Route path='/' element={<Home />} />
      
      <Route path='/get-quotes' element={<RoofingEstimate />} />
      <Route path='/get-quotes/roof' element={<RoofingEstimate />} />
      <Route path='/get-quotes/gutter' element={<RoofingEstimate />} />
      <Route path='/get-quotes/solar' element={<RoofingEstimate />} />
      <Route path='/get-quotes/windows' element={<RoofingEstimate />} />
      <Route path='/get-quotes/bath' element={<RoofingEstimate />} />
      <Route path='/get-quotes/tub' element={<RoofingEstimate />} />
      <Route path='/get-quotes/shower' element={<RoofingEstimate />} />
      <Route path='/get-quotes/complete' element={<RoofingEstimate />} />



      <Route path='/dash/form_leads' element={<Form />} />

      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}

export default App;
