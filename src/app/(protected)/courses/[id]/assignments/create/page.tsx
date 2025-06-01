"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { AssignmentService } from "@/services/assignment";
import { FileService } from "@/services/file";
import type { CreateAssignment } from "@/services/assignment/type";
import useAppStore from "@/state";
import { routes } from "@/data/routes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Upload,
  X,
  ClipboardList,
  Loader2,
  Plus,
  File,
  FileText,
  Send,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CreateAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAppStore();
  const queryClient = useQueryClient();
  const courseId = params.id as string;
  
  const assignmentService = new AssignmentService();
  const fileService = new FileService();

  // Form state
  const [formData, setFormData] = useState<CreateAssignment>({
    title: "",
    description: "",
    course: courseId,
    dueDate: new Date(),
    isGroupProject: false,
    maxGroupSize: 4,
    instructions: "",
    attachments: [],
    status: "draft",
  });

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { mutate: createAssignment, isPending } = useMutation({
    mutationFn: (data: CreateAssignment) => assignmentService.create(data),
    onSuccess: (assignment) => {
      toast.success("Assignment created successfully!");
      queryClient.invalidateQueries({ queryKey: ["assignments", courseId] });
      router.push(routes.assignmentDetails(courseId, assignment!._id));
    },
    onError: (error: any) => {
      console.error("Assignment creation error:", error);
      const errorMessage = error?.response?.data?.message || error.message || "Failed to create assignment";
      toast.error(errorMessage);
    },
  });

  const handleInputChange = (field: keyof CreateAssignment, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map((file) => fileService.upload(file));
      const uploadedFileObjects = await Promise.all(uploadPromises);
      
      const newFiles = uploadedFileObjects.map((fileObj) => ({
        _id: fileObj.id, // Keep for display purposes
        name: fileObj.name,
        url: fileObj.url,
        mimeType: fileObj.mimeType,
        size: fileObj.size,
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);
      setFormData((prev) => ({
        ...prev,
        // Store File objects directly, similar to courses
        attachments: [...(prev.attachments || []), ...uploadedFileObjects.map(file => ({
          url: file.url,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size,
        }))],
      }));

      toast.success(`${files.length} file(s) uploaded successfully!`);
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f._id !== fileId));
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments?.filter((file) => {
        // Since attachments are now File objects, we need to compare by URL or other unique property
        // For uploaded files, we can use the URL as unique identifier
        return !uploadedFiles.some(uploadedFile => 
          uploadedFile._id === fileId && uploadedFile.url === file.url
        );
      }) || [],
    }));
  };

  const handleSubmit = (status: "draft" | "published") => {
    if (!formData.title.trim()) {
      toast.error("Please enter an assignment title");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Please enter an assignment description");
      return;
    }

    // Ensure attachments is properly formatted as an array of File objects
    const attachments = Array.isArray(formData.attachments) 
      ? formData.attachments.filter(file => file && file.url && file.name) 
      : [];

    const submissionData = {
      ...formData,
      status,
      dueDate: formData.dueDate instanceof Date ? formData.dueDate.toISOString() : formData.dueDate,
      attachments,
    };
    
    createAssignment(submissionData);
  };

  // Check if user can create assignments
  if (user?.role !== "instructor" && user?.role !== "admin") {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-white/60 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Access Denied</h3>
              <p className="text-white/70 mb-4">
                You don&apos;t have permission to create assignments.
              </p>
              <Link href={routes.courseAssignments(courseId)}>
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Assignments
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href={routes.courseAssignments(courseId)}>
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Assignments
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Page Title */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Create Assignment</h1>
              <p className="text-white/70 mt-1">Add a new assignment for your course</p>
            </div>
          </div>
        </div>

        {/* Assignment Form */}
        <div className="glass-card rounded-2xl p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold glass-text">Basic Information</h2>
              
              <div>
                <Label htmlFor="title" className="text-sm font-medium glass-text cursor-default">
                  Assignment Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter assignment title"
                  className="glass-input h-12 rounded-xl border-0 mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium glass-text cursor-default">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Provide a brief description of the assignment"
                  rows={3}
                  className="glass-input rounded-xl border-0 mt-2 resize-none"
                />
              </div>

              <div>
                <Label htmlFor="instructions" className="text-sm font-medium glass-text cursor-default">
                  Instructions (Optional)
                </Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => handleInputChange("instructions", e.target.value)}
                  placeholder="Detailed instructions for completing the assignment"
                  rows={5}
                  className="glass-input rounded-xl border-0 mt-2 resize-none"
                />
              </div>
            </div>

            {/* Assignment Settings */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold glass-text">Assignment Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDateTime" className="text-sm font-medium glass-text cursor-default">
                    Due Date & Time *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <div
                        className={cn(
                          "w-full h-12 glass-input rounded-xl border-0 glass-text text-left font-normal justify-start mt-2 flex items-center cursor-pointer",
                          !formData.dueDate && "glass-text-muted"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                        {formData.dueDate ? (
                          <span>{format(formData.dueDate as Date, "PPP 'at' p")}</span>
                        ) : (
                          <span className="glass-text-muted">Pick a date and time</span>
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 glass-select-content border-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dueDate as Date}
                        onSelect={(date) => {
                          if (date) {
                            // Preserve the current time when selecting a new date
                            const currentTime = formData.dueDate as Date;
                            if (currentTime) {
                              date.setHours(currentTime.getHours());
                              date.setMinutes(currentTime.getMinutes());
                            }
                            handleInputChange("dueDate", date);
                          }
                        }}
                        initialFocus
                      />
                      <div className="p-3 border-t border-white/10">
                        <Label className="text-sm font-medium glass-text">Time</Label>
                        <div className="flex items-center space-x-2 mt-2">
                          <Input
                            type="time"
                            value={formData.dueDate ? format(formData.dueDate as Date, "HH:mm") : ""}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':').map(Number);
                              const newDate = formData.dueDate ? new Date(formData.dueDate as Date) : new Date();
                              newDate.setHours(hours);
                              newDate.setMinutes(minutes);
                              handleInputChange("dueDate", newDate);
                            }}
                            className="flex-1 glass-input h-10 rounded-lg border-0"
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 glass-card rounded-xl">
                <div>
                  <Label htmlFor="groupProject" className="glass-text font-medium cursor-default">
                    Group Project
                  </Label>
                  <p className="glass-text-muted text-sm cursor-default">
                    Allow students to work in groups
                  </p>
                </div>
                <Switch
                  id="groupProject"
                  checked={formData.isGroupProject}
                  onCheckedChange={(checked) => handleInputChange("isGroupProject", checked)}
                />
              </div>

              {formData.isGroupProject && (
                <div>
                  <Label htmlFor="maxGroupSize" className="text-sm font-medium glass-text cursor-default">
                    Maximum Group Size
                  </Label>
                  <Select
                    value={formData.maxGroupSize?.toString()}
                    onValueChange={(value) => handleInputChange("maxGroupSize", parseInt(value))}
                  >
                    <SelectTrigger className="glass-input h-12 rounded-xl border-0 glass-text mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-select-content border-0">
                      {Array.from({ length: 8 }, (_, i) => i + 2).map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size} students
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* File Attachments */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold glass-text">Attachments</h2>
              
              {/* Upload Area */}
              <div className="glass-card rounded-xl p-8 border-dashed border-2 border-white/20 cursor-pointer transition-all duration-200 hover:border-white/40 hover:bg-white/5">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={isUploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-center">
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 animate-spin glass-text mb-4" />
                        <p className="glass-text">Uploading attachments...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 glass-text-subtle mb-4" />
                        <p className="glass-text mb-2">
                          Drag and drop files, or click to select
                        </p>
                        <p className="glass-text-muted text-sm">
                          Upload materials, rubrics, or other files for this assignment
                        </p>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file._id}
                      className="glass-card rounded-xl p-4 border-dashed border-2 border-white/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                            <File className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="glass-text font-medium">{file.name}</p>
                            <p className="glass-text-muted text-sm">
                              {(file.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file._id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={() => handleSubmit("draft")}
                disabled={isPending}
                className="text-white hover:bg-white/10"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSubmit("published")}
                disabled={isPending}
                className="glass-button cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Publish Assignment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 