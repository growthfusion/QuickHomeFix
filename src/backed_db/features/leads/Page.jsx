import React from 'react'
import Header from '@/backed_db/components/header/Header';
import DatePickerToggle from "@/backed_db/components/date/DatePicker";
import FilterSelect from "@/backed_db/components/filters/Filter";
import Hide from '../Hide/Hide';


import Form from './Form'
import Source from './Source'
import Buyer from './Buyer';
import Landing from './Landing';
import Widget from './Widget_id';
import Teaser from './Teaser_id';
import Campaign from './Campaign_id';
import Title from './Title';
import Placement from './Placement';
import State from './State';
import Device from './Device';
import Os from './Os';

function Page() {
  return (
    <>
    
    <Header/>
    <DatePickerToggle/>
    <Hide />
    <FilterSelect />
    <div className='bg-gray-50 pb-[8%]'>
    <Form />
    <Source />
    <Buyer />
    <Landing />
    <Widget />
    <Teaser />
    <Campaign />
    <Title />
    <Placement />
    <State />
    <Device />
    <Os />
    </div>
   </>
  )
}

export default Page