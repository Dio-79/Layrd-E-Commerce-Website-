"use client";

import { ChangeEvent, useState } from "react";
import { useEventOrder } from "@/app/context/EventOrdercontext";
import styles from "./event.module.css";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export default function Uploadfile() {
  const { file, setFile } = useEventOrder();
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;

    if (!selected) {
      setFile(null);
      setErrorMessage("");
      return;
    }
    if (selected.size > MAX_BYTES) {
      setFile(null);
      setErrorMessage("That file is over 10 MB. Choose a smaller one.");
      e.target.value = "";
      return;
    }

    setFile(selected);
    setErrorMessage("");
  };

  return (
    <div className={styles.uploadRow}>
      {file && <span className={styles.fileName}>{file.name}</span>}
      {errorMessage && <span className={styles.error}>{errorMessage}</span>}
      <label className={styles.upload}>
        Upload custom labels
        <input type="file" onChange={handleFileChange} />
      </label>
    </div>
  );
}