"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Pencil } from "lucide-react";
import { FileViewerModal } from "@/components/Common/FileViewerModal/FileViewerModal";
import {
  getUserProfileDetials,
  updateUserProfileDetials,
  changePasswordFromProfile,
} from "@/services/profile/profileServices";
import { uploadFileAndGetFullUrl } from "@/services/fileUploadService";
import Loading from "@/app/loading";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";

const Profile = () => {
  const [editOpen, setEditOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  // Profile info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [compantEmail, setCompanyEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [contact, setContact] = useState("");
  const [location, setLocation] = useState("");
  const [joinedDate, setJoinedDate] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Password states
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const router = useRouter();
  const role = Cookies.get("currentRole");

  // Profile update state
  const [profileUpdating, setProfileUpdating] = useState(false);

  // Image upload + preview
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile details on mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const response: any = await getUserProfileDetials();
        if (response) {
          const user = response;
          setFirstName(user.first_name || "");
          setLastName(user.last_name || "");
          setEmail(user.email || "");
          setOrgName(user.organization_name || "");
          setCompanyEmail(user.company_email || "");
          setContact(user.contact || "");
          setLocation(user.location || "");
          setJoinedDate(user.created_at || "");
          setProfileImage(user.image_url || null);
        }
      } catch (error) {
        console.error("Failed to fetch profile details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleProfileUpdate = async () => {
    try {
      setProfileUpdating(true);
      await updateUserProfileDetials(
        location,
        profileImage || "",
        firstName,
        lastName,
        contact
      );
      toast.success("Profile updated");
      setEditOpen(false);
    } catch (error) {
      toast.error("Profile update failed");
      console.error("Update profile failed", error);
    } finally {
      setProfileUpdating(false);
    }
  };

  // Handle image upload directly
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const result = await uploadFileAndGetFullUrl(file);
      const fileUrl = result?.fileUrl || result?.url;
      if (!fileUrl) throw new Error("File upload failed, no URL returned");

      setProfileImage(fileUrl);
      setSelectedFile({ url: fileUrl, name: file.name, type: file.type });

      await updateUserProfileDetials(
        location,
        fileUrl,
        firstName,
        lastName,
        contact
      );
      toast.success("Profile image uploaded");
    } catch (err) {
      toast.error("Profile upload failed");
      console.error("File upload failed:", err);
    } finally {
      setUploading(false);
      e.target.value = ""; // reset input
    }
  };

  // Preview modal
  const handlePreview = () => {
    if (profileImage) {
      setSelectedFile({
        url: profileImage,
        name: `${firstName}_${lastName}`,
        type: "image",
      });
      setIsModalOpen(true);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async () => {
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }
    if (oldPassword === newPassword) {
      setPasswordError("New password cannot be the same as old password.");
      return;
    }

    try {
      setPasswordUpdating(true);
      await changePasswordFromProfile(oldPassword, newPassword);

      // Reset form after success
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setChangePasswordOpen(false);
      toast.success("Password updated");
    } catch (error) {
      setPasswordError("Failed to update password. Please try again.");
    } finally {
      setPasswordUpdating(false);
    }
  };

  if (loading) {
    return <Loading />; // show loading until data is fetched
  }
  return (
    <div className="flex h-[calc(100vh-var(--header-height)-1rem)] w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-1 flex-col w-full mt-8">
        <ScrollArea className="flex-1 h-0">
          <div className="flex flex-col items-center justify-start p-6">
            <div className="flex w-full max-w-5xl flex-col gap-10">
              {/* Top Profile Card */}
              <div className="flex flex-wrap justify-between items-center">
                <div className="flex items-center gap-6">
                  {/* Profile Image with overlay */}
                  <div className="relative">
                    <div
                      className="w-48 h-48 flex items-center justify-center rounded-full bg-[#1a2753] text-white text-3xl font-bold overflow-hidden cursor-pointer"
                      onClick={handlePreview}>
                      {profileImage ? (
                        <Image
                          src={profileImage}
                          alt="Profile"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        (firstName[0] || "") + (lastName[0] || "")
                      )}
                    </div>

                    {/* Edit Icon Overlay */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-1 right-1 bg-white p-1 rounded-full shadow-md hover:bg-gray-100"
                      disabled={uploading}>
                      <Pencil className="w-6 h-6 text-gray-700" />
                    </button>

                    {/* Hidden File Input */}
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleUploadImage}
                      className="hidden"
                    />
                  </div>

                  <div className="flex flex-col">
                    <p className="text-xl font-semibold text-primary">
                      {firstName + " " + lastName}
                    </p>
                    <p className="text-muted-foreground">
                      Joined at{" "}
                      {joinedDate
                        ? new Date(joinedDate).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setEditOpen(true)}>
                  Edit Profile
                </Button>
              </div>

              {/* Personal Info */}
              <section>
                <h2 className="text-base font-semibold pb-3">
                  Personal Information
                </h2>
                <div className="border-t py-4 grid grid-cols-[120px_1fr] gap-y-3 text-sm">
                  <span className="text-muted-foreground">Full Name</span>
                  <span>{firstName + " " + lastName}</span>

                  <span className="text-muted-foreground">Organization</span>
                  <span>{orgName}</span>
                  <span className="text-muted-foreground">Email</span>
                  <span>{email}</span>
                  <span className="text-muted-foreground">Company Email</span>
                  <span>{compantEmail}</span>

                  <span className="text-muted-foreground">Contact</span>
                  <span>{contact}</span>

                  <span className="text-muted-foreground">Location</span>
                  <span>{location}</span>
                </div>
              </section>

              {/* Account Settings */}
              <section>
                <h2 className="text-base font-semibold pb-3">
                  Account settings
                </h2>
                <div className="border-t text-sm">
                  <div className="flex items-center justify-between py-4">
                    <p className="text-muted-foreground">
                      Change your password
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setChangePasswordOpen(true)}>
                      Change
                    </Button>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <p className="text-muted-foreground">
                      Manage your email preferences
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/${role}/settings/accounts`)}>
                      Manage
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* File Preview Modal */}
      {selectedFile && (
        <FileViewerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          fileUrl={selectedFile.url}
          fileName={selectedFile.name}
          fileType={selectedFile.type}
        />
      )}

      {/* Edit Profile Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        {editOpen && (
          <div className="fixed inset-0 z-10 bg-black/10 backdrop-blur-[3px]" />
        )}
        <DialogContent
          className="max-w-lg bg-card backdrop-blur-md"
          style={{ minHeight: "600px", zIndex: 50 }}>
          <div className="pb-2 mt-8">
            <h2 className="text-xl font-semibold ">Edit profile</h2>
            <hr className="my-3" />
          </div>
          <div style={{ display: "none" }}>
            <Label asChild>
              <DialogTitle className="text-xl font-bold">
                Edit profile
              </DialogTitle>
            </Label>
          </div>
          <form className="space-y-6">
            <div>
              <Label className="mb-3 block font-normal">Enter First Name</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter First Name"
              />
            </div>
            <div>
              <Label className="mb-3 block font-normal">Enter Last Name</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter Last Name"
              />
            </div>
            <div>
              <Label className="mb-3 block font-normal">Enter your email</Label>
              <Input disabled value={email} placeholder="Enter your email" />
            </div>
            <div>
              <Label className="mb-3 font-normal block">
                Enter your Contact
              </Label>
              <Input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Enter your Contact"
              />
            </div>
            <div>
              <Label className="mb-3 block font-normal">
                Enter your location
              </Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter your location"
              />
            </div>
            <div className="flex justify-end gap-4 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditOpen(false)}
                type="button">
                Cancel
              </Button>
              <Button
                className="bg-[#1a2753] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={profileUpdating}
                onClick={handleProfileUpdate}
                type="button">
                {profileUpdating ? "Saving..." : "Confirm"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        {changePasswordOpen && (
          <div className="fixed inset-0 z-10 bg-black/10 backdrop-blur-[3px]" />
        )}
        <DialogContent
          className="max-w-lg bg-card rounded-lg shadow-lg"
          style={{
            minHeight: "600px",
            zIndex: 50,
            paddingTop: "30px",
            paddingBottom: "40px",
          }}>
          <div style={{ paddingBottom: "10px" }}>
            <DialogTitle className="text-xl font-bold mt-4">
              Change password
            </DialogTitle>
            <hr className="my-4" />
          </div>
          <form className="space-y-8 px-2">
            {/* Email */}
            <div>
              <Label className="mb-2 block font-normal">Enter your email</Label>
              <Input
                disabled
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                type="email"
                className="w-full"
                style={{ height: "40px" }}
              />
            </div>

            {/* Old Password */}
            <div>
              <Label className="mb-2 block font-normal">
                Enter your old password
              </Label>
              <div className="relative">
                <Input
                  id="oldPassword"
                  name="oldPassword"
                  placeholder="Enter your old password"
                  type={showOld ? "text" : "password"}
                  autoComplete="current-password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                  {showOld ? (
                    <EyeOff className="w-5 h-5 text-gray-700" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-700" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <Label className="mb-2 block font-normal">
                Enter your new password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  placeholder="Enter your new password"
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                  {showNew ? (
                    <EyeOff className="w-5 h-5 text-gray-700" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-700" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <Label className="mb-2 block font-normal">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                  {showConfirm ? (
                    <EyeOff className="w-5 h-5 text-gray-700" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-700" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {passwordError && (
              <p className="text-red-500 text-sm">{passwordError}</p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-8">
              <Button
                variant="outline"
                onClick={() => setChangePasswordOpen(false)}
                type="button"
                className="w-[120px] h-[44px] border rounded-lg">
                Cancel
              </Button>
              <Button
                className="w-[120px] h-[44px] bg-[#1a2753] text-white rounded-lg shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={passwordUpdating}
                onClick={handlePasswordUpdate}
                type="button">
                {passwordUpdating ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;

// "use client";
// import { Button } from "@/components/ui/button";

// export default function Profile() {
//   return (
//     <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
//       <div className="flex flex-col items-center justify-start p-6">
//         {/* Header */}
//         <div className="flex items-center gap-4 w-full max-w-5xl">
//           <div
//             className="rounded-full bg-cover bg-center aspect-square size-10"
//             style={{
//               backgroundImage:
//                 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDNY50tS88zaAwtIvXhTY4WAITRa1dme3Zxl50P-8xce0ElbSXZYtIPPxAaqoerLnan71Oaq0slrErwAbX4bPixy4rjfjCXDLdziGhr527sH5dpNjg8rsVBPaUJIrny45RIlSG89Teo1zsaPHUXpE0KomfU0xYi2jC2lzjTYgvQb6Gy_5WfGYxDKzGSFpamLCbIoaahpuOiUnHHGpoAU0plwMluZdRS6Td0Bsemf7OADDLbyESkVyTOZMoKIPJ_a2Ml-8VdQ68TwCM")',
//             }}
//           />
//           <h1 className="text-lg font-medium text-primary">RhinoTech</h1>
//         </div>

//         {/* Profile Section */}
//         <div className="flex w-full max-w-5xl flex-col gap-6 py-6">
//           <div className="flex flex-wrap justify-between items-center">
//             <div className="flex items-center gap-4">
//               <div
//                 className="w-32 min-h-32 rounded-full bg-cover bg-center"
//                 style={{
//                   backgroundImage:
//                     'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB1RrSlYtu-3PBeIgiJ-CZiv2_4ULKeo9SjVqcp0VaJgIzqGteT2Anoei1tP3IVwyoaZJ9t9L5uRu4jOd0V4CYxeL8oXzfwXXIqe_zoflB8Sz8iUTcD7CGm3P5aPbTM04QB_8aplut7EkAgtYRiH3_9wEM8iGnjV6GSfl9Aw5Q8YA4-klJqr17ua1mFM5TYlGLcVAfHmkhrgPPuD5vm9pllSpNeRn9PLfwiLwGvyeUXJT8_7L6ZcsIdSbi3yunPG_CR9M8zU-TmPR0")',
//                 }}
//               />
//               <div className="flex flex-col">
//                 <p className="text-2xl font-bold tracking-tight text-primary">
//                   Sophia Carter
//                 </p>
//                 <p className="text-muted-foreground">Product Manager</p>
//                 <p className="text-muted-foreground">Joined 2021</p>
//               </div>
//             </div>
//             <Button variant="outline">Edit Profile</Button>
//           </div>

//           {/* Personal Info */}
//           <section>
//             <h2 className="text-xl font-bold px-1 pb-3 pt-5">
//               Personal Information
//             </h2>
//             <div className="grid grid-cols-[30%_1fr] gap-x-6 border-t border-border py-5">
//               <span className="text-muted-foreground">Full Name</span>
//               <span>Sophia Carter</span>
//               <span className="text-muted-foreground">Email</span>
//               <span>sophia.carter@example.com</span>
//               <span className="text-muted-foreground">Phone</span>
//               <span>+1 (555) 123-4567</span>
//               <span className="text-muted-foreground">Location</span>
//               <span>San Francisco, CA</span>
//             </div>
//           </section>

//           {/* Account Settings */}
//           <section>
//             <h2 className="text-xl font-bold px-1 pb-3 pt-5">
//               Account Settings
//             </h2>
//             <div className="flex items-center justify-between border-b border-border py-4">
//               <div>
//                 <p className="font-medium">Password</p>
//                 <p className="text-sm text-muted-foreground">
//                   Change your password
//                 </p>
//               </div>
//               <Button variant="outline">Change</Button>
//             </div>
//             <div className="flex items-center justify-between py-4">
//               <div>
//                 <p className="font-medium">Email Preferences</p>
//                 <p className="text-sm text-muted-foreground">
//                   Manage your email preferences
//                 </p>
//               </div>
//               <Button variant="outline">Manage</Button>
//             </div>
//           </section>

//           {/* Activity Overview */}
//           <section>
//             <h2 className="text-xl font-bold px-1 pb-3 pt-5">
//               Activity Overview
//             </h2>
//             <div className="flex flex-wrap gap-4">
//               {[
//                 { label: "Projects", value: 12 },
//                 { label: "Tasks", value: 45 },
//                 { label: "Completed", value: 30 },
//               ].map((item) => (
//                 <div
//                   key={item.label}
//                   className="flex-1 min-w-[150px] rounded-lg border border-border p-4"
//                 >
//                   <p className="text-sm font-medium">{item.label}</p>
//                   <p className="text-2xl font-bold">{item.value}</p>
//                 </div>
//               ))}
//             </div>
//           </section>
//         </div>
//       </div>
//     </div>
//   );
// }
