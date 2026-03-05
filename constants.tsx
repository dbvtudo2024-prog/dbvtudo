
import React from 'react';

export const PROFILE_KEY = `dbv_tudo_global_user_profile`;

export const COLORS = {
  primary: '#dc371b', // Novo Vermelho DBV
  secondary: '#800000', // Novo Vinho/Marrom AVT
  accent: '#fbc02d', // Yellow
};

// Logo for Pathfinders (Desbravadores) - Adicionado drop-shadow para efeito "sombreado"
export const PathfinderLogo = () => (
  <img 
    src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png" 
    alt="Desbravadores"
    className="w-16 h-16 object-contain drop-shadow-[0_4px_10px_rgba(220,55,27,0.3)]"
  />
);

// Logo for Adventurers (Aventureiros) - Adicionado drop-shadow para efeito "sombreado"
export const AdventurerLogo = () => (
  <img 
    src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png" 
    alt="Aventureiros"
    className="w-16 h-16 object-contain drop-shadow-[0_4px_10px_rgba(128,0,0,0.3)]"
  />
);

export const AppLogo = () => (
  <div className="flex flex-col items-center">
    <div className="relative w-40 h-40 flex items-center justify-center">
       <img 
         src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/logo%20app.PNG" 
         alt="DBV Tudo Logo"
         className="w-full h-full object-contain"
       />
    </div>
  </div>
);
