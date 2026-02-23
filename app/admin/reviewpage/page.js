"use client";
import { useState, useEffect } from "react";

import ReviewComponent from "@/app/admin/components/reviewpage/reviewpage";


export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <ReviewComponent /> {/* Use the category component here */}
    </div>
  );
}
