"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, getFileIcon, formatFileSize } from "@/lib/utils";
import { CourseService } from "@/services/course";
import { FileService } from "@/services/file";
import { CreateCourse, File } from "@/services/course/type";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  Upload,
  X,
  Loader2,
  BookOpen,
  Plus,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const createCourseSchema = z.object({
  title: z.string().min(1, "Course title is required"),
  desc: z.string().min(1, "Course description is required"),
});

type CreateCourseForm = z.infer<typeof createCourseSchema>;

export default function CreateCoursePage() {
  const router = useRouter();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [courseFiles, setCourseFiles] = useState<File[]>([]);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const courseService = useMemo(() => new CourseService(), []);
  const fileService = useMemo(() => new FileService(), []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCourseForm>({
    resolver: zodResolver(createCourseSchema),
  });

  const { mutate: createCourse, isPending: isCreating } = useMutation({
    mutationFn: (data: CreateCourse) => courseService.create(data),
    onSuccess: () => {
      toast.success("Course created successfully!");
      reset();
      setCoverFile(null);
      setCourseFiles([]);
      router.push("/courses");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create course");
    },
  });

  const onDrop = useCallback(
    async (acceptedFiles: globalThis.File[], fileType: "cover" | "files") => {
      if (fileType === "cover") {
        if (acceptedFiles.length > 1) {
          toast.error("Please select only one cover image");
          return;
        }
        setIsUploadingCover(true);
        try {
          const uploadedFile = await fileService.upload(acceptedFiles[0]);
          setCoverFile({
            url: uploadedFile.url,
            name: uploadedFile.name,
            mimeType: uploadedFile.mimeType,
            size: uploadedFile.size,
          });
          toast.success("Cover image uploaded successfully");
        } catch (error) {
          toast.error("Failed to upload cover image");
        } finally {
          setIsUploadingCover(false);
        }
      } else {
        setIsUploadingFiles(true);
        try {
          const uploadPromises = acceptedFiles.map((file) =>
            fileService.upload(file)
          );
          const uploadedFiles = await Promise.all(uploadPromises);
          const newFiles = uploadedFiles.map((file) => ({
            url: file.url,
            name: file.name,
            mimeType: file.mimeType,
            size: file.size,
          }));
          setCourseFiles((prev) => [...prev, ...newFiles]);
          toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
        } catch (error) {
          toast.error("Failed to upload files");
        } finally {
          setIsUploadingFiles(false);
        }
      }
    },
    [fileService]
  );

  const {
    getRootProps: getCoverRootProps,
    getInputProps: getCoverInputProps,
    isDragActive: isCoverDragActive,
  } = useDropzone({
    onDrop: (files: globalThis.File[]) => onDrop(files, "cover"),
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    multiple: false,
  });

  const {
    getRootProps: getFilesRootProps,
    getInputProps: getFilesInputProps,
    isDragActive: isFilesDragActive,
  } = useDropzone({
    onDrop: (files: globalThis.File[]) => onDrop(files, "files"),
    multiple: true,
  });

  const removeCoverFile = () => {
    setCoverFile(null);
  };

  const removeCourseFile = (index: number) => {
    setCourseFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: CreateCourseForm) => {
    if (!coverFile) {
      toast.error("Please upload a cover image");
      return;
    }
    if (courseFiles.length === 0) {
      toast.error("Please upload at least one course file");
      return;
    }

    createCourse({
      title: data.title,
      desc: data.desc,
      cover: coverFile,
      files: courseFiles,
    });
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Create Course</h1>
                <p className="text-white/70">
                  Create a new course with materials and resources
                </p>
              </div>
            </div>
            <Button asChild variant="ghost" className="text-white hover:bg-white/10">
              <Link href="/courses">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Courses
              </Link>
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Course Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Course Title
                </label>
                <Input
                  {...register("title")}
                  placeholder="Enter course title"
                  className={cn(
                    "glass-input",
                    errors.title && "border-red-500 focus:border-red-500"
                  )}
                />
                {errors.title && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Course Description
                </label>
                <Textarea
                  {...register("desc")}
                  placeholder="Enter course description"
                  rows={4}
                  className={cn(
                    "glass-input resize-none",
                    errors.desc && "border-red-500 focus:border-red-500"
                  )}
                />
                {errors.desc && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.desc.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Cover Image
            </h2>
            {coverFile ? (
              <div className="relative">
                <div className="glass-card rounded-xl p-4 border-dashed border-2 border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                        {(() => {
                          const IconComponent = getFileIcon("image/");
                          return <IconComponent className="w-5 h-5 text-white" />;
                        })()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{coverFile.name}</p>
                        <p className="text-white/60 text-sm">
                          {formatFileSize(coverFile.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeCoverFile}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                {...getCoverRootProps()}
                className={cn(
                  "glass-card rounded-xl p-8 border-dashed border-2 border-white/20 cursor-pointer transition-all duration-200 hover:border-white/40 hover:bg-white/5",
                  isCoverDragActive && "border-purple-500 bg-purple-500/10"
                )}
              >
                <input {...getCoverInputProps()} />
                <div className="text-center">
                  {isUploadingCover ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-8 h-8 animate-spin text-white mb-4" />
                      <p className="text-white">Uploading cover image...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-white/60 mb-4" />
                      <p className="text-white mb-2">
                        Drag and drop a cover image, or click to select
                      </p>
                      <p className="text-white/60 text-sm">
                        PNG, JPG, GIF up to 50MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Course Files */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Course Materials
            </h2>

            {/* Upload Area */}
            <div
              {...getFilesRootProps()}
              className={cn(
                "glass-card rounded-xl p-8 border-dashed border-2 border-white/20 cursor-pointer transition-all duration-200 hover:border-white/40 hover:bg-white/5 mb-4",
                isFilesDragActive && "border-purple-500 bg-purple-500/10"
              )}
            >
              <input {...getFilesInputProps()} />
              <div className="text-center">
                {isUploadingFiles ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white mb-4" />
                    <p className="text-white">Uploading files...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Plus className="w-8 h-8 text-white/60 mb-4" />
                    <p className="text-white mb-2">
                      Drag and drop course files, or click to select
                    </p>
                    <p className="text-white/60 text-sm">
                      Any file type up to 50MB each
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Uploaded Files List */}
            {courseFiles.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-white">
                  Uploaded Files ({courseFiles.length})
                </h3>
                {courseFiles.map((file, index) => {
                  const IconComponent = getFileIcon(file.mimeType);
                  return (
                    <div
                      key={index}
                      className="glass-card rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{file.name}</p>
                            <p className="text-white/60 text-sm">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCourseFile(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button asChild type="button" variant="ghost" className="text-white hover:bg-white/10">
              <Link href="/courses">
                Cancel
              </Link>
            </Button>
            <Button
              type="submit"
              disabled={isCreating || isUploadingCover || isUploadingFiles}
              className="glass-button cursor-pointer"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating Course...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Create Course
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 