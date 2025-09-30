import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Home from './features/select_service/page/Home.jsx'; 
import RoofingEstimate from './features/select_service/page/RoofingEstimate.jsx';
import CompleteStep from './components/steps/complete-step.jsx';

import GutterTypeStep from './components/steps/gutter-type-step.jsx';
import GutterMaterialStep from './components/steps/gutter-material.jsx';
import RoofingTypeStep from './components/steps/roofing-type-step.jsx';
import SolarTypeStep from './components/steps/solar-type-step.jsx';
import WindowServiceStep from './components/steps/window-type-step.jsx';
import WallOptionCard from './components/steps/bathroom-wall.jsx';
import WalkinTypeStep from './components/steps/walk-type-step.jsx';

function App() {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      
      {/* Main form route */}
      <Route path='/roofing' element={<RoofingEstimate />} />
      
      {/* Step-specific routes - all render RoofingEstimate which handles the state sync */}
      <Route path='/complete' element={<RoofingEstimate />} />
      <Route path='/gutter-type' element={<RoofingEstimate />} />
      <Route path='/gutter-material' element={<RoofingEstimate />} />
      <Route path='/roofing-type' element={<RoofingEstimate />} />
      <Route path='/solar-type' element={<RoofingEstimate />} />
      <Route path='/window-type' element={<RoofingEstimate />} />
      <Route path='/wall-option' element={<RoofingEstimate />} />
      <Route path='/walkin-type' element={<RoofingEstimate />} />
      
      {/* Catch-all route */}
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}

export default App;
