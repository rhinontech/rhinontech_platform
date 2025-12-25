/**
 * MessengerFooter - Powered by Rhinon footer
 */
import React from 'react';

interface MessengerFooterProps {
  theme: 'light' | 'dark';
}

export const MessengerFooter: React.FC<MessengerFooterProps> = ({ theme }) => {
  const logoSrc = theme === 'dark'
    ? 'https://rhinon.tech/assets/rhinonlogo.png'
    : 'https://rhinontech.s3.ap-south-1.amazonaws.com/rhinon-live/Logo_Rhinon_Tech_Dark+2.png';

  return (
    <div className='footer'>
      <p>Powered by</p>
      <img
        src={logoSrc}
        alt='Rhinon Logo'
        style={{ width: 50 }}
      />
    </div>
  );
};

export default MessengerFooter;
