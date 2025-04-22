import React from "react";

export function Logo({ collapsed }) {
  return (
    <div
      style={{
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#800020", // Fondo burdeos
        color: "#fff", // Texto blanco
        fontSize: "18px",
        fontWeight: "bold",
      }}
    >
      {collapsed ? "L" : "Logo"}
    </div>
  );
}
