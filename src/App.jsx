import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Home from './features/select_service/page/Home.jsx'; 
import RoofingEstimate from './features/select_service/page/RoofingEstimate.jsx';

//backed dash board
import Form from '@/backed_db/features/leads/Form.jsx';
import LeadFull from './backed_db/features/LeadsFull/LeadsFull.jsx';
import FormStpes from './backed_db/features/Forms/form_stpes/FormStpes.jsx';
import PreSales from './backed_db/features/Forms/pre_sales/PreSales.jsx';
import Statistics from './backed_db/features/Bucket_Affiliate/statistics/Statistics.jsx';
import Settings from './backed_db/features/Bucket_Affiliate/settings/Settings.jsx';
import Page from './backed_db/features/leads/Page.jsx';

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
