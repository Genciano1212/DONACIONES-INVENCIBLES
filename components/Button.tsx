import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon,
  className = '',
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5 focus:ring-blue-500 shadow-blue-200",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:ring-gray-400",
    danger: "bg-red-600 text-white hover:bg-red-700 hover:-translate-y-0.5 focus:ring-red-500 shadow-red-200",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 hover:-translate-y-0.5 focus:ring-emerald-500 shadow-emerald-200",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`} 
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};