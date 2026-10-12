"use client";
import { ChangeEvent, useState } from "react";

export default function Uploadfile() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errormessage, setErrormessage] = useState("");

  const uploadFile = async (selectedFile: File) => {
    const formData = new FormData();
    formData.append("file", selectedFile);

    setStatus("uploading");

    try {
      const response = await fetch("https://api.example.com/upload", {
        method: "POST",
        body: formData,
        // Do NOT set 'Content-Type': 'multipart/form-data' header manually.
        // The browser automatically sets it along with the required boundary string.
      });

      if (!response.ok) {
        throw new Error("Upload failed.");
      }

      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrormessage(error instanceof Error ? error.message : "Upload failed.");
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;

    if (!selectedFile) {
      setFile(null);
      setStatus("error");
      setErrormessage("Please select a valid file.");
      return;
    }

    setFile(selectedFile);
    setErrormessage("");
    void uploadFile(selectedFile);
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      {status === "uploading" && <p>Uploading...</p>}
      {status === "success" && file && <p>Uploaded file: {file.name}</p>}
      {status === "error" && <p>{errormessage}</p>}
    </div>
  );
}