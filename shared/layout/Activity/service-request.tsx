"use client";

import { useState, useEffect, useRef } from "react";
import {
    RefreshCw,
    Upload,
    X,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    List,
    Type,
} from "lucide-react";
import { CreateTicketError } from "@/shared/layout/Activity/api/create-sr";
import { createTicket, CreateTicketRequest } from "@/services/integration/ticket/post_ticket"; // adjust path to match your project
import { getCategories, CategoryResp } from "@/services/integration/insti-admin/get_all_category"; // adjust path to match your project
import { getSubCategories, SubCategoryResp } from "@/services/integration/insti-admin/get_all_sub_category"; // adjust path to match your project
import { getUsersByInstitutionId, UserDetails } from "@/services/integration/super_admin/get_user_insti_id"; // adjust path to match your project
import { getResolverGroups, ResolverGroup } from "@/services/integration/institution/get-resolver-groups"; // adjust path to match your project
import { getInstitutions, InstitutionResp } from "@/services/integration/institution/get-all-insti"; // adjust path to match your project
import { getTicketTypes, TicketTypeResp } from "@/services/integration/insti-admin/get_all_ticket_type"; // adjust path to match your project
import { verifyJWT } from "@/lib/auth/verify-jwt"; // adjust path to match your project

// New: project lookup API
import { getProjectByID, ProjectResponse } from "@/services/integration/project/get_project_id";

export interface NewTicketFormData {
    resolver: string;
    dateNeeded: string; // yyyy-mm-dd from <input type="date">
    projectName: string;
    ticketTypeId: string;
    categoryId: string;
    subcategoryId: string;
    endorserId: string;
    approverPoolId: string;
    duration: string;
    subject: string;
    description: string; // stored as HTML so bold/italic/etc. survive submission
}

export const EMPTY_TICKET_FORM: NewTicketFormData = {
    resolver: "",
    dateNeeded: "",
    projectName: "",
    ticketTypeId: "",
    categoryId: "",
    subcategoryId: "",
    endorserId: "",
    approverPoolId: "",
    duration: "",
    subject: "",
    description: "",
};

/**
 * Reads the auth token used to identify the logged-in user's institution.
 * ASSUMPTION: token is stored in a "token" cookie. If your app instead
 * keeps it in localStorage or an auth context/hook, swap this out.
 */
function getAuthToken(): string | null {
    if (typeof document === "undefined") return null;

    const match = document.cookie.match(/(?:^|; )token=([^;]*)/);

    return match ? decodeURIComponent(match[1]) : null;
}

interface SelectOption {
    id: string;
    label: string;
}

interface SelectFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options?: SelectOption[];
    disabled?: boolean;
}

function SelectField({
    label,
    value,
    onChange,
    options = [],
    disabled = false,
}: SelectFieldProps) {
    return (
        <div className="border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            <label className="block text-xs font-bold text-[#1E4637] mb-1">
                {label}
            </label>

            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="
                        w-full
                        appearance-none
                        bg-transparent
                        border border-gray-200
                        rounded-lg
                        px-2.5
                        py-1.5
                        text-sm
                        text-gray-700
                        focus:outline-none
                        focus:ring-2
                        focus:ring-[#1E4637]/30
                        cursor-pointer
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                    "
                >
                    <option value="" />

                    {options.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                <svg
                    className="
                        pointer-events-none
                        absolute
                        right-2.5
                        top-1/2
                        -translate-y-1/2
                        w-3.5
                        h-3.5
                        text-gray-400
                    "
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </div>
        </div>
    );
}

/**
 * Small formatting-toolbar button. Mirrors the ToolbarBtn used in
 * TicketDetailPanel's remarks editor so the two rich-text areas look and
 * behave the same way.
 */
function ToolbarBtn({
    children,
    "aria-label": ariaLabel,
    onClick,
    active = false,
}: {
    children: React.ReactNode;
    "aria-label": string;
    onClick?: () => void;
    active?: boolean;
}) {
    return (
        <button
            type="button"
            aria-label={ariaLabel}
            title={ariaLabel}
            aria-pressed={active}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            className={`p-1.5 rounded-md transition-colors ${
                active
                    ? "bg-[#1E4637] text-white"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-200"
            }`}
        >
            {children}
        </button>
    );
}

const DURATION_OPTIONS: SelectOption[] = [
    { id: "30", label: "30 Days" },
    { id: "60", label: "60 Days" },
    { id: "90", label: "90 Days" },
];

interface NewTicketPanelViewProps {
    onCancel: () => void;
    onSubmit?: (data: NewTicketFormData) => void;
}

/**
 * Pulls a human-readable message out of whatever createTicket rejects with.
 */
/**
 * Converts the yyyy-mm-dd string from <input type="date"> into a full
 * RFC3339 timestamp, since the backend parses due_date with the Go layout
 * "2006-01-02T15:04:05Z07:00" and rejects a bare date like "2026-08-31".
 */
function toRfc3339(dateOnly: string): string {
    if (!dateOnly) return dateOnly;

    // Date-only ISO strings are parsed by JS as UTC midnight, so this
    // reliably produces e.g. "2026-08-31T00:00:00.000Z".
    return new Date(dateOnly).toISOString();
}

function getTicketErrorMessage(err: unknown): string {
    if (err instanceof CreateTicketError) {
        return err.message;
    }

    const anyErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
    };

    return (
        anyErr?.response?.data?.message ||
        anyErr?.message ||
        "Failed to create ticket. Please try again."
    );
}

/**
 * Ticket form content only.
 *
 * Desktop layout:
 * Left  = 40%
 * Right = 60%
 */
export default function NewTicketPanelView({
    onCancel,
    onSubmit,
}: NewTicketPanelViewProps) {
    const [form, setForm] =
        useState<NewTicketFormData>(EMPTY_TICKET_FORM);

    const [files, setFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Category state (fetched from API)
    const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    // Subcategory state (fetched from API, dependent on selected category)
    const [subcategoryOptions, setSubcategoryOptions] = useState<SelectOption[]>([]);
    const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
    // Keep full records around so we can pull description/duration/subject
    // when the user picks a subcategory (used by "Reload Template").
    const [subcategoryDetails, setSubcategoryDetails] = useState<SubCategoryResp[]>([]);

    // Institution resolved from the logged-in user's JWT.
    // NOTE: this still scopes Endorsers (per the getUsersByInstitutionId
    // call below). Resolver Groups are now scoped to the user-selected
    // Institution Pool instead — see form.approverPoolId below.
    const [institutionId, setInstitutionId] = useState<number | null>(null);

    // Endorser options come from getUsersByInstitutionId (role.can_endorse),
    // scoped to institutionId (JWT).
    // Resolver options come from getResolverGroups, scoped to whichever
    // Institution Pool the user has selected (form.approverPoolId).
    const [endorserOptions, setEndorserOptions] = useState<SelectOption[]>([]);
    const [resolverOptions, setResolverOptions] = useState<SelectOption[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [resolverGroupsLoading, setResolverGroupsLoading] = useState(false);

    // Institution Pool options — this is the "institutionPool" field the
    // backend requires on submit. Independent of the JWT-derived
    // institutionId above (that one scopes endorsers; this one
    // is the full list the requester picks from for the ticket itself).
    // Resolver Groups are filtered against whichever pool is selected here.
    const [institutionPoolOptions, setInstitutionPoolOptions] = useState<SelectOption[]>([]);
    const [institutionPoolLoading, setInstitutionPoolLoading] = useState(false);

    // ---------------------------------------------------------------------------
    // Project lookup state (new)
    // ---------------------------------------------------------------------------
    const [project, setProject] = useState<ProjectResponse | null>(null);
    const [projectLoading, setProjectLoading] = useState(false);
    const [projectError, setProjectError] = useState<string | null>(null);

    // ---------------------------------------------------------------
    // Rich-text editors (bold / italic / underline / etc.) for every
    // free-typed field — Subject and Description. Both are contentEditable
    // divs driven by execCommand, with form state holding the resulting
    // HTML so formatting survives submission. Select/date fields are left
    // alone since "formatting" doesn't apply to picking an option.
    // ---------------------------------------------------------------
    type RichFieldKey = "subject" | "description";

    const subjectRef = useRef<HTMLDivElement | null>(null);
    const descriptionRef = useRef<HTMLDivElement | null>(null);

    const richFieldRefs: Record<RichFieldKey, React.RefObject<HTMLDivElement | null>> = {
        subject: subjectRef,
        description: descriptionRef,
    };

    const [showFormatBar, setShowFormatBar] = useState<Record<RichFieldKey, boolean>>({
        subject: false,
        description: false,
    });

    const [isFieldEmpty, setIsFieldEmpty] = useState<Record<RichFieldKey, boolean>>({
        subject: true,
        description: true,
    });

    const emptyFormats = {
        bold: false,
        italic: false,
        underline: false,
        strikeThrough: false,
        insertUnorderedList: false,
    };

    const [activeFormats, setActiveFormats] = useState<
        Record<RichFieldKey, Record<string, boolean>>
    >({
        subject: { ...emptyFormats },
        description: { ...emptyFormats },
    });

    function refreshActiveFormats(field: RichFieldKey) {
        setActiveFormats((prev) => ({
            ...prev,
            [field]: {
                bold: document.queryCommandState("bold"),
                italic: document.queryCommandState("italic"),
                underline: document.queryCommandState("underline"),
                strikeThrough: document.queryCommandState("strikeThrough"),
                insertUnorderedList: document.queryCommandState("insertUnorderedList"),
            },
        }));
    }

    function execFieldFormat(field: RichFieldKey, command: string, value?: string) {
        richFieldRefs[field].current?.focus();
        document.execCommand(command, false, value);
        // queryCommandState can lag a tick behind execCommand in some
        // browsers, so defer the read to the next microtask/frame.
        setTimeout(() => refreshActiveFormats(field), 0);
    }

    function handleFieldInput(field: RichFieldKey) {
        const el = richFieldRefs[field].current;
        const html = el?.innerHTML ?? "";
        const text = el?.innerText ?? "";

        setIsFieldEmpty((prev) => ({ ...prev, [field]: text.trim().length === 0 }));
        setForm((prev) => ({ ...prev, [field]: html }));
        refreshActiveFormats(field);
    }

    // Keep toolbar active-state in sync when the caret moves via click or
    // arrow keys, not just when typing — for whichever rich field has focus.
    useEffect(() => {
        function handleSelectionChange() {
            const sel = window.getSelection();
            if (!sel) return;
            const anchor = sel.anchorNode;

            (Object.keys(richFieldRefs) as RichFieldKey[]).forEach((field) => {
                const el = richFieldRefs[field].current;
                if (el && anchor && el.contains(anchor)) {
                    refreshActiveFormats(field);
                }
            });
        }
        document.addEventListener("selectionchange", handleSelectionChange);
        return () => document.removeEventListener("selectionchange", handleSelectionChange);
    }, []);

    useEffect(() => {
        let cancel = false;

        const fetchInstitutions = async () => {
            setInstitutionPoolLoading(true);

            try {
                const res = await getInstitutions();

                const options: SelectOption[] = (res?.response ?? [])
                    .filter((i: InstitutionResp) => i.status === "active") // remove if status shouldn't gate visibility
                    .map((i: InstitutionResp) => ({
                        id: String(i.institution_id),
                        label: i.institution_name,
                    }));

                if (!cancel) {
                    setInstitutionPoolOptions(options);
                }
            } catch (err) {
                if (!cancel) {
                    setError("Failed to load institution pool options. Please try again.");
                }
            } finally {
                if (!cancel) {
                    setInstitutionPoolLoading(false);
                }
            }
        };

        fetchInstitutions();

        return () => {
            cancel = true;
        };
    }, []);

    // Ticket Type — this panel defaults to Service Request, so we fetch the
    // real list once and pre-select whichever entry matches "Service
    // Request" by name. The field stays selectable (like Institution Pool)
    // in case the user needs to pick a different type.
    const [ticketTypeOptions, setTicketTypeOptions] = useState<SelectOption[]>([]);
    const [ticketTypeLoading, setTicketTypeLoading] = useState(false);

    useEffect(() => {
        let cancel = false;

        const fetchTicketTypes = async () => {
            setTicketTypeLoading(true);

            try {
                const res = await getTicketTypes();

                const records = res?.response ?? [];

                const options: SelectOption[] = records.map(
                    (t: TicketTypeResp) => ({
                        id: String(t.ticket_type_id),
                        label: t.ticket_type_name,
                    })
                );

                if (!cancel) {
                    setTicketTypeOptions(options);

                    // Auto-select the "Service Request" entry so the field
                    // is pre-filled and never requires the user to pick it.
                    const serviceRequest = records.find((t: TicketTypeResp) =>
                        t.ticket_type_name.toLowerCase().includes("service request")
                    );

                    if (serviceRequest) {
                        setForm((prev) => ({
                            ...prev,
                            ticketTypeId: String(serviceRequest.ticket_type_id),
                        }));
                    } else {
                        setError(
                            'Could not find a "Service Request" ticket type from the API.'
                        );
                    }
                }
            } catch (err) {
                if (!cancel) {
                    setError("Failed to load ticket type. Please try again.");
                }
            } finally {
                if (!cancel) {
                    setTicketTypeLoading(false);
                }
            }
        };

        fetchTicketTypes();

        return () => {
            cancel = true;
        };
    }, []);

    // Decode the JWT once on mount to find which institution to scope
    // the endorser lookup to.
    useEffect(() => {
        let cancel = false;

        const resolveInstitution = async () => {
            const token = getAuthToken();

            if (!token) {
                if (!cancel) {
                    setError("You must be logged in to load endorsers.");
                }
                return;
            }

            const payload = await verifyJWT(token);

            if (!payload?.institution_id) {
                if (!cancel) {
                    setError("Unable to determine your institution from your session.");
                }
                return;
            }

            if (!cancel) {
                setInstitutionId(payload.institution_id);
            }
        };

        resolveInstitution();

        return () => {
            cancel = true;
        };
    }, []);

    // Once we know the institution, fetch its users and pull out endorsers
    // (role.can_endorse).
    useEffect(() => {
        let cancel = false;

        if (!institutionId) return;

        const fetchUsers = async () => {
            setUsersLoading(true);

            try {
                const res = await getUsersByInstitutionId(institutionId);

                const users = (res ?? []).filter(
                    (u: UserDetails) => u.status === "active" // remove if status shouldn't gate visibility
                );

                const toOption = (u: UserDetails): SelectOption => ({
                    id: String(u.id),
                    label: `${u.first_name} ${u.last_name}`,
                });

                const endorsers = users
                    .filter((u) => u.role?.can_endorse)
                    .map(toOption);

                if (!cancel) {
                    setEndorserOptions(endorsers);
                }
            } catch (err) {
                if (!cancel) {
                    setError("Failed to load endorsers. Please try again.");
                }
            } finally {
                if (!cancel) {
                    setUsersLoading(false);
                }
            }
        };

        fetchUsers();

        return () => {
            cancel = true;
        };
    }, [institutionId]);

    // Resolver options are scoped to whichever Institution Pool the user
    // has selected (form.approverPoolId) — NOT the JWT-derived
    // institutionId. Re-fetches/re-filters whenever the pool selection
    // changes, and clears out if no pool is selected yet.
    useEffect(() => {
        let cancel = false;

        if (!form.approverPoolId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setResolverOptions([]);
            return;
        }

        const selectedPoolId = Number(form.approverPoolId);

        const fetchResolverGroups = async () => {
            setResolverGroupsLoading(true);

            try {
                const res = await getResolverGroups();

                const options: SelectOption[] = (res?.response ?? [])
                    .filter(
                        (g: ResolverGroup) =>
                            g.status === "active" &&
                            g.institution_id === selectedPoolId
                    )
                    .map((g: ResolverGroup) => ({
                        id: String(g.resolver_group_id),
                        label: g.group_name,
                    }));

                if (!cancel) {
                    setResolverOptions(options);
                }
            } catch (err) {
                if (!cancel) {
                    setError("Failed to load resolver groups. Please try again.");
                }
            } finally {
                if (!cancel) {
                    setResolverGroupsLoading(false);
                }
            }
        };

        fetchResolverGroups();

        return () => {
            cancel = true;
        };
    }, [form.approverPoolId]);

    // Categories depend on the resolved ticket type, so wait for
    // form.ticketTypeId to be populated by the ticket-type fetch above.
    useEffect(() => {
        let cancel = false;

        if (!form.ticketTypeId) return;

        const fetchCategories = async () => {
            setCategoriesLoading(true);

            try {
                const res = await getCategories(form.ticketTypeId);

                const options: SelectOption[] = (res?.response ?? [])
                    .filter((c: CategoryResp) => c.status === "active") // remove if status shouldn't gate visibility
                    .map((c: CategoryResp) => ({
                        id: String(c.category_id),
                        label: c.category_name,
                    }));

                if (!cancel) {
                    setCategoryOptions(options);
                }
            } catch (err) {
                if (!cancel) {
                    setError("Failed to load categories. Please try again.");
                }
            } finally {
                if (!cancel) {
                    setCategoriesLoading(false);
                }
            }
        };

        fetchCategories();

        return () => {
            cancel = true;
        };
    }, [form.ticketTypeId]);

    // Fetch subcategories whenever the selected category changes.
    useEffect(() => {
        let cancel = false;

        // No category selected yet — clear subcategory state and stop.
        if (!form.categoryId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSubcategoryOptions([]);
            setSubcategoryDetails([]);
            return;
        }

        const fetchSubCategories = async () => {
            setSubcategoriesLoading(true);

            try {
                const res = await getSubCategories(form.categoryId);

                const records = (res?.response ?? []).filter(
                    (sc: SubCategoryResp) => sc.status === "active" // remove if status shouldn't gate visibility
                );

                const options: SelectOption[] = records.map(
                    (sc: SubCategoryResp) => ({
                        id: String(sc.sub_category_id),
                        label: sc.sub_category_name,
                    })
                );

                if (!cancel) {
                    setSubcategoryOptions(options);
                    setSubcategoryDetails(records);
                }
            } catch (err) {
                if (!cancel) {
                    setError("Failed to load subcategories. Please try again.");
                }
            } finally {
                if (!cancel) {
                    setSubcategoriesLoading(false);
                }
            }
        };

        fetchSubCategories();

        return () => {
            cancel = true;
        };
    }, [form.categoryId]);

    const updateField =
        (key: keyof NewTicketFormData) => (value: string) =>
            setForm((prev) => ({
                ...prev,
                [key]: value,
            }));

    // Category changed: clear the now-stale subcategory selection.
    const handleCategoryChange = (value: string) => {
        setForm((prev) => ({
            ...prev,
            categoryId: value,
            subcategoryId: "",
        }));
    };

    // Institution Pool changed: clear the now-stale resolver selection,
    // since resolver groups are scoped to the pool.
    const handleInstitutionPoolChange = (value: string) => {
        setForm((prev) => ({
            ...prev,
            approverPoolId: value,
            resolver: "",
        }));
    };

    // Subcategory changed: pull subject/description/duration off the
    // matching record so "Reload Template" has something to load.
    const handleSubcategoryChange = (value: string) => {
        setForm((prev) => ({
            ...prev,
            subcategoryId: value,
        }));
    };

    // Project lookup (by project ID stored in form.projectName)
    const lookupProject = async () => {
        setProject(null);
        setProjectError(null);

        const raw = (form.projectName || "").trim();
        if (!raw) {
            setProjectError("Enter a project ID to look up.");
            return;
        }

        setProjectLoading(true);
        try {
            const p = await getProjectByID(raw);
            setProject(p);
        } catch (err) {
            setProjectError("Project not found or failed to load.");
        } finally {
            setProjectLoading(false);
        }
    };

    const handleReloadTemplate = () => {
        const selected = subcategoryDetails.find(
            (sc) => String(sc.sub_category_id) === form.subcategoryId
        );

        const nextDescription = selected?.description || "";
        // Subject only gets overwritten by the template when the template
        // actually has one — otherwise leave whatever the user typed.
        const nextSubject = selected?.subject_name || form.subject;

        // Both editors are contentEditable, so their DOM content isn't
        // driven by React's `value` prop — push the template text into
        // them directly, same as we do for form state.
        if (descriptionRef.current) {
            descriptionRef.current.innerHTML = nextDescription;
        }
        if (subjectRef.current && selected?.subject_name) {
            subjectRef.current.innerHTML = nextSubject;
        }

        setIsFieldEmpty((prev) => ({
            ...prev,
            description: nextDescription.trim().length === 0,
            subject: selected?.subject_name
                ? nextSubject.trim().length === 0
                : prev.subject,
        }));

        if (!selected) {
            setForm((prev) => ({ ...prev, description: "" }));
            return;
        }

        setForm((prev) => ({
            ...prev,
            subject: nextSubject,
            description: nextDescription,
            duration: selected.has_duration
                ? String(selected.duration_days)
                : prev.duration,
        }));
    };

    const handleFileUpload = () => {
        const input = document.createElement("input");

        input.type = "file";
        input.multiple = true;

        input.onchange = () => {
            const selected = input.files
                ? Array.from(input.files)
                : [];

            if (selected.length === 0) return;

            setFiles((prev) => {
                const combined = [...prev, ...selected];

                if (combined.length > 5) {
                    setError("Maximum of 5 attachments allowed");

                    return combined.slice(0, 5);
                }

                return combined;
            });
        };

        input.click();
    };

    const removeFile = (name: string) => {
        setFiles((prev) =>
            prev.filter((f) => f.name !== name)
        );
    };

    const resetForm = () => {
        setForm(EMPTY_TICKET_FORM);
        setFiles([]);
        setError(null);
        setSubcategoryOptions([]);
        setSubcategoryDetails([]);
        setProject(null);
        setProjectError(null);
        setProjectLoading(false);

        if (descriptionRef.current) {
            descriptionRef.current.innerHTML = "";
        }
        if (subjectRef.current) {
            subjectRef.current.innerHTML = "";
        }
        setIsFieldEmpty({ subject: true, description: true });
        setShowFormatBar({ subject: false, description: false });
        setActiveFormats({
            subject: { ...emptyFormats },
            description: { ...emptyFormats },
        });
    };

    const handleCancel = () => {
        resetForm();
        onCancel();
    };

    const handleSubmit = async () => {
        setError(null);

        // Guard against the exact "Missing required field(s)" case: catch it
        // client-side with real field names instead of only finding out
        // after the API call.
        const missing: string[] = [];

        if (!form.ticketTypeId) missing.push("Ticket Type");
        if (!form.approverPoolId) missing.push("Institution Pool");
        if (!form.dateNeeded) missing.push("Date Needed");
        if (!form.categoryId) missing.push("Category");
        if (!form.subcategoryId) missing.push("Subcategory");
        if (!form.endorserId) missing.push("Endorser");
        if (!form.resolver) missing.push("Resolver");
        if (isFieldEmpty.subject) missing.push("Subject");

        if (missing.length > 0) {
            setError(`Missing required field(s): ${missing.join(", ")}`);
            return;
        }

        setSubmitting(true);

        try {
            // Field names here must match CreateTicketRequest exactly —
            // this is what actually gets appended to FormData and sent to
            // the backend (see create-ticket.ts / createTicket()).
            // NOTE: resolver_group_id must also be added to the
            // CreateTicketRequest interface AND appended inside
            // createTicket() itself (create-ticket.ts) — adding it only
            // here has no effect, since that function builds FormData
            // field-by-field rather than forwarding the whole object.
            const requestPayload: CreateTicketRequest = {
                ticket_type_id: Number(form.ticketTypeId),
                category_id: Number(form.categoryId),
                subcategory_id: Number(form.subcategoryId),
                subject: form.subject,
                description: form.description,
                due_date: toRfc3339(form.dateNeeded),
                institution_pool: Number(form.approverPoolId),
                endorser_id: Number(form.endorserId),
                resolver_group_id: Number(form.resolver),
                files,
            };

            await createTicket(requestPayload);

            onSubmit?.(form);
            resetForm();
        } catch (err) {
            setError(getTicketErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0">

            {/* =========================================================
                MAIN FORM
            ========================================================== */}
            <div
                className="
                    flex-1
                    overflow-y-auto
                    min-h-0
                    grid
                    grid-cols-1
                    md:grid-cols-[0.8fr_1.2fr]
                    gap-6
                    px-8
                    py-6
                "
            >

                {/* =====================================================
                    LEFT COLUMN
                    ====================================================== */}
                <div className="flex flex-col gap-6">

                    {/* =================================================
                        REQUESTER INFO
                    ================================================== */}
                    <div
                        className="
                            border
                            border-gray-200
                            rounded-2xl
                            px-5
                            py-4
                            shadow-sm
                            flex
                            flex-col
                            gap-2.5
                        "
                    >
                        <h3 className="text-sm font-bold text-[#1E4637] mb-1">
                            Project & Schedule
                        </h3>

                        {/* Ticket Type — defaults to "Service Request" but selectable, like Institution Pool */}
                        <SelectField
                            label={
                                ticketTypeLoading
                                    ? "Ticket Type (loading...)"
                                    : "Ticket Type"
                            }
                            value={form.ticketTypeId}
                            onChange={updateField("ticketTypeId")}
                            options={ticketTypeOptions}
                            disabled={ticketTypeLoading}
                        />

                        {/* Institution Pool — required by the API as "institutionPool".
                            Changing this now also clears the Resolver selection, since
                            Resolver Groups are filtered against this pool. */}
                        <SelectField
                            label={
                                institutionPoolLoading
                                    ? "Institution Pool (loading...)"
                                    : "Institution Pool"
                            }
                            value={form.approverPoolId}
                            onChange={handleInstitutionPoolChange}
                            options={institutionPoolOptions}
                            disabled={institutionPoolLoading}
                        />

                        {/* Date Needed */}
                        <div
                            className="
                                border
                                border-gray-200
                                rounded-xl
                                px-4
                                py-2.5
                                shadow-sm
                            "
                        >
                            <label className="block text-xs font-bold text-[#1E4637] mb-1">
                                Date Needed
                            </label>

                            <input
                                type="date"
                                value={form.dateNeeded}
                                onChange={(e) =>
                                    updateField("dateNeeded")(
                                        e.target.value
                                    )
                                }
                                className="
                                    w-full
                                    bg-transparent
                                    border
                                    border-gray-200
                                    rounded-lg
                                    px-2.5
                                    py-1.5
                                    text-sm
                                    text-gray-700
                                    focus:outline-none
                                    focus:ring-2
                                    focus:ring-[#1E4637]/30
                                "
                            />
                        </div>

                        {/* Project lookup: user enters a project ID and clicks Lookup */}
                        <div className="border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
                            <label className="block text-xs font-bold text-[#1E4637] mb-1">
                                Project ID
                            </label>

                            <div className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    value={form.projectName}
                                    onChange={(e) => {
                                        updateField("projectName")(e.target.value);
                                        // clear project preview when user edits the ID
                                        setProject(null);
                                        setProjectError(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            lookupProject();
                                        }
                                    }}
                                    placeholder="Enter project ID and click Lookup"
                                    className="
                                        flex-1
                                        bg-transparent
                                        border
                                        border-gray-200
                                        rounded-lg
                                        px-2.5
                                        py-1.5
                                        text-sm
                                        text-gray-700
                                        focus:outline-none
                                        focus:ring-2
                                        focus:ring-[#1E4637]/30
                                    "
                                />

                                <button
                                    type="button"
                                    onClick={lookupProject}
                                    disabled={projectLoading}
                                    className="
                                        px-3
                                        py-1.5
                                        rounded-lg
                                        font-semibold
                                        text-sm
                                        bg-[#1E4637]
                                        text-white
                                        hover:bg-[#16352A]
                                        transition-colors
                                        disabled:opacity-60
                                    "
                                >
                                    {projectLoading ? "Looking up…" : "Lookup"}
                                </button>
                            </div>

                            {projectError && (
                                <div className="text-xs text-rose-500 mt-2">
                                    {projectError}
                                </div>
                            )}

                            {project && (
                                <div className="mt-3 text-sm text-gray-700 space-y-1">
                                    <div>
                                        <span className="text-gray-400 font-semibold">Project Name:</span>
                                        <span className="ml-1 font-semibold">{project.project_name}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 font-semibold">Environment:</span>
                                        <span className="ml-1">{project.environment}</span>
                                    </div>
                                    {project.description && (
                                        <div className="text-gray-600 mt-1 whitespace-pre-wrap">
                                            {project.description}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* =================================================
                        SERVICE CATEGORIZATION
                    ================================================== */}
                    <div
                        className="
                            border
                            border-gray-200
                            rounded-2xl
                            px-5
                            py-4
                            shadow-sm
                            flex
                            flex-col
                            gap-2.5
                        "
                    >
                        <h3 className="text-sm font-bold text-[#1E4637] mb-1">
                            Service Categorization
                        </h3>


                        {/* Category */}
                        <SelectField
                            label={
                                categoriesLoading
                                    ? "Category (loading...)"
                                    : "Category"
                            }
                            value={form.categoryId}
                            onChange={handleCategoryChange}
                            options={categoryOptions}
                            disabled={categoriesLoading}
                        />

                        {/* Subcategory */}
                        <SelectField
                            label={
                                subcategoriesLoading
                                    ? "Subcategory (loading...)"
                                    : "Subcategory"
                            }
                            value={form.subcategoryId}
                            onChange={handleSubcategoryChange}
                            options={subcategoryOptions}
                            disabled={!form.categoryId || subcategoriesLoading}
                        />

                        {/* Endorser */}
                        <SelectField
                            label={
                                usersLoading
                                    ? "Endorser (loading...)"
                                    : "Endorser"
                            }
                            value={form.endorserId}
                            onChange={updateField("endorserId")}
                            options={endorserOptions}
                            disabled={usersLoading}
                        />

                        {/* Duration */}
                        <SelectField
                            label="Duration"
                            value={form.duration}
                            onChange={updateField("duration")}
                            options={DURATION_OPTIONS}
                        />

                        {/* Resolver — now scoped to the selected Institution Pool.
                            Disabled until a pool is chosen. */}
                        <SelectField
                            label={
                                resolverGroupsLoading
                                    ? "Resolver (loading...)"
                                    : "Resolver"
                            }
                            value={form.resolver}
                            onChange={updateField("resolver")}
                            options={resolverOptions}
                            disabled={!form.approverPoolId || resolverGroupsLoading}
                        />
                    </div>
                </div>

                {/* =====================================================
                    RIGHT COLUMN - WIDER
                    60%
                ====================================================== */}
                <div className="flex flex-col gap-6">

                    {/* =================================================
                        REQUEST DETAILS
                    ================================================== */}
                    <div
                        className="
                            border
                            border-gray-200
                            rounded-2xl
                            px-5
                            py-4
                            shadow-sm
                            flex-1
                            flex
                            flex-col
                            min-h-[280px]
                        "
                    >
                        <h3 className="text-sm font-bold text-[#1E4637] mb-3">
                            Request Details
                        </h3>

                        {/* Subject */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-bold text-[#1E4637]">
                                    Subject:
                                </label>
                            </div>

                            <div
                                className="
                                    border
                                    border-gray-200
                                    rounded-lg
                                    bg-transparent
                                    overflow-hidden
                                    focus-within:ring-2
                                    focus-within:ring-[#1E4637]/30
                                "
                            >
                                {showFormatBar.subject && (
                                    <div className="flex items-center gap-0.5 px-2 pt-2 pb-1.5 border-b border-gray-200">
                                        <ToolbarBtn
                                            aria-label="Bold"
                                            active={activeFormats.subject.bold}
                                            onClick={() => execFieldFormat("subject", "bold")}
                                        >
                                            <Bold size={13} strokeWidth={2.5} />
                                        </ToolbarBtn>
                                        <ToolbarBtn
                                            aria-label="Italic"
                                            active={activeFormats.subject.italic}
                                            onClick={() => execFieldFormat("subject", "italic")}
                                        >
                                            <Italic size={13} />
                                        </ToolbarBtn>
                                        <ToolbarBtn
                                            aria-label="Underline"
                                            active={activeFormats.subject.underline}
                                            onClick={() => execFieldFormat("subject", "underline")}
                                        >
                                            <Underline size={13} />
                                        </ToolbarBtn>
                                        <ToolbarBtn
                                            aria-label="Strikethrough"
                                            active={activeFormats.subject.strikeThrough}
                                            onClick={() => execFieldFormat("subject", "strikeThrough")}
                                        >
                                            <Strikethrough size={13} />
                                        </ToolbarBtn>
                                    </div>
                                )}

                                <div className="flex items-center gap-1 px-1">
                                    <div
                                        ref={subjectRef}
                                        contentEditable
                                        suppressContentEditableWarning
                                        onInput={() => handleFieldInput("subject")}
                                        onKeyUp={() => refreshActiveFormats("subject")}
                                        onMouseUp={() => refreshActiveFormats("subject")}
                                        onFocus={() => refreshActiveFormats("subject")}
                                        data-placeholder="Brief summary of the ticket"
                                        className="
                                            flex-1
                                            min-h-[2rem]
                                            px-1.5
                                            py-1.5
                                            text-sm
                                            text-gray-700
                                            outline-none
                                            empty:before:content-[attr(data-placeholder)]
                                            empty:before:text-gray-300
                                        "
                                    ></div>

                                    <button
                                        type="button"
                                        aria-label="Toggle subject formatting"
                                        title="Formatting options"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() =>
                                            setShowFormatBar((prev) => ({
                                                ...prev,
                                                subject: !prev.subject,
                                            }))
                                        }
                                        className={`shrink-0 p-1.5 rounded-lg transition-colors ${
                                            showFormatBar.subject
                                                ? "bg-[#1E4637] text-white"
                                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-200"
                                        }`}
                                    >
                                        <Type size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="flex-1 flex flex-col min-h-[180px]">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-bold text-[#1E4637]">
                                    Description:
                                </label>

                                <button
                                    type="button"
                                    onClick={handleReloadTemplate}
                                    className="
                                        flex
                                        items-center
                                        gap-1.5
                                        bg-[#1E4637]
                                        text-white
                                        text-xs
                                        font-semibold
                                        px-3
                                        py-1.5
                                        rounded-full
                                        hover:bg-[#16352A]
                                        transition-colors
                                    "
                                >
                                    <RefreshCw size={12} />
                                    Reload Template
                                </button>
                            </div>

                            {/* Rich-text description editor — same bold / italic /
                                underline / strikethrough / bullet-list toolbar as
                                the Remarks box in TicketDetailPanel. */}
                            <div
                                className="
                                    flex-1
                                    flex
                                    flex-col
                                    border
                                    border-gray-200
                                    rounded-lg
                                    bg-transparent
                                    overflow-hidden
                                    focus-within:ring-2
                                    focus-within:ring-[#1E4637]/30
                                "
                            >
                                {/* Formatting toolbar — shown only when toggled */}
                                {showFormatBar.description && (
                                    <div className="flex items-center gap-0.5 px-2 pt-2 pb-1.5 border-b border-gray-200">
                                        <ToolbarBtn
                                            aria-label="Bold"
                                            active={activeFormats.description.bold}
                                            onClick={() => execFieldFormat("description", "bold")}
                                        >
                                            <Bold size={13} strokeWidth={2.5} />
                                        </ToolbarBtn>
                                        <ToolbarBtn
                                            aria-label="Italic"
                                            active={activeFormats.description.italic}
                                            onClick={() => execFieldFormat("description", "italic")}
                                        >
                                            <Italic size={13} />
                                        </ToolbarBtn>
                                        <ToolbarBtn
                                            aria-label="Underline"
                                            active={activeFormats.description.underline}
                                            onClick={() => execFieldFormat("description", "underline")}
                                        >
                                            <Underline size={13} />
                                        </ToolbarBtn>
                                        <ToolbarBtn
                                            aria-label="Strikethrough"
                                            active={activeFormats.description.strikeThrough}
                                            onClick={() => execFieldFormat("description", "strikeThrough")}
                                        >
                                            <Strikethrough size={13} />
                                        </ToolbarBtn>
                                        <div className="w-px h-4 bg-gray-300 mx-1" />
                                        <ToolbarBtn
                                            aria-label="Bullet list"
                                            active={activeFormats.description.insertUnorderedList}
                                            onClick={() => execFieldFormat("description", "insertUnorderedList")}
                                        >
                                            <List size={13} />
                                        </ToolbarBtn>
                                    </div>
                                )}

                                {/* Contenteditable editor */}
                                <div
                                    ref={descriptionRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={() => handleFieldInput("description")}
                                    onKeyUp={() => refreshActiveFormats("description")}
                                    onMouseUp={() => refreshActiveFormats("description")}
                                    onFocus={() => refreshActiveFormats("description")}
                                    data-placeholder="Describe the request in detail..."
                                    className="
                                        flex-1
                                        min-h-[120px]
                                        overflow-y-auto
                                        px-2.5
                                        py-1.5
                                        text-sm
                                        text-gray-700
                                        outline-none
                                        empty:before:content-[attr(data-placeholder)]
                                        empty:before:text-gray-300
                                    "
                                ></div>

                                {/* Format toggle */}
                                <div className="flex items-center justify-end px-2 pb-1.5">
                                    <button
                                        type="button"
                                        aria-label="Toggle formatting"
                                        title="Formatting options"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() =>
                                            setShowFormatBar((prev) => ({
                                                ...prev,
                                                description: !prev.description,
                                            }))
                                        }
                                        className={`p-1.5 rounded-lg transition-colors ${
                                            showFormatBar.description
                                                ? "bg-[#1E4637] text-white"
                                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-200"
                                        }`}
                                    >
                                        <Type size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* =================================================
                        ATTACHMENT
                    ================================================== */}
                    <div
                        className="
                            border
                            border-gray-200
                            rounded-2xl
                            px-5
                            py-6
                            shadow-sm
                            flex
                            flex-col
                            items-center
                            justify-center
                            gap-3
                        "
                    >
                        <label className="self-start text-sm font-bold text-[#1E4637]">
                            Attachment:
                            {files.length > 0 &&
                                ` (${files.length}/5)`}
                        </label>

                        <button
                            type="button"
                            onClick={handleFileUpload}
                            disabled={files.length >= 5}
                            className="
                                flex
                                items-center
                                gap-2
                                border
                                border-gray-300
                                rounded-full
                                px-6
                                py-2.5
                                font-bold
                                text-sm
                                text-[#1E4637]
                                hover:bg-gray-50
                                transition-colors
                                disabled:opacity-40
                                disabled:cursor-not-allowed
                            "
                        >
                            <Upload size={16} />
                            Upload File
                        </button>

                        {files.length > 0 && (
                            <ul className="w-full flex flex-col gap-1">
                                {files.map((f) => (
                                    <li
                                        key={f.name}
                                        className="
                                            flex
                                            items-center
                                            justify-between
                                            text-xs
                                            text-gray-500
                                            gap-2
                                        "
                                    >
                                        <span className="truncate">
                                            {f.name}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeFile(f.name)
                                            }
                                            className="
                                                shrink-0
                                                text-gray-400
                                                hover:text-gray-600
                                            "
                                            aria-label={`Remove ${f.name}`}
                                        >
                                            <X size={12} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* =========================================================
                ERROR
            ========================================================== */}
            {error && (
                <div className="shrink-0 px-8 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* =========================================================
                FOOTER
            ========================================================== */}
            <div
                className="
                    shrink-0
                    flex
                    items-center
                    justify-end
                    gap-4
                    px-8
                    py-5
                    border-t
                    border-gray-100
                "
            >
                {/* Cancel */}
                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={submitting}
                    className="
                        px-8
                        py-3
                        rounded-full
                        font-bold
                        text-sm
                        bg-gray-100
                        text-gray-300
                        hover:bg-gray-200
                        hover:text-gray-500
                        transition-colors
                        disabled:opacity-50
                    "
                >
                    Cancel
                </button>

                {/* Submit */}
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="
                        px-8
                        py-3
                        rounded-full
                        font-bold
                        text-sm
                        bg-[#1E4637]
                        text-white
                        hover:bg-[#16352A]
                        transition-colors
                        shadow-sm
                        disabled:opacity-60
                    "
                >
                    {submitting ? "Submitting..." : "Submit"}
                </button>
            </div>
        </div>
    );
}