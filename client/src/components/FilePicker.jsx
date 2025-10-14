/* eslint-disable react/prop-types */
// import React from 'react'

import { useState, useMemo } from "react";
import CustomButton from "./CustomButton";

const FilePicker = ({ file, setFile, readFile }) => {
  const [previewUrl, setPreviewUrl] = useState("");

  const fileInfo = useMemo(() => {
    if (!file) return null;
    const { name = "", size = 0, type = "" } = file;
    const niceSize = size
      ? `${(size / 1024).toFixed(size > 1024 * 1024 ? 2 : 1)} KB`
      : "—";
    return { name, size: niceSize, type };
  }, [file]);

  const handleFileChange = (event) => {
    const picked = event.target.files?.[0] || null;
    if (!picked) {
      setFile("");
      setPreviewUrl("");
      return;
    }

    if (!picked.type.startsWith("image/")) {
      alert("Please upload a PNG or JPG image.");
      event.target.value = "";
      setFile("");
      setPreviewUrl("");
      return;
    }

    setFile(picked);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result?.toString() || "");
    };
    reader.readAsDataURL(picked);
  };

  return (
    <div className="filepicker-container">
      <div className="flex h-full flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Upload a design</p>
          <p className="text-xs text-slate-600">
            Supported formats: PNG or JPG. Keep file below 5 MB for best results.
          </p>
        </div>

        <label
          htmlFor="file-upload"
          className="filepicker-upload-area"
        >
          <input
            id="file-upload"
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleFileChange}
            className="sr-only"
          />
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <span className="rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              Choose File
            </span>
            <p className="text-xs text-slate-600">
              Drag & drop or click to replace your design
            </p>
          </div>
        </label>

        {fileInfo && (
          <div className="filepicker-meta">
            <p className="text-sm font-semibold text-slate-900 truncate">{fileInfo.name}</p>
            <p className="text-xs text-slate-600">
              {fileInfo.size} • {fileInfo.type || "Unknown type"}
            </p>
          </div>
        )}

        {previewUrl && (
          <div className="filepicker-preview">
            <img
              src={previewUrl}
              alt="Design preview"
              className="h-full w-full object-contain"
            />
          </div>
        )}

        <div className="flex items-center justify-center">
          <CustomButton
            type="custom"
            title="Insert Image"
            disabled={!file}
            handleClick={() => readFile("logo")}
            customStyles="w-full justify-center text-[12px] font-semibold uppercase tracking-wide border-2 border-zinc-900 rounded-lg py-2 bg-zinc-900 text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
};

export default FilePicker;
