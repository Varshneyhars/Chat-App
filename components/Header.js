// components/Header.js
import React from 'react';

const Header = ({ title }) => {
  return (
    <div className="bg-blue-600 text-white py-2 px-4 shadow-md"> {/* Adjusted padding */}
      <h1 className="text-lg font-bold"> {/* Adjusted font size */}
        {title}
      </h1>
    </div>
  );
};

export default Header;
