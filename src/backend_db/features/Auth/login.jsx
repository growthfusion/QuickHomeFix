import React from "react";

export default function Login(){
  return(
    <>
     <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-2xl shadow-sm w-80">
        <h1 className="text-2xl font-semibold text-center mb-5">Login</h1>
        {/* <p className="text-gray-500 px-4 py-4  bg-gray-50 mb-6">Quickhomefix backed  dashbaord</p> */}
        <input type="text" 
         placeholder="Email"
         className="w-full p-2 border rounded-md mb-3 focus:outline-none"
        />
        <input type="password" 
         placeholder="Password"
         className="w-full p-2 border rounded-md mb-3 focus:outline-none"
        />
        <button className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600">Login</button>

      </div>
     </div>
    </>
  )
}