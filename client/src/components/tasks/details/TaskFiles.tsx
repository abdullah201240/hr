import React from "react";
import { Paperclip, File, Download, Trash2 } from "lucide-react";

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedByName?: string | null;
}

interface TaskFilesProps {
  attachments: Attachment[] | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteFile: (fileId: string) => void;
}

export const TaskFiles: React.FC<TaskFilesProps> = ({
  attachments,
  onFileUpload,
  onDeleteFile,
}) => {
  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center hover:border-primary/60 transition-colors relative cursor-pointer">
        <input
          type="file"
          onChange={onFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Paperclip className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 block">Drag files here or click to upload</span>
        <span className="text-[10px] text-slate-400">Simulator supports files up to 25MB</span>
      </div>

      <div className="space-y-2">
        {attachments && attachments.length > 0 ? (
          attachments.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/10 dark:bg-slate-900/5">
              <div className="flex items-center gap-2">
                <File className="w-4 h-4 text-primary" />
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-700 dark:text-slate-350">{file.fileName}</span>
                  <span className="text-[9px] text-slate-400">
                    {Math.round(file.fileSize / 1024)} KB • uploaded by {file.uploadedByName || "User"}
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <a href={file.fileUrl} target="_blank" rel="noreferrer" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                  <Download className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => onDeleteFile(file.id)} className="p-1 hover:bg-rose-500/10 rounded text-slate-400 hover:text-rose-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-slate-400 italic">No attachments uploaded yet.</div>
        )}
      </div>
    </div>
  );
};
