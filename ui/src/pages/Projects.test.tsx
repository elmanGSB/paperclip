// @vitest-environment jsdom

<<<<<<< HEAD
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Project } from "@paperclipai/shared";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Projects } from "./Projects";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockProjectsApi = vi.hoisted(() => ({
  list: vi.fn(),
}));
const mockOpenNewProject = vi.hoisted(() => vi.fn());
const mockSetBreadcrumbs = vi.hoisted(() => vi.fn());

vi.mock("../api/projects", () => ({ projectsApi: mockProjectsApi }));
vi.mock("@/lib/router", () => ({
  Link: ({ children, to }: { children?: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));
vi.mock("../context/CompanyContext", () => ({
  useCompany: () => ({ selectedCompanyId: "company-1" }),
}));
vi.mock("../context/DialogContext", () => ({
  useDialogActions: () => ({ openNewProject: mockOpenNewProject }),
}));
=======
import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Project } from "@paperclipai/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../context/ToastContext";
import { Projects } from "./Projects";

const mockProjectsApi = vi.hoisted(() => ({
  list: vi.fn(),
}));

const mockResourceMembershipsApi = vi.hoisted(() => ({
  listMine: vi.fn(),
  updateProject: vi.fn(),
}));

const mockOpenNewProject = vi.hoisted(() => vi.fn());
const mockSetBreadcrumbs = vi.hoisted(() => vi.fn());

vi.mock("@/lib/router", () => ({
  Link: ({ children, to, ...props }: { children?: ReactNode; to: string }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

vi.mock("../context/CompanyContext", () => ({
  useCompany: () => ({ selectedCompanyId: "company-1" }),
}));

vi.mock("../context/DialogContext", () => ({
  useDialogActions: () => ({ openNewProject: mockOpenNewProject }),
}));

>>>>>>> upstream/master
vi.mock("../context/BreadcrumbContext", () => ({
  useBreadcrumbs: () => ({ setBreadcrumbs: mockSetBreadcrumbs }),
}));

<<<<<<< HEAD
function project(overrides: Partial<Project>): Project {
  const now = new Date("2026-05-01T00:00:00Z");
  return {
    id: "project-1",
    companyId: "company-1",
    urlKey: "project-1",
    goalId: null,
    goalIds: [],
    goals: [],
    name: "Project",
=======
vi.mock("../api/projects", () => ({
  projectsApi: mockProjectsApi,
}));

vi.mock("../api/resourceMemberships", () => ({
  resourceMembershipsApi: mockResourceMembershipsApi,
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

if (!globalThis.PointerEvent) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).PointerEvent = MouseEvent;
}

async function act(callback: () => void | Promise<void>) {
  let result: void | Promise<void> = undefined;
  flushSync(() => {
    result = callback();
  });
  await result;
}

function makeProject(overrides: Partial<Project>): Project {
  return {
    id: "project-a",
    companyId: "company-1",
    urlKey: "alpha",
    goalId: null,
    goalIds: [],
    goals: [],
    name: "Alpha",
>>>>>>> upstream/master
    description: null,
    status: "in_progress",
    leadAgentId: null,
    targetDate: null,
<<<<<<< HEAD
    color: "#14b8a6",
=======
    color: "#ef4444",
>>>>>>> upstream/master
    env: null,
    pauseReason: null,
    pausedAt: null,
    executionWorkspacePolicy: null,
    codebase: {
      workspaceId: null,
      repoUrl: null,
      repoRef: null,
      defaultRef: null,
      repoName: null,
      localFolder: null,
<<<<<<< HEAD
      managedFolder: "/tmp/project-1",
      effectiveLocalFolder: "/tmp/project-1",
      origin: "managed_checkout",
    },
    workspaces: [],
    primaryWorkspace: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
=======
      managedFolder: "/tmp/project-a",
      effectiveLocalFolder: "/tmp/project-a",
      origin: "local_folder",
    },
    workspaces: [],
    primaryWorkspace: null,
    managedByPlugin: null,
    archivedAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
>>>>>>> upstream/master
    ...overrides,
  };
}

<<<<<<< HEAD
async function renderProjects(container: HTMLElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let root: Root | null = null;

  await act(async () => {
    root = createRoot(container);
    root.render(
      <QueryClientProvider client={queryClient}>
        <Projects />
      </QueryClientProvider>,
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  return root;
}

function projectLinkNames(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll<HTMLAnchorElement>("a[href^='/projects/']")).map((link) => {
    const title = link.querySelector("span.truncate");
    return title?.textContent ?? "";
=======
async function flushReact() {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
>>>>>>> upstream/master
  });
}

describe("Projects", () => {
<<<<<<< HEAD
  let root: Root | null = null;
  let container: HTMLDivElement;
=======
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null;
  let queryClient: QueryClient;
>>>>>>> upstream/master

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
<<<<<<< HEAD
    mockProjectsApi.list.mockResolvedValue([
      project({
        id: "project-bravo",
        urlKey: "bravo",
        name: "Bravo",
        description: null,
        updatedAt: new Date("2026-05-02T00:00:00Z"),
      }),
      project({
        id: "project-alpha",
        urlKey: "alpha",
        name: "Alpha",
        description: "First project",
        updatedAt: new Date("2026-05-01T00:00:00Z"),
      }),
      project({
        id: "project-charlie",
        urlKey: "charlie",
        name: "Charlie",
        description: null,
        updatedAt: new Date("2026-05-03T00:00:00Z"),
      }),
    ]);
  });

  afterEach(() => {
    act(() => root?.unmount());
    root = null;
    container.remove();
    vi.clearAllMocks();
  });

  it("sorts projects by name by default and can switch sort mode", async () => {
    root = await renderProjects(container);

    expect(projectLinkNames(container)).toEqual(["Alpha", "Bravo", "Charlie"]);

    const select = container.querySelector("select");
    expect(select).not.toBeNull();

    await act(async () => {
      select!.value = "updated";
      select!.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(projectLinkNames(container)).toEqual(["Charlie", "Bravo", "Alpha"]);
  });

  it("reserves description line height for projects without descriptions", async () => {
    root = await renderProjects(container);
=======
    root = null;
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    mockProjectsApi.list.mockResolvedValue([
      makeProject({
        id: "project-c",
        urlKey: "charlie",
        name: "Charlie",
        updatedAt: new Date("2026-01-10T00:00:00Z"),
      }),
      makeProject({
        id: "project-b",
        urlKey: "bravo",
        name: "Bravo",
        updatedAt: new Date("2026-01-05T00:00:00Z"),
      }),
      makeProject({
        id: "project-a",
        urlKey: "alpha",
        name: "Alpha",
        description: "First project",
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      }),
    ]);
    mockResourceMembershipsApi.listMine.mockResolvedValue({
      projectMemberships: { "project-b": "left" },
      agentMemberships: {},
      updatedAt: null,
    });
    mockResourceMembershipsApi.updateProject.mockResolvedValue({
      resourceType: "project",
      resourceId: "project-b",
      state: "joined",
      updatedAt: new Date("2026-01-05T00:00:00Z"),
    });
  });

  afterEach(async () => {
    const currentRoot = root;
    if (currentRoot) {
      await act(async () => {
        currentRoot.unmount();
      });
    }
    queryClient.clear();
    container.remove();
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  async function renderProjects() {
    const currentRoot = createRoot(container);
    root = currentRoot;

    await act(async () => {
      currentRoot.render(
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <Projects />
          </ToastProvider>
        </QueryClientProvider>,
      );
    });
    await flushReact();
    await flushReact();
  }

  async function openSortMenu() {
    const trigger = container.querySelector<HTMLButtonElement>('button[title="Sort"]');
    expect(trigger).not.toBeNull();

    await act(async () => {
      trigger?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flushReact();
  }

  async function chooseSortField(label: string) {
    const item = Array.from(document.body.querySelectorAll("button"))
      .find((element) => element.textContent?.includes(label));
    expect(item).toBeTruthy();

    await act(async () => {
      item?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flushReact();
  }

  it("groups joined projects above left projects and defaults sorting by name", async () => {
    await renderProjects();

    const content = container.textContent ?? "";
    expect(container.querySelector('button[title="Sort"]')?.textContent).toContain("Sort: Name");
    expect(content.indexOf("My Projects")).toBeLessThan(content.indexOf("Alpha"));
    expect(content.indexOf("Alpha")).toBeLessThan(content.indexOf("Charlie"));
    expect(content.indexOf("Charlie")).toBeLessThan(content.indexOf("Other Projects"));
    expect(content.indexOf("Other Projects")).toBeLessThan(content.indexOf("Bravo"));
    expect(content).toContain("in progress");
  });

  it("sorts grouped projects by the selected field", async () => {
    await renderProjects();
    await openSortMenu();
    await chooseSortField("Updated");

    const content = container.textContent ?? "";
    expect(content.indexOf("My Projects")).toBeLessThan(content.indexOf("Charlie"));
    expect(content.indexOf("Charlie")).toBeLessThan(content.indexOf("Alpha"));
    expect(content.indexOf("Alpha")).toBeLessThan(content.indexOf("Other Projects"));
  });

  it("reserves description line height for projects without descriptions", async () => {
    await renderProjects();
>>>>>>> upstream/master

    const bravoLink = Array.from(container.querySelectorAll<HTMLAnchorElement>("a")).find((link) =>
      link.textContent?.includes("Bravo"),
    );
    const hiddenDescriptionLine = bravoLink?.querySelector("p[aria-hidden='true']");

    expect(hiddenDescriptionLine).not.toBeNull();
    expect(hiddenDescriptionLine?.className).toContain("min-h-4");
  });
});
