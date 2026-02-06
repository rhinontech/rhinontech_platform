"use client";

import React, { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ReactCrop, {
  type Crop,
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { uploadFileAndGetFullUrl } from "@/services/fileUploadService";
import { Separator } from "@radix-ui/react-select";
import { useUserStore } from "@/utils/store";

interface ThemeSettings {
  selectedPage: string;
  isBgFade: boolean;
  primaryColor: string;
  secondaryColor: string;
  isBackgroundImage: boolean;
  backgroundImage: string;
  chatbotName: string;
  navigationOptions: string[];
  popupMessage: string;
  greetings: string[];
  primaryLogo: string;
  secondaryLogo: string;
  theme: 'light' | 'dark' | 'system';
}

interface CollapsibleSectionProps {
  themeSettings: ThemeSettings;
  setThemeSettings: React.Dispatch<React.SetStateAction<ThemeSettings>>;
}

export default function CollapsibleSection({
  themeSettings,
  setThemeSettings,
}: CollapsibleSectionProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  });
  const [imageToPreview, setImageToPreview] = useState<string>("");
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const curerntPlan = useUserStore((state) => state.userData.orgPlan);

  const [currentLogoType, setCurrentLogoType] = useState<
    "primaryLogo" | "secondaryLogo" | "backgroundImage"
  >("primaryLogo");

  const [isBackgroundImage, setIsBackgroundImage] = useState(
    themeSettings.isBackgroundImage
  );

  // const NAV_OPTIONS = ["Home", "Messages", "Help", "Voice", "News"];
  const currentPlan = useUserStore((state) => state.userData.orgPlan);

  const NAV_OPTIONS = currentPlan === "Free"
    ? ["Home", "Messages", "Help"] // Voice removed
    : ["Home", "Messages", "Help", "Voice"];

  const [uploading, setUploading] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const updateThemeSettings = (key: keyof ThemeSettings, value: any) => {
    setThemeSettings((prev) => {
      let selectedPage = prev.selectedPage;

      // Determine potential target page
      let newPage = selectedPage;

      switch (key) {
        case "chatbotName":
        case "secondaryColor":
          newPage = "Messages";
          break;

        case "primaryColor":
        case "isBgFade":
        case "isBackgroundImage":
        case "navigationOptions":
        case "backgroundImage":
        case "primaryLogo":
          newPage = "Home";
          break;

        case "secondaryLogo":
          newPage = "Help";
          break;

        case "greetings":
          newPage = "Home";
          break;

        default:
          newPage = selectedPage;
      }

      // Map "Messages" → "chats" for internal usage
      let internalPage = newPage === "Messages" ? "chats" : newPage;

      // Check against navigationOptions, which still uses "Messages"
      if (prev.navigationOptions?.includes(newPage)) {
        selectedPage = internalPage;
      }

      return { ...prev, [key]: value, selectedPage };
    });
  };

  const updateGreeting = (index: number, value: string) => {
    const newGreetings = [...themeSettings.greetings];
    newGreetings[index] = value;
    updateThemeSettings("greetings", newGreetings);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    logoType: "primaryLogo" | "secondaryLogo" | "backgroundImage"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageToPreview(ev.target?.result as string);
      setIsCropModalOpen(true);
      setCurrentLogoType(logoType);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Upload cropped file
  const handleUploadImage = async (
    file: File,
    logoType: "primaryLogo" | "secondaryLogo" | "backgroundImage"
  ) => {
    try {
      setUploading(true);

      const result = await uploadFileAndGetFullUrl(file);
      const fileUrl = result?.fileUrl || result?.url;
      if (!fileUrl) throw new Error("File upload failed, no URL returned");

      // update themeSettings with uploaded logo URL
      updateThemeSettings(logoType, fileUrl);
    } catch (err) {
      console.error("File upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  // Crop helper
  const getCroppedImage = (
    image: HTMLImageElement,
    canvas: HTMLCanvasElement,
    crop: { x: number; y: number; width: number; height: number }
  ): Promise<File | null> => {
    const ctx = canvas.getContext("2d");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    ctx?.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise<File | null>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "cropped-logo.png", {
            type: blob.type,
          });
          resolve(file);
        } else {
          resolve(null);
        }
      }, "image/png");
    });
  };

  // Finalize crop & upload
  const handleCropSave = async () => {
    if (!imgRef.current || !previewCanvasRef.current) return;

    const croppedFile = await getCroppedImage(
      imgRef.current,
      previewCanvasRef.current,
      convertToPixelCrop(crop, imgRef.current.width, imgRef.current.height)
    );
    console.log("before_triggered..");
    if (croppedFile) {
      console.log("triggered..");
      await handleUploadImage(croppedFile, currentLogoType);
    }

    setIsCropModalOpen(false);
    setImageToPreview("");
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const cropWidthInPercent = (150 / width) * 100;
    const newCrop = makeAspectCrop(
      { unit: "%", width: cropWidthInPercent },
      1,
      width,
      height
    );
    setCrop(centerCrop(newCrop, width, height));
  };

  return (
    <div className="space-y-8">
      {/* General Settings */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg font-semibold">
            Theme Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Background Fade Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Background Image</Label>
              <p className="text-xs text-muted-foreground">
                Enable gradient background effect
              </p>
            </div>
            <Switch
              checked={isBackgroundImage}
              onCheckedChange={(checked) => {
                setIsBackgroundImage(checked);
                updateThemeSettings("isBackgroundImage", checked);
              }}
            />
          </div>

          {isBackgroundImage && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Background Image</Label>
                <p className="text-xs text-muted-foreground">
                  Upload an image for your background
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted rounded-lg cursor-pointer hover:border-primary/50 transition-colors group">
                  <input
                    ref={fileInputRef}
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "backgroundImage")}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg
                      className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="text-sm text-muted-foreground">
                      Click to upload image
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PNG, JPG, WEBP up to 10MB
                    </span>
                  </div>
                </label>

                {/* Preview */}
                {themeSettings.backgroundImage && (
                  <div className="relative">
                    <img
                      src={themeSettings.backgroundImage}
                      alt="Background preview"
                      className="w-full h-32 object-cover rounded-lg border-2 border-muted"
                    />
                    <button
                      onClick={() =>
                        updateThemeSettings("backgroundImage", null)
                      }
                      className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Color Scheme</Label>
              <p className="text-xs text-muted-foreground">
                Customize your primary and secondary colors
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Primary Color */}
              <div className="space-y-3">
                <Label className="text-xs font-medium">Primary</Label>
                <label className="relative inline-flex flex-col items-center gap-2 cursor-pointer group">
                  <input
                    type="color"
                    value={themeSettings.primaryColor}
                    onChange={(e) =>
                      updateThemeSettings("primaryColor", e.target.value)
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-muted shadow-sm transition-all group-hover:scale-105 group-hover:shadow-md"
                      style={{ backgroundColor: themeSettings.primaryColor }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background" />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {themeSettings.primaryColor}
                  </span>
                </label>
              </div>

              {/* Secondary Color */}
              <div className="space-y-3">
                <Label className="text-xs font-medium">Secondary</Label>
                <label className="relative inline-flex flex-col items-center gap-2 cursor-pointer group">
                  <input
                    type="color"
                    value={themeSettings.secondaryColor}
                    onChange={(e) =>
                      updateThemeSettings("secondaryColor", e.target.value)
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-muted shadow-sm transition-all group-hover:scale-105 group-hover:shadow-md"
                      style={{
                        backgroundColor: themeSettings.secondaryColor,
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary rounded-full border-2 border-background" />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {themeSettings.secondaryColor}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Theme Mode</Label>
              <p className="text-xs text-muted-foreground">
                Select the color mode for your chatbot
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {['light', 'dark', 'system'].map((mode) => (
                <div
                  key={mode}
                  onClick={() => updateThemeSettings("theme", mode)}
                  className={`
                    cursor-pointer rounded-lg border-2 p-4 text-center capitalize transition-all hover:border-primary/50
                    ${themeSettings.theme === mode ? "border-primary bg-primary/5" : "border-muted bg-card"}
                  `}
                >
                  <span className="text-sm font-medium">{mode}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Background Fade Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Background Fade</Label>
              <p className="text-xs text-muted-foreground">
                Enable gradient background effect
              </p>
            </div>
            <Switch
              checked={themeSettings.isBgFade}
              onCheckedChange={(checked) =>
                updateThemeSettings("isBgFade", checked)
              }
            />
          </div>

          <Separator />

          {/* Chatbot Name */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Chatbot Identity</Label>
              <p className="text-xs text-muted-foreground">
                Set the display name for your chatbot
              </p>
            </div>
            <Input
              value={themeSettings.chatbotName}
              onChange={(e) =>
                updateThemeSettings("chatbotName", e.target.value)
              }
              placeholder="Enter chatbot name"
              className="transition-colors focus:border-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg font-semibold">Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Greeting Input */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Greeting</Label>
              <p className="text-xs text-muted-foreground">
                Set the initial greeting message
              </p>
            </div>
            <Input
              value={themeSettings.greetings[0]}
              onChange={(e) => updateGreeting(0, e.target.value)}
              placeholder="Enter greeting message"
              className="transition-colors focus:border-primary"
            />
          </div>

          <Separator />

          {/* Introduction Input */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Introduction</Label>
              <p className="text-xs text-muted-foreground">
                Set the introduction message
              </p>
            </div>
            <Input
              value={themeSettings.greetings[1]}
              onChange={(e) => updateGreeting(1, e.target.value)}
              placeholder="Enter introduction message"
              className="transition-colors focus:border-primary"
            />
          </div>

          {/* Popup Message (commented out but styled for consistency) */}
          {/* <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-sm font-medium">Popup Message</Label>
        <p className="text-xs text-muted-foreground">
          Set the popup message text
        </p>
      </div>
      <Textarea
        rows={3}
        value={themeSettings.popupMessage}
        onChange={(e) =>
          updateThemeSettings("popupMessage", e.target.value)
        }
        placeholder="Enter popup message"
        className="transition-colors focus:border-primary"
      />
    </div> */}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg font-semibold">
            Navigation Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Navigation Items</Label>
              <p className="text-xs text-muted-foreground">
                Select which navigation options to display
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {NAV_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-all hover:bg-accent/50 hover:border-muted-foreground/20 group">
                  <input
                    type="checkbox"
                    checked={themeSettings.navigationOptions.includes(option)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateThemeSettings("navigationOptions", [
                          ...themeSettings.navigationOptions,
                          option,
                        ]);
                      } else {
                        updateThemeSettings(
                          "navigationOptions",
                          themeSettings.navigationOptions.filter(
                            (o) => o !== option
                          )
                        );
                      }
                    }}
                    className="w-4 h-4 text-primary transition-colors focus:ring-primary focus:ring-2 focus:ring-offset-2 rounded"
                  />
                  <span className="text-sm font-medium group-hover:text-foreground/80">
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logos */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg font-semibold">Logos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Brand Logos</Label>
              <p className="text-xs text-muted-foreground">
                Upload primary and secondary logos for your chatbot
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Primary Logo */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Primary Logo</Label>
                  <Input
                    ref={fileInputRef}
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "primaryLogo")}
                    className="transition-colors focus:border-primary"
                  />
                  {uploading && (
                    <p className="text-xs text-muted-foreground">
                      Uploading...
                    </p>
                  )}
                </div>
                {themeSettings.primaryLogo && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-lg border-2 border-muted flex items-center justify-center bg-background overflow-hidden shadow-sm">
                      <img
                        src={themeSettings.primaryLogo}
                        alt="Primary Logo"
                        className="object-contain h-full"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Preview
                    </span>
                  </div>
                )}
              </div>

              {/* Secondary Logo */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Secondary Logo</Label>
                  <Input
                    ref={fileInputRef}
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "secondaryLogo")}
                    className="transition-colors focus:border-primary"
                  />
                  {uploading && (
                    <p className="text-xs text-muted-foreground">
                      Uploading...
                    </p>
                  )}
                </div>
                {themeSettings.secondaryLogo && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-lg border-2 border-muted flex items-center justify-center bg-background overflow-hidden shadow-sm">
                      <img
                        src={themeSettings.secondaryLogo}
                        alt="Secondary Logo"
                        className="object-contain h-full"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Preview
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crop Modal */}
      {isCropModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[2000]">
          <div className="bg-card p-6 rounded-xl shadow-lg w-[90%] max-w-md max-h-[90vh]  flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Crop Logo</h2>

            <div className="flex-1 relative overflow-auto">
              <ReactCrop crop={crop} onChange={(c) => setCrop(c)} aspect={1}>
                <img
                  ref={imgRef}
                  src={imageToPreview}
                  alt="Preview"
                  onLoad={onImageLoad}
                  className="max-w-full"
                />
              </ReactCrop>
              <canvas ref={previewCanvasRef} style={{ display: "none" }} />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsCropModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCropSave}>Crop & Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* <pre className="bg-gray-100 p-2 rounded text-xs">
        {JSON.stringify(themeSettings, null, 2)}
      </pre> */}
    </div>
  );
}
