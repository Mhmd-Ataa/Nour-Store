import React from "react";
import "./LoadingScreen.css";

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">

        <div className="loading-brand">
          <img src="./images/595885079_891088616816731_6891525580904720580_n-removebg-preview.png" alt="" />
        </div>

        <div className="loading-line">
          <div className="loading-line-progress"></div>
        </div>

      </div>
    </div>
  );
}