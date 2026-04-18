import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const ActionCenter: React.FC = () => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    // Logic to handle user action
    console.log('Action submitted:', input);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white rounded-lg shadow-md"
    >
      <h2 className="text-xl font-bold mb-4">Action Center</h2>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
        placeholder="Enter debt/income..."
      />
      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Submit
      </button>
    </motion.div>
  );
};
