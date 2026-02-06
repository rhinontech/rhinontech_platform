"use client";

import type React from "react";

import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

import CreateViewModal from "@/components/Pages/CRM/CreateViewModal";
import CreateGroupModal from "@/components/Pages/CRM/CreateGroupModal";
import {
  createGroup,
  getAllGroupsWithView,
  deleteGroup,
  deleteView,
  type ICreateGroup,
  type ICreateGroupView,
  createGroupView,
} from "@/services/crm/groupViewServices";
import { Table, GitBranch } from "lucide-react";
import Loading from "@/app/loading";

const role = Cookies.get("currentRole");
const BASE_PATH = `/${role}/leads`;

interface View {
  id: number;
  view_name: string;
  view_type: string;
  view_manage_type: string;
}

interface Group {
  id: number;
  group_name: string;
  manage_type: string;
  views: View[];
  isOpen?: boolean;
}

export function CrmSidebar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();

  // GROUP LIST
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const viewTypeIcons: any = {
    pipeline: <GitBranch width={16} height={16} />,
    table: <Table width={16} height={16} />,
  };

  // MODALS STATE
  const [openGroupModal, setOpenGroupModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState<string | null>(null);

  // TOGGLE GROUP COLLAPSE
  const toggleGroup = (id: number) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, isOpen: !g.isOpen } : g))
    );
  };

  const handleDeleteGroup = async (groupId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteGroup(groupId.toString());
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    } catch (error) {
      console.error("Failed to delete group", error);
    }
  };

  const handleDeleteView = async (
    groupId: number,
    viewId: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      await deleteView(viewId.toString());
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, views: g.views.filter((v) => v.id !== viewId) }
            : g
        )
      );
    } catch (error) {
      console.error("Failed to delete view", error);
    }
  };

  // CREATE GROUP
  const addGroup = (name: string, manage: string) => {
    const requestbody = {
      group_name: name,
      manage_type: manage,
    };

    createGroupFn(requestbody);
  };

  // CREATE VIEW
  const addView = (
    groupId: number,
    name: string,
    type: string,
    manage: string
  ) => {
    // TODO: Implement view creation API
    const requestbody = {
      view_name: name,
      view_manage_type: manage,
      view_type: type,
    };

    createViewFn(groupId, requestbody);
  };

  const getAllGroupsWithViewFn = async () => {
    try {
      setLoading(true);
      const data = await getAllGroupsWithView();
      const formattedGroups = data.groups.map((group: Group) => ({
        ...group,
        isOpen: true,
      }));
      setGroups(formattedGroups);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const createGroupFn = async (requestbody: ICreateGroup) => {
    try {
      const data = await createGroup(requestbody);
      if (data?.groups) {
        const formattedGroups = data.groups.map((group: Group) => ({
          ...group,
          isOpen: true,
        }));
        setGroups(formattedGroups);
        setOpenGroupModal(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const createViewFn = async (
    groupId: number | string,
    requestbody: ICreateGroupView
  ) => {
    try {
      const numericId = Number(groupId);

      console.log(numericId);
      const data = await createGroupView(numericId, requestbody);

      if (data?.views) {
        setGroups((prev) =>
          prev.map((g) =>
            g.id !== numericId
              ? g
              : {
                ...g,
                views: data.views,
                isOpen: true,
              }
          )
        );

        setOpenViewModal(null);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllGroupsWithViewFn();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 w-full h-[calc(100vh-var(--header-height)-1rem)]">
        <Loading areaOnly />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full overflow-hidden bg-sidebar transition-[height] ease-in-out h-[calc(100vh-var(--header-height)-1rem)]"
      )}>
      {/* SIDEBAR */}
      <div className="shrink-0 w-60 bg-sidebar flex flex-col h-full min-h-0">
        <div className="h-[60px] px-4 flex items-center font-semibold text-lg">
          Leads
        </div>

        {/* STATIC DASHBOARD - FIXED */}
        <div className="p-3 pb-0 space-y-3">
          <div
            className={cn(
              "px-3 py-2 cursor-pointer rounded-md hover:bg-accent",
              path === `${BASE_PATH}/dashboard` && "bg-accent font-semibold"
            )}
            onClick={() => router.push(`${BASE_PATH}/dashboard`)}>
            Dashboard
          </div>

          {/* TITLE - FIXED */}
          <p className="text-xs text-muted-foreground mt-2 px-2">MY GROUPS</p>
        </div>

        {/* CONTENT - SCROLLABLE */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <div className="p-3 pt-0 space-y-3">

            {/* GROUPS */}
            {groups.map((group) => (
              <div key={group.id} className="mt-2">
                {/* HEADER */}
                <div
                  className="flex justify-between items-center px-3 py-1 cursor-pointer hover:bg-accent rounded group/header"
                  onClick={() => toggleGroup(group.id)}>
                  <span className="font-medium text-sm">
                    {group.group_name}
                  </span>
                  <div className="flex gap-1">
                    <button
                      className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover/header:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteGroup(group.id, e)}
                      title="Delete group">
                      ✕
                    </button>
                  </div>
                </div>

                {/* COLLAPSE VIEWS */}
                {group.isOpen && (
                  <div className="ml-6 mt-1 space-y-1">
                    {group.views.map((view) => (
                      <div
                        key={view.id}
                        className={cn(
                          "px-3 py-1 text-sm cursor-pointer rounded hover:bg-accent flex justify-between items-center group/view"
                        )}
                        onClick={() => {
                          const viewPath =
                            view.view_type === "pipeline"
                              ? `${BASE_PATH}/group/${view.id}/pipeline`
                              : `${BASE_PATH}/group/${view.id}/table`;

                          router.push(viewPath);
                        }}>
                        {/* <span> <Table width={16} height={16} /> {view.view_name}</span> */}
                        <span className="flex items-center gap-2">
                          {viewTypeIcons[view.view_type] || (
                            <Table width={16} height={16} />
                          )}
                          {view.view_name}
                        </span>
                        <button
                          className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover/view:opacity-100 transition-opacity"
                          onClick={(e) =>
                            handleDeleteView(group.id, view.id, e)
                          }
                          title="Delete view">
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      className="text-xs text-blue-500 hover:text-blue-700 ml-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenViewModal(group.id.toString());
                      }}>
                      + View
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* NEW GROUP */}
            <button
              onClick={() => setOpenGroupModal(true)}
              className="mt-3 w-full text-left text-sm px-3 py-2 text-blue-500 hover:underline">
              + New group
            </button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "flex-1 w-full overflow-hidden rounded-lg border-2 bg-background transition-[height] duration-[2000ms] ease-in-out h-[calc(100vh-var(--header-height)-1rem)]"
        )}>
        {children}
      </div>
      {/* MODALS */}
      {openGroupModal && (
        <CreateGroupModal
          open={openGroupModal}
          setOpen={setOpenGroupModal}
          onCreate={addGroup}
        />
      )}

      {openViewModal && (
        <CreateViewModal
          open={!!openViewModal}
          setOpen={setOpenViewModal}
          groupId={openViewModal}
          onCreate={addView}
        />
      )}
    </div>
  );
}
