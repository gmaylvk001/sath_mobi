"use client";
import { useState, useEffect } from "react";

import AllstoreComponent from "@/components/all-store/all-store";

export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      <h1 className="container mx-auto px-4 pt-8 text-2xl font-bold text-gray-900 sm:text-3xl">
        All Stores
      </h1>
      <AllstoreComponent />
    </div>
  );
}
