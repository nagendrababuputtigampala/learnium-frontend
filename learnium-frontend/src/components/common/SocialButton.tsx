import React from 'react';

interface SocialButtonProps {
  provider: 'google' | 'facebook';
  onClick: () => void;
  children: React.ReactNode;
}

export const SocialButton: React.FC<SocialButtonProps> = ({ provider, onClick, children }) => {
  const styles = {
    google: 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300',
    facebook: 'bg-[#1877F2] hover:bg-[#166FE5] text-white',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg ${styles[provider]}`}
    >
      {children}
    </button>
  );
};
