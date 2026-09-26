import React from "react";
import "./LoadingScreen.css";

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">

        <div className="loading-brand">
          𝓝𝓸𝓾𝓻 𝑺𝒕𝒐𝒓𝒆
        </div>

        <div className="loading-line">
          <div className="loading-line-progress"></div>
        </div>

      </div>
    </div>
  );
}