"use client";

import { useEffect } from "react";

const RazorpayOffers = ({ amount }) => {
  useEffect(() => {
    const scriptId = "razorpay-affordability-script";
    const widgetId = "razorpay-affordability-widget";
    const key = process.env.NEXT_PUBLIC_RAZORPAY_LIVE_KEY || process.env.NEXT_PUBLIC_RAZORPAY_TEST_KEY;
    const widgetEl = document.getElementById(widgetId);

    if (!widgetEl || !key || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return undefined;
    }

    const initializeWidget = () => {
      if (typeof window.RazorpayAffordabilitySuite === "undefined") {
        return;
      }

      widgetEl.innerHTML = "";
      const rzpAffordabilitySuite = new window.RazorpayAffordabilitySuite({
        key,
        amount: Math.round(Number(amount) * 100),
      });
      rzpAffordabilitySuite.render();
    };

    const existingScript = document.getElementById(scriptId);
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.razorpay.com/widgets/affordability/affordability.js";
      script.async = true;
      script.onload = initializeWidget;
      script.onerror = () => {
        widgetEl.innerHTML = "";
      };
      document.body.appendChild(script);
    } else if (typeof window.RazorpayAffordabilitySuite !== "undefined") {
      initializeWidget();
    } else {
      existingScript.addEventListener("load", initializeWidget, { once: true });
    }

    return () => {
      existingScript?.removeEventListener("load", initializeWidget);
    };
  }, [amount]);

  return (
    <div>
      
   {/*   <h4 className="py-3"> AVAILABLE OFFERS</h4> */}
      <div id="razorpay-affordability-widget"></div>
    </div>
  );
};

export default RazorpayOffers;
