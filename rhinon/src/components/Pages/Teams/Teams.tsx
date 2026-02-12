"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SecureImage } from "@/components/Common/SecureImage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  X,
  PanelRight,
  Search,
  Plus,
  MoreHorizontal,
  ChevronDown,
  Clock,
  MessageCircle,
  Target,
  TrendingUp,
  ChevronRight,
  UserPlus,
  Settings,
  Check,
  Trash2,
  ChevronUp,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createRole,
  createUser,
  deleteRole,
  deleteUser,
  getRoles,
  getUsers,
  updateRole,
  updateUser,
} from "@/services/teams/teamServices";
import { useUserStore } from "@/utils/store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import Loading from "@/app/loading";
import { PLAN_LIMITS } from "@/lib/plans";

const availableAccess = [
  {
    id: "access_dashboard",
    label: "Access Dashboard",
    description: "View and interact with the main dashboard",
  },
  {
    id: "handle_chats",
    label: "Chats",
    description: "Access and manage customer chats in support",
  },
  {
    id: "handle_tickets",
    label: "Tickets",
    description: "Access and manage customer chats in support",
  },
  {
    id: "automate_tasks",
    label: "Automate",
    description: "Configure and manage automation workflows",
  },
  {
    id: "engage_customers",
    label: "Engage",
    description: "Launch campaigns and engage with users",
  },
  {
    id: "manage_crm",
    label: "CRM",
    description: "Manage leads, contacts, and CRM data",
  },
  {
    id: "view_seo_analytics",
    label: "SEO",
    description: "View SEO Compliance, Performance, Audit",
  },
  {
    id: "manage_users",
    label: "Teams",
    description: "Add, remove, and modify team members",
  },
  {
    id: "view_knowledge_base",
    label: "Knowledge Base",
    description: "Access articles and documentation",
  },
  {
    id: "team_space",
    label: "Spaces",
    description: "Manage workspaces for tasks and team assignments",
  },
  {
    id: "billing_access",
    label: "Billing",
    description: "View and manage billing and invoices",
  },
  {
    id: "manage_settings",
    label: "Settings",
    description: "Access and update application settings",
  },
];

interface Role {
  name: string;
  access: string[];
}

interface Teams {
  user_id: number;
  first_name: string;
  last_name: string;
  image_url: string;
  assigned_roles: string[];
  current_role: string;
  email: string;
  is_email_confirmed: boolean;
  last_active: string;
}

export default function Teams() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [allTeamMembers, setAllMembers] = useState<Teams[]>([]);
  const [selectedMember, setSelectedMember] = useState<Teams>();
  const [groupsExpanded, setGroupsExpanded] = useState(true);
  const [workingHoursExpanded, setWorkingHoursExpanded] = useState(true);
  const [performanceExpanded, setPerformanceExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [createRoleModalOpen, setCreateRoleModalOpen] = useState(false);

  // Form states
  const [inviteEmail, setInviteEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedAccess, setSelectedAccess] = useState<string[]>([
    "access_dashboard",
  ]);
  const [isEditRoleMode, setIsEditRoleMode] = useState(false);
  const [editingRoleName, setEditingRoleName] = useState("");

  const [customRoles, setCustomRoles] = useState<Role[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const setUserData = useUserStore((state) => state.setUserData);
  const yourUserId = useUserStore((state) => state.userData.userId);
  const currentUserRoles = useUserStore(
    (state) => state.userData.assignedRoles
  );

  const orgPlan = useUserStore((state) => state.userData.orgPlan);
  const canAddUser = allTeamMembers.length < PLAN_LIMITS[orgPlan]?.users;

  const statusOptions = [
    { label: "Accepting chats", color: "bg-green-500" },
    { label: "Stop accepting chats", color: "bg-red-500" },
    { label: "Log out", color: "bg-gray-400" },
  ];
  const [open, setOpen] = useState(false);
  // State in Teams component
  const [rolesModalOpen, setRolesModalOpen] = useState(false);

  const handleToggleRole = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName]
    );
  };

  const fetchAllRoles = async () => {
    try {
      const response = await getRoles();
      console.log(response);
      const { roles = [], access = {} } = response?.data || {};

      const formattedRoles = roles.map((role: any) => ({
        name: role,
        access: access[role] || [],
      }));
      console.log("roles", formattedRoles);
      setCustomRoles(formattedRoles);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  const getAllUsers = async () => {
    try {
      const response = await getUsers();
      console.log(response.data);
      setAllMembers(response.data);
      setSelectedMember(response.data[0]);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAllRoles(), getAllUsers()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleInviteAgent = async () => {
    if (inviteEmail && selectedRoles.length > 0 && firstName && lastName) {
      // Map selectedRoles to permissions
      // const permissions = selectedRoles.reduce((acc, roleName) => {
      //   const role = customRoles.find((r) => r.name === roleName);
      //   if (role) acc[roleName] = role.access;
      //   return acc;
      // }, {} as Record<string, string[]>);
      setSaveLoading(true);
      const payload = {
        email: inviteEmail,
        roles: selectedRoles,
        first_name: firstName,
        last_name: lastName,
        permissions: {},
      };

      console.log("Inviting Agent with:", payload);

      try {
        await createUser(payload);

        await getAllUsers();
        setInviteEmail("");
        setSelectedRoles([]);
        setFirstName("");
        setLastName("");
        setInviteModalOpen(false);

        toast.success(
          `Invitation sent to ${inviteEmail} with roles: ${selectedRoles.join(
            ", "
          )}`
        );
      } catch (error) {
        console.error("Failed to invite agent:", error);
        toast.error("Failed to send invitation. Please try again.");
      } finally {
        setSaveLoading(false);
      }
    } else {
      toast.error("Please fill in all fields and select at least one role.");
    }
  };

  const handleInviteAgentDialog = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("invite", "true");
    router.push(`?${params.toString()}`);
  };

  const handleCreateRole = async () => {
    console.log("Before:", customRoles);
    setSaveLoading(true);

    if (newRoleName && selectedAccess.length > 0) {
      const value = {
        roleName: newRoleName.toLowerCase().replace(/\s+/g, "-"),
        roleAccess: selectedAccess,
      };

      try {
        if (isEditRoleMode) {
          // Use proper update API instead of delete + create
          await updateRole(editingRoleName, value);
          toast.success(`Role "${newRoleName}" updated successfully`);
        } else {
          await createRole(value);
          toast.success(`Role "${newRoleName}" created successfully`);
        }

        await fetchAllRoles();
        await getAllUsers();

        console.log(isEditRoleMode ? "Role Updated:" : "New Role Added:", value);
      } catch (error) {
        toast.error(isEditRoleMode ? "Error in updating role" : "Error in creating role");
        console.error(isEditRoleMode ? "Error updating role:" : "Error creating role:", error);
      }

      setSaveLoading(false);

      // Reset UI
      setNewRoleName("");
      setSelectedAccess(["access_dashboard"]);
      setIsEditRoleMode(false);
      setEditingRoleName("");
      setCreateRoleModalOpen(false);
    } else {
      setNewRoleName("");
      setSelectedAccess(["access_dashboard"]);
      setIsEditRoleMode(false);
      setEditingRoleName("");
      setCreateRoleModalOpen(false);
      toast.error(
        "Please provide a role name and select at least one permission."
      );
    }
  };

  const handleRoleDelete = async (name: string) => {
    try {
      const response = await deleteRole(name);

      // Check if the deleted role was part of current user's roles
      const roleWasAssigned = currentUserRoles.includes(name);

      if (roleWasAssigned) {
        toast.info("Your assigned role was deleted. Redirecting...");
        router.push("/"); // redirect to home
        return;
      }
      await getAllUsers();
      // Otherwise, just delete the role
      toast.success(`Role "${name}" removed.`);
      await fetchAllRoles();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to remove role "${name}".`);
    }
  };

  const handleEditRole = (role: Role) => {
    setNewRoleName(role.name);
    setSelectedAccess(role.access || ["access_dashboard"]);
    setIsEditRoleMode(true);
    setEditingRoleName(role.name);
    setCreateRoleModalOpen(true);
  };

  const handleUserDelete = async (userId: number, userEmail: string) => {
    if (userId === yourUserId) {
      toast.warning(`You can't delete yourself.`);
      return;
    }

    try {
      await deleteUser(userId);
      await getAllUsers();
      console.log("User deleted:", userId, userEmail);
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setOpenConfirmationDialog(false);
    }
  };

  const handleAccessChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedAccess([...selectedAccess, permissionId]);
    } else {
      setSelectedAccess(selectedAccess.filter((id) => id !== permissionId));
    }
  };

  const handleUpdateAgent = async (userId?: number) => {
    if (!userId) return;
    setSaveLoading(true);

    const payload = {
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      roles: selectedRoles,
      permissions: {}, // optional, backend will handle default
    };

    try {
      const response = await updateUser(payload);
      await getAllUsers();
      if (userId === yourUserId)
        setUserData({ assignedRoles: response.data.assigned_roles });
      // Reset state
      setInviteModalOpen(false);
      setIsEditMode(false);
      setInviteEmail("");
      setSelectedRoles([]);
      setFirstName("");
      setLastName("");

      toast.success("Agent updated successfully!");
    } catch (error) {
      console.error("Failed to update agent:", error);
      toast.error("Update failed. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  // Watch for modal query params
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const hasCreateRole = params.has("createrole");
    const hasInvite = params.has("invite");

    // Handle Create Role modal
    if (hasCreateRole) {
      setCreateRoleModalOpen(true);
      params.delete("createrole");
    }

    // Handle Invite modal
    if (hasInvite) {
      if (!canAddUser) {
        // User limit reached — show toast and force-close modal
        toast.error(
          "You’ve reached your plan’s user limit. Upgrade to invite more agents."
        );
        setInviteModalOpen(false); //  ensure modal stays closed
      } else {
        // Allowed — open modal
        setInviteModalOpen(true);
      }
      params.delete("invite");
    }

    // Clean the URL after handling
    if (hasCreateRole || hasInvite) {
      const newPath = `${window.location.pathname}?${params.toString()}`;
      router.replace(newPath, { scroll: false });
    }
  }, [searchParams, canAddUser, router]);

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-1rem)] w-full overflow-hidden rounded-lg border-2 bg-background">
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loading areaOnly />
        </div>
      ) : (
        <>
          {/* Main Content */}
          <div className="flex flex-1 flex-col w-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 h-[60px] px-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Team</h2>
              </div>
              <div className="flex items-center gap-2">
                {!rightSidebarOpen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRightSidebarOpen(true)}
                    className="h-8 w-8">
                    <PanelRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 h-0">
              <div className="space-y-4">
                {/* Search and Actions */}
                <div className="px-4 pt-4 flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search agent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setRolesModalOpen(true)}
                      className="flex items-center gap-2">
                      Roles
                      <Settings className="h-4 w-4" />
                    </Button>

                    {/* onClick={() => setInviteModalOpen(true)} */}

                    <Button
                      onClick={() => {
                        if (!canAddUser) {
                          toast.error(
                            "You’ve reached your plan’s user limit. Upgrade to invite more agents."
                          );
                          return;
                        }
                        handleInviteAgentDialog();
                      }}
                      // disabled={!canAddUser}
                      className={cn(
                        "bg-sidebar-primary text-sidebar-primary-foreground",
                        !canAddUser && "opacity-50 cursor-not-allowed"
                      )}>
                      <Plus className="h-4 w-4 mr-2" />
                      Invite agents
                    </Button>
                  </div>
                </div>

                {/* Active Section */}
                <div className="space-y-3">
                  <h3 className="px-4 text-sm font-medium">
                    Active ({allTeamMembers.length})
                  </h3>

                  {/* Table Header */}
                  <div className="p-4 grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
                    <div className="col-span-5 flex items-center gap-2">
                      Name
                      <ChevronDown className="h-3 w-3" />
                    </div>
                    <div className="col-span-3">Role</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-1"></div>
                  </div>

                  {/* Team Members */}
                  {allTeamMembers
                    .filter((member) => {
                      const fullName =
                        `${member.first_name} ${member.last_name}`.toLowerCase();
                      const email = member.email.toLowerCase();
                      const search = searchQuery.toLowerCase();

                      return (
                        fullName.includes(search) ||
                        email.includes(search) ||
                        member.assigned_roles.some((role) =>
                          role.toLowerCase().includes(search)
                        )
                      );
                    })
                    .sort((a, b) => {
                      // Ensure current user always comes first
                      if (a.user_id === yourUserId) return -1;
                      if (b.user_id === yourUserId) return 1;
                      return 0;
                    })
                    .map((member) => (
                      <div
                        key={member.user_id}
                        className={cn(
                          "grid grid-cols-12 gap-4 px-4 py-3 cursor-pointer transition-colors",
                          selectedMember?.user_id === member.user_id
                            ? "bg-muted/50"
                            : "hover:bg-muted/30"
                        )}
                        onClick={() => setSelectedMember(member)}>
                        {/* User Info */}
                        <div className="col-span-5 flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {member.image_url ? (
                              <SecureImage
                                src={member.image_url}
                                alt={member.first_name}
                                className="aspect-square h-full w-full object-cover"
                              />
                            ) : (
                              <AvatarImage src="/placeholder.svg" />
                            )}
                            <AvatarFallback className="bg-sidebar-primary text-white">
                              {member.first_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {member.first_name + " " + member.last_name}{" "}
                              {member.user_id === yourUserId ? "(You)" : ""}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {member.email}
                            </div>
                          </div>
                        </div>

                        {/* Roles */}
                        <div className="col-span-3 flex flex-wrap gap-2 items-center">
                          {member.assigned_roles.map((role) => (
                            <Badge
                              key={role}
                              variant="secondary"
                              className="bg-gray-900 text-white">
                              {role}
                            </Badge>
                          ))}
                        </div>

                        {/* Status */}
                        <div className="col-span-3 flex items-center">
                          {member.is_email_confirmed ? (
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500"></div>
                              <span className="text-sm">Accepted</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-red-500"></div>
                              <span className="text-sm">Pending</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex items-center justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              {/* Edit Option */}
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setInviteEmail(member.email);
                                  setFirstName(member.first_name);
                                  setLastName(member.last_name);
                                  setSelectedRoles(member.assigned_roles);
                                  setIsEditMode(true);
                                  setInviteModalOpen(true);
                                }}>
                                <Settings className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>

                              {/* Delete Option */}
                              <DropdownMenuItem
                                disabled={
                                  member.user_id === yourUserId ||
                                  member.assigned_roles.some(
                                    (role) =>
                                      role.toLowerCase() === "superadmin"
                                  )
                                }
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setSelectedMember(member);
                                  setOpenConfirmationDialog(true);
                                }}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}

                  {/* AlertDialog rendered once outside the map */}
                  <AlertDialog
                    open={openConfirmationDialog}
                    onOpenChange={setOpenConfirmationDialog}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the user.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-white hover:bg-destructive/90"
                          onClick={() => {
                            if (selectedMember) {
                              handleUserDelete(
                                selectedMember.user_id,
                                selectedMember.email
                              );
                            }
                            setOpenConfirmationDialog(false);
                          }}>
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </ScrollArea>
          </div>
          {/* Right Sidebar */}
          <div
            className={cn(
              "flex flex-col border-l-2 bg-muted/30 transition-all duration-300 ease-in-out",
              rightSidebarOpen ? "w-80" : "w-0 overflow-hidden"
            )}>
            {rightSidebarOpen && selectedMember && (
              <>
                <div className="flex items-center justify-between border-b-2 h-[60px] px-4">
                  <h2 className="text-lg font-semibold">Details</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRightSidebarOpen(false)}
                    className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <ScrollArea className="flex-1 h-0">
                  <div className="p-4 space-y-6">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        {selectedMember.image_url ? (
                          <SecureImage
                            src={selectedMember.image_url}
                            alt={selectedMember.first_name}
                            className="aspect-square h-full w-full object-cover"
                          />
                        ) : (
                          <AvatarImage src="/placeholder.svg" />
                        )}
                        <AvatarFallback className="bg-sidebar-primary text-white text-lg">
                          {selectedMember.first_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {selectedMember.first_name +
                              " " +
                              selectedMember.last_name}{" "}
                          </h3>
                          <Badge
                            variant="secondary"
                            className="bg-gray-900 text-white text-xs">
                            {selectedMember.current_role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {selectedMember.assigned_roles.join(", ")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedMember.email}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Chat limit:
                        </span>
                        <span className="font-medium">
                          {0} concurrent chats
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Login status:
                        </span>
                        <span className="font-medium">
                          {selectedMember.is_email_confirmed
                            ? "Accepted"
                            : "Pending"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          Last seen:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {new Date(
                              selectedMember.last_active
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* <Collapsible
                      open={groupsExpanded}
                      onOpenChange={setGroupsExpanded}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                        <h4 className="font-medium">Groups (1)</h4>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            groupsExpanded && "rotate-90"
                          )}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2">
                        {["General"].map((group, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 py-1">
                            <div className="h-6 w-6 rounded bg-sidebar-primary flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                G
                              </span>
                            </div>
                            <span className="text-sm">{group}</span>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible> */}

                    {/* <Collapsible
                      open={workingHoursExpanded}
                      onOpenChange={setWorkingHoursExpanded}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                        <h4 className="font-medium">Working hours</h4>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            workingHoursExpanded && "rotate-90"
                          )}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4">
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                          <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-medium">
                                Set working hours
                              </span>{" "}
                              to better manage staffing.
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Button variant="outline" size="sm">
                                Get feature
                              </Button>
                              <Button variant="ghost" size="sm">
                                Learn more
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible> */}

                    {/* <Collapsible
                      open={performanceExpanded}
                      onOpenChange={setPerformanceExpanded}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                        <h4 className="font-medium">Performance</h4>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            performanceExpanded && "rotate-90"
                          )}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MessageCircle className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Total chats</span>
                            </div>
                            <span className="font-medium text-sidebar-primary">
                              {0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Goals</span>
                            </div>
                            <span className="font-medium text-sidebar-primary">
                              {0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Chat satisfaction</span>
                            </div>
                            <span className="font-medium">{0}</span>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full">
                          View reports
                        </Button>
                      </CollapsibleContent>
                    </Collapsible> */}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
          {/* Invite Agent Modal */}
          <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {isEditMode ? (
                    <>
                      <Settings className="h-5 w-5" />
                      Edit Agent
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      Invite Agent
                    </>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode
                    ? "Update this team member's details and roles."
                    : "Send an invitation to a new team member. They'll receive an email with instructions to join."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={isEditMode} // disable email if editing
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="firstname">First Name</Label>
                  <Input
                    id="firtsname"
                    type=""
                    placeholder="Enter first name address"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastname">Last Name</Label>
                  <Input
                    id="lastname"
                    type=""
                    placeholder="Enter last name address"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="roles">Roles</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between">
                        {selectedRoles.length > 0
                          ? selectedRoles.join(", ")
                          : "Select roles"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2 space-y-1">
                      {!(
                        customRoles.length === 1 &&
                        customRoles[0].name.toLowerCase() === "superadmin"
                      ) ? (
                        customRoles
                          .filter(
                            (role) => role.name.toLowerCase() !== "superadmin"
                          ) // remove Super Admin
                          .map((role) => (
                            <div
                              key={role.name}
                              className={cn(
                                "flex items-center p-2 rounded-md cursor-pointer hover:bg-muted",
                                selectedRoles.includes(role.name) && "bg-muted"
                              )}
                              onClick={() => handleToggleRole(role.name)}>
                              <div className="mr-2">
                                {selectedRoles.includes(role.name) ? (
                                  <Check className="h-4 w-4 text-primary" />
                                ) : (
                                  <div className="h-4 w-4 border rounded-sm" />
                                )}
                              </div>
                              <span>{role.name}</span>
                            </div>
                          ))
                      ) : (
                        <div className={cn("flex items-center p-2 rounded-md")}>
                          No roles available
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setInviteModalOpen(false);
                    setIsEditMode(false);
                    setInviteEmail("");
                    setSelectedRoles([]);
                    setFirstName("");
                    setLastName("");
                    router.back();
                  }}>
                  Cancel
                </Button>
                {isEditMode ? (
                  <Button
                    disabled={saveLoading}
                    onClick={() => handleUpdateAgent(selectedMember?.user_id)}>
                    {saveLoading ? "Saving..." : "Save Changes"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleInviteAgent}
                    disabled={
                      !inviteEmail || !selectedRoles.length || saveLoading
                    }>
                    {saveLoading ? "Sending..." : "Send Invitation"}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Create Role Modal */}
          <Dialog
            open={createRoleModalOpen}
            onOpenChange={setCreateRoleModalOpen}>
            <DialogContent className="sm:max-w-5xl max-w-[90vw] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {isEditRoleMode ? "Edit Role" : "Create New Role"}
                </DialogTitle>
                <DialogDescription>
                  {isEditRoleMode
                    ? "Update the role name and permissions for your team members."
                    : "Create a custom role with specific permissions for your team members."}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {/* Role name */}
                <div className="grid gap-2">
                  <Label htmlFor="roleName">Role name</Label>
                  <Input
                    id="roleName"
                    placeholder="Enter role name"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                  />
                </div>

                {/* Access section */}
                <div className="grid gap-3">
                  <Label>Access</Label>

                  {/*  Added grid layout (2x2) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {availableAccess.map((access) => (
                      <div
                        key={access.id}
                        className="flex items-start space-x-3">
                        <Checkbox
                          id={access.id}
                          checked={selectedAccess.includes(access.id)}
                          onCheckedChange={(checked) =>
                            handleAccessChange(access.id, checked as boolean)
                          }
                          disabled={access.id === "access_dashboard"} // mandatory
                        />

                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor={access.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {access.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {access.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateRoleModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRole}
                  disabled={
                    !newRoleName || selectedAccess.length === 0 || saveLoading
                  }>
                  {saveLoading
                    ? isEditRoleMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditRoleMode
                      ? "Update Role"
                      : "Create Role"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Roles Modal */}
          <Dialog open={rolesModalOpen} onOpenChange={setRolesModalOpen}>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Roles</DialogTitle>
                <DialogDescription>
                  Manage roles and permissions for your team
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-4">
                {customRoles.map((role) => {
                  const isProtected = role.name.toLowerCase() === "superadmin"; // protect Super Admin

                  return (
                    <div
                      key={role.name}
                      className="flex justify-between items-center p-2 rounded-md border hover:bg-muted">
                      <span>{role.name}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditRole(role)}
                          disabled={isProtected} // disable Edit button for Super Admin
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRoleDelete(role.name)}
                          disabled={isProtected} // disable Remove button for Super Admin
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <DialogFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setRolesModalOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    // setRolesModalOpen(false);
                    setCreateRoleModalOpen(true); // open Create Role modal
                  }}>
                  Create Role
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
