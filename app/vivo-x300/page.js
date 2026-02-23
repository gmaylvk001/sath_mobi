"use client";
import { useState, useEffect } from "react";

import LandingpageComponent from "@/components/landingpage/vivo-x300";


export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div className="bg-linear-to-r from-linearyellow via-white to-linearyellow">
      
      <LandingpageComponent /> 
    </div>
  );
}
