import React from "react";
import "./LoadingScreen.css";

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">

        <div className="loading-brand">
          NOUR STORE
        </div>

        <div className="loading-line">
          <div className="loading-line-progress"></div>
        </div>

      </div>
    </div>
  );
}