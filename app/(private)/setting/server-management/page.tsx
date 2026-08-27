"use client";

import { Fragment, useEffect, useState } from "react";
import {
  addServer,
  AddServerRequest,
} from "@/services/integration/project/post_server";
import {
  addProject,
  AddProjectRequest,
} from "@/services/integration/project/post_project";
import {
  getServers,
  ServerResponse,
} from "@/services/integration/project/get_server";
import {
  getProjectsByServerID,
  ProjectResponse,
} from "@/services/integration/project/get_project_by_server_id";
import { verifyJWT } from "@/lib/auth/verify-jwt";
import { getInstitutions } from "@/services/integration/institution/get-all-insti";

// ---------- Constants ----------

const EMPTY_SERVER_FORM: AddServerRequest = {
  server_name: "",
  server_ip: "",
  institution_id: 0,
};

const EMPTY_PROJECT_FORM: Omit<AddProjectRequest, "server_id"> = {
  project_name: "",
  environment: "development",
  description: "",
};

const ENVIRONMENT_OPTIONS = [
  "development",
  "staging",
  "production",
];

// ---------- Icons ----------

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${
        open ? "rotate-90" : ""
      }`}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ---------- Add Server Modal ----------

interface AddServerModalProps {
  open: boolean;
  institutionId: number | null;
  onClose: () => void;
  onCreated: () => void;
}

function AddServerModal({
  open,
  institutionId,
  onClose,
  onCreated,
}: AddServerModalProps) {
  const [form, setForm] =
    useState<AddServerRequest>(EMPTY_SERVER_FORM);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.server_name.trim()) {
      setError("Server name is required.");
      return;
    }

    if (!form.server_ip.trim()) {
      setError("Server IP is required.");
      return;
    }

    if (!institutionId) {
      setError(
        "Institution ID not found. Please re-login and try again."
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload: AddServerRequest = {
        ...form,
        institution_id: institutionId,
      };

      await addServer(payload);

      setForm(EMPTY_SERVER_FORM);

      onClose();
      onCreated();
    } catch (err) {
      console.error("Failed to create server:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create server."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-base font-semibold text-slate-800">
          Add New Server
        </h2>

        <label className="mb-1 block text-xs font-semibold text-slate-500">
          Server Name
        </label>

        <input
          type="text"
          value={form.server_name}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              server_name: e.target.value,
            }))
          }
          placeholder="e.g. prod-web-01"
          className="mb-4 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
        />

        <label className="mb-1 block text-xs font-semibold text-slate-500">
          Server IP
        </label>

        <input
          type="text"
          value={form.server_ip}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              server_ip: e.target.value,
            }))
          }
          placeholder="e.g. 10.0.0.12"
          className="mb-4 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
        />

        {error && (
          <p className="mb-3 text-sm text-red-500">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setForm(EMPTY_SERVER_FORM);
              setError("");
              onClose();
            }}
            disabled={submitting}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {submitting
              ? "Creating..."
              : "Create Server"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Add Project Modal ----------

interface AddProjectModalProps {
  open: boolean;
  serverId: number | null;
  serverName: string;
  onClose: () => void;
  onCreated: (serverId: number) => void;
}

function AddProjectModal({
  open,
  serverId,
  serverName,
  onClose,
  onCreated,
}: AddProjectModalProps) {
  const [form, setForm] =
    useState(EMPTY_PROJECT_FORM);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open || serverId === null) return null;

  const handleSubmit = async () => {
    if (!form.project_name.trim()) {
      setError("Project name is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await addProject({
        ...form,
        server_id: serverId,
      });

      setForm(EMPTY_PROJECT_FORM);

      onClose();
      onCreated(serverId);
    } catch (err) {
      console.error("Failed to create project:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create project."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <h2 className="mb-1 text-base font-semibold text-slate-800">
          Add New Project
        </h2>

        <p className="mb-4 text-xs text-slate-400">
          Under {serverName}
        </p>

        <label className="mb-1 block text-xs font-semibold text-slate-500">
          Project Name
        </label>

        <input
          type="text"
          value={form.project_name}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              project_name: e.target.value,
            }))
          }
          placeholder="e.g. Ticketing API"
          className="mb-4 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
        />

        <label className="mb-1 block text-xs font-semibold text-slate-500">
          Environment
        </label>

        <select
          value={form.environment}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              environment: e.target.value,
            }))
          }
          className="mb-4 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
        >
          {ENVIRONMENT_OPTIONS.map((env) => (
            <option key={env} value={env}>
              {env.charAt(0).toUpperCase() +
                env.slice(1)}
            </option>
          ))}
        </select>

        <label className="mb-1 block text-xs font-semibold text-slate-500">
          Description
        </label>

        <textarea
          value={form.description}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          placeholder="Short description of the project"
          rows={3}
          className="mb-4 w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
        />

        {error && (
          <p className="mb-3 text-sm text-red-500">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setForm(EMPTY_PROJECT_FORM);
              setError("");
              onClose();
            }}
            disabled={submitting}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {submitting
              ? "Creating..."
              : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Projects Panel ----------

interface ProjectsPanelProps {
  projects: ProjectResponse[];
  loading: boolean;
}

function ProjectsPanel({
  projects,
  loading,
}: ProjectsPanelProps) {
  return (
    <tr className="border-b border-slate-100 bg-slate-50/60">
      <td colSpan={4} className="px-6 py-4">
        {loading ? (
          <p className="py-4 text-center text-sm text-slate-400">
            Loading projects...
          </p>
        ) : projects.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">
            No projects found under this server.
          </p>
        ) : (
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold tracking-wide text-slate-400">
                <th className="px-4 py-2">
                  PROJECT
                </th>

                <th className="px-4 py-2">
                  ENVIRONMENT
                </th>

                <th className="px-4 py-2">
                  DESCRIPTION
                </th>

                <th className="px-4 py-2">
                  STATUS
                </th>
              </tr>
            </thead>

            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.project_id}
                  className="text-slate-700"
                >
                  <td className="px-4 py-2 font-medium text-slate-800">
                    {project.project_name}
                  </td>

                  <td className="px-4 py-2 capitalize">
                    {project.environment}
                  </td>

                  <td className="px-4 py-2 text-slate-500">
                    {project.description || "-"}
                  </td>

                  <td className="px-4 py-2 capitalize">
                    {project.status || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </td>
    </tr>
  );
}

// ---------- Page ----------

export default function ServersPage() {
  const [servers, setServers] =
    useState<ServerResponse[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [institutionId, setInstitutionId] =
    useState<number | null>(null);

  const [institutionName, setInstitutionName] =
    useState("");

  const [expandedServerId, setExpandedServerId] =
    useState<number | null>(null);

  const [projectsByServer, setProjectsByServer] =
    useState<Record<number, ProjectResponse[]>>(
      {}
    );

  const [loadingProjectsFor, setLoadingProjectsFor] =
    useState<number | null>(null);

  const [isAddServerOpen, setIsAddServerOpen] =
    useState(false);

  const [isAddProjectOpen, setIsAddProjectOpen] =
    useState(false);

  const [addProjectTarget, setAddProjectTarget] =
    useState<{
      serverId: number;
      serverName: string;
    } | null>(null);

  // ---------- Resolve Institution ----------

  const resolveInstitutionId = async () => {
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token");

      if (!token) {
        console.error("No JWT token found");
        return;
      }

      const payload = await verifyJWT(token);

      if (!payload) {
        console.error(
          "JWT verification failed"
        );
        return;
      }

      const rawInstitutionId =
        payload.institution_id;

      if (
        rawInstitutionId === undefined ||
        rawInstitutionId === null
      ) {
        console.error(
          "institution_id is missing from JWT"
        );
        return;
      }

      const parsedInstitutionId =
        Number(rawInstitutionId);

      if (
        !Number.isInteger(parsedInstitutionId) ||
        parsedInstitutionId <= 0
      ) {
        console.error(
          "Invalid institution_id:",
          rawInstitutionId
        );
        return;
      }

      setInstitutionId(parsedInstitutionId);

      fetchInstitutionName(
        parsedInstitutionId
      );
    } catch (err) {
      console.error(
        "Failed to resolve institution ID:",
        err
      );
    }
  };

  // ---------- Fetch Institution Name ----------

  const fetchInstitutionName = async (
    targetInstitutionId: number
  ) => {
    try {
      const result =
        await getInstitutions();

      const match =
        result.response?.find(
          (institution) =>
            institution.institution_id ===
            targetInstitutionId
        );

      if (match) {
        setInstitutionName(
          match.institution_name
        );
      } else {
        console.error(
          "No matching institution found for id:",
          targetInstitutionId
        );
      }
    } catch (err) {
      console.error(
        "Failed to fetch institutions:",
        err
      );
    }
  };

  // ---------- Fetch Servers ----------

  const fetchServers = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getServers();

      setServers(result);
    } catch (err) {
      console.error("Failed to fetch servers:", err);

      setServers([]);
      setError("Failed to fetch servers.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Fetch Projects For Server ----------

  const fetchProjectsForServer = async (
    serverId: number
  ) => {
    try {
      setLoadingProjectsFor(serverId);

      const projects = await getProjectsByServerID(
        serverId
      );

      setProjectsByServer((prev) => ({
        ...prev,
        [serverId]: projects,
      }));
    } catch (err) {
      console.error(
        "Failed to fetch projects:",
        err
      );

      setProjectsByServer((prev) => ({
        ...prev,
        [serverId]: [],
      }));
    } finally {
      setLoadingProjectsFor(null);
    }
  };

  // ---------- Expand / Collapse ----------

  const toggleExpand = async (
    server: ServerResponse
  ) => {
    if (
      expandedServerId === server.server_id
    ) {
      setExpandedServerId(null);
      return;
    }

    setExpandedServerId(server.server_id);

    // Always fetch fresh — a server can have multiple
    // projects, so there's no single project_id to
    // check on the server object.
    await fetchProjectsForServer(server.server_id);
  };

  // ---------- Add Project ----------

  const handleAddProjectClick = (
    e: React.MouseEvent,
    serverId: number,
    serverName: string
  ) => {
    e.stopPropagation();

    setAddProjectTarget({
      serverId,
      serverName,
    });

    setIsAddProjectOpen(true);
  };

  const handleProjectCreated = (
    serverId: number
  ) => {
    // Re-fetch this server's projects so the newly
    // created one shows up immediately if the panel
    // is expanded.
    fetchProjectsForServer(serverId);

    setAddProjectTarget(null);
  };

  // ---------- Initial Load ----------

  useEffect(() => {
    fetchServers();
    resolveInstitutionId();
  }, []);

  // ---------- UI ----------

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-8xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Header */}

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h1 className="text-lg font-semibold text-slate-800">
            {institutionName ||
              "Institution"}
          </h1>

          <button
            onClick={() =>
              setIsAddServerOpen(true)
            }
            aria-label="Add server"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-400 text-emerald-500 transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <PlusIcon />
          </button>
        </div>

        {/* Error */}

        {error && servers.length > 0 && (
          <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-6 py-2 text-sm text-red-600">
            <span>{error}</span>

            <button
              onClick={() =>
                setError("")
              }
              aria-label="Dismiss"
              className="ml-4 text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* Table */}

        <div
          className="overflow-x-auto"
          style={{
            WebkitOverflowScrolling:
              "touch",
          }}
        >
          <table className="w-full min-w-[700px] border-collapse text-left whitespace-nowrap">

            {/* Header */}

            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold tracking-wide text-slate-400">
                <th className="w-10 px-6 py-3" />

                <th className="px-4 py-3">
                  SERVER NAME
                </th>

                <th className="px-4 py-3">
                  SERVER IP
                </th>

                <th className="w-14 px-4 py-3" />
              </tr>
            </thead>

            {/* Body */}

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-16 text-center text-sm text-slate-400"
                  >
                    Loading servers...
                  </td>
                </tr>
              ) : error &&
                servers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-16 text-center text-sm text-red-400"
                  >
                    {error}
                  </td>
                </tr>
              ) : servers.length > 0 ? (
                servers.map((server) => {
                  const isExpanded =
                    expandedServerId ===
                    server.server_id;

                  return (
                    <Fragment
                      key={server.server_id}
                    >
                      <tr
                        onClick={() =>
                          toggleExpand(
                            server
                          )
                        }
                        className="cursor-pointer border-b border-slate-100 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 text-slate-400">
                          <ChevronIcon
                            open={
                              isExpanded
                            }
                          />
                        </td>

                        <td className="px-4 py-4 font-medium text-slate-800">
                          {
                            server.server_name
                          }
                        </td>

                        <td className="px-4 py-4">
                          {server.server_ip}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={(e) =>
                              handleAddProjectClick(
                                e,
                                server.server_id,
                                server.server_name
                              )
                            }
                            className="rounded-md border border-emerald-400 px-3 py-1.5 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                          >
                            Add Project
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <ProjectsPanel
                          projects={
                            projectsByServer[
                              server.server_id
                            ] ?? []
                          }
                          loading={
                            loadingProjectsFor ===
                            server.server_id
                          }
                        />
                      )}
                    </Fragment>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-16 text-center text-sm text-slate-400"
                  >
                    No servers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Server Modal */}

      <AddServerModal
        open={isAddServerOpen}
        institutionId={institutionId}
        onClose={() =>
          setIsAddServerOpen(false)
        }
        onCreated={() => {
          fetchServers();
          setIsAddServerOpen(false);
        }}
      />

      {/* Add Project Modal */}

      <AddProjectModal
        open={isAddProjectOpen}
        serverId={
          addProjectTarget?.serverId ??
          null
        }
        serverName={
          addProjectTarget?.serverName ??
          ""
        }
        onClose={() => {
          setIsAddProjectOpen(false);
          setAddProjectTarget(null);
        }}
        onCreated={
          handleProjectCreated
        }
      />
    </main>
  );
}