import React, { useState } from 'react';
import './StarRating.css';

export default function StarRating({ value = 0, onChange, readOnly = false }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= (hovered || value) ? 'filled' : ''}`}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          onClick={() => !readOnly && onChange && onChange(star)}
          role={readOnly ? undefined : 'button'}
          aria-label={`Rate ${star} out of 5`}
        >
          ★
        </span>
      ))}
    </div>
  );
}
