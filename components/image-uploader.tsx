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

      // Dynamic import here to avoid SSR issues
      if (
        file.type === "image/heic" ||
        file.name.toLowerCase().endsWith(".heic") ||
        file.type === "image/heif"
      ) {
        const heic2any = (await import("heic2any")).default;
        const convertedBlob = await heic2any({
          blob: file,
          toType: "image/png",
        });
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
        setOutputImage(processedImageUrl);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-12 text-center">
        <input
          type="file"
          id="image-upload"
          className="hidden"
          accept="image/*,.heic"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        {!inputPreview ? (
          <div className="space-y-4">
            <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Drag and drop or click to upload
            </p>
            <Button
              variant="secondary"
              onClick={() => document.getElementById("image-upload")?.click()}
              disabled={isLoading}
            >
              Select Image
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-center gap-4 mb-4">
              {(["transparent", "white", "black", "gradient"] as const).map((bg) => (
                <Button
                  key={bg}
                  variant={bgOption === bg ? "default" : "outline"}
                  onClick={() => setBgOption(bg)}
                  disabled={isLoading}
                  className="capitalize"
                >
                  {bg}
                </Button>
              ))}
            </div>

            <div
              className="relative w-full aspect-video max-h-[300px] overflow-hidden rounded-lg border"
              style={{
                background:
                  bgOption === "white"
                    ? "#fff"
                    : bgOption === "black"
                    ? "#000"
                    : bgOption === "gradient"
                    ? "linear-gradient(135deg, #4ade80, #22d3ee)"
                    : "transparent",
              }}
            >
              <Image src={inputPreview} alt="Preview" fill className="object-contain" unoptimized />
            </div>

            <div className="flex justify-center gap-4 mt-4 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setInputImage(null);
                  setInputPreview(null);
                  setOutputImage(null);
                  setPaid(false);
                  localStorage.removeItem("outputImage");
                }}
                disabled={isLoading}
              >
                Drop
              </Button>
              <Button onClick={() => document.getElementById("image-upload")?.click()} disabled={isLoading}>
                Replace
              </Button>
            </div>
          </>
        )}
      </div>

      <Button className="w-full" onClick={processImage} disabled={!inputImage || isLoading}>
        {isLoading ? (
          <>
            <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Remove Background"
        )}
      </Button>

      {outputImage && (
        <Card className="p-4 mt-8">
          <h3 className="text-lg font-medium mb-4">Background Removed</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            HQ icon pack includes x4 new icons and x1 SVG
          </p>
          <br />

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 mb-6">
            {[32, 64, 180, 512].map((size) => (
              <div className="flex flex-col items-center" key={size}>
                <div
                  className="relative border rounded overflow-hidden bg-white"
                  style={{
                    width: 96,
                    height: 96,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    src={outputImage}
                    alt={`icon-${size}`}
                    width={size}
                    height={size}
                    className="object-contain max-w-full max-h-full"
                    unoptimized
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Image
                      src="/wind.svg"
                      alt="Watermark"
                      width={48}
                      height={48}
                      className="opacity-40"
                      unoptimized
                    />
                  </div>
                </div>
                <p className="text-xs mt-2 text-center text-slate-500">{`icon-${size}.png`}</p>
              </div>
            ))}
          </div>

          {!paid ? (
            <Button
              className="w-full mt-4 bg-green-700 hover:bg-indigo-600 text-white"
              onClick={handleStripePay}
              disabled={isLoading}
            >
              Purchase Premium Icons
            </Button>
          ) : (
            <Button className="w-full mt-4" onClick={downloadZipPack} disabled={isLoading}>
              Download Premium Pack
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
