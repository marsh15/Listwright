import { FileSpreadsheet, FileUp, ShieldCheck } from "lucide-react";
import { useDropzone } from "react-dropzone";

type Sample = { label: string; path: string };

export function UploadDropzone({
  onFile,
  samples,
  onLoadSample,
  rowLimit,
}: {
  onFile: (file: File) => void;
  samples: Sample[];
  onLoadSample: (path: string) => void;
  rowLimit: number;
}) {
  const { getRootProps, getInputProps, isDragActive, isDragReject, open } = useDropzone({
    accept: { "text/csv": [".csv"] },
    multiple: false,
    onDrop: (files) => files[0] && onFile(files[0]),
  });

  return (
    <>
      <div {...getRootProps({ className: `dropzone ${isDragActive ? "drag-active" : ""} ${isDragReject ? "drag-reject" : ""}` })}>
        <input {...getInputProps()} aria-label="Choose CSV file" />
        <div className="upload-glyph" aria-hidden="true"><FileUp size={24} /></div>
        <strong>{isDragActive ? "Release to inspect this CSV" : "Drop a CSV to begin"}</strong>
        <span>Review columns and sample rows before anything leaves this screen.</span>
        <button type="button" className="secondary-button" onClick={(event) => { event.stopPropagation(); open(); }}>
          Choose a CSV file
        </button>
        <small><FileSpreadsheet size={13} aria-hidden="true" /> CSV only · up to {rowLimit.toLocaleString()} rows</small>
      </div>

      <div className="sample-row" aria-label="Sample CSV quick loads">
        <span>Need a starting point?</span>
        {samples.map((sample) => (
          <button key={sample.path} type="button" className="secondary-button" onClick={() => onLoadSample(sample.path)}>
            Load {sample.label}
          </button>
        ))}
      </div>

      <div className="notice">
        <ShieldCheck size={16} aria-hidden="true" />
        <div><strong>Preview first, process second</strong><span>Backend validation and AI extraction begin only after your explicit confirmation.</span></div>
      </div>
    </>
  );
}
