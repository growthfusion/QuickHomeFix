import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Home from './features/select_service/page/Home.jsx'; 
import RoofingEstimate from './features/select_service/page/RoofingEstimate.jsx';

//backed dash board
import LeadFull from './backend_db/features/LeadsFull/LeadsFull.jsx';
import FormStpes from './backend_db/features/Forms/form_stpes/FormStpes.jsx';
import PreSales from './backend_db/features/Forms/pre_sales/PreSales.jsx';
import Statistics from './backend_db/features/Bucket_Affiliate/statistics/Statistics.jsx';
import Settings from './backend_db/features/Bucket_Affiliate/settings/Settings.jsx';
import Page from './backend_db/features/leads/Page.jsx';
import Dash from './backend_db/features/dash/Page.jsx';
import Login from './backend_db/features/Auth/login.jsx';

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


   
   
       <Route path='/dash/form_leads' element={<Page/>}/>
       <Route path='/dash/login' element={<Login/>}/>
       <Route path='/dash' element={<Dash />} />
       <Route path='/dash/form_leads_full' element={<LeadFull />} />
       <Route path='/dash/forms/pre_sales' element={<FormStpes />} />
       <Route path='/dash/forms/form_steps' element={<PreSales />} />
       <Route path='/dash/bucket_affiliate_statistics' element={<Statistics />} />
       <Route path='/dash/bucket_affiliate_settings' element={<Settings />} />



      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}

export default App;
