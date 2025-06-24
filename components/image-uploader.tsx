"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadIcon, RefreshCwIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import JSZip from "jszip";
import { useSearchParams, useRouter } from "next/navigation";

export function ImageUploader() {
  const [isLoading, setIsLoading] = useState(false);
  const [inputImage, setInputImage] = useState<File | null>(null);
  const [inputPreview, setInputPreview] = useState<string | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [bgOption, setBgOption] = useState<"transparent" | "white" | "black" | "gradient">(
    "transparent"
  );
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const savedOutput = localStorage.getItem("outputImage");
    if (savedOutput) setOutputImage(savedOutput);
  }, []);

  useEffect(() => {
    if (outputImage) {
      localStorage.setItem("outputImage", outputImage);
    } else {
      localStorage.removeItem("outputImage");
    }
  }, [outputImage]);

  useEffect(() => {
    if (searchParams.get("paid") === "true" && outputImage) {
      setPaid(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("paid");
      router.replace(url.toString(), { scroll: false, shallow: true });
    }
  }, [searchParams, outputImage, router]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let imageBlob: Blob = file;

      if (
        file.type === "image/heic" ||
        file.name.toLowerCase().endsWith(".heic") ||
        file.type === "image/heif"
      ) {
        const heic2any = (await import("heic2any")).default;
        const convertedBlob = await heic2any({ blob: file, toType: "image/png" });
        imageBlob = convertedBlob as Blob;
      }

      const newFile = new File([imageBlob], file.name.replace(/\.[^/.]+$/, "") + ".png", {
        type: "image/png",
      });

      setInputImage(newFile);

      const reader = new FileReader();
      reader.onload = () => setInputPreview(reader.result as string);
      reader.readAsDataURL(imageBlob);

      setOutputImage(null);
      setPaid(false);
      localStorage.removeItem("outputImage");
    } catch (err) {
      console.error("Failed to convert HEIC image:", err);
      toast({
        title: "Unsupported file",
        description: "Please upload PNG, JPG, or HEIC images only.",
        variant: "destructive",
      });
      setInputImage(null);
      setInputPreview(null);
      setOutputImage(null);
      setPaid(false);
      localStorage.removeItem("outputImage");
    }
  };

  const applyWatermarkToImage = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(image, 0, 0);

        const watermark = new Image();
        watermark.src = "/wind.svg";
        watermark.crossOrigin = "anonymous";
        watermark.onload = () => {
          const wmSize = Math.min(image.width, image.height) * 0.25;
          ctx.globalAlpha = 0.4;
          ctx.drawImage(
            watermark,
            image.width / 2 - wmSize / 2,
            image.height / 2 - wmSize / 2,
            wmSize,
            wmSize
          );
          ctx.globalAlpha = 1.0;
          resolve(canvas.toDataURL("image/png"));
        };
      };
      image.src = imageUrl;
    });
  };

  const processImage = async () => {
    if (!inputImage) {
      toast({
        title: "No image selected",
        description: "Please select an image to process",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", inputImage);
      formData.append("endpoint", "/image");

      const response = await fetch("/api/process-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      const processedImageUrl =
        result?.data?.data?.[0]?.[0]?.url || result?.data?.data?.[0]?.[0]?.path;

      if (processedImageUrl) {
        const finalUrl = paid
          ? processedImageUrl
          : await applyWatermarkToImage(processedImageUrl);
        setOutputImage(finalUrl);
        toast({ title: "Background Removed!", description: "Premium Icon Pack Available" });
      } else {
        throw new Error(`No URL in response: ${JSON.stringify(result)}`);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Processing failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStripePay = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const { url } = await response.json();
      if (url) {
        if (outputImage) {
          localStorage.setItem("outputImage", outputImage);
        }
        window.location.href = url;
      } else {
        throw new Error("No Stripe URL returned");
      }
    } catch (err) {
      toast({
        title: "Payment error",
        description: "Redirect to Stripe failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadZipPack = async () => {
    if (!outputImage) return;

    setIsLoading(true);
    try {
      const sizes = [
        { size: 32, name: "favicon-32.png" },
        { size: 64, name: "icon-64.png" },
        { size: 180, name: "apple-touch-icon.png" },
        { size: 512, name: "icon-512.png" },
      ];

      const zip = new JSZip();

      const res = await fetch(outputImage);
      const blob = await res.blob();
      const bitmap = await createImageBitmap(blob);

      for (const { size, name } of sizes) {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(bitmap, 0, 0, size, size);
        const blobOut = await new Promise<Blob>((resolve) =>
          canvas.toBlob(resolve!, "image/png")
        );
        zip.file(name, blobOut);
      }

      const svgMarkup = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <image href="${outputImage}" width="512" height="512" />
</svg>`.trim();
      zip.file("icon.svg", svgMarkup);

      const premiumTxt = `
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="64x64" href="/icon-64.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png">
<link rel="icon" type="image/svg+xml" href="/icon.svg">
`.trim();
      zip.file("premium.txt", premiumTxt);

      const blobZip = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blobZip);
      const a = document.createElement("a");
      a.href = url;
      a.download = "premium-pack.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast({
        title: "ZIP error",
        description: "Could not create ZIP with SVG",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
}
