"use client";

import { useEffect, useRef, useState } from "react";

import { addInstitution } from "../../../../services/integration/institution/post-add-insti";
import {
  getInstitutions,
  InstitutionResp,
} from "../../../../services/integration/institution/get-all-insti";
import { editInstitution } from "../../../../services/integration/institution/post-edit-insti-id";

type Status = "active" | "inactive";

type Institution = {
  id: string;
  code: string;
  name: string;
  description: string;
  color: string;
  logo: string | null;
  status: Status;
  createdAt: string;
};

type EditDraft = {
  code: string;
  name: string;
  description: string;
  color: string;
  logoFile: File | null;
  logoPreview: string | null;
};

const DEFAULT_COLOR = "#E4E7EC";
const DEFAULT_LOGO = "/images/idiyanale.png";

function mapFromApi(row: InstitutionResp): Institution {
  return {
    id: String(row.institution_id),
    code: row.institution_code,
    name: row.institution_name,
    description: row.description,
    color: DEFAULT_COLOR,
    logo: null,
    status: (row.status === "inactive" ? "inactive" : "active") as Status,
    createdAt: row.created_at ?? "",
  };
}

export default function InstitutionManagementPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Create modal state
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [logo, setLogo] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Edit mode
  const [isEditMode, setIsEditMode] = useState(false);

  const [drafts, setDrafts] = useState<Record<string, EditDraft>>({});

  const [isSavingAll, setIsSavingAll] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [activeLogoRowId, setActiveLogoRowId] = useState<string | null>(
    null
  );

  const editFileInputRef = useRef<HTMLInputElement>(null);

  // --------------------------------------------------
  // LOAD INSTITUTIONS
  // --------------------------------------------------

  async function loadInstitutions() {
    setIsLoadingList(true);
    setListError(null);

    try {
      const result = await getInstitutions();

      setInstitutions((result.response ?? []).map(mapFromApi));
    } catch (err) {
      setListError(
        err instanceof Error
          ? err.message
          : "Failed to load institutions."
      );
    } finally {
      setIsLoadingList(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInstitutions();
  }, []);

  // --------------------------------------------------
  // CREATE MODAL
  // --------------------------------------------------

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
    if (isSaving) return;

    setIsModalOpen(false);
    resetForm();
  }

  function handleLogoPick(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setLogo(reader.result as string);
    };

    reader.readAsDataURL(file);
  }

  async function handleCreate() {
    if (!code.trim() || !name.trim()) {
      setError(
        "Institution ID and Institution name are required."
      );
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await addInstitution({
        institution_code: code.trim(),
        institution_name: name.trim(),
        description: description.trim(),
      });

      closeModal();

      await loadInstitutions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add institution."
      );
    } finally {
      setIsSaving(false);
    }
  }

  // --------------------------------------------------
  // STATUS
  // --------------------------------------------------

  function updateStatus(id: string, status: Status) {
    setInstitutions((prev) =>
      prev.map((inst) =>
        inst.id === id
          ? {
              ...inst,
              status,
            }
          : inst
      )
    );
  }

  // --------------------------------------------------
  // EDIT MODE
  // --------------------------------------------------

  function updateDraft(
    id: string,
    patch: Partial<EditDraft>
  ) {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...patch,
      },
    }));
  }

  function enterEditMode() {
    const initial: Record<string, EditDraft> = {};

    institutions.forEach((inst) => {
      initial[inst.id] = {
        code: inst.code,
        name: inst.name,
        description: inst.description,
        color: inst.color,
        logoFile: null,
        logoPreview: inst.logo,
      };
    });

    setDrafts(initial);
    setSaveError(null);
    setIsEditMode(true);
  }

  function cancelEditMode() {
    if (isSavingAll) return;

    setDrafts({});
    setSaveError(null);
    setIsEditMode(false);
  }

  // --------------------------------------------------
  // EDIT LOGO
  // --------------------------------------------------

  function handleLogoPickShared(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file || !activeLogoRowId) return;

    const rowId = activeLogoRowId;

    const reader = new FileReader();

    reader.onload = () => {
      updateDraft(rowId, {
        logoFile: file,
        logoPreview: reader.result as string,
      });
    };

    reader.readAsDataURL(file);

    e.target.value = "";
  }

  // --------------------------------------------------
  // SAVE ALL CHANGES
  // --------------------------------------------------

  async function saveAllChanges() {
    const changed = institutions.filter((inst) => {
      const d = drafts[inst.id];

      if (!d) return false;

      return (
        d.code.trim() !== inst.code ||
        d.name.trim() !== inst.name ||
        d.description.trim() !== inst.description ||
        d.color !== inst.color ||
        d.logoFile !== null
      );
    });

    if (changed.length === 0) {
      setIsEditMode(false);
      setDrafts({});
      return;
    }

    const invalid = changed.find((inst) => {
      const d = drafts[inst.id];

      return !d.code.trim() || !d.name.trim();
    });

    if (invalid) {
      setSaveError(
        `"${invalid.name || invalid.code}" needs both an Institution ID and name.`
      );

      return;
    }

    setSaveError(null);
    setIsSavingAll(true);

    const results = await Promise.allSettled(
      changed.map((inst) => {
        const d = drafts[inst.id];

        return editInstitution(inst.id, {
          institution_code: d.code.trim(),
          institution_name: d.name.trim(),
          description: d.description.trim(),
          institution_color: d.color,
          logo: d.logoFile,
        });
      })
    );

    const failed = results.filter(
      (r): r is PromiseRejectedResult =>
        r.status === "rejected"
    );

    if (failed.length > 0) {
      const firstMessage =
        failed[0].reason instanceof Error
          ? failed[0].reason.message
          : "Unknown error";

      setSaveError(
        `${failed.length} of ${changed.length} institution(s) failed to save: ${firstMessage}`
      );

      setIsSavingAll(false);

      return;
    }

    await loadInstitutions();

    setDrafts({});
    setIsEditMode(false);
    setIsSavingAll(false);

    setSavedFlash(true);

    window.setTimeout(() => {
      setSavedFlash(false);
    }, 1500);
  }

  function handleHeaderButtonClick() {
    if (isSavingAll) return;

    if (isEditMode) {
      saveAllChanges();
    } else {
      enterEditMode();
    }
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen py-1 sm:px-2">
      <div className="mx-auto w-full max-w-[1600px] overflow-hidden rounded-2xl border border-[#E7E9ED] bg-white shadow-sm">
        {/* ----------------------------------------- */}
        {/* HEADER */}
        {/* ----------------------------------------- */}

        <div className="flex items-center justify-between border-b border-[#EDEFF2] px-6 py-4">
          <h1 className="text-[15px] font-semibold text-[#111318]">
            Institution Management
          </h1>

          <div className="flex items-center gap-3">
            {/* Add */}
            <button
              onClick={openModal}
              aria-label="Add institution"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D8DBE0] text-[#3C4046] transition hover:border-[#B8BCC4] hover:bg-[#F7F8FA] active:scale-95"
            >
              <PlusIcon />
            </button>

            {/* Cancel */}
            {isEditMode && (
              <button
                onClick={cancelEditMode}
                disabled={isSavingAll}
                className="text-[13px] font-medium text-[#9AA0A8] transition hover:text-[#5B616B] disabled:opacity-60"
              >
                Cancel
              </button>
            )}

            {/* Edit / Save */}
            <button
              onClick={handleHeaderButtonClick}
              disabled={isSavingAll}
              className="rounded-full border border-[#BFE8D4] px-5 py-1.5 text-[13px] font-semibold tracking-wide text-[#1AAE6F] transition hover:bg-[#F0FBF5] active:scale-95 disabled:opacity-60"
            >
              {isSavingAll
                ? "SAVING..."
                : savedFlash
                ? "SAVED"
                : isEditMode
                ? "SAVE"
                : "EDIT"}
            </button>
          </div>
        </div>

        {/* ----------------------------------------- */}
        {/* TABLE AREA */}
        {/* ----------------------------------------- */}

        <div className="w-full overflow-x-auto px-6 pb-8 pt-2">
          {/* Loading / Error */}

          {listError && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-[#F8D3CE] bg-[#FDF3F2] px-4 py-3 text-[13px] text-[#E0483C]">
              <span>{listError}</span>

              <button
                onClick={loadInstitutions}
                className="font-semibold underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {saveError && (
            <div className="mb-4 rounded-lg border border-[#F8D3CE] bg-[#FDF3F2] px-4 py-3 text-[13px] text-[#E0483C]">
              {saveError}
            </div>
          )}

          {/* Hidden edit logo input */}

          <input
            ref={editFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoPickShared}
          />

          {isLoadingList ? (
            <div className="py-16 text-center text-[13px] text-[#9AA0A8]">
              Loading institutions...
            </div>
          ) : (
            <>
              {/* ----------------------------------------- */}
              {/* TABLE */}
              {/* ----------------------------------------- */}

              <table className="min-w-[1200px] w-full border-collapse text-left">
                <thead>
                  <tr className="text-[12px] uppercase tracking-wide text-[#9AA0A8]">
                    <th className="w-20 py-3 font-medium">
                      Logo
                    </th>

                    <th className="w-36 py-3 font-medium">
                      Institution Code
                    </th>

                    <th className="w-56 py-3 font-medium">
                      Institution
                    </th>

                    <th className="min-w-[300px] py-3 font-medium">
                      Description
                    </th>

                    <th className="w-24 py-3 font-medium">
                      Color
                    </th>

                    <th className="w-32 py-3 font-medium">
                      Status
                    </th>

                    <th className="w-44 py-3 font-medium">
                      Created At
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {institutions.map((inst) => {
                    const d = drafts[inst.id];

                    return (
                      <tr
                        key={inst.id}
                        className="border-t border-[#F1F2F4]"
                      >
                        {/* -------------------------------- */}
                        {/* LOGO */}
                        {/* -------------------------------- */}

                        <td className="py-4">
                          <button
                            type="button"
                            disabled={!isEditMode}
                            onClick={() => {
                              setActiveLogoRowId(inst.id);
                              editFileInputRef.current?.click();
                            }}
                            className="h-9 w-9 overflow-hidden rounded-full bg-[#E4E7EC] disabled:cursor-default"
                            aria-label={
                              isEditMode
                                ? "Change logo"
                                : undefined
                            }
                          >
                            <img
                              src={
                                (isEditMode
                                  ? d?.logoPreview
                                  : inst.logo) ||
                                DEFAULT_LOGO
                              }
                              alt={inst.name}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        </td>

                        {/* -------------------------------- */}
                        {/* CODE */}
                        {/* -------------------------------- */}

                        <td className="py-4 text-[14px] font-semibold text-[#111318]">
                          {isEditMode ? (
                            <input
                              value={d?.code ?? ""}
                              disabled={isSavingAll}
                              onChange={(e) =>
                                updateDraft(inst.id, {
                                  code: e.target.value,
                                })
                              }
                              className="w-full min-w-[120px] rounded-md border border-[#E1E3E7] px-2 py-1 text-[14px] outline-none focus:border-[#1AAE6F] disabled:opacity-60"
                            />
                          ) : (
                            inst.code
                          )}
                        </td>

                        {/* -------------------------------- */}
                        {/* NAME */}
                        {/* -------------------------------- */}

                        <td className="py-4 text-[14px] font-semibold text-[#111318]">
                          {isEditMode ? (
                            <input
                              value={d?.name ?? ""}
                              disabled={isSavingAll}
                              onChange={(e) =>
                                updateDraft(inst.id, {
                                  name: e.target.value,
                                })
                              }
                              className="w-full min-w-[180px] rounded-md border border-[#E1E3E7] px-2 py-1 text-[14px] outline-none focus:border-[#1AAE6F] disabled:opacity-60"
                            />
                          ) : (
                            inst.name
                          )}
                        </td>

                        {/* -------------------------------- */}
                        {/* DESCRIPTION */}
                        {/* -------------------------------- */}

                        <td className="min-w-[300px] py-4 text-[14px] text-[#5B616B]">
                          {isEditMode ? (
                            <input
                              value={d?.description ?? ""}
                              disabled={isSavingAll}
                              onChange={(e) =>
                                updateDraft(inst.id, {
                                  description:
                                    e.target.value,
                                })
                              }
                              className="w-full min-w-[300px] rounded-md border border-[#E1E3E7] px-2 py-1 text-[14px] outline-none focus:border-[#1AAE6F] disabled:opacity-60"
                            />
                          ) : (
                            inst.description || "—"
                          )}
                        </td>

                        {/* -------------------------------- */}
                        {/* COLOR */}
                        {/* -------------------------------- */}

                        <td className="py-4">
                          {isEditMode ? (
                            <input
                              type="color"
                              value={
                                d?.color ?? DEFAULT_COLOR
                              }
                              disabled={isSavingAll}
                              onChange={(e) =>
                                updateDraft(inst.id, {
                                  color: e.target.value,
                                })
                              }
                              className="h-7 w-7 cursor-pointer rounded-md border border-[#00000010] bg-transparent p-0 disabled:opacity-60"
                            />
                          ) : (
                            <div
                              className="h-7 w-7 rounded-md border border-[#00000010]"
                              style={{
                                backgroundColor: inst.color,
                              }}
                            />
                          )}
                        </td>

                        {/* -------------------------------- */}
                        {/* STATUS */}
                        {/* -------------------------------- */}

                        <td className="py-4">
                          <div className="relative inline-block">
                            <select
                              value={inst.status}
                              onChange={(e) =>
                                updateStatus(
                                  inst.id,
                                  e.target.value as Status
                                )
                              }
                              className={`appearance-none rounded-md bg-transparent pr-5 text-[14px] font-semibold outline-none ${
                                inst.status === "active"
                                  ? "text-[#1AAE6F]"
                                  : "text-[#B0B4BA]"
                              }`}
                            >
                              <option value="active">
                                active
                              </option>

                              <option value="inactive">
                                inactive
                              </option>
                            </select>

                            <ChevronIcon className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-current" />
                          </div>
                        </td>

                        {/* -------------------------------- */}
                        {/* CREATED AT */}
                        {/* -------------------------------- */}

                        <td className="py-4 text-[14px] font-semibold text-[#111318]">
                          {inst.createdAt}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* ----------------------------------------- */}
              {/* EMPTY STATE */}
              {/* ----------------------------------------- */}

              {institutions.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-20 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F2F4] text-[#9AA0A8]">
                    <BuildingIcon />
                  </div>

                  <p className="text-[14px] font-medium text-[#5B616B]">
                    No institutions yet
                  </p>

                  <p className="max-w-xs text-[13px] text-[#9AA0A8]">
                    Add an institution to start managing its
                    users, branding, and status.
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
            </>
          )}
        </div>
      </div>

      {/* ============================================== */}
      {/* CREATE MODAL */}
      {/* ============================================== */}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}

            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-[#111318]">
                Add institution
              </h2>

              <button
                onClick={closeModal}
                aria-label="Close"
                disabled={isSaving}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#9AA0A8] transition hover:bg-[#F1F2F4] disabled:opacity-50"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* -------------------------------- */}
              {/* LOGO */}
              {/* -------------------------------- */}

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-dashed border-[#D8DBE0] bg-[#F7F8FA]"
                  aria-label="Upload logo"
                >
                  <img
                    src={logo || DEFAULT_LOGO}
                    alt={
                      logo
                        ? "Logo preview"
                        : "IDIYANALE"
                    }
                    className="h-full w-full object-cover"
                  />
                </button>

                <div>
                  <p className="text-[13px] font-semibold text-[#111318]">
                    Logo
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="text-[12px] font-medium text-[#1AAE6F] hover:underline"
                  >
                    {logo
                      ? "Change image"
                      : "Upload image"}
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

              {/* -------------------------------- */}
              {/* INSTITUTION ID */}
              {/* -------------------------------- */}

              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium uppercase tracking-wide text-[#9AA0A8]">
                  Institution ID
                </span>

                <input
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value)
                  }
                  placeholder="e.g. 27"
                  disabled={isSaving}
                  className="rounded-lg border border-[#E1E3E7] px-3 py-2 text-[14px] text-[#111318] outline-none transition focus:border-[#1AAE6F] disabled:opacity-60"
                />
              </label>

              {/* -------------------------------- */}
              {/* INSTITUTION NAME */}
              {/* -------------------------------- */}

              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium uppercase tracking-wide text-[#9AA0A8]">
                  Institution name
                </span>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="e.g. BAKAWAN Data Analytics"
                  disabled={isSaving}
                  className="rounded-lg border border-[#E1E3E7] px-3 py-2 text-[14px] text-[#111318] outline-none transition focus:border-[#1AAE6F] disabled:opacity-60"
                />
              </label>

              {/* -------------------------------- */}
              {/* DESCRIPTION */}
              {/* -------------------------------- */}

              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium uppercase tracking-wide text-[#9AA0A8]">
                  Description
                </span>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Optional notes about this institution"
                  rows={3}
                  disabled={isSaving}
                  className="resize-none rounded-lg border border-[#E1E3E7] px-3 py-2 text-[14px] text-[#111318] outline-none transition focus:border-[#1AAE6F] disabled:opacity-60"
                />
              </label>

              {/* -------------------------------- */}
              {/* COLOR */}
              {/* -------------------------------- */}

              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium uppercase tracking-wide text-[#9AA0A8]">
                  Color
                </span>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) =>
                      setColor(e.target.value)
                    }
                    disabled={isSaving}
                    className="h-9 w-9 cursor-pointer rounded-md border border-[#E1E3E7] bg-transparent p-0 disabled:opacity-60"
                  />

                  <input
                    value={color}
                    onChange={(e) =>
                      setColor(e.target.value)
                    }
                    disabled={isSaving}
                    className="flex-1 rounded-lg border border-[#E1E3E7] px-3 py-2 text-[14px] uppercase text-[#111318] outline-none transition focus:border-[#1AAE6F] disabled:opacity-60"
                  />
                </div>
              </label>

              {/* ERROR */}

              {error && (
                <p className="text-[13px] font-medium text-[#E0483C]">
                  {error}
                </p>
              )}
            </div>

            {/* -------------------------------- */}
            {/* MODAL BUTTONS */}
            {/* -------------------------------- */}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-full px-4 py-2 text-[13px] font-semibold text-[#5B616B] transition hover:bg-[#F1F2F4] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleCreate}
                disabled={isSaving}
                className="rounded-full bg-[#1AAE6F] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#149260] active:scale-95 disabled:opacity-60 disabled:active:scale-100"
              >
                {isSaving
                  ? "Adding..."
                  : "Add institution"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================== */
/* ICONS */
/* ================================================== */

function PlusIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
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

function ChevronIcon({
  className = "",
}: {
  className?: string;
}) {
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