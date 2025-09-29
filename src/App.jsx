import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from './features/select_service/page/Home.jsx'; 
import ServiceSelection from './features/select_service/page/OptionServices.jsx';
import RoofingEstimate from './features/select_service/page/RoofingEstimate.jsx';
import CompleteStep from './components/steps/complete-step.jsx';

function App() {
  return (
      <Routes>
        
        <Route path='/' element={<Home />} />
        <Route path='/roofing' element={<RoofingEstimate />} />
        <Route path='/complete' element={<CompleteStep />} />
      
      </Routes>
  );
}

export default App;
