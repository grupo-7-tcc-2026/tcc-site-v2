import { DragEvent, useRef, useState } from "react";
import { Check, ImagePlus, Upload } from "lucide-react";

const acceptedFileTypes = ["image/png", "image/jpeg", "image/webp"];

export default function UploadFile() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const selectFile = (file: File | undefined) => {
        if (file && acceptedFileTypes.includes(file.type)) {
            setSelectedFile(file);
        }
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        selectFile(event.dataTransfer.files[0]);
    };

    return (
        <div
            role="button"
            tabIndex={0}
            aria-label="Enviar uma foto"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    inputRef.current?.click();
                }
            }}
            onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
                if (event.currentTarget === event.target) {
                    setIsDragging(false);
                }
            }}
            onDrop={handleDrop}
            className={`group flex h-full min-h-[300px] w-full cursor-pointer flex-col items-center justify-center rounded-[15px] border transition-colors focus:outline-none focus:ring-2 focus:ring-white/40 ${
                isDragging
                    ? "border-white/60 bg-white/[0.06]"
                    : "border-white/20 bg-[#191919] hover:border-white/40 hover:bg-[#1d1d1d]"
            }`}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(event) => selectFile(event.target.files?.[0])}
            />

            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 text-[#999] transition-colors group-hover:border-white/35 group-hover:text-white">
                {selectedFile ? <Check size={28} strokeWidth={1.5} /> : <Upload size={28} strokeWidth={1.5} />}
            </div>

            {selectedFile ? (
                <>
                    <p className="max-w-[85%] truncate text-sm font-semibold text-white">{selectedFile.name}</p>
                    <p className="mt-2 text-xs text-[#858585]">Clique para escolher outra foto</p>
                </>
            ) : (
                <>
                    <p className="text-sm font-semibold text-[#aaa] transition-colors group-hover:text-white">
                        Clique ou arraste uma foto
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-[#777]">
                        <ImagePlus size={13} />
                        PNG, JPG, WEBP
                    </p>
                </>
            )}
        </div>
    );
}