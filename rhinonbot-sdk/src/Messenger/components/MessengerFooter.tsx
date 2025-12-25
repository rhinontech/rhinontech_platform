// MessengerFooter - Footer component showing "Powered by Rhinon"
import React, { memo } from 'react';

interface MessengerFooterProps {
  effectiveTheme: 'light' | 'dark';
}

export const MessengerFooter: React.FC<MessengerFooterProps> = memo(({ effectiveTheme }) => {
  return (
    <div className='footer'>
      <p>Powered by</p>
      <img
        src={
          effectiveTheme === 'dark'
            ? 'https://rhinon.tech/assets/rhinonlogo.png'
            : 'https://rhinontech.s3.ap-south-1.amazonaws.com/rhinon-live/Logo_Rhinon_Tech_Dark+2.png'
        }
        alt='Rhinon Logo'
        style={{ width: 50 }}
        loading='lazy'
      />
    </div>
  );
});

MessengerFooter.displayName = 'MessengerFooter';

export default MessengerFooter;
