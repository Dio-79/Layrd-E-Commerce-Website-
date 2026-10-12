"use client";

import React from 'react';
import styles from './event.module.css';

// The Submit button sits outside both forms in the design,
// so it submits the event form and the comment form together.
export default function SubmitButton() {
  const submitAll = () => {
    (document.getElementById('selection-form') as HTMLFormElement | null)?.requestSubmit();
    (document.getElementById('comment-form') as HTMLFormElement | null)?.requestSubmit();
  };

  return React.createElement(
    'button',
    {
      type: 'button',
      className: styles.submit,
      onClick: submitAll,
    },
    'Submit'
  );
}
