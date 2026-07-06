"use client";

import { useRef, useState } from "react";

type Status = "active" | "inactive";

type Institution = {
  id: string;
  code: string;
  name: string;
  description: string;
  color: string;
  logo: string | null; // data URL
  status: Status;
  createdAt: string;
};

function formatDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const DEFAULT_COLOR = "#E4E7EC";

export default function InstitutionManagementPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // form state
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [logo, setLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setCode("");
    setName("");
    setDescription("");
    setColor(DEFAULT_COLOR);
    setLogo(null);
    setError(null);
  }

  function openModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    resetForm();
  }

  function handleLogoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleCreate() {
    if (!code.trim() || !name.trim()) {
      setError("Institution ID and Institution name are required.");
      return;
    }
    const newInstitution: Institution = {
      id: crypto.randomUUID(),
      code: code.trim(),
      name: name.trim(),
      description: description.trim(),
      color,
      logo,
      status: "active",
      createdAt: formatDate(new Date()),
    };
    setInstitutions((prev) => [...prev, newInstitution]);
    closeModal();
  }

  function updateStatus(id: string, status: Status) {
    setInstitutions((prev) =>
      prev.map((inst) => (inst.id === id ? { ...inst, status } : inst))
    );
  }

  function handleSaveAll() {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1500);
  }

  return (
    <div className="min-h-screen  py-1 sm:px-2">
      <div className="mx-auto max-w-15xl rounded-2xl border border-[#E7E9ED] bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EDEFF2] px-6 py-4">
          <h1 className="text-[15px] font-semibold text-[#111318]">
            Institution Management
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={openModal}
              aria-label="Add institution"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D8DBE0] text-[#3C4046] transition hover:border-[#B8BCC4] hover:bg-[#F7F8FA] active:scale-95"
            >
              <PlusIcon />
            </button>
            <button
              onClick={handleSaveAll}
              className="rounded-full border border-[#BFE8D4] px-5 py-1.5 text-[13px] font-semibold tracking-wide text-[#1AAE6F] transition hover:bg-[#F0FBF5] active:scale-95"
            >
              {savedFlash ? "SAVED" : "SAVE"}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto px-6 pb-8 pt-2">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="text-[12px] uppercase tracking-wide text-[#9AA0A8]">
                <th className="w-20 py-3 font-medium">Logo</th>
                <th className="w-36 py-3 font-medium">Institution Code</th>
                <th className="w-56 py-3 font-medium">Institution</th>
                <th className="py-3 font-medium">Description</th>
                <th className="w-24 py-3 font-medium">Color</th>
                <th className="w-32 py-3 font-medium">Status</th>
                <th className="w-44 py-3 font-medium">Created At</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((inst) => (
                <tr key={inst.id} className="border-t border-[#F1F2F4]">
                  <td className="py-4">
                    <div
                      className="h-9 w-9 overflow-hidden rounded-full bg-[#E4E7EC]"
                      style={{
                        backgroundImage: inst.logo
                          ? `url(${inst.logo})`
                          : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  </td>
                  <td className="py-4 text-[14px] font-semibold text-[#111318]">
                    {inst.code}
                  </td>
                  <td className="py-4 text-[14px] font-semibold text-[#111318]">
                    {inst.name}
                  </td>
                  <td className="py-4 text-[14px] text-[#5B616B]">
                    {inst.description || "—"}
                  </td>
                  <td className="py-4">
                    <div
                      className="h-7 w-7 rounded-md border border-[#00000010]"
                      style={{ backgroundColor: inst.color }}
                    />
                  </td>
                  <td className="py-4">
                    <div className="relative inline-block">
                      <select
                        value={inst.status}
                        onChange={(e) =>
                          updateStatus(inst.id, e.target.value as Status)
                        }
                        className={`appearance-none rounded-md bg-transparent pr-5 text-[14px] font-semibold outline-none ${
                          inst.status === "active"
                            ? "text-[#1AAE6F]"
                            : "text-[#B0B4BA]"
                        }`}
                      >
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                      </select>
                      <ChevronIcon className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-current" />
                    </div>
                  </td>
                  <td className="py-4 text-[14px] font-semibold text-[#111318]">
                    {inst.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {institutions.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F2F4] text-[#9AA0A8]">
                <BuildingIcon />
              </div>
              <p className="text-[14px] font-medium text-[#5B616B]">
                No institutions yet
              </p>
              <p className="max-w-xs text-[13px] text-[#9AA0A8]">
                Add an institution to start managing its users, branding, and
                status.
              </p>
              <button
                onClick={openModal}
                className="mt-1 flex items-center gap-2 rounded-full border border-[#D8DBE0] px-4 py-1.5 text-[13px] font-semibold text-[#3C4046] transition hover:border-[#B8BCC4] hover:bg-[#F7F8FA]"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add institution
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-[#111318]">
                Add institution
              </h2>
              <button
                onClick={closeModal}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#9AA0A8] transition hover:bg-[#F1F2F4]"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Logo */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-dashed border-[#D8DBE0] bg-[#F7F8FA] bg-cover bg-center"
                  style={{
                    backgroundImage: logo ? `url(${logo})` : undefined,
                  }}
                  aria-label="Upload logo"
                >
                  {!logo && (
                    <span className="flex h-full w-full items-center justify-center text-[#9AA0A8]">
                      <UploadIcon />
                    </span>
                  )}
                </button>
                <div>
                  <p className="text-[13px] font-semibold text-[#111318]">
                    Logo
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[12px] font-medium text-[#1AAE6F] hover:underline"
                  >
                    {logo ? "Change image" : "Upload image"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoPick}
                  />
                </div>
              </div>

              {/* Institution ID */}
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium uppercase tracking-wide text-[#9AA0A8]">
                  Institution ID
                </span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. 27"
                  className="rounded-lg border border-[#E1E3E7] px-3 py-2 text-[14px] text-[#111318] outline-none transition focus:border-[#1AAE6F]"
                />
              </label>

              {/* Institution name */}
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium uppercase tracking-wide text-[#9AA0A8]">
                  Institution name
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. BAKAWAN Data Analytics"
                  className="rounded-lg border border-[#E1E3E7] px-3 py-2 text-[14px] text-[#111318] outline-none transition focus:border-[#1AAE6F]"
                />
              </label>

              {/* Description */}
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium uppercase tracking-wide text-[#9AA0A8]">
                  Description
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional notes about this institution"
                  rows={3}
                  className="resize-none rounded-lg border border-[#E1E3E7] px-3 py-2 text-[14px] text-[#111318] outline-none transition focus:border-[#1AAE6F]"
                />
              </label>

              {/* Color */}
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium uppercase tracking-wide text-[#9AA0A8]">
                  Color
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded-md border border-[#E1E3E7] bg-transparent p-0"
                  />
                  <input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 rounded-lg border border-[#E1E3E7] px-3 py-2 text-[14px] uppercase text-[#111318] outline-none transition focus:border-[#1AAE6F]"
                  />
                </div>
              </label>

              {error && (
                <p className="text-[13px] font-medium text-[#E0483C]">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="rounded-full px-4 py-2 text-[13px] font-semibold text-[#5B616B] transition hover:bg-[#F1F2F4]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="rounded-full bg-[#1AAE6F] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#149260] active:scale-95"
              >
                Add institution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlusIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`h-3.5 w-3.5 ${className}`}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
      <path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 21V6a1 1 0 011-1h6a1 1 0 011 1v15" />
      <path d="M14 21V10a1 1 0 011-1h4a1 1 0 011 1v11" />
      <path d="M2 21h20M7 8h1M7 12h1M7 16h1" />
    </svg>
  );
}