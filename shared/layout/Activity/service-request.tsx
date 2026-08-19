"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Upload, X } from "lucide-react";
import { CreateTicketError } from "@/shared/layout/Activity/api/create-sr";
import { createTicket, CreateTicketRequest } from "@/services/integration/ticket/post_ticket"; // adjust path to match your project
import { getCategories, CategoryResp } from "@/services/integration/insti-admin/get_all_category"; // adjust path to match your project
import { getSubCategories, SubCategoryResp } from "@/services/integration/insti-admin/get_all_sub_category"; // adjust path to match your project
import { getUsersByInstitutionId, UserDetails } from "@/services/integration/super_admin/get_user_insti_id"; // adjust path to match your project
import { getResolverGroups, ResolverGroup } from "@/services/integration/institution/get-resolver-groups"; // adjust path to match your project
import { getInstitutions, InstitutionResp } from "@/services/integration/institution/get-all-insti"; // adjust path to match your project
import { getTicketTypes, TicketTypeResp } from "@/services/integration/insti-admin/get_all_ticket_type"; // adjust path to match your project
import { verifyJWT } from "@/lib/auth/verify-jwt"; // adjust path to match your project

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
    description: string;
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
    const [institutionId, setInstitutionId] = useState<number | null>(null);

    // Endorser options come from getUsersByInstitutionId (role.can_endorse).
    // Resolver options come from getResolverGroups, scoped to institution.
    const [endorserOptions, setEndorserOptions] = useState<SelectOption[]>([]);
    const [resolverOptions, setResolverOptions] = useState<SelectOption[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [resolverGroupsLoading, setResolverGroupsLoading] = useState(false);

    // Institution Pool options — this is the "institutionPool" field the
    // backend requires on submit. Independent of the JWT-derived
    // institutionId above (that one scopes endorsers/resolvers; this one
    // is the full list the requester picks from for the ticket itself).
    const [institutionPoolOptions, setInstitutionPoolOptions] = useState<SelectOption[]>([]);
    const [institutionPoolLoading, setInstitutionPoolLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;

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

                if (!cancelled) {
                    setInstitutionPoolOptions(options);
                }
            } catch (err) {
                if (!cancelled) {
                    setError("Failed to load institution pool options. Please try again.");
                }
            } finally {
                if (!cancelled) {
                    setInstitutionPoolLoading(false);
                }
            }
        };

        fetchInstitutions();

        return () => {
            cancelled = true;
        };
    }, []);

    // Ticket Type — this panel defaults to Service Request, so we fetch the
    // real list once and pre-select whichever entry matches "Service
    // Request" by name. The field stays selectable (like Institution Pool)
    // in case the user needs to pick a different type.
    const [ticketTypeOptions, setTicketTypeOptions] = useState<SelectOption[]>([]);
    const [ticketTypeLoading, setTicketTypeLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;

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

                if (!cancelled) {
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
                if (!cancelled) {
                    setError("Failed to load ticket type. Please try again.");
                }
            } finally {
                if (!cancelled) {
                    setTicketTypeLoading(false);
                }
            }
        };

        fetchTicketTypes();

        return () => {
            cancelled = true;
        };
    }, []);

    // Decode the JWT once on mount to find which institution to scope
    // the endorser/resolver lookups to.
    useEffect(() => {
        let cancelled = false;

        const resolveInstitution = async () => {
            const token = getAuthToken();

            if (!token) {
                if (!cancelled) {
                    setError("You must be logged in to load endorsers and resolvers.");
                }
                return;
            }

            const payload = await verifyJWT(token);

            if (!payload?.institution_id) {
                if (!cancelled) {
                    setError("Unable to determine your institution from your session.");
                }
                return;
            }

            if (!cancelled) {
                setInstitutionId(payload.institution_id);
            }
        };

        resolveInstitution();

        return () => {
            cancelled = true;
        };
    }, []);

    // Once we know the institution, fetch its users and pull out endorsers
    // (role.can_endorse). Resolvers now come from getResolverGroups instead
    // of individual users — see the resolver group effect below.
    useEffect(() => {
        let cancelled = false;

        if (!institutionId) return;

        const fetchUsers = async () => {
            setUsersLoading(true);

            try {
                const res = await getUsersByInstitutionId(institutionId);

                const users = (res?.response ?? []).filter(
                    (u: UserDetails) => u.status === "active" // remove if status shouldn't gate visibility
                );

                const toOption = (u: UserDetails): SelectOption => ({
                    id: String(u.id),
                    label: `${u.first_name} ${u.last_name}`,
                });

                const endorsers = users
                    .filter((u) => u.role?.can_endorse)
                    .map(toOption);

                if (!cancelled) {
                    setEndorserOptions(endorsers);
                }
            } catch (err) {
                if (!cancelled) {
                    setError("Failed to load endorsers. Please try again.");
                }
            } finally {
                if (!cancelled) {
                    setUsersLoading(false);
                }
            }
        };

        fetchUsers();

        return () => {
            cancelled = true;
        };
    }, [institutionId]);

    // Resolver options now come from resolver groups instead of individual
    // users, scoped to the same institution resolved from the JWT.
    useEffect(() => {
        let cancelled = false;

        if (!institutionId) return;

        const fetchResolverGroups = async () => {
            setResolverGroupsLoading(true);

            try {
                const res = await getResolverGroups();

                const options: SelectOption[] = (res?.response ?? [])
                    .filter(
                        (g: ResolverGroup) =>
                            g.status === "active" &&
                            g.institution_id === institutionId
                    )
                    .map((g: ResolverGroup) => ({
                        id: String(g.resolver_group_id),
                        label: g.group_name,
                    }));

                if (!cancelled) {
                    setResolverOptions(options);
                }
            } catch (err) {
                if (!cancelled) {
                    setError("Failed to load resolver groups. Please try again.");
                }
            } finally {
                if (!cancelled) {
                    setResolverGroupsLoading(false);
                }
            }
        };

        fetchResolverGroups();

        return () => {
            cancelled = true;
        };
    }, [institutionId]);

    // Categories depend on the resolved ticket type, so wait for
    // form.ticketTypeId to be populated by the ticket-type fetch above.
    useEffect(() => {
        let cancelled = false;

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

                if (!cancelled) {
                    setCategoryOptions(options);
                }
            } catch (err) {
                if (!cancelled) {
                    setError("Failed to load categories. Please try again.");
                }
            } finally {
                if (!cancelled) {
                    setCategoriesLoading(false);
                }
            }
        };

        fetchCategories();

        return () => {
            cancelled = true;
        };
    }, [form.ticketTypeId]);

    // Fetch subcategories whenever the selected category changes.
    useEffect(() => {
        let cancelled = false;

        // No category selected yet — clear subcategory state and stop.
        if (!form.categoryId) {
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

                if (!cancelled) {
                    setSubcategoryOptions(options);
                    setSubcategoryDetails(records);
                }
            } catch (err) {
                if (!cancelled) {
                    setError("Failed to load subcategories. Please try again.");
                }
            } finally {
                if (!cancelled) {
                    setSubcategoriesLoading(false);
                }
            }
        };

        fetchSubCategories();

        return () => {
            cancelled = true;
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

    // Subcategory changed: pull subject/description/duration off the
    // matching record so "Reload Template" has something to load.
    const handleSubcategoryChange = (value: string) => {
        setForm((prev) => ({
            ...prev,
            subcategoryId: value,
        }));
    };

    const handleReloadTemplate = () => {
        const selected = subcategoryDetails.find(
            (sc) => String(sc.sub_category_id) === form.subcategoryId
        );

        if (!selected) {
            updateField("description")("");
            return;
        }

        setForm((prev) => ({
            ...prev,
            subject: selected.subject_name || prev.subject,
            description: selected.description || "",
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
        if (!form.subject) missing.push("Subject");

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

                        {/* Institution Pool — required by the API as "institutionPool" */}
                        <SelectField
                            label={
                                institutionPoolLoading
                                    ? "Institution Pool (loading...)"
                                    : "Institution Pool"
                            }
                            value={form.approverPoolId}
                            onChange={updateField("approverPoolId")}
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

                        {/* Project Name */}
                        <SelectField
                            label="Project Name"
                            value={form.projectName}
                            onChange={updateField("projectName")}
                            options={[
                                {
                                    id: "Project Alpha",
                                    label: "Project Alpha",
                                },
                                {
                                    id: "Project Beta",
                                    label: "Project Beta",
                                },
                            ]}
                        />
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

                        {/* Resolver — now backed by resolver groups, not individual users */}
                        <SelectField
                            label={
                                resolverGroupsLoading
                                    ? "Resolver (loading...)"
                                    : "Resolver"
                            }
                            value={form.resolver}
                            onChange={updateField("resolver")}
                            options={resolverOptions}
                            disabled={resolverGroupsLoading}
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
                            <label className="block text-xs font-bold text-[#1E4637] mb-1">
                                Subject:
                            </label>

                            <input
                                type="text"
                                value={form.subject}
                                onChange={(e) =>
                                    updateField("subject")(
                                        e.target.value
                                    )
                                }
                                placeholder="Brief summary of the ticket"
                                className="
                                    w-full
                                    border
                                    border-gray-200
                                    rounded-lg
                                    px-2.5
                                    py-1.5
                                    bg-transparent
                                    text-sm
                                    text-gray-700
                                    focus:outline-none
                                    focus:ring-2
                                    focus:ring-[#1E4637]/30
                                    placeholder:text-gray-300
                                "
                            />
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

                            <textarea
                                value={form.description}
                                onChange={(e) =>
                                    updateField("description")(
                                        e.target.value
                                    )
                                }
                                placeholder="Describe the request in detail..."
                                className="
                                    w-full
                                    flex-1
                                    resize-none
                                    border
                                    border-gray-200
                                    rounded-lg
                                    px-2.5
                                    py-1.5
                                    bg-transparent
                                    text-sm
                                    text-gray-700
                                    focus:outline-none
                                    focus:ring-2
                                    focus:ring-[#1E4637]/30
                                    placeholder:text-gray-300
                                "
                            />
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